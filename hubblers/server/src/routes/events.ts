import { Router } from 'express'
import { z } from 'zod'
import { db } from '../firebase.js'
import { verifyFirebaseToken } from '../middleware/auth.js'
import { authorizeRoles } from '../middleware/roles.js'
import { isEventOver } from '../utils/eventDate.js'
import { createEventQrCode } from '../utils/qr.js'
import { sendEventRegistrationEmail } from '../services/emailService.js'
import { logActivity } from '../services/activityLogger.js'
import type { FirestoreEvent, UserEventRecord } from '../types.js'

const router = Router()

const registrationSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  degree: z.string().optional().default(''),
  branch: z.string().optional().default(''),
  year: z.string().optional().default(''),
  collegeName: z.string().optional().default(''),
  phone: z.string().optional().default(''),
})

const eventCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  longDescription: z.string().optional().default(''),
  location: z.string().min(1, 'Location is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().default(''),
  xpReward: z.number().int().min(0).optional().default(50),
})

function nowIso(): string {
  return new Date().toISOString()
}

function serializeEvent(doc: { id: string; data: () => Record<string, unknown> | undefined }) {
  const data = doc.data() ?? {}
  return {
    id: doc.id,
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    longDescription: String(data.longDescription ?? ''),
    location: String(data.location ?? ''),
    startDate: String(data.startDate ?? ''),
    endDate: String(data.endDate ?? ''),
    xpReward: Number(data.xpReward ?? 50),
    createdAt: String(data.createdAt ?? ''),
    organizerId: (data.organizerId as string | null) ?? undefined,
    organizerName: (data.organizerName as string | null) ?? undefined,
    collegeName: (data.collegeName as string | null) ?? undefined,
  }
}

// GET /api/events — list all events (public catalog)
router.get('/', async (_req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Firestore is not configured on the server.' })
    }
    const snapshot = await db.collection('events').orderBy('startDate', 'asc').get()
    const events = snapshot.docs.map(serializeEvent)
    return res.json(events)
  } catch (error) {
    console.error('[GET /api/events] failed:', error)
    return res.status(500).json({ error: 'Failed to fetch events', details: error instanceof Error ? error.message : String(error) })
  }
})

// POST /api/events — create event (organizer only)
router.post('/', verifyFirebaseToken, authorizeRoles('COLLEGE_ADMIN', 'ADMIN'), async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const parsed = eventCreateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    }
    const data = parsed.data

    if (!db) {
      return res.status(500).json({ error: 'Firestore is not configured on the server.' })
    }

    let organizerName = 'Organizer'
    let collegeName = ''
    const userDoc = await db.collection('users').doc(uid).get()
    if (userDoc.exists) {
      const uData = userDoc.data()
      organizerName = uData?.fullName ?? uData?.organizationName ?? 'Organizer'
      collegeName = uData?.collegeName ?? ''
    }

    const eventDocRef = db.collection('events').doc()
    const newEvent: FirestoreEvent = {
      title: data.title,
      description: data.description,
      longDescription: data.longDescription || data.description,
      location: data.location,
      startDate: data.startDate,
      endDate: data.endDate || data.startDate,
      xpReward: data.xpReward,
      createdAt: nowIso(),
      organizerId: uid,
      organizerName,
      collegeName,
    }

    await eventDocRef.set(newEvent)

    await logActivity({
      userId: uid,
      role: 'COLLEGE_ADMIN',
      type: 'EVENT_CREATE',
      description: `Created event "${data.title}"`,
      meta: { eventId: eventDocRef.id, title: data.title },
    })

    const createdDoc = await eventDocRef.get()
    return res.status(201).json({
      message: 'Event created successfully',
      event: serializeEvent(createdDoc),
    })
  } catch (error) {
    console.error('[POST /api/events] failed:', error)
    return res.status(500).json({
      error: 'Failed to create event',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

// GET /api/events/mine — events created by the authenticated organizer
// IMPORTANT: must be defined BEFORE /:id so it isn't matched as an event id
router.get('/mine', verifyFirebaseToken, authorizeRoles('COLLEGE_ADMIN', 'ADMIN'), async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    if (!db) {
      return res.status(500).json({ error: 'Firestore is not configured on the server.' })
    }

    const snapshot = await db.collection('events').where('organizerId', '==', uid).get()
    const userEventsSnap = await db.collection('userEvents').get()
    const regCountMap: Record<string, number> = {}

    for (const ueDoc of userEventsSnap.docs) {
      const records: UserEventRecord[] = ueDoc.data()?.registered ?? []
      for (const r of records) {
        regCountMap[r.eventId] = (regCountMap[r.eventId] ?? 0) + 1
      }
    }

    const events = snapshot.docs.map((doc) => {
      const ev = serializeEvent(doc)
      return {
        ...ev,
        registrationCount: regCountMap[doc.id] ?? 0,
      }
    })

    events.sort((a, b) => (String(b.createdAt ?? '')).localeCompare(String(a.createdAt ?? '')))
    return res.json(events)
  } catch (error) {
    console.error('[GET /api/events/mine] failed:', error)
    return res.status(500).json({
      error: 'Failed to fetch organizer events',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

// GET /api/events/registered — events the authenticated student registered for
// IMPORTANT: must be defined BEFORE /:id so it isn't matched as an event id
router.get('/registered', verifyFirebaseToken, authorizeRoles('STUDENT'), async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    if (!db) {
      return res.status(500).json({ error: 'Firestore is not configured on the server.' })
    }
    const userEventsRef = db.collection('userEvents').doc(uid)
    const userEventsDoc = await userEventsRef.get()
    const records: UserEventRecord[] = userEventsDoc.exists ? (userEventsDoc.data()?.registered ?? []) : []

    const events: Array<Record<string, unknown>> = []
    const cleanedRecords: UserEventRecord[] = []
    let cleaned = false

    for (const record of records) {
      const eventDoc = await db.collection('events').doc(record.eventId).get()
      if (!eventDoc.exists) continue
      const ev = serializeEvent(eventDoc)

      const eventOver = isEventOver(ev.endDate ?? ev.startDate ?? '')
      const cleanRecord: UserEventRecord = { ...record }
      if (eventOver && cleanRecord.qrCodeUrl) {
        delete cleanRecord.qrCodeUrl
        cleaned = true
      }
      cleanedRecords.push(cleanRecord)

      events.push({
        ...ev,
        registeredAt: record.registeredAt,
        qrCodeUrl: eventOver ? '' : (record.qrCodeUrl ?? ''),
        eventOver,
        registration: {
          name: record.name ?? '',
          email: record.email ?? '',
          degree: record.degree ?? '',
          branch: record.branch ?? '',
          year: record.year ?? '',
          collegeName: record.collegeName ?? '',
          phone: record.phone ?? '',
        },
      })
    }

    if (cleaned && userEventsDoc.exists) {
      try {
        await userEventsRef.set({ registered: cleanedRecords }, { merge: true })
      } catch (persistErr) {
        console.error('[GET /api/events/registered] failed to persist QR cleanup:', persistErr)
      }
    }

    events.sort((a, b) => (String(b.registeredAt ?? '')).localeCompare(String(a.registeredAt ?? '')))
    return res.json(events)
  } catch (error) {
    console.error('[GET /api/events/registered] failed:', error)
    return res.status(500).json({ error: 'Failed to fetch registered events', details: error instanceof Error ? error.message : String(error) })
  }
})

// GET /api/events/:id — single event detail
router.get('/:id', async (req, res) => {
  const eventId = String(req.params.id)
  if (!eventId) {
    return res.status(400).json({ error: 'Invalid event id' })
  }

  try {
    if (!db) {
      return res.status(500).json({ error: 'Firestore is not configured on the server.' })
    }
    const doc = await db.collection('events').doc(eventId).get()
    if (!doc.exists) {
      return res.status(404).json({ error: 'Event not found' })
    }
    return res.json(serializeEvent(doc))
  } catch (error) {
    console.error('[GET /api/events/:id] failed:', error)
    return res.status(500).json({ error: 'Failed to fetch event', details: error instanceof Error ? error.message : String(error) })
  }
})

// PUT /api/events/:id — update event (organizer owner or admin)
router.put('/:id', verifyFirebaseToken, authorizeRoles('COLLEGE_ADMIN', 'ADMIN'), async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  const role = (req as { user?: { role: string } }).user?.role
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const eventId = String(req.params.id)
  if (!eventId) {
    return res.status(400).json({ error: 'Invalid event id' })
  }

  try {
    const parsed = eventCreateSchema.partial().safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    }
    const data = parsed.data

    if (!db) {
      return res.status(500).json({ error: 'Firestore is not configured on the server.' })
    }

    const eventRef = db.collection('events').doc(eventId)
    const eventDoc = await eventRef.get()
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' })
    }

    const existingData = eventDoc.data() as FirestoreEvent
    if (role !== 'ADMIN' && existingData.organizerId && existingData.organizerId !== uid) {
      return res.status(403).json({ error: 'You do not have permission to edit this event' })
    }

    const updates: Record<string, unknown> = {}
    if (data.title !== undefined) updates.title = data.title
    if (data.description !== undefined) updates.description = data.description
    if (data.longDescription !== undefined) updates.longDescription = data.longDescription
    if (data.location !== undefined) updates.location = data.location
    if (data.startDate !== undefined) updates.startDate = data.startDate
    if (data.endDate !== undefined) updates.endDate = data.endDate
    if (data.xpReward !== undefined) updates.xpReward = data.xpReward
    updates.updatedAt = nowIso()

    await eventRef.update(updates)

    const updatedDoc = await eventRef.get()
    return res.json({
      message: 'Event updated successfully',
      event: serializeEvent(updatedDoc),
    })
  } catch (error) {
    console.error(`[PUT /api/events/${eventId}] failed:`, error)
    return res.status(500).json({
      error: 'Failed to update event',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

// DELETE /api/events/:id — delete event (organizer owner or admin)
router.delete('/:id', verifyFirebaseToken, authorizeRoles('COLLEGE_ADMIN', 'ADMIN'), async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  const role = (req as { user?: { role: string } }).user?.role
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const eventId = String(req.params.id)
  if (!eventId) {
    return res.status(400).json({ error: 'Invalid event id' })
  }

  try {
    if (!db) {
      return res.status(500).json({ error: 'Firestore is not configured on the server.' })
    }

    const eventRef = db.collection('events').doc(eventId)
    const eventDoc = await eventRef.get()
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' })
    }

    const existingData = eventDoc.data() as FirestoreEvent
    if (role !== 'ADMIN' && existingData.organizerId && existingData.organizerId !== uid) {
      return res.status(403).json({ error: 'You do not have permission to delete this event' })
    }

    await eventRef.delete()

    await logActivity({
      userId: uid,
      role: 'COLLEGE_ADMIN',
      type: 'EVENT_DELETE',
      description: `Deleted event "${existingData.title ?? eventId}"`,
      meta: { eventId, title: existingData.title },
    })

    return res.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error(`[DELETE /api/events/${eventId}] failed:`, error)
    return res.status(500).json({
      error: 'Failed to delete event',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

// POST /api/events/:id/register — register authenticated student for an event
router.post('/:id/register', verifyFirebaseToken, authorizeRoles('STUDENT'), async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const eventId = String(req.params.id)
  if (!eventId) {
    return res.status(400).json({ error: 'Invalid event id' })
  }

  try {
    const parsed = registrationSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    }
    const reg = parsed.data

    if (!db) {
      return res.status(500).json({ error: 'Firestore is not configured on the server.' })
    }

    const eventRef = db.collection('events').doc(eventId)
    const userEventsRef = db.collection('userEvents').doc(uid)
    const userRef = db.collection('users').doc(uid)

    let xpGained = 50
    await db.runTransaction(async (transaction) => {
      const eventDoc = await transaction.get(eventRef)
      const userEventsDoc = await transaction.get(userEventsRef)
      const userDoc = await transaction.get(userRef)

      if (!eventDoc.exists) {
        throw new Error('EVENT_NOT_FOUND')
      }
      const event = eventDoc.data() as FirestoreEvent

      const registered: UserEventRecord[] = userEventsDoc.exists ? (userEventsDoc.data()?.registered ?? []) : []

      if (registered.some((r) => r.eventId === eventId)) {
        throw new Error('ALREADY_REGISTERED')
      }

      const record: UserEventRecord = {
        eventId,
        registeredAt: nowIso(),
        name: reg.name,
        email: reg.email,
        degree: reg.degree,
        branch: reg.branch,
        year: reg.year,
        collegeName: reg.collegeName,
        phone: reg.phone,
      }

      transaction.set(userEventsRef, {
        registered: [...registered, record],
      }, { merge: true })

      xpGained = event.xpReward ?? 50
      if (userDoc.exists) {
        const userData = userDoc.data()!
        transaction.update(userRef, {
          xp: (userData.xp ?? 0) + xpGained,
          annualCredits: (userData.annualCredits ?? 0) + 10,
          lifetimeCredits: (userData.lifetimeCredits ?? 0) + 10,
        })
      } else {
        transaction.set(userRef, {
          xp: xpGained,
          annualCredits: 10,
          lifetimeCredits: 10,
          updatedAt: nowIso(),
        }, { merge: true })
      }
    })

    const eventDoc = await eventRef.get()
    const event = eventDoc.data() as FirestoreEvent

    const qrData: Record<string, string> = {
      eventId,
      eventTitle: event.title ?? '',
      eventDate: event.startDate ?? '',
      eventLocation: event.location ?? '',
      name: reg.name ?? '',
      email: reg.email ?? '',
      degree: reg.degree ?? '',
      branch: reg.branch ?? '',
      year: reg.year ?? '',
      collegeName: reg.collegeName ?? '',
      phone: reg.phone ?? '',
    }

    let qrUrl = ''
    try {
      const qrResult = await createEventQrCode(qrData, `event-qr/${uid}/${eventId}.png`)
      qrUrl = qrResult.url
    } catch (err) {
      console.error('QR generation failed:', err)
    }

    if (qrUrl) {
      const userEventsDoc = await userEventsRef.get()
      const registered: UserEventRecord[] = userEventsDoc.exists ? (userEventsDoc.data()?.registered ?? []) : []
      await userEventsRef.set({
        registered: registered.map((r) => (r.eventId === eventId ? { ...r, qrCodeUrl: qrUrl } : r)),
      }, { merge: true })
    }

    if (qrUrl && reg.email) {
      sendEventRegistrationEmail(
        reg.email,
        qrUrl,
        { title: event.title ?? '', location: event.location ?? '', startDate: event.startDate ?? '', endDate: event.endDate ?? '' },
        { name: reg.name, email: reg.email, degree: reg.degree, branch: reg.branch, year: reg.year, collegeName: reg.collegeName, phone: reg.phone },
      ).catch((err: unknown) => console.error('Failed to send event registration email:', err))
    }

    await logActivity({
      userId: uid,
      role: 'STUDENT',
      type: 'EVENT_REGISTER',
      description: `Registered for event "${event.title ?? ''}"`,
      meta: { eventId, name: reg.name, email: reg.email },
    })

    return res.status(201).json({ message: 'Registered successfully', xpEarned: xpGained, creditsEarned: 10, qrUrl })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message === 'EVENT_NOT_FOUND') {
      return res.status(404).json({ error: 'Event not found' })
    }
    if (message === 'ALREADY_REGISTERED') {
      return res.status(409).json({ error: 'You are already registered for this event' })
    }
    console.error(`[POST /api/events/${eventId}/register] failed:`, error)
    return res.status(500).json({ error: 'Failed to register for event', details: message })
  }
})

// DELETE /api/events/:id/register — unregister from an event
router.delete('/:id/register', verifyFirebaseToken, authorizeRoles('STUDENT'), async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const eventId = String(req.params.id)
  if (!eventId) {
    return res.status(400).json({ error: 'Invalid event id' })
  }

  try {
    if (!db) {
      return res.status(500).json({ error: 'Firestore is not configured on the server.' })
    }

    const eventRef = db.collection('events').doc(eventId)
    const userEventsRef = db.collection('userEvents').doc(uid)
    const userRef = db.collection('users').doc(uid)

    let xpReward = 50
    await db.runTransaction(async (transaction) => {
      // All reads FIRST
      const eventDoc = await transaction.get(eventRef)
      const userEventsDoc = await transaction.get(userEventsRef)
      const userDoc = await transaction.get(userRef)

      if (!eventDoc.exists) {
        throw new Error('EVENT_NOT_FOUND')
      }
      const event = eventDoc.data() as FirestoreEvent
      xpReward = event.xpReward ?? 50

      const registered: UserEventRecord[] = userEventsDoc.exists ? (userEventsDoc.data()?.registered ?? []) : []

      const record = registered.find((r) => r.eventId === eventId)
      if (!record) {
        throw new Error('NOT_REGISTERED')
      }

      // All writes AFTER reads
      if (userEventsDoc.exists) {
        transaction.update(userEventsRef, {
          registered: registered.filter((r) => r.eventId !== eventId),
        })
      } else {
        transaction.set(userEventsRef, { registered: [] })
      }

      if (userDoc.exists) {
        const userData = userDoc.data()!
        transaction.update(userRef, {
          xp: Math.max((userData.xp ?? 0) - xpReward, 0),
          annualCredits: Math.max((userData.annualCredits ?? 0) - 10, 0),
          lifetimeCredits: Math.max((userData.lifetimeCredits ?? 0) - 10, 0),
        })
      }
    })

await logActivity({
      userId: uid,
      role: 'STUDENT',
      type: 'EVENT_UNREGISTER',
      description: `Cancelled registration for an event`,
      meta: { eventId },
    })

    return res.json({ message: 'Registration cancelled', xpDeducted: xpReward, creditsDeducted: 10 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message === 'EVENT_NOT_FOUND') {
      return res.status(404).json({ error: 'Event not found' })
    }
    if (message === 'NOT_REGISTERED') {
      return res.status(404).json({ error: 'You are not registered for this event' })
    }
    console.error(`[DELETE /api/events/${eventId}/register] failed:`, error)
    return res.status(500).json({ error: 'Failed to cancel registration', details: message })
  }
})

export default router


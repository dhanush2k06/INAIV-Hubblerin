import { Router } from 'express'
import { db } from '../firebase.js'
import { verifyFirebaseToken } from '../middleware/auth.js'
import { authorizeRoles } from '../middleware/roles.js'
import { logActivity } from '../services/activityLogger.js'
import {
  sendEventDeletionNoticeToOrganizer,
  sendOrganizerBlockedNoticeToReporter,
  sendOrganizerAccountBlockedNotice,
  sendReportAcknowledgmentEmail,
} from '../services/emailService.js'

const router = Router()

// All CRM routes require an ADMIN role.
router.use(verifyFirebaseToken, authorizeRoles('ADMIN'))

/** Serialize a user doc for the CRM (strip any sensitive fields if needed). */
function serializeUser(doc: { id: string; data: () => Record<string, unknown> | undefined }) {
  const d = doc.data() ?? {}
  return {
    id: doc.id,
    fullName: String(d.fullName ?? ''),
    email: String(d.email ?? ''),
    role: String(d.role ?? 'STUDENT'),
    collegeId: (d.collegeId as string | null) ?? null,
    collegeName: (d.collegeName as string | null) ?? null,
    department: (d.department as string | null) ?? null,
    rollNumber: (d.rollNumber as string | null) ?? null,
    degree: (d.degree as string | null) ?? null,
    branch: (d.branch as string | null) ?? null,
    year: (d.year as string | null) ?? null,
    phone: (d.phone as string | null) ?? null,
    xp: Number(d.xp ?? 0),
    annualCredits: Number(d.annualCredits ?? 0),
    lifetimeCredits: Number(d.lifetimeCredits ?? 0),
    verificationStatus: String(d.verificationStatus ?? 'UNVERIFIED'),
    profileImage: (d.profileImage as string | null) ?? null,
    createdAt: String(d.createdAt ?? ''),
    updatedAt: String(d.updatedAt ?? ''),
  }
}

/** Serialize an activity log doc. */
function serializeLog(doc: { id: string; data: () => Record<string, unknown> | undefined }) {
  const d = doc.data() ?? {}
  return {
    id: doc.id,
    userId: String(d.userId ?? ''),
    role: String(d.role ?? 'STUDENT'),
    type: String(d.type ?? ''),
    description: String(d.description ?? ''),
    createdAt: String(d.createdAt ?? ''),
    meta: (d.meta as Record<string, unknown>) ?? {},
  }
}

/** Serialize an event doc with registration count. */
function serializeEvent(doc: { id: string; data: () => Record<string, unknown> | undefined }, regCount = 0) {
  const d = doc.data() ?? {}
  return {
    id: doc.id,
    title: String(d.title ?? ''),
    description: String(d.description ?? ''),
    location: String(d.location ?? ''),
    startDate: String(d.startDate ?? ''),
    endDate: String(d.endDate ?? ''),
    xpReward: Number(d.xpReward ?? 50),
    createdAt: String(d.createdAt ?? ''),
    registrationCount: regCount,
  }
}

// GET /api/crm/overview — high-level KPIs
router.get('/overview', async (_req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Firestore is not configured on the server.' })

    const [users, colleges, events, activity] = await Promise.all([
      db.collection('users').get(),
      db.collection('colleges').get(),
      db.collection('events').get(),
      db.collection('activityLogs').orderBy('createdAt', 'desc').limit(50).get(),
    ])

    let students = 0
    let organizers = 0
    let support = 0
    let admin = 0
    let totalRegistrations = 0

    const userDocs = users.docs
    for (const u of userDocs) {
      const role = u.data().role ?? 'STUDENT'
      if (role === 'STUDENT') students++
      else if (role === 'COLLEGE_ADMIN') organizers++
      else if (role === 'SUPPORT') support++
      else if (role === 'ADMIN') admin++
    }

    // Count registrations across userEvents docs
    const userEventsSnap = await db.collection('userEvents').get()
    for (const ue of userEventsSnap.docs) {
      totalRegistrations += (ue.data()?.registered?.length ?? 0)
    }

    const pendingColleges = colleges.docs.filter((c) => (c.data().status ?? 'PENDING') === 'PENDING').length

    return res.json({
      totalStudents: students,
      totalOrganizers: organizers,
      totalUsers: userDocs.length,
      totalColleges: colleges.docs.length,
      pendingColleges,
      totalEvents: events.docs.length,
      totalRegistrations,
      support,
      admin,
      recentActivityCount: activity.docs.length,
    })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch overview', details: error instanceof Error ? error.message : String(error) })
  }
})

// GET /api/crm/users?role=&search=&verificationStatus=&page=&limit=
router.get('/users', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Firestore is not configured on the server.' })

    const role = String(req.query.role ?? '').toUpperCase()
    const search = String(req.query.search ?? '').toLowerCase()
    const status = String(req.query.verificationStatus ?? '').toUpperCase()
    const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '50'), 10) || 50, 1), 200)

    const snapshot = await db.collection('users').get()
    let users = snapshot.docs.map(serializeUser)

    if (role && role !== 'ALL') {
      users = users.filter((u) => u.role === role)
    }
    if (status && status !== 'ALL') {
      users = users.filter((u) => u.verificationStatus === status)
    }
    if (search) {
      users = users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          (u.collegeName ?? '').toLowerCase().includes(search),
      )
    }

    users.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    const total = users.length
    const start = (page - 1) * limit
    const paginated = users.slice(start, start + limit)

    return res.json({ total, page, limit, users: paginated })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch users', details: error instanceof Error ? error.message : String(error) })
  }
})

// GET /api/crm/users/:id — user detail + activity timeline
router.get('/users/:id', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Firestore is not configured on the server.' })
    const uid = String(req.params.id)
    if (!uid) return res.status(400).json({ error: 'Invalid user id' })

    const userDoc = await db.collection('users').doc(uid).get()
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' })

    const user = serializeUser(userDoc)

    // Activity timeline
    // NOTE: Filter by userId only (single-field equality needs no composite index),
    // then sort by createdAt descending in memory. This avoids requiring a
    // composite index on (userId, createdAt) in Firestore.
    const logSnap = await db.collection('activityLogs').where('userId', '==', uid).limit(200).get()
    const activity = logSnap.docs
      .map(serializeLog)
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
      .slice(0, 100)

    // Registered events
    const registeredEvents: Array<Record<string, unknown>> = []
    const userEventsDoc = await db.collection('userEvents').doc(uid).get()
    if (userEventsDoc.exists) {
      const registered = userEventsDoc.data()?.registered ?? []
      for (const rec of registered) {
        const evDoc = await db.collection('events').doc(rec.eventId).get()
        if (!evDoc.exists) continue
        const ev = serializeEvent(evDoc)
        registeredEvents.push({ ...ev, registeredAt: rec.registeredAt })
      }
    }

    return res.json({ ...user, activity, registeredEvents })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user detail', details: error instanceof Error ? error.message : String(error) })
  }
})

// GET /api/crm/events
router.get('/events', async (_req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Firestore is not configured on the server.' })
    const eventsSnap = await db.collection('events').get()
    const userEventsSnap = await db.collection('userEvents').get()

    const regMap: Record<string, number> = {}
    for (const ue of userEventsSnap.docs) {
      const registered = ue.data()?.registered ?? []
      for (const rec of registered) {
        regMap[rec.eventId] = (regMap[rec.eventId] ?? 0) + 1
      }
    }

    const events = eventsSnap.docs.map((doc) => serializeEvent(doc, regMap[doc.id] ?? 0))
    events.sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))
    return res.json(events)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch events', details: error instanceof Error ? error.message : String(error) })
  }
})

// GET /api/crm/activity — recent activity feed (paginated)
router.get('/activity', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Firestore is not configured on the server.' })
    const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '50'), 10) || 50, 1), 200)

    const start = (page - 1) * limit
    const snapshot = await db.collection('activityLogs').orderBy('createdAt', 'desc').limit(start + limit).get()
    const all = snapshot.docs.map(serializeLog)
    const total = (await db.collection('activityLogs').count().get()).data().count ?? 0
    const activity = all.slice(start, start + limit)

    return res.json({ total, page, limit, activity })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch activity', details: error instanceof Error ? error.message : String(error) })
  }
})

// GET /api/crm/analytics — visualization data: role distribution, verification
// status, activity by type, 7-day activity trend, top colleges, and totals.
router.get('/analytics', async (_req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Firestore is not configured on the server.' })

    const [userEventsSnap, usersSnap, activitySnap] = await Promise.all([
      db.collection('userEvents').get(),
      db.collection('users').get(),
      db.collection('activityLogs').orderBy('createdAt', 'asc').limit(2000).get(),
    ])

    const totals = { students: 0, organizers: 0 }
    const roleDistribution: Record<string, number> = {}
    const verificationStatus: Record<string, number> = {}
    const collegeRegCount: Record<string, number> = {}
    const users = usersSnap.docs

    for (const u of users) {
      const data = u.data()
      const role = String(data.role ?? 'STUDENT')
      const status = String(data.verificationStatus ?? 'UNVERIFIED')

      if (role === 'STUDENT') totals.students++
      else if (role === 'COLLEGE_ADMIN') totals.organizers++

      roleDistribution[role] = (roleDistribution[role] ?? 0) + 1
      verificationStatus[status] = (verificationStatus[status] ?? 0) + 1
    }

    // Registrations per college (via user collegeName)
    for (const ue of userEventsSnap.docs) {
      const uid = ue.id
      const userDoc = users.find((u) => u.id === uid)
      const collegeName = userDoc?.data()?.collegeName ?? 'Unknown'
      collegeRegCount[collegeName] = (collegeRegCount[collegeName] ?? 0) + (ue.data()?.registered?.length ?? 0)
    }

    const topColleges = Object.entries(collegeRegCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Activity by type
    const typeCount: Record<string, number> = {}
    for (const a of activitySnap.docs) {
      const t = String(a.data()?.type ?? 'OTHER')
      typeCount[t] = (typeCount[t] ?? 0) + 1
    }
    const activityByType = Object.entries(typeCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    // 7-day activity trend (by calendar day)
    const dayCount: Record<string, number> = {}
    const trend: Array<{ date: string; count: number }> = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - i)
      dayCount[d.toISOString().slice(0, 10)] = 0
      trend.push({ date: d.toISOString().slice(0, 10), count: 0 })
    }
    for (const a of activitySnap.docs) {
      const created = a.data()?.createdAt
      if (!created) continue
      const day = String(created).slice(0, 10)
      if (day in dayCount) dayCount[day]++
    }
    for (const row of trend) {
      row.count = dayCount[row.date] ?? 0
    }

    const roleDistributionArr = Object.entries(roleDistribution).map(([name, value]) => ({ name, value }))
    const verificationStatusArr = Object.entries(verificationStatus).map(([name, value]) => ({ name, value }))

    return res.json({ totals, topColleges, roleDistribution: roleDistributionArr, verificationStatus: verificationStatusArr, activityByType, activityTrend: trend })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch analytics', details: error instanceof Error ? error.message : String(error) })
  }
})

// PUT /api/crm/users/:id/approve — approve user / organizer account
router.put('/users/:id/approve', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Firestore is not configured on the server.' })
    const uid = String(req.params.id)
    if (!uid) return res.status(400).json({ error: 'Invalid user id' })

    const userDoc = await db.collection('users').doc(uid).get()
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' })

    const user = userDoc.data() ?? {}
    const collegeId = (user.collegeId as string | null) ?? null

    await db.collection('users').doc(uid).update({
      verificationStatus: 'VERIFIED',
      updatedAt: new Date().toISOString(),
    })

    if (collegeId) {
      const collegeRef = db.collection('colleges').doc(collegeId)
      const collegeDoc = await collegeRef.get()
      if (collegeDoc.exists) {
        await collegeRef.update({ status: 'APPROVED' })
      }
      const organizerRef = db.collection('organizers').doc(collegeId)
      const organizerDoc = await organizerRef.get()
      if (organizerDoc.exists) {
        await organizerRef.update({ verificationStatus: 'APPROVED' })
      }
    }

    const adminUid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid ?? 'admin'
    await logActivity({
      userId: adminUid,
      role: 'ADMIN',
      type: 'COLLEGE_APPROVE',
      description: `Approved organizer account for ${user.fullName ?? uid}`,
      meta: { targetUserId: uid, collegeId },
    })

    return res.json({ message: 'Organizer approved successfully' })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to approve organizer', details: error instanceof Error ? error.message : String(error) })
  }
})

// PUT /api/crm/users/:id/reject — reject user / organizer account
router.put('/users/:id/reject', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Firestore is not configured on the server.' })
    const uid = String(req.params.id)
    if (!uid) return res.status(400).json({ error: 'Invalid user id' })

    const userDoc = await db.collection('users').doc(uid).get()
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' })

    const user = userDoc.data() ?? {}
    const collegeId = (user.collegeId as string | null) ?? null

    await db.collection('users').doc(uid).update({
      verificationStatus: 'REJECTED',
      updatedAt: new Date().toISOString(),
    })

    if (collegeId) {
      const collegeRef = db.collection('colleges').doc(collegeId)
      const collegeDoc = await collegeRef.get()
      if (collegeDoc.exists) {
        await collegeRef.update({ status: 'REJECTED' })
      }
      const organizerRef = db.collection('organizers').doc(collegeId)
      const organizerDoc = await organizerRef.get()
      if (organizerDoc.exists) {
        await organizerRef.update({ verificationStatus: 'REJECTED' })
      }
    }

    const adminUid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid ?? 'admin'
    await logActivity({
      userId: adminUid,
      role: 'ADMIN',
      type: 'COLLEGE_REJECT',
      description: `Rejected organizer account for ${user.fullName ?? uid}`,
      meta: { targetUserId: uid, collegeId },
    })

    return res.json({ message: 'Organizer rejected successfully' })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to reject organizer', details: error instanceof Error ? error.message : String(error) })
  }
})

// GET /api/crm/reports — list all event reports (paginated, filterable)
router.get('/reports', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Firestore is not configured on the server.' })
    const statusFilter = String(req.query.status ?? 'ALL')
    const categoryFilter = String(req.query.category ?? 'ALL')
    const search = String(req.query.search ?? '').toLowerCase()
    const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '50'), 10) || 50, 1), 200)

    const snap = await db.collection('eventReports').orderBy('createdAt', 'desc').get()
    let reports = snap.docs.map((doc) => {
      const d = doc.data() ?? {}
      return {
        id: doc.id,
        eventId: String(d.eventId ?? ''),
        eventTitle: String(d.eventTitle ?? ''),
        organizerId: String(d.organizerId ?? ''),
        organizerName: String(d.organizerName ?? ''),
        collegeName: String(d.collegeName ?? ''),
        reportedBy: String(d.reportedBy ?? ''),
        reporterName: String(d.reporterName ?? ''),
        reporterEmail: String(d.reporterEmail ?? ''),
        reporterCollege: String(d.reporterCollege ?? ''),
        reason: String(d.reason ?? ''),
        category: String(d.category ?? 'OTHER'),
        status: String(d.status ?? 'PENDING'),
        actionTaken: (d.actionTaken as string | null) ?? null,
        createdAt: String(d.createdAt ?? ''),
        updatedAt: String(d.updatedAt ?? ''),
        resolvedBy: (d.resolvedBy as string | null) ?? null,
        resolution: (d.resolution as string | null) ?? null,
      }
    })

    if (statusFilter !== 'ALL') reports = reports.filter((r) => r.status === statusFilter)
    if (categoryFilter !== 'ALL') reports = reports.filter((r) => r.category === categoryFilter)
    if (search) {
      reports = reports.filter((r) =>
        r.eventTitle.toLowerCase().includes(search) ||
        r.organizerName.toLowerCase().includes(search) ||
        r.reporterName.toLowerCase().includes(search) ||
        r.reporterEmail.toLowerCase().includes(search) ||
        r.reason.toLowerCase().includes(search)
      )
    }

    const total = reports.length
    const paginated = reports.slice((page - 1) * limit, page * limit)
    return res.json({ total, page, limit, reports: paginated })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch reports', details: error instanceof Error ? error.message : String(error) })
  }
})

// POST /api/crm/reports/:id/delete-event — admin deletes reported event and acknowledges organizer via email
router.post('/reports/:id/delete-event', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Firestore is not configured on the server.' })
    const reportId = String(req.params.id)
    const { reason, notifyReporter = true } = req.body as { reason?: string; notifyReporter?: boolean }

    const reportRef = db.collection('eventReports').doc(reportId)
    const reportDoc = await reportRef.get()
    if (!reportDoc.exists) return res.status(404).json({ error: 'Report not found' })

    const reportData = reportDoc.data() ?? {}
    const eventId = String(reportData.eventId ?? '')
    const eventTitle = String(reportData.eventTitle ?? 'Event')
    let organizerId = String(reportData.organizerId ?? '')
    let organizerName = String(reportData.organizerName ?? '')
    let organizerEmail = ''

    // If event exists, load and delete it
    if (eventId) {
      const eventRef = db.collection('events').doc(eventId)
      const eventDoc = await eventRef.get()
      if (eventDoc.exists) {
        const evData = eventDoc.data() ?? {}
        if (!organizerId) organizerId = String(evData.organizerId ?? '')
        if (!organizerName) organizerName = String(evData.organizerName ?? 'Organizer')
        await eventRef.delete()
      }
    }

    // Try to find organizer email
    if (organizerId) {
      const userDoc = await db.collection('users').doc(organizerId).get()
      if (userDoc.exists) {
        const u = userDoc.data() ?? {}
        organizerEmail = String(u.email ?? '')
        if (!organizerName) organizerName = String(u.fullName ?? '')
      }
    }

    // Acknowledge/notify organizer via email
    if (organizerEmail) {
      sendEventDeletionNoticeToOrganizer(
        organizerEmail,
        organizerName,
        eventTitle,
        reason || 'Event removed following report investigation and community guidelines review.',
      ).catch((err) => console.error('[sendEventDeletionNoticeToOrganizer] failed:', err))
    }

    // Acknowledge reporting student via email
    const reporterEmail = String(reportData.reporterEmail ?? '')
    const reporterName = String(reportData.reporterName ?? 'Student')
    if (notifyReporter && reporterEmail) {
      sendReportAcknowledgmentEmail(
        reporterEmail,
        reporterName,
        eventTitle,
        reason
          ? `Action Taken: The reported event has been removed from the platform. Resolution Note: ${reason}`
          : 'Action Taken: The reported event has been removed from the platform after review.',
      ).catch((err) => console.error('[sendReportAcknowledgmentEmail] failed:', err))
    }

    const adminUid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid ?? 'admin'
    const now = new Date().toISOString()

    await reportRef.update({
      status: 'RESOLVED',
      actionTaken: 'EVENT_DELETED',
      resolution: reason || 'Event deleted by admin following report investigation.',
      resolvedBy: adminUid,
      updatedAt: now,
    })

    await logActivity({
      userId: adminUid,
      role: 'ADMIN',
      type: 'EVENT_DELETE',
      description: `Admin deleted reported event "${eventTitle}" and notified organizer`,
      meta: { reportId, eventId, reason },
    })

    await logActivity({
      userId: adminUid,
      role: 'ADMIN',
      type: 'REPORT_RESOLVE',
      description: `Resolved report for "${eventTitle}" by deleting event`,
      meta: { reportId, eventId, action: 'EVENT_DELETED' },
    })

    return res.json({ message: `Event "${eventTitle}" deleted and organizer notified.` })
  } catch (error) {
    console.error('[POST /api/crm/reports/:id/delete-event] error:', error)
    return res.status(500).json({ error: 'Failed to delete event and process report', details: error instanceof Error ? error.message : String(error) })
  }
})

// POST /api/crm/reports/:id/block-organizer — admin blocks organizer account and acknowledges student reporter via email
router.post('/reports/:id/block-organizer', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Firestore is not configured on the server.' })
    const reportId = String(req.params.id)
    const { reason, notifyReporter = true, deleteEvents = false } = req.body as {
      reason?: string
      notifyReporter?: boolean
      deleteEvents?: boolean
    }

    const reportRef = db.collection('eventReports').doc(reportId)
    const reportDoc = await reportRef.get()
    if (!reportDoc.exists) return res.status(404).json({ error: 'Report not found' })

    const reportData = reportDoc.data() ?? {}
    const eventId = String(reportData.eventId ?? '')
    const eventTitle = String(reportData.eventTitle ?? '')
    let organizerId = String(reportData.organizerId ?? '')
    let organizerName = String(reportData.organizerName ?? '')
    let organizerEmail = ''

    // If organizerId missing on report, resolve from event
    if (!organizerId && eventId) {
      const eventDoc = await db.collection('events').doc(eventId).get()
      if (eventDoc.exists) {
        const evData = eventDoc.data() ?? {}
        organizerId = String(evData.organizerId ?? '')
        if (!organizerName) organizerName = String(evData.organizerName ?? '')
      }
    }

    if (!organizerId) {
      return res.status(400).json({ error: 'Unable to identify the organizer account associated with this report.' })
    }

    const userRef = db.collection('users').doc(organizerId)
    const userDoc = await userRef.get()
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Organizer user account not found in database.' })
    }

    const userData = userDoc.data() ?? {}
    organizerEmail = String(userData.email ?? '')
    if (!organizerName) organizerName = String(userData.fullName ?? 'Organizer')
    const collegeId = (userData.collegeId as string | null) ?? null

    const now = new Date().toISOString()

    // 1. Block user in users collection
    await userRef.update({
      verificationStatus: 'BLOCKED',
      updatedAt: now,
    })

    // 2. Block in colleges / organizers collections if linked
    if (collegeId) {
      const collegeRef = db.collection('colleges').doc(collegeId)
      const collegeDoc = await collegeRef.get()
      if (collegeDoc.exists) {
        await collegeRef.update({ status: 'BLOCKED' })
      }
      const orgRef = db.collection('organizers').doc(collegeId)
      const orgDoc = await orgRef.get()
      if (orgDoc.exists) {
        await orgRef.update({ verificationStatus: 'BLOCKED' })
      }
    }

    // 3. Optional: delete organizer's events if requested
    if (deleteEvents) {
      const orgEventsSnap = await db.collection('events').where('organizerId', '==', organizerId).get()
      for (const evDoc of orgEventsSnap.docs) {
        await evDoc.ref.delete()
      }
    }

    // 4. Acknowledge and notify the reporting student via email
    const reporterEmail = String(reportData.reporterEmail ?? '')
    const reporterName = String(reportData.reporterName ?? 'Student')
    if (notifyReporter && reporterEmail) {
      sendOrganizerBlockedNoticeToReporter(
        reporterEmail,
        reporterName,
        organizerName,
        eventTitle,
        reason || 'The organizer account has been suspended following our review of your report.',
      ).catch((err) => console.error('[sendOrganizerBlockedNoticeToReporter] failed:', err))
    }

    // 5. Notify organizer that account was suspended
    if (organizerEmail) {
      sendOrganizerAccountBlockedNotice(
        organizerEmail,
        organizerName,
        reason || 'Your organizer account was suspended due to reported violations of community and organizer safety standards.',
      ).catch((err) => console.error('[sendOrganizerAccountBlockedNotice] failed:', err))
    }

    const adminUid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid ?? 'admin'

    await reportRef.update({
      status: 'RESOLVED',
      actionTaken: 'ORGANIZER_BLOCKED',
      resolution: reason || `Organizer account (${organizerName}) suspended and blocked.`,
      resolvedBy: adminUid,
      updatedAt: now,
    })

    await logActivity({
      userId: adminUid,
      role: 'ADMIN',
      type: 'ORGANIZER_BLOCK',
      description: `Admin blocked organizer account "${organizerName}" (${organizerId}) following report`,
      meta: { reportId, organizerId, reason },
    })

    await logActivity({
      userId: adminUid,
      role: 'ADMIN',
      type: 'REPORT_RESOLVE',
      description: `Resolved report for "${eventTitle}" by blocking organizer "${organizerName}"`,
      meta: { reportId, organizerId, action: 'ORGANIZER_BLOCKED' },
    })

    return res.json({
      message: `Organizer "${organizerName}" account blocked and student reporter (${reporterEmail || 'user'}) acknowledged via email.`,
    })
  } catch (error) {
    console.error('[POST /api/crm/reports/:id/block-organizer] error:', error)
    return res.status(500).json({ error: 'Failed to block organizer account', details: error instanceof Error ? error.message : String(error) })
  }
})

// PUT /api/crm/reports/:id/resolve — resolve or dismiss a report with optional email acknowledgment
router.put('/reports/:id/resolve', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Firestore is not configured on the server.' })
    const reportId = String(req.params.id)
    const { status, resolution, notifyReporter = true } = req.body as {
      status?: string
      resolution?: string
      notifyReporter?: boolean
    }
    if (!status || !['RESOLVED', 'DISMISSED'].includes(status)) {
      return res.status(400).json({ error: 'status must be RESOLVED or DISMISSED' })
    }

    const ref = db.collection('eventReports').doc(reportId)
    const doc = await ref.get()
    if (!doc.exists) return res.status(404).json({ error: 'Report not found' })

    const reportData = doc.data() ?? {}
    const adminUid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid ?? 'admin'
    const now = new Date().toISOString()

    await ref.update({
      status,
      actionTaken: status,
      resolution: resolution ?? '',
      resolvedBy: adminUid,
      updatedAt: now,
    })

    // Optionally acknowledge student reporter
    const reporterEmail = String(reportData.reporterEmail ?? '')
    const reporterName = String(reportData.reporterName ?? 'Student')
    const eventTitle = String(reportData.eventTitle ?? 'Event')
    if (notifyReporter && reporterEmail) {
      sendReportAcknowledgmentEmail(
        reporterEmail,
        reporterName,
        eventTitle,
        resolution || `Your report has been reviewed and marked as ${status.toLowerCase()} by our moderation team.`,
      ).catch((err) => console.error('[sendReportAcknowledgmentEmail] failed:', err))
    }

    await logActivity({
      userId: adminUid,
      role: 'ADMIN',
      type: status === 'RESOLVED' ? 'REPORT_RESOLVE' : 'REPORT_DISMISS',
      description: `Marked report for "${eventTitle}" as ${status}`,
      meta: { reportId, status, resolution },
    })

    return res.json({ message: `Report marked as ${status}` })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update report', details: error instanceof Error ? error.message : String(error) })
  }
})


router.get('/organizers/:id', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Firestore is not configured on the server.' })
    const uid = String(req.params.id)
    if (!uid) return res.status(400).json({ error: 'Invalid organizer id' })

    const userDoc = await db.collection('users').doc(uid).get()
    if (!userDoc.exists) return res.status(404).json({ error: 'Organizer not found' })

    const user = serializeUser(userDoc)

    // Events created by this organizer
    const eventsSnap = await db.collection('events').where('organizerId', '==', uid).get()

    // Compute registration counts per event
    const userEventsSnap = await db.collection('userEvents').get()
    const regMap: Record<string, number> = {}
    for (const ue of userEventsSnap.docs) {
      const registered = ue.data()?.registered ?? []
      for (const rec of registered) {
        regMap[rec.eventId] = (regMap[rec.eventId] ?? 0) + 1
      }
    }

    const events = eventsSnap.docs
      .map((doc) => serializeEvent(doc, regMap[doc.id] ?? 0))
      .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))

    const totalRegistrations = events.reduce((sum, e) => sum + (e.registrationCount ?? 0), 0)
    const totalEvents = events.length
    const upcomingEvents = events.filter((e) => {
      if (!e.startDate) return false
      return new Date(e.startDate) > new Date()
    }).length

    // Activity timeline
    const logSnap = await db.collection('activityLogs').where('userId', '==', uid).limit(200).get()
    const activity = logSnap.docs
      .map(serializeLog)
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
      .slice(0, 100)

    return res.json({
      ...user,
      events,
      totalEvents,
      totalRegistrations,
      upcomingEvents,
      activity,
    })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch organizer detail', details: error instanceof Error ? error.message : String(error) })
  }
})

export default router

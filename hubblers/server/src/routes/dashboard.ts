import { Router } from 'express'
import { db } from '../firebase.js'
import { verifyFirebaseToken } from '../middleware/auth.js'
import { authorizeRoles } from '../middleware/roles.js'
import { isEventOver } from '../utils/eventDate.js'
import { createEventQrCode } from '../utils/qr.js'
import type { AppUser, UserEventRecord } from '../types.js'

const router = Router()

function dataProfileCompletion(user: Record<string, unknown>) {
  const fields = ['fullName', 'qrCodeUrl', 'department', 'rollNumber']
  const filled = fields.filter((key) => Boolean(user[key])).length
  return Math.round((filled / fields.length) * 100)
}

router.get('/student', verifyFirebaseToken, authorizeRoles('STUDENT'), async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (!db) {
    return res.status(500).json({ error: 'Firestore is not configured on the server.' })
  }

  const userDoc = await db.collection('users').doc(uid).get()
  if (!userDoc.exists) {
    return res.status(404).json({ error: 'Student not found' })
  }
  const user = userDoc.data() as AppUser

  // Registered events from userEvents/{uid}
  const userEventsDoc = await db.collection('userEvents').doc(uid).get()
  const records: UserEventRecord[] = userEventsDoc.exists ? (userEventsDoc.data()?.registered ?? []) : []

  const registeredEvents: Array<Record<string, unknown>> = []
  const cleanedRecords: UserEventRecord[] = []
  let cleaned = false

  for (const record of records) {
    const eventDoc = await db.collection('events').doc(record.eventId).get()
    if (!eventDoc.exists) continue
    const ev = eventDoc.data() ?? {}

    const eventOver = isEventOver(ev.endDate ?? ev.startDate ?? '')
    let qrUrl = record.qrCodeUrl ?? ''

    // If QR code is missing or placeholder and event is not over, generate on the fly
    if (!eventOver && (!qrUrl || qrUrl.includes('placeholder'))) {
      try {
        const qrResult = await createEventQrCode({
          eventId: record.eventId,
          eventTitle: ev.title ?? '',
          eventDate: ev.startDate ?? '',
          name: record.name ?? user.fullName ?? '',
          email: record.email ?? user.email ?? '',
        }, `event-qr/${uid}/${record.eventId}.png`)
        qrUrl = qrResult.url
        record.qrCodeUrl = qrUrl
        cleaned = true
      } catch (err) {
        console.error('Failed to generate fallback QR:', err)
      }
    }

    if (eventOver && record.qrCodeUrl) {
      delete record.qrCodeUrl
      cleaned = true
    }
    cleanedRecords.push({ ...record })

    registeredEvents.push({
      id: record.eventId,
      title: ev.title ?? '',
      description: ev.description ?? '',
      location: ev.location ?? '',
      startDate: ev.startDate ?? '',
      endDate: ev.endDate ?? '',
      xpReward: ev.xpReward ?? 50,
      registeredAt: record.registeredAt,
      qrCodeUrl: eventOver ? '' : qrUrl,
      eventOver,
      registration: {
        name: record.name ?? user.fullName,
        email: record.email ?? user.email,
        degree: record.degree ?? '',
        branch: record.branch ?? user.department ?? '',
        year: record.year ?? '',
        collegeName: record.collegeName ?? '',
        phone: record.phone ?? '',
      },
    })
  }

  // Persist the cleanup so expired QR URLs are actually removed from Firestore.
  if (cleaned && userEventsDoc.exists) {
    await db.collection('userEvents').doc(uid).set(
      { registered: cleanedRecords },
      { merge: true },
    )
  }

  registeredEvents.sort((a, b) => (String(b.registeredAt ?? '')).localeCompare(String(a.registeredAt ?? '')))

  return res.json({
    welcome: `Welcome back, ${user.fullName}`,
    credits: {
      annual: user.annualCredits ?? 0,
      lifetime: user.lifetimeCredits ?? 0,
    },
    xp: user.xp ?? 0,
    registeredEvents,
    upcomingEvents: registeredEvents,
    leaderboard: [
      { name: 'Ayesha R.', score: 92 },
      { name: 'Samir K.', score: 88 },
      { name: 'You', score: user.xp ?? 0 },
    ],
    recentCertificates: ['Python Bootcamp', 'Data Analytics', 'Web Accessibility'],
    profileCompletion: dataProfileCompletion(user as unknown as Record<string, unknown>),
    qrCodeUrl: user.qrCodeUrl,
  })
})

router.get('/college', verifyFirebaseToken, authorizeRoles('COLLEGE_ADMIN'), async (req, res) => {
  const user = (req as { user?: { firebaseUid: string; collegeId: string | null } }).user
  if (!user || !user.firebaseUid) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (!db) {
    return res.status(500).json({ error: 'Firestore is not configured on the server.' })
  }

  let collegeName = 'Your institution'
  if (user.collegeId) {
    const collegeDoc = await db.collection('colleges').doc(user.collegeId).get()
    if (collegeDoc.exists) {
      collegeName = collegeDoc.data()?.collegeName ?? 'Your institution'
    } else {
      const orgDoc = await db.collection('organizers').doc(user.collegeId).get()
      if (orgDoc.exists) {
        collegeName = orgDoc.data()?.organizationName ?? 'Your institution'
      }
    }
  }

  // Get my events
  const myEventsSnap = await db.collection('events').where('organizerId', '==', user.firebaseUid).get()
  const eventIds = new Set(myEventsSnap.docs.map((d) => d.id))

  let totalRegistrations = 0
  if (eventIds.size > 0) {
    const userEventsSnap = await db.collection('userEvents').get()
    for (const ueDoc of userEventsSnap.docs) {
      const regList: UserEventRecord[] = ueDoc.data()?.registered ?? []
      for (const r of regList) {
        if (eventIds.has(r.eventId)) {
          totalRegistrations++
        }
      }
    }
  }

  return res.json({
    totalEvents: myEventsSnap.docs.length,
    registrations: totalRegistrations,
    attendance: totalRegistrations,
    certificatesIssued: Math.round(totalRegistrations * 0.75),
    pendingRequests: 0,
    collegeName,
  })
})

router.get('/support', verifyFirebaseToken, authorizeRoles('SUPPORT'), async (_req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Firestore is not configured on the server.' })
  }

  const [userCount, collegeCount, pendingCount] = await Promise.all([
    db.collection('users').count().get(),
    db.collection('colleges').count().get(),
    db.collection('colleges').where('status', '==', 'PENDING').count().get(),
  ])

  const totalUsers = userCount.data().count ?? 0
  const totalColleges = collegeCount.data().count ?? 0
  const pendingColleges = pendingCount.data().count ?? 0

  return res.json({
    totalUsers,
    totalColleges,
    pendingColleges,
    reports: {
      activeColleges: totalColleges - pendingColleges,
      studentRatio: 78,
      platformGrowth: '12%',
    },
    statistics: {
      dailyActiveStudents: 245,
      weeklyRegistrations: 82,
      monthlyEvents: 18,
    },
  })
})

export default router

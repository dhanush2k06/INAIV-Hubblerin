import { Router } from 'express'
import { z } from 'zod'
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
import { BADGES_CATALOG } from '../rewardConfig.js'
import { calculateLevel } from '../services/rewardService.js'
import type { RewardItem, RedemptionRecord, UserBadgeRecord, XpTransactionRecord, AppUser } from '../types.js'

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

// ---- REWARDS & GAMIFICATION CRM ENDPOINTS ----

const rewardSchema = z.object({
  name: z.string().min(1, 'Reward name is required'),
  description: z.string().min(1, 'Description is required'),
  image: z.string().optional().default('🎁'),
  xpCost: z.number().int().min(1, 'XP Cost must be at least 1'),
  category: z.enum(['THEME', 'FRAME', 'TITLE', 'BADGE', 'DISCOUNT', 'ACCESS']),
  minLevel: z.number().int().min(1).optional().default(1),
  minXp: z.number().int().min(0).optional().default(0),
  active: z.boolean().optional().default(true),
  valueData: z.record(z.unknown()).optional().default({}),
})

// GET /api/crm/rewards — list all store rewards with redemption counts
router.get('/rewards', async (_req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Firestore is not configured.' })

    const [rewardsSnap, redemptionsSnap] = await Promise.all([
      db.collection('rewards').get(),
      db.collection('redemptions').get(),
    ])

    const redemptionsCountMap: Record<string, number> = {}
    for (const doc of redemptionsSnap.docs) {
      const r = doc.data() as RedemptionRecord
      if (r.rewardId) {
        redemptionsCountMap[r.rewardId] = (redemptionsCountMap[r.rewardId] || 0) + 1
      }
    }

    const rewards = rewardsSnap.docs.map((doc) => {
      const data = doc.data() as RewardItem
      return {
        ...data,
        id: doc.id,
        redemptionsCount: redemptionsCountMap[doc.id] || 0,
      }
    })

    rewards.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    return res.json(rewards)
  } catch (error) {
    console.error('[GET /api/crm/rewards] failed:', error)
    return res.status(500).json({
      error: 'Failed to fetch rewards',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

// POST /api/crm/rewards — create new store reward
router.post('/rewards', async (req, res) => {
  try {
    const parsed = rewardSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    }

    if (!db) return res.status(500).json({ error: 'Firestore is not configured.' })

    const data = parsed.data
    const rewardRef = db.collection('rewards').doc()
    const now = new Date().toISOString()

    const newReward: RewardItem = {
      id: rewardRef.id,
      name: data.name,
      description: data.description,
      image: data.image || '🎁',
      xpCost: data.xpCost,
      category: data.category,
      minLevel: data.minLevel || 1,
      minXp: data.minXp || 0,
      active: data.active !== undefined ? data.active : true,
      valueData: data.valueData || {},
      createdAt: now,
      updatedAt: now,
    }

    await rewardRef.set(newReward)
    return res.status(201).json({ message: 'Reward created successfully', reward: newReward })
  } catch (error) {
    console.error('[POST /api/crm/rewards] failed:', error)
    return res.status(500).json({
      error: 'Failed to create reward',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

// PUT /api/crm/rewards/:id — update existing reward
router.put('/rewards/:id', async (req, res) => {
  const rewardId = String(req.params.id)
  if (!rewardId) return res.status(400).json({ error: 'Invalid reward ID' })

  try {
    const parsed = rewardSchema.partial().safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    }

    if (!db) return res.status(500).json({ error: 'Firestore is not configured.' })

    const rewardRef = db.collection('rewards').doc(rewardId)
    const rewardDoc = await rewardRef.get()
    if (!rewardDoc.exists) {
      return res.status(404).json({ error: 'Reward not found' })
    }

    const updates: Record<string, unknown> = {
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    }

    await rewardRef.update(updates)
    const updatedDoc = await rewardRef.get()
    return res.json({ message: 'Reward updated successfully', reward: { id: rewardId, ...updatedDoc.data() } })
  } catch (error) {
    console.error(`[PUT /api/crm/rewards/${rewardId}] failed:`, error)
    return res.status(500).json({
      error: 'Failed to update reward',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

// DELETE /api/crm/rewards/:id — delete reward
router.delete('/rewards/:id', async (req, res) => {
  const rewardId = String(req.params.id)
  if (!rewardId) return res.status(400).json({ error: 'Invalid reward ID' })

  try {
    if (!db) return res.status(500).json({ error: 'Firestore is not configured.' })

    const rewardRef = db.collection('rewards').doc(rewardId)
    const rewardDoc = await rewardRef.get()
    if (!rewardDoc.exists) {
      return res.status(404).json({ error: 'Reward not found' })
    }

    await rewardRef.delete()
    return res.json({ message: 'Reward deleted successfully' })
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to delete reward',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

// GET /api/crm/redemptions — view all student redemptions
router.get('/redemptions', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Firestore is not configured.' })

    const search = String(req.query.search || '').toLowerCase()
    const status = String(req.query.status || '').toUpperCase()
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10))
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit || '50'), 10)))

    const snap = await db.collection('redemptions').get()
    let redemptions = snap.docs.map((doc) => ({
      ...(doc.data() as RedemptionRecord),
      id: doc.id,
    }))

    if (status && status !== 'ALL') {
      redemptions = redemptions.filter((r) => r.status === status)
    }

    if (search) {
      redemptions = redemptions.filter(
        (r) =>
          r.userName.toLowerCase().includes(search) ||
          r.userEmail.toLowerCase().includes(search) ||
          r.rewardName.toLowerCase().includes(search) ||
          r.redemptionCode.toLowerCase().includes(search),
      )
    }

    redemptions.sort((a, b) => (b.redeemedAt || '').localeCompare(a.redeemedAt || ''))

    const total = redemptions.length
    const start = (page - 1) * limit
    const paginated = redemptions.slice(start, start + limit)

    return res.json({ total, page, limit, redemptions: paginated })
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch redemptions',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

// GET /api/crm/rewards/stats — full XP analytics, circulating supply, activity counts, top students
router.get('/rewards/stats', async (_req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Firestore is not configured.' })

    const [usersSnap, txSnap, badgesSnap, certSnap, redemptionsSnap] = await Promise.all([
      db.collection('users').where('role', '==', 'STUDENT').get(),
      db.collection('xpTransactions').get(),
      db.collection('userBadges').get(),
      db.collection('certificates').get(),
      db.collection('redemptions').get(),
    ])

    let totalCirculatingXp = 0
    const students: Array<{
      id: string
      fullName: string
      email: string
      collegeName: string
      xp: number
      level: number
      levelTitle: string
      badgesCount: number
      certificatesCount: number
      redemptionsCount: number
    }> = []

    const userBadgesCountMap: Record<string, number> = {}
    for (const b of badgesSnap.docs) {
      const uid = b.data().userId
      if (uid) userBadgesCountMap[uid] = (userBadgesCountMap[uid] || 0) + 1
    }

    const userCertCountMap: Record<string, number> = {}
    for (const c of certSnap.docs) {
      const uid = c.data().studentUid
      if (uid) userCertCountMap[uid] = (userCertCountMap[uid] || 0) + 1
    }

    const userRedemptionCountMap: Record<string, number> = {}
    for (const r of redemptionsSnap.docs) {
      const uid = r.data().userId
      if (uid) userRedemptionCountMap[uid] = (userRedemptionCountMap[uid] || 0) + 1
    }

    for (const doc of usersSnap.docs) {
      const u = doc.data() as AppUser
      const userXp = Number(u.xp || 0)
      totalCirculatingXp += userXp
      const lvl = calculateLevel(userXp)

      students.push({
        id: doc.id,
        fullName: u.fullName || 'Student',
        email: u.email || '',
        collegeName: u.collegeName || 'Unknown College',
        xp: userXp,
        level: lvl.level,
        levelTitle: lvl.title,
        badgesCount: userBadgesCountMap[doc.id] || 0,
        certificatesCount: userCertCountMap[doc.id] || 0,
        redemptionsCount: userRedemptionCountMap[doc.id] || 0,
      })
    }

    students.sort((a, b) => b.xp - a.xp)
    const topStudents = students.slice(0, 20)

    let totalEarnedXp = 0
    let totalRedeemedXp = 0
    const activityBreakdown: Record<string, { count: number; totalXp: number }> = {}

    for (const doc of txSnap.docs) {
      const tx = doc.data() as XpTransactionRecord
      const amount = Number(tx.amount || 0)
      const type = tx.activityType || 'OTHER'

      if (amount > 0) {
        totalEarnedXp += amount
      } else {
        totalRedeemedXp += Math.abs(amount)
      }

      if (!activityBreakdown[type]) {
        activityBreakdown[type] = { count: 0, totalXp: 0 }
      }
      activityBreakdown[type].count += 1
      activityBreakdown[type].totalXp += amount
    }

    return res.json({
      totalCirculatingXp,
      totalEarnedXp,
      totalRedeemedXp,
      totalStudents: students.length,
      totalBadgesIssued: badgesSnap.size,
      totalCertificatesIssued: certSnap.size,
      totalRedemptions: redemptionsSnap.size,
      activityBreakdown,
      topStudents,
    })
  } catch (error) {
    console.error('[GET /api/crm/rewards/stats] failed:', error)
    return res.status(500).json({
      error: 'Failed to fetch rewards statistics',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

// GET /api/crm/badges — system badges overview
router.get('/badges', async (_req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Firestore is not configured.' })

    const snap = await db.collection('userBadges').get()
    const badgeEarnedCountMap: Record<string, number> = {}

    for (const doc of snap.docs) {
      const b = doc.data() as UserBadgeRecord
      if (b.badgeId) {
        badgeEarnedCountMap[b.badgeId] = (badgeEarnedCountMap[b.badgeId] || 0) + 1
      }
    }

    const badges = BADGES_CATALOG.map((b) => ({
      ...b,
      unlockedCount: badgeEarnedCountMap[b.id] || 0,
    }))

    return res.json(badges)
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch badges',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

// POST /api/crm/badges/award — manually grant badge to student
const awardBadgeSchema = z.object({
  studentUid: z.string().min(1, 'Student UID is required'),
  badgeId: z.string().min(1, 'Badge ID is required'),
})

router.post('/badges/award', async (req, res) => {
  try {
    const parsed = awardBadgeSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    }

    if (!db) return res.status(500).json({ error: 'Firestore is not configured.' })

    const { studentUid, badgeId } = parsed.data
    const badgeDef = BADGES_CATALOG.find((b) => b.id === badgeId)
    if (!badgeDef) {
      return res.status(404).json({ error: 'Badge not found in catalog' })
    }

    const userDoc = await db.collection('users').doc(studentUid).get()
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Student not found' })
    }

    const badgeDocId = `${studentUid}_${badgeId}`
    const badgeRef = db.collection('userBadges').doc(badgeDocId)
    const existing = await badgeRef.get()
    if (existing.exists) {
      return res.status(409).json({ error: 'Student already has this badge' })
    }

    const record: UserBadgeRecord = {
      id: badgeDocId,
      userId: studentUid,
      badgeId: badgeDef.id,
      badgeName: badgeDef.name,
      badgeDescription: badgeDef.description,
      badgeCategory: badgeDef.category,
      badgeIcon: badgeDef.icon,
      awardedAt: new Date().toISOString(),
    }

    await badgeRef.set(record)
    return res.status(201).json({ message: `Badge "${badgeDef.name}" awarded successfully!`, badge: record })
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to award badge',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

export default router

import { Router } from 'express'
import { db } from '../firebase.js'
import { verifyFirebaseToken } from '../middleware/auth.js'
import { authorizeRoles } from '../middleware/roles.js'
import { logActivity } from '../services/activityLogger.js'

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

export default router

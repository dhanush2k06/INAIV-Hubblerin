import { Router } from 'express'
import { z } from 'zod'
import { db } from '../firebase.js'
import { verifyFirebaseToken } from '../middleware/auth.js'
import { authorizeRoles } from '../middleware/roles.js'
import {
  getStudentRewardsSummary,
  getMonthlyLeaderboard,
  redeemReward,
  equipCosmetic,
  submitEventFeedback,
  processReferral,
  issueCertificate,
} from '../services/rewardService.js'
import type { RewardItem, XpTransactionRecord, CertificateRecord } from '../types.js'

const router = Router()

// GET /api/rewards/store — public or authenticated list of active rewards
router.get('/store', async (_req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Firestore is not configured on the server.' })

    const snap = await db.collection('rewards').where('active', '==', true).get()
    const rewards = snap.docs.map((doc) => ({
      ...(doc.data() as RewardItem),
      id: doc.id,
    }))

    // Sort: lower cost first
    rewards.sort((a, b) => a.xpCost - b.xpCost)
    return res.json(rewards)
  } catch (error) {
    console.error('[GET /api/rewards/store] failed:', error)
    return res.status(500).json({
      error: 'Failed to fetch store rewards',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

// GET /api/rewards/leaderboard — monthly student and college leaderboards
router.get('/leaderboard', async (req, res) => {
  try {
    const month = String(req.query.month || '')
    const result = await getMonthlyLeaderboard(month || undefined)
    return res.json(result)
  } catch (error) {
    console.error('[GET /api/rewards/leaderboard] failed:', error)
    return res.status(500).json({
      error: 'Failed to fetch leaderboard',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

// All subsequent routes require STUDENT authentication
router.use(verifyFirebaseToken, authorizeRoles('STUDENT'))

// GET /api/rewards/me — student rewards profile summary
router.get('/me', async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const summary = await getStudentRewardsSummary(uid)
    return res.json(summary)
  } catch (error) {
    console.error('[GET /api/rewards/me] failed:', error)
    return res.status(500).json({
      error: 'Failed to fetch rewards profile',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

// POST /api/rewards/redeem/:rewardId — student redeems a reward
router.post('/redeem/:rewardId', async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  const rewardId = String(req.params.rewardId)

  if (!uid) return res.status(401).json({ error: 'Unauthorized' })
  if (!rewardId) return res.status(400).json({ error: 'Reward ID is required' })

  try {
    const result = await redeemReward(uid, rewardId)
    return res.json(result)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return res.status(400).json({ error: msg })
  }
})

// POST /api/rewards/equip — equip cosmetic theme, frame, or title
const equipSchema = z.object({
  type: z.enum(['THEME', 'FRAME', 'TITLE']),
  value: z.string().nullable().optional(),
})

router.post('/equip', async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const parsed = equipSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    }

    const { type, value } = parsed.data
    const result = await equipCosmetic(uid, type, value ?? null)
    return res.json(result)
  } catch (error) {
    return res.status(400).json({
      error: 'Failed to update cosmetic',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

// GET /api/rewards/certificates — student certificates
router.get('/certificates', async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })

  try {
    if (!db) return res.status(500).json({ error: 'Firestore is not configured.' })
    const snap = await db.collection('certificates').where('studentUid', '==', uid).get()
    const certificates = snap.docs.map((doc) => doc.data() as CertificateRecord)
    certificates.sort((a, b) => (b.issuedAt || '').localeCompare(a.issuedAt || ''))
    return res.json(certificates)
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch certificates',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

// POST /api/rewards/certificates/claim/:eventId — claim certificate for an attended event
router.post('/certificates/claim/:eventId', async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  const eventId = String(req.params.eventId)
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })

  try {
    if (!db) return res.status(500).json({ error: 'Firestore is not configured.' })

    // Check user registration & attendance
    const userEventsDoc = await db.collection('userEvents').doc(uid).get()
    const registered = (userEventsDoc.data()?.registered ?? []) as Array<{ eventId: string; attended?: boolean }>
    const record = registered.find((r) => r.eventId === eventId)

    if (!record) {
      return res.status(404).json({ error: 'You are not registered for this event.' })
    }

    const certResult = await issueCertificate(uid, eventId)
    return res.json({
      message: 'Certificate generated successfully!',
      certificate: certResult.certificate,
      xpEarned: certResult.xpEarned,
    })
  } catch (error) {
    return res.status(400).json({
      error: 'Failed to claim certificate',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

// POST /api/rewards/feedback — submit feedback for an event
const feedbackSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  rating: z.number().int().min(1).max(5),
  feedbackText: z.string().min(5, 'Please provide detailed feedback (min 5 chars)'),
})

router.post('/feedback', async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const parsed = feedbackSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    }

    const { eventId, rating, feedbackText } = parsed.data
    const result = await submitEventFeedback(uid, eventId, rating, feedbackText)
    if (!result.success) {
      return res.status(409).json({ error: result.message })
    }

    return res.status(201).json(result)
  } catch (error) {
    return res.status(400).json({
      error: 'Failed to submit feedback',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

// POST /api/rewards/referral — apply referral code
const referralSchema = z.object({
  referralCode: z.string().min(3, 'Invalid referral code'),
})

router.post('/referral', async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const parsed = referralSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    }

    const result = await processReferral(uid, parsed.data.referralCode)
    if (!result.success) {
      return res.status(400).json({ error: result.message })
    }

    return res.json(result)
  } catch (error) {
    return res.status(400).json({
      error: 'Failed to apply referral',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

// GET /api/rewards/transactions — student XP transaction history
router.get('/transactions', async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })

  try {
    if (!db) return res.status(500).json({ error: 'Firestore is not configured.' })
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10))
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)))

    const snap = await db.collection('xpTransactions').where('userId', '==', uid).get()
    const transactions = snap.docs.map((doc) => doc.data() as XpTransactionRecord)
    transactions.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))

    const total = transactions.length
    const start = (page - 1) * limit
    const paginated = transactions.slice(start, start + limit)

    return res.json({ total, page, limit, transactions: paginated })
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch transactions',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

export default router

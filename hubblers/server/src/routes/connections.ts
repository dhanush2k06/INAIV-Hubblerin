import { Router } from 'express'
import { z } from 'zod'
import { verifyFirebaseToken } from '../middleware/auth.js'
import {
  searchUsers,
  getPublicProfile,
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  cancelConnectionRequest,
  removeConnection,
  toggleFollow,
  getMyConnections,
  updatePrivacySettings,
} from '../services/connectionService.js'
import { db } from '../firebase.js'
import { DEFAULT_PRIVACY_SETTINGS } from '../utils/hubblerId.js'
import type { AppUser } from '../types.js'

const router = Router()

// GET /api/connections/search?q=... — Search users (publicly or authenticated)
router.get('/search', async (req, res) => {
  try {
    const q = String(req.query.q || '')
    if (!q.trim()) {
      return res.json([])
    }

    // Extract uid if optional auth header is present
    let currentUid: string | undefined = undefined
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split('Bearer ')[1]
        const { auth: fbAuth } = await import('../firebase.js')
        if (fbAuth) {
          const decoded = await fbAuth.verifyIdToken(token)
          currentUid = decoded.uid
        }
      } catch {
        // Continue unauthenticated
      }
    }

    const results = await searchUsers(q, currentUid)
    return res.json(results)
  } catch (error) {
    console.error('[GET /api/connections/search] failed:', error)
    return res.status(500).json({ error: 'Failed to search users' })
  }
})

// GET /api/connections/profile/:hubblerId — Public user profile
router.get('/profile/:hubblerId', async (req, res) => {
  try {
    const hubblerId = String(req.params.hubblerId || '')
    if (!hubblerId.trim()) {
      return res.status(400).json({ error: 'HubblerID is required' })
    }

    let viewerUid: string | undefined = undefined
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split('Bearer ')[1]
        const { auth: fbAuth } = await import('../firebase.js')
        if (fbAuth) {
          const decoded = await fbAuth.verifyIdToken(token)
          viewerUid = decoded.uid
        }
      } catch {
        // Continue unauthenticated
      }
    }

    const profile = await getPublicProfile(hubblerId, viewerUid)
    if (!profile) {
      return res.status(404).json({ error: 'Hubbler profile not found' })
    }

    return res.json(profile)
  } catch (error) {
    console.error('[GET /api/connections/profile] failed:', error)
    return res.status(500).json({ error: 'Failed to fetch public profile' })
  }
})

// All subsequent routes require signed-in authentication
router.use(verifyFirebaseToken)

// GET /api/connections/my — Get my friends, pending requests, and followers
router.get('/my', async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const data = await getMyConnections(uid)
    return res.json(data)
  } catch (error) {
    console.error('[GET /api/connections/my] failed:', error)
    return res.status(500).json({ error: 'Failed to fetch connections' })
  }
})

// POST /api/connections/request/:targetHubblerId — Send friend request
router.post('/request/:targetHubblerId', async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  const targetHubblerId = String(req.params.targetHubblerId || '')
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })
  if (!targetHubblerId) return res.status(400).json({ error: 'Target HubblerID is required' })

  try {
    const result = await sendConnectionRequest(uid, targetHubblerId)
    return res.json(result)
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : String(error) })
  }
})

// POST /api/connections/accept/:connectionId — Accept friend request
router.post('/accept/:connectionId', async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  const connectionId = String(req.params.connectionId || '')
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })
  if (!connectionId) return res.status(400).json({ error: 'Connection ID is required' })

  try {
    const result = await acceptConnectionRequest(uid, connectionId)
    return res.json(result)
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : String(error) })
  }
})

// POST /api/connections/reject/:connectionId — Reject friend request
router.post('/reject/:connectionId', async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  const connectionId = String(req.params.connectionId || '')
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })
  if (!connectionId) return res.status(400).json({ error: 'Connection ID is required' })

  try {
    const result = await rejectConnectionRequest(uid, connectionId)
    return res.json(result)
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : String(error) })
  }
})

// POST /api/connections/cancel/:targetHubblerId — Cancel outgoing request
router.post('/cancel/:targetHubblerId', async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  const targetHubblerId = String(req.params.targetHubblerId || '')
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const result = await cancelConnectionRequest(uid, targetHubblerId)
    return res.json(result)
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : String(error) })
  }
})

// POST /api/connections/remove/:targetHubblerId — Remove friend
router.post('/remove/:targetHubblerId', async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  const targetHubblerId = String(req.params.targetHubblerId || '')
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const result = await removeConnection(uid, targetHubblerId)
    return res.json(result)
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : String(error) })
  }
})

// POST /api/connections/follow/:targetHubblerId — Follow / Unfollow toggle
router.post('/follow/:targetHubblerId', async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  const targetHubblerId = String(req.params.targetHubblerId || '')
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const result = await toggleFollow(uid, targetHubblerId)
    return res.json(result)
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : String(error) })
  }
})

// GET /api/connections/privacy — Get user's privacy settings
router.get('/privacy', async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })

  try {
    if (!db) return res.status(500).json({ error: 'Firestore is not configured' })
    const userDoc = await db.collection('users').doc(uid).get()
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' })

    const user = userDoc.data() as AppUser
    const privacy = user.privacy || { ...DEFAULT_PRIVACY_SETTINGS }
    return res.json(privacy)
  } catch {
    return res.status(500).json({ error: 'Failed to fetch privacy settings' })
  }
})

// PUT /api/connections/privacy — Update user's privacy settings
const privacySchema = z.object({
  profileVisibility: z.enum(['PUBLIC', 'FRIENDS_ONLY', 'PRIVATE']).optional(),
  showXp: z.boolean().optional(),
  showCertificates: z.boolean().optional(),
  showEventHistory: z.boolean().optional(),
  allowConnectionRequests: z.boolean().optional(),
  autoPostAchievements: z.boolean().optional(),
})

router.put('/privacy', async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const parsed = privacySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    }

    const updated = await updatePrivacySettings(uid, parsed.data)
    return res.json({ message: 'Privacy settings updated', privacy: updated })
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : String(error) })
  }
})

export default router

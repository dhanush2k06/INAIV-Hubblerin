import { Router } from 'express'
import { z } from 'zod'
import { verifyFirebaseToken } from '../middleware/auth.js'
import {
  getFeedPosts,
  toggleLikePost,
  addComment,
  getPostComments,
  deletePost,
} from '../services/postService.js'

const router = Router()

// GET /api/posts/feed?filter=ALL|FRIENDS|MY&page=1&limit=20 — Get social achievements feed
router.get('/feed', async (req, res) => {
  try {
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
        // Continue unauthenticated for public feed
      }
    }

    const filter = (String(req.query.filter || 'ALL').toUpperCase()) as 'ALL' | 'FRIENDS' | 'MY'
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10))
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10)))

    const result = await getFeedPosts(currentUid, filter, page, limit)
    return res.json(result)
  } catch (error) {
    console.error('[GET /api/posts/feed] failed:', error)
    return res.status(500).json({ error: 'Failed to fetch social feed' })
  }
})

// GET /api/posts/:postId/comments — Get comments for a post
router.get('/:postId/comments', async (req, res) => {
  try {
    const postId = String(req.params.postId)
    const comments = await getPostComments(postId)
    return res.json(comments)
  } catch (error) {
    console.error('[GET /api/posts/:postId/comments] failed:', error)
    return res.status(500).json({ error: 'Failed to fetch comments' })
  }
})

// All subsequent routes require signed-in authentication
router.use(verifyFirebaseToken)

// POST /api/posts/:postId/like — Like / Cheer an achievement post
router.post('/:postId/like', async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  const postId = String(req.params.postId)
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const result = await toggleLikePost(postId, uid)
    return res.json(result)
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : String(error) })
  }
})

// POST /api/posts/:postId/comments — Add a comment to an achievement post
const commentSchema = z.object({
  text: z.string().min(1, 'Comment text cannot be empty').max(500, 'Comment too long (max 500 chars)'),
})

router.post('/:postId/comments', async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  const postId = String(req.params.postId)
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const parsed = commentSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    }

    const comment = await addComment(postId, uid, parsed.data.text)
    return res.status(201).json(comment)
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : String(error) })
  }
})

// DELETE /api/posts/:postId — Delete a post (author or admin)
router.delete('/:postId', async (req, res) => {
  const user = (req as { user?: { firebaseUid: string; role: string } }).user
  if (!user?.firebaseUid) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const postId = String(req.params.postId)
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPPORT'
    const success = await deletePost(postId, user.firebaseUid, isAdmin)
    return res.json({ success, message: 'Post deleted successfully' })
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : String(error) })
  }
})

export default router

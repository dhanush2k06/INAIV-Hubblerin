import { db } from '../firebase.js'
import { ensureUserHubblerId } from '../utils/hubblerId.js'
import type {
  AchievementPostRecord,
  AppUser,
  PostCommentRecord,
  PostType,
} from '../types.js'

function nowIso(): string {
  return new Date().toISOString()
}

/**
 * Creates an automated achievement post on behalf of a verified student action.
 * Enforces server-side authentication and checks the user's autoPostAchievements privacy setting.
 */
export async function createAchievementPost(
  authorUid: string,
  params: {
    type: PostType
    achievementTitle: string
    achievementDescription: string
    achievementIcon: string
    meta?: Record<string, unknown>
    xpEarned?: number
    referenceId?: string
    visibility?: 'PUBLIC' | 'FRIENDS' | 'FOLLOWERS' | 'PRIVATE'
  },
): Promise<AchievementPostRecord | null> {
  if (!db) return null

  try {
    const userDoc = await db.collection('users').doc(authorUid).get()
    if (!userDoc.exists) return null

    const userData = userDoc.data() as AppUser
    const { hubblerId, privacy } = await ensureUserHubblerId(authorUid, userData)

    // Respect user's privacy setting for auto-posting
    if (privacy.autoPostAchievements === false) {
      return null
    }

    // Determine deterministic doc ID if referenceId provided to prevent duplicate spam
    const docId = params.referenceId
      ? `post_${params.type}_${authorUid}_${params.referenceId}`
      : db.collection('posts').doc().id

    const postRef = db.collection('posts').doc(docId)
    const existing = await postRef.get()
    if (existing.exists) {
      return existing.data() as AchievementPostRecord
    }

    // Default visibility depends on user privacy
    let visibility = params.visibility
    if (!visibility) {
      visibility = privacy.profileVisibility === 'FRIENDS_ONLY' ? 'FRIENDS' : 'PUBLIC'
    }

    const post: AchievementPostRecord = {
      id: docId,
      authorUid,
      authorHubblerId: hubblerId,
      authorName: userData.fullName || 'Hubbler Student',
      authorImage: userData.profileImage || null,
      authorCollege: userData.collegeName || 'HubblerX Network',
      authorFrame: userData.activeFrame || null,
      authorTitle: userData.activeTitle || null,
      type: params.type,
      achievementTitle: params.achievementTitle,
      achievementDescription: params.achievementDescription,
      achievementIcon: params.achievementIcon,
      meta: params.meta || {},
      xpEarned: params.xpEarned || 0,
      visibility,
      likesCount: 0,
      likes: [],
      commentsCount: 0,
      createdAt: nowIso(),
    }

    await postRef.set(post)
    return post
  } catch (error) {
    console.error('[postService] createAchievementPost failed:', error)
    return null
  }
}

/**
 * Fetches feed posts with social context (isLiked, comments count, filter).
 */
export async function getFeedPosts(
  currentUid?: string,
  filter: 'ALL' | 'FRIENDS' | 'MY' = 'ALL',
  page = 1,
  limit = 20,
): Promise<{ posts: (AchievementPostRecord & { isLiked: boolean })[]; total: number; page: number }> {
  if (!db) return { posts: [], total: 0, page }

  try {
    const postsQuery = db.collection('posts').orderBy('createdAt', 'desc')

    let allowedAuthorUids: Set<string> | null = null

    if (filter === 'MY' && currentUid) {
      allowedAuthorUids = new Set([currentUid])
    } else if (filter === 'FRIENDS' && currentUid) {
      // Find connected friends and followed users
      const [connSnap1, connSnap2, followSnap] = await Promise.all([
        db.collection('connections').where('user1', '==', currentUid).where('status', '==', 'ACCEPTED').get(),
        db.collection('connections').where('user2', '==', currentUid).where('status', '==', 'ACCEPTED').get(),
        db.collection('follows').where('followerUid', '==', currentUid).get(),
      ])

      const friendUids = new Set<string>([currentUid])
      for (const doc of connSnap1.docs) {
        const d = doc.data()
        friendUids.add(d.user2)
      }
      for (const doc of connSnap2.docs) {
        const d = doc.data()
        friendUids.add(d.user1)
      }
      for (const doc of followSnap.docs) {
        const d = doc.data()
        friendUids.add(d.targetUid)
      }

      allowedAuthorUids = friendUids
    }

    const snap = await postsQuery.limit(100).get()
    let posts = snap.docs.map((d) => d.data() as AchievementPostRecord)

    // Apply author filtering if needed
    if (allowedAuthorUids) {
      posts = posts.filter((p) => allowedAuthorUids!.has(p.authorUid))
    }

    // Filter out PRIVATE posts unless author is current user
    posts = posts.filter((p) => {
      if (p.visibility === 'PRIVATE') return p.authorUid === currentUid
      return true
    })

    const total = posts.length
    const start = (page - 1) * limit
    const paginated = posts.slice(start, start + limit)

    const enhanced = paginated.map((p) => ({
      ...p,
      isLiked: currentUid ? (p.likes || []).includes(currentUid) : false,
    }))

    return { posts: enhanced, total, page }
  } catch (error) {
    console.error('[postService] getFeedPosts failed:', error)
    return { posts: [], total: 0, page }
  }
}

/**
 * Toggles a like/cheer on a post.
 */
export async function toggleLikePost(
  postId: string,
  currentUid: string,
): Promise<{ success: boolean; isLiked: boolean; likesCount: number }> {
  if (!db) throw new Error('Firestore not initialized')

  const postRef = db.collection('posts').doc(postId)
  let isLiked = false
  let likesCount = 0

  await db.runTransaction(async (transaction) => {
    const postDoc = await transaction.get(postRef)
    if (!postDoc.exists) {
      throw new Error('Post not found')
    }

    const post = postDoc.data() as AchievementPostRecord
    const likes = post.likes || []
    const existingIndex = likes.indexOf(currentUid)

    if (existingIndex > -1) {
      likes.splice(existingIndex, 1)
      isLiked = false
    } else {
      likes.push(currentUid)
      isLiked = true
    }

    likesCount = likes.length
    transaction.update(postRef, {
      likes,
      likesCount,
    })
  })

  return { success: true, isLiked, likesCount }
}

/**
 * Adds a comment to an achievement post.
 */
export async function addComment(
  postId: string,
  authorUid: string,
  text: string,
): Promise<PostCommentRecord> {
  if (!db) throw new Error('Firestore not initialized')
  if (!text || !text.trim()) throw new Error('Comment text is required')

  const userDoc = await db.collection('users').doc(authorUid).get()
  if (!userDoc.exists) throw new Error('User not found')

  const userData = userDoc.data() as AppUser
  const { hubblerId } = await ensureUserHubblerId(authorUid, userData)

  const commentRef = db.collection('postComments').doc()
  const commentRecord: PostCommentRecord = {
    id: commentRef.id,
    postId,
    authorUid,
    authorHubblerId: hubblerId,
    authorName: userData.fullName || 'Hubbler Student',
    authorImage: userData.profileImage || null,
    authorTitle: userData.activeTitle || null,
    text: text.trim(),
    createdAt: nowIso(),
  }

  await commentRef.set(commentRecord)

  // Increment comment count on post
  const postRef = db.collection('posts').doc(postId)
  await postRef.update({
    commentsCount: (await postRef.get()).data()?.commentsCount ? ((await postRef.get()).data()?.commentsCount || 0) + 1 : 1,
  }).catch(() => {})

  return commentRecord
}

/**
 * Fetches all comments for a post.
 */
export async function getPostComments(postId: string): Promise<PostCommentRecord[]> {
  if (!db) return []

  try {
    const snap = await db.collection('postComments').where('postId', '==', postId).get()
    const comments = snap.docs.map((d) => d.data() as PostCommentRecord)
    comments.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
    return comments
  } catch (error) {
    console.error('[postService] getPostComments failed:', error)
    return []
  }
}

/**
 * Deletes a post (author or admin only).
 */
export async function deletePost(postId: string, currentUid: string, isAdmin = false): Promise<boolean> {
  if (!db) return false
  const postRef = db.collection('posts').doc(postId)
  const doc = await postRef.get()
  if (!doc.exists) return false

  const data = doc.data() as AchievementPostRecord
  if (data.authorUid !== currentUid && !isAdmin) {
    throw new Error('Unauthorized to delete this post')
  }

  await postRef.delete()
  return true
}

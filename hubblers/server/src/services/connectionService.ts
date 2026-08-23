import { db } from '../firebase.js'
import { calculateLevel } from './rewardService.js'
import { ensureUserHubblerId, DEFAULT_PRIVACY_SETTINGS } from '../utils/hubblerId.js'
import type {
  AppUser,
  CertificateRecord,
  ConnectionRecord,
  ConnectionStatus,
  FollowRecord,
  PublicUserProfile,
  UserBadgeRecord,
  UserPrivacySettings,
} from '../types.js'

function nowIso(): string {
  return new Date().toISOString()
}

function canonicalPair(uidA: string, uidB: string): { user1: string; user2: string; docId: string } {
  const [user1, user2] = uidA < uidB ? [uidA, uidB] : [uidB, uidA]
  return { user1, user2, docId: `conn_${user1}_${user2}` }
}

/**
 * Searches users by HubblerID, name, or college name.
 * Sanitizes all results to never expose email, phone, or raw Firebase UIDs.
 */
export async function searchUsers(
  query: string,
  currentUid?: string,
): Promise<
  Array<{
    hubblerId: string
    fullName: string
    collegeName: string
    profileImage: string | null
    activeTitle: string | null
    activeFrame: string | null
    level: number
    badgeCount: number
    connectionStatus: ConnectionStatus
    isRequester: boolean
    isFollowing: boolean
    mutualCount: number
  }>
> {
  if (!db) return []
  const cleanQ = query.trim().toUpperCase()
  if (!cleanQ) return []

  try {
    const usersSnap = await db.collection('users').where('role', '==', 'STUDENT').get()
    const matchingDocs = usersSnap.docs.filter((doc) => {
      if (currentUid && doc.id === currentUid) return false // Skip self in general search
      const data = doc.data() as AppUser
      const hId = (data.hubblerId || '').toUpperCase()
      const name = (data.fullName || '').toUpperCase()
      const college = (data.collegeName || '').toUpperCase()

      return hId.includes(cleanQ) || name.includes(cleanQ) || college.includes(cleanQ)
    })

    // Limit search results to 20 for speed
    const selected = matchingDocs.slice(0, 20)
    const results: Array<{
      hubblerId: string
      fullName: string
      collegeName: string
      profileImage: string | null
      activeTitle: string | null
      activeFrame: string | null
      level: number
      badgeCount: number
      connectionStatus: ConnectionStatus
      isRequester: boolean
      isFollowing: boolean
      mutualCount: number
    }> = []

    for (const doc of selected) {
      const u = doc.data() as AppUser
      const { hubblerId, privacy } = await ensureUserHubblerId(doc.id, u)

      if (privacy.profileVisibility === 'PRIVATE') {
        // Skip private accounts from generic discovery search unless searching exact HubblerID
        if (cleanQ !== hubblerId.toUpperCase()) {
          continue
        }
      }

      let connectionStatus: ConnectionStatus = 'NONE'
      let isRequester = false
      let isFollowing = false
      let mutualCount = 0

      if (currentUid) {
        const { docId } = canonicalPair(currentUid, doc.id)
        const [connDoc, followDoc, mutuals] = await Promise.all([
          db.collection('connections').doc(docId).get(),
          db.collection('follows').doc(`follow_${currentUid}_${doc.id}`).get(),
          getMutualFriendUids(currentUid, doc.id),
        ])

        if (connDoc.exists) {
          const c = connDoc.data() as ConnectionRecord
          connectionStatus = c.status
          isRequester = c.requesterUid === currentUid
        }
        isFollowing = followDoc.exists
        mutualCount = mutuals.length
      }

      // Count badges
      const badgesSnap = await db.collection('userBadges').where('userId', '==', doc.id).get()
      const levelInfo = calculateLevel(u.xp || 0)

      results.push({
        hubblerId,
        fullName: u.fullName || 'Student',
        collegeName: u.collegeName || 'HubblerX Partner College',
        profileImage: u.profileImage || null,
        activeTitle: u.activeTitle || null,
        activeFrame: u.activeFrame || null,
        level: levelInfo.level,
        badgeCount: badgesSnap.size,
        connectionStatus,
        isRequester,
        isFollowing,
        mutualCount,
      })
    }

    return results
  } catch (error) {
    console.error('[connectionService] searchUsers failed:', error)
    return []
  }
}

/**
 * Retrieves public profile details for a given HubblerID.
 */
export async function getPublicProfile(
  targetHubblerId: string,
  viewerUid?: string,
): Promise<PublicUserProfile | null> {
  if (!db) return null

  try {
    const snap = await db
      .collection('users')
      .where('hubblerId', '==', targetHubblerId.trim().toUpperCase())
      .limit(1)
      .get()

    if (snap.empty) return null

    const targetDoc = snap.docs[0]
    const targetUid = targetDoc.id
    const user = targetDoc.data() as AppUser
    const { hubblerId, privacy } = await ensureUserHubblerId(targetUid, user)

    const isSelf = viewerUid === targetUid

    let connectionStatus: ConnectionStatus = 'NONE'
    let isFollowing = false
    let mutualUids: string[] = []

    if (viewerUid && !isSelf) {
      const { docId } = canonicalPair(viewerUid, targetUid)
      const [connDoc, followDoc, mutuals] = await Promise.all([
        db.collection('connections').doc(docId).get(),
        db.collection('follows').doc(`follow_${viewerUid}_${targetUid}`).get(),
        getMutualFriendUids(viewerUid, targetUid),
      ])

      if (connDoc.exists) {
        connectionStatus = (connDoc.data() as ConnectionRecord).status
      }
      isFollowing = followDoc.exists
      mutualUids = mutuals
    }

    const isConnected = connectionStatus === 'ACCEPTED' || isSelf
    const levelInfo = calculateLevel(user.xp || 0)

    // Load badges
    const badgesSnap = await db.collection('userBadges').where('userId', '==', targetUid).get()
    const badges = badgesSnap.docs.map((d) => {
      const b = d.data() as UserBadgeRecord
      return {
        id: b.badgeId,
        name: b.badgeName,
        description: b.badgeDescription,
        icon: b.badgeIcon,
        category: b.badgeCategory,
      }
    })

    // Load certificates if permitted
    let certificates: PublicUserProfile['certificates'] = undefined
    if (isSelf || privacy.showCertificates || (privacy.profileVisibility === 'FRIENDS_ONLY' && isConnected)) {
      const certSnap = await db.collection('certificates').where('studentUid', '==', targetUid).get()
      certificates = certSnap.docs.map((d) => {
        const c = d.data() as CertificateRecord
        return {
          id: c.id,
          eventTitle: c.eventTitle,
          eventCategory: c.eventCategory,
          issuedAt: c.issuedAt,
          verificationCode: c.verificationCode,
        }
      })
    }

    // Load event participation count if permitted
    let eventCount: number | undefined = undefined
    if (isSelf || privacy.showEventHistory || (privacy.profileVisibility === 'FRIENDS_ONLY' && isConnected)) {
      const userEventsDoc = await db.collection('userEvents').doc(targetUid).get()
      const registered = (userEventsDoc.data()?.registered ?? []) as Array<{ eventId: string }>
      eventCount = registered.length
    }

    // Resolve mutual connections summaries
    const mutualConnections: PublicUserProfile['mutualConnections'] = []
    if (mutualUids.length > 0) {
      for (const mUid of mutualUids.slice(0, 5)) {
        const mDoc = await db.collection('users').doc(mUid).get()
        if (mDoc.exists) {
          const mData = mDoc.data() as AppUser
          mutualConnections.push({
            hubblerId: mData.hubblerId || 'HX-000000',
            fullName: mData.fullName || 'Student',
            profileImage: mData.profileImage || null,
          })
        }
      }
    }

    // Load recent posts by this user
    const postsSnap = await db
      .collection('posts')
      .where('authorUid', '==', targetUid)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get()

    const recentPosts = postsSnap.docs.map((d) => d.data() as any)

    return {
      hubblerId,
      fullName: user.fullName || 'Hubbler Student',
      collegeName: user.collegeName || 'HubblerX Partner Institution',
      department: user.department || null,
      degree: user.degree || null,
      branch: user.branch || null,
      year: user.year || null,
      profileImage: user.profileImage || null,
      activeTitle: user.activeTitle || null,
      activeFrame: user.activeFrame || null,
      activeTheme: user.activeTheme || null,
      level: levelInfo.level,
      levelTitle: levelInfo.title,
      levelIcon: levelInfo.icon,
      xp: isSelf || privacy.showXp ? user.xp : undefined,
      badgeCount: badges.length,
      badges,
      certificates,
      eventCount,
      connectionStatus,
      isFollowing,
      mutualCount: mutualUids.length,
      mutualConnections,
      privacySettings: isSelf ? privacy : undefined,
      recentPosts,
      createdAt: user.createdAt || nowIso(),
    }
  } catch (error) {
    console.error('[connectionService] getPublicProfile failed:', error)
    return null
  }
}

/**
 * Computes mutual friend UIDs between two users.
 */
async function getMutualFriendUids(uid1: string, uid2: string): Promise<string[]> {
  if (!db) return []

  const [u1Conn1, u1Conn2, u2Conn1, u2Conn2] = await Promise.all([
    db.collection('connections').where('user1', '==', uid1).where('status', '==', 'ACCEPTED').get(),
    db.collection('connections').where('user2', '==', uid1).where('status', '==', 'ACCEPTED').get(),
    db.collection('connections').where('user1', '==', uid2).where('status', '==', 'ACCEPTED').get(),
    db.collection('connections').where('user2', '==', uid2).where('status', '==', 'ACCEPTED').get(),
  ])

  const u1Friends = new Set<string>()
  for (const d of u1Conn1.docs) u1Friends.add(d.data().user2)
  for (const d of u1Conn2.docs) u1Friends.add(d.data().user1)

  const u2Friends = new Set<string>()
  for (const d of u2Conn1.docs) u2Friends.add(d.data().user2)
  for (const d of u2Conn2.docs) u2Friends.add(d.data().user1)

  const mutuals: string[] = []
  for (const f of u1Friends) {
    if (u2Friends.has(f)) {
      mutuals.push(f)
    }
  }
  return mutuals
}

/**
 * Sends a connection request.
 */
export async function sendConnectionRequest(
  requesterUid: string,
  targetHubblerId: string,
): Promise<{ success: boolean; message: string; connectionId: string }> {
  if (!db) throw new Error('Firestore not initialized')

  const targetSnap = await db
    .collection('users')
    .where('hubblerId', '==', targetHubblerId.trim().toUpperCase())
    .limit(1)
    .get()

  if (targetSnap.empty) {
    throw new Error('User not found with this HubblerID')
  }

  const targetDoc = targetSnap.docs[0]
  const targetUid = targetDoc.id
  const targetUser = targetDoc.data() as AppUser

  if (targetUid === requesterUid) {
    throw new Error('You cannot send a connection request to yourself')
  }

  if (targetUser.privacy?.allowConnectionRequests === false) {
    throw new Error('This user is not accepting connection requests')
  }

  const { user1, user2, docId } = canonicalPair(requesterUid, targetUid)
  const connRef = db.collection('connections').doc(docId)
  const existing = await connRef.get()

  if (existing.exists) {
    const data = existing.data() as ConnectionRecord
    if (data.status === 'ACCEPTED') {
      return { success: true, message: 'You are already connected with this user', connectionId: docId }
    }
    if (data.status === 'PENDING') {
      if (data.requesterUid === requesterUid) {
        throw new Error('Connection request is already pending')
      } else {
        // If the other user already requested us, automatically accept!
        await connRef.update({
          status: 'ACCEPTED',
          updatedAt: nowIso(),
        })
        return { success: true, message: 'Connection request accepted! You are now connected.', connectionId: docId }
      }
    }
  }

  const record: ConnectionRecord = {
    id: docId,
    user1,
    user2,
    requesterUid,
    receiverUid: targetUid,
    status: 'PENDING',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }

  await connRef.set(record)
  return { success: true, message: 'Connection request sent successfully', connectionId: docId }
}

/**
 * Accepts an incoming connection request.
 */
export async function acceptConnectionRequest(
  receiverUid: string,
  connectionId: string,
): Promise<{ success: boolean; message: string }> {
  if (!db) throw new Error('Firestore not initialized')

  const connRef = db.collection('connections').doc(connectionId)
  const doc = await connRef.get()

  if (!doc.exists) {
    throw new Error('Connection request not found')
  }

  const data = doc.data() as ConnectionRecord
  if (data.receiverUid !== receiverUid) {
    throw new Error('You are not authorized to accept this connection request')
  }

  await connRef.update({
    status: 'ACCEPTED',
    updatedAt: nowIso(),
  })

  return { success: true, message: 'Connection request accepted!' }
}

/**
 * Rejects an incoming connection request.
 */
export async function rejectConnectionRequest(
  receiverUid: string,
  connectionId: string,
): Promise<{ success: boolean; message: string }> {
  if (!db) throw new Error('Firestore not initialized')

  const connRef = db.collection('connections').doc(connectionId)
  const doc = await connRef.get()

  if (!doc.exists) {
    throw new Error('Connection request not found')
  }

  const data = doc.data() as ConnectionRecord
  if (data.receiverUid !== receiverUid) {
    throw new Error('You are not authorized to reject this connection request')
  }

  await connRef.delete()
  return { success: true, message: 'Connection request rejected' }
}

/**
 * Cancels a pending outgoing request.
 */
export async function cancelConnectionRequest(
  requesterUid: string,
  targetHubblerId: string,
): Promise<{ success: boolean; message: string }> {
  if (!db) throw new Error('Firestore not initialized')

  const targetSnap = await db
    .collection('users')
    .where('hubblerId', '==', targetHubblerId.trim().toUpperCase())
    .limit(1)
    .get()

  if (targetSnap.empty) throw new Error('User not found')
  const targetUid = targetSnap.docs[0].id

  const { docId } = canonicalPair(requesterUid, targetUid)
  const connRef = db.collection('connections').doc(docId)
  const doc = await connRef.get()

  if (doc.exists) {
    await connRef.delete()
  }

  return { success: true, message: 'Connection request cancelled' }
}

/**
 * Removes an existing connection (unfriend).
 */
export async function removeConnection(
  currentUid: string,
  targetHubblerId: string,
): Promise<{ success: boolean; message: string }> {
  if (!db) throw new Error('Firestore not initialized')

  const targetSnap = await db
    .collection('users')
    .where('hubblerId', '==', targetHubblerId.trim().toUpperCase())
    .limit(1)
    .get()

  if (targetSnap.empty) throw new Error('User not found')
  const targetUid = targetSnap.docs[0].id

  const { docId } = canonicalPair(currentUid, targetUid)
  const connRef = db.collection('connections').doc(docId)
  await connRef.delete()

  return { success: true, message: 'Connection removed' }
}

/**
 * Toggles follow / unfollow.
 */
export async function toggleFollow(
  followerUid: string,
  targetHubblerId: string,
): Promise<{ success: boolean; isFollowing: boolean; message: string }> {
  if (!db) throw new Error('Firestore not initialized')

  const targetSnap = await db
    .collection('users')
    .where('hubblerId', '==', targetHubblerId.trim().toUpperCase())
    .limit(1)
    .get()

  if (targetSnap.empty) throw new Error('User not found')
  const targetUid = targetSnap.docs[0].id

  if (targetUid === followerUid) {
    throw new Error('You cannot follow yourself')
  }

  const followId = `follow_${followerUid}_${targetUid}`
  const followRef = db.collection('follows').doc(followId)
  const doc = await followRef.get()

  if (doc.exists) {
    await followRef.delete()
    return { success: true, isFollowing: false, message: 'Unfollowed user' }
  } else {
    const record: FollowRecord = {
      id: followId,
      followerUid,
      targetUid,
      createdAt: nowIso(),
    }
    await followRef.set(record)
    return { success: true, isFollowing: true, message: 'Following user' }
  }
}

/**
 * Retrieves all connection data for the logged-in student.
 */
export async function getMyConnections(currentUid: string): Promise<{
  friends: Array<{
    id: string
    status: 'ACCEPTED'
    isRequester: boolean
    createdAt: string
    updatedAt: string
    user: {
      hubblerId: string
      fullName: string
      collegeName: string
      profileImage: string | null
      activeTitle: string | null
      activeFrame: string | null
      level: number
      badgeCount: number
    }
    mutualCount: number
  }>
  pendingIncoming: Array<{
    id: string
    status: 'PENDING'
    isRequester: false
    createdAt: string
    updatedAt: string
    user: {
      hubblerId: string
      fullName: string
      collegeName: string
      profileImage: string | null
      activeTitle: string | null
      activeFrame: string | null
      level: number
      badgeCount: number
    }
    mutualCount: number
  }>
  pendingOutgoing: Array<{
    id: string
    status: 'PENDING'
    isRequester: true
    createdAt: string
    updatedAt: string
    user: {
      hubblerId: string
      fullName: string
      collegeName: string
      profileImage: string | null
      activeTitle: string | null
      activeFrame: string | null
      level: number
      badgeCount: number
    }
    mutualCount: number
  }>
  followers: Array<{
    hubblerId: string
    fullName: string
    collegeName: string
    profileImage: string | null
    activeTitle: string | null
    activeFrame: string | null
    level: number
    badgeCount: number
  }>
  following: Array<{
    hubblerId: string
    fullName: string
    collegeName: string
    profileImage: string | null
    activeTitle: string | null
    activeFrame: string | null
    level: number
    badgeCount: number
  }>
  counts: {
    friends: number
    pendingIncoming: number
    pendingOutgoing: number
    followers: number
    following: number
  }
}> {
  if (!db) {
    return {
      friends: [],
      pendingIncoming: [],
      pendingOutgoing: [],
      followers: [],
      following: [],
      counts: { friends: 0, pendingIncoming: 0, pendingOutgoing: 0, followers: 0, following: 0 },
    }
  }

  // Fetch connections where currentUid is user1 or user2
  const [connSnap1, connSnap2, followersSnap, followingSnap] = await Promise.all([
    db.collection('connections').where('user1', '==', currentUid).get(),
    db.collection('connections').where('user2', '==', currentUid).get(),
    db.collection('follows').where('targetUid', '==', currentUid).get(),
    db.collection('follows').where('followerUid', '==', currentUid).get(),
  ])

  const allConnDocs = [...connSnap1.docs, ...connSnap2.docs]

  const friends: any[] = []
  const pendingIncoming: any[] = []
  const pendingOutgoing: any[] = []

  for (const doc of allConnDocs) {
    const c = doc.data() as ConnectionRecord
    const partnerUid = c.user1 === currentUid ? c.user2 : c.user1
    const isRequester = c.requesterUid === currentUid

    const partnerDoc = await db.collection('users').doc(partnerUid).get()
    if (!partnerDoc.exists) continue

    const partner = partnerDoc.data() as AppUser
    const { hubblerId } = await ensureUserHubblerId(partnerUid, partner)
    const levelInfo = calculateLevel(partner.xp || 0)
    const badgesSnap = await db.collection('userBadges').where('userId', '==', partnerUid).get()
    const mutuals = await getMutualFriendUids(currentUid, partnerUid)

    const item = {
      id: c.id,
      status: c.status,
      isRequester,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      user: {
        hubblerId,
        fullName: partner.fullName || 'Student',
        collegeName: partner.collegeName || 'HubblerX Network',
        profileImage: partner.profileImage || null,
        activeTitle: partner.activeTitle || null,
        activeFrame: partner.activeFrame || null,
        level: levelInfo.level,
        badgeCount: badgesSnap.size,
      },
      mutualCount: mutuals.length,
    }

    if (c.status === 'ACCEPTED') {
      friends.push(item)
    } else if (c.status === 'PENDING') {
      if (isRequester) {
        pendingOutgoing.push(item)
      } else {
        pendingIncoming.push(item)
      }
    }
  }

  // Resolve followers list
  const followers: any[] = []
  for (const doc of followersSnap.docs) {
    const f = doc.data() as FollowRecord
    const fDoc = await db.collection('users').doc(f.followerUid).get()
    if (fDoc.exists) {
      const fUser = fDoc.data() as AppUser
      const { hubblerId } = await ensureUserHubblerId(f.followerUid, fUser)
      const levelInfo = calculateLevel(fUser.xp || 0)
      const badgesSnap = await db.collection('userBadges').where('userId', '==', f.followerUid).get()
      followers.push({
        hubblerId,
        fullName: fUser.fullName || 'Student',
        collegeName: fUser.collegeName || 'HubblerX Network',
        profileImage: fUser.profileImage || null,
        activeTitle: fUser.activeTitle || null,
        activeFrame: fUser.activeFrame || null,
        level: levelInfo.level,
        badgeCount: badgesSnap.size,
      })
    }
  }

  // Resolve following list
  const following: any[] = []
  for (const doc of followingSnap.docs) {
    const f = doc.data() as FollowRecord
    const fDoc = await db.collection('users').doc(f.targetUid).get()
    if (fDoc.exists) {
      const fUser = fDoc.data() as AppUser
      const { hubblerId } = await ensureUserHubblerId(f.targetUid, fUser)
      const levelInfo = calculateLevel(fUser.xp || 0)
      const badgesSnap = await db.collection('userBadges').where('userId', '==', f.targetUid).get()
      following.push({
        hubblerId,
        fullName: fUser.fullName || 'Student',
        collegeName: fUser.collegeName || 'HubblerX Network',
        profileImage: fUser.profileImage || null,
        activeTitle: fUser.activeTitle || null,
        activeFrame: fUser.activeFrame || null,
        level: levelInfo.level,
        badgeCount: badgesSnap.size,
      })
    }
  }

  return {
    friends,
    pendingIncoming,
    pendingOutgoing,
    followers,
    following,
    counts: {
      friends: friends.length,
      pendingIncoming: pendingIncoming.length,
      pendingOutgoing: pendingOutgoing.length,
      followers: followers.length,
      following: following.length,
    },
  }
}

/**
 * Updates a student's privacy settings.
 */
export async function updatePrivacySettings(
  uid: string,
  settings: Partial<UserPrivacySettings>,
): Promise<UserPrivacySettings> {
  if (!db) throw new Error('Firestore not initialized')

  const userRef = db.collection('users').doc(uid)
  const doc = await userRef.get()
  if (!doc.exists) throw new Error('User not found')

  const user = doc.data() as AppUser
  const currentPrivacy = user.privacy || { ...DEFAULT_PRIVACY_SETTINGS }
  const merged: UserPrivacySettings = {
    ...currentPrivacy,
    ...settings,
  }

  await userRef.update({
    privacy: merged,
    updatedAt: nowIso(),
  })

  return merged
}

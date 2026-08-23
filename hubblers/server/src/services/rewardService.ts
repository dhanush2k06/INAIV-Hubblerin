import { db } from '../firebase.js'
import {
  LEVELS,
  XP_VALUES,
  BADGES_CATALOG,
  INITIAL_REWARDS,
  type XpActivityType,
  type XpLevel,
  type BadgeDefinition,
} from '../rewardConfig.js'
import type {
  AppUser,
  CertificateRecord,
  EventFeedbackRecord,
  RedemptionRecord,
  RewardItem,
  UserBadgeRecord,
  XpTransactionRecord,
  EventCategory,
  FirestoreEvent,
  UserPrivacySettings,
} from '../types.js'
import { logActivity } from './activityLogger.js'
import { createAchievementPost } from './postService.js'
import { ensureUserHubblerId } from '../utils/hubblerId.js'

function currentMonthKey(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function nowIso(): string {
  return new Date().toISOString()
}

/**
 * Calculates level details and progress based on total XP
 */
export function calculateLevel(xp: number): {
  level: number
  title: string
  icon: string
  currentLevelMinXp: number
  nextLevelMinXp: number | null
  xpInLevel: number
  xpNeededForNext: number
  progressPercent: number
  perks: string
  badgeId: string
} {
  const safeXp = Math.max(0, Number(xp) || 0)
  let matchedLevel: XpLevel = LEVELS[0]

  for (const lvl of LEVELS) {
    if (safeXp >= lvl.minXp) {
      matchedLevel = lvl
    } else {
      break
    }
  }

  const nextLevel = LEVELS.find((l) => l.level === matchedLevel.level + 1)
  const nextMin = nextLevel ? nextLevel.minXp : null

  let progressPercent = 100
  let xpInLevel = safeXp - matchedLevel.minXp
  let xpNeededForNext = 0

  if (nextMin !== null) {
    const levelRange = nextMin - matchedLevel.minXp
    xpInLevel = safeXp - matchedLevel.minXp
    xpNeededForNext = Math.max(0, nextMin - safeXp)
    progressPercent = Math.min(100, Math.max(0, Math.round((xpInLevel / levelRange) * 100)))
  }

  return {
    level: matchedLevel.level,
    title: matchedLevel.title,
    icon: matchedLevel.icon,
    currentLevelMinXp: matchedLevel.minXp,
    nextLevelMinXp: nextMin,
    xpInLevel,
    xpNeededForNext,
    progressPercent,
    perks: matchedLevel.perks,
    badgeId: matchedLevel.badgeId,
  }
}

/**
 * Auto-seeds initial store rewards if empty
 */
export async function seedInitialRewards(): Promise<void> {
  if (!db) return
  try {
    const snap = await db.collection('rewards').limit(1).get()
    if (snap.empty) {
      console.log('[Rewards] Seeding initial MVP store rewards...')
      const batch = db.batch()
      const now = nowIso()
      for (const reward of INITIAL_REWARDS) {
        const docRef = db.collection('rewards').doc(reward.id)
        batch.set(docRef, {
          ...reward,
          createdAt: now,
          updatedAt: now,
        })
      }
      await batch.commit()
      console.log(`[Rewards] Successfully seeded ${INITIAL_REWARDS.length} store rewards.`)
    }
  } catch (err) {
    console.error('[Rewards] Failed to seed initial rewards:', err)
  }
}

/**
 * Awards XP for an activity with strict idempotency (no duplicates).
 */
export async function awardXpActivity(
  userId: string,
  activityType: XpActivityType,
  referenceId: string,
  customDescription?: string,
  meta?: Record<string, unknown>,
): Promise<{ success: boolean; xpEarned: number; newXp: number; level: number; duplicate: boolean }> {
  if (!db) throw new Error('Firestore is not configured.')
  if (!userId) throw new Error('User ID is required.')

  const amount = meta?.customAmount ? Number(meta.customAmount) : (XP_VALUES[activityType as keyof typeof XP_VALUES] ?? 0)
  if (amount <= 0) {
    return { success: false, xpEarned: 0, newXp: 0, level: 1, duplicate: false }
  }

  const txId = `xp_${userId}_${activityType}_${referenceId}`
  const monthKey = currentMonthKey()
  const txRef = db.collection('xpTransactions').doc(txId)
  const userRef = db.collection('users').doc(userId)

  let newXp = 0
  let previousXp = 0
  let isDuplicate = false

  await db.runTransaction(async (transaction) => {
    const [txDoc, userDoc] = await Promise.all([transaction.get(txRef), transaction.get(userRef)])

    if (txDoc.exists) {
      isDuplicate = true
      const userData = (userDoc.data() ?? {}) as AppUser
      newXp = userData.xp ?? 0
      previousXp = newXp
      return
    }

    const userData = (userDoc.data() ?? {}) as AppUser
    const currentXp = Number(userData.xp ?? 0)
    previousXp = currentXp
    newXp = currentXp + amount
    const levelInfo = calculateLevel(newXp)

    const txRecord: XpTransactionRecord = {
      id: txId,
      userId,
      activityType,
      amount,
      description: customDescription || `Earned +${amount} XP for ${activityType.toLowerCase()}`,
      referenceId,
      monthKey,
      balanceAfter: newXp,
      createdAt: nowIso(),
      meta: meta ?? {},
    }

    transaction.set(txRef, txRecord)
    transaction.update(userRef, {
      xp: newXp,
      level: levelInfo.level,
      updatedAt: nowIso(),
    })
  })

  if (!isDuplicate) {
    const prevLevel = calculateLevel(previousXp)
    const newLevel = calculateLevel(newXp)

    // Trigger Level-Up Post if promoted
    if (newLevel.level > prevLevel.level) {
      createAchievementPost(userId, {
        type: 'LEVEL_UP',
        achievementTitle: `Level Up! Reached Level ${newLevel.level}: ${newLevel.title}`,
        achievementDescription: `Advanced to Level ${newLevel.level} on HubblerX with ${newXp} Total XP. Perks unlocked: ${newLevel.perks}`,
        achievementIcon: newLevel.icon,
        xpEarned: amount,
        referenceId: `lvl_${newLevel.level}`,
        meta: { level: newLevel.level, title: newLevel.title },
      }).catch((err) => console.error('[Post] Level up post error:', err))
    }

    // Trigger Competition Win post
    if (activityType === 'COMPETITION') {
      createAchievementPost(userId, {
        type: 'COMPETITION_WIN',
        achievementTitle: 'Campus Competition Achievement',
        achievementDescription: customDescription || `Successfully competed in campus event and earned +${amount} XP!`,
        achievementIcon: '🏆',
        xpEarned: amount,
        referenceId,
      }).catch((err) => console.error('[Post] Competition post error:', err))
    }

    // Trigger Volunteer Hero post
    if (activityType === 'VOLUNTEERING') {
      createAchievementPost(userId, {
        type: 'VOLUNTEER_HERO',
        achievementTitle: 'Volunteer Champion Service',
        achievementDescription: customDescription || `Contributed verified campus community volunteer leadership and earned +${amount} XP!`,
        achievementIcon: '🌟',
        xpEarned: amount,
        referenceId,
      }).catch((err) => console.error('[Post] Volunteer post error:', err))
    }

    // Evaluate milestone badges asynchronously
    evaluateBadges(userId).catch((err) => console.error(`[Badges] Error evaluating badges for ${userId}:`, err))

    await logActivity({
      userId,
      role: 'STUDENT',
      type: 'XP_AWARD',
      description: `Earned +${amount} XP (${activityType})`,
      meta: { activityType, amount, referenceId, newXp },
    })
  }

  const levelInfo = calculateLevel(newXp)
  return {
    success: true,
    xpEarned: isDuplicate ? 0 : amount,
    newXp,
    level: levelInfo.level,
    duplicate: isDuplicate,
  }
}

/**
 * Reverts an XP activity (e.g. when unregistering from an event).
 */
export async function revertXpActivity(
  userId: string,
  activityType: XpActivityType,
  referenceId: string,
): Promise<{ success: boolean; xpDeducted: number; newXp: number }> {
  if (!db) throw new Error('Firestore is not configured.')

  const txId = `xp_${userId}_${activityType}_${referenceId}`
  const txRef = db.collection('xpTransactions').doc(txId)
  const userRef = db.collection('users').doc(userId)

  let xpDeducted = 0
  let newXp = 0

  await db.runTransaction(async (transaction) => {
    const [txDoc, userDoc] = await Promise.all([transaction.get(txRef), transaction.get(userRef)])

    if (!txDoc.exists) {
      return
    }

    const txData = txDoc.data() as XpTransactionRecord
    xpDeducted = txData.amount ?? 0
    const userData = (userDoc.data() ?? {}) as AppUser
    const currentXp = Number(userData.xp ?? 0)
    newXp = Math.max(0, currentXp - xpDeducted)
    const levelInfo = calculateLevel(newXp)

    transaction.delete(txRef)
    transaction.update(userRef, {
      xp: newXp,
      level: levelInfo.level,
      updatedAt: nowIso(),
    })
  })

  return { success: true, xpDeducted, newXp }
}

/**
 * Evaluates and awards all milestone and activity badges for a student without duplicates.
 */
export async function evaluateBadges(userId: string): Promise<UserBadgeRecord[]> {
  if (!db) return []

  const [userDoc, userEventsDoc, feedbackSnap, certSnap, existingBadgesSnap, redemptionsSnap] = await Promise.all([
    db.collection('users').doc(userId).get(),
    db.collection('userEvents').doc(userId).get(),
    db.collection('eventFeedback').where('studentUid', '==', userId).get(),
    db.collection('certificates').where('studentUid', '==', userId).get(),
    db.collection('userBadges').where('userId', '==', userId).get(),
    db.collection('redemptions').where('userId', '==', userId).get(),
  ])

  if (!userDoc.exists) return []

  const user = userDoc.data() as AppUser
  const registeredEvents = (userEventsDoc.data()?.registered ?? []) as Array<{ eventId: string; attended?: boolean }>
  const attendedCount = registeredEvents.filter((r) => r.attended).length
  const totalEventsCount = registeredEvents.length
  const feedbackCount = feedbackSnap.size
  const certCount = certSnap.size
  const redemptionCount = redemptionsSnap.size

  // Fetch count of referred users
  const referralSnap = await db.collection('users').where('referredBy', '==', userId).get()
  const referralCount = referralSnap.size

  const existingBadgeIds = new Set(existingBadgesSnap.docs.map((d) => d.data().badgeId))
  const newBadgesToAward: BadgeDefinition[] = []

  // Check milestone conditions
  if ((totalEventsCount >= 1 || attendedCount >= 1) && !existingBadgeIds.has('FIRST_STEP')) {
    const badge = BADGES_CATALOG.find((b) => b.id === 'FIRST_STEP')
    if (badge) newBadgesToAward.push(badge)
  }

  if (attendedCount >= 5 && !existingBadgeIds.has('EVENT_ENTHUSIAST')) {
    const badge = BADGES_CATALOG.find((b) => b.id === 'EVENT_ENTHUSIAST')
    if (badge) newBadgesToAward.push(badge)
  }

  if (attendedCount >= 10 && !existingBadgeIds.has('EVENT_VETERAN')) {
    const badge = BADGES_CATALOG.find((b) => b.id === 'EVENT_VETERAN')
    if (badge) newBadgesToAward.push(badge)
  }

  if (feedbackCount >= 3 && !existingBadgeIds.has('FEEDBACK_GURU')) {
    const badge = BADGES_CATALOG.find((b) => b.id === 'FEEDBACK_GURU')
    if (badge) newBadgesToAward.push(badge)
  }

  if (certCount >= 3 && !existingBadgeIds.has('CERTIFIED_ACHIEVER')) {
    const badge = BADGES_CATALOG.find((b) => b.id === 'CERTIFIED_ACHIEVER')
    if (badge) newBadgesToAward.push(badge)
  }

  if (referralCount >= 1 && !existingBadgeIds.has('NETWORK_BUILDER')) {
    const badge = BADGES_CATALOG.find((b) => b.id === 'NETWORK_BUILDER')
    if (badge) newBadgesToAward.push(badge)
  }

  if (redemptionCount >= 1 && !existingBadgeIds.has('COLLECTOR')) {
    const badge = BADGES_CATALOG.find((b) => b.id === 'COLLECTOR')
    if (badge) newBadgesToAward.push(badge)
  }

  // Award level badge if not present
  const levelInfo = calculateLevel(user.xp ?? 0)
  if (levelInfo.level >= 2 && !existingBadgeIds.has(`LEVEL_${levelInfo.level}`)) {
    newBadgesToAward.push({
      id: `LEVEL_${levelInfo.level}`,
      name: `Level ${levelInfo.level}: ${levelInfo.title}`,
      description: `Reached Level ${levelInfo.level} on HubblerX`,
      icon: levelInfo.icon,
      category: 'ACHIEVEMENT',
      criteria: `Reach Level ${levelInfo.level}`,
    })
  }

  const awardedRecords: UserBadgeRecord[] = []
  if (newBadgesToAward.length > 0) {
    const batch = db.batch()
    const now = nowIso()

    for (const b of newBadgesToAward) {
      const badgeDocId = `${userId}_${b.id}`
      const badgeDocRef = db.collection('userBadges').doc(badgeDocId)
      const record: UserBadgeRecord = {
        id: badgeDocId,
        userId,
        badgeId: b.id,
        badgeName: b.name,
        badgeDescription: b.description,
        badgeCategory: b.category,
        badgeIcon: b.icon,
        awardedAt: now,
      }
      batch.set(badgeDocRef, record)
      awardedRecords.push(record)
    }

    await batch.commit()

    // Trigger automated achievement post for each newly awarded badge
    for (const b of newBadgesToAward) {
      createAchievementPost(userId, {
        type: 'BADGE_EARNED',
        achievementTitle: `New Badge Unlocked: ${b.name}`,
        achievementDescription: b.description,
        achievementIcon: b.icon,
        referenceId: `badge_${b.id}`,
        meta: { badgeId: b.id, category: b.category },
      }).catch((err) => console.error('[Post] Badge post error:', err))
    }
  }

  return awardedRecords
}

/**
 * Issues an official certificate for an event and awards +25 XP
 */
export async function issueCertificate(
  studentUid: string,
  eventId: string,
): Promise<{ certificate: CertificateRecord; xpEarned: number }> {
  if (!db) throw new Error('Firestore is not configured.')

  const certDocId = `cert_${studentUid}_${eventId}`
  const certRef = db.collection('certificates').doc(certDocId)
  const certSnap = await certRef.get()

  if (certSnap.exists) {
    return { certificate: certSnap.data() as CertificateRecord, xpEarned: 0 }
  }

  const [studentDoc, eventDoc] = await Promise.all([
    db.collection('users').doc(studentUid).get(),
    db.collection('events').doc(eventId).get(),
  ])

  if (!studentDoc.exists) throw new Error('Student not found')
  if (!eventDoc.exists) throw new Error('Event not found')

  const student = studentDoc.data() as AppUser
  const event = eventDoc.data() as FirestoreEvent

  const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase()
  const verificationCode = `HUB-CERT-${new Date().getFullYear()}-${randomHex}`

  const newCert: CertificateRecord = {
    id: certDocId,
    studentUid,
    studentName: student.fullName || 'Student',
    studentEmail: student.email || '',
    collegeName: student.collegeName || event.collegeName || 'HubblerX Partner Institution',
    eventId,
    eventTitle: event.title || 'Campus Event',
    eventCategory: (event.category as EventCategory) || 'GENERAL',
    eventDate: event.startDate || nowIso().split('T')[0],
    organizerName: event.organizerName || 'HubblerX Organizer',
    issuedAt: nowIso(),
    verificationCode,
    qrVerificationUrl: `https://hubblerx.com/verify-certificate/${verificationCode}`,
  }

  await certRef.set(newCert)

  // Award +25 XP for Certificate
  const xpRes = await awardXpActivity(studentUid, 'CERTIFICATE', certDocId, `Certificate issued for "${event.title}"`)

  // Automatically create achievement post for official verified certificate
  createAchievementPost(studentUid, {
    type: 'CERTIFICATE_ISSUED',
    achievementTitle: `Verified Certificate: ${event.title}`,
    achievementDescription: `Successfully completed verified event "${event.title}" organized by ${event.organizerName || 'HubblerX Organizer'}. Code: ${verificationCode}`,
    achievementIcon: '📜',
    xpEarned: 25,
    referenceId: certDocId,
    meta: { certificateId: certDocId, eventId, verificationCode, eventCategory: event.category },
  }).catch((err) => console.error('[Post] Certificate post error:', err))

  return { certificate: newCert, xpEarned: xpRes.xpEarned }
}

/**
 * Submits feedback for an event and awards +5 XP
 */
export async function submitEventFeedback(
  userId: string,
  eventId: string,
  rating: number,
  feedbackText: string,
): Promise<{ success: boolean; message: string; xpEarned: number }> {
  if (!db) throw new Error('Firestore is not configured.')

  const feedbackId = `feedback_${userId}_${eventId}`
  const feedbackRef = db.collection('eventFeedback').doc(feedbackId)
  const existing = await feedbackRef.get()

  if (existing.exists) {
    return { success: false, message: 'You have already submitted feedback for this event.', xpEarned: 0 }
  }

  const [userDoc, eventDoc] = await Promise.all([
    db.collection('users').doc(userId).get(),
    db.collection('events').doc(eventId).get(),
  ])

  if (!userDoc.exists) throw new Error('User not found')
  if (!eventDoc.exists) throw new Error('Event not found')

  const user = userDoc.data() as AppUser
  const event = eventDoc.data() as FirestoreEvent

  const record: EventFeedbackRecord = {
    id: feedbackId,
    eventId,
    studentUid: userId,
    studentName: user.fullName || 'Student',
    rating: Math.min(5, Math.max(1, rating)),
    feedbackText: feedbackText.trim(),
    createdAt: nowIso(),
  }

  await feedbackRef.set(record)

  // Award +5 XP
  const xpRes = await awardXpActivity(userId, 'FEEDBACK', eventId, `Feedback submitted for "${event.title}"`)

  return { success: true, message: 'Feedback submitted successfully! +5 XP awarded.', xpEarned: xpRes.xpEarned }
}

/**
 * Processes a referral code for a newly registered student
 */
export async function processReferral(
  newUserId: string,
  referralCode: string,
): Promise<{ success: boolean; message: string; referrerName?: string }> {
  if (!db) throw new Error('Firestore is not configured.')
  if (!referralCode || !referralCode.trim()) return { success: false, message: 'Invalid referral code' }

  const cleanCode = referralCode.trim().toUpperCase()

  const newUserRef = db.collection('users').doc(newUserId)
  const newUserDoc = await newUserRef.get()
  if (!newUserDoc.exists) throw new Error('User not found')

  const newUserData = newUserDoc.data() as AppUser
  if (newUserData.referredBy) {
    return { success: false, message: 'You have already used a referral code.' }
  }

  const referrerSnap = await db.collection('users').where('referralCode', '==', cleanCode).limit(1).get()
  if (referrerSnap.empty) {
    return { success: false, message: 'Referral code not found.' }
  }

  const referrerDoc = referrerSnap.docs[0]
  if (referrerDoc.id === newUserId) {
    return { success: false, message: 'You cannot use your own referral code.' }
  }

  const referrer = referrerDoc.data() as AppUser

  // Link referral
  await newUserRef.update({
    referredBy: referrerDoc.id,
    updatedAt: nowIso(),
  })

  // Award +20 XP to Referrer
  await awardXpActivity(
    referrerDoc.id,
    'REFERRAL',
    newUserId,
    `Referral bonus for inviting ${newUserData.fullName || 'a student'}`,
  )

  return {
    success: true,
    message: `Referral applied! ${referrer.fullName || 'Your friend'} received +20 XP.`,
    referrerName: referrer.fullName,
  }
}

/**
 * Redeems a store reward with atomic XP deduction and voucher code generation
 */
export async function redeemReward(
  userId: string,
  rewardId: string,
): Promise<{ success: boolean; message: string; redemption: RedemptionRecord; balanceAfter: number }> {
  if (!db) throw new Error('Firestore is not configured.')
  const firestore = db

  const rewardRef = firestore.collection('rewards').doc(rewardId)
  const userRef = firestore.collection('users').doc(userId)

  let redemptionResult: RedemptionRecord | null = null
  let finalBalance = 0

  await firestore.runTransaction(async (transaction) => {
    const [rewardDoc, userDoc] = await Promise.all([transaction.get(rewardRef), transaction.get(userRef)])

    if (!rewardDoc.exists) {
      throw new Error('Reward not found')
    }

    const reward = rewardDoc.data() as RewardItem
    if (!reward.active) {
      throw new Error('This reward is currently unavailable')
    }

    if (!userDoc.exists) {
      throw new Error('Student not found')
    }

    const user = userDoc.data() as AppUser
    const currentXp = Number(user.xp ?? 0)

    if (currentXp < reward.xpCost) {
      throw new Error(`Insufficient XP. You have ${currentXp} XP, but this reward costs ${reward.xpCost} XP.`)
    }

    const levelInfo = calculateLevel(currentXp)
    if (levelInfo.level < reward.minLevel) {
      throw new Error(`Requires Level ${reward.minLevel} (${LEVELS.find((l) => l.level === reward.minLevel)?.title}). You are Level ${levelInfo.level}.`)
    }

    // Generate unique redemption code
    const randDigits = Math.floor(100000 + Math.random() * 900000)
    const codePrefix = String(reward.valueData?.prefix || reward.category.substring(0, 4).toUpperCase())
    const redemptionCode = `HUB-${codePrefix}-${randDigits}`

    finalBalance = currentXp - reward.xpCost
    const newLevelInfo = calculateLevel(finalBalance)

    const redemptionDocRef = firestore.collection('redemptions').doc()
    const record: RedemptionRecord = {
      id: redemptionDocRef.id,
      userId,
      userName: user.fullName || 'Student',
      userEmail: user.email || '',
      rewardId: reward.id,
      rewardName: reward.name,
      category: reward.category,
      xpCost: reward.xpCost,
      redemptionCode,
      status: 'ACTIVE',
      meta: reward.valueData || {},
      redeemedAt: nowIso(),
    }

    // XP transaction log for deduction
    const txDocRef = firestore.collection('xpTransactions').doc(`xp_${userId}_REDEEM_${redemptionDocRef.id}`)
    const txRecord: XpTransactionRecord = {
      id: txDocRef.id,
      userId,
      activityType: 'REWARD_REDEEM',
      amount: -reward.xpCost,
      description: `Redeemed "${reward.name}"`,
      referenceId: reward.id,
      monthKey: currentMonthKey(),
      balanceAfter: finalBalance,
      createdAt: nowIso(),
      meta: { rewardId: reward.id, redemptionId: redemptionDocRef.id },
    }

    const userUpdates: Record<string, unknown> = {
      xp: finalBalance,
      level: newLevelInfo.level,
      updatedAt: nowIso(),
    }

    // If cosmetic theme, frame, or title, auto-equip
    if (reward.category === 'THEME' && reward.valueData?.themeKey) {
      userUpdates.activeTheme = String(reward.valueData.themeKey)
    } else if (reward.category === 'FRAME' && reward.valueData?.frameKey) {
      userUpdates.activeFrame = String(reward.valueData.frameKey)
    } else if (reward.category === 'TITLE' && reward.valueData?.titleText) {
      userUpdates.activeTitle = String(reward.valueData.titleText)
    }

    transaction.set(redemptionDocRef, record)
    transaction.set(txDocRef, txRecord)
    transaction.update(userRef, userUpdates)

    redemptionResult = record
  })

  if (!redemptionResult) {
    throw new Error('Redemption failed')
  }

  const validRedemption: RedemptionRecord = redemptionResult

  // Evaluate Collector badge
  evaluateBadges(userId).catch((err) => console.error('[Badges] Collector badge eval error:', err))

  await logActivity({
    userId,
    role: 'STUDENT',
    type: 'REWARD_REDEEM',
    description: `Redeemed "${validRedemption.rewardName}" for ${validRedemption.xpCost} XP`,
    meta: { rewardId, redemptionCode: validRedemption.redemptionCode },
  })

  return {
    success: true,
    message: `Successfully redeemed "${validRedemption.rewardName}"!`,
    redemption: validRedemption,
    balanceAfter: finalBalance,
  }
}

/**
 * Equips or unequips a cosmetic theme, frame, or title
 */
export async function equipCosmetic(
  userId: string,
  type: 'THEME' | 'FRAME' | 'TITLE',
  value: string | null,
): Promise<{ success: boolean; message: string }> {
  if (!db) throw new Error('Firestore is not configured.')

  const userRef = db.collection('users').doc(userId)
  const userDoc = await userRef.get()
  if (!userDoc.exists) throw new Error('User not found')

  const updates: Record<string, unknown> = { updatedAt: nowIso() }
  if (type === 'THEME') {
    updates.activeTheme = value
  } else if (type === 'FRAME') {
    updates.activeFrame = value
  } else if (type === 'TITLE') {
    updates.activeTitle = value
  }

  await userRef.update(updates)
  return { success: true, message: `${type} updated successfully!` }
}

/**
 * Computes monthly leaderboard ranking and preserves previous month archives
 */
export async function getMonthlyLeaderboard(monthKey = currentMonthKey()): Promise<{
  monthKey: string
  leaderboard: Array<{
    rank: number
    userId: string
    fullName: string
    collegeName: string
    profileImage: string | null
    activeFrame: string | null
    activeTitle: string | null
    monthlyXp: number
    totalXp: number
    level: number
  }>
  collegeLeaderboard: Array<{
    rank: number
    collegeName: string
    totalXp: number
    studentCount: number
  }>
}> {
  if (!db) return { monthKey, leaderboard: [], collegeLeaderboard: [] }

  // Query all positive XP transactions for this month
  const txSnap = await db
    .collection('xpTransactions')
    .where('monthKey', '==', monthKey)
    .limit(1000)
    .get()

  const monthlyUserXpMap: Record<string, number> = {}
  for (const doc of txSnap.docs) {
    const data = doc.data() as XpTransactionRecord
    if (data.amount > 0 && data.userId) {
      monthlyUserXpMap[data.userId] = (monthlyUserXpMap[data.userId] || 0) + data.amount
    }
  }

  // Get all users
  const usersSnap = await db.collection('users').where('role', '==', 'STUDENT').get()
  const userList: Array<{
    userId: string
    fullName: string
    collegeName: string
    profileImage: string | null
    activeFrame: string | null
    activeTitle: string | null
    monthlyXp: number
    totalXp: number
    level: number
  }> = []

  const collegeMap: Record<string, { totalXp: number; students: Set<string> }> = {}

  for (const doc of usersSnap.docs) {
    const u = doc.data() as AppUser
    const monthlyXp = monthlyUserXpMap[doc.id] || 0
    const totalXp = u.xp || 0
    const levelInfo = calculateLevel(totalXp)
    const college = (u.collegeName || 'Independent Student').trim()

    userList.push({
      userId: doc.id,
      fullName: u.fullName || 'Student',
      collegeName: college,
      profileImage: u.profileImage || null,
      activeFrame: u.activeFrame || null,
      activeTitle: u.activeTitle || null,
      monthlyXp,
      totalXp,
      level: levelInfo.level,
    })

    if (monthlyXp > 0 || totalXp > 0) {
      if (!collegeMap[college]) {
        collegeMap[college] = { totalXp: 0, students: new Set() }
      }
      collegeMap[college].totalXp += monthlyXp > 0 ? monthlyXp : Math.min(totalXp, 20)
      collegeMap[college].students.add(doc.id)
    }
  }

  // Sort students: primarily by monthly XP desc, then by total XP desc
  userList.sort((a, b) => b.monthlyXp - a.monthlyXp || b.totalXp - a.totalXp)

  const rankedLeaderboard = userList.slice(0, 100).map((u, index) => ({
    ...u,
    rank: index + 1,
  }))

  // Trigger automated achievement posts for top 3 podium students if they have monthly XP
  const top3 = rankedLeaderboard.slice(0, 3).filter((u) => u.monthlyXp > 0)
  for (const s of top3) {
    const rankTitles = ['Gold 1st Place Podium', 'Silver 2nd Place Podium', 'Bronze 3rd Place Podium']
    const rankIcons = ['🥇', '🥈', '🥉']
    createAchievementPost(s.userId, {
      type: 'RANKING_TOP3',
      achievementTitle: `Top 3 Leaderboard: ${rankTitles[s.rank - 1]}`,
      achievementDescription: `Finished #${s.rank} on the HubblerX XP Leaderboard for ${monthKey} with ${s.monthlyXp} Monthly XP!`,
      achievementIcon: rankIcons[s.rank - 1] || '🏆',
      xpEarned: s.monthlyXp,
      referenceId: `rank_${monthKey}_${s.rank}`,
      meta: { monthKey, rank: s.rank, monthlyXp: s.monthlyXp },
    }).catch((err) => console.error('[Post] Top 3 post error:', err))
  }

  // College leaderboard
  const collegeList = Object.entries(collegeMap).map(([collegeName, data]) => ({
    collegeName,
    totalXp: data.totalXp,
    studentCount: data.students.size,
  }))
  collegeList.sort((a, b) => b.totalXp - a.totalXp)

  const rankedCollegeLeaderboard = collegeList.map((c, index) => ({
    rank: index + 1,
    collegeName: c.collegeName,
    totalXp: c.totalXp,
    studentCount: c.studentCount,
  }))

  return {
    monthKey,
    leaderboard: rankedLeaderboard,
    collegeLeaderboard: rankedCollegeLeaderboard,
  }
}

/**
 * Gets student full gamification & rewards summary for dashboard
 */
export async function getStudentRewardsSummary(userId: string): Promise<{
  xp: number
  level: ReturnType<typeof calculateLevel>
  monthlyXp: number
  monthlyRank: number
  referralCode: string
  referredCount: number
  hubblerId: string
  privacy: UserPrivacySettings
  activeTheme: string | null
  activeFrame: string | null
  activeTitle: string | null
  unlockedBadges: UserBadgeRecord[]
  allBadges: BadgeDefinition[]
  certificates: CertificateRecord[]
  redemptions: RedemptionRecord[]
  recentTransactions: XpTransactionRecord[]
}> {
  if (!db) throw new Error('Firestore is not configured.')

  const monthKey = currentMonthKey()
  const [userDoc, badgesSnap, certSnap, redemptionsSnap, txSnap] = await Promise.all([
    db.collection('users').doc(userId).get(),
    db.collection('userBadges').where('userId', '==', userId).get(),
    db.collection('certificates').where('studentUid', '==', userId).get(),
    db.collection('redemptions').where('userId', '==', userId).get(),
    db.collection('xpTransactions').where('userId', '==', userId).limit(50).get(),
  ])

  if (!userDoc.exists) throw new Error('Student profile not found')

  const user = userDoc.data() as AppUser
  const totalXp = Number(user.xp ?? 0)
  const levelInfo = calculateLevel(totalXp)

  // Calculate monthly XP
  const txList = txSnap.docs.map((d) => d.data() as XpTransactionRecord)
  txList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))

  const monthlyXp = txList
    .filter((t) => t.monthKey === monthKey && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  // Ensure referral code exists
  let referralCode = user.referralCode
  if (!referralCode) {
    referralCode = `HUB${Math.random().toString(36).substring(2, 7).toUpperCase()}`
    await db.collection('users').doc(userId).update({ referralCode })
  }

  // Count referred friends
  const referredSnap = await db.collection('users').where('referredBy', '==', userId).get()

  // Get monthly rank
  const { leaderboard } = await getMonthlyLeaderboard(monthKey)
  const rankIndex = leaderboard.findIndex((s) => s.userId === userId)
  const monthlyRank = rankIndex !== -1 ? rankIndex + 1 : leaderboard.length + 1

  const unlockedBadges = badgesSnap.docs.map((d) => d.data() as UserBadgeRecord)
  unlockedBadges.sort((a, b) => (b.awardedAt || '').localeCompare(a.awardedAt || ''))

  const certificates = certSnap.docs.map((d) => d.data() as CertificateRecord)
  certificates.sort((a, b) => (b.issuedAt || '').localeCompare(a.issuedAt || ''))

  const redemptions = redemptionsSnap.docs.map((d) => d.data() as RedemptionRecord)
  redemptions.sort((a, b) => (b.redeemedAt || '').localeCompare(a.redeemedAt || ''))

  const { hubblerId, privacy } = await ensureUserHubblerId(userId, user)

  return {
    xp: totalXp,
    level: levelInfo,
    monthlyXp,
    monthlyRank,
    referralCode,
    referredCount: referredSnap.size,
    hubblerId,
    privacy,
    activeTheme: user.activeTheme || null,
    activeFrame: user.activeFrame || null,
    activeTitle: user.activeTitle || null,
    unlockedBadges,
    allBadges: BADGES_CATALOG,
    certificates,
    redemptions,
    recentTransactions: txList,
  }
}

import { db } from '../firebase.js'
import type { AppUser, UserPrivacySettings } from '../types.js'

export const DEFAULT_PRIVACY_SETTINGS: UserPrivacySettings = {
  profileVisibility: 'PUBLIC',
  showXp: true,
  showCertificates: true,
  showEventHistory: true,
  allowConnectionRequests: true,
  autoPostAchievements: true,
}

/**
 * Generates a candidate HubblerID in the format HX-XXXXXX (e.g. HX-849201 or HX-7F92B4)
 */
export function generateHubblerIdCandidate(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ' // excludes confusing letters O, I
  let id = 'HX-'
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
}

/**
 * Generates a unique, non-colliding permanent HubblerID by checking Firestore.
 */
export async function generateUniqueHubblerId(): Promise<string> {
  if (!db) {
    return generateHubblerIdCandidate()
  }

  let attempts = 0
  while (attempts < 10) {
    const candidate = generateHubblerIdCandidate()
    const snap = await db.collection('users').where('hubblerId', '==', candidate).limit(1).get()
    if (snap.empty) {
      return candidate
    }
    attempts++
  }

  // Fallback with timestamp suffix if heavy collisions
  return `HX-${Date.now().toString(36).substring(4).toUpperCase()}`
}

/**
 * Ensures a user document has a permanent HubblerID and default privacy settings.
 * If missing, generates, persists, and returns the updated user data.
 */
export async function ensureUserHubblerId(
  uid: string,
  userData: Partial<AppUser>,
): Promise<{ hubblerId: string; privacy: UserPrivacySettings }> {
  let hubblerId = userData.hubblerId
  let privacy = userData.privacy

  let needsUpdate = false
  const updates: Record<string, unknown> = {}

  if (!hubblerId) {
    hubblerId = await generateUniqueHubblerId()
    updates.hubblerId = hubblerId
    needsUpdate = true
  }

  if (!privacy) {
    privacy = { ...DEFAULT_PRIVACY_SETTINGS }
    updates.privacy = privacy
    needsUpdate = true
  }

  if (needsUpdate && db) {
    await db.collection('users').doc(uid).update({
      ...updates,
      updatedAt: new Date().toISOString(),
    }).catch((err) => console.error(`[ensureUserHubblerId] Failed to update user ${uid}:`, err))
  }

  return {
    hubblerId: hubblerId!,
    privacy: privacy || { ...DEFAULT_PRIVACY_SETTINGS },
  }
}

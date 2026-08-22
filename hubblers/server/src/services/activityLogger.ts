import { db } from '../firebase.js'
import type { ActivityLog, ActivityType, Role } from '../types.js'

/**
 * Write an entry to the Firestore `activityLogs` collection.
 * This is a best-effort, fire-and-forget operation so it never
 * blocks the primary request flow.
 */
export async function logActivity(
  data: Omit<ActivityLog, 'createdAt'> & { createdAt?: string },
): Promise<void> {
  if (!db) return
  try {
    await db.collection('activityLogs').add({
      ...data,
      createdAt: data.createdAt ?? new Date().toISOString(),
    })
  } catch (error) {
    console.error('[logActivity] failed:', error instanceof Error ? error.message : String(error))
  }
}

/**
 * Convenience wrapper for logging user-triggered activities.
 */
export async function logUserActivity(options: {
  userId: string
  role: Role | null
  type: ActivityType
  description: string
  meta?: Record<string, unknown>
}): Promise<void> {
  await logActivity({
    userId: options.userId,
    role: options.role ?? 'STUDENT',
    type: options.type,
    description: options.description,
    meta: options.meta,
  })
}

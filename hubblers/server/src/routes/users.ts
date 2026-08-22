import { Router } from 'express'
import { z } from 'zod'
import { db } from '../firebase.js'
import { verifyFirebaseToken } from '../middleware/auth.js'
import { uploadBufferToStorage } from '../firebase.js'
import { logActivity } from '../services/activityLogger.js'
import type { AppUser } from '../types.js'

const router = Router()

const profileSchema = z.object({
  fullName: z.string().min(3).optional(),
  department: z.string().optional().nullable(),
  rollNumber: z.string().optional().nullable(),
  collegeId: z.string().optional().nullable(),
  startYear: z.number().int().min(1990).max(2100).optional().nullable(),
  endYear: z.number().int().min(1990).max(2100).optional().nullable(),
  phone: z.string().min(6).optional().nullable(),
  degree: z.string().optional().nullable(),
  branch: z.string().optional().nullable(),
  year: z.string().optional().nullable(),
  profileImageBase64: z.string().optional(),
})

function bufferFromBase64(imageBase64?: string) {
  if (!imageBase64) return null
  const matches = imageBase64.match(/^data:(.+);base64,(.+)$/)
  if (!matches) return null
  return { buffer: Buffer.from(matches[2], 'base64'), type: matches[1] }
}

router.get('/profile', verifyFirebaseToken, async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (!db) {
    return res.status(500).json({ error: 'Firestore is not configured on the server.' })
  }

  const userDoc = await db.collection('users').doc(uid).get()
  if (!userDoc.exists) return res.status(404).json({ error: 'Profile not found' })
  const data = userDoc.data() as AppUser

  // Resolve college display name from the user's collegeId (if set)
  let collegeName: string | null = null
  if (data.collegeId) {
    const collegeDoc = await db.collection('colleges').doc(data.collegeId).get()
    if (collegeDoc.exists) collegeName = collegeDoc.data()?.collegeName ?? null
  }

  return res.json({ firebaseUid: uid, ...data, collegeName })
})

router.put('/profile', verifyFirebaseToken, async (req, res) => {
  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (!db) {
    return res.status(500).json({ error: 'Firestore is not configured on the server.' })
  }

  const parsed = profileSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
  }

  const data = parsed.data
  const updates: Record<string, unknown> = {}
  if (data.fullName) updates.fullName = data.fullName
  if (data.department !== undefined) updates.department = data.department
  if (data.rollNumber !== undefined) updates.rollNumber = data.rollNumber
  if (data.collegeId !== undefined) updates.collegeId = data.collegeId
  if (data.startYear !== undefined) updates.startYear = data.startYear
  if (data.endYear !== undefined) updates.endYear = data.endYear
  if (data.phone !== undefined) updates.phone = data.phone
  if (data.degree !== undefined) updates.degree = data.degree
  if (data.branch !== undefined) updates.branch = data.branch
  if (data.year !== undefined) updates.year = data.year

  if (data.profileImageBase64) {
    const fileData = bufferFromBase64(data.profileImageBase64)
    if (fileData) {
      const destination = `profile-images/${uid}.png`
      const url = await uploadBufferToStorage(fileData.buffer, destination, fileData.type)
      updates.profileImage = url
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No profile updates provided' })
  }

  updates.updatedAt = new Date().toISOString()
  await db.collection('users').doc(uid).update(updates)

  await logActivity({
    userId: uid,
    role: 'STUDENT',
    type: 'PROFILE_UPDATE',
    description: 'Profile updated',
    meta: { fields: Object.keys(updates) },
  })

  return res.json({ message: 'Profile updated successfully' })
})

export default router

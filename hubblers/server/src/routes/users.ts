import { Router } from 'express'
import { z } from 'zod'
import { db } from '../firebase.js'
import { verifyFirebaseToken } from '../middleware/auth.js'
import { uploadBufferToStorage } from '../firebase.js'
import { logActivity } from '../services/activityLogger.js'
import type { AppUser } from '../types.js'

const router = Router()

const profileSchema = z.object({
  fullName: z.string().min(2).optional(),
  department: z.string().optional().nullable(),
  rollNumber: z.string().optional().nullable(),
  collegeId: z.string().optional().nullable(),
  startYear: z.number().int().min(1990).max(2100).optional().nullable(),
  endYear: z.number().int().min(1990).max(2100).optional().nullable(),
  phone: z.string().min(6).optional().nullable(),
  degree: z.string().optional().nullable(),
  branch: z.string().optional().nullable(),
  year: z.string().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  skills: z.array(z.string()).optional().nullable(),
  interests: z.array(z.string()).optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable().or(z.literal('')),
  githubUrl: z.string().url().optional().nullable().or(z.literal('')),
  profileImageBase64: z.string().optional(),
})

function bufferFromBase64(imageBase64?: string) {
  if (!imageBase64) return null
  const matches = imageBase64.match(/^data:(.+);base64,(.+)$/)
  if (!matches) return null
  return { buffer: Buffer.from(matches[2], 'base64'), type: matches[1] }
}

export function calculateProfileCompletion(data: Partial<AppUser> & { collegeName?: string | null }): {
  percentage: number
  missingFields: string[]
  completedFields: string[]
} {
  const fields = [
    { key: 'fullName', label: 'Full Name', weight: 15, isFilled: Boolean(data.fullName?.trim()) },
    { key: 'email', label: 'Email Address', weight: 15, isFilled: Boolean(data.email?.trim()) },
    { key: 'collegeId', label: 'College / Institution', weight: 15, isFilled: Boolean(data.collegeId || data.collegeName) },
    { key: 'degree', label: 'Degree / Program', weight: 15, isFilled: Boolean(data.degree?.trim() || data.department?.trim()) },
    { key: 'year', label: 'Year of Study', weight: 10, isFilled: Boolean(data.year?.trim() || data.endYear) },
    { key: 'phone', label: 'Phone Number', weight: 10, isFilled: Boolean(data.phone?.trim()) },
    { key: 'rollNumber', label: 'Roll / Student ID', weight: 10, isFilled: Boolean(data.rollNumber?.trim()) },
    { key: 'profileImage', label: 'Profile Picture', weight: 10, isFilled: Boolean(data.profileImage?.trim()) },
  ]

  let percentage = 0
  const missingFields: string[] = []
  const completedFields: string[] = []

  for (const field of fields) {
    if (field.isFilled) {
      percentage += field.weight
      completedFields.push(field.label)
    } else {
      missingFields.push(field.label)
    }
  }

  return {
    percentage: Math.min(100, percentage),
    missingFields,
    completedFields,
  }
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

  const { ensureUserHubblerId } = await import('../utils/hubblerId.js')
  const { hubblerId, privacy } = await ensureUserHubblerId(uid, data)

  // Resolve college display name from the user's collegeId (if set)
  let collegeName: string | null = null
  if (data.collegeId) {
    const collegeDoc = await db.collection('colleges').doc(data.collegeId).get()
    if (collegeDoc.exists) collegeName = collegeDoc.data()?.collegeName ?? null
  }

  const completion = calculateProfileCompletion({ ...data, collegeName })

  return res.json({
    firebaseUid: uid,
    ...data,
    hubblerId,
    privacy,
    collegeName,
    profileCompletion: completion.percentage,
    missingFields: completion.missingFields,
  })
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
  if (data.fullName !== undefined) updates.fullName = data.fullName
  if (data.department !== undefined) updates.department = data.department
  if (data.rollNumber !== undefined) updates.rollNumber = data.rollNumber
  if (data.collegeId !== undefined) updates.collegeId = data.collegeId
  if (data.startYear !== undefined) updates.startYear = data.startYear
  if (data.endYear !== undefined) updates.endYear = data.endYear
  if (data.phone !== undefined) updates.phone = data.phone
  if (data.degree !== undefined) updates.degree = data.degree
  if (data.branch !== undefined) updates.branch = data.branch
  if (data.year !== undefined) updates.year = data.year
  if (data.bio !== undefined) updates.bio = data.bio
  if (data.skills !== undefined) updates.skills = data.skills
  if (data.interests !== undefined) updates.interests = data.interests
  if (data.linkedinUrl !== undefined) updates.linkedinUrl = data.linkedinUrl
  if (data.githubUrl !== undefined) updates.githubUrl = data.githubUrl

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

  // Fetch updated doc to recalculate profile completion
  const updatedDoc = await db.collection('users').doc(uid).get()
  const updatedData = (updatedDoc.data() || {}) as AppUser
  const completion = calculateProfileCompletion(updatedData)

  // Save profileCompletion score onto the user document for fast leaderboard & dashboard reads
  await db.collection('users').doc(uid).update({ profileCompletion: completion.percentage })

  await logActivity({
    userId: uid,
    role: (updatedData.role as 'STUDENT' | 'COLLEGE_ADMIN' | 'SUPPORT' | 'ADMIN') || 'STUDENT',
    type: 'PROFILE_UPDATE',
    description: 'Profile updated',
    meta: { fields: Object.keys(updates), completion: completion.percentage },
  })

  return res.json({
    message: 'Profile updated successfully',
    profileCompletion: completion.percentage,
    missingFields: completion.missingFields,
  })
})

export default router

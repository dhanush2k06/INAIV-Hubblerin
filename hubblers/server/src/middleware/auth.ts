import type { RequestHandler } from 'express'
import { auth, db } from '../firebase.js'
import type { RequestWithUser, Role } from '../types.js'

export const verifyFirebaseToken: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const token = authHeader.slice(7)
  if (!auth) {
    return res.status(500).json({ error: 'Firebase authentication is not configured on the server.' })
  }

  try {
    const decoded = await auth.verifyIdToken(token)
    let role: Role | undefined = decoded.role as Role | undefined
    let collegeId: string | null = (decoded.collegeId as string | null) ?? null

    // If role is missing from token custom claims or needs fallback resolution,
    // look up the source of truth in Firestore 'users' collection.
    if ((!role || role === 'STUDENT') && db) {
      try {
        const userDoc = await db.collection('users').doc(decoded.uid).get()
        if (userDoc.exists) {
          const userData = userDoc.data()
          if (userData?.role) {
            role = userData.role as Role
          }
          if (userData?.collegeId) {
            collegeId = userData.collegeId
          }
        }
      } catch (dbErr) {
        console.warn('[verifyFirebaseToken] Error checking Firestore user role:', dbErr)
      }
    }

    const resolvedRole: Role = (role as string) === 'ORGANIZER' ? 'COLLEGE_ADMIN' : (role ?? 'STUDENT')

    ;(req as RequestWithUser).user = {
      firebaseUid: decoded.uid,
      email: decoded.email ?? '',
      role: resolvedRole,
      collegeId,
    }
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }
}

export const verifyJwt = verifyFirebaseToken


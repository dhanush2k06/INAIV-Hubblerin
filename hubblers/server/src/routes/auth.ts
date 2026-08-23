import { Router } from 'express'
import { signupSchema, loginSchema } from '../schemas/auth.js'
import { auth as firebaseAuth, db } from '../firebase.js'
import { createStudentQrCode } from '../utils/qr.js'
import { sendRegistrationEmail } from '../services/emailService.js'
import { logActivity } from '../services/activityLogger.js'
import { generateUniqueHubblerId, ensureUserHubblerId, DEFAULT_PRIVACY_SETTINGS } from '../utils/hubblerId.js'
import type { AppUser, Role } from '../types.js'

const router = Router()

function nowIso(): string {
  return new Date().toISOString()
}

/**
 * Upsert a user document in Firestore under users/{uid}.
 */
async function upsertUser(uid: string, data: Partial<AppUser>) {
  if (!db) return
  const ref = db.collection('users').doc(uid)
  const existing = await ref.get()
  if (existing.exists) {
    await ref.update({ ...data, updatedAt: nowIso() })
  } else {
    await ref.set({
      ...data,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })
  }
}

/**
 * Set the role (and collegeId) as custom claims on the Firebase user.
 */
async function setClaims(uid: string, role: Role, collegeId: string | null) {
  if (!firebaseAuth) return
  const claims: Record<string, unknown> = { role }
  if (collegeId) claims.collegeId = collegeId
  await firebaseAuth.setCustomUserClaims(uid, claims)
}

router.post('/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
  }

  const data = parsed.data
  if (data.role !== 'STUDENT') {
    return res.status(400).json({ error: 'Only STUDENT signup is allowed via this endpoint' })
  }
  if (!data.collegeId && !data.collegeName) {
    return res.status(400).json({ error: 'collegeId or collegeName is required for student signup' })
  }

  try {
    if (!firebaseAuth || !db) {
      return res.status(500).json({ error: 'Firebase is not configured on the server.' })
    }

// Check if email already registered (only when an email is present; for Google
    // signup the verified email is resolved from the ID token below).
    if (data.email) {
      const emailSnapshot = await db
        .collection('users')
        .where('email', '==', data.email)
        .limit(1)
        .get()
      if (!emailSnapshot.empty) {
        return res.status(400).json({ error: 'A user with this email is already registered.' })
      }
    }

    if (data.password && data.password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' })
    }

    let firebaseUid: string
    let verificationLink: string

    // Google / federated signup: verify the provided ID token and reuse the Firebase user.
    if (data.idToken) {
      const decoded = await firebaseAuth.verifyIdToken(data.idToken)
      firebaseUid = decoded.uid
      verificationLink = '#verified'
      // Prefer the verified token identity over loosely-supplied form values (sanitized above).
      if (decoded.email && !data.email) {
        data.email = decoded.email
      }
      if (decoded.name && !data.fullName) {
        data.fullName = decoded.name
      }
      if (!data.fullName || data.fullName.trim().length < 3) {
        return res.status(400).json({ error: 'fullName is required for Google signup' })
      }
      if (!data.email) {
        return res.status(400).json({ error: 'A verified email is required for Google signup' })
      }
    } else if (data.email && data.password) {
      const firebaseUser = await firebaseAuth.createUser({
        email: data.email,
        password: data.password,
        displayName: data.fullName,
      })
      firebaseUid = firebaseUser.uid
      verificationLink = await firebaseAuth.generateEmailVerificationLink(data.email)
    } else {
      return res.status(400).json({ error: 'Require an idToken (Google) or email/password for signup' })
    }

    const qrUrl = await createStudentQrCode(
      {
        userId: firebaseUid,
        role: 'student',
        college: String(data.collegeId ?? data.collegeName ?? ''),
      },
      `qr-codes/${firebaseUid}.png`,
    ).catch(() => `https://placeholder-qr/${firebaseUid}.png`)

    const hubblerId = await generateUniqueHubblerId()

    await upsertUser(firebaseUid, {
      fullName: data.fullName,
      email: data.email,
      role: 'STUDENT',
      hubblerId,
      privacy: { ...DEFAULT_PRIVACY_SETTINGS },
      collegeId: data.collegeId ? String(data.collegeId) : null,
      collegeName: data.collegeName ?? null,
      accreditationId: data.accreditationId ?? null,
      username: data.username ?? null,
      profileImage: data.profileImageBase64 ?? null,
      department: data.department ?? null,
      rollNumber: data.rollNumber ?? null,
      phone: data.phone ?? null,
      degree: data.degree ?? null,
      branch: data.branch ?? null,
      year: data.year ?? null,
      annualCredits: 0,
      lifetimeCredits: 0,
      xp: 0,
      verificationStatus: 'UNVERIFIED',
      qrCodeUrl: qrUrl,
      startYear: data.startYear ?? null,
      endYear: data.endYear ?? null,
    })

    await setClaims(firebaseUid, 'STUDENT', data.collegeId ? String(data.collegeId) : null)

    sendRegistrationEmail(data.email, data).catch((err: unknown) =>
      console.error('Failed to send signup email:', err),
    )

    await logActivity({
      userId: firebaseUid,
      role: 'STUDENT',
      type: 'SIGNUP',
      description: `Student account created for ${data.fullName} (${hubblerId})`,
      meta: { email: data.email, collegeId: data.collegeId ?? null, hubblerId },
    })

    return res.status(201).json({ message: 'Student signup created', verificationLink, qrUrl, hubblerId })
  } catch (error) {
    console.error('[POST /api/auth/signup] failed:', error)
    return res.status(500).json({
      error: 'Failed to register student',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
  }

  const data = parsed.data
  try {
    if (!firebaseAuth || !db) {
      return res.status(500).json({ error: 'Firebase is not configured on the server.' })
    }

    if (data.idToken || data.googleToken) {
      const token = data.idToken ?? data.googleToken!
      const decoded = await firebaseAuth.verifyIdToken(token)
      const firebaseUid = decoded.uid

      const userDoc = await db.collection('users').doc(firebaseUid).get()
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'Account found in Firebase but not registered in Firestore. Please complete signup.' })
      }
      const user = userDoc.data() as AppUser
      const effectiveRole: Role = (user.role as string) === 'ORGANIZER' ? 'COLLEGE_ADMIN' : user.role

      // Check organizer / college admin approval status
      if (effectiveRole === 'COLLEGE_ADMIN') {
        let status = user.verificationStatus ?? 'UNVERIFIED'
        if ((status === 'UNVERIFIED' || status === 'PENDING') && user.collegeId) {
          try {
            const [collegeDoc, orgDoc] = await Promise.all([
              db.collection('colleges').doc(user.collegeId).get(),
              db.collection('organizers').doc(user.collegeId).get(),
            ])
            if (
              collegeDoc.data()?.status === 'APPROVED' ||
              orgDoc.data()?.verificationStatus === 'APPROVED' ||
              orgDoc.data()?.status === 'APPROVED'
            ) {
              status = 'VERIFIED'
              await db.collection('users').doc(firebaseUid).update({ verificationStatus: 'VERIFIED' })
            }
          } catch (crossCheckErr) {
            console.warn('[auth.login] Error checking cross-collection approval:', crossCheckErr)
          }
        }

        if (status === 'BLOCKED') {
          return res.status(403).json({ error: 'Your organizer account has been suspended/blocked by the administrator due to reported policy violations.' })
        }
        if (status === 'UNVERIFIED' || status === 'PENDING') {
          return res.status(403).json({ error: 'Your organizer account is pending approval by the CRM Admin. Please wait for confirmation.' })
        }
        if (status === 'REJECTED') {
          return res.status(403).json({ error: 'Your organizer account registration was rejected.' })
        }
      } else if (effectiveRole !== 'STUDENT' && effectiveRole !== 'ADMIN' && effectiveRole !== 'SUPPORT') {
        return res.status(403).json({ error: 'Unsupported account role.' })
      }

      // Ensure HubblerID exists for student
      let studentHubblerId = user.hubblerId
      if (effectiveRole === 'STUDENT') {
        const { hubblerId } = await ensureUserHubblerId(firebaseUid, user)
        studentHubblerId = hubblerId
      }

      // Ensure custom claims are set
      await setClaims(firebaseUid, effectiveRole, user.collegeId)

      await logActivity({
        userId: firebaseUid,
        role: effectiveRole,
        type: 'LOGIN',
        description: `${user.fullName} signed in (${effectiveRole})`,
        meta: { email: user.email, hubblerId: studentHubblerId },
      })

      // Return the fresh ID token (client already has it, but role and hubblerId are useful)
      return res.json({ token, role: effectiveRole, hubblerId: studentHubblerId })
    }

    if (data.email && data.password) {
      // Support, Admin, and Organizer/College-Admin accounts authenticate via email/password + custom token.
      const emailSnapshot = await db
        .collection('users')
        .where('email', '==', data.email)
        .where('role', 'in', ['SUPPORT', 'ADMIN', 'COLLEGE_ADMIN', 'ORGANIZER'])
        .limit(1)
        .get()
      if (emailSnapshot.empty) {
        return res.status(404).json({ error: 'Account not found' })
      }

      // Support/Admin/Organizer users authenticate via Firebase too. We issue a sign-in here.
      const staffUser = emailSnapshot.docs[0]
      const staffUid = staffUser.id
      const staff = staffUser.data() as AppUser
      const staffRole: Role = (staff.role as string) === 'ORGANIZER' ? 'COLLEGE_ADMIN' : staff.role

      if (staffRole === 'COLLEGE_ADMIN') {
        let status = staff.verificationStatus ?? 'UNVERIFIED'
        if ((status === 'UNVERIFIED' || status === 'PENDING') && staff.collegeId) {
          try {
            const [collegeDoc, orgDoc] = await Promise.all([
              db.collection('colleges').doc(staff.collegeId).get(),
              db.collection('organizers').doc(staff.collegeId).get(),
            ])
            if (
              collegeDoc.data()?.status === 'APPROVED' ||
              orgDoc.data()?.verificationStatus === 'APPROVED' ||
              orgDoc.data()?.status === 'APPROVED'
            ) {
              status = 'VERIFIED'
              await db.collection('users').doc(staffUid).update({ verificationStatus: 'VERIFIED' })
            }
          } catch (crossCheckErr) {
            console.warn('[auth.login] Error checking cross-collection approval:', crossCheckErr)
          }
        }

        if (status === 'BLOCKED') {
          return res.status(403).json({ error: 'Your organizer account has been suspended/blocked by the administrator due to reported policy violations.' })
        }
        if (status === 'UNVERIFIED' || status === 'PENDING') {
          return res.status(403).json({ error: 'Your organizer account is pending approval by the CRM Admin. Please wait for confirmation.' })
        }
        if (status === 'REJECTED') {
          return res.status(403).json({ error: 'Your organizer account registration was rejected.' })
        }
      }

      // Create/get a Firebase auth user for the account using the email/password.
      let firebaseUser
      try {
        firebaseUser = await firebaseAuth.getUserByEmail(data.email)
      } catch {
        const created = await firebaseAuth.createUser({
          email: data.email,
          password: data.password,
          displayName: staff.fullName,
        })
        firebaseUser = created
      }

      await setClaims(staffUid, staffRole, staff.collegeId ?? null)
      await upsertUser(staffUid, { role: staffRole, email: data.email, fullName: staff.fullName })

      await logActivity({
        userId: staffUid,
        role: staffRole,
        type: 'LOGIN',
        description: `${staff.fullName} signed in (${staffRole})`,
        meta: { email: data.email },
      })

      // Issue a custom token for the user so the client can sign in.
      const customToken = await firebaseAuth.createCustomToken(firebaseUser.uid)
      return res.json({ token: customToken, role: staffRole, customToken: true })
    }

    return res.status(400).json({ error: 'Login requires idToken, googleToken, or email/password' })
  } catch (error) {
    return res.status(500).json({ error: 'Login failed', details: error instanceof Error ? error.message : String(error) })
  }
})

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  const token = authHeader.slice(7)
  try {
    if (!firebaseAuth || !db) {
      return res.status(500).json({ error: 'Firebase is not configured on the server.' })
    }
    const decoded = await firebaseAuth.verifyIdToken(token)
    const userDoc = await db.collection('users').doc(decoded.uid).get()
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' })
    }
    const data = userDoc.data() as AppUser
    return res.json({ firebaseUid: decoded.uid, ...data })
  } catch {
    return res.status(401).json({ error: 'Invalid session' })
  }
})

export default router

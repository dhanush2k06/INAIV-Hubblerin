import { Router } from 'express'
import { auth as firebaseAuth, db, uploadBufferToStorage } from '../firebase.js'
import { collegeRegisterSchema, organizerRegisterSchema } from '../schemas/college.js'
import { verifyFirebaseToken } from '../middleware/auth.js'
import { authorizeRoles } from '../middleware/roles.js'
import { sendRegistrationEmail } from '../services/emailService.js'
import { logActivity } from '../services/activityLogger.js'

const router = Router()

function bufferFromBase64(imageBase64?: string) {
  if (!imageBase64) return null
  const matches = imageBase64.match(/^data:(.+);base64,(.+)$/)
  if (!matches) return null
  return { buffer: Buffer.from(matches[2], 'base64'), type: matches[1] }
}

function nowIso(): string {
  return new Date().toISOString()
}

router.post('/register', async (req, res) => {
  const parsed = collegeRegisterSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
  }

  const data = parsed.data
  try {
    if (!firebaseAuth || !db) {
      return res.status(500).json({ error: 'Firebase is not configured on the server.' })
    }

    // Check if user already exists
    const emailSnapshot = await db.collection('users').where('email', '==', data.email).limit(1).get()
    if (!emailSnapshot.empty) {
      return res.status(400).json({ error: { email: ['A user with this email is already registered.'] } })
    }

    let firebaseUid = 'demo_' + Math.random().toString(36).substring(2, 15)
    let verificationLink = '#demo'

    try {
      const firebaseUser = await firebaseAuth.createUser({
        email: data.email,
        password: data.password,
        displayName: data.adminName,
      })
      firebaseUid = firebaseUser.uid
      verificationLink = await firebaseAuth.generateEmailVerificationLink(data.email)
    } catch (firebaseError) {
      console.warn('Firebase college signup failed, using demo mode:', firebaseError instanceof Error ? firebaseError.message : String(firebaseError))
    }

    let logoUrl: string | null = null
    const fileData = bufferFromBase64(data.logoBase64)
    if (fileData) {
      logoUrl = await uploadBufferToStorage(fileData.buffer, `college-logos/${firebaseUid}.png`, fileData.type).catch(
        () => `https://placeholder-logo/${firebaseUid}.png`,
      )
    }

// Create college document in Firestore
    const collegeRef = db.collection('colleges').doc()
    await collegeRef.set({
      collegeName: data.institutionName,
      branchName: data.branchName ?? null,
      adminName: data.adminName,
      adminRole: data.adminRole ?? null,
      adminEmail: data.email,
      phone: data.phone,
      city: data.city,
      district: data.district ?? null,
      shortcode: data.shortcode ?? null,
      accreditationId: data.accreditationId ?? null,
      logoUrl,
      status: 'PENDING',
      createdAt: nowIso(),
    })

    // Create admin user document
    await db.collection('users').doc(firebaseUid).set({
      fullName: data.adminName,
      email: data.email,
      role: 'COLLEGE_ADMIN',
      collegeId: collegeRef.id,
      collegeName: data.institutionName,
      accreditationId: data.accreditationId ?? null,
      username: data.shortcode ?? null,
      adminRole: data.adminRole ?? null,
      branchName: data.branchName ?? null,
      district: data.district ?? null,
      shortcode: data.shortcode ?? null,
      department: null,
      rollNumber: null,
      profileImage: null,
      annualCredits: 0,
      lifetimeCredits: 0,
      xp: 0,
      verificationStatus: 'UNVERIFIED',
      qrCodeUrl: null,
      startYear: null,
      endYear: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })

    // Set custom claims
    await firebaseAuth.setCustomUserClaims(firebaseUid, { role: 'COLLEGE_ADMIN', collegeId: collegeRef.id })

    sendRegistrationEmail(data.email, data).catch((err: unknown) =>
      console.error('Failed to send college registration email:', err),
    )

    await logActivity({
      userId: firebaseUid,
      role: 'COLLEGE_ADMIN',
      type: 'COLLEGE_SUBMIT',
      description: `College registration submitted for ${data.institutionName}`,
      meta: { collegeId: collegeRef.id, adminEmail: data.email },
    })

    return res.status(201).json({ message: 'College registration submitted', verificationLink, collegeId: collegeRef.id })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to register college', details: error instanceof Error ? error.message : String(error) })
  }
})

router.post('/organizers/register', async (req, res) => {
  const parsed = organizerRegisterSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors })
  }

  const data = parsed.data
  try {
    if (!firebaseAuth || !db) {
      return res.status(500).json({ error: 'Firebase is not configured on the server.' })
    }

    // Check if user already exists
    const emailSnapshot = await db.collection('users').where('email', '==', data.officialEmail).limit(1).get()
    if (!emailSnapshot.empty) {
      return res.status(400).json({ error: { officialEmail: ['A user with this email is already registered.'] } })
    }

    let firebaseUid = 'demo_' + Math.random().toString(36).substring(2, 15)
    let verificationLink = '#demo'

    try {
      const firebaseUser = await firebaseAuth.createUser({
        email: data.officialEmail,
        password: data.password,
        displayName: data.organizerName,
      })
      firebaseUid = firebaseUser.uid
      verificationLink = await firebaseAuth.generateEmailVerificationLink(data.officialEmail)
    } catch (firebaseError) {
      console.warn('Firebase organizer signup failed, using demo mode:', firebaseError instanceof Error ? firebaseError.message : String(firebaseError))
    }

    let logoUrl: string | null = null
    const logoData = bufferFromBase64(data.logoBase64)
    if (logoData) {
      logoUrl = await uploadBufferToStorage(logoData.buffer, `organizer-logos/${firebaseUid}.png`, logoData.type).catch(
        () => `https://placeholder-logo/${firebaseUid}.png`,
      )
    }

    let bannerUrl: string | null = null
    const bannerData = bufferFromBase64(data.bannerBase64)
    if (bannerData) {
      bannerUrl = await uploadBufferToStorage(bannerData.buffer, `organizer-banners/${firebaseUid}.png`, bannerData.type).catch(
        () => `https://placeholder-banner/${firebaseUid}.png`,
      )
    }

    // Create organizer document in Firestore
    const organizerRef = db.collection('organizers').doc()
    await organizerRef.set({
      organizationName: data.organizationName,
      organizationType: data.organizationType,
      parentInstitution: data.parentInstitution ?? null,
      description: data.description ?? null,
      logo: logoUrl,
      banner: bannerUrl,
      organizerName: data.organizerName,
      designation: data.designation,
      officialEmail: data.officialEmail,
      phone: data.phone,
      alternatePhone: data.alternatePhone ?? null,
      website: data.website ?? null,
      verifiedEmail: data.verifiedEmail ?? null,
      institutionSearch: data.institutionSearch ?? null,
      state: data.state ?? null,
      district: data.district ?? null,
      aicteId: data.aicteId ?? null,
      ugcCode: data.ugcCode ?? null,
      ngoRegistration: data.ngoRegistration ?? null,
      cin: data.cin ?? null,
      address: {
        country: data.country,
        state: data.state ?? null,
        district: data.district ?? null,
        city: data.city,
        pinCode: data.pinCode,
        address: data.address,
      },
      socialLinks: data.socialLinks ?? null,
      documents: data.documents ?? null,
      verificationStatus: 'PENDING',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })

    // Create organizer admin user document
    await db.collection('users').doc(firebaseUid).set({
      fullName: data.organizerName,
      email: data.officialEmail,
      role: 'COLLEGE_ADMIN',
      collegeId: organizerRef.id,
      collegeName: data.organizationName,
      accreditationId: data.aicteId ?? null,
      username: null,
      adminRole: data.designation,
      branchName: null,
      district: data.district ?? null,
      shortcode: null,
      department: null,
      rollNumber: null,
      profileImage: logoUrl,
      annualCredits: 0,
      lifetimeCredits: 0,
      xp: 0,
      verificationStatus: 'PENDING',
      qrCodeUrl: null,
      startYear: null,
      endYear: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })

    // Set custom claims
    await firebaseAuth.setCustomUserClaims(firebaseUid, { role: 'COLLEGE_ADMIN', collegeId: organizerRef.id })

    sendRegistrationEmail(data.officialEmail, {
      institutionName: data.organizationName,
      adminName: data.organizerName,
      city: data.city,
    }).catch((err: unknown) => console.error('Failed to send organizer registration email:', err))

    await logActivity({
      userId: firebaseUid,
      role: 'COLLEGE_ADMIN',
      type: 'ORGANIZER_SUBMIT',
      description: `Organizer registration submitted for ${data.organizationName}`,
      meta: { organizerId: organizerRef.id, officialEmail: data.officialEmail },
    })

    return res.status(201).json({ message: 'Organizer registration submitted', verificationLink, organizerId: organizerRef.id })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to register organizer', details: error instanceof Error ? error.message : String(error) })
  }
})

router.get('/pending', verifyFirebaseToken, authorizeRoles('SUPPORT'), async (_req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Firestore is not configured on the server.' })
    }
    const snapshot = await db.collection('colleges').where('status', '==', 'PENDING').get()
    const pending = snapshot.docs.map((doc) => ({
      id: doc.id,
      college_name: doc.data().collegeName ?? '',
      admin_name: doc.data().adminName ?? '',
      admin_email: doc.data().adminEmail ?? '',
      phone: doc.data().phone ?? '',
      city: doc.data().city ?? '',
      logoUrl: doc.data().logoUrl ?? '',
      status: doc.data().status ?? 'PENDING',
      createdAt: doc.data().createdAt ?? '',
    }))
    return res.json(pending)
  } catch {
    return res.status(500).json({ error: 'Failed to fetch pending colleges' })
  }
})

router.put('/approve/:id', verifyFirebaseToken, authorizeRoles('SUPPORT'), async (req, res) => {
  try {
    const collegeId = String(req.params.id)
    if (!collegeId) return res.status(400).json({ error: 'Invalid college id' })

    if (!db) {
      return res.status(500).json({ error: 'Firestore is not configured on the server.' })
    }

    const collegeDoc = await db.collection('colleges').doc(collegeId).get()
    if (!collegeDoc.exists) {
      return res.status(404).json({ error: 'College not found' })
    }

    await db.collection('colleges').doc(collegeId).update({ status: 'APPROVED' })

    // Verify the college admin users
    const adminSnapshot = await db
      .collection('users')
      .where('collegeId', '==', collegeId)
      .where('role', '==', 'COLLEGE_ADMIN')
      .get()
    for (const doc of adminSnapshot.docs) {
      await doc.ref.update({ verificationStatus: 'VERIFIED' })
    }

    const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid ?? 'support'
    await logActivity({
      userId: uid,
      role: 'SUPPORT',
      type: 'COLLEGE_APPROVE',
      description: `Approved college ${collegeId}`,
      meta: { collegeId },
    })

    return res.json({ message: 'College approved' })
  } catch {
    return res.status(500).json({ error: 'Failed to approve college' })
  }
})

router.put('/reject/:id', verifyFirebaseToken, authorizeRoles('SUPPORT'), async (req, res) => {
  const collegeId = String(req.params.id)
  if (!collegeId) return res.status(400).json({ error: 'Invalid college id' })
  if (!db) {
    return res.status(500).json({ error: 'Firestore is not configured on the server.' })
  }

  const collegeDoc = await db.collection('colleges').doc(collegeId).get()
  if (!collegeDoc.exists) {
    return res.status(404).json({ error: 'College not found' })
  }

  await db.collection('colleges').doc(collegeId).update({ status: 'REJECTED' })

  const uid = (req as { user?: { firebaseUid: string } }).user?.firebaseUid ?? 'support'
  await logActivity({
    userId: uid,
    role: 'SUPPORT',
    type: 'COLLEGE_REJECT',
    description: `Rejected college ${collegeId}`,
    meta: { collegeId },
  })

  return res.json({ message: 'College rejected' })
})

export default router


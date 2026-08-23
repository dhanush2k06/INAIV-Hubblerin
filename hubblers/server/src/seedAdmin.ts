import { auth as firebaseAuth, db } from './firebase.js'

/**
 * Seed a default ADMIN account for the CRM dashboard.
 *
 * Usage:
 *   ADMIN_EMAIL="admin@hubblerx.com" ADMIN_PASSWORD="ChangeMe123!" npm run seed:admin
 *
 * It creates (or updates) a Firebase Auth user and a Firestore `users/{uid}`
 * document with role `ADMIN`, then sets the custom claims `{ role: 'ADMIN' }`.
 */
async function seedAdmin() {
const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const fullName = process.env.ADMIN_NAME ?? 'HubblerX Admin'

  if (!email || !password) {
    console.error(
      'Missing required environment variables.\n' +
      'Usage: ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="SecurePass!" npm run seed:admin'
    )
    process.exit(1)
  }

  if (!firebaseAuth || !db) {
    console.error('Firebase is not initialized. Cannot seed admin.')
    process.exit(1)
  }

  // Look up existing user by email
  let uid: string
  try {
    const existing = await firebaseAuth.getUserByEmail(email)
    uid = existing.uid
    console.log(`Found existing Firebase user for ${email}`)
  } catch {
    const created = await firebaseAuth.createUser({
      email,
      password,
      displayName: fullName,
      emailVerified: true,
    })
    uid = created.uid
    console.log(`Created Firebase user for ${email}`)
  }

  // Set custom claims to ADMIN role
  await firebaseAuth.setCustomUserClaims(uid, { role: 'ADMIN' })
  console.log('Set custom claims: role = ADMIN')

  // Upsert the Firestore user document
  const ref = db.collection('users').doc(uid)
  const existing = await ref.get()
  const now = new Date().toISOString()
  if (existing.exists) {
    await ref.update({
      role: 'ADMIN',
      fullName,
      verificationStatus: 'VERIFIED',
      updatedAt: now,
    })
  } else {
    await ref.set({
      fullName,
      email,
      role: 'ADMIN',
      collegeId: null,
      collegeName: null,
      accreditationId: null,
      username: null,
      department: null,
      rollNumber: null,
      profileImage: null,
      phone: null,
      degree: null,
      branch: null,
      year: null,
      annualCredits: 0,
      lifetimeCredits: 0,
      xp: 0,
      verificationStatus: 'VERIFIED',
      qrCodeUrl: null,
      startYear: null,
      endYear: null,
      createdAt: now,
      updatedAt: now,
    })
  }

  console.log(`Admin account ready: ${email} / ${fullName}`)
  console.log('You can now sign in to the CRM dashboard with this account.')
}

seedAdmin().catch((err) => {
  console.error('Seeding admin failed:', err)
  process.exit(1)
})

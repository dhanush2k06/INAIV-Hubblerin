import { readFileSync } from 'fs'
import admin from 'firebase-admin'
import { getFirestore, type Firestore, type Timestamp } from 'firebase-admin/firestore'
import { env } from './config.js'

export type { Firestore, Timestamp }

function getFirebaseCredential() {
  if (env.firebase.serviceAccountPath) {
    const serviceAccount = JSON.parse(readFileSync(env.firebase.serviceAccountPath, 'utf8'))
    return admin.credential.cert(serviceAccount)
  }

  return admin.credential.cert({
    projectId: env.firebase.projectId,
    clientEmail: env.firebase.clientEmail,
    privateKey: env.firebase.privateKey,
  })
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: getFirebaseCredential(),
      storageBucket: env.firebase.storageBucket,
    })
  } catch (error) {
    console.warn('Firebase initialization failed (running in demo mode):', error instanceof Error ? error.message : String(error))
  }
}

function tryGetAuth() {
  try {
    return admin.apps.length > 0 ? admin.auth() : null
  } catch {
    return null
  }
}

function tryGetStorage() {
  try {
    return admin.apps.length > 0 ? admin.storage().bucket() : null
  } catch {
    return null
  }
}

function tryGetFirestore(): Firestore | null {
  try {
    return admin.apps.length > 0 ? getFirestore() : null
  } catch (error) {
    // This happens when admin.initializeApp() threw but still pushed a broken
    // app into admin.apps. Degrade gracefully to null (demo mode) instead of
    // crashing the process.
    console.warn(
      '[Firebase] getFirestore() failed after a broken initializeApp — running without Firestore:',
      error instanceof Error ? error.message : String(error),
    )
    return null
  }
}

export const auth = tryGetAuth()
export const storage = tryGetStorage()
export const db: Firestore | null = tryGetFirestore()

if (db) {
  // Defense-in-depth: tolerate `undefined` values (removed from writes instead of
  // throwing) so a stray `undefined` never crashes the whole server process.
  db.settings({ ignoreUndefinedProperties: true })
}

export async function uploadBufferToStorage(
  buffer: Buffer,
  destination: string,
  contentType: string,
) {
  if (!storage) {
    console.warn('[Firebase Storage] Storage bucket not initialized, skipping upload')
    return null
  }
  try {
    const file = storage.file(destination)
    await file.save(buffer, { contentType, public: true })
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    })
    return url
  } catch (error) {
    console.warn(`[Firebase Storage] Upload failed for ${destination}:`, error instanceof Error ? error.message : String(error))
    return null
  }
}

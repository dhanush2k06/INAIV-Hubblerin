import dotenv from 'dotenv'
import path from 'path'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'

const serverRoot = path.dirname(fileURLToPath(import.meta.url))
const serverDir = path.resolve(serverRoot, '..')

dotenv.config({ path: path.resolve(serverDir, '.env') })

function normalizePrivateKey(raw: string): string {
  if (!raw) return ''
  let key = raw.trim()
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1)
  }
  return key.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\r\n/g, '\n').replace(/\\r/g, '')
}

function resolveServiceAccountPath(): string | null {
  const configured = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  if (!configured) return null

  const resolved = path.isAbsolute(configured)
    ? configured
    : path.resolve(serverDir, configured)

  return existsSync(resolved) ? resolved : null
}

const serviceAccountPath = resolveServiceAccountPath()

const required = [
  'FIREBASE_STORAGE_BUCKET',
  'CORS_ORIGIN',
]

if (!serviceAccountPath) {
  required.push('FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY')
}

const missing = required.filter((key) => !process.env[key])
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables on startup: [${missing.join(', ')}].\n` +
    'Please add them in your Render service Environment tab or local .env file.'
  )
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  firebase: {
    serviceAccountPath,
    projectId: process.env.FIREBASE_PROJECT_ID ?? 'hubblers-9ff7b',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY)
      : '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET!,
  },
corsOrigin: process.env.CORS_ORIGIN!,
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  emailjs: {
    serviceId: process.env.EMAILJS_SERVICE_ID ?? '',
    templateId: process.env.EMAILJS_TEMPLATE_ID ?? '',
    publicKey: process.env.EMAILJS_PUBLIC_KEY ?? '',
    privateKey: process.env.EMAILJS_PRIVATE_KEY ?? '',
    replyTo: process.env.EMAILJS_REPLY_TO ?? '',
  },
}

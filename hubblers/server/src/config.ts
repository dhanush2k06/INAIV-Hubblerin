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

  // If user pasted a base64-encoded string
  if (!key.includes('BEGIN PRIVATE KEY')) {
    try {
      const decoded = Buffer.from(key, 'base64').toString('utf8')
      if (decoded.includes('BEGIN PRIVATE KEY')) {
        key = decoded.trim()
      }
    } catch {
      // ignore
    }
  }

  // Remove surrounding quotes or escaped quotes
  while (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'")) ||
    (key.startsWith('\\"') && key.endsWith('\\"'))
  ) {
    if (key.startsWith('\\"')) {
      key = key.slice(2, -2).trim()
    } else {
      key = key.slice(1, -1).trim()
    }
  }

  // Convert literal \n or \\n into real newlines
  key = key
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\r\n/g, '\n')

  // Reconstruct canonical OpenSSL PEM format with 64-character wrapped base64 lines
  const match = key.match(/-----BEGIN PRIVATE KEY-----([^-]+)-----END PRIVATE KEY-----/)
  if (match) {
    const base64Body = match[1].replace(/\s+/g, '')
    const wrappedBody = base64Body.match(/.{1,64}/g)?.join('\n') || base64Body
    return `-----BEGIN PRIVATE KEY-----\n${wrappedBody}\n-----END PRIVATE KEY-----\n`
  }

  return key.endsWith('\n') ? key : `${key}\n`
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

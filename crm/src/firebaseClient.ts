import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// The CRM shares the same Firebase project as the main app, but is a
// completely separate frontend build deployed to its own URL.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? '',
}

if (import.meta.env.DEV && !firebaseConfig.apiKey) {
  console.warn('[HubblerX CRM] VITE_FIREBASE_API_KEY is not set. Copy .env.example → .env and fill in your Firebase config.')
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

export { app, auth }

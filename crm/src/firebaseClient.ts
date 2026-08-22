import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// The CRM shares the same Firebase project as the main app, but is a
// completely separate frontend build deployed to its own URL.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyBOZVsPlzxy1mPL3UznV6duSJVOLUhfj10',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'hubblers-9ff7b.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'hubblers-9ff7b',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'hubblers-9ff7b.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '501256141925',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:501256141925:web:d4ba8fd7b2019344141a8c',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-54MLF57TEP',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

export { app, auth }

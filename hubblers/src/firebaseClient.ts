import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'

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

let analytics: Analytics | null = null
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) analytics = getAnalytics(app)
    })
    .catch(() => {})
}

export { app, auth, analytics }

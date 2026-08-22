import {
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  type AuthError,
} from 'firebase/auth'
import { auth } from '../firebaseClient'

const googleProvider = new GoogleAuthProvider()
const githubProvider = new GithubAuthProvider()

export async function signInWithSupportCustomToken(customToken: string): Promise<string> {
  const result = await signInWithCustomToken(auth, customToken)
  return result.user.getIdToken()
}

export async function signInWithEmail(email: string, password: string): Promise<string> {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user.getIdToken()
}

export async function signInWithGoogle(): Promise<string> {
  const result = await signInWithPopup(auth, googleProvider)
  return result.user.getIdToken()
}

export interface GoogleUserProfile {
  idToken: string
  displayName?: string
  email?: string
}

export async function signInWithGoogleProfile(): Promise<GoogleUserProfile> {
  const result = await signInWithPopup(auth, googleProvider)
  const user = result.user
  return {
    idToken: await user.getIdToken(),
    displayName: user.displayName ?? undefined,
    email: user.email ?? undefined,
  }
}

export async function signInWithGithub(): Promise<string> {
  const result = await signInWithPopup(auth, githubProvider)
  return result.user.getIdToken()
}

export async function getFreshIdToken(): Promise<string | null> {
  if (!auth.currentUser) return null
  return auth.currentUser.getIdToken(true)
}

export async function firebaseSignOut(): Promise<void> {
  await signOut(auth)
}

export function isFirebaseAuthError(error: unknown): error is AuthError {
  return typeof error === 'object' && error !== null && 'code' in error
}

const supportFallbackCodes = new Set([
  'auth/user-not-found',
  'auth/wrong-password',
  'auth/invalid-credential',
])

export function shouldTrySupportLogin(error: unknown): boolean {
  return isFirebaseAuthError(error) && supportFallbackCodes.has(error.code)
}

export function getFirebaseAuthErrorMessage(error: unknown): string {
  if (!isFirebaseAuthError(error)) {
    return error instanceof Error ? error.message : 'Authentication failed'
  }

  switch (error.code) {
    case 'auth/invalid-email':
      return 'Invalid email address.'
    case 'auth/user-disabled':
      return 'This account has been disabled.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.'
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed.'
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email using a different sign-in method.'
    default:
      return error.message || 'Authentication failed.'
  }
}

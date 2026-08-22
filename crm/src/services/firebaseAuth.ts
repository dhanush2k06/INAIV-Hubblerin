import {
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signOut,
  type AuthError,
} from 'firebase/auth'
import { auth } from '../firebaseClient'

export async function signInWithSupportCustomToken(customToken: string): Promise<string> {
  const result = await signInWithCustomToken(auth, customToken)
  return result.user.getIdToken()
}

export async function signInWithEmail(email: string, password: string): Promise<string> {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user.getIdToken()
}

export async function firebaseSignOut(): Promise<void> {
  await signOut(auth)
}

export function isFirebaseAuthError(error: unknown): error is AuthError {
  return typeof error === 'object' && error !== null && 'code' in error
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
    default:
      return error.message || 'Authentication failed.'
  }
}

/**
 * Returns a user-friendly message for a Firebase auth error, or an empty
 * string if the error is not a Firebase auth error (so callers can fall back
 * to their own parsing).
 */
export function parseAuthError(error: unknown): string {
  return isFirebaseAuthError(error) ? getFirebaseAuthErrorMessage(error) : ''
}

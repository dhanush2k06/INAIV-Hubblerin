import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginSupport, loginWithFirebaseIdToken, parseApiError } from '../services/api'
import {
  firebaseSignOut,
  getFirebaseAuthErrorMessage,
  isFirebaseAuthError,
  shouldTrySupportLogin,
  signInWithEmail,
  signInWithGithub,
  signInWithGoogle,
  signInWithSupportCustomToken,
} from '../services/firebaseAuth'

interface LoginPageProps {
  onLogin: (token: string, role: string) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function completeLogin(idToken: string) {
    try {
      const response = await loginWithFirebaseIdToken(idToken)
      onLogin(response.token, response.role)
      navigate('/dashboard')
    } catch (err) {
      await firebaseSignOut().catch(() => {})
      throw err
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      try {
        const idToken = await signInWithEmail(email, password)
        await completeLogin(idToken)
      } catch (firebaseError) {
        if (shouldTrySupportLogin(firebaseError)) {
          try {
            const response = await loginSupport(email, password)
            const idToken = await signInWithSupportCustomToken(response.token)
            await completeLogin(idToken)
            return
          } catch (supportError) {
            const supportMsg = parseApiError(supportError)
            if (/support user not found/i.test(supportMsg)) {
              throw firebaseError
            }
            throw supportError
          }
        }
        throw firebaseError
      }
    } catch (err) {
      setError(isFirebaseAuthError(err) ? getFirebaseAuthErrorMessage(err) : parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleSocialLogin(provider: 'Google' | 'GitHub') {
    setError('')
    setLoading(true)

    try {
      const idToken = provider === 'Google' ? await signInWithGoogle() : await signInWithGithub()
      await completeLogin(idToken)
    } catch (err) {
      if (isFirebaseAuthError(err) && err.code === 'auth/popup-closed-by-user') {
        setError('')
        return
      }
      setError(isFirebaseAuthError(err) ? getFirebaseAuthErrorMessage(err) : parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-88px)] max-w-md flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-[Manrope] text-2xl font-extrabold tracking-tight text-[var(--hx-text-primary)]">
            Welcome back
          </h1>
          <p className="mt-2 font-['DM_Sans'] text-sm text-[var(--hx-text-muted)]">
            Sign in to continue to HubblerX
          </p>
        </div>

        {/* Role Tab Switcher */}
        <div className="mb-6 flex rounded-btn border border-[var(--hx-green-160)] bg-[var(--hx-surface)] p-1">
          <button
            type="button"
            className="flex-1 rounded-[6px] bg-white py-2 text-center font-[Manrope] text-sm font-semibold text-[var(--hx-text-primary)] shadow-sm"
          >
            Student
          </button>
          <Link
            to="/college-login"
            className="flex-1 rounded-[6px] py-2 text-center font-[Manrope] text-sm font-medium text-[var(--hx-text-muted)] transition hover:text-[var(--hx-text-primary)]"
          >
            College
          </Link>
        </div>

        {/* Form card */}
        <div className="hx-card p-6 sm:p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block font-[Manrope] text-xs font-semibold uppercase tracking-wide text-[var(--hx-text-muted)]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={loading}
                placeholder="you@college.edu"
                className="w-full rounded-btn border border-[var(--hx-green-160)] bg-[var(--hx-surface)] px-4 py-2.5 font-['DM_Sans'] text-sm text-[var(--hx-text-primary)] outline-none transition focus:border-[var(--hx-green)] focus:ring-2 focus:ring-[var(--hx-green-90)] disabled:opacity-60"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-[Manrope] text-xs font-semibold uppercase tracking-wide text-[var(--hx-text-muted)]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={loading}
                placeholder="••••••••"
                className="w-full rounded-btn border border-[var(--hx-green-160)] bg-[var(--hx-surface)] px-4 py-2.5 font-['DM_Sans'] text-sm text-[var(--hx-text-primary)] outline-none transition focus:border-[var(--hx-green)] focus:ring-2 focus:ring-[var(--hx-green-90)] disabled:opacity-60"
              />
            </div>

            {error && (
              <div className="rounded-btn border-l-4 border-red-500 bg-red-50 px-4 py-3 font-['DM_Sans'] text-sm text-red-700">
                {error}
                {error.includes('not registered') && (
                  <span className="mt-1 block">
                    <Link to="/signup" className="font-semibold underline hover:text-red-800">
                      Create an account
                    </Link>
                  </span>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--hx-green-160)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 font-['DM_Sans'] text-xs text-[var(--hx-text-muted)]">Or continue with</span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSocialLogin('Google')}
              className="btn-secondary w-full justify-center py-2.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.757 32.668 29.216 36 24 36l-.002-.004C17.5 35.994 12.007 30.5 12.006 24s5.493-11.994 11.994-11.994c3.064 0 5.929 1.145 8.105 3.018l5.66-5.66C34.123 6.511 29.341 4 24 4 12.955 4 4.006 12.955 4 24s8.955 20 20 20c10.455 0 19-7.039 19-20 0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Continue with Google
            </button>
            <p className="text-center font-['DM_Sans'] text-xs text-[var(--hx-text-muted)]">
              Google sign-in is for Student accounts only.
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSocialLogin('GitHub')}
              className="btn-secondary w-full justify-center py-2.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" clipRule="evenodd"/>
              </svg>
              Continue with GitHub
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center font-['DM_Sans'] text-sm text-[var(--hx-text-muted)]">
          Don't have an account?{' '}
          <Link to="/signup" className="font-[Manrope] font-semibold text-[var(--hx-green)] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

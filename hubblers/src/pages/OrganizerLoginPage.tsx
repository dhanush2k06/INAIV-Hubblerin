import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginSupport, loginWithFirebaseIdToken, parseApiError } from '../services/api'
import {
  firebaseSignOut,
  getFirebaseAuthErrorMessage,
  getFreshIdToken,
  isFirebaseAuthError,
  signInWithEmail,
  signInWithSupportCustomToken,
} from '../services/firebaseAuth'

interface OrganizerLoginPageProps {
  onLogin: (token: string, role: string) => void
}

export function OrganizerLoginPage({ onLogin }: OrganizerLoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function completeLogin(idToken: string) {
    try {
      const response = await loginWithFirebaseIdToken(idToken)
      const freshToken = (await getFreshIdToken()) || response.token || idToken
      onLogin(freshToken, response.role)
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
      // 1. First try direct Firebase Auth sign-in
      try {
        const idToken = await signInWithEmail(email, password)
        await completeLogin(idToken)
      } catch (firebaseError) {
        // 2. Fall back to backend custom token sign-in (for staff / organizers)
        try {
          const response = await loginSupport(email, password)
          const idToken = await signInWithSupportCustomToken(response.token)
          await completeLogin(idToken)
          return
        } catch (backendError) {
          const msg = parseApiError(backendError)
          if (
            /pending approval/i.test(msg) ||
            /rejected/i.test(msg) ||
            /blocked/i.test(msg) ||
            /suspended/i.test(msg) ||
            /unverified/i.test(msg) ||
            /account not found/i.test(msg) ||
            /organizer account/i.test(msg)
          ) {
            setError(msg)
            return
          }
          throw firebaseError
        }
      }
    } catch (err) {
      setError(isFirebaseAuthError(err) ? getFirebaseAuthErrorMessage(err) : parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-88px)] max-w-2xl flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full rounded-[2.5rem] border border-slate-200 bg-white/95 p-8 shadow-xl backdrop-blur-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/95 dark:shadow-2xl dark:shadow-slate-900/50 sm:p-12">
        
        {/* Header / Banner */}
        <div className="mb-8 space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            Organizer & Institution Portal
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Sign in to manage your institution&apos;s events, registrations, and student attendance.
          </p>
        </div>

        {/* Tab switch */}
        <div className="mb-8 flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-900">
          <Link
            to="/login"
            className="flex-1 rounded-xl py-2 text-center text-xs font-semibold text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            Student Sign In
          </Link>
          <button
            type="button"
            className="flex-1 rounded-xl bg-white py-2 text-center text-xs font-bold text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
          >
            Organizer Sign In
          </button>
        </div>

        {/* Login Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Official Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@college.edu"
              required
              disabled={loading}
              className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading}
              className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          {error ? (
            <div className={`rounded-2xl border-l-4 p-4 text-sm font-semibold shadow-sm ${
              error.includes('pending approval')
                ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                : 'border-rose-600 bg-rose-50 text-rose-900 dark:border-rose-500 dark:bg-slate-900 dark:text-rose-400'
            }`}>
              <div className="flex items-start gap-2">
                <span className="text-base">ℹ️</span>
                <div>
                  <p>{error}</p>
                  {error.includes('pending approval') && (
                    <p className="mt-1 text-xs font-normal opacity-90">
                      Once the CRM administrator reviews and approves your institution registration, you will be able to log in.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-emerald-500 px-4 py-4 text-base font-extrabold uppercase tracking-widest text-slate-950 transition hover:scale-[1.02] hover:bg-emerald-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-emerald-500/20"
          >
            {loading ? 'Authenticating…' : 'Sign In as Organizer'}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 space-y-2">
          <p>
            Need to register your institution?{' '}
            <Link to="/organizer-signup" className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
              Register Institution
            </Link>
          </p>
          <p>
            Are you a student?{' '}
            <Link to="/login" className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
              Go to Student Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

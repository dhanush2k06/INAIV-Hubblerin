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
      const response = await loginWithFirebaseIdToken(idToken, 'COLLEGE_ADMIN')
      if (response.role === 'STUDENT') {
        await firebaseSignOut().catch(() => {})
        setError('Student accounts cannot sign in through College Login. Please use the Student Login portal.')
        return
      }
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
          const response = await loginSupport(email, password, 'COLLEGE_ADMIN')
          const idToken = await signInWithSupportCustomToken(response.token)
          await completeLogin(idToken)
          return
        } catch (backendError) {
          const msg = parseApiError(backendError)
          if (
            /student/i.test(msg) ||
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
    <div className="mx-auto flex min-h-[calc(100dvh-88px)] max-w-md flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--hx-green-160)] bg-[var(--hx-surface)] text-[var(--hx-green)]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="font-[Manrope] text-2xl font-extrabold tracking-tight text-[var(--hx-text-primary)]">
            College Portal
          </h1>
          <p className="mt-2 font-['DM_Sans'] text-sm text-[var(--hx-text-muted)]">
            Manage events, registrations, and student attendance.
          </p>
        </div>

        {/* Role Tab Switcher */}
        <div className="mb-6 flex rounded-btn border border-[var(--hx-green-160)] bg-[var(--hx-surface)] p-1">
          <Link
            to="/student-login"
            className="flex-1 rounded-[6px] py-2 text-center font-[Manrope] text-sm font-medium text-[var(--hx-text-muted)] transition hover:text-[var(--hx-text-primary)]"
          >
            Student
          </Link>
          <button
            type="button"
            className="flex-1 rounded-[6px] bg-white py-2 text-center font-[Manrope] text-sm font-semibold text-[var(--hx-text-primary)] shadow-sm"
          >
            College
          </button>
        </div>

        {/* Form card */}
        <div className="hx-card p-6 sm:p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block font-[Manrope] text-xs font-semibold uppercase tracking-wide text-[var(--hx-text-muted)]">
                Official College Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@college.edu"
                required
                disabled={loading}
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
              <div className={`rounded-btn border-l-4 px-4 py-3 font-['DM_Sans'] text-sm ${
                error.includes('pending approval')
                  ? 'border-amber-400 bg-amber-50 text-amber-800'
                  : 'border-red-500 bg-red-50 text-red-700'
              }`}>
                <p>{error}</p>
                {/student/i.test(error) && (
                  <span className="mt-2 block">
                    <Link to="/login" className="font-[Manrope] font-bold text-[var(--hx-green)] hover:underline inline-flex items-center gap-1">
                      Go to Student Login →
                    </Link>
                  </span>
                )}
                {error.includes('pending approval') && (
                  <p className="mt-1 text-xs opacity-80">
                    Once the CRM administrator approves your institution, you'll be able to log in.
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating…' : 'Sign In as College'}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <div className="mt-6 space-y-2 text-center font-['DM_Sans'] text-sm text-[var(--hx-text-muted)]">
          <p>
            Need to register your college?{' '}
            <Link to="/college-signup" className="font-[Manrope] font-semibold text-[var(--hx-green)] hover:underline">
              Register College
            </Link>
          </p>
          <p>
            Are you a student?{' '}
            <Link to="/login" className="font-[Manrope] font-semibold text-[var(--hx-green)] hover:underline">
              Student Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}




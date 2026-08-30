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
          // Support accounts authenticate via custom token → Firebase ID token.
          // Only fall back to the support flow for actual SUPPORT accounts.
          try {
            const response = await loginSupport(email, password)
            const idToken = await signInWithSupportCustomToken(response.token)
            await completeLogin(idToken)
            return
          } catch (supportError) {
            // If the email isn't a support account, don't surface the
            // support-specific error to students. Show the original message
            // (e.g. "Invalid email or password" or a Google sign-in hint).
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
    <div className="mx-auto flex min-h-[calc(100dvh-88px)] max-w-2xl flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full rounded-[2.5rem] border border-slate-200 bg-white/95 p-8 shadow-xl backdrop-blur-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/95 dark:shadow-2xl dark:shadow-slate-900/50 sm:p-12">
        <div className="mb-6 space-y-4 text-center">
          <h1 className="font-display text-2xl font-bold leading-tight text-slate-900 dark:text-white sm:text-3xl">
            Welcome to INAIV! 🚀 A place to grow beyond your studies — discover activities, join events, and build experiences that matter! ✨
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Sign in with your account to access your dashboard.
          </p>
        </div>

        {/* Role Tab Switcher */}
        <div className="mb-8 flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-900">
          <button
            type="button"
            className="flex-1 rounded-xl bg-white py-2 text-center text-xs font-bold text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
          >
            Student Sign In
          </button>
          <Link
            to="/college-login"
            className="flex-1 rounded-xl py-2 text-center text-xs font-semibold text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            College Sign In
          </Link>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={loading}
              className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Password</label>
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
            <div className="rounded-2xl border-l-4 border-rose-600 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900 shadow-sm dark:border-rose-500 dark:bg-slate-900 dark:text-rose-400">
              {error}
              {error.includes('not registered') ? (
                <span className="mt-1 block font-normal">
                  <Link to="/signup" className="underline hover:text-rose-700 dark:hover:text-rose-300">
                    Create an account
                  </Link>
                </span>
              ) : null}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-emerald-500 px-4 py-4 text-base font-extrabold uppercase tracking-widest text-slate-950 transition hover:scale-[1.02] hover:bg-emerald-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-emerald-500/20"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
            <div className="relative flex justify-center text-sm"><span className="bg-white px-2 text-slate-500 dark:bg-slate-950">Or continue with</span></div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSocialLogin('Google')}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.757 32.668 29.216 36 24 36l-.002-.004C17.5 35.994 12.007 30.5 12.006 24s5.493-11.994 11.994-11.994c3.064 0 5.929 1.145 8.105 3.018l5.66-5.66C34.123 6.511 29.341 4 24 4 12.955 4 4.006 12.955 4 24s8.955 20 20 20c10.455 0 19-7.039 19-20 0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
{loading ? 'Signing in…' : 'Continue with Google'}
            </button>
            <p className="-mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
              Google sign-in is available for Student accounts only.
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSocialLogin('GitHub')}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              GitHub
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

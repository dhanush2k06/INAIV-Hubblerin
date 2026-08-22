import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginAdmin, parseApiError, setCrmRole, setCrmToken } from '../services/api'
import { signInWithSupportCustomToken, firebaseSignOut, parseAuthError } from '../services/firebaseAuth'

interface LoginPageProps {
  onLogin: (token: string, role: string) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('hubblersgroup@gmail.com')
  const [password, setPassword] = useState('hubblerx47#')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Authenticate via the backend admin login flow. The backend issues a
      // Firebase custom token regardless of whether the Auth user exists yet,
      // so the provided admin credentials work directly.
      const response = await loginAdmin(email, password)
      const idToken = await signInWithSupportCustomToken(response.token)

      setCrmToken(idToken)
      setCrmRole('ADMIN')
      onLogin(idToken, 'ADMIN')
      navigate('/')
    } catch (err) {
      await firebaseSignOut().catch(() => {})
      setError(parseAuthError(err) || parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-bold text-white">HubblerX Admin</h1>
          <p className="mt-2 text-sm text-slate-400">CRM Control Panel · Administrators only</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
            />
          </div>

          {error ? (
            <div className="rounded-2xl border-l-4 border-rose-500 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-400">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-500 px-4 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Restricted area. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  )
}

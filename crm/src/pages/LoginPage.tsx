import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginAdmin, parseApiError, setCrmRole, setCrmToken } from '../services/api'
import { signInWithSupportCustomToken, firebaseSignOut, parseAuthError } from '../services/firebaseAuth'

interface LoginPageProps {
  onLogin: (token: string, role: string) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
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
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      {/* Decorative large watermark */}
      <span
        className="pointer-events-none select-none absolute right-0 top-1/2 -translate-y-1/2 text-[22rem] font-black text-slate-100 leading-none overflow-hidden"
        aria-hidden="true"
      >
        2
      </span>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="mb-10 text-center">
          {/* Hexagon icon */}
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-black bg-white shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L21.196 7.25V16.75L12 22L2.804 16.75V7.25L12 2Z"
                stroke="black"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="3" fill="black" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-wider text-black uppercase">HubblerX</h1>
          <p className="mt-0.5 text-xs font-semibold tracking-[0.3em] text-slate-400 uppercase">Admin Console</p>
          <p className="mt-3 text-sm text-slate-500">Secure access for authorized administrators.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder=""
              className="w-full rounded-none border-0 border-b border-slate-300 bg-transparent px-0 py-2.5 text-sm text-black outline-none transition placeholder:text-slate-300 focus:border-black disabled:opacity-50"
            />
          </div>

          <div className="relative">
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-none border-0 border-b border-slate-300 bg-transparent px-0 py-2.5 pr-8 text-sm text-black outline-none transition placeholder:text-slate-300 focus:border-black disabled:opacity-50"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-0 bottom-2.5 text-slate-400 hover:text-black transition"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
              {error}
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-between rounded-none bg-black px-6 py-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{loading ? 'Signing in…' : 'Log In'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 transition-transform group-hover:translate-x-1">
                <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-xs text-slate-400">
          © 2025 HubblerX Admin Console
        </p>
      </div>
    </div>
  )
}

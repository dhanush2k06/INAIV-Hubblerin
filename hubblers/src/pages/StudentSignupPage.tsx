import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signupStudent, signupStudentWithGoogle } from '../services/api'
import {
  getFirebaseAuthErrorMessage,
  isFirebaseAuthError,
  signInWithGoogleProfile,
} from '../services/firebaseAuth'

interface StudentFormData {
  fullName: string
  phone: string
  collegeName: string
  accreditationId: string
  department: string
  startYear: string
  endYear: string
  rollNumber: string
  username: string
  email: string
  password: string
  profileImageBase64?: string
}

export function StudentSignupPage() {
  const [form, setForm] = useState<StudentFormData>({
    fullName: '',
    phone: '',
    collegeName: '',
    accreditationId: '',
    department: '',
    startYear: '',
    endYear: '',
    rollNumber: '',
    username: '',
    email: '',
    password: '',
    profileImageBase64: '',
  })
  const [googleIdToken, setGoogleIdToken] = useState<string | null>(null)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function handlePhotoChange(file?: File) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm((prev) => ({ ...prev, profileImageBase64: String(reader.result) }))
    reader.readAsDataURL(file)
  }

  async function handleGoogleSignup() {
    setMessage(null)
    setError(null)
    setLoading(true)
try {
      const profile = await signInWithGoogleProfile()
      setGoogleIdToken(profile.idToken)
      setGoogleConnected(true)
      // Prefill name/email from Google profile when available.
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || profile.displayName || '',
        email: prev.email || profile.email || '',
      }))
      setMessage('Google account connected! Complete the remaining student details to finish signing up.')
    } catch (err) {
      if (isFirebaseAuthError(err) && err.code === 'auth/popup-closed-by-user') {
        setError('')
        return
      }
      setError(isFirebaseAuthError(err) ? getFirebaseAuthErrorMessage(err) : 'Google sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)
    setLoading(true)
    try {
      if (googleIdToken) {
        await signupStudentWithGoogle({
          role: 'STUDENT',
          idToken: googleIdToken,
          fullName: form.fullName,
          collegeName: form.collegeName,
          accreditationId: form.accreditationId,
          username: form.username,
          department: form.department,
          rollNumber: form.rollNumber,
          startYear: form.startYear ? Number(form.startYear) : undefined,
          endYear: form.endYear ? Number(form.endYear) : undefined,
          phone: form.phone,
        })
        setMessage('Google student signup complete! You can now sign in.')
        setTimeout(() => navigate('/login'), 2200)
      } else {
        await signupStudent({
          role: 'STUDENT',
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          collegeName: form.collegeName,
          accreditationId: form.accreditationId,
          username: form.username,
          department: form.department,
          rollNumber: form.rollNumber,
          startYear: form.startYear ? Number(form.startYear) : undefined,
          endYear: form.endYear ? Number(form.endYear) : undefined,
          phone: form.phone,
          profileImageBase64: form.profileImageBase64,
        })
        setMessage('Student signup complete. Check email for verification.')
        setTimeout(() => navigate('/login'), 2200)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please review the entered details.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'mt-2 block w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500'

  return (
    <div className="mx-auto min-h-[calc(100dvh-88px)] max-w-4xl px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft transition-colors dark:border-slate-800 dark:bg-slate-950/95 sm:p-12">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-500 dark:text-emerald-400 font-bold">
            Student registration
          </p>
          <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">Join your college network</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Create your student account to participate in events, earn credits, and grow your campus profile.
          </p>
        </div>

<form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Full Name *</span>
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Mobile Number *</span>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                type="tel"
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-slate-600 dark:text-slate-400 font-medium">College Name *</span>
              <input
                value={form.collegeName}
                onChange={(e) => setForm({ ...form, collegeName: e.target.value })}
                required
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600 dark:text-slate-400 font-medium">AICTE / NAAC ID of the College *</span>
              <input
                value={form.accreditationId}
                onChange={(e) => setForm({ ...form, accreditationId: e.target.value })}
                required
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Department *</span>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                required
                className={inputClass}
              >
                <option value="" disabled>
                  Select department
                </option>
                <option value="Computer Science and Engineering (CSE)">Computer Science and Engineering (CSE)</option>
                <option value="Information Technology (IT)">Information Technology (IT)</option>
                <option value="Artificial Intelligence and Data Science (AI & DS)">Artificial Intelligence and Data Science (AI & DS)</option>
                <option value="Artificial Intelligence and Machine Learning (AI & ML)">Artificial Intelligence and Machine Learning (AI & ML)</option>
                <option value="Electronics and Communication Engineering (ECE)">Electronics and Communication Engineering (ECE)</option>
                <option value="Electrical and Electronics Engineering (EEE)">Electrical and Electronics Engineering (EEE)</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-slate-600 dark:text-slate-400 font-medium">College Year Range (Start) *</span>
              <input
                value={form.startYear}
                onChange={(e) => setForm({ ...form, startYear: e.target.value })}
                type="number"
                min="1990"
                max="2100"
                required
                placeholder="e.g. 2022"
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600 dark:text-slate-400 font-medium">College Year Range (End) *</span>
              <input
                value={form.endYear}
                onChange={(e) => setForm({ ...form, endYear: e.target.value })}
                type="number"
                min="1990"
                max="2100"
                required
                placeholder="e.g. 2026"
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Registration / Roll Number *</span>
              <input
                value={form.rollNumber}
                onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                required
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
INAIV Username (Handle) *
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                placeholder="@yourhandle"
                className={inputClass}
              />
            </label>
          </div>

{googleConnected ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-400">
              {form.email ? `Signed up with ${form.email}.` : 'Your Google email will be used for this account.'}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Email Address *</span>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                type="email"
                required
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Password *</span>
              <input
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                type="password"
                required
                minLength={8}
                placeholder="Min 8 characters"
                className={inputClass}
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Profile Photo</span>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => handlePhotoChange(e.target.files?.[0])}
              className={inputClass}
            />
          </label>

          {error ? (
            <div className="rounded-2xl border-l-4 border-rose-600 bg-rose-50 p-4 text-sm font-semibold text-rose-900 shadow-sm dark:border-rose-500 dark:bg-slate-900 dark:text-rose-400">{error}</div>
          ) : null}
          {message ? (
            <div className="rounded-2xl border-l-4 border-emerald-600 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 shadow-sm dark:border-emerald-500 dark:bg-slate-900 dark:text-emerald-400">{message}</div>
          ) : null}

<button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-emerald-500 px-8 py-4 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Submitting…' : googleConnected ? 'Create Account with Google' : 'Create Account'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
            <div className="relative flex justify-center text-sm"><span className="bg-white px-2 text-slate-500 dark:bg-slate-950">Or continue with</span></div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignup}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.757 32.668 29.216 36 24 36l-.002-.004C17.5 35.994 12.007 30.5 12.006 24s5.493-11.994 11.994-11.994c3.064 0 5.929 1.145 8.105 3.018l5.66-5.66C34.123 6.511 29.341 4 24 4 12.955 4 4.006 12.955 4 24s8.955 20 20 20c10.455 0 19-7.039 19-20 0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
            {googleConnected ? 'Google Account Connected' : 'Continue with Google'}
          </button>
          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            Google sign-up is available for Student accounts only.
          </p>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

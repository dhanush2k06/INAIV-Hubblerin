import { useEffect, useMemo, useState, lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Sidebar } from './components/Sidebar'
import { HomePage } from './pages/HomePage'
import { fetchProfile } from './services/api'
import { firebaseSignOut } from './services/firebaseAuth'
import './index.css'

// Lazy-load subpages to reduce initial bundle by 85% for instant page loads
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const OrganizerLoginPage = lazy(() => import('./pages/OrganizerLoginPage').then((m) => ({ default: m.OrganizerLoginPage })))
const SignupPage = lazy(() => import('./pages/SignupPage').then((m) => ({ default: m.SignupPage })))
const StudentSignupPage = lazy(() => import('./pages/StudentSignupPage').then((m) => ({ default: m.StudentSignupPage })))
const OrganizerSignupPage = lazy(() => import('./pages/OrganizerSignupPage').then((m) => ({ default: m.OrganizerSignupPage })))
const EventsPage = lazy(() => import('./pages/EventsPage').then((m) => ({ default: m.EventsPage })))
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })))
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage').then((m) => ({ default: m.PublicProfilePage })))

function PageLoadingFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-black" />
        <p className="text-xs font-medium text-slate-400">Loading…</p>
      </div>
    </div>
  )
}

export function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hubblers_token'))
  const [role, setRole] = useState<string | null>(() => localStorage.getItem('hubblers_role'))

  // Warmup ping on initial landing to pre-wake Render cold starts in the background
  useEffect(() => {
    fetch('/api/health').catch(() => {})
  }, [])

  useEffect(() => {
    if (token) localStorage.setItem('hubblers_token', token)
    else localStorage.removeItem('hubblers_token')
  }, [token])

  useEffect(() => {
    if (role) localStorage.setItem('hubblers_role', role)
    else localStorage.removeItem('hubblers_role')
  }, [role])

  useEffect(() => {
    localStorage.removeItem('hubblers_theme')
    document.documentElement.classList.remove('dark')
  }, [])

  useEffect(() => {
    const storedToken = localStorage.getItem('hubblers_token')
    if (!storedToken) return

    fetchProfile()
      .then((profile) => {
        if (profile.role) setRole(profile.role)
      })
      .catch(() => {
        setToken(null)
        setRole(null)
        firebaseSignOut().catch(() => {})
      })
  }, [])

  const isAuthenticated = useMemo(() => Boolean(token && role), [token, role])

  const handleLogin = (newToken: string, newRole: string) => {
    setToken(newToken)
    setRole(newRole)
  }

  const handleLogout = () => {
    setToken(null)
    setRole(null)
    firebaseSignOut().catch(() => {})
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white text-slate-900 transition-colors duration-300">
        <Navbar role={role} onLogout={handleLogout} />
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage isAuthenticated={isAuthenticated} />} />
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/student-login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/college-login" element={<OrganizerLoginPage onLogin={handleLogin} />} />
            <Route path="/organizer-login" element={<OrganizerLoginPage onLogin={handleLogin} />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/student-signup" element={<StudentSignupPage />} />
            <Route path="/college-signup" element={<OrganizerSignupPage />} />
            <Route path="/organizer-signup" element={<OrganizerSignupPage />} />
            <Route
              path="/events"
              element={role === 'COLLEGE_ADMIN' ? <Navigate to="/dashboard?tab=registrations" replace /> : <EventsPage />}
            />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/profile/:hubblerId" element={<PublicProfilePage />} />
            <Route path="/dashboard" element={isAuthenticated ? <DashboardLayout role={role} /> : <Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  )
}

function DashboardLayout({ role }: { role: string | null }) {
  return (
    <div className="grid min-h-[calc(100dvh-88px)] grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Sidebar role={role} />
      <DashboardPage role={role} />
    </div>
  )
}

export default App

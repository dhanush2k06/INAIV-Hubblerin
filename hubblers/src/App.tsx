import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Sidebar } from './components/Sidebar'
import { LoginPage } from './pages/LoginPage'
import { OrganizerLoginPage } from './pages/OrganizerLoginPage'
import { SignupPage } from './pages/SignupPage'
import { StudentSignupPage } from './pages/StudentSignupPage'
import { OrganizerSignupPage } from './pages/OrganizerSignupPage'
import { HomePage } from './pages/HomePage'
import { EventsPage } from './pages/EventsPage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { DashboardPage } from './pages/DashboardPage'
import { fetchProfile } from './services/api'
import { firebaseSignOut } from './services/firebaseAuth'
import './index.css'

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hubblers_token'))
  const [role, setRole] = useState<string | null>(() => localStorage.getItem('hubblers_role'))
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('hubblers_theme') as 'light' | 'dark') || 'light')

  useEffect(() => {
    if (token) localStorage.setItem('hubblers_token', token)
    else localStorage.removeItem('hubblers_token')
  }, [token])

  useEffect(() => {
    if (role) localStorage.setItem('hubblers_role', role)
    else localStorage.removeItem('hubblers_role')
  }, [role])

  useEffect(() => {
    localStorage.setItem('hubblers_theme', theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

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

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        <Navbar role={role} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
        <Routes>
          <Route path="/" element={<HomePage isAuthenticated={isAuthenticated} />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/organizer-login" element={<OrganizerLoginPage onLogin={handleLogin} />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/student-signup" element={<StudentSignupPage />} />
          <Route path="/organizer-signup" element={<OrganizerSignupPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/dashboard" element={isAuthenticated ? <DashboardLayout role={role} /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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

import { useEffect, useMemo, useState, lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { fetchMe } from './services/api'
import { getCrmRole, getCrmToken, setCrmRole, setCrmToken } from './services/api'

// Lazy-load CRM subpages
const OverviewPage = lazy(() => import('./pages/OverviewPage').then((m) => ({ default: m.OverviewPage })))
const StudentsPage = lazy(() => import('./pages/StudentsPage').then((m) => ({ default: m.StudentsPage })))
const OrganizersPage = lazy(() => import('./pages/OrganizersPage').then((m) => ({ default: m.OrganizersPage })))
const OrganizerDetailPage = lazy(() => import('./pages/OrganizerDetailPage').then((m) => ({ default: m.OrganizerDetailPage })))
const EventsPage = lazy(() => import('./pages/EventsPage').then((m) => ({ default: m.EventsPage })))
const ActivityPage = lazy(() => import('./pages/ActivityPage').then((m) => ({ default: m.ActivityPage })))
const UserDetailPage = lazy(() => import('./pages/UserDetailPage').then((m) => ({ default: m.UserDetailPage })))
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const RewardsManagementPage = lazy(() => import('./pages/RewardsManagementPage').then((m) => ({ default: m.RewardsManagementPage })))

function CrmLoadingFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-black" />
        <p className="text-xs text-slate-400">Loading…</p>
      </div>
    </div>
  )
}

function App() {
  const [token, setToken] = useState<string | null>(() => getCrmToken())
  const [role, setRole] = useState<string | null>(() => getCrmRole())
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const storedToken = getCrmToken()
    if (!storedToken) {
      setInitializing(false)
      return
    }
    fetchMe()
      .then((me) => {
        if (me.role) setRole(me.role)
        setCrmRole(me.role)
      })
      .catch(() => {
        setToken(null)
        setRole(null)
        setCrmToken(null)
        setCrmRole(null)
      })
      .finally(() => setInitializing(false))
  }, [])

  const isAdmin = useMemo(() => Boolean(token && role === 'ADMIN'), [token, role])

  const handleLogin = (newToken: string, newRole: string) => {
    setToken(newToken)
    setRole(newRole)
    setCrmToken(newToken)
    setCrmRole(newRole)
  }

  const handleLogout = () => {
    setToken(null)
    setRole(null)
    setCrmToken(null)
    setCrmRole(null)
  }

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-black" />
          <p className="text-xs font-semibold text-slate-500">Loading Console…</p>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<CrmLoadingFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route
          path="/"
          element={isAdmin ? <Layout role={role} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        >
          <Route index element={<OverviewPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="colleges" element={<OrganizersPage />} />
          <Route path="colleges/:id" element={<OrganizerDetailPage />} />
          <Route path="organizers" element={<OrganizersPage />} />
          <Route path="organizers/:id" element={<OrganizerDetailPage />} />
          <Route path="users/:id" element={<UserDetailPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="rewards" element={<RewardsManagementPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App

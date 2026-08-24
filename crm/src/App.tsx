import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { OverviewPage } from './pages/OverviewPage'
import { StudentsPage } from './pages/StudentsPage'
import { OrganizersPage } from './pages/OrganizersPage'
import { OrganizerDetailPage } from './pages/OrganizerDetailPage'
import { EventsPage } from './pages/EventsPage'
import { ActivityPage } from './pages/ActivityPage'
import { UserDetailPage } from './pages/UserDetailPage'
import { ReportsPage } from './pages/ReportsPage'
import { RewardsManagementPage } from './pages/RewardsManagementPage'
import { fetchMe } from './services/api'
import { getCrmRole, getCrmToken, setCrmRole, setCrmToken } from './services/api'

function App() {
  const [token, setToken] = useState<string | null>(() => getCrmToken())
  const [role, setRole] = useState<string | null>(() => getCrmRole())
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const storedToken = getCrmToken()
    if (!storedToken) {
      // No stored token: no need to call the API, so resolve the loading state directly.
       
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
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-slate-400">Loading…</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      <Route
        path="/"
        element={isAdmin ? <Layout role={role} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
      >
        <Route index element={<OverviewPage />} />
        <Route path="students" element={<StudentsPage />} />
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
  )
}

export default App

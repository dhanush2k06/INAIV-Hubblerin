import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchUserDetail, approveOrganizer, rejectOrganizer, type CrmUserDetail } from '../services/api'

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = useState<CrmUserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
     
    setLoading(true)
    fetchUserDetail(id)
      .then(setUser)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleApprove = async () => {
    if (!id || !user) return
    setActionLoading(true)
    setMessage('')
    try {
      await approveOrganizer(id)
      setMessage('Account approved successfully.')
      setUser((prev) => (prev ? { ...prev, verificationStatus: 'VERIFIED' } : null))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!id || !user) return
    setActionLoading(true)
    setMessage('')
    try {
      await rejectOrganizer(id)
      setMessage('Account rejected.')
      setUser((prev) => (prev ? { ...prev, verificationStatus: 'REJECTED' } : null))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <p className="text-slate-400">Loading…</p>
  if (error) return <p className="text-rose-400">{error}</p>
  if (!user) return <p className="text-slate-500">User not found.</p>

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/students" className="text-sm text-emerald-400 hover:underline">← Back</Link>
          <h1 className="font-display mt-2 text-3xl font-bold text-white">{user.fullName || 'User'}</h1>
          <p className="mt-1 text-slate-400">{user.email}</p>
        </div>
        {user.role === 'COLLEGE_ADMIN' && (
          <div className="flex gap-2">
            {user.verificationStatus !== 'VERIFIED' && (
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
              >
                {actionLoading ? 'Processing…' : 'Approve Account'}
              </button>
            )}
            {user.verificationStatus !== 'REJECTED' && (
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="rounded-2xl bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/30 disabled:opacity-50"
              >
                Reject Account
              </button>
            )}
          </div>
        )}
      </div>

      {message && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-400">
          {message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500">Role</p>
          <p className="mt-2 text-lg font-semibold text-white">{user.role}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500">XP</p>
          <p className="mt-2 text-lg font-semibold text-white">{user.xp}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500">Credits (Lifetime)</p>
          <p className="mt-2 text-lg font-semibold text-white">{user.lifetimeCredits}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-widest text-slate-500">Verification</p>
          <p className="mt-2 text-lg font-semibold text-white">{user.verificationStatus}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-bold text-white">Profile</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="College" value={user.collegeName} />
            <Row label="Department" value={user.department} />
            <Row label="Roll Number" value={user.rollNumber} />
            <Row label="Degree" value={user.degree} />
            <Row label="Branch" value={user.branch} />
            <Row label="Year" value={user.year} />
            <Row label="Phone" value={user.phone} />
            <Row label="Joined" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : null} />
          </dl>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-bold text-white">Registered Events</h2>
          {user.registeredEvents.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No event registrations.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {user.registeredEvents.map((ev) => (
                <li key={ev.id} className="flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-3">
                  <span className="text-slate-200">{ev.title}</span>
                  <span className="text-xs text-slate-500">{ev.startDate || '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-bold text-white">Activity Timeline</h2>
        {user.activity.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No activity recorded.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {user.activity.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 rounded-2xl bg-slate-950 px-4 py-3">
                <span className="mt-0.5 shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400">
                  {entry.type}
                </span>
                <div>
                  <p className="text-sm text-slate-200">{entry.description}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right text-slate-200">{value || '—'}</dd>
    </div>
  )
}

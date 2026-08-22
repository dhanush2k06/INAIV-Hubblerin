import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchUsers, approveOrganizer, rejectOrganizer, parseApiError, type CrmUser } from '../services/api'

export function OrganizersPage() {
  const [users, setUsers] = useState<CrmUser[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    fetchUsers({ role: 'COLLEGE_ADMIN', search, verificationStatus: status })
      .then((res) => {
        if (active) {
          setUsers(res.users)
          setTotal(res.total)
        }
      })
      .catch((e) => {
        if (active) setError(parseApiError(e))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [search, status])

  const handleApprove = async (id: string, name: string) => {
    setActionLoading(id)
    setMessage('')
    try {
      await approveOrganizer(id)
      setMessage(`Approved organizer "${name}". They can now log in.`)
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, verificationStatus: 'VERIFIED' } : u)),
      )
    } catch (err: unknown) {
      setError(parseApiError(err))
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string, name: string) => {
    setActionLoading(id)
    setMessage('')
    try {
      await rejectOrganizer(id)
      setMessage(`Rejected organizer "${name}".`)
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, verificationStatus: 'REJECTED' } : u)),
      )
    } catch (err: unknown) {
      setError(parseApiError(err))
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Organizers</h1>
        <p className="mt-1 text-slate-400">{total} total organizer/college-admin accounts.</p>
      </div>

      {message && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-400">
          {message}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or institution…"
          className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500"
        >
          <option value="ALL">All statuses</option>
          <option value="VERIFIED">Verified</option>
          <option value="UNVERIFIED">Unverified</option>
          <option value="PENDING">Pending</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {error && <p className="text-rose-400">{error}</p>}
      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : users.length === 0 ? (
        <p className="text-slate-500">No organizers found.</p>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Institution</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950">
              {users.map((u) => (
                <tr key={u.id} className="transition hover:bg-slate-900/50">
                  <td className="px-4 py-3">
                    <Link to={`/organizers/${u.id}`} className="font-semibold text-violet-400 hover:underline">
                      {u.fullName || '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{u.email}</td>
                  <td className="px-4 py-3 text-slate-300">{u.collegeName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        u.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : u.verificationStatus === 'PENDING' || u.verificationStatus === 'UNVERIFIED'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {u.verificationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {u.verificationStatus !== 'VERIFIED' && (
                        <button
                          onClick={() => handleApprove(u.id, u.fullName || u.email)}
                          disabled={actionLoading === u.id}
                          className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                        >
                          {actionLoading === u.id ? 'Processing…' : 'Approve'}
                        </button>
                      )}
                      {u.verificationStatus !== 'REJECTED' && (
                        <button
                          onClick={() => handleReject(u.id, u.fullName || u.email)}
                          disabled={actionLoading === u.id}
                          className="rounded-xl bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/30 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

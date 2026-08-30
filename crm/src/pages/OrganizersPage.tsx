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
        <h1 className="text-2xl font-bold text-black">Colleges / Organizers</h1>
        <p className="mt-1 text-sm text-slate-500">{total} total college and organizer accounts.</p>
      </div>

      {message && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-black">
          ✓ {message}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or institution…"
          className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-black outline-none focus:border-black"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-black outline-none focus:border-black"
        >
          <option value="ALL">All statuses</option>
          <option value="VERIFIED">Verified</option>
          <option value="UNVERIFIED">Unverified</option>
          <option value="PENDING">Pending</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-slate-400">No organizers found.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Institution</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {users.map((u) => (
                <tr key={u.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/organizers/${u.id}`} className="font-semibold text-black hover:underline">
                      {u.fullName || '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600">{u.collegeName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-xs font-bold ${
                        u.verificationStatus === 'VERIFIED'
                          ? 'border-black bg-black text-white'
                          : u.verificationStatus === 'PENDING' || u.verificationStatus === 'UNVERIFIED'
                          ? 'border-slate-300 bg-slate-100 text-slate-700'
                          : 'border-red-200 bg-red-50 text-red-600'
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
                          className="rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                        >
                          {actionLoading === u.id ? 'Processing…' : 'Approve'}
                        </button>
                      )}
                      {u.verificationStatus !== 'REJECTED' && (
                        <button
                          onClick={() => handleReject(u.id, u.fullName || u.email)}
                          disabled={actionLoading === u.id}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-black hover:text-black disabled:opacity-50"
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

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchUsers, type CrmUser } from '../services/api'

export function StudentsPage() {
  const [users, setUsers] = useState<CrmUser[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    fetchUsers({ role: 'STUDENT', search, verificationStatus: status })
      .then((res) => {
        setUsers(res.users)
        setTotal(res.total)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [search, status])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Students</h1>
        <p className="mt-1 text-slate-400">{total} total student accounts.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or college…"
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
        </select>
      </div>

      {error && <p className="text-rose-400">{error}</p>}
      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : users.length === 0 ? (
        <p className="text-slate-500">No students found.</p>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">College</th>
                <th className="px-4 py-3">XP</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950">
              {users.map((u) => (
                <tr key={u.id} className="transition hover:bg-slate-900/50">
                  <td className="px-4 py-3">
                    <Link to={`/users/${u.id}`} className="font-semibold text-emerald-400 hover:underline">
                      {u.fullName || '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{u.email}</td>
                  <td className="px-4 py-3 text-slate-300">{u.collegeName ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-200">{u.xp}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${
                        u.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {u.verificationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

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
        <h1 className="text-2xl font-bold text-black">Students</h1>
        <p className="mt-1 text-sm text-slate-500">{total} total student accounts.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or college…"
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
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-slate-400">No students found.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">College</th>
                <th className="px-4 py-3">XP</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {users.map((u) => (
                <tr key={u.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/users/${u.id}`} className="font-semibold text-black hover:underline">
                      {u.fullName || '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600">{u.collegeName ?? '—'}</td>
                  <td className="px-4 py-3 font-medium text-black">{u.xp}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-xs font-bold ${
                        u.verificationStatus === 'VERIFIED'
                          ? 'border-black bg-black text-white'
                          : 'border-slate-300 bg-slate-100 text-slate-700'
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

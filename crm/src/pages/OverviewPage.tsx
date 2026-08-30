import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts'
import { fetchOverview, fetchAnalytics, fetchUsers, approveOrganizer, rejectOrganizer, type CrmOverview, type CrmAnalytics, type CrmUser } from '../services/api'

const COLORS = ['#000000', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#111827', '#1f2937', '#4b5563', '#374151', '#6b7280']

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-3 text-4xl font-bold text-black">{value}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-base font-bold text-black">{title}</h2>
      <div className="mt-4 h-64">{children}</div>
    </div>
  )
}

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  color: '#111827',
  fontSize: '12px',
}

export function OverviewPage() {
  const [overview, setOverview] = useState<CrmOverview | null>(null)
  const [analytics, setAnalytics] = useState<CrmAnalytics | null>(null)
  const [pendingOrganizers, setPendingOrganizers] = useState<CrmUser[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchOverview()
      .then((data) => {
        if (active) setOverview(data)
      })
      .catch((e) => {
        if (active) setError(e.message)
      })
    fetchAnalytics()
      .then((data) => {
        if (active) setAnalytics(data)
      })
      .catch(() => {})
    fetchUsers({ role: 'COLLEGE_ADMIN', verificationStatus: 'PENDING' })
      .then((res) => {
        if (active) setPendingOrganizers(res.users)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const handleApprove = async (id: string, name: string) => {
    setActionLoading(id)
    setMessage('')
    try {
      await approveOrganizer(id)
      setMessage(`Approved organizer "${name}".`)
      setPendingOrganizers((prev) => prev.filter((u) => u.id !== id))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
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
      setPendingOrganizers((prev) => prev.filter((u) => u.id !== id))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setActionLoading(null)
    }
  }

  if (error) {
    return <p className="text-red-500 text-sm">Failed to load overview: {error}</p>
  }

  const maxCollege = analytics?.topColleges?.[0]?.count ?? 1

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-black">Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Platform-wide activity and performance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={overview?.totalUsers ?? '—'} />
        <StatCard label="Students" value={overview?.totalStudents ?? '—'} />
        <StatCard label="Organizers" value={overview?.totalOrganizers ?? '—'} />
        <StatCard label="Colleges" value={overview?.totalColleges ?? '—'} />
        <StatCard label="Events" value={overview?.totalEvents ?? '—'} />
        <StatCard label="Registrations" value={overview?.totalRegistrations ?? '—'} />
        <StatCard label="Pending Colleges" value={overview?.pendingColleges ?? '—'} />
        <StatCard label="Recent Activity" value={overview?.recentActivityCount ?? '—'} />
      </div>

      {message && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-black">
          ✓ {message}
        </div>
      )}

      {/* Pending Organizer Approvals */}
      {pendingOrganizers.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-black">Pending College Approvals ({pendingOrganizers.length})</h2>
              <p className="mt-1 text-sm text-slate-500">The following colleges are waiting for admin approval.</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {pendingOrganizers.map((org) => (
              <div key={org.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-black">{org.fullName || org.email}</p>
                  <p className="text-xs text-slate-500">{org.email} {org.collegeName ? `· ${org.collegeName}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(org.id, org.fullName || org.email)}
                    disabled={actionLoading === org.id}
                    className="rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    {actionLoading === org.id ? 'Approving…' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(org.id, org.fullName || org.email)}
                    disabled={actionLoading === org.id}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-black hover:text-black disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-day activity trend */}
      <ChartCard title="Activity Trend — Last 7 Days">
        {!analytics || analytics.activityTrend.length === 0 ? (
          <p className="text-slate-400 text-sm">No activity data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.activityTrend}>
              <defs>
                <linearGradient id="trend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#000000" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="count" name="Activities" stroke="#000000" fill="url(#trend)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Role distribution donut */}
        <ChartCard title="User Role Distribution">
          {!analytics || analytics.roleDistribution.length === 0 ? (
            <p className="text-slate-400 text-sm">No user data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.roleDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  label={({ name, value }) => `${name ?? ''}: ${value}`}
                >
                  {analytics.roleDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Verification status bar */}
        <ChartCard title="Verification Status">
          {!analytics || analytics.verificationStatus.length === 0 ? (
            <p className="text-slate-400 text-sm">No user data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.verificationStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" name="Users" radius={[6, 6, 0, 0]}>
                  {analytics.verificationStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity by type */}
        <ChartCard title="Activity by Type">
          {!analytics || analytics.activityByType.length === 0 ? (
            <p className="text-slate-400 text-sm">No activity data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.activityByType} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={110} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" name="Events" radius={[0, 6, 6, 0]}>
                  {analytics.activityByType.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Top colleges by registrations */}
        <ChartCard title="Top Colleges by Registrations">
          {!analytics || analytics.topColleges.length === 0 ? (
            <p className="text-slate-400 text-sm">No registration data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.topColleges} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={110} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" name="Registrations" fill="#000000" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Top Colleges list */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-bold text-black">Top Colleges (List)</h2>
        {!analytics || analytics.topColleges.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No registration data yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {analytics.topColleges.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="w-48 truncate text-sm text-slate-700">{c.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-black"
                    style={{ width: `${Math.max(5, (c.count / maxCollege) * 100)}%` }}
                  />
                </div>
                <span className="w-10 text-right text-sm font-bold text-black">{c.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

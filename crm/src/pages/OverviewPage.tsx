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

const COLORS = ['#10b981', '#22d3ee', '#a78bfa', '#f59e0b', '#f43f5e', '#38bdf8', '#34d399', '#fb7185', '#c084fc', '#fbbf24']

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">{label}</p>
      <p className="mt-3 text-4xl font-semibold text-white">{value}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <div className="mt-4 h-64">{children}</div>
    </div>
  )
}

const tooltipStyle = {
  backgroundColor: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: '12px',
  color: '#e2e8f0',
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
    return <p className="text-rose-400">Failed to load overview: {error}</p>
  }

  const maxCollege = analytics?.topColleges?.[0]?.count ?? 1

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Overview</h1>
        <p className="mt-1 text-slate-400">Platform-wide activity and performance — interactive analytics.</p>
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
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-400">
          {message}
        </div>
      )}

      {/* Pending Organizer Approvals */}
      {pendingOrganizers.length > 0 && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-950/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-amber-400">Pending Organizer Approvals ({pendingOrganizers.length})</h2>
              <p className="mt-1 text-sm text-slate-300">The following organizers registered and are waiting for admin approval to sign in.</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {pendingOrganizers.map((org) => (
              <div key={org.id} className="flex flex-col gap-3 rounded-2xl border border-amber-500/20 bg-slate-900/90 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-white">{org.fullName || org.email}</p>
                  <p className="text-xs text-slate-400">{org.email} {org.collegeName ? `· ${org.collegeName}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(org.id, org.fullName || org.email)}
                    disabled={actionLoading === org.id}
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {actionLoading === org.id ? 'Approving…' : 'Approve Request'}
                  </button>
                  <button
                    onClick={() => handleReject(org.id, org.fullName || org.email)}
                    disabled={actionLoading === org.id}
                    className="rounded-xl bg-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/30 disabled:opacity-50"
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
          <p className="text-slate-500">No activity data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.activityTrend}>
              <defs>
                <linearGradient id="trend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="count" name="Activities" stroke="#10b981" fill="url(#trend)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Role distribution donut */}
        <ChartCard title="User Role Distribution">
          {!analytics || analytics.roleDistribution.length === 0 ? (
            <p className="text-slate-500">No user data yet.</p>
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
            <p className="text-slate-500">No user data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.verificationStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#1e293b' }} />
                <Bar dataKey="value" name="Users" radius={[8, 8, 0, 0]}>
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
            <p className="text-slate-500">No activity data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.activityByType} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={110} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#1e293b' }} />
                <Bar dataKey="value" name="Events" radius={[0, 8, 8, 0]}>
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
            <p className="text-slate-500">No registration data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.topColleges} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={110} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#1e293b' }} />
                <Bar dataKey="count" name="Registrations" fill="#10b981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Legacy horizontal bar list (kept for reference) */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-bold text-white">Top Colleges (List)</h2>
        {!analytics || analytics.topColleges.length === 0 ? (
          <p className="mt-4 text-slate-500">No registration data yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {analytics.topColleges.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="w-48 truncate text-sm text-slate-300">{c.name}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.max(5, (c.count / maxCollege) * 100)}%` }}
                  />
                </div>
                <span className="w-10 text-right text-sm font-semibold text-white">{c.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

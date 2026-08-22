import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts'
import { fetchActivity, fetchAnalytics, type ActivityEntry } from '../services/api'

const CHART_COLORS = ['#10b981', '#22d3ee', '#a78bfa', '#f59e0b', '#f43f5e', '#38bdf8', '#34d399', '#fb7185', '#c084fc', '#fbbf24']

const typeColors: Record<string, string> = {
  LOGIN: 'bg-cyan-500/10 text-cyan-400',
  SIGNUP: 'bg-emerald-500/10 text-emerald-400',
  PROFILE_UPDATE: 'bg-blue-500/10 text-blue-400',
  EVENT_REGISTER: 'bg-violet-500/10 text-violet-400',
  EVENT_UNREGISTER: 'bg-rose-500/10 text-rose-400',
  COLLEGE_SUBMIT: 'bg-amber-500/10 text-amber-400',
  ORGANIZER_SUBMIT: 'bg-amber-500/10 text-amber-400',
  COLLEGE_APPROVE: 'bg-emerald-500/10 text-emerald-400',
  COLLEGE_REJECT: 'bg-rose-500/10 text-rose-400',
}

export function ActivityPage() {
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [byType, setByType] = useState<Array<{ name: string; value: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchActivity({})
      .then((res) => setActivity(res.activity))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
    fetchAnalytics()
      .then((a) => setByType(a.activityByType))
      .catch(() => {})
  }, [])

  const tooltipStyle = {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    color: '#e2e8f0',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Activity Feed</h1>
        <p className="mt-1 text-slate-400">Recent user and admin activity across the platform.</p>
      </div>

      {/* Activity by type summary chart */}
      {byType.length > 0 && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-bold text-white">Activity by Type</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byType} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={130} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#1e293b' }} />
                <Bar dataKey="value" name="Events" radius={[0, 8, 8, 0]}>
                  {byType.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {error && <p className="text-rose-400">{error}</p>}
      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : activity.length === 0 ? (
        <p className="text-slate-500">No activity recorded yet.</p>
      ) : (
        <div className="space-y-3">
          {activity.map((entry) => (
            <div key={entry.id} className="flex items-start gap-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
              <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${typeColors[entry.type] ?? 'bg-slate-700 text-slate-200'}`}>
                {entry.type}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-slate-200">{entry.description}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {entry.role} · {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '—'}
                </p>
              </div>
              <Link
                to={`/users/${entry.userId}`}
                className="ml-auto shrink-0 text-xs font-semibold text-emerald-400 hover:underline"
              >
                View user
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

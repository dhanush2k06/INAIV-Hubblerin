import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts'
import { fetchActivity, fetchAnalytics, type ActivityEntry } from '../services/api'

const CHART_COLORS = ['#000000', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#111827', '#1f2937', '#4b5563']

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
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    color: '#111827',
    fontSize: '12px',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Activity Feed</h1>
        <p className="mt-1 text-sm text-slate-500">Recent user and admin activity across the platform.</p>
      </div>

      {/* Activity by type summary chart */}
      {byType.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-bold text-black">Activity by Type</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byType} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={130} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" name="Events" radius={[0, 6, 6, 0]}>
                  {byType.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : activity.length === 0 ? (
        <p className="text-sm text-slate-400">No activity recorded yet.</p>
      ) : (
        <div className="space-y-3">
          {activity.map((entry) => (
            <div key={entry.id} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="mt-0.5 shrink-0 rounded-md border border-black bg-black px-2.5 py-1 text-xs font-bold text-white">
                {entry.type}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-slate-800">{entry.description}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {entry.role} · {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '—'}
                </p>
              </div>
              <Link
                to={`/users/${entry.userId}`}
                className="ml-auto shrink-0 text-xs font-semibold text-black hover:underline"
              >
                View user →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

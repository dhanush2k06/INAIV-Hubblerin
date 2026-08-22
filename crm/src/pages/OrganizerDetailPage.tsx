import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  fetchOrganizerDetail,
  approveOrganizer,
  rejectOrganizer,
  parseApiError,
  type CrmOrganizerDetail,
} from '../services/api'

/* ── helpers ───────────────────────────────────────────────────── */
function statusColor(s: string) {
  if (s === 'VERIFIED') return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' }
  if (s === 'PENDING' || s === 'UNVERIFIED') return { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' }
  return { bg: 'bg-rose-500/15', text: 'text-rose-400', dot: 'bg-rose-400' }
}

function fmt(date: string | null | undefined) {
  if (!date) return '—'
  try { return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return date }
}

function fmtDateTime(date: string | null | undefined) {
  if (!date) return '—'
  try { return new Date(date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }
  catch { return date }
}

function KpiCard({ icon, label, value, sub, accent }: { icon: string; label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-slate-700`}>
      <div className={`absolute right-4 top-4 text-3xl opacity-20 select-none`}>{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`mt-3 text-4xl font-extrabold ${accent ?? 'text-white'}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-slate-800/60 last:border-0">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <span className="text-sm text-slate-200 text-right">{value ?? '—'}</span>
    </div>
  )
}

/* ── activity type badge colours ───────────────────────────────── */
function activityBadge(type: string) {
  if (type.includes('EVENT')) return 'bg-violet-500/15 text-violet-400'
  if (type.includes('LOGIN')) return 'bg-sky-500/15 text-sky-400'
  if (type.includes('APPROVE') || type.includes('VERIFY')) return 'bg-emerald-500/15 text-emerald-400'
  if (type.includes('REJECT') || type.includes('DELETE')) return 'bg-rose-500/15 text-rose-400'
  return 'bg-slate-700/60 text-slate-400'
}

/* ── main page ─────────────────────────────────────────────────── */
export function OrganizerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [org, setOrg] = useState<CrmOrganizerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [evSearch, setEvSearch] = useState('')

  useEffect(() => {
    if (!id) return
    let active = true
    fetchOrganizerDetail(id)
      .then((data) => {
        if (active) {
          setOrg(data)
          setLoadError('')
        }
      })
      .catch((e) => {
        if (active) setLoadError(parseApiError(e))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  const handleApprove = async () => {
    if (!id || !org) return
    setActionLoading(true)
    setMessage('')
    setActionError('')
    try {
      await approveOrganizer(id)
      setMessage('Organizer account approved successfully.')
      setOrg((prev) => prev ? { ...prev, verificationStatus: 'VERIFIED' } : null)
    } catch (err) {
      setActionError(parseApiError(err))
    } finally { setActionLoading(false) }
  }

  const handleReject = async () => {
    if (!id || !org) return
    setActionLoading(true)
    setMessage('')
    setActionError('')
    try {
      await rejectOrganizer(id)
      setMessage('Organizer account rejected.')
      setOrg((prev) => prev ? { ...prev, verificationStatus: 'REJECTED' } : null)
    } catch (err) {
      setActionError(parseApiError(err))
    } finally { setActionLoading(false) }
  }

  /* ── loading / error states ─────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          <p className="text-slate-400 text-sm">Loading organizer profile…</p>
        </div>
      </div>
    )
  }
  if (loadError) return <p className="text-rose-400 p-6">{loadError}</p>
  if (!org) return <p className="text-slate-500 p-6">Organizer not found.</p>

  const sc = statusColor(org.verificationStatus)
  const filteredEvents = org.events.filter((e) =>
    !evSearch || e.title.toLowerCase().includes(evSearch.toLowerCase()) || e.location.toLowerCase().includes(evSearch.toLowerCase())
  )

  /* ── render ─────────────────────────────────────────────────── */
  return (
    <div className="space-y-8">

      {/* ── page header ──────────────────────────────────────── */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            {org.profileImage
              ? <img src={org.profileImage} alt={org.fullName} className="h-16 w-16 rounded-2xl object-cover ring-2 ring-slate-700" />
              : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-2xl font-bold text-white">
                  {(org.fullName || org.email).charAt(0).toUpperCase()}
                </div>
              )
            }
            <span className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-slate-900 ${sc.dot}`} />
          </div>

          <div>
            <Link to="/organizers" className="text-xs text-violet-400 hover:underline">← All Organizers</Link>
            <h1 className="mt-1 font-display text-2xl font-bold text-white leading-tight">
              {org.fullName || 'Unnamed Organizer'}
            </h1>
            <p className="text-sm text-slate-400">{org.email}</p>
            {org.collegeName && (
              <p className="mt-1 text-xs text-slate-500">🏛 {org.collegeName}</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${sc.bg} ${sc.text}`}>
            <span className={`h-2 w-2 rounded-full ${sc.dot}`} />
            {org.verificationStatus}
          </span>
          {org.verificationStatus !== 'VERIFIED' && (
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {actionLoading ? 'Processing…' : '✓ Approve'}
            </button>
          )}
          {org.verificationStatus !== 'REJECTED' && (
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50"
            >
              ✕ Reject
            </button>
          )}
        </div>
      </div>

      {/* ── feedback banners ──────────────────────────────────── */}
      {message && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-400">
          ✓ {message}
        </div>
      )}
      {actionError && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-3 text-sm text-rose-400">
          {actionError}
        </div>
      )}

      {/* ── KPI row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard icon="🗓" label="Events Created" value={org.totalEvents} accent="text-violet-400" />
        <KpiCard icon="👥" label="Total Registrations" value={org.totalRegistrations} accent="text-sky-400" />
        <KpiCard icon="🚀" label="Upcoming Events" value={org.upcomingEvents} accent="text-emerald-400" />
        <KpiCard icon="⚡" label="XP Earned" value={org.xp} sub={`${org.lifetimeCredits} lifetime credits`} accent="text-amber-400" />
      </div>

      {/* ── profile + events grid ─────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-5">

        {/* Profile column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="mb-1 text-base font-bold text-white">Organizer Profile</h2>
            <p className="mb-4 text-xs text-slate-500">College representative details</p>
            <div className="divide-y divide-slate-800/60">
              <InfoRow label="Full Name" value={org.fullName} />
              <InfoRow label="Email" value={org.email} />
              <InfoRow label="Institution" value={org.collegeName} />
              <InfoRow label="Department" value={org.department} />
              <InfoRow label="Phone" value={org.phone} />
              <InfoRow label="Role" value={org.role} />
              <InfoRow label="Verification" value={org.verificationStatus} />
              <InfoRow label="Joined" value={fmt(org.createdAt)} />
              <InfoRow label="Last Updated" value={fmt(org.updatedAt)} />
            </div>
          </div>

          {/* Activity timeline */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="mb-4 text-base font-bold text-white">Activity Timeline</h2>
            {org.activity.length === 0 ? (
              <p className="text-sm text-slate-500">No activity recorded yet.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scroll">
                {org.activity.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3">
                    <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${activityBadge(entry.type)}`}>
                      {entry.type.replace(/_/g, ' ')}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-300 leading-snug">{entry.description}</p>
                      <p className="mt-0.5 text-[10px] text-slate-600">{fmtDateTime(entry.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Events column */}
        <div className="lg:col-span-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 h-full">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Published Events</h2>
                <p className="text-xs text-slate-500 mt-0.5">{org.totalEvents} event{org.totalEvents !== 1 ? 's' : ''} created by this organizer</p>
              </div>
              <input
                value={evSearch}
                onChange={(e) => setEvSearch(e.target.value)}
                placeholder="Search events…"
                className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 w-full sm:w-48 transition"
              />
            </div>

            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-4xl mb-3">📭</span>
                <p className="text-slate-500 text-sm">
                  {org.totalEvents === 0 ? 'No events created yet.' : 'No events match your search.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 custom-scroll">
                {filteredEvents.map((ev) => {
                  const isPast = ev.startDate && new Date(ev.startDate) < new Date()
                  return (
                    <div
                      key={ev.id}
                      className="group rounded-2xl border border-slate-800 bg-slate-950 p-4 transition hover:border-violet-500/40 hover:bg-slate-900"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-white truncate">{ev.title}</h3>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${isPast ? 'bg-slate-700/60 text-slate-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                              {isPast ? 'Past' : 'Upcoming'}
                            </span>
                          </div>
                          {ev.description && (
                            <p className="mt-1 text-xs text-slate-500 line-clamp-1">{ev.description}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            {ev.location && <span>📍 {ev.location}</span>}
                            {ev.startDate && <span>🗓 {fmt(ev.startDate)}</span>}
                            <span>⚡ {ev.xpReward} XP</span>
                          </div>
                        </div>

                        {/* Registrations badge */}
                        <div className="shrink-0 flex flex-col items-center rounded-2xl bg-violet-500/10 border border-violet-500/20 px-3 py-2 min-w-[56px]">
                          <span className="text-xl font-bold text-violet-400">{ev.registrationCount}</span>
                          <span className="text-[10px] text-slate-500 leading-tight text-center">registrations</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

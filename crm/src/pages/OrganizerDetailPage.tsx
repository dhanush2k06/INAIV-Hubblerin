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

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-extrabold text-black">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 shrink-0">{label}</span>
      <span className="text-sm font-medium text-black text-right">{value ?? '—'}</span>
    </div>
  )
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
        <p className="text-slate-400 text-sm">Loading organizer profile…</p>
      </div>
    )
  }
  if (loadError) return <p className="text-red-500 p-6 text-sm">{loadError}</p>
  if (!org) return <p className="text-slate-400 p-6 text-sm">Organizer not found.</p>

  const filteredEvents = org.events.filter((e) =>
    !evSearch || e.title.toLowerCase().includes(evSearch.toLowerCase()) || e.location.toLowerCase().includes(evSearch.toLowerCase())
  )

  /* ── render ─────────────────────────────────────────────────── */
  return (
    <div className="space-y-8">
      {/* ── page header ──────────────────────────────────────── */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {org.profileImage
              ? <img src={org.profileImage} alt={org.fullName} className="h-14 w-14 rounded-full object-cover border border-slate-200" />
              : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-lg font-bold text-white">
                  {(org.fullName || org.email).charAt(0).toUpperCase()}
                </div>
              )
            }
          </div>

          <div>
            <Link to="/organizers" className="text-xs font-semibold text-slate-500 hover:text-black">← Back to All Organizers</Link>
            <h1 className="mt-1 text-2xl font-bold text-black leading-tight">
              {org.fullName || 'Unnamed Organizer'}
            </h1>
            <p className="text-sm text-slate-500">{org.email}</p>
            {org.collegeName && (
              <p className="mt-0.5 text-xs text-slate-600">🏛 {org.collegeName}</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
          <span className={`rounded-md border px-2.5 py-1 text-xs font-bold ${
            org.verificationStatus === 'VERIFIED'
              ? 'border-black bg-black text-white'
              : 'border-slate-200 bg-slate-100 text-slate-800'
          }`}>
            {org.verificationStatus}
          </span>
          {org.verificationStatus !== 'VERIFIED' && (
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {actionLoading ? 'Processing…' : 'Approve'}
            </button>
          )}
          {org.verificationStatus !== 'REJECTED' && (
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-black hover:text-black disabled:opacity-50"
            >
              Reject
            </button>
          )}
        </div>
      </div>

      {/* ── feedback banners ──────────────────────────────────── */}
      {message && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-black">
          ✓ {message}
        </div>
      )}
      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-600">
          {actionError}
        </div>
      )}

      {/* ── KPI row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Events Created" value={org.totalEvents} />
        <KpiCard label="Total Registrations" value={org.totalRegistrations} />
        <KpiCard label="Upcoming Events" value={org.upcomingEvents} />
        <KpiCard label="XP Earned" value={org.xp} sub={`${org.lifetimeCredits} lifetime credits`} />
      </div>

      {/* ── profile + events grid ─────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Profile column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-base font-bold text-black">Organizer Profile</h2>
            <p className="mb-4 text-xs text-slate-400">College representative details</p>
            <div className="divide-y divide-slate-100">
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
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-black">Activity Timeline</h2>
            {org.activity.length === 0 ? (
              <p className="text-sm text-slate-400">No activity recorded yet.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {org.activity.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 rounded-md border border-black bg-black px-2 py-0.5 text-[10px] font-bold text-white">
                      {entry.type.replace(/_/g, ' ')}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-800 leading-snug">{entry.description}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{fmtDateTime(entry.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Events column */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-full">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-black">Published Events</h2>
                <p className="text-xs text-slate-400 mt-0.5">{org.totalEvents} event{org.totalEvents !== 1 ? 's' : ''} created</p>
              </div>
              <input
                value={evSearch}
                onChange={(e) => setEvSearch(e.target.value)}
                placeholder="Search events…"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-black outline-none focus:border-black w-full sm:w-48 transition"
              />
            </div>

            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-slate-400 text-sm">
                  {org.totalEvents === 0 ? 'No events created yet.' : 'No events match your search.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {filteredEvents.map((ev) => {
                  const isPast = ev.startDate && new Date(ev.startDate) < new Date()
                  return (
                    <div
                      key={ev.id}
                      className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-black hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-black truncate">{ev.title}</h3>
                            <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                              isPast ? 'border-slate-200 bg-slate-100 text-slate-500' : 'border-black bg-black text-white'
                            }`}>
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
                        <div className="shrink-0 flex flex-col items-center rounded-lg bg-white border border-slate-200 px-3 py-2 min-w-[56px]">
                          <span className="text-xl font-black text-black">{ev.registrationCount}</span>
                          <span className="text-[10px] text-slate-400 leading-tight text-center">regs</span>
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

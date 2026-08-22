import { useEffect, useState } from 'react'
import {
  fetchReports,
  parseApiError,
  resolveReport,
  deleteReportedEvent,
  blockReportedOrganizer,
  type CrmReport,
} from '../services/api'

/* ── helpers ───────────────────────────────────────────────────── */
function fmt(date: string) {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return date
  }
}

function statusChip(s: string) {
  if (s === 'PENDING') return 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
  if (s === 'RESOLVED') return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
  if (s === 'DISMISSED') return 'bg-slate-700/60 text-slate-400 border border-slate-600/30'
  return 'bg-slate-800 text-slate-500'
}

function actionTakenChip(action?: string | null) {
  if (!action) return null
  if (action === 'EVENT_DELETED') {
    return (
      <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-bold text-rose-400 border border-rose-500/30 flex items-center gap-1">
        🗑️ Event Removed
      </span>
    )
  }
  if (action === 'ORGANIZER_BLOCKED') {
    return (
      <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-bold text-red-400 border border-red-500/30 flex items-center gap-1">
        🚫 Organizer Blocked
      </span>
    )
  }
  if (action === 'RESOLVED') {
    return (
      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
        ✓ Resolved
      </span>
    )
  }
  if (action === 'DISMISSED') {
    return (
      <span className="rounded-full bg-slate-700/60 px-2.5 py-0.5 text-xs font-bold text-slate-400 border border-slate-600/30">
        ✕ Dismissed
      </span>
    )
  }
  return null
}

function categoryChip(c: string) {
  if (c === 'SCAM' || c === 'FAKE_EVENT') return 'bg-rose-500/15 text-rose-400'
  if (c === 'SPAM') return 'bg-orange-500/15 text-orange-400'
  if (c === 'MISLEADING') return 'bg-amber-500/15 text-amber-400'
  if (c === 'INAPPROPRIATE') return 'bg-violet-500/15 text-violet-400'
  return 'bg-slate-700/60 text-slate-400'
}

type ModalAction = 'DELETE_EVENT' | 'BLOCK_ORGANIZER' | 'RESOLVE' | 'DISMISSED'

interface ActionModalState {
  type: ModalAction
  report: CrmReport
}

/* ── main component ────────────────────────────────────────────── */
export function ReportsPage() {
  const [reports, setReports] = useState<CrmReport[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  // Modal State
  const [activeModal, setActiveModal] = useState<ActionModalState | null>(null)
  const [reasonInput, setReasonInput] = useState('')
  const [notifyReporter, setNotifyReporter] = useState(true)
  const [deleteEvents, setDeleteEvents] = useState(true)

  useEffect(() => {
    let active = true
    fetchReports({ status: statusFilter, category: categoryFilter, search })
      .then((res) => {
        if (active) {
          setReports(res.reports)
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
  }, [statusFilter, categoryFilter, search])

  function openActionModal(report: CrmReport, type: ModalAction) {
    setActiveModal({ report, type })
    setReasonInput('')
    setNotifyReporter(true)
    setDeleteEvents(true)
    setError('')
    setSuccess('')
  }

  function closeModal() {
    setActiveModal(null)
    setReasonInput('')
  }

  async function handleExecuteAction() {
    if (!activeModal) return
    const { type, report } = activeModal
    setActionLoading(report.id)
    setError('')
    setSuccess('')

    try {
      if (type === 'DELETE_EVENT') {
        const res = await deleteReportedEvent(report.id, {
          reason: reasonInput,
          notifyReporter,
        })
        setSuccess(res.message || `Event "${report.eventTitle}" deleted and organizer notified via email.`)
        setReports((prev) =>
          prev.map((r) =>
            r.id === report.id
              ? {
                  ...r,
                  status: 'RESOLVED',
                  actionTaken: 'EVENT_DELETED',
                  resolution: reasonInput || 'Event deleted by admin.',
                }
              : r,
          ),
        )
      } else if (type === 'BLOCK_ORGANIZER') {
        const res = await blockReportedOrganizer(report.id, {
          reason: reasonInput,
          notifyReporter,
          deleteEvents,
        })
        setSuccess(
          res.message ||
            `Organizer account "${report.organizerName}" suspended and student reporter acknowledged via email.`,
        )
        setReports((prev) =>
          prev.map((r) =>
            r.id === report.id
              ? {
                  ...r,
                  status: 'RESOLVED',
                  actionTaken: 'ORGANIZER_BLOCKED',
                  resolution: reasonInput || 'Organizer account blocked due to reported violations.',
                }
              : r,
          ),
        )
      } else if (type === 'RESOLVE' || type === 'DISMISSED') {
        const res = await resolveReport(report.id, {
          status: type === 'RESOLVE' ? 'RESOLVED' : 'DISMISSED',
          resolution: reasonInput,
          notifyReporter,
        })
        setSuccess(res.message || `Report marked as ${type}.`)
        setReports((prev) =>
          prev.map((r) =>
            r.id === report.id
              ? {
                  ...r,
                  status: type === 'RESOLVE' ? 'RESOLVED' : 'DISMISSED',
                  actionTaken: type === 'RESOLVE' ? 'RESOLVED' : 'DISMISSED',
                  resolution: reasonInput,
                }
              : r,
          ),
        )
      }
      closeModal()
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setActionLoading(null)
    }
  }

  /* pending count for badge */
  const pendingCount = reports.filter((r) => r.status === 'PENDING').length

  return (
    <div className="space-y-6">
      {/* ── page header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Event &amp; Account Reports</h1>
          <p className="mt-1 text-slate-400">
            {total} report{total !== 1 ? 's' : ''} total
            {pendingCount > 0 && (
              <span className="ml-2 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30">
                {pendingCount} pending moderation
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── success / error banners ──────────────────────────────── */}
      {success && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm font-semibold text-emerald-400 flex items-center gap-2">
          <span>✓</span>
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-400 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── filters ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search event, organizer, reporter, reason…"
          className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-rose-500 transition"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-rose-500 transition"
        >
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-rose-500 transition"
        >
          <option value="ALL">All categories</option>
          <option value="SPAM">Spam</option>
          <option value="SCAM">Scam / Fraud</option>
          <option value="MISLEADING">Misleading</option>
          <option value="INAPPROPRIATE">Inappropriate</option>
          <option value="FAKE_EVENT">Fake Event</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* ── table / list ─────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/40 py-20">
          <span className="text-5xl">📭</span>
          <p className="mt-4 text-slate-400">No reports found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className={`rounded-3xl border bg-slate-900/60 transition ${
                report.status === 'PENDING'
                  ? 'border-amber-500/30 shadow-lg shadow-amber-500/5'
                  : 'border-slate-800'
              }`}
            >
              {/* ── report summary row ───────────────────────────── */}
              <button
                className="w-full text-left px-5 py-4"
                onClick={() => setExpanded(expanded === report.id ? null : report.id)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${categoryChip(report.category)}`}>
                        {report.category.replace('_', ' ')}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusChip(report.status)}`}>
                        {report.status}
                      </span>
                      {actionTakenChip(report.actionTaken)}
                    </div>
                    <p className="text-base font-semibold text-white truncate">🎪 {report.eventTitle || 'Unknown event'}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Reported by <span className="text-slate-200 font-medium">{report.reporterName || report.reporterEmail}</span>
                      {report.reporterCollege && <> · {report.reporterCollege}</>}
                      {report.organizerName && <> | Organizer: <span className="text-rose-300 font-medium">{report.organizerName}</span></>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-500">{fmt(report.createdAt)}</span>
                    <span className="text-slate-500 text-sm">{expanded === report.id ? '▲' : '▼'}</span>
                  </div>
                </div>
              </button>

              {/* ── expanded detail ──────────────────────────────── */}
              {expanded === report.id && (
                <div className="border-t border-slate-800 px-5 py-5 space-y-5 bg-slate-950/40">
                  {/* reporter & event info */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Reporter Info (Student)</p>
                      <p className="text-sm font-semibold text-slate-200">{report.reporterName || '—'}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <span>✉️</span> {report.reporterEmail}
                      </p>
                      {report.reporterCollege && (
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <span>🏛️</span> {report.reporterCollege}
                        </p>
                      )}
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Reported Organizer &amp; Event</p>
                      <p className="text-sm font-semibold text-slate-200">{report.eventTitle || '—'}</p>
                      {report.organizerName && (
                        <p className="text-xs text-rose-300 font-medium flex items-center gap-1.5">
                          <span>👤</span> Organizer: {report.organizerName}
                        </p>
                      )}
                      {report.collegeName && (
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <span>🏛️</span> {report.collegeName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* reason */}
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-1.5 flex items-center gap-1.5">
                      <span>🚩</span> Reason Reported
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed">{report.reason}</p>
                  </div>

                  {/* resolution if exists */}
                  {report.resolution && (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <span>✓</span> Resolution Note &amp; Actions Taken
                        </p>
                        {report.updatedAt && (
                          <span className="text-xs text-slate-500">{fmt(report.updatedAt)}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">{report.resolution}</p>
                    </div>
                  )}

                  {/* action buttons */}
                  {report.status === 'PENDING' && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Admin Moderation Actions</p>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => openActionModal(report, 'DELETE_EVENT')}
                          disabled={actionLoading === report.id}
                          className="rounded-2xl bg-rose-500/10 border border-rose-500/30 px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 hover:border-rose-500 transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <span>🗑️</span>
                          <span>Delete Event &amp; Acknowledge Organizer</span>
                        </button>

                        <button
                          onClick={() => openActionModal(report, 'BLOCK_ORGANIZER')}
                          disabled={actionLoading === report.id}
                          className="rounded-2xl bg-red-600/10 border border-red-500/40 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-600/25 hover:border-red-500 transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <span>🚫</span>
                          <span>Block Organizer Account &amp; Acknowledge Student</span>
                        </button>

                        <button
                          onClick={() => openActionModal(report, 'RESOLVE')}
                          disabled={actionLoading === report.id}
                          className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <span>✓</span>
                          <span>Resolve with Note</span>
                        </button>

                        <button
                          onClick={() => openActionModal(report, 'DISMISSED')}
                          disabled={actionLoading === report.id}
                          className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-400 hover:border-slate-500 hover:text-white transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <span>✕</span>
                          <span>Dismiss Report</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── MODERATION ACTION MODAL ───────────────────────────────── */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl">
                  {activeModal.type === 'DELETE_EVENT'
                    ? '🗑️'
                    : activeModal.type === 'BLOCK_ORGANIZER'
                    ? '🚫'
                    : activeModal.type === 'RESOLVE'
                    ? '✓'
                    : '✕'}
                </span>
                <button
                  onClick={closeModal}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <h2 className="mt-3 text-xl font-bold text-white">
                {activeModal.type === 'DELETE_EVENT' && 'Delete Event & Notify Organizer via Mail'}
                {activeModal.type === 'BLOCK_ORGANIZER' && 'Block Organizer Account & Acknowledge Student via Mail'}
                {activeModal.type === 'RESOLVE' && 'Mark Report as Resolved'}
                {activeModal.type === 'DISMISSED' && 'Dismiss Report'}
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                {activeModal.type === 'DELETE_EVENT' &&
                  `This will permanently remove "${activeModal.report.eventTitle}" and send an official notice to ${activeModal.report.organizerName || 'the organizer'}.`}
                {activeModal.type === 'BLOCK_ORGANIZER' &&
                  `This will suspend ${activeModal.report.organizerName || "the organizer"}'s account and send an acknowledgment confirmation email to ${activeModal.report.reporterEmail}.`}
                {activeModal.type === 'RESOLVE' &&
                  `This will resolve the report and optionally send an update email to ${activeModal.report.reporterEmail}.`}
                {activeModal.type === 'DISMISSED' &&
                  `This will dismiss the report with an optional resolution explanation.`}
              </p>
            </div>

            {/* Target context */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Reported Event:</span>
                <span className="font-semibold text-slate-200">{activeModal.report.eventTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Organizer:</span>
                <span className="font-semibold text-rose-300">{activeModal.report.organizerName || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reporter Student:</span>
                <span className="font-semibold text-slate-200">
                  {activeModal.report.reporterName} ({activeModal.report.reporterEmail})
                </span>
              </div>
            </div>

            {/* Form inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {activeModal.type === 'DELETE_EVENT'
                    ? 'Notice / Reason for Event Deletion (Included in Organizer Email)'
                    : activeModal.type === 'BLOCK_ORGANIZER'
                    ? 'Reason for Account Suspension (Included in Notification Emails)'
                    : 'Resolution Note / Action Explanation'}
                </label>
                <textarea
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  rows={3}
                  placeholder={
                    activeModal.type === 'DELETE_EVENT'
                      ? 'e.g. This event was removed following community reports regarding inaccurate location and deceptive fees.'
                      : activeModal.type === 'BLOCK_ORGANIZER'
                      ? 'e.g. The organizer account has been suspended for fraudulent activities and non-compliance.'
                      : 'Add any specific notes on how this report was handled…'
                  }
                  className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-rose-500 transition"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-2">
                <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyReporter}
                    onChange={(e) => setNotifyReporter(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-rose-500 focus:ring-rose-500"
                  />
                  <span>
                    Send acknowledgment &amp; update email to student (<strong>{activeModal.report.reporterEmail}</strong>)
                  </span>
                </label>

                {activeModal.type === 'BLOCK_ORGANIZER' && (
                  <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deleteEvents}
                      onChange={(e) => setDeleteEvents(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-rose-500 focus:ring-rose-500"
                    />
                    <span>Also delete all active events published by this organizer</span>
                  </label>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-2xl border border-slate-700 bg-slate-950 py-3 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={actionLoading !== null}
                className={`flex-1 rounded-2xl py-3 text-sm font-bold shadow-lg transition disabled:opacity-50 ${
                  activeModal.type === 'DELETE_EVENT'
                    ? 'bg-rose-500 text-slate-950 hover:bg-rose-400 shadow-rose-500/20'
                    : activeModal.type === 'BLOCK_ORGANIZER'
                    ? 'bg-red-600 text-white hover:bg-red-500 shadow-red-600/20'
                    : activeModal.type === 'RESOLVE'
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                {actionLoading !== null ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Processing &amp; Sending Mail…</span>
                  </span>
                ) : (
                  <span>
                    {activeModal.type === 'DELETE_EVENT' && 'Confirm & Delete Event'}
                    {activeModal.type === 'BLOCK_ORGANIZER' && 'Confirm & Block Organizer'}
                    {activeModal.type === 'RESOLVE' && 'Mark as Resolved'}
                    {activeModal.type === 'DISMISSED' && 'Confirm Dismissal'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

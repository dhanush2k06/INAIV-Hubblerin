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
  if (s === 'PENDING') return 'bg-black text-white border border-black'
  if (s === 'RESOLVED') return 'bg-slate-100 text-slate-800 border border-slate-300'
  if (s === 'DISMISSED') return 'bg-slate-50 text-slate-500 border border-slate-200'
  return 'bg-slate-100 text-slate-600'
}

function actionTakenChip(action?: string | null) {
  if (!action) return null
  if (action === 'EVENT_DELETED') {
    return (
      <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-bold text-black flex items-center gap-1">
        🗑️ Event Removed
      </span>
    )
  }
  if (action === 'ORGANIZER_BLOCKED') {
    return (
      <span className="rounded-md border border-black bg-black px-2 py-0.5 text-xs font-bold text-white flex items-center gap-1">
        🚫 Organizer Blocked
      </span>
    )
  }
  if (action === 'RESOLVED') {
    return (
      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-bold text-black">
        ✓ Resolved
      </span>
    )
  }
  if (action === 'DISMISSED') {
    return (
      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-500">
        ✕ Dismissed
      </span>
    )
  }
  return null
}

function categoryChip(_c: string) {
  return 'rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700'
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
      } else if (type === 'RESOLVE') {
        const res = await resolveReport(report.id, {
          resolution: reasonInput || 'Resolved by admin.',
          status: 'RESOLVED',
          notifyReporter,
        })
        setSuccess(res.message || 'Report marked as resolved.')
        setReports((prev) =>
          prev.map((r) =>
            r.id === report.id
              ? {
                  ...r,
                  status: 'RESOLVED',
                  actionTaken: 'RESOLVED',
                  resolution: reasonInput || 'Resolved by admin.',
                }
              : r,
          ),
        )
      } else if (type === 'DISMISSED') {
        const res = await resolveReport(report.id, {
          resolution: reasonInput || 'Dismissed by admin.',
          status: 'DISMISSED',
          notifyReporter: false,
        })
        setSuccess(res.message || 'Report dismissed.')
        setReports((prev) =>
          prev.map((r) =>
            r.id === report.id
              ? {
                  ...r,
                  status: 'DISMISSED',
                  actionTaken: 'DISMISSED',
                  resolution: reasonInput || 'Dismissed by admin.',
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

  const pendingCount = reports.filter((r) => r.status === 'PENDING').length

  return (
    <div className="space-y-6">
      {/* ── page header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Event &amp; Account Reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            {total} report{total !== 1 ? 's' : ''} total
            {pendingCount > 0 && (
              <span className="ml-2 rounded-md border border-black bg-black px-2 py-0.5 text-xs font-bold text-white">
                {pendingCount} pending moderation
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── success / error banners ──────────────────────────────── */}
      {success && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-black flex items-center gap-2">
          <span>✓</span>
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-600 flex items-center gap-2">
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
          className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-black outline-none focus:border-black transition"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-black outline-none focus:border-black transition"
        >
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-black outline-none focus:border-black transition"
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
          <p className="text-sm text-slate-400">Loading reports…</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
          <p className="text-sm text-slate-400">No reports found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-black"
            >
              {/* ── report summary row ───────────────────────────── */}
              <button
                className="w-full text-left px-5 py-4"
                onClick={() => setExpanded(expanded === report.id ? null : report.id)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={categoryChip(report.category)}>
                        {report.category.replace('_', ' ')}
                      </span>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${statusChip(report.status)}`}>
                        {report.status}
                      </span>
                      {actionTakenChip(report.actionTaken)}
                    </div>
                    <p className="text-sm font-bold text-black truncate">🎪 {report.eventTitle || 'Unknown event'}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Reported by <span className="text-black font-semibold">{report.reporterName || report.reporterEmail}</span>
                      {report.reporterCollege && <> · {report.reporterCollege}</>}
                      {report.organizerName && <> | Organizer: <span className="text-black font-semibold">{report.organizerName}</span></>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-400">{fmt(report.createdAt)}</span>
                    <span className="text-slate-400 text-xs">{expanded === report.id ? '▲' : '▼'}</span>
                  </div>
                </div>
              </button>

              {/* ── expanded detail ──────────────────────────────── */}
              {expanded === report.id && (
                <div className="border-t border-slate-100 px-5 py-5 space-y-5 bg-slate-50 rounded-b-2xl">
                  {/* reporter & event info */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Reporter Info (Student)</p>
                      <p className="text-sm font-bold text-black">{report.reporterName || '—'}</p>
                      <p className="text-xs text-slate-600 flex items-center gap-1.5">
                        <span>✉️</span> {report.reporterEmail}
                      </p>
                      {report.reporterCollege && (
                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                          <span>🏛️</span> {report.reporterCollege}
                        </p>
                      )}
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Reported Organizer &amp; Event</p>
                      <p className="text-sm font-bold text-black">{report.eventTitle || '—'}</p>
                      {report.organizerName && (
                        <p className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                          <span>👤</span> Organizer: {report.organizerName}
                        </p>
                      )}
                      {report.collegeName && (
                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                          <span>🏛️</span> {report.collegeName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* reason */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Reason Reported
                    </p>
                    <p className="text-sm text-slate-800 leading-relaxed">{report.reason}</p>
                  </div>

                  {/* resolution if exists */}
                  {report.resolution && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-black">
                          Resolution Note
                        </p>
                        {report.updatedAt && (
                          <span className="text-xs text-slate-400">{fmt(report.updatedAt)}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-800 leading-relaxed">{report.resolution}</p>
                    </div>
                  )}

                  {/* action buttons */}
                  {report.status === 'PENDING' && (
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Moderation Actions</p>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => openActionModal(report, 'DELETE_EVENT')}
                          disabled={actionLoading === report.id}
                          className="rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50"
                        >
                          Delete Event
                        </button>

                        <button
                          onClick={() => openActionModal(report, 'BLOCK_ORGANIZER')}
                          disabled={actionLoading === report.id}
                          className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                        >
                          Block Organizer
                        </button>

                        <button
                          onClick={() => openActionModal(report, 'RESOLVE')}
                          disabled={actionLoading === report.id}
                          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-black hover:border-black transition disabled:opacity-50"
                        >
                          Resolve
                        </button>

                        <button
                          onClick={() => openActionModal(report, 'DISMISSED')}
                          disabled={actionLoading === report.id}
                          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 hover:text-black transition disabled:opacity-50"
                        >
                          Dismiss
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-black">
                  {activeModal.type === 'DELETE_EVENT' && 'Delete Event'}
                  {activeModal.type === 'BLOCK_ORGANIZER' && 'Block Organizer Account'}
                  {activeModal.type === 'RESOLVE' && 'Mark Report as Resolved'}
                  {activeModal.type === 'DISMISSED' && 'Dismiss Report'}
                </h2>
                <button
                  onClick={closeModal}
                  className="rounded-full p-1.5 text-slate-400 hover:text-black transition"
                >
                  ✕
                </button>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                {activeModal.type === 'DELETE_EVENT' &&
                  `Permanently remove "${activeModal.report.eventTitle}".`}
                {activeModal.type === 'BLOCK_ORGANIZER' &&
                  `Suspend ${activeModal.report.organizerName || "the organizer"}'s account.`}
                {activeModal.type === 'RESOLVE' &&
                  `Resolve the report with an optional note.`}
                {activeModal.type === 'DISMISSED' &&
                  `Dismiss this report.`}
              </p>
            </div>

            {/* Form inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Resolution Note / Reason
                </label>
                <textarea
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  rows={3}
                  placeholder="Add specific notes on this action…"
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-black outline-none focus:border-black transition"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyReporter}
                    onChange={(e) => setNotifyReporter(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span>Send notification email to student</span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:border-black transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={actionLoading !== null}
                className="flex-1 rounded-lg bg-black py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {actionLoading !== null ? 'Processing…' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

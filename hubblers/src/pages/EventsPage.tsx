import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  fetchEvents,
  fetchProfile,
  fetchRegisteredEvents,
  parseApiError,
  registerForEvent,
  unregisterFromEvent,
  reportEvent,
  type Event,
  type Profile,
  type ReportCategory,
} from '../services/api'

// ─── category keyword map ────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'all',          label: 'All Events' },
  { key: 'competitions', label: 'Competitions' },
  { key: 'workshops',    label: 'Workshops' },
  { key: 'college-fests',label: 'College Fests' },
  { key: 'volunteering', label: 'Volunteering' },
] as const
type CategoryKey = typeof CATEGORIES[number]['key']

const CATEGORY_KEYWORDS: Record<CategoryKey, string[]> = {
  'all':           [],
  'competitions':  ['competition', 'contest', 'hackathon', 'quiz', 'olympiad', 'championship'],
  'workshops':     ['workshop', 'training', 'seminar', 'bootcamp', 'webinar', 'session'],
  'college-fests': ['fest', 'festival', 'cultural', 'tech fest', 'symposium', 'expo'],
  'volunteering':  ['volunteer', 'nss', 'social', 'community', 'outreach', 'drive'],
}

function matchesCategory(event: Event, cat: CategoryKey): boolean {
  if (cat === 'all') return true
  const hay = [event.title, event.description, event.longDescription].join(' ').toLowerCase()
  return CATEGORY_KEYWORDS[cat].some((kw) => hay.includes(kw))
}

// ─── Close-icon SVG (reused across modals) ────────────────────────────────────
function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  )
}

export function EventsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // ── data state ──────────────────────────────────────────────────────────────
  const [events,        setEvents]        = useState<Event[]>([])
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set())
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [message,       setMessage]       = useState('')

  // ── modal state ─────────────────────────────────────────────────────────────
  const [viewingEvent,     setViewingEvent]     = useState<Event | null>(null)
  const [registeringEvent, setRegisteringEvent] = useState<Event | null>(null)
  const [reportingEvent,   setReportingEvent]   = useState<Event | null>(null)
  const [reportCategory,   setReportCategory]   = useState<ReportCategory>('OTHER')
  const [reportReason,     setReportReason]     = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [submitting,       setSubmitting]       = useState(false)
  const [regForm,          setRegForm]          = useState({
    name: '', email: '', degree: '', branch: '', year: '', collegeName: '', phone: '',
  })

  // ── filter state ────────────────────────────────────────────────────────────
  const initialCategory = (searchParams.get('category') ?? 'all') as CategoryKey
  const [searchQuery,     setSearchQuery]     = useState('')
  const [activeCategory,  setActiveCategory]  = useState<CategoryKey>(initialCategory)
  const [showRegistered,  setShowRegistered]  = useState(false)
  const [filtersOpen,     setFiltersOpen]     = useState(false) // mobile filter drawer

  // ── auth ────────────────────────────────────────────────────────────────────
  const isAuthenticated = typeof localStorage !== 'undefined' && Boolean(localStorage.getItem('hubblers_token'))
  const userRole = typeof localStorage !== 'undefined' ? (localStorage.getItem('hubblers_role') ?? '') : ''
  const isOrganizer = userRole === 'COLLEGE_ADMIN'

  // ── fetch ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .catch((err) => setError(parseApiError(err)))
      .finally(() => setLoading(false))

    if (isAuthenticated && !isOrganizer) {
      fetchRegisteredEvents()
        .then((rows) => setRegisteredIds(new Set(rows.map((e) => e.id))))
        .catch(() => {})
    }
  }, [isAuthenticated, isOrganizer])

  // ── filtered events ──────────────────────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return events.filter((ev) => {
      if (showRegistered && !registeredIds.has(ev.id)) return false
      if (!matchesCategory(ev, activeCategory)) return false
      if (q) {
        const hay = [ev.title, ev.description, ev.collegeName, ev.organizerName, ev.location]
          .join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [events, searchQuery, activeCategory, showRegistered, registeredIds])

  // ── handlers ──────────────────────────────────────────────────────────────────
  async function openRegisterModal(event: Event) {
    if (!isAuthenticated) {
      setMessage('Please log in as a student to register for events.')
      setTimeout(() => navigate('/login'), 1600)
      return
    }
    setError(''); setMessage('')
    setRegForm({ name: '', email: '', degree: '', branch: '', year: '', collegeName: '', phone: '' })
    try {
      const profile = await fetchProfile() as Profile
      setRegForm({
        name:        profile.fullName      ?? '',
        email:       profile.email         ?? '',
        degree:      profile.degree        ?? '',
        branch:      profile.branch        ?? profile.department ?? '',
        year:        profile.year          ?? '',
        collegeName: profile.collegeName   ?? '',
        phone:       profile.phone         ?? '',
      })
    } catch { /* let user fill manually */ }
    setRegisteringEvent(event)
  }

  async function handleRegister(event: Event) {
    if (!isAuthenticated) {
      setMessage('Please log in as a student to register for events.')
      setTimeout(() => navigate('/login'), 1600)
      return
    }
    setSubmitting(true); setError(''); setMessage('')
    try {
      await registerForEvent(event.id, regForm)
      setRegisteredIds((prev) => new Set(prev).add(event.id))
      setMessage(`Registered for ${event.title}! You earned ${event.xpReward ?? 50} XP. A confirmation email with your QR code has been sent.`)
      setRegisteringEvent(null)
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUnregister(event: Event) {
    setSubmitting(true); setError(''); setMessage('')
    try {
      await unregisterFromEvent(event.id)
      setRegisteredIds((prev) => { const next = new Set(prev); next.delete(event.id); return next })
      setMessage(`Registration cancelled for ${event.title}.`)
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReport(event: Event) {
    if (!reportReason.trim() || reportReason.trim().length < 10) {
      setError('Please describe the issue in at least 10 characters.')
      return
    }
    setReportSubmitting(true); setError(''); setMessage('')
    try {
      const res = await reportEvent(event.id, { reason: reportReason.trim(), category: reportCategory })
      setMessage(res.message || 'Report submitted. Thank you for helping keep HubblerX safe.')
      setReportingEvent(null); setReportReason(''); setReportCategory('OTHER')
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setReportSubmitting(false)
    }
  }

  // ── shared close-button style ─────────────────────────────────────────────────
  const closeBtn = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--hx-green-160)] bg-[var(--hx-surface)] text-[var(--hx-text-muted)] transition hover:border-[var(--hx-green)] hover:text-[var(--hx-green)]'

  // ── shared input style ────────────────────────────────────────────────────────
  const inputCls = 'mt-1.5 block w-full rounded-btn border border-[var(--hx-green-160)] bg-[var(--hx-surface)] px-3 py-2.5 font-[\'DM_Sans\'] text-sm text-[var(--hx-text-primary)] outline-none transition focus:border-[var(--hx-green)] focus:ring-2 focus:ring-[var(--hx-green-90)]'

  return (
    <main className="min-h-[calc(100dvh-88px)] bg-white">
      <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-7 sm:py-12">

        {/* ── Page header ─────────────────────────────────────────────────────── */}
        <header className="mb-6">
          <p className="font-[Manrope] text-xs font-semibold uppercase tracking-widest text-[var(--hx-text-muted)]">
            Campus Activities & Experiences
          </p>
          <h1 className="mt-1.5 font-[Manrope] text-xl font-bold text-[var(--hx-text-primary)] sm:text-2xl">
            Upcoming Activities & Events
          </h1>
          <p className="mt-1 font-['DM_Sans'] text-sm text-[var(--hx-text-muted)] max-w-xl">
            Discover workshops, fests, and activities — register in one click.
          </p>
        </header>

        {/* ── Search + filter bar ──────────────────────────────────────────────── */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search input */}
          <div className="relative flex-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--hx-green-650)]"
              fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, workshops, colleges…"
              className="w-full rounded-btn border border-[var(--hx-green-160)] bg-[var(--hx-surface)] py-2.5 pl-9 pr-4 font-['DM_Sans'] text-sm text-[var(--hx-text-primary)] outline-none transition focus:border-[var(--hx-green)] focus:ring-2 focus:ring-[var(--hx-green-90)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--hx-text-muted)] hover:text-[var(--hx-green)]"
                aria-label="Clear search"
              >
                <CloseIcon />
              </button>
            )}
          </div>

          {/* Mobile: filter toggle */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 rounded-btn border border-[var(--hx-green-160)] bg-[var(--hx-surface)] px-4 py-2.5 font-[Manrope] text-sm font-semibold text-[var(--hx-green)] transition hover:border-[var(--hx-green)] sm:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z" clipRule="evenodd" />
            </svg>
            Filters
            {(activeCategory !== 'all' || showRegistered) && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--hx-green)] text-[0.6rem] font-bold text-white">
                {(activeCategory !== 'all' ? 1 : 0) + (showRegistered ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Desktop: Registered toggle */}
          {isAuthenticated && !isOrganizer && (
            <button
              onClick={() => setShowRegistered(!showRegistered)}
              className={`hidden items-center gap-2 rounded-btn border px-4 py-2.5 font-[Manrope] text-sm font-semibold transition sm:flex ${
                showRegistered
                  ? 'border-blue-300 bg-blue-50 text-blue-600'
                  : 'border-[var(--hx-green-160)] bg-[var(--hx-surface)] text-[var(--hx-text-muted)] hover:border-[var(--hx-green)] hover:text-[var(--hx-green)]'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
              </svg>
              My Registrations
            </button>
          )}
        </div>

        {/* ── Category pills (desktop always visible, mobile in drawer) ────────── */}
        <div className={`mb-6 ${filtersOpen ? 'block' : 'hidden'} sm:block`}>
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => { setActiveCategory(cat.key); setFiltersOpen(false) }}
                className={`rounded-tag px-3.5 py-1.5 font-[Manrope] text-xs font-semibold transition-all duration-150 ${
                  activeCategory === cat.key
                    ? 'bg-[var(--hx-green)] text-white shadow-sm'
                    : 'border border-[var(--hx-green-160)] bg-[var(--hx-surface)] text-[var(--hx-text-muted)] hover:border-[var(--hx-green)] hover:text-[var(--hx-green)]'
                }`}
              >
                {cat.label}
              </button>
            ))}

            {/* Mobile: Registered toggle inside filter drawer */}
            {isAuthenticated && !isOrganizer && (
              <button
                onClick={() => setShowRegistered(!showRegistered)}
                className={`sm:hidden rounded-tag px-3.5 py-1.5 font-[Manrope] text-xs font-semibold transition-all duration-150 ${
                  showRegistered
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'border border-[var(--hx-green-160)] bg-[var(--hx-surface)] text-[var(--hx-text-muted)]'
                }`}
              >
                My Registrations
              </button>
            )}

            {/* Result count */}
            <span className="ml-auto font-['DM_Sans'] text-xs text-[var(--hx-text-muted)]">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
            </span>

            {/* Clear all filters */}
            {(activeCategory !== 'all' || searchQuery || showRegistered) && (
              <button
                onClick={() => { setActiveCategory('all'); setSearchQuery(''); setShowRegistered(false) }}
                className="flex items-center gap-1 rounded-tag border border-red-200 bg-red-50 px-3 py-1.5 font-[Manrope] text-xs font-semibold text-red-500 transition hover:bg-red-100"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* ── Alerts ───────────────────────────────────────────────────────────── */}
        {error && (
          <div className="mb-5 rounded-btn border-l-4 border-red-500 bg-red-50 px-4 py-3 font-['DM_Sans'] text-sm text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-5 rounded-btn border-l-4 border-[var(--hx-green)] bg-[var(--hx-green-40)] px-4 py-3 font-['DM_Sans'] text-sm text-[var(--hx-green)]">
            {message}
          </div>
        )}

        {/* ── Event grid ───────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 font-['DM_Sans'] text-sm text-[var(--hx-text-muted)]">
            <div className="hx-spinner" />
            Loading events…
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-hero border border-[var(--hx-green-160)] bg-[var(--hx-surface)] py-20 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10 text-[var(--hx-green-350)]">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <p className="font-[Manrope] text-base font-semibold text-[var(--hx-text-primary)]">No events found</p>
            <p className="font-['DM_Sans'] text-sm text-[var(--hx-text-muted)]">Try a different search or filter.</p>
            <button
              onClick={() => { setActiveCategory('all'); setSearchQuery(''); setShowRegistered(false) }}
              className="btn-secondary mt-2 text-xs"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => {
              const registered = registeredIds.has(event.id)
              return (
                <div key={event.id} className="hx-card group flex flex-col p-4 sm:p-5">
                  {/* Tags row */}
                  <div className="mb-3 flex flex-wrap items-center gap-1.5">
                    {event.startDate && <span className="hx-tag">{event.startDate}</span>}
                    {(event.collegeName || event.organizerName) && (
                      <span className="rounded-tag border border-[var(--hx-green-160)] bg-[var(--hx-surface)] px-2.5 py-0.5 font-[Manrope] text-[0.68rem] font-medium text-[var(--hx-text-muted)] truncate max-w-[130px]">
                        {event.collegeName || event.organizerName}
                      </span>
                    )}
                    {registered && (
                      <span className="rounded-tag border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-[Manrope] text-[0.68rem] font-semibold text-blue-600">
                        Registered
                      </span>
                    )}
                    {event.xpReward != null && (
                      <span className="ml-auto font-[Manrope] text-xs font-bold text-[var(--hx-green)]">
                        +{event.xpReward} XP
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="font-[Manrope] text-[0.95rem] font-bold leading-snug text-[var(--hx-text-primary)] transition-colors group-hover:text-[var(--hx-green)]">
                    {event.title}
                  </h2>

                  {/* Location */}
                  {event.location && (
                    <p className="mt-1 flex items-center gap-1 font-['DM_Sans'] text-xs text-[var(--hx-text-muted)]">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 shrink-0 text-[var(--hx-green-650)]">
                        <path fillRule="evenodd" d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.588 15.588 0 0 0 2.046-2.082c1.101-1.362 2.291-3.342 2.291-5.597A5 5 0 0 0 3 8c0 2.255 1.19 4.235 2.292 5.597a15.591 15.591 0 0 0 2.046 2.082 8.916 8.916 0 0 0 .189.153l.012.009ZM8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" clipRule="evenodd" />
                      </svg>
                      <span className="truncate">{event.location}</span>
                    </p>
                  )}

                  {/* Description */}
                  {event.description && (
                    <p className="mt-2.5 flex-grow font-['DM_Sans'] text-sm leading-6 text-[var(--hx-text-muted)] line-clamp-3">
                      {event.description}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="mt-4 flex flex-col gap-2 border-t border-[var(--hx-green-160)] pt-4">
                    <button
                      onClick={() => setViewingEvent(event)}
                      className="btn-secondary w-full justify-center py-2 text-xs"
                    >
                      View Details
                    </button>

                    {registered ? (
                      <button
                        onClick={() => handleUnregister(event)}
                        disabled={submitting}
                        className="w-full rounded-btn border border-red-200 bg-red-50 py-2 font-[Manrope] text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                      >
                        Cancel Registration
                      </button>
                    ) : isOrganizer ? (
                      <button
                        disabled
                        className="w-full cursor-not-allowed rounded-btn border border-[var(--hx-green-160)] bg-[var(--hx-surface)] py-2 font-[Manrope] text-xs font-medium text-[var(--hx-text-muted)]"
                      >
                        Organizers cannot register
                      </button>
                    ) : (
                      <button
                        onClick={() => openRegisterModal(event)}
                        className="btn-primary w-full justify-center py-2 text-xs"
                      >
                        Register Now
                      </button>
                    )}

                    {isAuthenticated && !isOrganizer && (
                      <button
                        onClick={() => { setReportingEvent(event); setError(''); setMessage('') }}
                        className="w-full rounded-btn border border-transparent bg-transparent py-1 font-[Manrope] text-[0.68rem] font-medium text-red-400/70 transition hover:border-red-200 hover:text-red-500"
                      >
                        Report event
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* View Details Modal                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {viewingEvent && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
          style={{ background: 'rgba(7,87,63,0.18)', backdropFilter: 'blur(4px)' }}
          onClick={() => setViewingEvent(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92dvh] w-full overflow-y-auto rounded-t-hero border border-[var(--hx-green-160)] bg-white px-5 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-soft sm:max-w-lg sm:rounded-hero sm:p-8"
          >
            {/* drag handle (mobile) */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--hx-green-160)] sm:hidden" />

            <div className="flex items-start justify-between gap-4">
              <h2 className="font-[Manrope] text-lg font-bold text-[var(--hx-text-primary)] sm:text-xl">
                {viewingEvent.title}
              </h2>
              <button onClick={() => setViewingEvent(null)} className={closeBtn} aria-label="Close">
                <CloseIcon />
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {viewingEvent.startDate && <span className="hx-tag">{viewingEvent.startDate}</span>}
              {viewingEvent.location && (
                <span className="font-['DM_Sans'] text-xs text-[var(--hx-text-muted)]">{viewingEvent.location}</span>
              )}
              {(viewingEvent.collegeName || viewingEvent.organizerName) && (
                <span className="rounded-tag border border-[var(--hx-green-160)] bg-[var(--hx-surface)] px-2.5 py-0.5 font-[Manrope] text-[0.68rem] font-medium text-[var(--hx-text-muted)]">
                  Hosted by {viewingEvent.collegeName || viewingEvent.organizerName}
                </span>
              )}
            </div>

            <p className="mt-5 font-['DM_Sans'] text-sm leading-7 text-[var(--hx-text-muted)]">
              {viewingEvent.longDescription || viewingEvent.description || 'No description available.'}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => setViewingEvent(null)} className="btn-secondary flex-1 justify-center py-2.5 text-sm">
                Close
              </button>
              {!isOrganizer && (
                <button
                  onClick={() => { const ev = viewingEvent; setViewingEvent(null); openRegisterModal(ev) }}
                  className="btn-primary flex-1 justify-center py-2.5 text-sm"
                >
                  Register Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Registration Modal                                                       */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {registeringEvent && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
          style={{ background: 'rgba(7,87,63,0.18)', backdropFilter: 'blur(4px)' }}
          onClick={() => setRegisteringEvent(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92dvh] w-full overflow-y-auto rounded-t-hero border border-[var(--hx-green-160)] bg-white px-5 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-soft sm:max-w-xl sm:rounded-hero sm:p-8"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--hx-green-160)] sm:hidden" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-[Manrope] text-lg font-bold text-[var(--hx-text-primary)]">Confirm Registration</h2>
                <p className="mt-0.5 font-['DM_Sans'] text-sm text-[var(--hx-text-muted)]">{registeringEvent.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setRegisteringEvent(null)}
                disabled={submitting}
                className={`${closeBtn} disabled:opacity-60`}
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            {/* XP notice */}
            <div className="mt-4 rounded-btn border border-[var(--hx-green-160)] bg-[var(--hx-green-40)] px-4 py-3">
              <p className="font-['DM_Sans'] text-sm text-[var(--hx-green)]">
                You'll earn <strong>+{registeringEvent.xpReward ?? 50} XP</strong> for registering. A QR code will be emailed to you.
              </p>
            </div>

            {/* Form fields — 2-col on sm+ */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                { label: 'Full Name',    value: regForm.name,        field: 'name',        type: 'text' },
                { label: 'Email',        value: regForm.email,       field: 'email',       type: 'email' },
                { label: 'Degree',       value: regForm.degree,      field: 'degree',      type: 'text', placeholder: 'e.g. B.E / B.Tech' },
                { label: 'Year of Study',value: regForm.year,        field: 'year',        type: 'text', placeholder: 'e.g. 2nd Year' },
                { label: 'College Name', value: regForm.collegeName, field: 'collegeName', type: 'text' },
                { label: 'Phone Number', value: regForm.phone,       field: 'phone',       type: 'tel' },
              ].map((f) => (
                <label key={f.field} className="block">
                  <span className="font-[Manrope] text-xs font-semibold uppercase tracking-wide text-[var(--hx-text-muted)]">
                    {f.label}
                  </span>
                  <input
                    value={f.value}
                    onChange={(e) => setRegForm({ ...regForm, [f.field]: e.target.value })}
                    type={f.type}
                    placeholder={(f as { placeholder?: string }).placeholder}
                    required
                    className={inputCls}
                  />
                </label>
              ))}
              <label className="block sm:col-span-2">
                <span className="font-[Manrope] text-xs font-semibold uppercase tracking-wide text-[var(--hx-text-muted)]">Branch</span>
                <select
                  value={regForm.branch}
                  onChange={(e) => setRegForm({ ...regForm, branch: e.target.value })}
                  required
                  className={inputCls}
                >
                  <option value="" disabled>Select branch</option>
                  <option>Computer Science and Engineering (CSE)</option>
                  <option>Information Technology (IT)</option>
                  <option>Artificial Intelligence and Data Science (AI & DS)</option>
                  <option>Artificial Intelligence and Machine Learning (AI & ML)</option>
                  <option>Electronics and Communication Engineering (ECE)</option>
                  <option>Electrical and Electronics Engineering (EEE)</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setRegisteringEvent(null)}
                disabled={submitting}
                className="btn-secondary flex-1 justify-center py-2.5 text-sm disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRegister(registeringEvent)}
                disabled={submitting}
                className="btn-primary flex-1 justify-center py-2.5 text-sm disabled:opacity-60"
              >
                {submitting ? 'Registering…' : 'Confirm & Register'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Report Modal                                                             */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {reportingEvent && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
          style={{ background: 'rgba(7,87,63,0.18)', backdropFilter: 'blur(4px)' }}
          onClick={() => { setReportingEvent(null); setError(''); setReportReason('') }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92dvh] w-full overflow-y-auto rounded-t-hero border border-[var(--hx-green-160)] bg-white px-5 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-soft sm:max-w-lg sm:rounded-hero sm:p-8"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--hx-green-160)] sm:hidden" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-[Manrope] text-lg font-bold text-[var(--hx-text-primary)]">Report Event</h2>
                <p className="mt-0.5 font-['DM_Sans'] text-sm text-[var(--hx-text-muted)]">Help keep HubblerX safe.</p>
              </div>
              <button
                onClick={() => { setReportingEvent(null); setError(''); setReportReason('') }}
                className={closeBtn}
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="mt-4 rounded-btn border border-red-200 bg-red-50 px-4 py-3">
              <p className="font-[Manrope] text-[0.68rem] font-semibold uppercase tracking-wide text-red-400">Reporting</p>
              <p className="mt-0.5 font-[Manrope] text-sm font-bold text-red-700">{reportingEvent.title}</p>
            </div>

            <label className="mt-5 block">
              <span className="font-[Manrope] text-xs font-semibold uppercase tracking-wide text-[var(--hx-text-muted)]">Issue category</span>
              <select
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value as ReportCategory)}
                className={inputCls}
              >
                <option value="SPAM">Spam</option>
                <option value="SCAM">Scam / Fraud</option>
                <option value="MISLEADING">Misleading information</option>
                <option value="INAPPROPRIATE">Inappropriate content</option>
                <option value="FAKE_EVENT">Fake / Non-existent event</option>
                <option value="OTHER">Other</option>
              </select>
            </label>

            <label className="mt-4 block">
              <span className="font-[Manrope] text-xs font-semibold uppercase tracking-wide text-[var(--hx-text-muted)]">
                Describe the issue <span className="text-red-400">*</span>
              </span>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={4}
                placeholder="Explain why you think this event is suspicious or harmful…"
                className={`${inputCls} resize-none`}
              />
              <span className="mt-1 block text-right font-['DM_Sans'] text-xs text-[var(--hx-text-muted)]">
                {reportReason.length} chars (min 10)
              </span>
            </label>

            {error && <p className="mt-3 font-['DM_Sans'] text-sm text-red-500">{error}</p>}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => { setReportingEvent(null); setError(''); setReportReason('') }}
                disabled={reportSubmitting}
                className="btn-secondary flex-1 justify-center py-2.5 text-sm disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReport(reportingEvent)}
                disabled={reportSubmitting || reportReason.trim().length < 10}
                className="flex-1 rounded-btn bg-red-500 py-2.5 font-[Manrope] text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:opacity-60"
              >
                {reportSubmitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

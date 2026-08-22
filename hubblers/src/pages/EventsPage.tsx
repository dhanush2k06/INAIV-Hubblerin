import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchEvents, fetchProfile, fetchRegisteredEvents, registerForEvent, unregisterFromEvent, type Event, type Profile } from '../services/api'

export function EventsPage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null)
  const [registeringEvent, setRegisteringEvent] = useState<Event | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    degree: '',
    branch: '',
    year: '',
    collegeName: '',
    phone: '',
  })

  const isAuthenticated = typeof localStorage !== 'undefined' && Boolean(localStorage.getItem('hubblers_token'))
  const userRole = typeof localStorage !== 'undefined' ? (localStorage.getItem('hubblers_role') ?? '') : ''
  const isOrganizer = userRole === 'COLLEGE_ADMIN'

  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load events'))
      .finally(() => setLoading(false));

    if (isAuthenticated) {
      fetchRegisteredEvents()
        .then((rows) => setRegisteredIds(new Set(rows.map((e) => e.id))))
        .catch(() => {});
    }
  }, [isAuthenticated])

async function openRegisterModal(event: Event) {
    if (!isAuthenticated) {
      setMessage('Please log in as a student to register for events.')
      setTimeout(() => navigate('/login'), 1600)
      return
    }
    setError('')
    setMessage('')
    setRegForm({
      name: '',
      email: '',
      degree: '',
      branch: '',
      year: '',
      collegeName: '',
      phone: '',
    })
    try {
      const profile = await fetchProfile() as Profile
      setRegForm({
        name: profile.fullName ?? '',
        email: profile.email ?? '',
        degree: profile.degree ?? '',
        branch: profile.branch ?? profile.department ?? '',
        year: profile.year ?? '',
        collegeName: profile.collegeName ?? '',
        phone: profile.phone ?? '',
      })
    } catch {
      // Profile fetch failed — let the user fill the form manually
    }
    setRegisteringEvent(event)
  }

  async function handleRegister(event: Event) {
    if (!isAuthenticated) {
      setMessage('Please log in as a student to register for events.')
      setTimeout(() => navigate('/login'), 1600)
      return
    }
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      await registerForEvent(event.id, regForm)
      setRegisteredIds((prev) => new Set(prev).add(event.id))
      setMessage(`Registered for ${event.title}! You earned ${event.xpReward ?? 50} XP. A confirmation email with your QR code has been sent.`)
      setRegisteringEvent(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUnregister(event: Event) {
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      await unregisterFromEvent(event.id)
      setRegisteredIds((prev) => {
        const next = new Set(prev)
        next.delete(event.id)
        return next
      })
      setMessage(`Registration cancelled for ${event.title}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel registration')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto min-h-[calc(100dvh-88px)] max-w-7xl px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <header className="mb-12 text-center">
<p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Campus Activities & Experiences</p>
        <h1 className="font-display mt-4 text-4xl font-bold text-slate-900 dark:text-white sm:text-5xl">Upcoming Activities & Events</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          Discover workshops, fests, and activities to grow beyond your studies — and register in one click.
        </p>
      </header>

      {error ? (
        <div className="mx-auto mb-8 max-w-2xl rounded-2xl border-l-4 border-rose-600 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900 dark:border-rose-500 dark:bg-slate-900 dark:text-rose-400">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mx-auto mb-8 max-w-2xl rounded-2xl border-l-4 border-emerald-600 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 dark:border-emerald-500 dark:bg-slate-900 dark:text-emerald-400">
          {message}
        </div>
      ) : null}

      {loading ? (
        <p className="text-center text-slate-500 dark:text-slate-400">Loading events…</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const registered = registeredIds.has(event.id)
            return (
              <div key={event.id} className="group relative flex flex-col rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-sm transition-all hover:border-emerald-500/30 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-2xl dark:hover:bg-slate-900/80">
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <span className="inline-flex w-fit rounded-full bg-emerald-500/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-emerald-400 ring-1 ring-emerald-500/20">
                    {event.startDate}
                  </span>
                  {event.collegeName || event.organizerName ? (
                    <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      🏛️ {event.collegeName || event.organizerName}
                    </span>
                  ) : null}
                  {registered ? (
                    <span className="inline-flex w-fit rounded-full bg-blue-500/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-blue-400 ring-1 ring-blue-500/20">
                      Registered
                    </span>
                  ) : null}
                </div>
                <h2 className="font-display text-2xl font-bold text-slate-900 transition-colors group-hover:text-emerald-500 dark:text-white dark:group-hover:text-emerald-400">{event.title}</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{event.location}</p>
                <p className="mt-4 flex-grow text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {event.description}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-500 ring-1 ring-amber-500/20">+{event.xpReward ?? 50} XP</span>
                </div>
                <div className="mt-8 flex flex-col gap-3">
                  <button
                    onClick={() => setViewingEvent(event)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    View Details
                  </button>
                  {registered ? (
                    <button
                      onClick={() => handleUnregister(event)}
                      disabled={submitting}
                      className="w-full rounded-2xl border border-rose-300 bg-rose-50 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/40"
                    >
                      Cancel Registration
                    </button>
                  ) : isOrganizer ? (
                    <button
                      disabled
                      title="Organizers cannot register for events"
                      className="w-full cursor-not-allowed rounded-2xl border border-slate-300 bg-slate-100 py-3 text-sm font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                    >
                      Organizers cannot register
                    </button>
                  ) : (
                    <button
                      onClick={() => openRegisterModal(event)}
                      className="w-full rounded-2xl bg-emerald-500 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] hover:bg-emerald-400 active:scale-95"
                    >
                      Register Now
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}


      {viewingEvent && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 bg-slate-500/50 backdrop-blur-md dark:bg-slate-950/80" onClick={() => setViewingEvent(null)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90dvh] w-full overflow-y-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-slate-200 bg-white px-6 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-900 sm:p-8 sm:pb-8"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">{viewingEvent.title}</h2>
              <button
                onClick={() => setViewingEvent(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="font-semibold text-emerald-500 dark:text-emerald-400">{viewingEvent.startDate} · {viewingEvent.location}</p>
              {viewingEvent.collegeName || viewingEvent.organizerName ? (
                <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  🏛️ Hosted by {viewingEvent.collegeName || viewingEvent.organizerName}
                </span>
              ) : null}
            </div>
            <p className="mt-6 text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">{viewingEvent.longDescription}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setViewingEvent(null)}
                className="flex-1 rounded-2xl bg-slate-100 py-3 font-semibold text-slate-900 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 sm:py-3"
              >
                Close
              </button>
              {!isOrganizer && (
                <button
                  onClick={() => {
                    const ev = viewingEvent
                    setViewingEvent(null)
                    openRegisterModal(ev)
                  }}
                  className="flex-1 rounded-2xl bg-emerald-500 py-3 font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 sm:py-3"
                >
                  Register Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {registeringEvent && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 bg-slate-500/50 backdrop-blur-md dark:bg-slate-950/80" onClick={() => setRegisteringEvent(null)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90dvh] w-full overflow-y-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-slate-200 bg-white px-6 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-900 sm:p-8 sm:pb-8"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Confirm Registration</h2>
              <button
                type="button"
                onClick={() => setRegisteringEvent(null)}
                disabled={submitting}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
<p className="mt-2 text-slate-600 dark:text-slate-400">
              Signing up for: <span className="text-emerald-400 font-medium">{registeringEvent.title}</span>
            </p>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              You will earn <span className="font-semibold text-amber-500">+{registeringEvent.xpReward ?? 50} XP</span> for registering. A QR code will be generated and emailed to you.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Name</span>
                <input
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Email</span>
                <input
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  type="email"
                  required
                  className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Degree</span>
                <input
                  value={regForm.degree}
                  onChange={(e) => setRegForm({ ...regForm, degree: e.target.value })}
                  placeholder="e.g. B.E / B.Tech"
                  required
                  className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Branch</span>
                <select
                  value={regForm.branch}
                  onChange={(e) => setRegForm({ ...regForm, branch: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
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
              <label className="block text-sm">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Year of study</span>
                <input
                  value={regForm.year}
                  onChange={(e) => setRegForm({ ...regForm, year: e.target.value })}
                  placeholder="e.g. 2nd Year"
                  required
                  className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600 dark:text-slate-400 font-medium">College name</span>
                <input
                  value={regForm.collegeName}
                  onChange={(e) => setRegForm({ ...regForm, collegeName: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Phone number</span>
                <input
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  type="tel"
                  required
                  className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                />
              </label>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setRegisteringEvent(null)}
                disabled={submitting}
                className="flex-1 rounded-2xl border border-slate-200 bg-transparent py-4 font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRegister(registeringEvent)}
                disabled={submitting}
                className="flex-1 rounded-2xl bg-emerald-500 py-4 font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:opacity-60"
              >
                {submitting ? 'Registering…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

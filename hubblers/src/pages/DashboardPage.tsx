import { useCallback, useEffect, useState } from 'react'
import type { DashboardData } from '../types'
import {
  fetchDashboard,
  fetchPendingColleges,
  approveCollege,
  rejectCollege,
  unregisterFromEvent,
  fetchMyEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  type PendingCollege,
  type Event,
  type CreateEventPayload,
} from '../services/api'

interface DashboardPageProps {
  role: string | null
}

const emptyEventForm: CreateEventPayload = {
  title: '',
  description: '',
  longDescription: '',
  location: '',
  startDate: '',
  endDate: '',
  xpReward: 50,
}

export function DashboardPage({ role }: DashboardPageProps) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [pending, setPending] = useState<PendingCollege[]>([])
  const [myEvents, setMyEvents] = useState<Event[]>([])
  const [loadingMyEvents, setLoadingMyEvents] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // Event modal states for Organizer
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [eventForm, setEventForm] = useState<CreateEventPayload>(emptyEventForm)
  const [submittingEvent, setSubmittingEvent] = useState(false)
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null)

  const loadDashboardData = useCallback(() => {
    if (!role) return
    fetchDashboard(role)
      .then(setDashboard)
      .catch(() => setDashboard(null))

    if (role === 'SUPPORT') {
      fetchPendingColleges().then(setPending).catch(() => setPending([]))
    }

    if (role === 'COLLEGE_ADMIN') {
      fetchMyEvents()
        .then(setMyEvents)
        .catch(() => setMyEvents([]))
        .finally(() => setLoadingMyEvents(false))
    }
  }, [role])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  async function handleUnregister(eventId: string, eventTitle: string) {
    setCancellingId(eventId)
    setMessage('')
    setErrorMessage('')
    try {
      await unregisterFromEvent(eventId)
      setMessage(`Registration cancelled for "${eventTitle}".`)
      if (role) {
        const updated = await fetchDashboard(role)
        setDashboard(updated)
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to cancel registration')
    } finally {
      setCancellingId(null)
    }
  }

  async function handleApprove(id: string | number) {
    await approveCollege(id)
    setMessage('College approved successfully.')
    setPending((current) => current.filter((item) => item.id !== id))
  }

  async function handleReject(id: string | number) {
    await rejectCollege(id)
    setMessage('College rejected.')
    setPending((current) => current.filter((item) => item.id !== id))
  }

  function openCreateModal() {
    setEditingEvent(null)
    setEventForm(emptyEventForm)
    setErrorMessage('')
    setIsCreateModalOpen(true)
  }

  function openEditModal(event: Event) {
    setEditingEvent(event)
    setEventForm({
      title: event.title,
      description: event.description || '',
      longDescription: event.longDescription || '',
      location: event.location || '',
      startDate: event.startDate || '',
      endDate: event.endDate || '',
      xpReward: event.xpReward ?? 50,
    })
    setErrorMessage('')
    setIsCreateModalOpen(true)
  }

  async function handleSaveEvent(e: React.FormEvent) {
    e.preventDefault()
    setSubmittingEvent(true)
    setErrorMessage('')
    setMessage('')

    try {
      if (editingEvent) {
        const res = await updateEvent(editingEvent.id, eventForm)
        setMessage(`Event "${res.event.title}" updated successfully!`)
      } else {
        const res = await createEvent(eventForm)
        setMessage(`Event "${res.event.title}" published! It is now live for all students.`)
      }

      setIsCreateModalOpen(false)
      setEditingEvent(null)
      setEventForm(emptyEventForm)
      loadDashboardData()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save event')
    } finally {
      setSubmittingEvent(false)
    }
  }

  async function handleDeleteEvent(eventId: string, title: string) {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return
    }

    setDeletingEventId(eventId)
    setErrorMessage('')
    setMessage('')
    try {
      await deleteEvent(eventId)
      setMessage(`Event "${title}" has been deleted.`)
      setMyEvents((prev) => prev.filter((ev) => ev.id !== eventId))
      loadDashboardData()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete event')
    } finally {
      setDeletingEventId(null)
    }
  }

  if (!role) {
    return (
      <div className="mx-auto min-h-[calc(100dvh-88px)] max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="rounded-3xl border border-slate-800 bg-slate-950/95 p-10 text-center text-slate-300">
          Please log in to view your dashboard.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft shadow-slate-900/5 transition-colors dark:border-slate-800 dark:bg-slate-950/95">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-500 dark:text-emerald-400">Dashboard</p>
              <h1 className="font-display mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                {role === 'STUDENT'
                  ? 'Student Dashboard'
                  : role === 'COLLEGE_ADMIN'
                    ? 'Organizer Control Hub'
                    : 'Support Control Panel'}
              </h1>
            </div>
            {dashboard?.welcome ? (
              <p className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {dashboard.welcome}
              </p>
            ) : dashboard?.collegeName ? (
              <p className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                🏛️ {dashboard.collegeName}
              </p>
            ) : null}
          </div>
        </div>

        {/* Feedback alerts */}
        {message ? (
          <div className="rounded-3xl border-l-4 border-emerald-600 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 shadow-sm dark:border-emerald-500 dark:bg-slate-900 dark:text-emerald-400">
            {message}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-3xl border-l-4 border-rose-600 bg-rose-50 p-4 text-sm font-semibold text-rose-900 shadow-sm dark:border-rose-500 dark:bg-slate-900 dark:text-rose-400">
            {errorMessage}
          </div>
        ) : null}

        {/* STUDENT VIEW */}
        {role === 'STUDENT' && dashboard ? (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-200">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">XP</h2>
                <p className="mt-4 text-5xl font-semibold text-emerald-500 dark:text-emerald-400">{dashboard.xp ?? 0}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Earn XP by registering for events.</p>
              </section>
              <section className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-200">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Credits</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-900">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Annual</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{dashboard.credits?.annual ?? 0}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-900">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Lifetime</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{dashboard.credits?.lifetime ?? 0}</p>
                  </div>
                </div>
              </section>
              <section className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-200">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Profile completion</h2>
                <p className="mt-4 text-5xl font-semibold text-slate-900 dark:text-white">{dashboard.profileCompletion ?? 0}%</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Complete your profile to unlock more college events.</p>
              </section>
            </div>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-200">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Activity — Registered Events</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  {dashboard.registeredEvents?.length ?? 0} event(s)
                </span>
              </div>
              {!dashboard.registeredEvents || dashboard.registeredEvents.length === 0 ? (
                <p className="mt-6 text-slate-500 dark:text-slate-400">
                  You haven't registered for any events yet. Head to the Events page to get started.
                </p>
              ) : (
                <div className="mt-6 space-y-4">
                  {dashboard.registeredEvents.map((event) => (
                    <div key={event.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-lg font-semibold text-slate-900 dark:text-white">{event.title}</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {event.startDate} · {event.location}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500 ring-1 ring-amber-500/20">
                            +{event.xpReward ?? 50} XP
                          </span>
                          {event.eventOver ? (
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600">
                              Event Over
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
                                Registered
                              </span>
                              <button
                                onClick={() => handleUnregister(event.id, event.title)}
                                disabled={cancellingId === event.id}
                                className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-500 ring-1 ring-rose-500/30 transition hover:bg-rose-600 hover:text-white disabled:opacity-50"
                              >
                                {cancellingId === event.id ? 'Cancelling…' : 'Cancel Registration'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {event.qrCodeUrl ? (
                        <div className="mt-4 flex flex-col items-start gap-4 rounded-3xl bg-white p-4 dark:bg-slate-950 sm:flex-row sm:items-center">
                          <img
                            src={event.qrCodeUrl}
                            alt={`QR code for ${event.title}`}
                            className="h-32 w-32 rounded-2xl bg-white p-1 shadow-sm"
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Event QR Code Pass</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              Present this QR code at the venue entrance. A copy was also sent via email.
                            </p>
                          </div>
                        </div>
                      ) : event.eventOver ? (
                        <div className="mt-4 rounded-3xl bg-white p-4 dark:bg-slate-950">
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Event has ended</p>
                          <p className="mt-1 text-xs text-slate-500">
                            The QR code is no longer valid and has been removed. This event stays in your history.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}

        {/* ORGANIZER / COLLEGE_ADMIN VIEW */}
        {role === 'COLLEGE_ADMIN' && dashboard ? (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950/95">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400">My Events</p>
                <p className="mt-3 text-4xl font-bold text-slate-900 dark:text-white">{myEvents.length}</p>
                <p className="mt-1 text-xs text-slate-500">Active and past events</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950/95">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400">Total Registrations</p>
                <p className="mt-3 text-4xl font-bold text-slate-900 dark:text-white">{dashboard.registrations ?? 0}</p>
                <p className="mt-1 text-xs text-slate-500">Students registered</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950/95">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400">Estimated Attendance</p>
                <p className="mt-3 text-4xl font-bold text-slate-900 dark:text-white">{dashboard.attendance ?? 0}</p>
                <p className="mt-1 text-xs text-slate-500">Projected attendees</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950/95">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400">Certificates Issued</p>
                <p className="mt-3 text-4xl font-bold text-slate-900 dark:text-white">{dashboard.certificatesIssued ?? 0}</p>
                <p className="mt-1 text-xs text-slate-500">Automated awards</p>
              </div>
            </div>

            {/* Event Management Section */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/95">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Event Management</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Create and publish events. They will instantly appear on the public catalog for all students to register.
                  </p>
                </div>
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] hover:bg-emerald-400 active:scale-95"
                >
                  <span>✨</span>
                  <span>Create New Event</span>
                </button>
              </div>

              {/* Event list */}
              {loadingMyEvents ? (
                <p className="mt-8 text-center text-sm text-slate-500">Loading your events...</p>
              ) : myEvents.length === 0 ? (
                <div className="mt-8 rounded-3xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-800">
                  <div className="text-4xl">🎪</div>
                  <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">No events published yet</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                    Host hackathons, workshops, guest lectures, or fests. Click below to create your very first event!
                  </p>
                  <button
                    onClick={openCreateModal}
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-emerald-400"
                  >
                    + Create Your First Event
                  </button>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {myEvents.map((event) => (
                    <div
                      key={event.id}
                      className="group flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-emerald-500/40 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{event.title}</h3>
                          <span className="rounded-full bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            Live on site
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          📅 {event.startDate} {event.endDate && event.endDate !== event.startDate ? `→ ${event.endDate}` : ''} · 📍 {event.location}
                        </p>
                        <p className="line-clamp-2 max-w-2xl text-xs text-slate-600 dark:text-slate-400">
                          {event.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-2xl bg-white px-3.5 py-2 text-center shadow-xs dark:bg-slate-950">
                          <p className="text-xs text-slate-400">Registered</p>
                          <p className="text-base font-bold text-slate-900 dark:text-white">
                            {event.registrationCount ?? 0}
                          </p>
                        </div>

                        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500">
                          +{event.xpReward ?? 50} XP
                        </span>

                        <button
                          onClick={() => openEditModal(event)}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteEvent(event.id, event.title)}
                          disabled={deletingEventId === event.id}
                          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/50"
                        >
                          {deletingEventId === event.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}

        {/* SUPPORT VIEW */}
        {role === 'SUPPORT' && dashboard ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-200">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-500 dark:text-emerald-400">Total Users</p>
              <p className="mt-4 text-4xl font-semibold text-slate-900 dark:text-white">{dashboard.totalUsers}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-200">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-500 dark:text-emerald-400">Total Colleges</p>
              <p className="mt-4 text-4xl font-semibold text-slate-900 dark:text-white">{dashboard.totalColleges}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-200">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-500 dark:text-emerald-400">Pending Colleges</p>
              <p className="mt-4 text-4xl font-semibold text-slate-900 dark:text-white">{dashboard.pendingColleges}</p>
            </div>
          </div>
        ) : null}

        {role === 'SUPPORT' ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-200">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pending college approvals</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {pending.length} awaiting review
              </span>
            </div>
            {pending.length === 0 ? (
              <p className="mt-6 text-slate-500 dark:text-slate-400">No pending requests at the moment.</p>
            ) : (
              <div className="mt-6 space-y-4">
                {pending.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.college_name}</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{item.admin_name}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(item.id)}
                          className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-rose-400"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                      {item.city} · {item.status}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </div>

      {/* CREATE / EDIT EVENT MODAL */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-md dark:bg-slate-950/80 sm:items-center sm:p-4"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-[2.5rem] border border-slate-200 bg-white px-6 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-900 sm:rounded-[2.5rem] sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                  {editingEvent ? 'Edit Event' : 'Create & Publish Event'}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {editingEvent
                    ? 'Update event details. Changes sync instantly across the site.'
                    : 'Fill in event details to post it publicly for student registrations.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Innovation Summit 2026"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Location / Venue *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Auditorium / Hybrid"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    XP Reward *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    required
                    value={eventForm.xpReward}
                    onChange={(e) => setEventForm({ ...eventForm, xpReward: parseInt(e.target.value, 10) || 0 })}
                    className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Start Date / Time *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. October 15, 2026"
                    value={eventForm.startDate}
                    onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                    className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    End Date / Time (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. October 16, 2026"
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                    className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Short Summary / Highlight *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Brief 1-2 sentence description shown on event cards"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Detailed Description & Agenda (Optional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Full agenda, speaker information, prerequisites, and prizes"
                  value={eventForm.longDescription}
                  onChange={(e) => setEventForm({ ...eventForm, longDescription: e.target.value })}
                  className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={submittingEvent}
                  className="flex-1 rounded-2xl border border-slate-200 bg-transparent py-3.5 font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEvent}
                  className="flex-1 rounded-2xl bg-emerald-500 py-3.5 font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-95 disabled:opacity-60"
                >
                  {submittingEvent
                    ? 'Publishing…'
                    : editingEvent
                      ? 'Save Changes'
                      : 'Publish Event Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


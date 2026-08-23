import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { DashboardData } from '../types'
import {
  fetchDashboard,
  fetchPendingColleges,
  approveCollege,
  rejectCollege,
  unregisterFromEvent,
  fetchMyEvents,
  fetchOrganizerRegistrations,
  updateRegistrationAttendance,
  createEvent,
  updateEvent,
  deleteEvent,
  type PendingCollege,
  type Event,
  type CreateEventPayload,
  type OrganizerRegistration,
} from '../services/api'
import { exportRegistrationsToCsv } from '../utils/excelExport'

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
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'

  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [pending, setPending] = useState<PendingCollege[]>([])
  const [myEvents, setMyEvents] = useState<Event[]>([])
  const [loadingMyEvents, setLoadingMyEvents] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // Organizer Registration Base (CRM) states
  const [registrations, setRegistrations] = useState<OrganizerRegistration[]>([])
  const [loadingRegistrations, setLoadingRegistrations] = useState(false)
  const [regSearch, setRegSearch] = useState('')
  const [selectedEventId, setSelectedEventId] = useState<string>('ALL')
  const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | 'ATTENDED' | 'PENDING'>('ALL')
  const [updatingStudentUid, setUpdatingStudentUid] = useState<string | null>(null)

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
      setLoadingMyEvents(true)
      fetchMyEvents()
        .then(setMyEvents)
        .catch(() => setMyEvents([]))
        .finally(() => setLoadingMyEvents(false))

      setLoadingRegistrations(true)
      fetchOrganizerRegistrations()
        .then((res) => setRegistrations(res.registrations))
        .catch(() => setRegistrations([]))
        .finally(() => setLoadingRegistrations(false))
    }
  }, [role])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboardData()
  }, [loadDashboardData])

  // Filtered registrations for the CRM view & export
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      const matchesSearch =
        !regSearch ||
        r.name?.toLowerCase().includes(regSearch.toLowerCase()) ||
        r.email?.toLowerCase().includes(regSearch.toLowerCase()) ||
        r.phone?.toLowerCase().includes(regSearch.toLowerCase()) ||
        r.collegeName?.toLowerCase().includes(regSearch.toLowerCase()) ||
        r.degree?.toLowerCase().includes(regSearch.toLowerCase()) ||
        r.branch?.toLowerCase().includes(regSearch.toLowerCase()) ||
        r.eventTitle?.toLowerCase().includes(regSearch.toLowerCase())

      const matchesEvent = selectedEventId === 'ALL' || r.eventId === selectedEventId
      const matchesAttendance =
        attendanceFilter === 'ALL' ||
        (attendanceFilter === 'ATTENDED' && r.attended) ||
        (attendanceFilter === 'PENDING' && !r.attended)

      return matchesSearch && matchesEvent && matchesAttendance
    })
  }, [registrations, regSearch, selectedEventId, attendanceFilter])

  // Attendance metrics
  const attendedCount = useMemo(() => registrations.filter((r) => r.attended).length, [registrations])
  const uniqueCollegesCount = useMemo(() => {
    const set = new Set(registrations.map((r) => r.collegeName?.trim()).filter(Boolean))
    return set.size
  }, [registrations])

  async function handleToggleAttendance(studentUid: string, eventId: string, currentStatus: boolean) {
    setUpdatingStudentUid(`${studentUid}_${eventId}`)
    const newStatus = !currentStatus

    // Optimistic UI update
    setRegistrations((prev) =>
      prev.map((r) => (r.studentUid === studentUid && r.eventId === eventId ? { ...r, attended: newStatus } : r)),
    )

    try {
      await updateRegistrationAttendance(studentUid, eventId, newStatus)
      setMessage(`Attendance status updated for student.`)
    } catch (err) {
      // Rollback on error
      setRegistrations((prev) =>
        prev.map((r) => (r.studentUid === studentUid && r.eventId === eventId ? { ...r, attended: currentStatus } : r)),
      )
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update attendance')
    } finally {
      setUpdatingStudentUid(null)
    }
  }

  function handleExportExcel() {
    const activeEvent = myEvents.find((e) => e.id === selectedEventId)
    const eventName = activeEvent ? activeEvent.title : 'All_Events'
    exportRegistrationsToCsv(filteredRegistrations, eventName)
  }

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
    <div className="min-h-screen bg-slate-50 py-10 transition-colors dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-500">
                {role === 'COLLEGE_ADMIN' ? 'Organizer CRM Portal' : 'Portal'}
              </p>
              <h1 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">
                {role === 'COLLEGE_ADMIN'
                  ? 'Organizer Management Center'
                  : role === 'STUDENT'
                  ? 'Student Dashboard'
                  : 'Support Dashboard'}
              </h1>
            </div>
            {role === 'COLLEGE_ADMIN' && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportExcel}
                  disabled={registrations.length === 0}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-95 disabled:opacity-50"
                  title="Download all registrations as an Excel spreadsheet (.csv format compatible with MS Excel)"
                >
                  <span>📥</span>
                  <span>Download Registration Base (Excel)</span>
                </button>
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span>+</span>
                  <span>New Event</span>
                </button>
              </div>
            )}
          </div>

          {/* Organizer Tab Navigation Bar */}
          {role === 'COLLEGE_ADMIN' && (
            <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
              <button
                onClick={() => setSearchParams({ tab: 'overview' })}
                className={`rounded-2xl px-5 py-2.5 text-sm font-bold transition ${
                  activeTab === 'overview'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-transparent text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                }`}
              >
                📊 Overview
              </button>
              <button
                onClick={() => setSearchParams({ tab: 'registrations' })}
                className={`rounded-2xl px-5 py-2.5 text-sm font-bold transition flex items-center gap-2 ${
                  activeTab === 'registrations'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-transparent text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                }`}
              >
                <span>👥 Registration Base (CRM)</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-black ${
                    activeTab === 'registrations' ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {registrations.length}
                </span>
              </button>
              <button
                onClick={() => setSearchParams({ tab: 'events' })}
                className={`rounded-2xl px-5 py-2.5 text-sm font-bold transition flex items-center gap-2 ${
                  activeTab === 'events'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-transparent text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                }`}
              >
                <span>🎪 My Events</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-black ${
                    activeTab === 'events' ? 'bg-slate-950 text-emerald-400' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {myEvents.length}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Feedback Banners */}
        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span>✓ {message}</span>
            <button onClick={() => setMessage('')} className="text-xs text-emerald-500 hover:underline">
              Dismiss
            </button>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-600 dark:text-rose-400 flex items-center justify-between">
            <span>⚠️ {errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="text-xs text-rose-500 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* STUDENT VIEW */}
        {role === 'STUDENT' && dashboard ? (
          <div className="space-y-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950/95">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400">Total XP</p>
                <p className="mt-3 text-4xl font-bold text-slate-900 dark:text-white">{dashboard.xp ?? 0}</p>
                <p className="mt-1 text-xs text-slate-500">Earn XP by attending events</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950/95">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400">Annual Credits</p>
                <p className="mt-3 text-4xl font-bold text-slate-900 dark:text-white">{dashboard.credits?.annual ?? 0}</p>
                <p className="mt-1 text-xs text-slate-500">Credits reset each academic year</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950/95">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400">Lifetime Credits</p>
                <p className="mt-3 text-4xl font-bold text-slate-900 dark:text-white">{dashboard.credits?.lifetime ?? 0}</p>
                <p className="mt-1 text-xs text-slate-500">All-time accumulated credits</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950/95">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400">Events Registered</p>
                <p className="mt-3 text-4xl font-bold text-slate-900 dark:text-white">{dashboard.registeredEvents?.length ?? 0}</p>
                <p className="mt-1 text-xs text-slate-500">Active and past registrations</p>
              </div>
            </div>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/95">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
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
        {role === 'COLLEGE_ADMIN' ? (
          <div className="space-y-8">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* KPI Cards */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950/95">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400">My Events</p>
                    <p className="mt-3 text-4xl font-bold text-slate-900 dark:text-white">{myEvents.length}</p>
                    <p className="mt-1 text-xs text-slate-500">Active and past events hosted</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950/95">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400">Registration Base</p>
                    <p className="mt-3 text-4xl font-bold text-slate-900 dark:text-white">{registrations.length}</p>
                    <p className="mt-1 text-xs text-slate-500">Total student registrations</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950/95">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400">Verified Attendance</p>
                    <p className="mt-3 text-4xl font-bold text-slate-900 dark:text-white">{attendedCount}</p>
                    <p className="mt-1 text-xs text-slate-500">Checked-in attendees</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-950/95">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400">Colleges Represented</p>
                    <p className="mt-3 text-4xl font-bold text-slate-900 dark:text-white">{uniqueCollegesCount}</p>
                    <p className="mt-1 text-xs text-slate-500">Institutions connected</p>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 dark:border-emerald-500/20 dark:bg-emerald-950/10 flex flex-col justify-between">
                    <div>
                      <span className="text-3xl">👥</span>
                      <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">Manage Registration Base</h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        View automatic registration records, search and filter students, mark attendance, and export everything directly to Excel (.xlsx / .csv).
                      </p>
                    </div>
                    <div className="mt-5 flex items-center gap-3">
                      <button
                        onClick={() => setSearchParams({ tab: 'registrations' })}
                        className="rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md transition hover:bg-emerald-400"
                      >
                        Open Registration Base CRM →
                      </button>
                      <button
                        onClick={handleExportExcel}
                        disabled={registrations.length === 0}
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-50"
                      >
                        📥 Export Excel
                      </button>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/95 flex flex-col justify-between">
                    <div>
                      <span className="text-3xl">🎪</span>
                      <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">Host &amp; Publish Events</h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Create hackathons, workshops, conferences, or cultural fests. Published events automatically accept student registrations.
                      </p>
                    </div>
                    <div className="mt-5 flex items-center gap-3">
                      <button
                        onClick={() => setSearchParams({ tab: 'events' })}
                        className="rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
                      >
                        Manage My Events →
                      </button>
                      <button
                        onClick={openCreateModal}
                        className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                      >
                        + Create New Event
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: REGISTRATION BASE (CRM) */}
            {activeTab === 'registrations' && (
              <div className="space-y-6">
                {/* Registration CRM Header with Metrics */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/95">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Registered</p>
                    <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{registrations.length}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Across all your hosted events</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/95">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">Attended / Present</p>
                    <p className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{attendedCount}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {registrations.length > 0 ? Math.round((attendedCount / registrations.length) * 100) : 0}% attendance rate
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/95">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Colleges Represented</p>
                    <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{uniqueCollegesCount}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Diverse student base</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/95">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Filtered Records</p>
                    <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{filteredRegistrations.length}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Matching active filters</p>
                  </div>
                </div>

                {/* Filters & Export Toolbar */}
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/95 space-y-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    {/* Search Input */}
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={regSearch}
                        onChange={(e) => setRegSearch(e.target.value)}
                        placeholder="Search student by name, email, phone, college, branch, or degree…"
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400"
                      />
                      {regSearch && (
                        <button
                          onClick={() => setRegSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Filter Selectors */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Event Selector */}
                      <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="rounded-2xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <option value="ALL">All Events ({myEvents.length})</option>
                        {myEvents.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.title} ({ev.registrationCount ?? 0})
                          </option>
                        ))}
                      </select>

                      {/* Attendance Selector */}
                      <select
                        value={attendanceFilter}
                        onChange={(e) => setAttendanceFilter(e.target.value as 'ALL' | 'ATTENDED' | 'PENDING')}
                        className="rounded-2xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <option value="ALL">All Attendance</option>
                        <option value="ATTENDED">✓ Attended (Present)</option>
                        <option value="PENDING">○ Registered (Pending)</option>
                      </select>

                      {/* Clear Filters Button */}
                      {(regSearch || selectedEventId !== 'ALL' || attendanceFilter !== 'ALL') && (
                        <button
                          onClick={() => {
                            setRegSearch('')
                            setSelectedEventId('ALL')
                            setAttendanceFilter('ALL')
                          }}
                          className="rounded-2xl border border-slate-300 px-3.5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          Clear
                        </button>
                      )}

                      {/* EXPORT TO EXCEL BUTTON */}
                      <button
                        onClick={handleExportExcel}
                        disabled={filteredRegistrations.length === 0}
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-95 disabled:opacity-50"
                      >
                        <span>📥</span>
                        <span>Download Excel (.csv)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Registration Data Table */}
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-950/95">
                  {loadingRegistrations ? (
                    <div className="p-16 text-center text-sm text-slate-500">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                      <p className="mt-3">Loading registration base...</p>
                    </div>
                  ) : filteredRegistrations.length === 0 ? (
                    <div className="p-16 text-center">
                      <span className="text-4xl">📭</span>
                      <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">No registrations found</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {registrations.length === 0
                          ? 'When students register for your published events, their details will automatically appear here in your CRM registration base.'
                          : 'No student registrations match your active search or filters. Try adjusting your search query.'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                          <tr>
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4">College &amp; Academic Info</th>
                            <th className="px-6 py-4">Event Registered</th>
                            <th className="px-6 py-4">Registered At</th>
                            <th className="px-6 py-4 text-center">Attendance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                          {filteredRegistrations.map((reg) => (
                            <tr key={reg.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-900/50">
                              {/* Student Column */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400">
                                    {(reg.name || 'S').slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 dark:text-white truncate">{reg.name || 'Unnamed Student'}</p>
                                    <p className="text-xs text-slate-500 truncate">✉️ {reg.email || '—'}</p>
                                    {reg.phone && <p className="text-xs text-slate-400">📞 {reg.phone}</p>}
                                  </div>
                                </div>
                              </td>

                              {/* College & Academic Column */}
                              <td className="px-6 py-4">
                                <p className="font-semibold text-slate-800 dark:text-slate-200">{reg.collegeName || '—'}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  {reg.degree && (
                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                      {reg.degree}
                                    </span>
                                  )}
                                  {reg.branch && (
                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                      {reg.branch}
                                    </span>
                                  )}
                                  {reg.year && (
                                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                      Year {reg.year}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Event Column */}
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-900 dark:text-white">{reg.eventTitle}</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {reg.eventStartDate} {reg.eventLocation ? `· 📍 ${reg.eventLocation}` : ''}
                                </p>
                              </td>

                              {/* Registration Date Column */}
                              <td className="px-6 py-4 text-xs text-slate-500">
                                {reg.registeredAt
                                  ? new Date(reg.registeredAt).toLocaleString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : '—'}
                              </td>

                              {/* Attendance Toggle Column */}
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => handleToggleAttendance(reg.studentUid, reg.eventId, reg.attended)}
                                  disabled={updatingStudentUid === `${reg.studentUid}_${reg.eventId}`}
                                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition shadow-xs disabled:opacity-50 ${
                                    reg.attended
                                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                  }`}
                                  title="Click to toggle attendance status for this student"
                                >
                                  {updatingStudentUid === `${reg.studentUid}_${reg.eventId}` ? (
                                    <span>Updating…</span>
                                  ) : reg.attended ? (
                                    <>
                                      <span>✓</span>
                                      <span>Present</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>○</span>
                                      <span>Mark Present</span>
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: MY EVENTS */}
            {activeTab === 'events' && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/95">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Event Management</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Create and publish events. They automatically collect registrations for your CRM base.
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
                              Live
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
                          <button
                            onClick={() => {
                              setSelectedEventId(event.id)
                              setSearchParams({ tab: 'registrations' })
                            }}
                            className="rounded-2xl bg-white px-4 py-2 text-center shadow-xs transition hover:bg-emerald-50 hover:border-emerald-500 dark:bg-slate-950 dark:hover:bg-slate-900"
                            title="View all student registrations for this event"
                          >
                            <p className="text-xs text-slate-400">Registered</p>
                            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                              {event.registrationCount ?? 0} Students →
                            </p>
                          </button>

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
            )}
          </div>
        ) : null}

        {/* SUPPORT VIEW */}
        {role === 'SUPPORT' && dashboard ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-200">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-500 dark:text-emerald-400">Total Users</p>
              <p className="mt-4 text-4xl font-semibold text-slate-900 dark:text-white">{dashboard.totalUsers ?? 0}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-200">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-500 dark:text-emerald-400">Total Colleges</p>
              <p className="mt-4 text-4xl font-semibold text-slate-900 dark:text-white">{dashboard.totalColleges ?? 0}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-200">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-500 dark:text-emerald-400">Pending Colleges</p>
              <p className="mt-4 text-4xl font-semibold text-slate-900 dark:text-white">{dashboard.pendingColleges ?? 0}</p>
            </div>
          </div>
        ) : null}

        {/* Pending College Approvals for Support */}
        {role === 'SUPPORT' && (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/95">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pending College Approvals</h2>
            {pending.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No pending requests at the moment.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {pending.map((college) => (
                  <div key={college.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{college.college_name}</p>
                      <p className="text-xs text-slate-500">{college.city} · Admin: {college.admin_name}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(college.id)}
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(college.id)}
                        className="rounded-xl bg-rose-500/10 text-rose-500 px-4 py-2 text-xs font-bold hover:bg-rose-500 hover:text-white transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
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


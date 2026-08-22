import { useEffect, useState } from 'react'
import { fetchCrmEvents, type CrmEvent } from '../services/api'

export function EventsPage() {
  const [events, setEvents] = useState<CrmEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCrmEvents()
      .then(setEvents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Events</h1>
        <p className="mt-1 text-slate-400">All events with registration counts.</p>
      </div>

      {error && <p className="text-rose-400">{error}</p>}
      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : events.length === 0 ? (
        <p className="text-slate-500">No events found.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => (
            <div key={ev.id} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-lg font-bold text-white">{ev.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-400">{ev.description}</p>
              <div className="mt-4 space-y-1 text-sm text-slate-300">
                <p>📍 {ev.location || '—'}</p>
                <p>📅 {ev.startDate || '—'}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                  {ev.registrationCount} registrations
                </span>
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
                  +{ev.xpReward} XP
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

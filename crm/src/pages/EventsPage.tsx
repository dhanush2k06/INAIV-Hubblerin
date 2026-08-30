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
        <h1 className="text-2xl font-bold text-black">Events</h1>
        <p className="mt-1 text-sm text-slate-500">All events with registration counts.</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-slate-400">No events found.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => (
            <div key={ev.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-bold text-black">{ev.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{ev.description}</p>
              <div className="mt-4 space-y-1 text-xs text-slate-600">
                <p>📍 {ev.location || '—'}</p>
                <p>📅 {ev.startDate || '—'}</p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="rounded-md border border-black bg-black px-2.5 py-1 text-xs font-bold text-white">
                  {ev.registrationCount} registrations
                </span>
                <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800">
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

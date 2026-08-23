import { useState } from 'react'
import { submitEventFeedback } from '../../services/rewardsApi'

interface FeedbackModalProps {
  eventId: string
  eventTitle: string
  isOpen: boolean
  onClose: () => void
  onSuccess: (xpEarned: number) => void
}

export function FeedbackModal({
  eventId,
  eventTitle,
  isOpen,
  onClose,
  onSuccess,
}: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(5)
  const [feedbackText, setFeedbackText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!feedbackText.trim() || feedbackText.trim().length < 5) {
      setError('Please provide at least 5 characters of feedback.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await submitEventFeedback({
        eventId,
        rating,
        feedbackText,
      })
      onSuccess(res.xpEarned)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">💬</span>
              <h3 className="text-lg font-bold">Event Feedback</h3>
            </div>
            <p className="mt-0.5 text-xs text-slate-400 truncate max-w-sm">
              "{eventTitle}"
            </p>
          </div>
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-400 border border-emerald-500/30">
            +5 XP Bonus
          </span>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-400">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Star Rating */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Rate your experience (1 - 5 Stars)
            </label>
            <div className="mt-2 flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-2xl transition hover:scale-125 ${
                    star <= rating ? 'text-amber-400' : 'text-slate-600'
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="ml-2 text-xs font-bold text-slate-300">
                {rating === 5
                  ? '🌟 Excellent'
                  : rating === 4
                  ? '👍 Great'
                  : rating === 3
                  ? '👌 Good'
                  : rating === 2
                  ? '😐 Fair'
                  : '👎 Poor'}
              </span>
            </div>
          </div>

          {/* Feedback text */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Your constructive feedback & key takeaways
            </label>
            <textarea
              required
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="What did you learn? How was the organizer, speaker, and pacing? What could be improved?"
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md transition hover:bg-emerald-400 disabled:opacity-50 text-center"
            >
              {submitting ? 'Submitting…' : 'Submit Feedback (+5 XP)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

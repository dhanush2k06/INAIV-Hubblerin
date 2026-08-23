import { useState } from 'react'
import { applyReferralCode } from '../../services/rewardsApi'

interface ReferralModalProps {
  referralCode: string
  referredCount: number
  isOpen: boolean
  onClose: () => void
  onReferralApplied?: () => void
}

export function ReferralModal({
  referralCode,
  referredCount,
  isOpen,
  onClose,
  onReferralApplied,
}: ReferralModalProps) {
  const [copied, setCopied] = useState(false)
  const [friendCode, setFriendCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const referralLink = `${window.location.origin}/student-signup?ref=${referralCode}`

  function handleCopyCode() {
    navigator.clipboard.writeText(referralCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  async function handleApplyCode(e: React.FormEvent) {
    e.preventDefault()
    if (!friendCode.trim()) return

    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      const res = await applyReferralCode(friendCode.trim())
      setMessage(res.message)
      setFriendCode('')
      if (onReferralApplied) onReferralApplied()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply referral code')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎁</span>
            <div>
              <h3 className="text-lg font-bold">Refer Friends & Earn XP</h3>
              <p className="text-xs text-slate-400">Earn +20 XP for every friend who joins HubblerX</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {message && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-400">
            ✓ {message}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-400">
            ⚠️ {error}
          </div>
        )}

        <div className="mt-6 space-y-5">
          {/* Your Code Box */}
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Your Unique Referral Code</p>
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-slate-950 p-3">
              <span className="font-mono text-base sm:text-lg font-black tracking-wider text-cyan-300">{referralCode}</span>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCopyCode}
                  className="flex-1 sm:flex-initial rounded-lg bg-cyan-500/20 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 text-center"
                >
                  {copied ? 'Copied! ✓' : 'Copy Code'}
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex-1 sm:flex-initial rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 text-center"
                >
                  Copy Link
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>Friends Referred: <strong className="text-white">{referredCount}</strong></span>
              <span>Total Earned: <strong className="text-emerald-400">+{referredCount * 20} XP</strong></span>
            </div>
          </div>

          {/* Apply a friend's code */}
          <div className="border-t border-slate-800 pt-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Have a friend's referral code?
            </label>
            <form onSubmit={handleApplyCode} className="mt-2 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Enter referral code (e.g. HUB492A)"
                value={friendCode}
                onChange={(e) => setFriendCode(e.target.value)}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white uppercase placeholder:normal-case placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting || !friendCode.trim()}
                className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-50 text-center"
              >
                {submitting ? 'Applying…' : 'Apply Code'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

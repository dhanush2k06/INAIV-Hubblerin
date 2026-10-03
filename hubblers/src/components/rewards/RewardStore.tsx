import { useState, useMemo } from 'react'
import type { RewardItem, RewardCategory, Redemption } from '../../types'
import { redeemReward } from '../../services/rewardsApi'

interface RewardStoreProps {
  rewards: RewardItem[]
  currentXp: number
  currentLevel: number
  existingRedemptions: Redemption[]
  onRedeemSuccess: (updatedBalance: number) => void
}

type StoreFilter = 'ALL' | RewardCategory

export function RewardStore({
  rewards,
  currentXp,
  currentLevel,
  existingRedemptions,
  onRedeemSuccess,
}: RewardStoreProps) {
  const [filter, setFilter] = useState<StoreFilter>('ALL')
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const redeemedRewardIds = useMemo(() => {
    return new Set(existingRedemptions.map((r) => r.rewardId))
  }, [existingRedemptions])

  const filteredRewards = useMemo(() => {
    return rewards.filter((r) => {
      if (filter === 'ALL') return true
      return r.category === filter
    })
  }, [rewards, filter])

  async function handleConfirmRedeem() {
    if (!selectedReward) return
    setIsRedeeming(true)
    setError('')
    setMessage('')

    try {
      const res = await redeemReward(selectedReward.id)
      setMessage(res.message || `Redeemed ${selectedReward.name}!`)
      onRedeemSuccess(res.balanceAfter)
      setSelectedReward(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redeem reward')
    } finally {
      setIsRedeeming(false)
    }
  }

  return (
    <section className="space-y-6 rounded-card border border-[var(--hx-green-160)] bg-white p-6 shadow-sm">
      {/* Header with XP Balance */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--hx-green-160)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛍️</span>
            <h2 className="font-[Manrope] text-xl font-bold text-[var(--hx-text-primary)]">XP Reward Store</h2>
          </div>
          <p className="mt-1 font-['DM_Sans'] text-xs text-[var(--hx-text-muted)]">
            Redeem your verified activity XP for custom profile themes, frames, prestigious titles, and discount vouchers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-btn border border-[var(--hx-green-160)] bg-[var(--hx-green-40)] px-4 py-2 text-right">
            <p className="font-[Manrope] text-[10px] font-bold uppercase tracking-widest text-[var(--hx-green)]">
              Your Available XP
            </p>
            <p className="font-[Manrope] text-lg font-extrabold text-[var(--hx-text-primary)]">
              {currentXp.toLocaleString()} <span className="text-xs font-bold text-[var(--hx-green)]">XP</span>
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      {message && (
        <div className="rounded-btn border border-[var(--hx-green-160)] bg-[var(--hx-green-40)] p-4 text-xs font-bold text-[var(--hx-green)] flex items-center justify-between shadow-sm">
          <span>✓ {message}</span>
          <button onClick={() => setMessage('')} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}
      {error && (
        <div className="rounded-btn border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center justify-between shadow-sm">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {(
          [
            { key: 'ALL', label: 'All Rewards' },
            { key: 'THEME', label: '🎨 Profile Themes' },
            { key: 'FRAME', label: '🖼️ Profile Frames' },
            { key: 'TITLE', label: '🎖️ Special Titles' },
            { key: 'BADGE', label: '💎 Exclusive Badges' },
            { key: 'DISCOUNT', label: '🏷️ Event Discounts' },
            { key: 'ACCESS', label: '⏱️ Early Access' },
          ] as Array<{ key: StoreFilter; label: string }>
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`shrink-0 whitespace-nowrap rounded-btn px-3.5 py-2 font-[Manrope] text-xs font-semibold transition ${
              filter === t.key
                ? 'bg-[var(--hx-green)] text-white shadow-sm'
                : 'bg-[var(--hx-surface)] text-[var(--hx-text-muted)] hover:bg-[var(--hx-green-90)] hover:text-[var(--hx-green)] border border-[var(--hx-green-160)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Rewards Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredRewards.map((reward) => {
          const isOwned =
            (reward.category === 'THEME' ||
              reward.category === 'FRAME' ||
              reward.category === 'TITLE' ||
              reward.category === 'BADGE') &&
            redeemedRewardIds.has(reward.id)

          const isLevelLocked = currentLevel < reward.minLevel
          const isAffordable = currentXp >= reward.xpCost

          return (
            <div
              key={reward.id}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--hx-green-160)] bg-[var(--hx-surface)] p-4 transition hover:border-[var(--hx-green)] shadow-sm"
            >
              <div>
                {/* Category & Status */}
                <div className="flex items-center justify-between">
                  <span className="hx-tag text-[10px]">
                    {reward.category}
                  </span>

                  {reward.minLevel > 1 && (
                    <span
                      className={`font-['DM_Sans'] text-[10px] font-bold ${
                        isLevelLocked ? 'text-amber-600' : 'text-[var(--hx-text-muted)]'
                      }`}
                    >
                      Requires Lvl {reward.minLevel}
                    </span>
                  )}
                </div>

                {/* Icon & Title */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--hx-green-160)] bg-white text-2xl shadow-sm">
                    {reward.image || '🎁'}
                  </div>
                  <div>
                    <h3 className="font-[Manrope] text-sm font-bold text-[var(--hx-text-primary)] line-clamp-1">
                      {reward.name}
                    </h3>
                    <p className="font-[Manrope] text-xs font-black text-[var(--hx-green)]">
                      {reward.xpCost} XP
                    </p>
                  </div>
                </div>

                <p className="mt-2 font-['DM_Sans'] text-xs text-[var(--hx-text-muted)] line-clamp-2">
                  {reward.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-[var(--hx-green-160)]">
                {isOwned ? (
                  <button
                    disabled
                    className="w-full rounded-btn bg-gray-100 py-2 font-[Manrope] text-xs font-bold text-gray-500 cursor-not-allowed"
                  >
                    ✓ Owned / Unlocked
                  </button>
                ) : isLevelLocked ? (
                  <button
                    disabled
                    className="w-full rounded-btn bg-gray-100 py-2 font-[Manrope] text-xs font-bold text-gray-400 cursor-not-allowed"
                  >
                    🔒 Unlocks at Level {reward.minLevel}
                  </button>
                ) : !isAffordable ? (
                  <button
                    disabled
                    className="w-full rounded-btn bg-gray-100 py-2 font-[Manrope] text-xs font-bold text-gray-400 cursor-not-allowed"
                  >
                    Need {reward.xpCost - currentXp} more XP
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedReward(reward)}
                    className="btn-primary w-full py-2 text-xs shadow-sm"
                  >
                    Redeem ({reward.xpCost} XP)
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredRewards.length === 0 && (
        <div className="py-12 text-center text-[var(--hx-text-muted)] font-['DM_Sans']">
          <p className="text-3xl">🛍️</p>
          <p className="mt-2 text-sm">No items found in this store category.</p>
        </div>
      )}

      {/* Redemption Confirmation Modal */}
      {selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-card border border-[var(--hx-green-160)] bg-white p-6 text-[var(--hx-text-primary)] shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hx-green-40)] border border-[var(--hx-green-160)] text-2xl">
                {selectedReward.image || '🎁'}
              </div>
              <div>
                <p className="font-[Manrope] text-xs font-bold uppercase tracking-wider text-[var(--hx-green)]">Confirm Redemption</p>
                <h3 className="font-[Manrope] text-lg font-bold text-[var(--hx-text-primary)]">{selectedReward.name}</h3>
              </div>
            </div>

            <p className="mt-3 font-['DM_Sans'] text-xs text-[var(--hx-text-muted)] leading-relaxed">
              {selectedReward.description}
            </p>

            {/* XP Balance Preview */}
            <div className="mt-5 space-y-2 rounded-2xl bg-[var(--hx-surface)] border border-[var(--hx-green-160)] p-4 font-['DM_Sans'] text-xs">
              <div className="flex items-center justify-between text-[var(--hx-text-muted)]">
                <span>Current Balance:</span>
                <span className="font-bold text-[var(--hx-text-primary)]">{currentXp} XP</span>
              </div>
              <div className="flex items-center justify-between text-rose-600 font-semibold">
                <span>Reward Cost:</span>
                <span>-{selectedReward.xpCost} XP</span>
              </div>
              <div className="border-t border-[var(--hx-green-160)] pt-2 flex items-center justify-between font-bold text-[var(--hx-green)] font-[Manrope]">
                <span>Balance After:</span>
                <span>{currentXp - selectedReward.xpCost} XP</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedReward(null)}
                disabled={isRedeeming}
                className="btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRedeem}
                disabled={isRedeeming}
                className="btn-primary text-xs py-2 px-4 disabled:opacity-50"
              >
                {isRedeeming ? 'Redeeming…' : 'Confirm & Deduct XP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

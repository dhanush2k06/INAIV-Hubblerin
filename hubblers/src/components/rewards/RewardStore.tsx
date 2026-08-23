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
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/95">
      {/* Header with XP Balance */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛍️</span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">XP Reward Store</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Redeem your verified activity XP for custom profile themes, frames, prestigious titles, and discount vouchers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Your Available XP
            </p>
            <p className="text-lg font-black text-slate-900 dark:text-white">
              {currentXp.toLocaleString()} <span className="text-xs font-bold text-emerald-500">XP</span>
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      {message && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
          <span>✓ {message}</span>
          <button onClick={() => setMessage('')} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center justify-between">
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
            className={`shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              filter === t.key
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
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
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700"
            >
              <div>
                {/* Category & Status */}
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {reward.category}
                  </span>

                  {reward.minLevel > 1 && (
                    <span
                      className={`text-[10px] font-bold ${
                        isLevelLocked ? 'text-amber-500' : 'text-slate-400'
                      }`}
                    >
                      Requires Lvl {reward.minLevel}
                    </span>
                  )}
                </div>

                {/* Icon & Title */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-2xl shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    {reward.image || '🎁'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {reward.name}
                    </h3>
                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {reward.xpCost} XP
                    </p>
                  </div>
                </div>

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {reward.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
                {isOwned ? (
                  <button
                    disabled
                    className="w-full rounded-xl bg-slate-200 py-2 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  >
                    ✓ Owned / Unlocked
                  </button>
                ) : isLevelLocked ? (
                  <button
                    disabled
                    className="w-full rounded-xl bg-slate-200/70 py-2 text-xs font-bold text-slate-500 dark:bg-slate-800/60 dark:text-slate-500"
                  >
                    🔒 Unlocks at Level {reward.minLevel}
                  </button>
                ) : !isAffordable ? (
                  <button
                    disabled
                    className="w-full rounded-xl bg-slate-200/70 py-2 text-xs font-bold text-slate-500 dark:bg-slate-800/60 dark:text-slate-500"
                  >
                    Need {reward.xpCost - currentXp} more XP
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedReward(reward)}
                    className="w-full rounded-xl bg-emerald-500 py-2 text-xs font-bold text-slate-950 shadow-sm transition hover:bg-emerald-400 active:scale-95"
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
        <div className="py-12 text-center text-slate-400">
          <p className="text-3xl">🛍️</p>
          <p className="mt-2 text-sm">No items found in this store category.</p>
        </div>
      )}

      {/* Redemption Confirmation Modal */}
      {selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-2xl">
                {selectedReward.image || '🎁'}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Confirm Redemption</p>
                <h3 className="text-lg font-bold">{selectedReward.name}</h3>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-300 leading-relaxed">
              {selectedReward.description}
            </p>

            {/* XP Balance Preview */}
            <div className="mt-5 space-y-2 rounded-2xl bg-slate-950 p-4 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Current Balance:</span>
                <span className="font-bold text-white">{currentXp} XP</span>
              </div>
              <div className="flex items-center justify-between text-rose-400">
                <span>Reward Cost:</span>
                <span className="font-bold">-{selectedReward.xpCost} XP</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex items-center justify-between font-bold text-emerald-400">
                <span>Balance After:</span>
                <span>{currentXp - selectedReward.xpCost} XP</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedReward(null)}
                disabled={isRedeeming}
                className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRedeem}
                disabled={isRedeeming}
                className="rounded-2xl bg-emerald-500 px-5 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
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

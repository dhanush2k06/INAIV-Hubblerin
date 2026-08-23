import { useMemo, useState } from 'react'
import type { BadgeDefinition, UserBadge } from '../../types'

interface BadgeGalleryProps {
  unlockedBadges: UserBadge[]
  allBadges: BadgeDefinition[]
}

type FilterCategory = 'ALL' | 'UNLOCKED' | 'LOCKED' | 'ACHIEVEMENT' | 'MONTHLY' | 'RANKING' | 'EXCLUSIVE'

export function BadgeGallery({ unlockedBadges, allBadges }: BadgeGalleryProps) {
  const [filter, setFilter] = useState<FilterCategory>('ALL')

  const unlockedMap = useMemo(() => {
    const map = new Map<string, UserBadge>()
    for (const b of unlockedBadges) {
      map.set(b.badgeId, b)
    }
    return map
  }, [unlockedBadges])

  const filteredBadges = useMemo(() => {
    return allBadges.filter((badge) => {
      const isUnlocked = unlockedMap.has(badge.id)
      if (filter === 'ALL') return true
      if (filter === 'UNLOCKED') return isUnlocked
      if (filter === 'LOCKED') return !isUnlocked
      return badge.category === filter
    })
  }, [allBadges, unlockedMap, filter])

  const unlockedCount = unlockedBadges.length
  const totalCount = allBadges.length

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/95">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Badge Gallery</h2>
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {unlockedCount} / {totalCount} Unlocked
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Earn badges by participating in events, winning competitions, submitting feedback, and referring friends.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          {(
            [
              { key: 'ALL', label: 'All' },
              { key: 'UNLOCKED', label: `Unlocked (${unlockedCount})` },
              { key: 'LOCKED', label: 'Locked' },
              { key: 'ACHIEVEMENT', label: 'Milestones' },
              { key: 'MONTHLY', label: 'Monthly' },
              { key: 'RANKING', label: 'Podium' },
              { key: 'EXCLUSIVE', label: 'Store' },
            ] as Array<{ key: FilterCategory; label: string }>
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                filter === t.key
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Badges Grid */}
      <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredBadges.map((badge) => {
          const unlocked = unlockedMap.get(badge.id)
          const isUnlocked = Boolean(unlocked)

          return (
            <div
              key={badge.id}
              className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
                isUnlocked
                  ? 'border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 to-slate-900/40 shadow-md shadow-emerald-500/10 hover:border-emerald-400 dark:border-emerald-500/30'
                  : 'border-slate-200 bg-slate-50/70 opacity-75 hover:opacity-100 dark:border-slate-800 dark:bg-slate-900/40'
              }`}
            >
              {/* Category Indicator Pill */}
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                    badge.category === 'RANKING'
                      ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30'
                      : badge.category === 'MONTHLY'
                      ? 'bg-cyan-500/20 text-cyan-500 dark:text-cyan-400 border border-cyan-500/30'
                      : badge.category === 'EXCLUSIVE'
                      ? 'bg-fuchsia-500/20 text-fuchsia-500 dark:text-fuchsia-400 border border-fuchsia-500/30'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {badge.category}
                </span>

                {isUnlocked ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 dark:text-emerald-400">
                    <span>✓</span>
                    <span>Unlocked</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                    <span>🔒</span>
                    <span>Locked</span>
                  </span>
                )}
              </div>

              {/* Badge Icon & Name */}
              <div className="mt-4 flex items-center gap-3">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-inner ${
                    isUnlocked
                      ? 'border border-emerald-400/40 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 shadow-emerald-500/20 scale-105'
                      : 'border border-slate-300 bg-slate-200 text-slate-400 grayscale dark:border-slate-800 dark:bg-slate-800'
                  }`}
                >
                  {badge.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{badge.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {badge.description}
                  </p>
                </div>
              </div>

              {/* Unlock criteria or Awarded date */}
              <div className="mt-4 rounded-xl bg-slate-100/80 p-2.5 text-xs text-slate-600 dark:bg-slate-950/70 dark:text-slate-400">
                {isUnlocked ? (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Earned on:</span>
                    <span className="font-semibold text-slate-200">
                      {unlocked?.awardedAt ? new Date(unlocked.awardedAt).toLocaleDateString() : 'Active'}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">How to unlock:</span>
                    <p className="mt-0.5 font-medium text-slate-700 dark:text-slate-300">{badge.criteria}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredBadges.length === 0 && (
        <div className="py-12 text-center text-slate-400">
          <p className="text-3xl">🎖️</p>
          <p className="mt-2 text-sm">No badges found matching this filter.</p>
        </div>
      )}
    </section>
  )
}

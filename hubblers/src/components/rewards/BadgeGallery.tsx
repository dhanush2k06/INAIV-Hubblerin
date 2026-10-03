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
    <section className="rounded-card border border-[var(--hx-green-160)] bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--hx-green-160)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-[Manrope] text-xl font-bold text-[var(--hx-text-primary)]">Badge Gallery</h2>
            <span className="hx-tag">
              {unlockedCount} / {totalCount} Unlocked
            </span>
          </div>
          <p className="mt-1 font-['DM_Sans'] text-xs text-[var(--hx-text-muted)]">
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
              className={`shrink-0 whitespace-nowrap rounded-btn px-3 py-1.5 font-[Manrope] text-xs font-semibold transition ${
                filter === t.key
                  ? 'bg-[var(--hx-green)] text-white shadow-sm'
                  : 'bg-[var(--hx-surface)] text-[var(--hx-text-muted)] hover:bg-[var(--hx-green-90)] hover:text-[var(--hx-green)] border border-[var(--hx-green-160)]'
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
                  ? 'border-[var(--hx-green-350)] bg-[var(--hx-surface)] shadow-sm hover:border-[var(--hx-green)]'
                  : 'border-[var(--hx-green-160)] bg-white opacity-70 hover:opacity-100'
              }`}
            >
              {/* Category Indicator Pill */}
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-tag px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider font-[Manrope] ${
                    badge.category === 'RANKING'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : badge.category === 'MONTHLY'
                      ? 'bg-teal-50 text-teal-800 border border-teal-200'
                      : badge.category === 'EXCLUSIVE'
                      ? 'bg-purple-50 text-purple-800 border border-purple-200'
                      : 'bg-[var(--hx-green-40)] text-[var(--hx-green)] border border-[var(--hx-green-160)]'
                  }`}
                >
                  {badge.category}
                </span>

                {isUnlocked ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--hx-green)] font-[Manrope]">
                    <span>✓</span>
                    <span>Unlocked</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--hx-text-muted)] font-[Manrope]">
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
                      ? 'border border-[var(--hx-green-350)] bg-[var(--hx-green-40)] text-[var(--hx-green)] scale-105'
                      : 'border border-gray-200 bg-gray-100 text-gray-400 grayscale'
                  }`}
                >
                  {badge.icon}
                </div>
                <div>
                  <h3 className="font-[Manrope] text-sm font-bold text-[var(--hx-text-primary)]">{badge.name}</h3>
                  <p className="mt-0.5 font-['DM_Sans'] text-xs text-[var(--hx-text-muted)] line-clamp-2">
                    {badge.description}
                  </p>
                </div>
              </div>

              {/* Unlock criteria or Awarded date */}
              <div className="mt-4 rounded-xl bg-white border border-[var(--hx-green-160)] p-2.5 text-xs text-[var(--hx-text-muted)]">
                {isUnlocked ? (
                  <div className="flex items-center justify-between text-[11px] font-['DM_Sans']">
                    <span className="text-[var(--hx-text-muted)]">Earned on:</span>
                    <span className="font-semibold text-[var(--hx-text-primary)]">
                      {unlocked?.awardedAt ? new Date(unlocked.awardedAt).toLocaleDateString() : 'Active'}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="font-[Manrope] text-[10px] font-bold uppercase tracking-wider text-[var(--hx-text-muted)]">How to unlock:</span>
                    <p className="mt-0.5 font-['DM_Sans'] font-medium text-[var(--hx-text-primary)]">{badge.criteria}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredBadges.length === 0 && (
        <div className="py-12 text-center text-[var(--hx-text-muted)] font-['DM_Sans']">
          <p className="text-3xl">🎖️</p>
          <p className="mt-2 text-sm">No badges found matching this filter.</p>
        </div>
      )}
    </section>
  )
}

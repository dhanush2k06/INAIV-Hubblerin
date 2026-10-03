import type { LevelInfo } from '../../types'

interface XPLevelCardProps {
  totalXp: number
  monthlyXp: number
  monthlyRank: number
  level: LevelInfo
  onOpenReferral?: () => void
}

export function XPLevelCard({
  totalXp,
  monthlyXp,
  monthlyRank,
  level,
  onOpenReferral,
}: XPLevelCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--hx-green-160)] bg-gradient-to-br from-[#043324] via-[#07573F] to-[#022016] p-6 text-white shadow-xl shadow-[rgba(7,87,63,0.25)]">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-teal-300/15 blur-3xl" />

      <div className="relative z-10">
        {/* Top bar: Level badge & Rank */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-3xl shadow-inner backdrop-blur-sm">
              {level.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-[Manrope] text-xs font-black uppercase tracking-wider text-emerald-200 border border-white/20">
                  Level {level.level}
                </span>
                <span className="font-['DM_Sans'] text-xs text-white/80 font-medium">{level.title}</span>
              </div>
              <h2 className="mt-0.5 font-[Manrope] text-2xl font-black tracking-tight text-white sm:text-3xl">
                {totalXp.toLocaleString()}{' '}
                <span className="text-base font-bold text-emerald-300">Total XP</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-2xl border border-white/15 bg-black/25 px-4 py-2 text-right backdrop-blur-sm">
              <p className="font-[Manrope] text-[10px] font-bold uppercase tracking-widest text-white/70">Monthly Rank</p>
              <p className="font-[Manrope] text-lg font-black text-amber-300">
                #{monthlyRank > 0 ? monthlyRank : '—'}{' '}
                <span className="font-['DM_Sans'] text-xs font-semibold text-white/70">({monthlyXp} XP)</span>
              </p>
            </div>

            {onOpenReferral && (
              <button
                onClick={onOpenReferral}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-btn border border-white/25 bg-white/15 px-4 py-2.5 font-[Manrope] text-xs font-bold text-white transition hover:bg-white/25 active:scale-95"
              >
                <span>🎁</span>
                <span>Refer (+20 XP)</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="font-['DM_Sans'] text-white/90">
              Level {level.level} Progress
            </span>
            <span className="font-[Manrope] text-emerald-200 font-bold">
              {level.nextLevelMinXp !== null
                ? `${level.xpInLevel} / ${level.nextLevelMinXp - level.currentLevelMinXp} XP (${level.progressPercent}%)`
                : 'Max Prestige Level reached!'}
            </span>
          </div>

          {/* Progress Bar Track */}
          <div className="mt-2 h-3.5 w-full overflow-hidden rounded-full bg-black/35 p-0.5 ring-1 ring-white/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 transition-all duration-700 ease-out shadow-sm shadow-emerald-400/50"
              style={{ width: `${Math.max(4, level.progressPercent)}%` }}
            />
          </div>

          {/* Next Level Perks Preview */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-['DM_Sans'] text-xs text-white/80">
            {level.nextLevelMinXp !== null ? (
              <>
                <span>
                  🚀 <strong className="text-white font-[Manrope]">{level.xpNeededForNext} XP</strong> needed for Level {level.level + 1}
                </span>
                <span className="italic text-white/70">
                  Perks: <strong className="text-emerald-200 not-italic font-[Manrope]">{level.perks}</strong>
                </span>
              </>
            ) : (
              <span className="text-amber-300 font-bold font-[Manrope]">👑 Hall of Fame Immortal Achiever</span>
            )}
          </div>
        </div>

        {/* Activity Quick XP Reference Chips */}
        <div className="mt-6 border-t border-white/15 pt-4">
          <p className="font-[Manrope] text-[11px] font-bold uppercase tracking-widest text-white/70">
            Verified XP Rewards
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 font-['DM_Sans'] text-xs">
            <span className="rounded-tag bg-black/25 px-2.5 py-1 text-white ring-1 ring-white/15">
              Registration <strong className="text-emerald-300 font-[Manrope]">+5 XP</strong>
            </span>
            <span className="rounded-tag bg-black/25 px-2.5 py-1 text-white ring-1 ring-white/15">
              Attendance <strong className="text-emerald-300 font-[Manrope]">+20 XP</strong>
            </span>
            <span className="rounded-tag bg-black/25 px-2.5 py-1 text-white ring-1 ring-white/15">
              Workshop <strong className="text-teal-300 font-[Manrope]">+25 XP</strong>
            </span>
            <span className="rounded-tag bg-black/25 px-2.5 py-1 text-white ring-1 ring-white/15">
              Competition <strong className="text-amber-300 font-[Manrope]">+30 XP</strong>
            </span>
            <span className="rounded-tag bg-black/25 px-2.5 py-1 text-white ring-1 ring-white/15">
              Volunteering <strong className="text-emerald-200 font-[Manrope]">+40 XP</strong>
            </span>
            <span className="rounded-tag bg-black/25 px-2.5 py-1 text-white ring-1 ring-white/15">
              Feedback <strong className="text-emerald-300 font-[Manrope]">+5 XP</strong>
            </span>
            <span className="rounded-tag bg-black/25 px-2.5 py-1 text-white ring-1 ring-white/15">
              Certificate <strong className="text-teal-300 font-[Manrope]">+25 XP</strong>
            </span>
            <span className="rounded-tag bg-black/25 px-2.5 py-1 text-white ring-1 ring-white/15">
              Referral <strong className="text-amber-300 font-[Manrope]">+20 XP</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

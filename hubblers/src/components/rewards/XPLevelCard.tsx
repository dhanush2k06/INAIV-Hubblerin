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
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 text-white shadow-xl shadow-slate-950/20 dark:border-slate-800">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />

      <div className="relative z-10">
        {/* Top bar: Level badge & Rank */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-400/20 to-cyan-500/20 text-3xl shadow-inner shadow-emerald-500/30">
              {level.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                  Level {level.level}
                </span>
                <span className="text-xs text-slate-400 font-medium">{level.title}</span>
              </div>
              <h2 className="mt-0.5 text-2xl font-black tracking-tight text-white sm:text-3xl">
                {totalXp.toLocaleString()}{' '}
                <span className="text-base font-bold text-emerald-400">Total XP</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-right backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Monthly Rank</p>
              <p className="text-lg font-black text-amber-400">
                #{monthlyRank > 0 ? monthlyRank : '—'}{' '}
                <span className="text-xs font-semibold text-slate-400">({monthlyXp} XP)</span>
              </p>
            </div>

            {onOpenReferral && (
              <button
                onClick={onOpenReferral}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20 hover:text-white"
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
            <span className="text-slate-300">
              Level {level.level} Progress
            </span>
            <span className="text-emerald-400 font-bold">
              {level.nextLevelMinXp !== null
                ? `${level.xpInLevel} / ${level.nextLevelMinXp - level.currentLevelMinXp} XP (${level.progressPercent}%)`
                : 'Max Prestige Level reached!'}
            </span>
          </div>

          {/* Progress Bar Track */}
          <div className="mt-2 h-3.5 w-full overflow-hidden rounded-full bg-slate-800/80 p-0.5 ring-1 ring-slate-700/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-700 ease-out shadow-sm shadow-emerald-500/50"
              style={{ width: `${Math.max(4, level.progressPercent)}%` }}
            />
          </div>

          {/* Next Level Perks Preview */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            {level.nextLevelMinXp !== null ? (
              <>
                <span>
                  🚀 <strong className="text-slate-200">{level.xpNeededForNext} XP</strong> needed for Level {level.level + 1}
                </span>
                <span className="italic text-slate-400">
                  Perks: <strong className="text-emerald-300 not-italic">{level.perks}</strong>
                </span>
              </>
            ) : (
              <span className="text-amber-400 font-bold">👑 Hall of Fame Immortal Achiever</span>
            )}
          </div>
        </div>

        {/* Activity Quick XP Reference Chips */}
        <div className="mt-6 border-t border-slate-800/80 pt-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Verified XP Rewards
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="rounded-full bg-slate-800/90 px-2.5 py-1 text-slate-200 ring-1 ring-slate-700/50">
              Registration <strong className="text-emerald-400">+5 XP</strong>
            </span>
            <span className="rounded-full bg-slate-800/90 px-2.5 py-1 text-slate-200 ring-1 ring-slate-700/50">
              Attendance <strong className="text-emerald-400">+20 XP</strong>
            </span>
            <span className="rounded-full bg-slate-800/90 px-2.5 py-1 text-slate-200 ring-1 ring-slate-700/50">
              Workshop <strong className="text-cyan-400">+25 XP</strong>
            </span>
            <span className="rounded-full bg-slate-800/90 px-2.5 py-1 text-slate-200 ring-1 ring-slate-700/50">
              Competition <strong className="text-amber-400">+30 XP</strong>
            </span>
            <span className="rounded-full bg-slate-800/90 px-2.5 py-1 text-slate-200 ring-1 ring-slate-700/50">
              Volunteering <strong className="text-fuchsia-400">+40 XP</strong>
            </span>
            <span className="rounded-full bg-slate-800/90 px-2.5 py-1 text-slate-200 ring-1 ring-slate-700/50">
              Feedback <strong className="text-emerald-400">+5 XP</strong>
            </span>
            <span className="rounded-full bg-slate-800/90 px-2.5 py-1 text-slate-200 ring-1 ring-slate-700/50">
              Certificate <strong className="text-cyan-400">+25 XP</strong>
            </span>
            <span className="rounded-full bg-slate-800/90 px-2.5 py-1 text-slate-200 ring-1 ring-slate-700/50">
              Referral <strong className="text-amber-400">+20 XP</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

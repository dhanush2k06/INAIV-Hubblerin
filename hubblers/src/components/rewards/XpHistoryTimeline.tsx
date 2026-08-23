import type { XpTransaction } from '../../types'

interface XpHistoryTimelineProps {
  transactions: XpTransaction[]
}

export function XpHistoryTimeline({ transactions }: XpHistoryTimelineProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/95">
      <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">⏱️</span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">XP Transaction History</h2>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Complete verified audit ledger of your XP earnings and redemptions.
        </p>
      </div>

      {transactions.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <p className="text-3xl">⏱️</p>
          <p className="mt-2 text-xs">No XP transactions recorded yet.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <th className="pb-3 pr-4 font-bold">Activity</th>
                <th className="pb-3 font-bold">Description</th>
                <th className="pb-3 text-right font-bold">XP Change</th>
                <th className="pb-3 text-right font-bold">Balance</th>
                <th className="pb-3 text-right font-bold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {transactions.map((tx) => {
                const isPositive = tx.amount > 0
                return (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="py-3.5 pr-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          tx.activityType === 'REGISTRATION'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : tx.activityType === 'ATTENDANCE'
                            ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
                            : tx.activityType === 'WORKSHOP'
                            ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                            : tx.activityType === 'COMPETITION'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : tx.activityType === 'VOLUNTEERING'
                            ? 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/20'
                            : tx.activityType === 'FEEDBACK'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : tx.activityType === 'CERTIFICATE'
                            ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                            : tx.activityType === 'REFERRAL'
                            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {tx.activityType}
                      </span>
                    </td>
                    <td className="py-3.5 font-medium text-slate-900 dark:text-slate-200">
                      {tx.description}
                    </td>
                    <td
                      className={`py-3.5 text-right font-black ${
                        isPositive ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {isPositive ? `+${tx.amount}` : tx.amount} XP
                    </td>
                    <td className="py-3.5 text-right font-bold text-slate-700 dark:text-slate-300">
                      {tx.balanceAfter} XP
                    </td>
                    <td className="py-3.5 text-right text-slate-400 text-[11px]">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

import { useEffect, useState, useMemo } from 'react'
import { fetchLeaderboard } from '../../services/rewardsApi'
import type { LeaderboardStudent, CollegeLeaderboardEntry } from '../../types'

interface LeaderboardViewProps {
  currentUserId?: string
}

export function LeaderboardView({ currentUserId }: LeaderboardViewProps) {
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'COLLEGES'>('STUDENTS')
  const [students, setStudents] = useState<LeaderboardStudent[]>([])
  const [colleges, setColleges] = useState<CollegeLeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // Generate available monthly archive options (current + past 3 months)
  const monthOptions = useMemo(() => {
    const options: Array<{ key: string; label: string }> = []
    const now = new Date()
    for (let i = 0; i < 4; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      options.push({ key, label: i === 0 ? `${label} (Current)` : label })
    }
    return options
  }, [])

  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[0].key)

  useEffect(() => {
    setLoading(true)
    setError('')
    fetchLeaderboard(selectedMonth)
      .then((res) => {
        setStudents(res.leaderboard)
        setColleges(res.collegeLeaderboard)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
      })
      .finally(() => setLoading(false))
  }, [selectedMonth])

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students
    const q = search.toLowerCase()
    return students.filter(
      (s) => s.fullName.toLowerCase().includes(q) || s.collegeName.toLowerCase().includes(q),
    )
  }, [students, search])

  const topThree = useMemo(() => students.slice(0, 3), [students])
  const currentUserEntry = useMemo(
    () => students.find((s) => s.userId === currentUserId),
    [students, currentUserId],
  )

  return (
    <section className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/95">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥇</span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">XP Leaderboard</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Top campus champions recognized for attendance, skills, volunteering, and contributions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            {monthOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                🗓️ {opt.label}
              </option>
            ))}
          </select>

          {/* Tab Switcher */}
          <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-900">
            <button
              onClick={() => setActiveTab('STUDENTS')}
              className={`rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                activeTab === 'STUDENTS'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              👥 Students
            </button>
            <button
              onClick={() => setActiveTab('COLLEGES')}
              className={`rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                activeTab === 'COLLEGES'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              🏛️ Colleges
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-500">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-950/95">
          <p className="animate-pulse">Loading Leaderboard rankings…</p>
        </div>
      ) : activeTab === 'STUDENTS' ? (
        <div className="space-y-6">
          {/* Top 3 Podium Cards */}
          {topThree.length > 0 && !search && (
            <div className="grid gap-4 sm:grid-cols-3">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="order-2 sm:order-1 relative overflow-hidden rounded-3xl border border-slate-300 bg-gradient-to-b from-slate-200/50 to-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-gradient-to-b dark:from-slate-800/60 dark:to-slate-900">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-300 text-lg font-black text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    🥈 2
                  </div>
                  <div className="mt-3 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-slate-400 bg-slate-100 text-2xl font-bold text-slate-700 shadow-md dark:bg-slate-800 dark:text-white">
                      {topThree[1].fullName.charAt(0)}
                    </div>
                  </div>
                  <h3 className="mt-3 font-bold text-slate-900 dark:text-white truncate">
                    {topThree[1].fullName}
                  </h3>
                  {topThree[1].activeTitle && (
                    <span className="mt-1 inline-block rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {topThree[1].activeTitle}
                    </span>
                  )}
                  <p className="mt-1 text-xs text-slate-500 truncate">{topThree[1].collegeName}</p>
                  <p className="mt-3 text-lg font-black text-slate-800 dark:text-slate-200">
                    {topThree[1].monthlyXp}{' '}
                    <span className="text-xs font-semibold text-slate-500">Monthly XP</span>
                  </p>
                </div>
              )}

              {/* 1st Place Champion */}
              {topThree[0] && (
                <div className="order-1 sm:order-2 relative overflow-hidden rounded-3xl border-2 border-amber-400/60 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white p-6 text-center shadow-xl shadow-amber-500/10 sm:-translate-y-2 dark:border-amber-400/40 dark:bg-gradient-to-b dark:from-amber-950/40 dark:to-slate-900">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-2xl font-black text-slate-950 shadow-md shadow-amber-500/30">
                    👑 1
                  </div>
                  <div className="mt-3 flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-amber-400 bg-amber-100 text-3xl font-black text-amber-900 shadow-lg shadow-amber-500/20 dark:bg-amber-900/40 dark:text-amber-200">
                      {topThree[0].fullName.charAt(0)}
                    </div>
                  </div>
                  <h3 className="mt-3 text-lg font-black text-slate-900 dark:text-white truncate">
                    {topThree[0].fullName}
                  </h3>
                  {topThree[0].activeTitle && (
                    <span className="mt-1 inline-block rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-300 border border-amber-500/30">
                      {topThree[0].activeTitle}
                    </span>
                  )}
                  <p className="mt-1 text-xs text-slate-500 truncate">{topThree[0].collegeName}</p>
                  <p className="mt-3 text-2xl font-black text-amber-500">
                    {topThree[0].monthlyXp}{' '}
                    <span className="text-xs font-semibold text-slate-500">Monthly XP</span>
                  </p>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="order-3 relative overflow-hidden rounded-3xl border border-amber-700/30 bg-gradient-to-b from-amber-700/10 to-white p-6 text-center shadow-sm dark:border-amber-800/40 dark:bg-gradient-to-b dark:from-amber-950/20 dark:to-slate-900">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-700/30 text-lg font-black text-amber-700 dark:text-amber-300">
                    🥉 3
                  </div>
                  <div className="mt-3 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-600 bg-amber-50 text-2xl font-bold text-amber-900 shadow-md dark:bg-slate-800 dark:text-amber-200">
                      {topThree[2].fullName.charAt(0)}
                    </div>
                  </div>
                  <h3 className="mt-3 font-bold text-slate-900 dark:text-white truncate">
                    {topThree[2].fullName}
                  </h3>
                  {topThree[2].activeTitle && (
                    <span className="mt-1 inline-block rounded-full bg-amber-700/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      {topThree[2].activeTitle}
                    </span>
                  )}
                  <p className="mt-1 text-xs text-slate-500 truncate">{topThree[2].collegeName}</p>
                  <p className="mt-3 text-lg font-black text-amber-700 dark:text-amber-400">
                    {topThree[2].monthlyXp}{' '}
                    <span className="text-xs font-semibold text-slate-500">Monthly XP</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Your Rank Banner */}
          {currentUserEntry && (
            <div className="flex items-center justify-between rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-950 dark:text-emerald-300">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-sm font-black text-slate-950 shadow-sm">
                  #{currentUserEntry.rank}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Your Ranking ({selectedMonth})</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {currentUserEntry.monthlyXp} Monthly XP · {currentUserEntry.totalXp} Lifetime XP · Level {currentUserEntry.level}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-600 dark:text-emerald-400">
                You
              </span>
            </div>
          )}

          {/* Full Rankings Table */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/95">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-slate-900 dark:text-white">Full Leaderboard</h3>
              <input
                type="text"
                placeholder="Search student or college…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                    <th className="pb-3 pr-4 font-bold">Rank</th>
                    <th className="pb-3 font-bold">Student</th>
                    <th className="pb-3 font-bold">Institution</th>
                    <th className="pb-3 font-bold">Level</th>
                    <th className="pb-3 text-right font-bold">Monthly XP</th>
                    <th className="pb-3 text-right font-bold">All-Time XP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredStudents.map((student) => {
                    const isSelf = student.userId === currentUserId
                    return (
                      <tr
                        key={student.userId}
                        className={`transition ${
                          isSelf
                            ? 'bg-emerald-500/10 font-semibold text-emerald-950 dark:text-emerald-200'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                        }`}
                      >
                        <td className="py-3.5 pr-4">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                              student.rank === 1
                                ? 'bg-amber-400 text-slate-950 font-black'
                                : student.rank === 2
                                ? 'bg-slate-300 text-slate-800 font-bold dark:bg-slate-700 dark:text-slate-200'
                                : student.rank === 3
                                ? 'bg-amber-700/30 text-amber-600 font-bold dark:text-amber-300'
                                : 'text-slate-400'
                            }`}
                          >
                            {student.rank}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              {student.fullName.charAt(0)}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {student.fullName}
                                {isSelf && <span className="ml-1.5 text-[10px] text-emerald-500">(You)</span>}
                              </p>
                              {student.activeTitle && (
                                <span className="text-[10px] text-slate-500">{student.activeTitle}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 text-slate-600 dark:text-slate-400">{student.collegeName}</td>
                        <td className="py-3.5">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            Lvl {student.level}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-black text-emerald-600 dark:text-emerald-400">
                          +{student.monthlyXp} XP
                        </td>
                        <td className="py-3.5 text-right text-slate-500 dark:text-slate-400">
                          {student.totalXp} XP
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {filteredStudents.length === 0 && (
                <p className="py-8 text-center text-xs text-slate-400">
                  No students found matching your search.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* College Leaderboard */
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/95">
          <h3 className="mb-4 font-bold text-slate-900 dark:text-white">College & Institution Rankings</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                  <th className="pb-3 pr-4 font-bold">Rank</th>
                  <th className="pb-3 font-bold">Institution</th>
                  <th className="pb-3 text-center font-bold">Active Students</th>
                  <th className="pb-3 text-right font-bold">Total Accumulated XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {colleges.map((c) => (
                  <tr key={c.collegeName} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-3.5 pr-4">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                          c.rank === 1
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : c.rank === 2
                            ? 'bg-slate-300 text-slate-800 font-bold dark:bg-slate-700 dark:text-slate-200'
                            : c.rank === 3
                            ? 'bg-amber-700/30 text-amber-600 font-bold dark:text-amber-300'
                            : 'text-slate-400'
                        }`}
                      >
                        {c.rank}
                      </span>
                    </td>
                    <td className="py-3.5 font-bold text-slate-900 dark:text-white">{c.collegeName}</td>
                    <td className="py-3.5 text-center text-slate-600 dark:text-slate-400">
                      {c.studentCount} students
                    </td>
                    <td className="py-3.5 text-right font-black text-emerald-600 dark:text-emerald-400">
                      {c.totalXp.toLocaleString()} XP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {colleges.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-400">No college data available yet.</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

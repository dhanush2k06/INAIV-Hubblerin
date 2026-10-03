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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-card border border-[var(--hx-green-160)] bg-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥇</span>
            <h2 className="font-[Manrope] text-xl font-bold text-[var(--hx-text-primary)]">XP Leaderboard</h2>
          </div>
          <p className="mt-1 font-['DM_Sans'] text-xs text-[var(--hx-text-muted)]">
            Top campus champions recognized for attendance, skills, volunteering, and contributions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-btn border border-[var(--hx-green-160)] bg-[var(--hx-surface)] px-3.5 py-2 font-[Manrope] text-xs font-semibold text-[var(--hx-text-primary)] shadow-sm focus:border-[var(--hx-green)] focus:outline-none"
          >
            {monthOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                🗓️ {opt.label}
              </option>
            ))}
          </select>

          {/* Tab Switcher */}
          <div className="flex rounded-btn bg-[var(--hx-surface)] p-1 border border-[var(--hx-green-160)]">
            <button
              onClick={() => setActiveTab('STUDENTS')}
              className={`rounded-btn px-4 py-1.5 font-[Manrope] text-xs font-semibold transition ${
                activeTab === 'STUDENTS'
                  ? 'bg-[var(--hx-green)] text-white shadow-sm'
                  : 'text-[var(--hx-text-muted)] hover:text-[var(--hx-green)]'
              }`}
            >
              👥 Students
            </button>
            <button
              onClick={() => setActiveTab('COLLEGES')}
              className={`rounded-btn px-4 py-1.5 font-[Manrope] text-xs font-semibold transition ${
                activeTab === 'COLLEGES'
                  ? 'bg-[var(--hx-green)] text-white shadow-sm'
                  : 'text-[var(--hx-text-muted)] hover:text-[var(--hx-green)]'
              }`}
            >
              🏛️ Colleges
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-btn border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 shadow-sm">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-card border border-[var(--hx-green-160)] bg-white p-12 text-center text-[var(--hx-text-muted)] font-['DM_Sans']">
          <p className="animate-pulse">Loading Leaderboard rankings…</p>
        </div>
      ) : activeTab === 'STUDENTS' ? (
        <div className="space-y-6">
          {/* Top 3 Podium Cards */}
          {topThree.length > 0 && !search && (
            <div className="grid gap-4 sm:grid-cols-3">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="order-2 sm:order-1 relative overflow-hidden rounded-3xl border border-[var(--hx-green-160)] bg-white p-6 text-center shadow-sm">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-slate-700 border border-slate-200">
                    🥈 2
                  </div>
                  <div className="mt-3 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--hx-green-160)] bg-[var(--hx-surface)] text-2xl font-bold text-[var(--hx-green)] shadow-md">
                      {topThree[1].fullName.charAt(0)}
                    </div>
                  </div>
                  <h3 className="mt-3 font-[Manrope] font-bold text-[var(--hx-text-primary)] truncate">
                    {topThree[1].fullName}
                  </h3>
                  {topThree[1].activeTitle && (
                    <span className="mt-1 inline-block rounded-tag bg-[var(--hx-green-40)] px-2 py-0.5 text-[10px] font-bold text-[var(--hx-green)]">
                      {topThree[1].activeTitle}
                    </span>
                  )}
                  <p className="mt-1 font-['DM_Sans'] text-xs text-[var(--hx-text-muted)] truncate">{topThree[1].collegeName}</p>
                  <p className="mt-3 font-[Manrope] text-lg font-black text-[var(--hx-text-primary)]">
                    {topThree[1].monthlyXp}{' '}
                    <span className="font-['DM_Sans'] text-xs font-semibold text-[var(--hx-text-muted)]">Monthly XP</span>
                  </p>
                </div>
              )}

              {/* 1st Place Champion */}
              {topThree[0] && (
                <div className="order-1 sm:order-2 relative overflow-hidden rounded-3xl border-2 border-amber-400/80 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white p-6 text-center shadow-xl shadow-amber-500/10 sm:-translate-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-2xl font-black text-slate-950 shadow-md shadow-amber-500/30">
                    👑 1
                  </div>
                  <div className="mt-3 flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-amber-400 bg-amber-100 text-3xl font-black text-amber-900 shadow-lg shadow-amber-500/20">
                      {topThree[0].fullName.charAt(0)}
                    </div>
                  </div>
                  <h3 className="mt-3 font-[Manrope] text-lg font-black text-[var(--hx-text-primary)] truncate">
                    {topThree[0].fullName}
                  </h3>
                  {topThree[0].activeTitle && (
                    <span className="mt-1 inline-block rounded-tag bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      {topThree[0].activeTitle}
                    </span>
                  )}
                  <p className="mt-1 font-['DM_Sans'] text-xs text-[var(--hx-text-muted)] truncate">{topThree[0].collegeName}</p>
                  <p className="mt-3 font-[Manrope] text-2xl font-black text-amber-600">
                    {topThree[0].monthlyXp}{' '}
                    <span className="font-['DM_Sans'] text-xs font-semibold text-[var(--hx-text-muted)]">Monthly XP</span>
                  </p>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="order-3 relative overflow-hidden rounded-3xl border border-amber-700/20 bg-gradient-to-b from-amber-700/10 to-white p-6 text-center shadow-sm">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-lg font-black text-amber-800 border border-amber-200">
                    🥉 3
                  </div>
                  <div className="mt-3 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-600 bg-amber-50 text-2xl font-bold text-amber-900 shadow-md">
                      {topThree[2].fullName.charAt(0)}
                    </div>
                  </div>
                  <h3 className="mt-3 font-[Manrope] font-bold text-[var(--hx-text-primary)] truncate">
                    {topThree[2].fullName}
                  </h3>
                  {topThree[2].activeTitle && (
                    <span className="mt-1 inline-block rounded-tag bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      {topThree[2].activeTitle}
                    </span>
                  )}
                  <p className="mt-1 font-['DM_Sans'] text-xs text-[var(--hx-text-muted)] truncate">{topThree[2].collegeName}</p>
                  <p className="mt-3 font-[Manrope] text-lg font-black text-amber-700">
                    {topThree[2].monthlyXp}{' '}
                    <span className="font-['DM_Sans'] text-xs font-semibold text-[var(--hx-text-muted)]">Monthly XP</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Your Rank Banner */}
          {currentUserEntry && (
            <div className="flex items-center justify-between rounded-card border border-[var(--hx-green-160)] bg-[var(--hx-green-40)] p-4 text-[var(--hx-green)] shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-btn bg-[var(--hx-green)] text-sm font-black text-white shadow-sm font-[Manrope]">
                  #{currentUserEntry.rank}
                </span>
                <div>
                  <p className="font-[Manrope] text-sm font-bold text-[var(--hx-text-primary)]">Your Ranking ({selectedMonth})</p>
                  <p className="font-['DM_Sans'] text-xs text-[var(--hx-text-muted)]">
                    {currentUserEntry.monthlyXp} Monthly XP · {currentUserEntry.totalXp} Lifetime XP · Level {currentUserEntry.level}
                  </p>
                </div>
              </div>
              <span className="hx-tag">
                You
              </span>
            </div>
          )}

          {/* Full Rankings Table */}
          <div className="rounded-card border border-[var(--hx-green-160)] bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-[Manrope] font-bold text-[var(--hx-text-primary)]">Full Leaderboard</h3>
              <input
                type="text"
                placeholder="Search student or college…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 rounded-btn border border-[var(--hx-green-160)] bg-[var(--hx-surface)] px-3 py-1.5 font-['DM_Sans'] text-xs text-[var(--hx-text-primary)] placeholder-[var(--hx-text-muted)] focus:border-[var(--hx-green)] focus:outline-none"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--hx-green-160)] text-[11px] uppercase tracking-wider font-[Manrope] text-[var(--hx-text-muted)]">
                    <th className="pb-3 pr-4 font-bold">Rank</th>
                    <th className="pb-3 font-bold">Student</th>
                    <th className="pb-3 font-bold">Institution</th>
                    <th className="pb-3 font-bold">Level</th>
                    <th className="pb-3 text-right font-bold">Monthly XP</th>
                    <th className="pb-3 text-right font-bold">All-Time XP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hx-green-160)] font-['DM_Sans']">
                  {filteredStudents.map((student) => {
                    const isSelf = student.userId === currentUserId
                    return (
                      <tr
                        key={student.userId}
                        className={`transition ${
                          isSelf
                            ? 'bg-[var(--hx-green-40)] font-semibold text-[var(--hx-text-primary)]'
                            : 'hover:bg-[var(--hx-surface)]'
                        }`}
                      >
                        <td className="py-3.5 pr-4">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-[Manrope] font-bold ${
                              student.rank === 1
                                ? 'bg-amber-400 text-slate-950 font-black'
                                : student.rank === 2
                                ? 'bg-slate-200 text-slate-800 font-bold'
                                : student.rank === 3
                                ? 'bg-amber-100 text-amber-800 font-bold'
                                : 'text-[var(--hx-text-muted)]'
                            }`}
                          >
                            {student.rank}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--hx-green-40)] text-xs font-bold text-[var(--hx-green)] border border-[var(--hx-green-160)]">
                              {student.fullName.charAt(0)}
                            </span>
                            <div>
                              <p className="font-[Manrope] font-bold text-[var(--hx-text-primary)]">
                                {student.fullName}
                                {isSelf && <span className="ml-1.5 text-[10px] text-[var(--hx-green)]">(You)</span>}
                              </p>
                              {student.activeTitle && (
                                <span className="text-[10px] text-[var(--hx-text-muted)]">{student.activeTitle}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 text-[var(--hx-text-muted)]">{student.collegeName}</td>
                        <td className="py-3.5">
                          <span className="hx-tag text-[10px]">
                            Lvl {student.level}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-[Manrope] font-black text-[var(--hx-green)]">
                          +{student.monthlyXp} XP
                        </td>
                        <td className="py-3.5 text-right text-[var(--hx-text-muted)]">
                          {student.totalXp} XP
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {filteredStudents.length === 0 && (
                <p className="py-8 text-center text-xs text-[var(--hx-text-muted)] font-['DM_Sans']">
                  No students found matching your search.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* College Leaderboard */
        <div className="rounded-card border border-[var(--hx-green-160)] bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-[Manrope] font-bold text-[var(--hx-text-primary)]">College & Institution Rankings</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--hx-green-160)] text-[11px] uppercase tracking-wider font-[Manrope] text-[var(--hx-text-muted)]">
                  <th className="pb-3 pr-4 font-bold">Rank</th>
                  <th className="pb-3 font-bold">Institution</th>
                  <th className="pb-3 text-center font-bold">Active Students</th>
                  <th className="pb-3 text-right font-bold">Total Accumulated XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--hx-green-160)] font-['DM_Sans']">
                {colleges.map((c) => (
                  <tr key={c.collegeName} className="hover:bg-[var(--hx-surface)]">
                    <td className="py-3.5 pr-4">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-[Manrope] font-bold ${
                          c.rank === 1
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : c.rank === 2
                            ? 'bg-slate-200 text-slate-800 font-bold'
                            : c.rank === 3
                            ? 'bg-amber-100 text-amber-800 font-bold'
                            : 'text-[var(--hx-text-muted)]'
                        }`}
                      >
                        {c.rank}
                      </span>
                    </td>
                    <td className="py-3.5 font-[Manrope] font-bold text-[var(--hx-text-primary)]">{c.collegeName}</td>
                    <td className="py-3.5 text-center text-[var(--hx-text-muted)]">
                      {c.studentCount} students
                    </td>
                    <td className="py-3.5 text-right font-[Manrope] font-black text-[var(--hx-green)]">
                      {c.totalXp.toLocaleString()} XP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {colleges.length === 0 && (
              <p className="py-8 text-center text-xs text-[var(--hx-text-muted)] font-['DM_Sans']">No college data available yet.</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

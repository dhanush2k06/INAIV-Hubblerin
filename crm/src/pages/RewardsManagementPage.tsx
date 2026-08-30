import { useEffect, useState } from 'react'
import {
  fetchCrmRewards,
  createCrmReward,
  updateCrmReward,
  deleteCrmReward,
  fetchCrmRedemptions,
  fetchCrmRewardsStats,
  fetchCrmBadges,
  awardCrmBadge,
  type CrmRewardItem,
  type CrmRedemptionRecord,
  type CrmRewardsStats,
  type CrmBadgeItem,
  type RewardCategory,
} from '../services/api'

type TabKey = 'REWARDS' | 'REDEMPTIONS' | 'ANALYTICS' | 'BADGES'

const emptyRewardForm: Partial<CrmRewardItem> = {
  name: '',
  description: '',
  image: '🎁',
  xpCost: 100,
  category: 'THEME',
  minLevel: 1,
  minXp: 0,
  active: true,
  valueData: {},
}

export function RewardsManagementPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('REWARDS')

  // Rewards State
  const [rewards, setRewards] = useState<CrmRewardItem[]>([])
  const [loadingRewards, setLoadingRewards] = useState(false)
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false)
  const [editingReward, setEditingReward] = useState<CrmRewardItem | null>(null)
  const [rewardForm, setRewardForm] = useState<Partial<CrmRewardItem>>(emptyRewardForm)
  const [savingReward, setSavingReward] = useState(false)

  // Redemptions State
  const [redemptions, setRedemptions] = useState<CrmRedemptionRecord[]>([])
  const [loadingRedemptions, setLoadingRedemptions] = useState(false)
  const [redemptionSearch, setRedemptionSearch] = useState('')
  const [redemptionStatus, setRedemptionStatus] = useState('ALL')

  // Stats State
  const [stats, setStats] = useState<CrmRewardsStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // Badges State
  const [badges, setBadges] = useState<CrmBadgeItem[]>([])
  const [loadingBadges, setLoadingBadges] = useState(false)
  const [isAwardBadgeModalOpen, setIsAwardBadgeModalOpen] = useState(false)
  const [awardStudentUid, setAwardStudentUid] = useState('')
  const [awardBadgeId, setAwardBadgeId] = useState('')
  const [awardingBadge, setAwardingBadge] = useState(false)

  // Global Feedback
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Load active tab data
  useEffect(() => {
    if (activeTab === 'REWARDS') {
      setLoadingRewards(true)
      fetchCrmRewards()
        .then(setRewards)
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to fetch rewards'))
        .finally(() => setLoadingRewards(false))
    } else if (activeTab === 'REDEMPTIONS') {
      setLoadingRedemptions(true)
      fetchCrmRedemptions({ search: redemptionSearch, status: redemptionStatus })
        .then((res) => setRedemptions(res.redemptions))
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to fetch redemptions'))
        .finally(() => setLoadingRedemptions(false))
    } else if (activeTab === 'ANALYTICS') {
      setLoadingStats(true)
      fetchCrmRewardsStats()
        .then(setStats)
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to fetch stats'))
        .finally(() => setLoadingStats(false))
    } else if (activeTab === 'BADGES') {
      setLoadingBadges(true)
      fetchCrmBadges()
        .then(setBadges)
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to fetch badges'))
        .finally(() => setLoadingBadges(false))
    }
  }, [activeTab, redemptionSearch, redemptionStatus])

  function openCreateRewardModal() {
    setEditingReward(null)
    setRewardForm(emptyRewardForm)
    setError('')
    setIsRewardModalOpen(true)
  }

  function openEditRewardModal(item: CrmRewardItem) {
    setEditingReward(item)
    setRewardForm({
      name: item.name,
      description: item.description,
      image: item.image,
      xpCost: item.xpCost,
      category: item.category,
      minLevel: item.minLevel,
      minXp: item.minXp,
      active: item.active,
      valueData: item.valueData || {},
    })
    setError('')
    setIsRewardModalOpen(true)
  }

  async function handleSaveReward(e: React.FormEvent) {
    e.preventDefault()
    setSavingReward(true)
    setError('')
    setMessage('')

    try {
      if (editingReward) {
        await updateCrmReward(editingReward.id, rewardForm)
        setMessage(`Reward "${rewardForm.name}" updated!`)
      } else {
        await createCrmReward(rewardForm)
        setMessage(`Reward "${rewardForm.name}" created!`)
      }
      setIsRewardModalOpen(false)
      fetchCrmRewards().then(setRewards)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save reward')
    } finally {
      setSavingReward(false)
    }
  }

  async function handleDeleteReward(id: string, name: string) {
    if (!window.confirm(`Are you sure you want to delete reward "${name}"?`)) return
    try {
      await deleteCrmReward(id)
      setMessage(`Reward "${name}" deleted.`)
      setRewards((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete reward')
    }
  }

  async function handleToggleRewardActive(reward: CrmRewardItem) {
    try {
      const nextActive = !reward.active
      await updateCrmReward(reward.id, { active: nextActive })
      setRewards((prev) => prev.map((r) => (r.id === reward.id ? { ...r, active: nextActive } : r)))
      setMessage(`Reward "${reward.name}" is now ${nextActive ? 'Active' : 'Inactive'}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update reward status')
    }
  }

  async function handleAwardBadge(e: React.FormEvent) {
    e.preventDefault()
    if (!awardStudentUid.trim() || !awardBadgeId) return

    setAwardingBadge(true)
    setError('')
    setMessage('')

    try {
      const res = await awardCrmBadge({ studentUid: awardStudentUid.trim(), badgeId: awardBadgeId })
      setMessage(res.message || 'Badge awarded successfully!')
      setIsAwardBadgeModalOpen(false)
      setAwardStudentUid('')
      setAwardBadgeId('')
      fetchCrmBadges().then(setBadges)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to award badge')
    } finally {
      setAwardingBadge(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Gamification & XP Management</h1>
          <p className="mt-1 text-sm text-slate-500">Reward items, badge directory, redemptions audit log, and leaderboard analytics.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'REWARDS' && (
            <button
              onClick={openCreateRewardModal}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <span>+</span>
              <span>Create Store Reward</span>
            </button>
          )}
          {activeTab === 'BADGES' && (
            <button
              onClick={() => setIsAwardBadgeModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <span>🏅</span>
              <span>Manually Award Badge</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Messages */}
      {message && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs font-semibold text-black flex items-center justify-between">
          <span>✓ {message}</span>
          <button onClick={() => setMessage('')} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600 flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('REWARDS')}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'REWARDS'
              ? 'bg-black text-white'
              : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-black'
          }`}
        >
          Store Rewards ({rewards.length})
        </button>
        <button
          onClick={() => setActiveTab('REDEMPTIONS')}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'REDEMPTIONS'
              ? 'bg-black text-white'
              : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-black'
          }`}
        >
          Redemptions Audit Log
        </button>
        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'ANALYTICS'
              ? 'bg-black text-white'
              : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-black'
          }`}
        >
          XP Analytics & Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('BADGES')}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'BADGES'
              ? 'bg-black text-white'
              : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-black'
          }`}
        >
          Badges Directory
        </button>
      </div>

      {/* TAB 1: REWARDS STORE MANAGER */}
      {activeTab === 'REWARDS' && (
        <div className="space-y-4">
          {loadingRewards ? (
            <p className="p-8 text-center text-xs text-slate-400">Loading store rewards…</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-xs text-slate-700">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4 font-bold">Reward</th>
                    <th className="px-6 py-4 font-bold">Category</th>
                    <th className="px-6 py-4 font-bold">XP Cost</th>
                    <th className="px-6 py-4 font-bold">Min Level</th>
                    <th className="px-6 py-4 text-center font-bold">Claims</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rewards.map((reward) => (
                    <tr key={reward.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xl border border-slate-200">
                            {reward.image || '🎁'}
                          </span>
                          <div>
                            <p className="font-bold text-black">{reward.name}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500 truncate max-w-xs">
                              {reward.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                          {reward.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-black">{reward.xpCost} XP</td>
                      <td className="px-6 py-4 text-slate-600">Level {reward.minLevel}</td>
                      <td className="px-6 py-4 text-center font-bold text-black">{reward.redemptionsCount || 0}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleRewardActive(reward)}
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase transition ${
                            reward.active
                              ? 'border border-black bg-black text-white'
                              : 'border border-slate-200 bg-slate-100 text-slate-500'
                          }`}
                        >
                          {reward.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditRewardModal(reward)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-black hover:border-black"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteReward(reward.id, reward.name)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REDEMPTIONS AUDIT LOG */}
      {activeTab === 'REDEMPTIONS' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <input
              type="text"
              placeholder="Search student, email, reward, or voucher code…"
              value={redemptionSearch}
              onChange={(e) => setRedemptionSearch(e.target.value)}
              className="w-80 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-black placeholder-slate-400 focus:border-black focus:outline-none"
            />
            <select
              value={redemptionStatus}
              onChange={(e) => setRedemptionStatus(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-black focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="USED">Used</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          {loadingRedemptions ? (
            <p className="p-8 text-center text-xs text-slate-400">Loading redemptions…</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-xs text-slate-700">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4 font-bold">Student</th>
                    <th className="px-6 py-4 font-bold">Reward Name</th>
                    <th className="px-6 py-4 font-bold">Category</th>
                    <th className="px-6 py-4 font-bold">XP Deducted</th>
                    <th className="px-6 py-4 font-bold">Redemption Voucher Code</th>
                    <th className="px-6 py-4 font-bold">Date</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {redemptions.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-black">{r.userName}</p>
                        <p className="text-[11px] text-slate-500">{r.userEmail}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-black">{r.rewardName}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                          {r.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-black">-{r.xpCost} XP</td>
                      <td className="px-6 py-4 font-mono font-bold text-black">{r.redemptionCode}</td>
                      <td className="px-6 py-4 text-[11px] text-slate-500">
                        {new Date(r.redeemedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-black">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {redemptions.length === 0 && (
                <p className="py-8 text-center text-xs text-slate-400">No redemptions found.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: XP ANALYTICS & TOP STUDENTS */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          {loadingStats || !stats ? (
            <p className="p-8 text-center text-xs text-slate-400">Loading gamification analytics…</p>
          ) : (
            <>
              {/* Metric Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Circulating XP</p>
                  <p className="mt-2 text-3xl font-black text-black">{stats.totalCirculatingXp.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-slate-500">Active student balance</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Earned XP</p>
                  <p className="mt-2 text-3xl font-black text-black">{stats.totalEarnedXp.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-slate-500">Gross activity issuance</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Redeemed XP</p>
                  <p className="mt-2 text-3xl font-black text-black">{stats.totalRedeemedXp.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-slate-500">Spent in Reward Store</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Badges & Certs</p>
                  <p className="mt-2 text-3xl font-black text-black">
                    {stats.totalBadgesIssued} <span className="text-sm font-normal text-slate-500">/ {stats.totalCertificatesIssued} Certs</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Verified credentials issued</p>
                </div>
              </div>

              {/* Activity Breakdown */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold text-black">Activity Issuance Breakdown</h3>
                <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-4">
                  {Object.entries(stats.activityBreakdown || {}).map(([type, data]) => (
                    <div key={type} className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{type}</p>
                      <p className="mt-1 text-lg font-black text-black">{data.count} events</p>
                      <p className="text-xs font-bold text-black">+{data.totalXp} XP</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Students Table */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold text-black mb-4">Top 20 XP Earners</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="pb-3 pr-4 font-bold">Rank</th>
                        <th className="pb-3 font-bold">Student</th>
                        <th className="pb-3 font-bold">Institution</th>
                        <th className="pb-3 font-bold">Level</th>
                        <th className="pb-3 text-center font-bold">Badges</th>
                        <th className="pb-3 text-center font-bold">Certs</th>
                        <th className="pb-3 text-right font-bold">Total XP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.topStudents.map((s, idx) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="py-3 pr-4 font-bold text-black">#{idx + 1}</td>
                          <td className="py-3">
                            <p className="font-bold text-black">{s.fullName}</p>
                            <p className="text-[10px] text-slate-500">{s.email}</p>
                          </td>
                          <td className="py-3 text-slate-600">{s.collegeName}</td>
                          <td className="py-3">
                            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-black">
                              Lvl {s.level} ({s.levelTitle})
                            </span>
                          </td>
                          <td className="py-3 text-center font-bold text-black">{s.badgesCount}</td>
                          <td className="py-3 text-center font-bold text-black">{s.certificatesCount}</td>
                          <td className="py-3 text-right font-black text-black">
                            {s.xp.toLocaleString()} XP
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 4: BADGES DIRECTORY */}
      {activeTab === 'BADGES' && (
        <div className="space-y-4">
          {loadingBadges ? (
            <p className="p-8 text-center text-xs text-slate-400">Loading badges…</p>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                        {b.category}
                      </span>
                      <span className="text-[11px] font-bold text-black">
                        {b.unlockedCount} Awarded
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl border border-slate-200">
                        {b.icon}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-black">{b.name}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{b.description}</p>
                      </div>
                    </div>

                    <p className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-2 text-[10px] text-slate-600">
                      Criteria: <strong className="text-black">{b.criteria}</strong>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT REWARD MODAL */}
      {isRewardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-black shadow-2xl">
            <h3 className="text-lg font-bold">
              {editingReward ? 'Edit Store Reward' : 'Create Store Reward'}
            </h3>

            <form onSubmit={handleSaveReward} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Reward Name *</label>
                <input
                  type="text"
                  required
                  value={rewardForm.name}
                  onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                  placeholder="e.g. Cyberpunk Minimal Theme"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-black focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Description *</label>
                <textarea
                  required
                  rows={2}
                  value={rewardForm.description}
                  onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                  placeholder="Brief description shown to students"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-black focus:border-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Category *</label>
                  <select
                    value={rewardForm.category}
                    onChange={(e) => setRewardForm({ ...rewardForm, category: e.target.value as RewardCategory })}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-black focus:border-black focus:outline-none"
                  >
                    <option value="THEME">🎨 Profile Theme</option>
                    <option value="FRAME">🖼️ Profile Frame</option>
                    <option value="TITLE">🎖️ Special Title</option>
                    <option value="BADGE">💎 Exclusive Badge</option>
                    <option value="DISCOUNT">🏷️ Event Discount</option>
                    <option value="ACCESS">⏱️ Early Access</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Icon / Emoji *</label>
                  <input
                    type="text"
                    required
                    value={rewardForm.image}
                    onChange={(e) => setRewardForm({ ...rewardForm, image: e.target.value })}
                    placeholder="e.g. 🌌"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-black focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">XP Cost *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={rewardForm.xpCost}
                    onChange={(e) => setRewardForm({ ...rewardForm, xpCost: parseInt(e.target.value, 10) || 1 })}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-black focus:border-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Min Level *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={rewardForm.minLevel}
                    onChange={(e) => setRewardForm({ ...rewardForm, minLevel: parseInt(e.target.value, 10) || 1 })}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-black focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="reward-active"
                  checked={rewardForm.active}
                  onChange={(e) => setRewardForm({ ...rewardForm, active: e.target.checked })}
                  className="rounded border-slate-300 text-black focus:ring-black"
                />
                <label htmlFor="reward-active" className="text-xs font-semibold text-slate-700">
                  Active & Available for Redemption
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRewardModalOpen(false)}
                  disabled={savingReward}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReward}
                  className="rounded-lg bg-black px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {savingReward ? 'Saving…' : 'Save Reward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AWARD BADGE MODAL */}
      {isAwardBadgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-black shadow-2xl">
            <h3 className="text-lg font-bold">Manually Award Badge to Student</h3>
            <p className="mt-1 text-xs text-slate-500">
              Grant a special or milestone badge directly to a student account.
            </p>

            <form onSubmit={handleAwardBadge} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Student User ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. user_firebase_uid"
                  value={awardStudentUid}
                  onChange={(e) => setAwardStudentUid(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-black focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Select Badge *</label>
                <select
                  required
                  value={awardBadgeId}
                  onChange={(e) => setAwardBadgeId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-black focus:border-black focus:outline-none"
                >
                  <option value="">Select a badge…</option>
                  {badges.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.icon} {b.name} ({b.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAwardBadgeModalOpen(false)}
                  disabled={awardingBadge}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={awardingBadge || !awardStudentUid.trim() || !awardBadgeId}
                  className="rounded-lg bg-black px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {awardingBadge ? 'Awarding…' : 'Award Badge Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

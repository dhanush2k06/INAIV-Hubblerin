import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  fetchPublicProfile,
  sendConnectionRequest,
  cancelConnectionRequest,
  removeConnection,
  toggleFollowUser,
} from '../services/connectionsApi'
import type { PublicUserProfile } from '../types'

export function PublicProfilePage() {
  const { hubblerId } = useParams<{ hubblerId: string }>()
  const [profile, setProfile] = useState<PublicUserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'certificates' | 'posts'>('overview')

  const loadData = () => {
    if (!hubblerId) return
    setLoading(true)
    setError(null)
    fetchPublicProfile(hubblerId)
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load profile'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [hubblerId])

  const handleCopyHandle = () => {
    if (!profile) return
    navigator.clipboard.writeText(profile.hubblerId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendRequest = async () => {
    if (!profile) return
    setActionLoading(true)
    try {
      await sendConnectionRequest(profile.hubblerId)
      loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelRequest = async () => {
    if (!profile) return
    setActionLoading(true)
    try {
      await cancelConnectionRequest(profile.hubblerId)
      loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveConnection = async () => {
    if (!profile || !confirm(`Remove connection with ${profile.fullName}?`)) return
    setActionLoading(true)
    try {
      await removeConnection(profile.hubblerId)
      loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleFollow = async () => {
    if (!profile) return
    setActionLoading(true)
    try {
      const res = await toggleFollowUser(profile.hubblerId)
      setProfile((prev) => (prev ? { ...prev, isFollowing: res.isFollowing } : null))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link */}
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-emerald-400 transition"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="flex h-96 flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="text-sm text-slate-400">Loading student passport...</p>
          </div>
        ) : error || !profile ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-12 text-center space-y-3">
            <span className="text-4xl">🔍</span>
            <h3 className="text-lg font-bold text-white">Hubbler Not Found</h3>
            <p className="text-xs text-slate-400">{error || 'The requested HubblerID does not exist or is private.'}</p>
            <Link
              to="/dashboard?tab=connections"
              className="mt-2 inline-block rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-black text-slate-950 hover:bg-emerald-400 shadow-md"
            >
              Search Hubbler Network
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
            {/* Banner Header */}
            <div className="relative h-44 w-full overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 sm:h-52">
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute bottom-4 right-6 rounded-full bg-black/40 px-3.5 py-1 text-xs font-bold text-white/90 backdrop-blur-md">
                Official HubblerX Passport
              </div>
            </div>

            {/* Profile Content */}
            <div className="px-6 pb-8 pt-0 sm:px-10">
              <div className="-mt-16 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
                {/* Avatar with cosmetic frame */}
                <div className="relative">
                  <div
                    className={`flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border-4 bg-slate-800 shadow-2xl ${
                      profile.activeFrame === 'GOLDEN_AURA'
                        ? 'border-amber-400 ring-4 ring-amber-400/40'
                        : profile.activeFrame === 'NEON_CYBER'
                        ? 'border-cyan-400 ring-4 ring-cyan-400/40'
                        : profile.activeFrame === 'DIAMOND_ELITE'
                        ? 'border-purple-400 ring-4 ring-purple-400/40'
                        : 'border-slate-800'
                    }`}
                  >
                    {profile.profileImage ? (
                      <img src={profile.profileImage} alt={profile.fullName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-4xl font-black text-emerald-400">
                        {profile.fullName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div
                    className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 bg-emerald-500 text-xs font-black text-slate-950 shadow-md"
                    title={`Level ${profile.level}: ${profile.levelTitle}`}
                  >
                    {profile.level}
                  </div>
                </div>

                {/* Connection & Follow Actions */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleToggleFollow}
                    disabled={actionLoading}
                    className={`rounded-full px-5 py-2.5 text-xs font-bold transition shadow-sm ${
                      profile.isFollowing
                        ? 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                        : 'bg-indigo-600 text-white hover:bg-indigo-500'
                    }`}
                  >
                    {profile.isFollowing ? '✓ Following' : '+ Follow'}
                  </button>

                  {profile.connectionStatus === 'ACCEPTED' ? (
                    <button
                      onClick={handleRemoveConnection}
                      disabled={actionLoading}
                      className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-5 py-2.5 text-xs font-bold text-emerald-400 hover:bg-rose-500/10 hover:border-rose-500 hover:text-rose-400 transition"
                      title="Click to disconnect"
                    >
                      🤝 Connected
                    </button>
                  ) : profile.connectionStatus === 'PENDING' ? (
                    <button
                      onClick={handleCancelRequest}
                      disabled={actionLoading}
                      className="rounded-full border border-amber-500/50 bg-amber-500/10 px-5 py-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition"
                    >
                      ⏳ Request Pending (Cancel)
                    </button>
                  ) : (
                    <button
                      onClick={handleSendRequest}
                      disabled={actionLoading}
                      className="rounded-full bg-emerald-500 px-5 py-2.5 text-xs font-black text-slate-950 transition hover:bg-emerald-400 shadow-md"
                    >
                      🤝 Connect
                    </button>
                  )}
                </div>
              </div>

              {/* Names & Handle */}
              <div className="mt-5 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-black text-white">{profile.fullName}</h1>
                  {profile.activeTitle && (
                    <span className="rounded-full bg-indigo-500/20 border border-indigo-500/40 px-3 py-0.5 text-xs font-bold text-indigo-300">
                      🏷️ {profile.activeTitle}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
                  <button
                    onClick={handleCopyHandle}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1 font-mono font-bold text-emerald-400 transition hover:border-emerald-500"
                  >
                    <span>🆔 {profile.hubblerId}</span>
                    <span className="text-[10px] text-slate-400">{copied ? '✓ Copied' : '📋 Copy'}</span>
                  </button>

                  <span>•</span>
                  <span>🏛️ {profile.collegeName}</span>
                  {profile.branch && <span>• {profile.branch}</span>}
                  {profile.year && <span>• {profile.year}</span>}
                </div>

                {profile.mutualCount > 0 && (
                  <p className="text-xs text-emerald-400 font-semibold pt-1">
                    👥 {profile.mutualCount} mutual connection{profile.mutualCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Navigation Sub-Tabs */}
              <div className="mt-8 flex items-center overflow-x-auto scrollbar-none no-scrollbar border-b border-slate-800 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`shrink-0 whitespace-nowrap pb-3 px-5 transition border-b-2 ${
                    activeTab === 'overview'
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📊 Overview & Level
                </button>
                <button
                  onClick={() => setActiveTab('badges')}
                  className={`shrink-0 whitespace-nowrap pb-3 px-5 transition border-b-2 ${
                    activeTab === 'badges'
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🏆 Badges ({profile.badgeCount})
                </button>
                {profile.certificates && (
                  <button
                    onClick={() => setActiveTab('certificates')}
                    className={`shrink-0 whitespace-nowrap pb-3 px-5 transition border-b-2 ${
                      activeTab === 'certificates'
                        ? 'border-emerald-500 text-emerald-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    📜 Certificates ({profile.certificates.length})
                  </button>
                )}
                {profile.recentPosts && profile.recentPosts.length > 0 && (
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`shrink-0 whitespace-nowrap pb-3 px-5 transition border-b-2 ${
                      activeTab === 'posts'
                        ? 'border-emerald-500 text-emerald-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    📢 Achievements ({profile.recentPosts.length})
                  </button>
                )}
              </div>

              {/* Tab Contents */}
              <div className="pt-6">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">{profile.levelIcon}</span>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Current Level</p>
                          <h3 className="text-xl font-black text-white">Level {profile.level}: {profile.levelTitle}</h3>
                        </div>
                      </div>
                      {profile.xp !== undefined && (
                        <div className="text-right">
                          <span className="text-3xl font-black text-emerald-400">{profile.xp}</span>
                          <span className="text-xs text-slate-400 font-bold ml-1">Total XP</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-center">
                        <p className="text-xs font-bold uppercase text-slate-400">Earned Badges</p>
                        <p className="mt-1 text-2xl font-black text-amber-400">{profile.badgeCount}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-center">
                        <p className="text-xs font-bold uppercase text-slate-400">Certificates</p>
                        <p className="mt-1 text-2xl font-black text-cyan-400">
                          {profile.certificates ? profile.certificates.length : '🔒 Private'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-center col-span-2 sm:col-span-1">
                        <p className="text-xs font-bold uppercase text-slate-400">Events Attended</p>
                        <p className="mt-1 text-2xl font-black text-indigo-400">
                          {profile.eventCount !== undefined ? profile.eventCount : '🔒 Private'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'badges' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {profile.badges.map((b) => (
                      <div
                        key={b.id}
                        className="flex flex-col items-center rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-center"
                      >
                        <span className="text-3xl">{b.icon}</span>
                        <p className="mt-2 text-xs font-bold text-white">{b.name}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{b.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'certificates' && profile.certificates && (
                  <div className="space-y-3">
                    {profile.certificates.map((cert) => (
                      <div
                        key={cert.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">📜</span>
                          <div>
                            <p className="text-sm font-bold text-white">{cert.eventTitle}</p>
                            <p className="text-xs font-mono text-emerald-400">{cert.verificationCode}</p>
                          </div>
                        </div>
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
                          {cert.issuedAt ? cert.issuedAt.split('T')[0] : 'Verified'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'posts' && profile.recentPosts && (
                  <div className="space-y-4">
                    {profile.recentPosts.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{p.achievementIcon}</span>
                          <div>
                            <h5 className="text-sm font-bold text-white">{p.achievementTitle}</h5>
                            <p className="text-xs text-slate-400">{p.achievementDescription}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

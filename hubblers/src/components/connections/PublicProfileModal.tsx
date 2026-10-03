import { useEffect, useState } from 'react'
import {
  fetchPublicProfile,
  sendConnectionRequest,
  cancelConnectionRequest,
  removeConnection,
  toggleFollowUser,
} from '../../services/connectionsApi'
import type { PublicUserProfile } from '../../types'

interface PublicProfileModalProps {
  hubblerId: string | null
  onClose: () => void
  onConnectionChange?: () => void
}

export function PublicProfileModal({
  hubblerId,
  onClose,
  onConnectionChange,
}: PublicProfileModalProps) {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'badges' | 'certificates' | 'posts'>('overview')

  useEffect(() => {
    if (!hubblerId) {
      setProfile(null)
      return
    }

    setLoading(true)
    setError(null)
    fetchPublicProfile(hubblerId)
      .then((data) => setProfile(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load profile'))
      .finally(() => setLoading(false))
  }, [hubblerId])

  if (!hubblerId) return null

  const handleCopyHubblerId = () => {
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
      const updated = await fetchPublicProfile(profile.hubblerId)
      setProfile(updated)
      onConnectionChange?.()
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
      const updated = await fetchPublicProfile(profile.hubblerId)
      setProfile(updated)
      onConnectionChange?.()
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
      const updated = await fetchPublicProfile(profile.hubblerId)
      setProfile(updated)
      onConnectionChange?.()
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
      onConnectionChange?.()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-card border border-[var(--hx-green-160)] bg-white shadow-2xl text-[var(--hx-text-primary)] font-['DM_Sans']">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--hx-surface)] border border-[var(--hx-green-160)] text-[var(--hx-text-muted)] transition hover:bg-[var(--hx-green-40)] hover:text-[var(--hx-green)]"
        >
          ✕
        </button>

        {loading ? (
          <div className="flex h-72 flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--hx-green)] border-t-transparent" />
            <p className="text-sm font-medium text-[var(--hx-text-muted)]">Loading Hubbler profile...</p>
          </div>
        ) : error ? (
          <div className="flex h-72 flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="text-4xl">⚠️</span>
            <p className="text-base font-semibold text-red-500">{error}</p>
            <button
              onClick={onClose}
              className="btn-secondary mt-2 px-4 py-2 text-xs"
            >
              Close
            </button>
          </div>
        ) : profile ? (
          <div>
            {/* Profile Banner */}
            <div className="relative h-32 w-full overflow-hidden bg-gradient-to-r from-[var(--hx-green)] to-[var(--hx-green-hover)] sm:h-36">
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute bottom-3 right-4 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                Verified Hubbler Profile
              </div>
            </div>

            {/* Profile Main Info */}
            <div className="relative px-6 pb-6 pt-0">
              <div className="-mt-14 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
                {/* Avatar with Frame */}
                <div className="relative">
                  <div
                    className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 bg-white shadow-xl ${
                      profile.activeFrame === 'GOLDEN_AURA'
                        ? 'border-amber-400 ring-4 ring-amber-400/40'
                        : profile.activeFrame === 'NEON_CYBER'
                        ? 'border-cyan-400 ring-4 ring-cyan-400/40'
                        : profile.activeFrame === 'DIAMOND_ELITE'
                        ? 'border-purple-400 ring-4 ring-purple-400/40'
                        : 'border-white'
                    }`}
                  >
                    {profile.profileImage ? (
                      <img src={profile.profileImage} alt={profile.fullName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-[Manrope] text-3xl font-black text-[var(--hx-green)]">
                        {profile.fullName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Level badge circle */}
                  <div
                    className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[var(--hx-green)] text-xs font-black text-white shadow-md font-[Manrope]"
                    title={`Level ${profile.level}: ${profile.levelTitle}`}
                  >
                    {profile.level}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleToggleFollow}
                    disabled={actionLoading}
                    className={`flex items-center gap-1.5 rounded-btn px-4 py-2 text-xs font-bold transition shadow-sm ${
                      profile.isFollowing
                        ? 'border border-[var(--hx-green-160)] bg-[var(--hx-surface)] text-[var(--hx-text-primary)] hover:bg-gray-100'
                        : 'bg-indigo-600 text-white hover:bg-indigo-500'
                    }`}
                  >
                    {profile.isFollowing ? '✓ Following' : '+ Follow'}
                  </button>

                  {profile.connectionStatus === 'ACCEPTED' ? (
                    <button
                      onClick={handleRemoveConnection}
                      disabled={actionLoading}
                      className="rounded-btn border border-[var(--hx-green)] bg-[var(--hx-green-40)] px-4 py-2 text-xs font-bold text-[var(--hx-green)] hover:bg-red-50 hover:border-red-500 hover:text-red-600 transition"
                      title="Click to disconnect"
                    >
                      🤝 Connected
                    </button>
                  ) : profile.connectionStatus === 'PENDING' ? (
                    <button
                      onClick={handleCancelRequest}
                      disabled={actionLoading}
                      className="rounded-btn border border-amber-500/50 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-100 transition"
                    >
                      ⏳ Request Pending (Cancel)
                    </button>
                  ) : (
                    <button
                      onClick={handleSendRequest}
                      disabled={actionLoading}
                      className="btn-primary shadow-md"
                    >
                      🤝 Connect
                    </button>
                  )}
                </div>
              </div>

              {/* Names, Title, HubblerID */}
              <div className="mt-4 space-y-1.5 font-[Manrope]">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black text-[var(--hx-text-primary)]">{profile.fullName}</h2>
                  {profile.activeTitle && (
                    <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-0.5 text-[11px] font-bold text-indigo-700">
                      🏷️ {profile.activeTitle}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--hx-text-muted)] font-['DM_Sans']">
                  <button
                    onClick={handleCopyHubblerId}
                    className="group inline-flex items-center gap-1.5 rounded-lg border border-[var(--hx-green-160)] bg-[var(--hx-surface)] px-2.5 py-1 font-mono font-bold text-[var(--hx-green)] transition hover:border-[var(--hx-green)]"
                  >
                    <span>🆔 {profile.hubblerId}</span>
                    <span className="text-[10px] text-[var(--hx-text-muted)] group-hover:text-[var(--hx-green)]">
                      {copied ? '✓ Copied' : '📋 Copy'}
                    </span>
                  </button>

                  <span>•</span>
                  <span>🏛️ {profile.collegeName}</span>
                  {profile.branch && <span>• {profile.branch}</span>}
                  {profile.year && <span>• {profile.year}</span>}
                </div>

                {/* Mutual connections pill */}
                {profile.mutualCount > 0 && (
                  <div className="pt-1 flex items-center gap-2 text-xs text-[var(--hx-text-muted)]">
                    <span className="text-[var(--hx-green)] font-semibold">👥 {profile.mutualCount} mutual connection{profile.mutualCount > 1 ? 's' : ''}:</span>
                    <span className="truncate max-w-[280px]">
                      {profile.mutualConnections.map((m) => m.fullName).join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Navigation Sub-Tabs */}
              <div className="mt-6 flex items-center overflow-x-auto scrollbar-none no-scrollbar border-b border-[var(--hx-green-160)] text-xs font-bold font-[Manrope]">
                <button
                  onClick={() => setActiveSubTab('overview')}
                  className={`shrink-0 whitespace-nowrap pb-2.5 px-4 transition border-b-2 ${
                    activeSubTab === 'overview'
                      ? 'border-[var(--hx-green)] text-[var(--hx-green)]'
                      : 'border-transparent text-[var(--hx-text-muted)] hover:text-[var(--hx-text-primary)]'
                  }`}
                >
                  📊 Overview & Level
                </button>
                <button
                  onClick={() => setActiveSubTab('badges')}
                  className={`shrink-0 whitespace-nowrap pb-2.5 px-4 transition border-b-2 ${
                    activeSubTab === 'badges'
                      ? 'border-[var(--hx-green)] text-[var(--hx-green)]'
                      : 'border-transparent text-[var(--hx-text-muted)] hover:text-[var(--hx-text-primary)]'
                  }`}
                >
                  🏆 Badges ({profile.badgeCount})
                </button>
                {profile.certificates && (
                  <button
                    onClick={() => setActiveSubTab('certificates')}
                    className={`shrink-0 whitespace-nowrap pb-2.5 px-4 transition border-b-2 ${
                      activeSubTab === 'certificates'
                        ? 'border-[var(--hx-green)] text-[var(--hx-green)]'
                        : 'border-transparent text-[var(--hx-text-muted)] hover:text-[var(--hx-text-primary)]'
                    }`}
                  >
                    📜 Certificates ({profile.certificates.length})
                  </button>
                )}
                {profile.recentPosts && profile.recentPosts.length > 0 && (
                  <button
                    onClick={() => setActiveSubTab('posts')}
                    className={`shrink-0 whitespace-nowrap pb-2.5 px-4 transition border-b-2 ${
                      activeSubTab === 'posts'
                        ? 'border-[var(--hx-green)] text-[var(--hx-green)]'
                        : 'border-transparent text-[var(--hx-text-muted)] hover:text-[var(--hx-text-primary)]'
                    }`}
                  >
                    📢 Achievements ({profile.recentPosts.length})
                  </button>
                )}
              </div>

              {/* Tab Contents */}
              <div className="pt-4">
                {activeSubTab === 'overview' && (
                  <div className="space-y-4">
                    {/* Level Card */}
                    <div className="rounded-2xl border border-[var(--hx-green-160)] bg-[var(--hx-surface)] p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{profile.levelIcon}</span>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[var(--hx-green)] font-[Manrope]">Current Rank</p>
                            <h4 className="text-base font-black text-[var(--hx-text-primary)] font-[Manrope]">Level {profile.level}: {profile.levelTitle}</h4>
                          </div>
                        </div>
                        {profile.xp !== undefined && (
                          <div className="text-right font-[Manrope]">
                            <span className="text-xl font-black text-[var(--hx-green)]">{profile.xp}</span>
                            <span className="text-xs text-[var(--hx-text-muted)] font-bold ml-1">XP</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-[var(--hx-green-160)] bg-[var(--hx-surface)] p-3 text-center shadow-sm">
                        <p className="text-[11px] font-bold uppercase text-[var(--hx-text-muted)]">Earned Badges</p>
                        <p className="mt-1 text-lg font-black text-amber-500">{profile.badgeCount}</p>
                      </div>
                      <div className="rounded-2xl border border-[var(--hx-green-160)] bg-[var(--hx-surface)] p-3 text-center shadow-sm">
                        <p className="text-[11px] font-bold uppercase text-[var(--hx-text-muted)]">Certificates</p>
                        <p className="mt-1 text-lg font-black text-cyan-600">
                          {profile.certificates ? profile.certificates.length : '🔒 Private'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[var(--hx-green-160)] bg-[var(--hx-surface)] p-3 text-center col-span-2 sm:col-span-1 shadow-sm">
                        <p className="text-[11px] font-bold uppercase text-[var(--hx-text-muted)]">Events Attended</p>
                        <p className="mt-1 text-lg font-black text-indigo-500">
                          {profile.eventCount !== undefined ? profile.eventCount : '🔒 Private'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeSubTab === 'badges' && (
                  <div>
                    {profile.badges.length === 0 ? (
                      <p className="text-center text-xs text-[var(--hx-text-muted)] py-8">No badges earned yet.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {profile.badges.map((b) => (
                          <div
                            key={b.id}
                            className="flex flex-col items-center rounded-2xl border border-[var(--hx-green-160)] bg-[var(--hx-surface)] p-3 text-center transition hover:border-[var(--hx-green)] shadow-sm"
                          >
                            <span className="text-2xl">{b.icon}</span>
                            <p className="mt-1.5 text-xs font-bold text-[var(--hx-text-primary)] font-[Manrope]">{b.name}</p>
                            <p className="mt-0.5 text-[10px] text-[var(--hx-text-muted)] line-clamp-2">{b.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeSubTab === 'certificates' && profile.certificates && (
                  <div className="space-y-2">
                    {profile.certificates.length === 0 ? (
                      <p className="text-center text-xs text-[var(--hx-text-muted)] py-8">No verified certificates issued yet.</p>
                    ) : (
                      profile.certificates.map((cert) => (
                        <div
                          key={cert.id}
                          className="flex items-center justify-between rounded-2xl border border-[var(--hx-green-160)] bg-[var(--hx-surface)] p-3 shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📜</span>
                            <div>
                              <p className="text-xs font-bold text-[var(--hx-text-primary)] font-[Manrope]">{cert.eventTitle}</p>
                              <p className="text-[10px] font-mono text-[var(--hx-green)]">{cert.verificationCode}</p>
                            </div>
                          </div>
                          <span className="rounded-btn bg-[var(--hx-green-40)] px-2.5 py-1 text-[10px] font-bold text-[var(--hx-green)]">
                            {cert.issuedAt ? cert.issuedAt.split('T')[0] : 'Verified'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeSubTab === 'posts' && profile.recentPosts && (
                  <div className="space-y-3">
                    {profile.recentPosts.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-2xl border border-[var(--hx-green-160)] bg-[var(--hx-surface)] p-4 shadow-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{p.achievementIcon}</span>
                          <div>
                            <h5 className="text-xs font-bold text-[var(--hx-text-primary)] font-[Manrope]">{p.achievementTitle}</h5>
                            <p className="text-[11px] text-[var(--hx-text-muted)]">{p.achievementDescription}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

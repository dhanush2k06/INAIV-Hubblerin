import { useEffect, useState } from 'react'
import {
  fetchMyConnections,
  searchUsers,
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  cancelConnectionRequest,
  removeConnection,
  toggleFollowUser,
  fetchPrivacySettings,
  updatePrivacySettings,
  type SearchUserResult,
} from '../../services/connectionsApi'
import type { MyConnectionsData, UserPrivacySettings } from '../../types'
import { PublicProfileModal } from './PublicProfileModal'

interface ConnectionsHubProps {
  currentHubblerId?: string
  currentPrivacy?: UserPrivacySettings
}

export function ConnectionsHub({ currentHubblerId }: ConnectionsHubProps) {
  const [data, setData] = useState<MyConnectionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'network' | 'privacy'>('friends')
  const [pendingSubTab, setPendingSubTab] = useState<'incoming' | 'outgoing'>('incoming')
  const [networkSubTab, setNetworkSubTab] = useState<'following' | 'followers'>('following')

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUserResult[]>([])
  const [searching, setSearching] = useState(false)

  // Profile modal state
  const [selectedHubblerId, setSelectedHubblerId] = useState<string | null>(null)

  // Privacy state
  const [privacy, setPrivacy] = useState<UserPrivacySettings>({
    profileVisibility: 'PUBLIC',
    showXp: true,
    showCertificates: true,
    showEventHistory: true,
    allowConnectionRequests: true,
    autoPostAchievements: true,
  })
  const [savingPrivacy, setSavingPrivacy] = useState(false)
  const [privacyMessage, setPrivacyMessage] = useState('')

  // Copy handle feedback
  const [copiedId, setCopiedId] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const loadConnections = () => {
    setLoading(true)
    fetchMyConnections()
      .then((res) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }

  const loadPrivacy = () => {
    fetchPrivacySettings()
      .then(setPrivacy)
      .catch(() => {})
  }

  useEffect(() => {
    loadConnections()
    loadPrivacy()
  }, [])

  // Handle live search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(() => {
      setSearching(true)
      searchUsers(searchQuery)
        .then(setSearchResults)
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false))
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleCopyHubblerId = () => {
    if (!currentHubblerId) return
    navigator.clipboard.writeText(currentHubblerId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const handleShareProfile = () => {
    if (!currentHubblerId) return
    const url = `${window.location.origin}/profile/${currentHubblerId}`
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleAccept = async (connectionId: string) => {
    try {
      await acceptConnectionRequest(connectionId)
      loadConnections()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to accept')
    }
  }

  const handleReject = async (connectionId: string) => {
    try {
      await rejectConnectionRequest(connectionId)
      loadConnections()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject')
    }
  }

  const handleCancel = async (targetHubblerId: string) => {
    try {
      await cancelConnectionRequest(targetHubblerId)
      loadConnections()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel')
    }
  }

  const handleRemove = async (targetHubblerId: string, name: string) => {
    if (!confirm(`Remove ${name} from your connections?`)) return
    try {
      await removeConnection(targetHubblerId)
      loadConnections()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove')
    }
  }

  const handleSavePrivacy = async () => {
    setSavingPrivacy(true)
    setPrivacyMessage('')
    try {
      const res = await updatePrivacySettings(privacy)
      setPrivacy(res.privacy)
      setPrivacyMessage('✓ Privacy settings updated successfully!')
      setTimeout(() => setPrivacyMessage(''), 3000)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update privacy')
    } finally {
      setSavingPrivacy(false)
    }
  }

  const handleSendSearchConnect = async (hubblerId: string) => {
    try {
      await sendConnectionRequest(hubblerId)
      // refresh search
      const updated = await searchUsers(searchQuery)
      setSearchResults(updated)
      loadConnections()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed')
    }
  }

  const handleToggleSearchFollow = async (hubblerId: string) => {
    try {
      await toggleFollowUser(hubblerId)
      const updated = await searchUsers(searchQuery)
      setSearchResults(updated)
      loadConnections()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: My HubblerID & Share Profile */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40 p-6 shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 text-xs font-bold text-emerald-400">
                ⭐ Verified Student Passport
              </span>
              <span className="text-xs text-slate-400">Permanent Public Handle</span>
            </div>
            <h2 className="text-2xl font-black text-white">Hubbler Network & Connections</h2>
            <p className="max-w-xl text-xs text-slate-300">
              Connect with fellow students across colleges, build your campus network, view verified achievements, and collaborate on events.
            </p>
          </div>

          {/* HubblerID Action Card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-3 shadow-md backdrop-blur-md">
            <div className="px-3 py-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">My HubblerID</p>
              <p className="font-mono text-base font-black text-emerald-400">{currentHubblerId || 'HX-000000'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyHubblerId}
                className="flex-1 sm:flex-initial rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-700 hover:text-white"
              >
                {copiedId ? '✓ Copied ID' : '📋 Copy ID'}
              </button>
              <button
                onClick={handleShareProfile}
                className="flex-1 sm:flex-initial rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 shadow-md"
              >
                {copiedLink ? '✓ Link Copied' : '🔗 Share Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Strip */}
        {data && (
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-4 sm:grid-cols-4">
            <div className="rounded-xl bg-slate-950/60 p-3 text-center border border-slate-800/50">
              <p className="text-[10px] font-bold uppercase text-slate-400">Friends (Connected)</p>
              <p className="text-lg font-black text-emerald-400">{data.counts.friends}</p>
            </div>
            <div className="rounded-xl bg-slate-950/60 p-3 text-center border border-slate-800/50">
              <p className="text-[10px] font-bold uppercase text-slate-400">Pending Requests</p>
              <p className="text-lg font-black text-amber-400">{data.counts.pendingIncoming}</p>
            </div>
            <div className="rounded-xl bg-slate-950/60 p-3 text-center border border-slate-800/50">
              <p className="text-[10px] font-bold uppercase text-slate-400">Followers</p>
              <p className="text-lg font-black text-indigo-400">{data.counts.followers}</p>
            </div>
            <div className="rounded-xl bg-slate-950/60 p-3 text-center border border-slate-800/50">
              <p className="text-[10px] font-bold uppercase text-slate-400">Following</p>
              <p className="text-lg font-black text-cyan-400">{data.counts.following}</p>
            </div>
          </div>
        )}
      </div>

      {/* Live Search & Discover Hubblers Bar */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 sm:p-6 shadow-md">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">🔍 Discover & Search Hubblers</h3>
            <span className="text-xs text-slate-500">Search by HubblerID (e.g. HX-849201), Name or College</span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students by HubblerID handle, student name, or institution..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            {searching && (
              <div className="absolute right-4 top-3.5 h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            )}
          </div>

          {/* Search Results Preview */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-3">
              <p className="text-xs font-bold text-slate-400 px-2">Search Results ({searchResults.length})</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {searchResults.map((user) => (
                  <div
                    key={user.hubblerId}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-3 transition hover:border-slate-700"
                  >
                    <div
                      onClick={() => setSelectedHubblerId(user.hubblerId)}
                      className="flex cursor-pointer items-center gap-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-sm font-black text-emerald-400">
                        {user.profileImage ? (
                          <img src={user.profileImage} alt={user.fullName} className="h-full w-full rounded-xl object-cover" />
                        ) : (
                          user.fullName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-bold text-white hover:text-emerald-400">{user.fullName}</p>
                          <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[9px] font-bold text-amber-400">
                            Lvl {user.level}
                          </span>
                        </div>
                        <p className="truncate text-[10px] text-slate-400">{user.collegeName}</p>
                        <p className="font-mono text-[9px] text-emerald-400/80">🆔 {user.hubblerId}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleSearchFollow(user.hubblerId)}
                        className={`rounded-lg px-2 py-1 text-[10px] font-bold transition ${
                          user.isFollowing
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50'
                        }`}
                      >
                        {user.isFollowing ? 'Following' : '+ Follow'}
                      </button>

                      {user.connectionStatus === 'ACCEPTED' ? (
                        <span className="rounded-lg bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400">
                          ✓ Friend
                        </span>
                      ) : user.connectionStatus === 'PENDING' ? (
                        <span className="rounded-lg bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-400">
                          Pending
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendSearchConnect(user.hubblerId)}
                          className="rounded-lg bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-slate-950 transition hover:bg-emerald-400"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchQuery && !searching && searchResults.length === 0 && (
            <p className="text-center text-xs text-slate-500 py-3">No Hubbler found matching "{searchQuery}". Try exact HubblerID.</p>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap border-b border-slate-800">
        <button
          onClick={() => setActiveTab('friends')}
          className={`shrink-0 whitespace-nowrap flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
            activeTab === 'friends'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <span>🤝 My Friends</span>
          {data && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
              activeTab === 'friends' ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-300'
            }`}>
              {data.counts.friends}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`shrink-0 whitespace-nowrap flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
            activeTab === 'pending'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <span>📬 Pending Requests</span>
          {data && data.counts.pendingIncoming > 0 && (
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-950 animate-pulse">
              {data.counts.pendingIncoming} new
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('network')}
          className={`shrink-0 whitespace-nowrap flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
            activeTab === 'network'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <span>👥 Followers & Following</span>
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`shrink-0 whitespace-nowrap flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
            activeTab === 'privacy'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <span>🔒 Privacy Settings</span>
        </button>
      </div>

      {/* Tab 1: My Friends */}
      {activeTab === 'friends' && (
        <div>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          ) : !data || data.friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 p-12 text-center">
              <span className="text-4xl">🤝</span>
              <h4 className="mt-3 text-base font-bold text-white">No Friends Connected Yet</h4>
              <p className="mt-1 max-w-sm text-xs text-slate-400">
                Use the search bar above to find students by HubblerID or name and send connection requests!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.friends.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-950/80 p-5 transition hover:border-slate-700 hover:shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div
                        onClick={() => setSelectedHubblerId(item.user.hubblerId)}
                        className="flex cursor-pointer items-center gap-3"
                      >
                        <div className="relative">
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-800 text-base font-black text-emerald-400">
                            {item.user.profileImage ? (
                              <img src={item.user.profileImage} alt={item.user.fullName} className="h-full w-full object-cover" />
                            ) : (
                              item.user.fullName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 px-1 text-[8px] font-black text-slate-950">
                            L{item.user.level}
                          </span>
                        </div>

                        <div>
                          <p className="font-bold text-white hover:text-emerald-400 text-sm">{item.user.fullName}</p>
                          <p className="font-mono text-[10px] text-emerald-400">🆔 {item.user.hubblerId}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemove(item.user.hubblerId, item.user.fullName)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-900 hover:text-rose-400 text-xs"
                        title="Remove friend"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="mt-3 text-xs text-slate-400 truncate">🏛️ {item.user.collegeName}</p>

                    {item.user.activeTitle && (
                      <span className="mt-2 inline-block rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300">
                        🏷️ {item.user.activeTitle}
                      </span>
                    )}

                    {item.mutualCount && item.mutualCount > 0 ? (
                      <p className="mt-2 text-[10px] font-semibold text-emerald-400">
                        👥 {item.mutualCount} mutual connection{item.mutualCount > 1 ? 's' : ''}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedHubblerId(item.user.hubblerId)}
                      className="w-full rounded-xl bg-slate-900 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-800 hover:text-white"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Pending Requests */}
      {activeTab === 'pending' && data && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar border-b border-slate-800 text-xs font-bold">
            <button
              onClick={() => setPendingSubTab('incoming')}
              className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2 transition ${
                pendingSubTab === 'incoming'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📥 Incoming Requests ({data.pendingIncoming.length})
            </button>
            <button
              onClick={() => setPendingSubTab('outgoing')}
              className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2 transition ${
                pendingSubTab === 'outgoing'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📤 Outgoing Requests Sent ({data.pendingOutgoing.length})
            </button>
          </div>

          {pendingSubTab === 'incoming' ? (
            <div>
              {data.pendingIncoming.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center text-xs text-slate-500">
                  No incoming connection requests.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {data.pendingIncoming.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4"
                    >
                      <div
                        onClick={() => setSelectedHubblerId(item.user.hubblerId)}
                        className="flex cursor-pointer items-center gap-3"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 font-bold text-emerald-400">
                          {item.user.profileImage ? (
                            <img src={item.user.profileImage} alt={item.user.fullName} className="h-full w-full rounded-xl object-cover" />
                          ) : (
                            item.user.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white hover:text-emerald-400">{item.user.fullName}</p>
                          <p className="text-[10px] text-slate-400">{item.user.collegeName}</p>
                          <p className="font-mono text-[9px] text-emerald-400">🆔 {item.user.hubblerId}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAccept(item.id)}
                          className="flex-1 sm:flex-initial rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-sm text-center"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(item.id)}
                          className="flex-1 sm:flex-initial rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 text-center"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {data.pendingOutgoing.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center text-xs text-slate-500">
                  No outgoing pending requests.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {data.pendingOutgoing.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4"
                    >
                      <div
                        onClick={() => setSelectedHubblerId(item.user.hubblerId)}
                        className="flex cursor-pointer items-center gap-3"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 font-bold text-emerald-400">
                          {item.user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white hover:text-emerald-400">{item.user.fullName}</p>
                          <p className="text-[10px] text-slate-400">{item.user.collegeName}</p>
                          <p className="font-mono text-[9px] text-emerald-400">🆔 {item.user.hubblerId}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCancel(item.user.hubblerId)}
                        className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-rose-400"
                      >
                        Cancel Request
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Followers & Following */}
      {activeTab === 'network' && data && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar border-b border-slate-800 text-xs font-bold">
            <button
              onClick={() => setNetworkSubTab('following')}
              className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2 transition ${
                networkSubTab === 'following'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Following ({data.following.length})
            </button>
            <button
              onClick={() => setNetworkSubTab('followers')}
              className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2 transition ${
                networkSubTab === 'followers'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Followers ({data.followers.length})
            </button>
          </div>

          {networkSubTab === 'following' ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.following.length === 0 ? (
                <p className="text-xs text-slate-500 col-span-full py-8 text-center">You are not following any students yet.</p>
              ) : (
                data.following.map((user) => (
                  <div
                    key={user.hubblerId}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-4"
                  >
                    <div
                      onClick={() => setSelectedHubblerId(user.hubblerId)}
                      className="flex cursor-pointer items-center gap-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 font-bold text-emerald-400">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white hover:text-emerald-400">{user.fullName}</p>
                        <p className="font-mono text-[9px] text-emerald-400">🆔 {user.hubblerId}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFollowUser(user.hubblerId).then(loadConnections)}
                      className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300 hover:bg-slate-700"
                    >
                      Unfollow
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.followers.length === 0 ? (
                <p className="text-xs text-slate-500 col-span-full py-8 text-center">No followers yet. Share your profile to get discovered!</p>
              ) : (
                data.followers.map((user) => (
                  <div
                    key={user.hubblerId}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-4"
                  >
                    <div
                      onClick={() => setSelectedHubblerId(user.hubblerId)}
                      className="flex cursor-pointer items-center gap-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 font-bold text-emerald-400">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white hover:text-emerald-400">{user.fullName}</p>
                        <p className="font-mono text-[9px] text-emerald-400">🆔 {user.hubblerId}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedHubblerId(user.hubblerId)}
                      className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-bold text-slate-300 hover:bg-slate-800"
                    >
                      Profile
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Privacy Settings */}
      {activeTab === 'privacy' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-md max-w-2xl space-y-6">
          <div>
            <h3 className="text-lg font-black text-white">🔒 Profile & Connection Privacy Settings</h3>
            <p className="text-xs text-slate-400">
              Customize who can view your profile, XP, achievements, verified certificates, and send you connection requests.
            </p>
          </div>

          {/* Profile Visibility */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Profile Visibility</label>
            <select
              value={privacy.profileVisibility}
              onChange={(e) =>
                setPrivacy({ ...privacy, profileVisibility: e.target.value as 'PUBLIC' | 'FRIENDS_ONLY' | 'PRIVATE' })
              }
              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="PUBLIC">🌍 Public — Anyone can view your profile, badges & level</option>
              <option value="FRIENDS_ONLY">🤝 Friends Only — Only connected peers can view full details</option>
              <option value="PRIVATE">🔒 Private — Only minimal handle is visible</option>
            </select>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-4 border-t border-slate-800/80 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Display XP & Progress</p>
                <p className="text-[11px] text-slate-400">Allow viewers to see your total XP score and level progress</p>
              </div>
              <input
                type="checkbox"
                checked={privacy.showXp}
                onChange={(e) => setPrivacy({ ...privacy, showXp: e.target.checked })}
                className="h-5 w-5 accent-emerald-500 cursor-pointer rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Display Verified Certificates</p>
                <p className="text-[11px] text-slate-400">Show official event credentials on your public profile</p>
              </div>
              <input
                type="checkbox"
                checked={privacy.showCertificates}
                onChange={(e) => setPrivacy({ ...privacy, showCertificates: e.target.checked })}
                className="h-5 w-5 accent-emerald-500 cursor-pointer rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Display Event Participation History</p>
                <p className="text-[11px] text-slate-400">Show count of campus events attended</p>
              </div>
              <input
                type="checkbox"
                checked={privacy.showEventHistory}
                onChange={(e) => setPrivacy({ ...privacy, showEventHistory: e.target.checked })}
                className="h-5 w-5 accent-emerald-500 cursor-pointer rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Allow Connection Requests</p>
                <p className="text-[11px] text-slate-400">Let other Hubblers discover you and send friend requests</p>
              </div>
              <input
                type="checkbox"
                checked={privacy.allowConnectionRequests}
                onChange={(e) => setPrivacy({ ...privacy, allowConnectionRequests: e.target.checked })}
                className="h-5 w-5 accent-emerald-500 cursor-pointer rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Auto-Post Verified Achievements</p>
                <p className="text-[11px] text-slate-400">Automatically publish verified milestone badges and certificates to Social Feed</p>
              </div>
              <input
                type="checkbox"
                checked={privacy.autoPostAchievements}
                onChange={(e) => setPrivacy({ ...privacy, autoPostAchievements: e.target.checked })}
                className="h-5 w-5 accent-emerald-500 cursor-pointer rounded"
              />
            </div>
          </div>

          {privacyMessage && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-center text-xs font-bold text-emerald-400">
              {privacyMessage}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleSavePrivacy}
              disabled={savingPrivacy}
              className="w-full rounded-2xl bg-emerald-500 py-3 text-xs font-black text-slate-950 transition hover:bg-emerald-400 shadow-md"
            >
              {savingPrivacy ? 'Saving Preferences...' : 'Save Privacy Preferences'}
            </button>
          </div>
        </div>
      )}

      {/* Public Profile Modal */}
      <PublicProfileModal
        hubblerId={selectedHubblerId}
        onClose={() => setSelectedHubblerId(null)}
        onConnectionChange={loadConnections}
      />
    </div>
  )
}

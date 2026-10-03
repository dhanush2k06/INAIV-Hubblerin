import { useCallback, useEffect, useState } from 'react'
import {
  fetchSocialFeed,
  toggleLikePost,
  fetchPostComments,
  addPostComment,
} from '../../services/postsApi'
import type { AchievementPost, PostComment } from '../../types'
import { PublicProfileModal } from '../connections/PublicProfileModal'

interface CommunityFeedProps {
  currentHubblerId?: string
}

export function CommunityFeed({ currentHubblerId: _currentHubblerId }: CommunityFeedProps) {
  const [posts, setPosts] = useState<AchievementPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'FRIENDS' | 'MY'>('ALL')
  const [selectedHubblerId, setSelectedHubblerId] = useState<string | null>(null)

  // Comments drawer states
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null)
  const [commentsMap, setCommentsMap] = useState<Record<string, PostComment[]>>({})
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  // Share feedback
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null)

  const loadFeed = useCallback((selectedFilter = filter) => {
    setLoading(true)
    fetchSocialFeed(selectedFilter)
      .then((res) => setPosts(res.posts))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => {
    loadFeed(filter)
  }, [loadFeed, filter])

  const handleLike = async (postId: string) => {
    try {
      const res = await toggleLikePost(postId)
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLiked: res.isLiked, likesCount: res.likesCount }
            : p,
        ),
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed')
    }
  }

  const handleToggleComments = async (postId: string) => {
    if (openCommentsPostId === postId) {
      setOpenCommentsPostId(null)
      return
    }

    setOpenCommentsPostId(postId)
    setLoadingComments(true)
    try {
      const comments = await fetchPostComments(postId)
      setCommentsMap((prev) => ({ ...prev, [postId]: comments }))
    } catch (err) {
      console.error('Failed to load comments:', err)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleAddComment = async (postId: string) => {
    if (!commentInput.trim()) return
    setSubmittingComment(true)
    try {
      const newComment = await addPostComment(postId, commentInput.trim())
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }))
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p,
        ),
      )
      setCommentInput('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleShare = (post: AchievementPost) => {
    const shareUrl = `${window.location.origin}/profile/${post.authorHubblerId}`
    navigator.clipboard.writeText(shareUrl)
    setCopiedPostId(post.id)
    setTimeout(() => setCopiedPostId(null), 2000)
  }

  const getTypeStyles = (type: AchievementPost['type']) => {
    switch (type) {
      case 'LEVEL_UP':
        return {
          gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
          border: 'border-amber-500/30',
          badge: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
          tag: '⚡ Level Up',
        }
      case 'CERTIFICATE_ISSUED':
        return {
          gradient: 'from-cyan-500/10 via-blue-500/5 to-transparent',
          border: 'border-cyan-500/30',
          badge: 'bg-cyan-500/15 text-cyan-800 border-cyan-500/30',
          tag: '📜 Verified Certificate',
        }
      case 'RANKING_TOP3':
        return {
          gradient: 'from-yellow-500/15 via-amber-500/5 to-transparent',
          border: 'border-yellow-500/40',
          badge: 'bg-yellow-500/20 text-yellow-900 border-yellow-500/40',
          tag: '🥇 Monthly Podium',
        }
      case 'COMPETITION_WIN':
        return {
          gradient: 'from-rose-500/10 via-pink-500/5 to-transparent',
          border: 'border-rose-500/30',
          badge: 'bg-rose-500/15 text-rose-800 border-rose-500/30',
          tag: '🏆 Competition Win',
        }
      case 'VOLUNTEER_HERO':
        return {
          gradient: 'from-purple-500/10 via-indigo-500/5 to-transparent',
          border: 'border-purple-500/30',
          badge: 'bg-purple-500/15 text-purple-800 border-purple-500/30',
          tag: '🌟 Volunteer Service',
        }
      default:
        return {
          gradient: 'from-[rgba(7,87,63,0.1)] via-[rgba(7,87,63,0.03)] to-transparent',
          border: 'border-[#07573F]/25',
          badge: 'bg-[rgba(7,87,63,0.1)] text-[#07573F] border-[rgba(7,87,63,0.2)]',
          tag: '🎖️ Achievement Badge',
        }
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-card border border-[#07573F]/30 bg-gradient-to-br from-[#043324] via-[#07573F] to-[#022016] p-6 shadow-xl text-white">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/15 border border-white/20 px-3 py-0.5 text-xs font-bold text-emerald-200 backdrop-blur-sm">
              ⚡ Campus Live Feed
            </span>
            <span className="text-xs text-white/70">Automated & Verified</span>
          </div>
          <h2 className="mt-1 text-2xl font-black text-white">Community Achievement Stream</h2>
          <p className="text-xs text-white/80 mt-0.5">
            Celebrate verified badges, certificates, level promotions, and competition wins from your peers.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-white/15 bg-white/10 p-1.5 backdrop-blur-md w-full sm:w-auto justify-between">
          <button
            onClick={() => setFilter('ALL')}
            className={`flex-1 sm:flex-initial rounded-xl px-3.5 py-1.5 text-xs font-bold transition text-center ${
              filter === 'ALL'
                ? 'bg-white text-[#07573F] shadow-sm'
                : 'text-white/80 hover:text-white'
            }`}
          >
            🌍 Explore
          </button>
          <button
            onClick={() => setFilter('FRIENDS')}
            className={`flex-1 sm:flex-initial rounded-xl px-3.5 py-1.5 text-xs font-bold transition text-center ${
              filter === 'FRIENDS'
                ? 'bg-white text-[#07573F] shadow-sm'
                : 'text-white/80 hover:text-white'
            }`}
          >
            🤝 Network
          </button>
          <button
            onClick={() => setFilter('MY')}
            className={`flex-1 sm:flex-initial rounded-xl px-3.5 py-1.5 text-xs font-bold transition text-center ${
              filter === 'MY'
                ? 'bg-white text-[#07573F] shadow-sm'
                : 'text-white/80 hover:text-white'
            }`}
          >
            ⭐ Mine
          </button>
        </div>
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#07573F] border-t-transparent" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-[rgba(7,87,63,0.2)] bg-[var(--hx-surface)] p-12 text-center">
          <span className="text-4xl">🏆</span>
          <h4 className="mt-3 text-base font-bold text-[#111a16]">No Achievements to Display</h4>
          <p className="mt-1 max-w-sm text-xs text-[rgba(7,87,63,0.7)]">
            {filter === 'FRIENDS'
              ? 'Connect with more students to see their verified achievements on your feed!'
              : 'Participate in campus events, earn badges, and rank up to share your milestones!'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => {
            const styles = getTypeStyles(post.type)
            const comments = commentsMap[post.id] || []
            const isCommentsOpen = openCommentsPostId === post.id

            return (
              <div
                key={post.id}
                className={`relative overflow-hidden rounded-card border ${styles.border} bg-white p-6 shadow-sm transition hover:shadow-md hover:border-[#07573F]/40`}
              >
                {/* Top Author Strip */}
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => setSelectedHubblerId(post.authorHubblerId)}
                    className="flex cursor-pointer items-center gap-3"
                  >
                    {/* Author Avatar with cosmetic frame */}
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 bg-[rgba(7,87,63,0.08)] text-sm font-black text-[#07573F] shadow-xs ${
                        post.authorFrame === 'GOLDEN_AURA'
                          ? 'border-amber-400 ring-2 ring-amber-400/40'
                          : post.authorFrame === 'NEON_CYBER'
                          ? 'border-cyan-400 ring-2 ring-cyan-400/40'
                          : post.authorFrame === 'DIAMOND_ELITE'
                          ? 'border-purple-400 ring-2 ring-purple-400/40'
                          : 'border-[rgba(7,87,63,0.15)]'
                      }`}
                    >
                      {post.authorImage ? (
                        <img src={post.authorImage} alt={post.authorName} className="h-full w-full object-cover" />
                      ) : (
                        post.authorName.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#111a16] hover:text-[#07573F]">{post.authorName}</span>
                        {post.authorTitle && (
                          <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.2 text-[9px] font-bold text-indigo-700">
                            {post.authorTitle}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[rgba(7,87,63,0.7)]">
                        <span className="font-mono text-[#07573F] font-bold">🆔 {post.authorHubblerId}</span>
                        <span>•</span>
                        <span>{post.authorCollege}</span>
                      </div>
                    </div>
                  </div>

                  {/* Type Tag & Timestamp */}
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${styles.badge}`}>
                      {styles.tag}
                    </span>
                    <span className="text-[10px] text-[rgba(7,87,63,0.6)]">
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                </div>

                {/* Achievement Highlight Body */}
                <div className="mt-5 flex items-start gap-4 rounded-2xl border border-[rgba(7,87,63,0.12)] bg-[var(--hx-surface)] p-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white border border-[rgba(7,87,63,0.14)] text-3xl shadow-xs">
                    {post.achievementIcon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#111a16]">{post.achievementTitle}</h4>
                      {post.xpEarned && post.xpEarned > 0 ? (
                        <span className="rounded-full bg-[rgba(7,87,63,0.1)] border border-[rgba(7,87,63,0.2)] px-2.5 py-0.5 text-[11px] font-black text-[#07573F]">
                          +{post.xpEarned} XP
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-[rgba(7,87,63,0.8)]">{post.achievementDescription}</p>
                  </div>
                </div>

                {/* Social Actions Bar */}
                <div className="mt-5 flex items-center justify-between border-t border-[rgba(7,87,63,0.1)] pt-3">
                  <div className="flex items-center gap-3">
                    {/* Cheer / Like Button */}
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-xs ${
                        post.isLiked
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'border border-[rgba(7,87,63,0.14)] bg-[var(--hx-surface)] text-[#111a16] hover:bg-amber-50'
                      }`}
                    >
                      <span>👏</span>
                      <span>{post.isLiked ? 'Cheered' : 'Cheer'}</span>
                      {post.likesCount > 0 && <span className="ml-0.5">({post.likesCount})</span>}
                    </button>

                    {/* Comments Button */}
                    <button
                      onClick={() => handleToggleComments(post.id)}
                      className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition ${
                        isCommentsOpen
                          ? 'bg-[#07573F] text-white border-[#07573F]'
                          : 'border-[rgba(7,87,63,0.14)] bg-[var(--hx-surface)] text-[#111a16] hover:bg-[rgba(7,87,63,0.08)]'
                      }`}
                    >
                      <span>💬</span>
                      <span>Comments</span>
                      {post.commentsCount > 0 && <span>({post.commentsCount})</span>}
                    </button>
                  </div>

                  {/* Share Profile Button */}
                  <button
                    onClick={() => handleShare(post)}
                    className="flex items-center gap-1 text-xs font-bold text-[rgba(7,87,63,0.7)] transition hover:text-[#07573F]"
                  >
                    <span>🔗</span>
                    <span>{copiedPostId === post.id ? '✓ Copied' : 'Share'}</span>
                  </button>
                </div>

                {/* Collapsible Comments Section */}
                {isCommentsOpen && (
                  <div className="mt-4 border-t border-[rgba(7,87,63,0.1)] pt-4 space-y-3">
                    {/* Add Comment Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        placeholder="Say congrats or share thoughts..."
                        className="flex-1 rounded-xl border border-[rgba(7,87,63,0.18)] bg-[var(--hx-surface)] px-3.5 py-2 text-xs text-[#111a16] placeholder-[rgba(7,87,63,0.45)] focus:border-[#07573F] focus:outline-none"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={submittingComment || !commentInput.trim()}
                        className="rounded-xl bg-[#07573F] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#064e38] disabled:opacity-50"
                      >
                        Post
                      </button>
                    </div>

                    {/* Comments List */}
                    {loadingComments ? (
                      <p className="text-center text-xs text-[rgba(7,87,63,0.6)] py-3">Loading comments...</p>
                    ) : comments.length === 0 ? (
                      <p className="text-center text-xs text-[rgba(7,87,63,0.6)] py-3">No comments yet. Be the first to congratulate!</p>
                    ) : (
                      <div className="space-y-2 pt-1 max-h-48 overflow-y-auto">
                        {comments.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-start justify-between rounded-xl bg-[var(--hx-surface)] p-2.5 border border-[rgba(7,87,63,0.1)]"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span
                                  onClick={() => setSelectedHubblerId(c.authorHubblerId)}
                                  className="cursor-pointer text-xs font-bold text-[#07573F] hover:underline"
                                >
                                  {c.authorName}
                                </span>
                                <span className="font-mono text-[9px] text-[rgba(7,87,63,0.6)]">({c.authorHubblerId})</span>
                              </div>
                              <p className="text-xs text-[#111a16]">{c.text}</p>
                            </div>
                            <span className="text-[9px] text-[rgba(7,87,63,0.6)]">
                              {c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Public Profile Modal */}
      <PublicProfileModal
        hubblerId={selectedHubblerId}
        onClose={() => setSelectedHubblerId(null)}
        onConnectionChange={() => loadFeed(filter)}
      />
    </div>
  )
}

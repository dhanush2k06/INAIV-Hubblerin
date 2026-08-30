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
          gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
          border: 'border-amber-500/30',
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          tag: '⚡ Level Up',
        }
      case 'CERTIFICATE_ISSUED':
        return {
          gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
          border: 'border-cyan-500/30',
          badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          tag: '📜 Verified Certificate',
        }
      case 'RANKING_TOP3':
        return {
          gradient: 'from-yellow-500/20 via-amber-500/10 to-transparent',
          border: 'border-yellow-400/40',
          badge: 'bg-yellow-400/10 text-yellow-300 border-yellow-400/40',
          tag: '🥇 Monthly Podium',
        }
      case 'COMPETITION_WIN':
        return {
          gradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
          border: 'border-rose-500/30',
          badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          tag: '🏆 Competition Win',
        }
      case 'VOLUNTEER_HERO':
        return {
          gradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
          border: 'border-purple-500/30',
          badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          tag: '🌟 Volunteer Service',
        }
      default:
        return {
          gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
          border: 'border-emerald-500/30',
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          tag: '🎖️ Achievement Badge',
        }
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 text-xs font-bold text-emerald-400">
              ⚡ Campus Live Feed
            </span>
            <span className="text-xs text-slate-400">Automated & Verified</span>
          </div>
          <h2 className="mt-1 text-2xl font-black text-white">Community Achievement Stream</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Celebrate verified badges, certificates, level promotions, and competition wins from your peers.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-900 p-1.5 shadow-inner w-full sm:w-auto justify-between">
          <button
            onClick={() => setFilter('ALL')}
            className={`flex-1 sm:flex-initial rounded-xl px-3.5 py-1.5 text-xs font-bold transition text-center ${
              filter === 'ALL'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🌍 Explore
          </button>
          <button
            onClick={() => setFilter('FRIENDS')}
            className={`flex-1 sm:flex-initial rounded-xl px-3.5 py-1.5 text-xs font-bold transition text-center ${
              filter === 'FRIENDS'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🤝 Network
          </button>
          <button
            onClick={() => setFilter('MY')}
            className={`flex-1 sm:flex-initial rounded-xl px-3.5 py-1.5 text-xs font-bold transition text-center ${
              filter === 'MY'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⭐ Mine
          </button>
        </div>
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 p-12 text-center">
          <span className="text-4xl">🏆</span>
          <h4 className="mt-3 text-base font-bold text-white">No Achievements to Display</h4>
          <p className="mt-1 max-w-sm text-xs text-slate-400">
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
                className={`relative overflow-hidden rounded-3xl border ${styles.border} bg-gradient-to-b ${styles.gradient} bg-slate-950 p-6 shadow-xl transition hover:border-slate-700`}
              >
                {/* Top Author Strip */}
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => setSelectedHubblerId(post.authorHubblerId)}
                    className="flex cursor-pointer items-center gap-3"
                  >
                    {/* Author Avatar with cosmetic frame */}
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 bg-slate-800 text-sm font-black text-emerald-400 shadow-md ${
                        post.authorFrame === 'GOLDEN_AURA'
                          ? 'border-amber-400 ring-2 ring-amber-400/40'
                          : post.authorFrame === 'NEON_CYBER'
                          ? 'border-cyan-400 ring-2 ring-cyan-400/40'
                          : post.authorFrame === 'DIAMOND_ELITE'
                          ? 'border-purple-400 ring-2 ring-purple-400/40'
                          : 'border-slate-700'
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
                        <span className="text-xs font-black text-white hover:text-emerald-400">{post.authorName}</span>
                        {post.authorTitle && (
                          <span className="rounded-full bg-indigo-500/20 border border-indigo-500/40 px-2 py-0.2 text-[9px] font-bold text-indigo-300">
                            {post.authorTitle}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="font-mono text-emerald-400">🆔 {post.authorHubblerId}</span>
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
                    <span className="text-[10px] text-slate-500">
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                </div>

                {/* Achievement Highlight Body */}
                <div className="mt-5 flex items-start gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/90 p-4 backdrop-blur-md">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 border border-slate-800 text-3xl shadow-inner">
                    {post.achievementIcon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-white">{post.achievementTitle}</h4>
                      {post.xpEarned && post.xpEarned > 0 ? (
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-black text-emerald-400">
                          +{post.xpEarned} XP
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-300">{post.achievementDescription}</p>
                  </div>
                </div>

                {/* Social Actions Bar */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3">
                  <div className="flex items-center gap-3">
                    {/* Cheer / Like Button */}
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-sm ${
                        post.isLiked
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>👏</span>
                      <span>{post.isLiked ? 'Cheered' : 'Cheer'}</span>
                      {post.likesCount > 0 && <span className="ml-0.5">({post.likesCount})</span>}
                    </button>

                    {/* Comments Button */}
                    <button
                      onClick={() => handleToggleComments(post.id)}
                      className={`flex items-center gap-1.5 rounded-xl border border-slate-800 px-3.5 py-1.5 text-xs font-bold transition ${
                        isCommentsOpen
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
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
                    className="flex items-center gap-1 text-xs font-bold text-slate-400 transition hover:text-emerald-400"
                  >
                    <span>🔗</span>
                    <span>{copiedPostId === post.id ? '✓ Copied' : 'Share'}</span>
                  </button>
                </div>

                {/* Collapsible Comments Section */}
                {isCommentsOpen && (
                  <div className="mt-4 border-t border-slate-800 pt-4 space-y-3">
                    {/* Add Comment Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        placeholder="Say congrats or share thoughts..."
                        className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={submittingComment || !commentInput.trim()}
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                      >
                        Post
                      </button>
                    </div>

                    {/* Comments List */}
                    {loadingComments ? (
                      <p className="text-center text-xs text-slate-500 py-3">Loading comments...</p>
                    ) : comments.length === 0 ? (
                      <p className="text-center text-xs text-slate-500 py-3">No comments yet. Be the first to congratulate!</p>
                    ) : (
                      <div className="space-y-2 pt-1 max-h-48 overflow-y-auto">
                        {comments.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-start justify-between rounded-xl bg-slate-900/60 p-2.5 border border-slate-800/60"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span
                                  onClick={() => setSelectedHubblerId(c.authorHubblerId)}
                                  className="cursor-pointer text-xs font-bold text-emerald-400 hover:underline"
                                >
                                  {c.authorName}
                                </span>
                                <span className="font-mono text-[9px] text-slate-500">({c.authorHubblerId})</span>
                              </div>
                              <p className="text-xs text-slate-200">{c.text}</p>
                            </div>
                            <span className="text-[9px] text-slate-500">
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

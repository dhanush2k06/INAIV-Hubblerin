import { request } from './api'
import type { AchievementPost, PostComment } from '../types'

/**
 * Fetches paginated social achievement posts feed
 */
export async function fetchSocialFeed(
  filter: 'ALL' | 'FRIENDS' | 'MY' = 'ALL',
  page = 1,
  limit = 20,
): Promise<{ posts: AchievementPost[]; total: number; page: number }> {
  return request<{ posts: AchievementPost[]; total: number; page: number }>(
    `/api/posts/feed?filter=${encodeURIComponent(filter)}&page=${page}&limit=${limit}`,
  )
}

/**
 * Toggles like / cheer on a post
 */
export async function toggleLikePost(
  postId: string,
): Promise<{ success: boolean; isLiked: boolean; likesCount: number }> {
  return request<{ success: boolean; isLiked: boolean; likesCount: number }>(
    `/api/posts/${encodeURIComponent(postId)}/like`,
    { method: 'POST' },
  )
}

/**
 * Fetches comments for a post
 */
export async function fetchPostComments(postId: string): Promise<PostComment[]> {
  return request<PostComment[]>(`/api/posts/${encodeURIComponent(postId)}/comments`)
}

/**
 * Adds a comment to a post
 */
export async function addPostComment(
  postId: string,
  text: string,
): Promise<PostComment> {
  return request<PostComment>(`/api/posts/${encodeURIComponent(postId)}/comments`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
}

/**
 * Deletes a post (author or admin)
 */
export async function deletePost(
  postId: string,
): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(
    `/api/posts/${encodeURIComponent(postId)}`,
    { method: 'DELETE' },
  )
}

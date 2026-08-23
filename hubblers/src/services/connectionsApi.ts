import { request } from './api'
import type {
  ConnectionStatus,
  MyConnectionsData,
  PublicUserProfile,
  UserPrivacySettings,
} from '../types'

export interface SearchUserResult {
  hubblerId: string
  fullName: string
  collegeName: string
  profileImage: string | null
  activeTitle: string | null
  activeFrame: string | null
  level: number
  badgeCount: number
  connectionStatus: ConnectionStatus
  isRequester: boolean
  isFollowing: boolean
  mutualCount: number
}

/**
 * Searches users by HubblerID, full name, or college
 */
export async function searchUsers(query: string): Promise<SearchUserResult[]> {
  if (!query.trim()) return []
  return request<SearchUserResult[]>(`/api/connections/search?q=${encodeURIComponent(query.trim())}`)
}

/**
 * Fetches the public profile for a HubblerID
 */
export async function fetchPublicProfile(hubblerId: string): Promise<PublicUserProfile> {
  return request<PublicUserProfile>(`/api/connections/profile/${encodeURIComponent(hubblerId.trim())}`)
}

/**
 * Fetches all connection data for the logged-in student
 */
export async function fetchMyConnections(): Promise<MyConnectionsData> {
  return request<MyConnectionsData>('/api/connections/my')
}

/**
 * Sends a friend connection request
 */
export async function sendConnectionRequest(
  targetHubblerId: string,
): Promise<{ success: boolean; message: string; connectionId: string }> {
  return request<{ success: boolean; message: string; connectionId: string }>(
    `/api/connections/request/${encodeURIComponent(targetHubblerId.trim())}`,
    { method: 'POST' },
  )
}

/**
 * Accepts an incoming connection request
 */
export async function acceptConnectionRequest(
  connectionId: string,
): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(
    `/api/connections/accept/${encodeURIComponent(connectionId)}`,
    { method: 'POST' },
  )
}

/**
 * Rejects an incoming connection request
 */
export async function rejectConnectionRequest(
  connectionId: string,
): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(
    `/api/connections/reject/${encodeURIComponent(connectionId)}`,
    { method: 'POST' },
  )
}

/**
 * Cancels a pending outgoing request
 */
export async function cancelConnectionRequest(
  targetHubblerId: string,
): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(
    `/api/connections/cancel/${encodeURIComponent(targetHubblerId.trim())}`,
    { method: 'POST' },
  )
}

/**
 * Removes a friend connection
 */
export async function removeConnection(
  targetHubblerId: string,
): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(
    `/api/connections/remove/${encodeURIComponent(targetHubblerId.trim())}`,
    { method: 'POST' },
  )
}

/**
 * Toggles follow / unfollow on a user
 */
export async function toggleFollowUser(
  targetHubblerId: string,
): Promise<{ success: boolean; isFollowing: boolean; message: string }> {
  return request<{ success: boolean; isFollowing: boolean; message: string }>(
    `/api/connections/follow/${encodeURIComponent(targetHubblerId.trim())}`,
    { method: 'POST' },
  )
}

/**
 * Fetches user's privacy settings
 */
export async function fetchPrivacySettings(): Promise<UserPrivacySettings> {
  return request<UserPrivacySettings>('/api/connections/privacy')
}

/**
 * Updates user's privacy settings
 */
export async function updatePrivacySettings(
  settings: Partial<UserPrivacySettings>,
): Promise<{ message: string; privacy: UserPrivacySettings }> {
  return request<{ message: string; privacy: UserPrivacySettings }>('/api/connections/privacy', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}

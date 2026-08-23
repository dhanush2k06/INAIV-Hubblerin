import { request } from './api'
import type {
  StudentRewardsSummary,
  RewardItem,
  Redemption,
  Certificate,
  LeaderboardStudent,
  CollegeLeaderboardEntry,
  XpTransaction,
} from '../types'

/**
 * Fetch student full rewards & gamification profile
 */
export async function fetchRewardsSummary(): Promise<StudentRewardsSummary> {
  return request<StudentRewardsSummary>('/api/rewards/me')
}

/**
 * Fetch active rewards from the XP Store
 */
export async function fetchStoreRewards(): Promise<RewardItem[]> {
  return request<RewardItem[]>('/api/rewards/store')
}

/**
 * Redeem a store reward
 */
export async function redeemReward(rewardId: string): Promise<{
  success: boolean
  message: string
  redemption: Redemption
  balanceAfter: number
}> {
  return request<{
    success: boolean
    message: string
    redemption: Redemption
    balanceAfter: number
  }>(`/api/rewards/redeem/${encodeURIComponent(rewardId)}`, {
    method: 'POST',
  })
}

/**
 * Equip/unequip a cosmetic item (theme, frame, title)
 */
export async function equipCosmetic(
  type: 'THEME' | 'FRAME' | 'TITLE',
  value: string | null,
): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>('/api/rewards/equip', {
    method: 'POST',
    body: JSON.stringify({ type, value }),
  })
}

/**
 * Fetch monthly and college leaderboards
 */
export async function fetchLeaderboard(month?: string): Promise<{
  monthKey: string
  leaderboard: LeaderboardStudent[]
  collegeLeaderboard: CollegeLeaderboardEntry[]
}> {
  const query = month ? `?month=${encodeURIComponent(month)}` : ''
  return request<{
    monthKey: string
    leaderboard: LeaderboardStudent[]
    collegeLeaderboard: CollegeLeaderboardEntry[]
  }>(`/api/rewards/leaderboard${query}`)
}

/**
 * Fetch student certificates
 */
export async function fetchCertificates(): Promise<Certificate[]> {
  return request<Certificate[]>('/api/rewards/certificates')
}

/**
 * Claim certificate for an attended event
 */
export async function claimCertificate(eventId: string): Promise<{
  message: string
  certificate: Certificate
  xpEarned: number
}> {
  return request<{
    message: string
    certificate: Certificate
    xpEarned: number
  }>(`/api/rewards/certificates/claim/${encodeURIComponent(eventId)}`, {
    method: 'POST',
  })
}

/**
 * Submit feedback for an event (+5 XP)
 */
export async function submitEventFeedback(payload: {
  eventId: string
  rating: number
  feedbackText: string
}): Promise<{
  success: boolean
  message: string
  xpEarned: number
}> {
  return request<{
    success: boolean
    message: string
    xpEarned: number
  }>('/api/rewards/feedback', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * Apply a referral code (+20 XP to referrer)
 */
export async function applyReferralCode(referralCode: string): Promise<{
  success: boolean
  message: string
  referrerName?: string
}> {
  return request<{
    success: boolean
    message: string
    referrerName?: string
  }>('/api/rewards/referral', {
    method: 'POST',
    body: JSON.stringify({ referralCode }),
  })
}

/**
 * Fetch paginated XP transaction history
 */
export async function fetchXpTransactions(
  page = 1,
  limit = 50,
): Promise<{
  total: number
  page: number
  limit: number
  transactions: XpTransaction[]
}> {
  return request<{
    total: number
    page: number
    limit: number
    transactions: XpTransaction[]
  }>(`/api/rewards/transactions?page=${page}&limit=${limit}`)
}

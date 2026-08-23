import type { Request } from 'express'

export type Role = 'STUDENT' | 'COLLEGE_ADMIN' | 'SUPPORT' | 'ADMIN'

export interface AppUser {
  fullName: string
  email: string
  role: Role
  collegeId: string | null
  collegeName: string | null
  accreditationId: string | null
  username: string | null
  department: string | null
  rollNumber: string | null
  profileImage: string | null
  phone: string | null
  degree: string | null
  branch: string | null
  year: string | null
  annualCredits: number
  lifetimeCredits: number
  xp: number
  level?: number
  hubblerId?: string
  privacy?: UserPrivacySettings
  activeTheme?: string | null
  activeFrame?: string | null
  activeTitle?: string | null
  referralCode?: string | null
  referredBy?: string | null
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'BLOCKED'
  qrCodeUrl: string | null
  startYear: number | null
  endYear: number | null
  createdAt: string
  updatedAt?: string
  branchName?: string | null
  district?: string | null
  adminRole?: string | null
  shortcode?: string | null
}

export interface UserPrivacySettings {
  profileVisibility: 'PUBLIC' | 'FRIENDS_ONLY' | 'PRIVATE'
  showXp: boolean
  showCertificates: boolean
  showEventHistory: boolean
  allowConnectionRequests: boolean
  autoPostAchievements: boolean
}

export type ConnectionStatus = 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED'

export interface ConnectionRecord {
  id: string
  user1: string // canonical min uid
  user2: string // canonical max uid
  requesterUid: string
  receiverUid: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: string
  updatedAt: string
}

export interface FollowRecord {
  id: string
  followerUid: string
  targetUid: string
  createdAt: string
}

export type PostType =
  | 'BADGE_EARNED'
  | 'LEVEL_UP'
  | 'CERTIFICATE_ISSUED'
  | 'RANKING_TOP3'
  | 'EVENT_MILESTONE'
  | 'COMPETITION_WIN'
  | 'VOLUNTEER_HERO'

export interface AchievementPostRecord {
  id: string
  authorUid: string
  authorHubblerId: string
  authorName: string
  authorImage: string | null
  authorCollege: string
  authorFrame: string | null
  authorTitle: string | null
  type: PostType
  achievementTitle: string
  achievementDescription: string
  achievementIcon: string
  meta?: Record<string, unknown>
  xpEarned?: number
  visibility: 'PUBLIC' | 'FRIENDS' | 'FOLLOWERS' | 'PRIVATE'
  likesCount: number
  likes: string[]
  commentsCount: number
  createdAt: string
}

export interface PostCommentRecord {
  id: string
  postId: string
  authorUid: string
  authorHubblerId: string
  authorName: string
  authorImage: string | null
  authorTitle: string | null
  text: string
  createdAt: string
}

export interface PublicUserProfile {
  hubblerId: string
  fullName: string
  collegeName: string
  department?: string | null
  degree?: string | null
  branch?: string | null
  year?: string | null
  profileImage: string | null
  activeTitle: string | null
  activeFrame: string | null
  activeTheme: string | null
  level: number
  levelTitle: string
  levelIcon: string
  xp?: number
  badgeCount: number
  badges: Array<{
    id: string
    name: string
    description: string
    icon: string
    category: string
  }>
  certificates?: Array<{
    id: string
    eventTitle: string
    eventCategory: string
    issuedAt: string
    verificationCode: string
  }>
  eventCount?: number
  connectionStatus: ConnectionStatus
  isFollowing: boolean
  mutualCount: number
  mutualConnections: Array<{
    hubblerId: string
    fullName: string
    profileImage: string | null
  }>
  privacySettings?: UserPrivacySettings
  recentPosts?: AchievementPostRecord[]
  createdAt: string
}

export interface RequestWithUser extends Request {
  user?: {
    firebaseUid: string
    role: Role
    email: string
    collegeId: string | null
  }
}

export type EventCategory = 'WORKSHOP' | 'COMPETITION' | 'VOLUNTEERING' | 'GENERAL'

export interface FirestoreEvent {
  title: string
  description: string
  longDescription: string
  location: string
  startDate: string
  endDate: string
  xpReward: number
  category?: EventCategory
  coverImage?: string | null
  createdAt: string
  organizerId?: string
  organizerName?: string
  collegeName?: string
}

export interface UserEventRecord {
  eventId: string
  registeredAt: string
  attended?: boolean
  name?: string
  email?: string
  degree?: string
  branch?: string
  year?: string
  collegeName?: string
  phone?: string
  qrCodeUrl?: string
}

export type ActivityType =
  | 'LOGIN'
  | 'SIGNUP'
  | 'PROFILE_UPDATE'
  | 'EVENT_REGISTER'
  | 'EVENT_UNREGISTER'
  | 'EVENT_CREATE'
  | 'EVENT_DELETE'
  | 'COLLEGE_APPROVE'
  | 'COLLEGE_REJECT'
  | 'COLLEGE_SUBMIT'
  | 'ORGANIZER_SUBMIT'
  | 'EVENT_REPORT'
  | 'ORGANIZER_BLOCK'
  | 'REPORT_RESOLVE'
  | 'REPORT_DISMISS'
  | 'XP_AWARD'
  | 'REWARD_REDEEM'
  | 'CERTIFICATE_ISSUE'

export interface ActivityLog {
  userId: string
  role: Role
  type: ActivityType
  description: string
  createdAt: string
  meta?: Record<string, unknown>
}

export interface XpTransactionRecord {
  id: string
  userId: string
  activityType: string
  amount: number
  description: string
  referenceId: string
  monthKey: string
  balanceAfter: number
  createdAt: string
  meta?: Record<string, unknown>
}

export interface UserBadgeRecord {
  id: string
  userId: string
  badgeId: string
  badgeName: string
  badgeDescription: string
  badgeCategory: 'ACHIEVEMENT' | 'MONTHLY' | 'RANKING' | 'EXCLUSIVE'
  badgeIcon: string
  awardedAt: string
  monthKey?: string
}

export interface CertificateRecord {
  id: string
  studentUid: string
  studentName: string
  studentEmail: string
  collegeName: string
  eventId: string
  eventTitle: string
  eventCategory: EventCategory
  eventDate: string
  organizerName: string
  issuedAt: string
  verificationCode: string
  qrVerificationUrl?: string
}

export type RewardCategory = 'THEME' | 'FRAME' | 'TITLE' | 'BADGE' | 'DISCOUNT' | 'ACCESS'

export interface RewardItem {
  id: string
  name: string
  description: string
  image: string
  xpCost: number
  category: RewardCategory
  minLevel: number
  minXp: number
  active: boolean
  valueData: Record<string, unknown>
  createdAt: string
  updatedAt?: string
}

export interface RedemptionRecord {
  id: string
  userId: string
  userName: string
  userEmail: string
  rewardId: string
  rewardName: string
  category: RewardCategory
  xpCost: number
  redemptionCode: string
  status: 'ACTIVE' | 'USED' | 'EXPIRED'
  meta?: Record<string, unknown>
  redeemedAt: string
}

export interface EventFeedbackRecord {
  id: string
  eventId: string
  studentUid: string
  studentName: string
  rating: number
  feedbackText: string
  createdAt: string
}

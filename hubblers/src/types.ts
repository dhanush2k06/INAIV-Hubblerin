export type Role = 'STUDENT' | 'COLLEGE_ADMIN' | 'SUPPORT' | 'ADMIN'

export interface AuthState {
  token: string | null
  role: Role | null
}

export type EventCategory = 'WORKSHOP' | 'COMPETITION' | 'VOLUNTEERING' | 'GENERAL'

export interface DashboardData {
  welcome?: string
  collegeName?: string
  credits?: { annual: number; lifetime: number }
  xp?: number
  level?: number
  hubblerId?: string
  privacy?: UserPrivacySettings
  activeTheme?: string | null
  activeFrame?: string | null
  activeTitle?: string | null
  registeredEvents?: Array<{
    id: string
    title: string
    description?: string
    location?: string
    startDate?: string
    endDate?: string
    category?: EventCategory
    xpReward?: number
    registeredAt?: string
    qrCodeUrl?: string
    eventOver?: boolean
    attended?: boolean
    registration?: {
      name?: string
      email?: string
      degree?: string
      branch?: string
      year?: string
      collegeName?: string
      phone?: string
    }
  }>
  upcomingEvents?: Array<{ title: string; date: string }>
  leaderboard?: Array<{ name: string; score: number }>
  recentCertificates?: string[]
  profileCompletion?: number
  qrCodeUrl?: string
  totalEvents?: number
  registrations?: number
  attendance?: number
  certificatesIssued?: number
  pendingRequests?: number
  totalUsers?: number
  totalColleges?: number
  pendingColleges?: number
  reports?: Record<string, string | number>
  statistics?: Record<string, number | string>
}

export interface LevelInfo {
  level: number
  title: string
  icon: string
  currentLevelMinXp: number
  nextLevelMinXp: number | null
  xpInLevel: number
  xpNeededForNext: number
  progressPercent: number
  perks: string
  badgeId: string
}

export interface UserBadge {
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

export interface BadgeDefinition {
  id: string
  name: string
  description: string
  icon: string
  category: 'ACHIEVEMENT' | 'MONTHLY' | 'RANKING' | 'EXCLUSIVE'
  criteria: string
}

export interface Certificate {
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
  redemptionsCount?: number
}

export interface Redemption {
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

export interface XpTransaction {
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

export interface LeaderboardStudent {
  rank: number
  userId: string
  fullName: string
  collegeName: string
  profileImage: string | null
  activeFrame: string | null
  activeTitle: string | null
  monthlyXp: number
  totalXp: number
  level: number
}

export interface CollegeLeaderboardEntry {
  rank: number
  collegeName: string
  totalXp: number
  studentCount: number
}

export interface StudentRewardsSummary {
  xp: number
  level: LevelInfo
  monthlyXp: number
  monthlyRank: number
  referralCode: string
  referredCount: number
  hubblerId?: string
  privacy?: UserPrivacySettings
  activeTheme?: string | null
  activeFrame?: string | null
  activeTitle?: string | null
  unlockedBadges: UserBadge[]
  allBadges: BadgeDefinition[]
  certificates: Certificate[]
  redemptions: Redemption[]
  recentTransactions: XpTransaction[]
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

export interface ConnectionUserSummary {
  hubblerId: string
  fullName: string
  collegeName: string
  profileImage: string | null
  activeTitle: string | null
  activeFrame: string | null
  level: number
  badgeCount: number
}

export interface ConnectionItem {
  id: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  isRequester: boolean
  createdAt: string
  updatedAt: string
  user: ConnectionUserSummary
  mutualCount?: number
}

export interface MyConnectionsData {
  friends: ConnectionItem[]
  pendingIncoming: ConnectionItem[]
  pendingOutgoing: ConnectionItem[]
  followers: ConnectionUserSummary[]
  following: ConnectionUserSummary[]
  counts: {
    friends: number
    pendingIncoming: number
    pendingOutgoing: number
    followers: number
    following: number
  }
}

export type PostType =
  | 'BADGE_EARNED'
  | 'LEVEL_UP'
  | 'CERTIFICATE_ISSUED'
  | 'RANKING_TOP3'
  | 'EVENT_MILESTONE'
  | 'COMPETITION_WIN'
  | 'VOLUNTEER_HERO'

export interface AchievementPost {
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
  isLiked?: boolean
  commentsCount: number
  createdAt: string
}

export interface PostComment {
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
  recentPosts?: AchievementPost[]
  createdAt: string
}

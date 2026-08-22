export type Role = 'STUDENT' | 'COLLEGE_ADMIN' | 'SUPPORT' | 'ADMIN'

export interface AuthState {
  token: string | null
  role: Role | null
}

export interface DashboardData {
  welcome?: string
  collegeName?: string
  credits?: { annual: number; lifetime: number }
  xp?: number
registeredEvents?: Array<{
    id: string
    title: string
    description?: string
    location?: string
    startDate?: string
    endDate?: string
    xpReward?: number
    registeredAt?: string
    qrCodeUrl?: string
    eventOver?: boolean
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

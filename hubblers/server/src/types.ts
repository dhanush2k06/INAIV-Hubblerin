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
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'BLOCKED'
  qrCodeUrl: string | null
  startYear: number | null
  endYear: number | null
  createdAt: string
  branchName?: string | null
  district?: string | null
  adminRole?: string | null
  shortcode?: string | null
}

export interface RequestWithUser extends Request {
  user?: {
    firebaseUid: string
    role: Role
    email: string
    collegeId: string | null
  }
}

export interface FirestoreEvent {
  title: string
  description: string
  longDescription: string
  location: string
  startDate: string
  endDate: string
  xpReward: number
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

export interface ActivityLog {
  userId: string
  role: Role
  type: ActivityType
  description: string
  createdAt: string
  meta?: Record<string, unknown>
}

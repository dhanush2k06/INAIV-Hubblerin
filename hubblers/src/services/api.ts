import type { DashboardData } from '../types'

// Use a relative base by default so requests go through the Vite dev proxy
// (same-origin, no CORS failures). Set VITE_API_BASE to a full URL (e.g. the
// deployed backend) to call the API directly instead.
const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export function parseApiError(error: unknown): string {
  if (!(error instanceof Error)) return 'Something went wrong'
  try {
    const parsed = JSON.parse(error.message) as { error?: string | Record<string, unknown>; details?: string }
    if (typeof parsed.error === 'string') return parsed.error
    if (parsed.details) return parsed.details
  } catch {
    // Not a JSON error payload
  }
  return error.message
}

export function authHeaders() {
  const token = localStorage.getItem('hubblers_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Firebase-only helpers: store the Firebase ID token and role.
 */
export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem('hubblers_token', token)
  else localStorage.removeItem('hubblers_token')
}

export function setAuthRole(role: string | null) {
  if (role) localStorage.setItem('hubblers_role', role)
  else localStorage.removeItem('hubblers_role')
}

export function getAuthToken(): string | null {
  return localStorage.getItem('hubblers_token')
}

export async function request<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  const auth = authHeaders().Authorization;
  if (auth) {
    headers.set('Authorization', auth);
  }

  const url = `${API_BASE}${path}`

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers,
    })
  } catch (err) {
    // Handles network-level failures like CORS, DNS, or the server being offline
    if (err instanceof Error && err.name === 'AbortError') throw err;
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(
      `Connection failed: ${msg}. Attempted URL: ${url}. ` +
        `Check that the backend is running, VITE_API_BASE is correct, and CORS is configured.`,
      { cause: err },
    )
  }

  // Handles server-side logical errors (4xx, 5xx)
  if (!response.ok) {
    // Extract server error message if available
    const text = await response.text().catch(() => '')
    throw new Error(text || response.statusText)
  }

  // Handle successful responses
  const text = await response.text()
  
  // Safely parse JSON to avoid "Unexpected end of JSON input" on empty responses
  try {
    return (text ? JSON.parse(text) : {}) as T
  } catch {
    return text as unknown as T
  }
}


export interface AuthResponse {
  token: string
  role: string
}

export async function loginWithFirebaseIdToken(idToken: string) {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  })
}

export async function loginSupport(email: string, password: string) {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export type SignupStudentPayload = {
  role: 'STUDENT'
  fullName: string
  email: string
  password: string
  collegeId?: number
  collegeName?: string
  accreditationId?: string
  username?: string
  department?: string
  rollNumber?: string
  startYear?: number
  endYear?: number
  phone?: string
  degree?: string
  branch?: string
  year?: string
  profileImageBase64?: string
}

export async function signupStudent(payload: SignupStudentPayload) {
  return request<{ message: string; verificationLink?: string; qrUrl?: string }>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export type SignupStudentWithGooglePayload = {
  role: 'STUDENT'
  idToken: string
  fullName: string
  collegeId?: number
  collegeName?: string
  accreditationId?: string
  username?: string
  department?: string
  rollNumber?: string
  startYear?: number
  endYear?: number
  phone?: string
  degree?: string
  branch?: string
  year?: string
}

export async function signupStudentWithGoogle(payload: SignupStudentWithGooglePayload) {
  return request<{ message: string; qrUrl?: string }>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export type RegisterCollegePayload = {
  institutionName: string
  branchName?: string
  city: string
  district?: string
  adminName: string
  adminRole?: string
  email: string
  password: string
  phone: string
  logoBase64?: string
  shortcode?: string
  accreditationId?: string
}

export async function registerCollege(payload: RegisterCollegePayload) {
  return request<{ message: string; verificationLink?: string; collegeId?: number }>('/api/colleges/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export type OrganizerRegisterPayload = {
  organizationType: string
  organizationName: string
  parentInstitution?: string
  description?: string
  logoBase64?: string
  bannerBase64?: string
  organizerName: string
  designation: string
  officialEmail: string
  phone: string
  alternatePhone?: string
  website?: string
  verifiedEmail?: string
  institutionSearch?: string
  state?: string
  district?: string
  aicteId?: string
  ugcCode?: string
  ngoRegistration?: string
  cin?: string
  country: string
  pinCode: string
  address: string
  city: string
  socialLinks?: {
    instagram?: string
    linkedin?: string
    facebook?: string
    website?: string
  }
  documents?: {
    logo?: string
    approvalLetter?: string
    facultyId?: string
    authorizationLetter?: string
  }
  termsAccepted: boolean
  privacyAccepted: boolean
  authorizedCertified: boolean
  password: string
}

export async function registerOrganizer(payload: OrganizerRegisterPayload) {
  return request<{ message: string; verificationLink?: string; organizerId?: string }>('/api/colleges/organizers/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface Event {
  id: string
  title: string
  description?: string
  longDescription?: string
  location?: string
  startDate?: string
  endDate?: string
  xpReward?: number
  createdAt?: string
  registeredAt?: string
  qrCodeUrl?: string
  organizerId?: string
  organizerName?: string
  collegeName?: string
  registrationCount?: number
  registration?: {
    name?: string
    email?: string
    degree?: string
    branch?: string
    year?: string
    collegeName?: string
    phone?: string
  }
}

export interface CreateEventPayload {
  title: string
  description: string
  longDescription?: string
  location: string
  startDate: string
  endDate?: string
  xpReward?: number
}

export interface EventRegistrationDetails {
  name?: string
  email?: string
  degree?: string
  branch?: string
  year?: string
  collegeName?: string
  phone?: string
}

export async function fetchEvents() {
  return request<Event[]>('/api/events')
}

export async function fetchRegisteredEvents() {
  return request<Event[]>('/api/events/registered')
}

export async function fetchMyEvents() {
  return request<Event[]>('/api/events/mine')
}

export async function createEvent(payload: CreateEventPayload) {
  return request<{ message: string; event: Event }>('/api/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateEvent(id: string, payload: Partial<CreateEventPayload>) {
  return request<{ message: string; event: Event }>(`/api/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteEvent(id: string) {
  return request<{ message: string }>(`/api/events/${id}`, {
    method: 'DELETE',
  })
}

export async function registerForEvent(eventId: string, details?: EventRegistrationDetails) {
  return request<{ message: string; xpEarned: number; creditsEarned: number; qrUrl?: string }>(`/api/events/${eventId}/register`, {
    method: 'POST',
    body: JSON.stringify(details ?? {}),
  })
}

export async function unregisterFromEvent(eventId: string) {
  return request<{ message: string; xpDeducted: number; creditsDeducted: number }>(`/api/events/${eventId}/register`, {
    method: 'DELETE',
  })
}

export interface Profile {
  id?: number
  fullName?: string
  email?: string
  role?: string
  phone?: string
  degree?: string
  branch?: string
  year?: string
  department?: string
  collegeName?: string
  username?: string
  accreditationId?: string
  profileImage?: string
  rollNumber?: string
  startYear?: number
  endYear?: number
}

export async function fetchProfile() {
  return request<Profile>('/api/users/profile')
}

export async function updateProfile(payload: Partial<Profile>) {
  return request<Profile>('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}


const dashboardPaths: Record<string, string> = {
  STUDENT: '/api/dashboard/student',
  COLLEGE_ADMIN: '/api/dashboard/college',
  SUPPORT: '/api/dashboard/support',
}

export async function fetchDashboard(role: string) {
  return request<DashboardData>(dashboardPaths[role] ?? '/api/dashboard/student')
}

export type PendingCollege = {
  id: string | number
  college_name: string
  admin_name: string
  city: string
  status: string
  logoUrl?: string
  createdAt?: string
  admin_email?: string
  phone?: string
}

export async function fetchPendingColleges() {
  return request<PendingCollege[]>('/api/colleges/pending')
}


export async function approveCollege(id: string | number) {
  return request<{ message: string }>(`/api/colleges/approve/${id}`, { method: 'PUT' })
}

export async function rejectCollege(id: string | number) {
  return request<{ message: string }>(`/api/colleges/reject/${id}`, { method: 'PUT' })
}

export type ReportCategory = 'SPAM' | 'SCAM' | 'MISLEADING' | 'INAPPROPRIATE' | 'FAKE_EVENT' | 'OTHER'

export async function reportEvent(eventId: string, payload: { reason: string; category: ReportCategory }) {
  return request<{ message: string }>(`/api/events/${encodeURIComponent(eventId)}/report`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

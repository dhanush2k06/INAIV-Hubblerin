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
  const token = localStorage.getItem('crm_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function setCrmToken(token: string | null) {
  if (token) localStorage.setItem('crm_token', token)
  else localStorage.removeItem('crm_token')
}

export function getCrmToken(): string | null {
  return localStorage.getItem('crm_token')
}

export function setCrmRole(role: string | null) {
  if (role) localStorage.setItem('crm_role', role)
  else localStorage.removeItem('crm_role')
}

export function getCrmRole(): string | null {
  return localStorage.getItem('crm_role')
}

export async function request<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const auth = authHeaders().Authorization
  if (auth) headers.set('Authorization', auth)

  const url = `${API_BASE}${path}`

  let response: Response
  try {
    response = await fetch(url, { ...options, headers })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Connection failed: ${msg}. Attempted URL: ${url}.`, { cause: err })
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || response.statusText)
  }

  const text = await response.text()
  try {
    return (text ? JSON.parse(text) : {}) as T
  } catch {
    return text as unknown as T
  }
}

// ---- Auth ----
export interface AuthResponse {
  token: string
  role: string
}

export async function loginAdmin(email: string, password: string) {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function fetchMe() {
  return request<{ firebaseUid: string; role: string; fullName?: string; email?: string }>('/api/auth/me')
}

// ---- CRM API ----
export interface CrmOverview {
  totalStudents: number
  totalOrganizers: number
  totalUsers: number
  totalColleges: number
  pendingColleges: number
  totalEvents: number
  totalRegistrations: number
  support: number
  admin: number
  recentActivityCount: number
}

export async function fetchOverview() {
  return request<CrmOverview>('/api/crm/overview')
}

export interface CrmUser {
  id: string
  fullName: string
  email: string
  role: string
  collegeId: string | null
  collegeName: string | null
  department: string | null
  rollNumber: string | null
  degree: string | null
  branch: string | null
  year: string | null
  phone: string | null
  xp: number
  annualCredits: number
  lifetimeCredits: number
  verificationStatus: string
  profileImage: string | null
  createdAt: string
  updatedAt: string
}

export async function fetchUsers(params: { role?: string; search?: string; verificationStatus?: string; page?: number; limit?: number }) {
  const qs = new URLSearchParams()
  if (params.role) qs.set('role', params.role)
  if (params.search) qs.set('search', params.search)
  if (params.verificationStatus) qs.set('verificationStatus', params.verificationStatus)
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  return request<{ total: number; page: number; limit: number; users: CrmUser[] }>(`/api/crm/users?${qs.toString()}`)
}

export interface ActivityEntry {
  id: string
  userId: string
  role: string
  type: string
  description: string
  createdAt: string
  meta: Record<string, unknown>
}

export interface CrmUserDetail extends CrmUser {
  activity: ActivityEntry[]
  registeredEvents: Array<{
    id: string
    title: string
    location: string
    startDate: string
    xpReward: number
    registeredAt: string
  }>
}

export async function fetchUserDetail(id: string) {
  return request<CrmUserDetail>(`/api/crm/users/${encodeURIComponent(id)}`)
}

export interface CrmEvent {
  id: string
  title: string
  description: string
  location: string
  startDate: string
  endDate: string
  xpReward: number
  createdAt: string
  registrationCount: number
}

export async function fetchCrmEvents() {
  return request<CrmEvent[]>('/api/crm/events')
}

export async function fetchActivity(params: { page?: number; limit?: number }) {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  return request<{ total: number; page: number; limit: number; activity: ActivityEntry[] }>(`/api/crm/activity?${qs.toString()}`)
}

export interface CrmAnalytics {
  totals: { students: number; organizers: number }
  topColleges: Array<{ name: string; count: number }>
  roleDistribution: Array<{ name: string; value: number }>
  verificationStatus: Array<{ name: string; value: number }>
  activityByType: Array<{ name: string; value: number }>
  activityTrend: Array<{ date: string; count: number }>
}

export async function fetchAnalytics() {
  return request<CrmAnalytics>('/api/crm/analytics')
}

export async function approveOrganizer(id: string) {
  return request<{ message: string }>(`/api/crm/users/${encodeURIComponent(id)}/approve`, { method: 'PUT' })
}

export async function rejectOrganizer(id: string) {
  return request<{ message: string }>(`/api/crm/users/${encodeURIComponent(id)}/reject`, { method: 'PUT' })
}

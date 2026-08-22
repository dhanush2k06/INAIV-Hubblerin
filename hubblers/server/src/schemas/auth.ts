import { z } from 'zod'

export const signupSchema = z.object({
  role: z.enum(['STUDENT', 'COLLEGE_ADMIN']),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  idToken: z.string().optional(),
  fullName: z.string().min(3).optional(),
  collegeId: z.number().nullable().optional(),
  collegeName: z.string().min(2).optional(),
  accreditationId: z.string().optional(),
  username: z.string().min(2).optional(),
  department: z.string().nullable().optional(),
  rollNumber: z.string().nullable().optional(),
  startYear: z.number().int().min(1990).max(2100).optional(),
  endYear: z.number().int().min(1990).max(2100).optional(),
  profileImageBase64: z.string().optional(),
  institutionName: z.string().min(3).optional(),
  adminName: z.string().min(3).optional(),
  phone: z.string().min(6).optional(),
  city: z.string().min(2).optional(),
  logoBase64: z.string().optional(),
  degree: z.string().nullable().optional(),
  branch: z.string().nullable().optional(),
  year: z.string().nullable().optional(),
})

export const loginSchema = z.object({
  idToken: z.string().optional(),
  googleToken: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
})

import { z } from 'zod'

export const collegeRegisterSchema = z.object({
  institutionName: z.string().min(3),
  branchName: z.string().optional(),
  city: z.string().min(2),
  district: z.string().optional(),
  adminName: z.string().min(3),
  adminRole: z.string().optional(),
  email: z.string().email(),
  phone: z.string().min(6),
  password: z.string().min(6),
  logoBase64: z.string().optional(),
  shortcode: z.string().optional(),
  accreditationId: z.string().optional(),
})

export const organizerTypes = [
  'College',
  'Institution',
  'Student Club',
  'Technical Community',
  'Department',
  'NGO',
  'Startup',
  'Company',
  'Other',
] as const

export const organizerRegisterSchema = z
  .object({
    // Step 1
    organizationType: z.enum(organizerTypes),

    // Step 2
    organizationName: z.string().min(1, 'Organization name is required'),
    parentInstitution: z.string().optional(),
    description: z.string().optional(),
    logoBase64: z.string().optional(),
    bannerBase64: z.string().optional(),

    // Step 3
    organizerName: z.string().min(1, 'Organizer full name is required'),
    designation: z.string().min(1, 'Designation is required'),
    officialEmail: z.string().email('Official email is required'),
    phone: z.string().min(6, 'Mobile number is required'),
    alternatePhone: z.string().optional(),

    // Verification / Step 4
    website: z.string().url('Website must be a valid URL').optional().or(z.literal('')),
    verifiedEmail: z.string().email().optional().or(z.literal('')),
    institutionSearch: z.string().optional(),
    state: z.string().optional(),
    district: z.string().optional(),
    aicteId: z.string().optional(),
    ugcCode: z.string().optional(),
    ngoRegistration: z.string().optional(),
    cin: z.string().optional(),

    // Step 5
    country: z.string().min(1, 'Country is required'),
    pinCode: z.string().min(1, 'PIN code is required'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),

    // Step 6
    socialLinks: z
      .object({
        instagram: z.string().optional(),
        linkedin: z.string().optional(),
        facebook: z.string().optional(),
        website: z.string().optional(),
      })
      .optional(),

    // Step 7
    documents: z
      .object({
        logo: z.string().optional(),
        approvalLetter: z.string().optional(),
        facultyId: z.string().optional(),
        authorizationLetter: z.string().optional(),
      })
      .optional(),

    // Step 8
    termsAccepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the Terms and Conditions' }) }),
    privacyAccepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the Privacy Policy' }) }),
    authorizedCertified: z.literal(true, { errorMap: () => ({ message: 'You must certify authorization' }) }),

    password: z.string().min(6),
  })
  .superRefine((data, ctx) => {
    // Parent institution is mandatory for clubs and departments.
    if (
      (data.organizationType === 'Student Club' || data.organizationType === 'Department') &&
      !data.parentInstitution
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['parentInstitution'],
        message: 'Parent institution is required for Student Clubs and Departments',
      })
    }
  })

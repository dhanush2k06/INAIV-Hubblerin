import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerOrganizer, type OrganizerRegisterPayload } from '../services/api'

const ORGANIZER_TYPES = [
  'College',
  'Institution',
  'Student Club',
  'Technical Community',
  'Department',
  'NGO',
  'Startup',
  'Company',
  'Other',
]

const STEPS = [
  'Organizer Type',
  'Organization Info',
  'Organizer Info',
  'Verification',
  'Address',
  'Social Presence',
  'Documents',
  'Agreement',
]

interface OrganizerFormData {
  organizationType: string
  organizationName: string
  parentInstitution: string
  description: string
  logoBase64?: string
  bannerBase64?: string
  organizerName: string
  designation: string
  officialEmail: string
  phone: string
  alternatePhone: string
  website: string
  verifiedEmail: string
  institutionSearch: string
  state: string
  district: string
  aicteId: string
  ugcCode: string
  ngoRegistration: string
  cin: string
  country: string
  city: string
  pinCode: string
  address: string
  instagram: string
  linkedin: string
  facebook: string
  password: string
  termsAccepted: boolean
  privacyAccepted: boolean
  authorizedCertified: boolean
}

const initialForm: OrganizerFormData = {
  organizationType: '',
  organizationName: '',
  parentInstitution: '',
  description: '',
  logoBase64: '',
  bannerBase64: '',
  organizerName: '',
  designation: '',
  officialEmail: '',
  phone: '',
  alternatePhone: '',
  website: '',
  verifiedEmail: '',
  institutionSearch: '',
  state: '',
  district: '',
  aicteId: '',
  ugcCode: '',
  ngoRegistration: '',
  cin: '',
  country: '',
  city: '',
  pinCode: '',
  address: '',
  instagram: '',
  linkedin: '',
  facebook: '',
  password: '',
  termsAccepted: false,
  privacyAccepted: false,
  authorizedCertified: false,
}

function readFileAsDataUrl(file?: File): Promise<string | undefined> {
  if (!file) return Promise.resolve(undefined)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function OrganizerSignupPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<OrganizerFormData>(initialForm)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const parentInstitutionRequired = form.organizationType === 'Student Club' || form.organizationType === 'Department'

  function set(field: keyof OrganizerFormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function validateStep(current: number): boolean {
    setError(null)
    if (current === 0) {
      if (!form.organizationType) {
        setError('Please select an organization type.')
        return false
      }
    }
    if (current === 1) {
      if (!form.organizationName.trim()) {
        setError('Organization name is required.')
        return false
      }
      if (parentInstitutionRequired && !form.parentInstitution.trim()) {
        setError('Parent institution is required for Student Clubs and Departments.')
        return false
      }
    }
    if (current === 2) {
      if (!form.organizerName.trim()) {
        setError('Organizer full name is required.')
        return false
      }
      if (!form.designation.trim()) {
        setError('Designation is required.')
        return false
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.officialEmail)) {
        setError('A valid official email is required.')
        return false
      }
      if (form.phone.trim().length < 6) {
        setError('A valid mobile number is required.')
        return false
      }
    }
    if (current === 4) {
      if (!form.country.trim()) {
        setError('Country is required.')
        return false
      }
      if (!form.state.trim()) {
        setError('State is required.')
        return false
      }
      if (!form.district.trim()) {
        setError('District is required.')
        return false
      }
      if (!form.city.trim()) {
        setError('City is required.')
        return false
      }
      if (!form.pinCode.trim()) {
        setError('PIN code is required.')
        return false
      }
      if (!form.address.trim()) {
        setError('Address is required.')
        return false
      }
    }
    if (current === 7) {
if (!form.termsAccepted) {
        setError('You must agree to the INAIV Terms and Conditions.')
        return false
      }
      if (!form.privacyAccepted) {
        setError('You must agree to the Privacy Policy.')
        return false
      }
      if (!form.authorizedCertified) {
        setError('You must certify that you are authorized to represent this organization.')
        return false
      }
      if (form.password.length < 8) {
        setError('Password must be at least 8 characters.')
        return false
      }
    }
    return true
  }

  function next() {
    if (!validateStep(step)) return
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function back() {
    setError(null)
    setStep((s) => Math.max(s - 1, 0))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validateStep(7)) return
    setMessage(null)
    setError(null)
    setLoading(true)

    const payload: OrganizerRegisterPayload = {
      organizationType: form.organizationType,
      organizationName: form.organizationName,
      parentInstitution: form.parentInstitution || undefined,
      description: form.description || undefined,
      logoBase64: form.logoBase64,
      bannerBase64: form.bannerBase64,
      organizerName: form.organizerName,
      designation: form.designation,
      officialEmail: form.officialEmail,
      phone: form.phone,
      alternatePhone: form.alternatePhone || undefined,
      website: form.website || undefined,
      verifiedEmail: form.verifiedEmail || undefined,
      institutionSearch: form.institutionSearch || undefined,
      state: form.state || undefined,
      district: form.district || undefined,
      aicteId: form.aicteId || undefined,
      ugcCode: form.ugcCode || undefined,
      ngoRegistration: form.ngoRegistration || undefined,
      cin: form.cin || undefined,
      country: form.country,
      city: form.city,
      pinCode: form.pinCode,
      address: form.address,
      socialLinks: {
        instagram: form.instagram || undefined,
        linkedin: form.linkedin || undefined,
        facebook: form.facebook || undefined,
        website: form.website || undefined,
      },
      termsAccepted: form.termsAccepted,
      privacyAccepted: form.privacyAccepted,
      authorizedCertified: form.authorizedCertified,
      password: form.password,
    }

    try {
      await registerOrganizer(payload)
      setMessage('Organizer registration submitted! Await support approval.')
      setTimeout(() => navigate('/login'), 2200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please review the entered details.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'mt-2 block w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500'

  const labelClass = 'block text-sm'
  const spanClass = 'text-slate-600 dark:text-slate-400 font-medium'

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Select Organizer Type</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose the type of organization you represent.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {ORGANIZER_TYPES.map((type) => (
                <label
                  key={type}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
                    form.organizationType === type
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                      : 'border-slate-200 hover:border-emerald-300 dark:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="organizationType"
                    value={type}
                    checked={form.organizationType === type}
                    onChange={(e) => set('organizationType', e.target.value)}
                    className="h-4 w-4 accent-emerald-500"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{type}</span>
                </label>
              ))}
            </div>
          </div>
        )
      case 1:
        return (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Organization Information</h2>
            <label className={labelClass}>
              <span className={spanClass}>Organization Name *</span>
              <input
                value={form.organizationName}
                onChange={(e) => set('organizationName', e.target.value)}
                required
                placeholder="e.g. Google Developer Group - XYZ College"
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              <span className={spanClass}>Organization Type *</span>
              <select
                value={form.organizationType}
                onChange={(e) => set('organizationType', e.target.value)}
                className={inputClass}
              >
                <option value="" disabled>Select type</option>
                {ORGANIZER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className={labelClass}>
              <span className={spanClass}>
                Parent Institution {parentInstitutionRequired ? '*' : '(Optional)'}
              </span>
              <input
                value={form.parentInstitution}
                onChange={(e) => set('parentInstitution', e.target.value)}
                required={parentInstitutionRequired}
                placeholder="e.g. XYZ Engineering College"
                className={inputClass}
              />
              {parentInstitutionRequired && (
                <span className="mt-1 block text-xs text-amber-600 dark:text-amber-400">
                  Parent institution is mandatory for {form.organizationType}.
                </span>
              )}
            </label>
            <label className={labelClass}>
              <span className={spanClass}>Description</span>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                placeholder="e.g. AI & ML Student Community"
                className={inputClass}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                <span className={spanClass}>Logo</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={async (e) => set('logoBase64', (await readFileAsDataUrl(e.target.files?.[0])) ?? '')}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                <span className={spanClass}>Banner Image</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={async (e) => set('bannerBase64', (await readFileAsDataUrl(e.target.files?.[0])) ?? '')}
                  className={inputClass}
                />
              </label>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Organizer Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                <span className={spanClass}>Organizer Full Name *</span>
                <input
                  value={form.organizerName}
                  onChange={(e) => set('organizerName', e.target.value)}
                  required
                  placeholder="e.g. John Doe"
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                <span className={spanClass}>Designation *</span>
                <input
                  value={form.designation}
                  onChange={(e) => set('designation', e.target.value)}
                  required
                  placeholder="e.g. Faculty Coordinator"
                  className={inputClass}
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                <span className={spanClass}>Official Email *</span>
                <input
                  value={form.officialEmail}
                  onChange={(e) => set('officialEmail', e.target.value)}
                  type="email"
                  required
                  placeholder="john@xyzcollege.edu"
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                <span className={spanClass}>Mobile Number *</span>
                <input
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  type="tel"
                  required
                  className={inputClass}
                />
              </label>
            </div>
            <label className={labelClass}>
              <span className={spanClass}>Alternate Contact Number</span>
              <input
                value={form.alternatePhone}
                onChange={(e) => set('alternatePhone', e.target.value)}
                type="tel"
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              <span className={spanClass}>Password *</span>
              <input
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                type="password"
                required
                minLength={8}
                placeholder="Min 8 characters"
                className={inputClass}
              />
            </label>
          </div>
        )
      case 3:
        return (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Organization Verification</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                <span className={spanClass}>Official Website</span>
                <input
                  value={form.website}
                  onChange={(e) => set('website', e.target.value)}
                  placeholder="https://xyzcollege.edu"
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                <span className={spanClass}>Official Email</span>
                <input
                  value={form.verifiedEmail}
                  onChange={(e) => set('verifiedEmail', e.target.value)}
                  type="email"
                  placeholder="john@xyzcollege.edu"
                  className={inputClass}
                />
              </label>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">OTP Verification</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                An OTP will be sent to the verified email to confirm ownership. (Coming soon)
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Institution Search</p>
              <input
                value={form.institutionSearch}
                onChange={(e) => set('institutionSearch', e.target.value)}
                placeholder="Search Institution (e.g. Anna University)"
                className={inputClass}
              />
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <label className={labelClass}>
                  <span className={spanClass}>Institution Name</span>
                  <input
                    value={form.organizationName}
                    onChange={(e) => set('organizationName', e.target.value)}
                    placeholder="Auto-filled"
                    className={inputClass}
                  />
                </label>
                <label className={labelClass}>
                  <span className={spanClass}>State</span>
                  <input
                    value={form.state}
                    onChange={(e) => set('state', e.target.value)}
                    placeholder="Auto-filled"
                    className={inputClass}
                  />
                </label>
                <label className={labelClass}>
                  <span className={spanClass}>District</span>
                  <input
                    value={form.district}
                    onChange={(e) => set('district', e.target.value)}
                    placeholder="Auto-filled"
                    className={inputClass}
                  />
                </label>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Registration ID</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                This field changes based on your organization type.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {(form.organizationType === 'College' || form.organizationType === 'Institution' || form.organizationType === 'Department') && (
                  <>
                    <label className={labelClass}>
                      <span className={spanClass}>AICTE ID</span>
                      <input value={form.aicteId} onChange={(e) => set('aicteId', e.target.value)} className={inputClass} />
                    </label>
                    <label className={labelClass}>
                      <span className={spanClass}>UGC Code</span>
                      <input value={form.ugcCode} onChange={(e) => set('ugcCode', e.target.value)} className={inputClass} />
                    </label>
                  </>
                )}
                {form.organizationType === 'NGO' && (
                  <label className={labelClass}>
                    <span className={spanClass}>NGO Registration</span>
                    <input value={form.ngoRegistration} onChange={(e) => set('ngoRegistration', e.target.value)} className={inputClass} />
                  </label>
                )}
                {form.organizationType === 'Company' && (
                  <label className={labelClass}>
                    <span className={spanClass}>Company CIN</span>
                    <input value={form.cin} onChange={(e) => set('cin', e.target.value)} className={inputClass} />
                  </label>
                )}
              </div>
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Address</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className={labelClass}>
                <span className={spanClass}>Country *</span>
                <input value={form.country} onChange={(e) => set('country', e.target.value)} required placeholder="India" className={inputClass} />
              </label>
              <label className={labelClass}>
                <span className={spanClass}>State *</span>
                <input value={form.state} onChange={(e) => set('state', e.target.value)} required className={inputClass} />
              </label>
              <label className={labelClass}>
                <span className={spanClass}>District *</span>
                <input value={form.district} onChange={(e) => set('district', e.target.value)} required className={inputClass} />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                <span className={spanClass}>City *</span>
                <input value={form.city} onChange={(e) => set('city', e.target.value)} required className={inputClass} />
              </label>
              <label className={labelClass}>
                <span className={spanClass}>PIN Code *</span>
                <input value={form.pinCode} onChange={(e) => set('pinCode', e.target.value)} required className={inputClass} />
              </label>
            </div>
            <label className={labelClass}>
              <span className={spanClass}>Address *</span>
              <textarea value={form.address} onChange={(e) => set('address', e.target.value)} required rows={3} className={inputClass} />
            </label>
          </div>
        )
      case 5:
        return (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Social Presence</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Optional — helps attendees discover your organization.</p>
            {(['instagram', 'linkedin', 'facebook'] as const).map((field) => (
              <label key={field} className={labelClass}>
                <span className={spanClass}>{field.charAt(0).toUpperCase() + field.slice(1)}</span>
                <input
                  value={form[field]}
                  onChange={(e) => set(field, e.target.value)}
                  placeholder={`https://${field}.com/...`}
                  className={inputClass}
                />
              </label>
            ))}
            <label className={labelClass}>
              <span className={spanClass}>Website</span>
              <input value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://..." className={inputClass} />
            </label>
          </div>
        )
      case 6:
        return (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Documents</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Optional for MVP. These may be required later for verification.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {(['logo', 'approvalLetter', 'facultyId', 'authorizationLetter'] as const).map((field) => (
                <label key={field} className={labelClass}>
                  <span className={spanClass}>
                    {field === 'approvalLetter' ? 'Approval Letter' : field === 'facultyId' ? 'Faculty ID' : field === 'authorizationLetter' ? 'Authorization Letter' : 'Organization Logo'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,pdf"
                    className={inputClass}
                  />
                </label>
              ))}
            </div>
          </div>
        )
      case 7:
        return (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Agreement</h2>
            <div className="space-y-4">
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={form.authorizedCertified}
                  onChange={(e) => set('authorizedCertified', e.target.checked)}
                  className="mt-1 h-4 w-4 accent-emerald-500"
                />
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  I certify that I am authorized to represent this organization.
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={form.termsAccepted}
                  onChange={(e) => set('termsAccepted', e.target.checked)}
                  className="mt-1 h-4 w-4 accent-emerald-500"
                />
                <span className="text-sm text-slate-600 dark:text-slate-300">
I agree to INAIV Terms and Conditions.
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={form.privacyAccepted}
                  onChange={(e) => set('privacyAccepted', e.target.checked)}
                  className="mt-1 h-4 w-4 accent-emerald-500"
                />
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  I agree to the Privacy Policy.
                </span>
              </label>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="mx-auto min-h-[calc(100dvh-88px)] max-w-4xl px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft transition-colors dark:border-slate-800 dark:bg-slate-950/95 sm:p-12">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-500 dark:text-emerald-400 font-bold">
            Organizer registration
          </p>
          <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">Register your organization</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Register your college, club, or organization to host events and engage with the community.
          </p>
        </div>

        {/* Stepper */}
        <ol className="mb-10 flex flex-wrap items-center gap-2">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                  i === step
                    ? 'bg-emerald-500 text-slate-950'
                    : i < step
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                }`}
              >
                {i + 1}
              </button>
              <span className={`hidden text-xs font-medium sm:inline ${i === step ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && <span className="h-px w-4 bg-slate-200 dark:bg-slate-700" />}
            </li>
          ))}
        </ol>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {renderStep()}

          {error ? (
            <div className="rounded-2xl border-l-4 border-rose-600 bg-rose-50 p-4 text-sm font-semibold text-rose-900 shadow-sm dark:border-rose-500 dark:bg-slate-900 dark:text-rose-400">{error}</div>
          ) : null}
          {message ? (
            <div className="rounded-2xl border-l-4 border-emerald-600 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 shadow-sm dark:border-emerald-500 dark:bg-slate-900 dark:text-emerald-400">{message}</div>
          ) : null}

          <div className="flex items-center justify-between gap-4 pt-4">
            <button
              type="button"
              onClick={back}
              disabled={step === 0 || loading}
              className="rounded-full border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 transition hover:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
            >
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="rounded-full bg-emerald-500 px-8 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-emerald-500 px-8 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Submitting…' : 'Submit Registration'}
              </button>
            )}
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

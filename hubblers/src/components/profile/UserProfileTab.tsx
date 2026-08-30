import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { fetchProfile, updateProfile, type Profile } from '../../services/api'

interface UserProfileTabProps {
  onProfileUpdated?: (updatedProfile: Profile) => void
}

export function UserProfileTab({ onProfileUpdated }: UserProfileTabProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [copiedId, setCopiedId] = useState(false)

  // Form State
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [collegeName, setCollegeName] = useState('')
  const [degree, setDegree] = useState('')
  const [branch, setBranch] = useState('')
  const [year, setYear] = useState('')
  const [rollNumber, setRollNumber] = useState('')
  const [startYear, setStartYear] = useState<number | ''>('')
  const [endYear, setEndYear] = useState<number | ''>('')
  const [bio, setBio] = useState('')
  const [skillsText, setSkillsText] = useState('')
  const [interestsText, setInterestsText] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarBase64, setAvatarBase64] = useState<string | undefined>(undefined)

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  const loadData = () => {
    setLoading(true)
    fetchProfile()
      .then((data) => {
        setProfile(data)
        setFullName(data.fullName || '')
        setPhone(data.phone || '')
        setCollegeName(data.collegeName || '')
        setDegree(data.degree || '')
        setBranch(data.branch || data.department || '')
        setYear(data.year || '')
        setRollNumber(data.rollNumber || '')
        setStartYear(data.startYear ?? '')
        setEndYear(data.endYear ?? '')
        setBio(data.bio || '')
        setSkillsText((data.skills || []).join(', '))
        setInterestsText((data.interests || []).join(', '))
        setLinkedinUrl(data.linkedinUrl || '')
        setGithubUrl(data.githubUrl || '')
        setAvatarPreview(data.profileImage || null)
      })
      .catch((err) => {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to load profile')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  // Calculate live completion percentage based on current form values
  const calculateLiveCompletion = () => {
    const requiredItems = [
      { key: 'fullName', label: 'Full Name', weight: 15, filled: Boolean(fullName.trim()) },
      { key: 'email', label: 'Email', weight: 15, filled: Boolean(profile?.email) },
      { key: 'collegeName', label: 'College / Institution', weight: 15, filled: Boolean(collegeName.trim()) },
      { key: 'degree', label: 'Degree / Program', weight: 15, filled: Boolean(degree.trim()) },
      { key: 'year', label: 'Year of Study', weight: 10, filled: Boolean(year.trim() || endYear) },
      { key: 'phone', label: 'Phone Number', weight: 10, filled: Boolean(phone.trim()) },
      { key: 'rollNumber', label: 'Roll / Student ID', weight: 10, filled: Boolean(rollNumber.trim()) },
      { key: 'profileImage', label: 'Profile Picture', weight: 10, filled: Boolean(avatarPreview || avatarBase64) },
    ]

    let score = 0
    const missing: string[] = []
    for (const item of requiredItems) {
      if (item.filled) {
        score += item.weight
      } else {
        missing.push(item.label)
      }
    }
    return { score: Math.min(100, score), missing }
  }

  const { score: completionScore, missing: missingItems } = calculateLiveCompletion()

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image file must be under 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setAvatarPreview(base64)
      setAvatarBase64(base64)
    }
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!fullName.trim() || fullName.trim().length < 2) {
      newErrors.fullName = 'Full Name is required (minimum 2 characters)'
    }
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }
    if (!collegeName.trim()) {
      newErrors.collegeName = 'College / Institution name is required'
    }
    if (!degree.trim()) {
      newErrors.degree = 'Degree / Program is required'
    }
    if (!branch.trim()) {
      newErrors.branch = 'Department / Branch is required'
    }
    if (!year.trim()) {
      newErrors.year = 'Year of study is required'
    }
    if (!rollNumber.trim()) {
      newErrors.rollNumber = 'Roll / Student ID is required'
    }

    if (linkedinUrl.trim() && !linkedinUrl.startsWith('http://') && !linkedinUrl.startsWith('https://')) {
      newErrors.linkedinUrl = 'Please enter a valid URL starting with https://'
    }
    if (githubUrl.trim() && !githubUrl.startsWith('http://') && !githubUrl.startsWith('https://')) {
      newErrors.githubUrl = 'Please enter a valid URL starting with https://'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage('')
    setErrorMessage('')

    if (!validate()) {
      setErrorMessage('Please fix the validation errors in the required fields below.')
      return
    }

    setSaving(true)
    try {
      const skills = skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const interests = interestsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      const payload: Partial<Profile> = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        collegeName: collegeName.trim(),
        degree: degree.trim(),
        branch: branch.trim(),
        department: branch.trim(),
        year: year.trim(),
        rollNumber: rollNumber.trim(),
        startYear: startYear ? Number(startYear) : undefined,
        endYear: endYear ? Number(endYear) : undefined,
        bio: bio.trim(),
        skills,
        interests,
        linkedinUrl: linkedinUrl.trim() || undefined,
        githubUrl: githubUrl.trim() || undefined,
      }

      if (avatarBase64) {
        payload.profileImageBase64 = avatarBase64
      }

      await updateProfile(payload)
      setMessage('Your profile details have been saved and synced with Firestore!')
      setAvatarBase64(undefined)

      // Refresh data
      const updated = await fetchProfile()
      setProfile(updated)
      if (onProfileUpdated) {
        onProfileUpdated(updated)
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyHubblerId = () => {
    if (!profile?.hubblerId) return
    navigator.clipboard.writeText(profile.hubblerId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-500">Loading your profile details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Profile Overview Card */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center text-center sm:text-left">
            {/* Avatar */}
            <div className="relative group">
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-emerald-500/30 bg-slate-100 dark:bg-slate-800 shadow-md">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-bold text-2xl text-emerald-500">
                    {(fullName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-emerald-500 p-2 text-slate-950 shadow-md transition hover:scale-110 hover:bg-emerald-400"
                title="Upload new avatar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Basic Info */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {fullName || 'Student User'}
                </h2>
                <span className="rounded-full bg-emerald-500/10 px-3 py-0.5 text-xs font-bold text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
                  {profile?.role || 'STUDENT'}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {profile?.email || 'No email provided'}
              </p>
              {collegeName && (
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  🏛️ {collegeName}
                </p>
              )}

              {/* HubblerID Pill */}
              {profile?.hubblerId && (
                <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
                  <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">
                    🆔 {profile.hubblerId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyHubblerId}
                    className="text-xs font-medium text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400 transition"
                  >
                    {copiedId ? '✓ Copied' : 'Copy ID'}
                  </button>
                  <a
                    href={`/profile/${profile.hubblerId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    View Public ↗
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Profile Completion Meter */}
          <div className="flex flex-col items-center md:items-end justify-center gap-2 rounded-2xl bg-slate-50 p-4 border border-slate-100 dark:bg-slate-950/60 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200 dark:text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={
                      completionScore === 100
                        ? 'text-emerald-500'
                        : completionScore >= 60
                        ? 'text-amber-500'
                        : 'text-rose-500'
                    }
                    strokeDasharray={`${completionScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-sm font-extrabold text-slate-900 dark:text-white">
                  {completionScore}%
                </span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Profile Status</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {completionScore === 100
                    ? '✨ 100% Completed'
                    : `${completionScore}% Completed`}
                </p>
                <p className="text-xs text-slate-500">
                  {completionScore === 100
                    ? 'All required details verified'
                    : `${missingItems.length} required fields remaining`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="rounded-2xl border-l-4 border-emerald-500 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 shadow-sm dark:bg-emerald-950/40 dark:text-emerald-300">
          ✓ {message}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-2xl border-l-4 border-rose-500 bg-rose-50 p-4 text-sm font-semibold text-rose-900 shadow-sm dark:bg-rose-950/40 dark:text-rose-300">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Personal Details */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                1. Personal Details
              </h3>
              <p className="text-xs text-slate-500">Fields marked with <span className="text-rose-500 font-bold">*</span> are required.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              Identity
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
                className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition dark:bg-slate-950 dark:text-white ${
                  errors.fullName
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700'
                }`}
              />
              {errors.fullName && <p className="mt-1 text-xs text-rose-500">{errors.fullName}</p>}
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Email Address <span className="text-slate-400">(Linked Auth)</span>
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
                className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition dark:bg-slate-950 dark:text-white ${
                  errors.phone
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700'
                }`}
              />
              {errors.phone && <p className="mt-1 text-xs text-rose-500">{errors.phone}</p>}
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Bio & About
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Passionate tech enthusiast and competitive programmer"
                maxLength={500}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Academic Details */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                2. Academic & College Information
              </h3>
              <p className="text-xs text-slate-500">Essential for verified student event certificates & networking.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              Institution
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                College / Institution Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="Indian Institute of Technology / University"
                required
                className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition dark:bg-slate-950 dark:text-white ${
                  errors.collegeName
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700'
                }`}
              />
              {errors.collegeName && <p className="mt-1 text-xs text-rose-500">{errors.collegeName}</p>}
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Degree / Program <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="B.Tech, B.E., BCA, B.Sc, MBA"
                required
                className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition dark:bg-slate-950 dark:text-white ${
                  errors.degree
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700'
                }`}
              />
              {errors.degree && <p className="mt-1 text-xs text-rose-500">{errors.degree}</p>}
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Department / Branch <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="Computer Science & Engineering"
                required
                className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition dark:bg-slate-950 dark:text-white ${
                  errors.branch
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700'
                }`}
              />
              {errors.branch && <p className="mt-1 text-xs text-rose-500">{errors.branch}</p>}
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Year of Study <span className="text-rose-500">*</span>
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition dark:bg-slate-950 dark:text-white ${
                  errors.year
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700'
                }`}
              >
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="Alumni">Alumni</option>
              </select>
              {errors.year && <p className="mt-1 text-xs text-rose-500">{errors.year}</p>}
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Roll Number / Student ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="21CS042"
                required
                className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition dark:bg-slate-950 dark:text-white ${
                  errors.rollNumber
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700'
                }`}
              />
              {errors.rollNumber && <p className="mt-1 text-xs text-rose-500">{errors.rollNumber}</p>}
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Batch Start Year
              </label>
              <input
                type="number"
                min={1990}
                max={2100}
                value={startYear}
                onChange={(e) => setStartYear(e.target.value ? Number(e.target.value) : '')}
                placeholder="2022"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Graduation / End Year
              </label>
              <input
                type="number"
                min={1990}
                max={2100}
                value={endYear}
                onChange={(e) => setEndYear(e.target.value ? Number(e.target.value) : '')}
                placeholder="2026"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Skills & Social Links */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                3. Skills, Interests & Networking
              </h3>
              <p className="text-xs text-slate-500">Showcase your capabilities on your Hubbler profile.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              Social
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Skills (Comma separated)
              </label>
              <input
                type="text"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="React, TypeScript, Python, UI/UX"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Interests & Hobbies
              </label>
              <input
                type="text"
                value={interestsText}
                onChange={(e) => setInterestsText(e.target.value)}
                placeholder="Hackathons, AI, Open Source, Robotics"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              {errors.linkedinUrl && <p className="mt-1 text-xs text-rose-500">{errors.linkedinUrl}</p>}
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                GitHub Profile URL
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              {errors.githubUrl && <p className="mt-1 text-xs text-rose-500">{errors.githubUrl}</p>}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-8 py-4 text-sm font-extrabold uppercase tracking-widest text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:scale-105 hover:bg-emerald-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                <span>Saving to Firestore...</span>
              </>
            ) : (
              <>
                <span>💾 Save & Sync Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

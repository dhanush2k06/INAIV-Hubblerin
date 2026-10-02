import { Link } from 'react-router-dom'

/* ─────────────────────────────────────────────────────────────────────────
   Static data
   ───────────────────────────────────────────────────────────────────────── */

const categories = [
  {
    label: 'Workshops',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l5.654-4.654m5.65-4.65 3.029-2.497a1.875 1.875 0 0 1 2.655 2.655l-2.497 3.029" />
      </svg>
    ),
    href: '/events?category=workshops',
  },
  {
    label: 'Competitions',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
      </svg>
    ),
    href: '/events?category=competitions',
  },
  {
    label: 'College Fests',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
      </svg>
    ),
    href: '/events?category=college-fests',
  },
  {
    label: 'Volunteering',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    ),
    href: '/events?category=volunteering',
  },
  {
    label: 'Seminars',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
    href: '/events?category=seminars',
  },
]

const featuredEvents = [
  {
    title: 'Campus Tech Fest 2026',
    category: 'Fest',
    date: 'Jul 18, 2026',
    organizer: 'NIT Trichy',
    venue: 'North Campus Auditorium',
    mode: 'In-person',
    xp: '+120 XP',
    price: '₹299',
    verified: true,
    color: '#07573F',
  },
  {
    title: 'AI Innovation Workshop',
    category: 'Workshop',
    date: 'Aug 2, 2026',
    organizer: 'IIT Madras Open',
    venue: 'Innovation Lab, Block C',
    mode: 'In-person',
    xp: '+80 XP',
    price: '₹199',
    verified: true,
    color: '#0a6b4e',
  },
  {
    title: 'National Debate Competition',
    category: 'Competition',
    date: 'Sep 12, 2026',
    organizer: 'Career Sprint Society',
    venue: 'Central Lecture Hall',
    mode: 'Hybrid',
    xp: '+60 XP',
    price: '₹249',
    verified: false,
    color: '#095f46',
  },
]

const testimonials = [
  {
    quote: 'Registering for workshops takes seconds. My QR pass arrives instantly, and check-in at the venue is seamless.',
    name: 'Aditi Sharma',
    role: 'Computer Science, Year 2',
    initials: 'AS',
  },
  {
    quote: 'HubblerX automates our entire event process — from registration to attendance. Saved our team hours every time.',
    name: 'Dr. Ravi Menon',
    role: 'College Organizer',
    initials: 'RM',
  },
  {
    quote: 'Planning, promoting, and validating attendance is now completely stress-free. Our students are more engaged than ever.',
    name: 'Neha Patel',
    role: 'Event Organizer',
    initials: 'NP',
  },
]

/* ─────────────────────────────────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────────────────────────────────── */

/** Abstract geometric artwork for the hero poster panel */
function HeroArtwork() {
  return (
    <svg viewBox="0 0 400 360" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
      {/* Background */}
      <rect width="400" height="360" fill="#f7faf9" />
      {/* Large circle ring */}
      <circle cx="200" cy="160" r="120" fill="none" stroke="#07573F" strokeWidth="1.5" opacity="0.18" />
      <circle cx="200" cy="160" r="90" fill="none" stroke="#07573F" strokeWidth="1" opacity="0.22" />
      <circle cx="200" cy="160" r="60" fill="none" stroke="#07573F" strokeWidth="1" opacity="0.28" />
      {/* Grid lines */}
      <line x1="0" y1="160" x2="400" y2="160" stroke="#07573F" strokeWidth="0.75" opacity="0.10" />
      <line x1="200" y1="0" x2="200" y2="360" stroke="#07573F" strokeWidth="0.75" opacity="0.10" />
      <line x1="0" y1="80" x2="400" y2="80" stroke="#07573F" strokeWidth="0.5" opacity="0.07" />
      <line x1="0" y1="240" x2="400" y2="240" stroke="#07573F" strokeWidth="0.5" opacity="0.07" />
      <line x1="100" y1="0" x2="100" y2="360" stroke="#07573F" strokeWidth="0.5" opacity="0.07" />
      <line x1="300" y1="0" x2="300" y2="360" stroke="#07573F" strokeWidth="0.5" opacity="0.07" />
      {/* Filled circle accent */}
      <circle cx="200" cy="160" r="22" fill="#07573F" opacity="0.90" />
      <circle cx="200" cy="160" r="10" fill="#ffffff" opacity="0.95" />
      {/* Corner marks */}
      <circle cx="80"  cy="60"  r="5" fill="#07573F" opacity="0.30" />
      <circle cx="320" cy="60"  r="5" fill="#07573F" opacity="0.30" />
      <circle cx="80"  cy="280" r="5" fill="#07573F" opacity="0.30" />
      <circle cx="320" cy="280" r="5" fill="#07573F" opacity="0.30" />
      {/* Decorative ring bottom-right */}
      <circle cx="330" cy="290" r="40" fill="none" stroke="#07573F" strokeWidth="1" opacity="0.15" />
      {/* Decorative ring top-left */}
      <circle cx="70" cy="70" r="30" fill="none" stroke="#07573F" strokeWidth="1" opacity="0.15" />
      {/* Label text */}
      <text x="200" y="310" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="600" fill="#07573F" opacity="0.55" letterSpacing="0.12em">LEARN BEYOND THE CLASSROOM</text>
    </svg>
  )
}

/** Geometric artwork thumbnail for event cards */
function EventArtwork({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 320 140" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
      <rect width="320" height="140" fill={color} />
      <circle cx="160" cy="70" r="55" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      <circle cx="160" cy="70" r="38" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <circle cx="160" cy="70" r="20" fill="rgba(255,255,255,0.12)" />
      <line x1="0" y1="70" x2="320" y2="70" stroke="rgba(255,255,255,0.10)" strokeWidth="0.8" />
      <line x1="160" y1="0" x2="160" y2="140" stroke="rgba(255,255,255,0.10)" strokeWidth="0.8" />
      <circle cx="60"  cy="30"  r="3" fill="rgba(255,255,255,0.25)" />
      <circle cx="260" cy="110" r="3" fill="rgba(255,255,255,0.25)" />
      <circle cx="280" cy="35"  r="5" fill="rgba(255,255,255,0.12)" />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Main Page Component
   ───────────────────────────────────────────────────────────────────────── */

export function HomePage({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <main className="bg-white text-[var(--hx-text-primary)]">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="overflow-hidden border-b border-[var(--hx-green-160)]">
        <div className="mx-auto max-w-[1240px] px-7">
          <div className="grid lg:grid-cols-[1fr_420px] lg:items-stretch">

            {/* Left: Green content panel */}
            <div
              className="flex flex-col justify-center gap-6 bg-[var(--hx-green)] px-6 py-12 sm:gap-8 sm:px-8 sm:py-14 lg:rounded-none lg:py-20 lg:px-12"
            >
              {/* Eyebrow */}
              <div
                className="inline-flex w-fit items-center gap-1.5 rounded-tag border border-white/20 bg-white/10 px-3 py-1 text-xs font-[Manrope] font-semibold text-white/80 uppercase tracking-widest"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white/60 inline-block" />
                Student Growth Platform
              </div>

              {/* Headline */}
              <div>
                <h1 className="font-[Manrope] text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
                  Learn Beyond<br />the Classroom.
                </h1>
                <p className="mt-5 max-w-md font-['DM_Sans'] text-base leading-7 text-white/75">
                  Discover workshops, competitions, college fests, and volunteering opportunities. Participate, verify, and grow your campus story.
                </p>
              </div>

              {/* Journey tags */}
              <div className="flex flex-wrap gap-2">
                {['Discover', 'Participate', 'Verify', 'Achieve', 'Connect', 'Grow'].map((step) => (
                  <span key={step} className="rounded-tag border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs font-[Manrope] font-medium text-white/70">
                    {step}
                  </span>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3 sm:flex-row">
                {isAuthenticated ? (
                  <Link to="/events" className="btn-primary bg-white text-[var(--hx-green)] hover:bg-white/90 shadow-none">
                    Explore activities
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" /></svg>
                  </Link>
                ) : (
                  <>
                    <Link to="/signup" className="btn-primary bg-white text-[var(--hx-green)] hover:bg-white/90 shadow-none">
                      Explore activities
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" /></svg>
                    </Link>
                    <Link to="/login" className="btn-secondary border-white/30 text-white bg-white/10 hover:bg-white/20 hover:border-white/50">
                      Sign in
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right: editorial poster panel */}
            <div className="hidden lg:flex flex-col items-center justify-center border-l border-[var(--hx-green-160)] bg-[var(--hx-surface)] p-8">
              <div className="w-full max-w-[340px] rounded-hero overflow-hidden border border-[var(--hx-green-160)] shadow-card">
                <HeroArtwork />
              </div>
              <div className="mt-5 text-center">
                <p className="font-[Manrope] text-xs font-semibold text-[var(--hx-text-muted)] uppercase tracking-widest">
                  Your Activity Passport
                </p>
                <p className="mt-1 font-['DM_Sans'] text-sm text-[var(--hx-text-muted)]">
                  Every event. Verified. Yours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ────────────────────────────────────────────────────── */}
      <section className="border-b border-[var(--hx-green-160)] bg-white py-12">
        <div className="mx-auto max-w-[1240px] px-7">
          <p className="mb-6 font-[Manrope] text-xs font-semibold uppercase tracking-widest text-[var(--hx-text-muted)]">
            Browse by category
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((cat) => (
              <Link
                key={cat.label}
                to={cat.href}
                className="group flex items-center gap-3 rounded-card border border-[var(--hx-green-160)] bg-white p-4 transition-all duration-200 hover:border-[var(--hx-green)] hover:bg-[var(--hx-green-40)] hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--hx-green-160)] bg-[var(--hx-surface)] text-[var(--hx-green)] transition-colors group-hover:border-[var(--hx-green)] group-hover:bg-[var(--hx-green-90)]">
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-[Manrope] text-sm font-semibold text-[var(--hx-text-primary)]">{cat.label}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-[var(--hx-green-350)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--hx-green)]">
                  <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED EVENTS ───────────────────────────────────────────────── */}
      <section className="border-b border-[var(--hx-green-160)] bg-[var(--hx-surface)] py-16">
        <div className="mx-auto max-w-[1240px] px-7">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="font-[Manrope] text-xs font-semibold uppercase tracking-widest text-[var(--hx-text-muted)]">Featured activities</p>
              <h2 className="mt-2 font-[Manrope] text-2xl font-bold text-[var(--hx-text-primary)]">Registrations now open</h2>
            </div>
            <Link to="/events" className="btn-tertiary hidden sm:inline-flex text-sm">
              View all
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" /></svg>
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredEvents.map((event) => (
              <article key={event.title} className="hx-card flex flex-col overflow-hidden">
                {/* Artwork */}
                <div className="aspect-[16/7] w-full overflow-hidden">
                  <EventArtwork color={event.color} />
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col gap-3 p-5">
                  {/* Tags row */}
                  <div className="flex items-center gap-2">
                    <span className="hx-tag">{event.category}</span>
                    {event.verified && (
                      <span className="flex items-center gap-1 rounded-tag bg-[var(--hx-green-40)] px-2 py-0.5 text-[0.68rem] font-[Manrope] font-semibold text-[var(--hx-green)]">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3"><path fillRule="evenodd" d="M15.67 8a7.67 7.67 0 1 1-15.34 0 7.67 7.67 0 0 1 15.34 0Zm-3.86-1.7a.77.77 0 0 0-1.09-1.09L7.23 8.71 5.28 6.77a.77.77 0 0 0-1.09 1.09l2.5 2.5a.77.77 0 0 0 1.09 0l4.03-4.06Z" clipRule="evenodd" /></svg>
                        Verified
                      </span>
                    )}
                    <span className="ml-auto font-[Manrope] text-xs font-semibold text-[var(--hx-green)]">{event.xp}</span>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1.5 text-xs text-[var(--hx-text-muted)]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path fillRule="evenodd" d="M4 1.75a.75.75 0 0 1 1.5 0V3h5V1.75a.75.75 0 0 1 1.5 0V3A2.5 2.5 0 0 1 14.5 5.5v7A2.5 2.5 0 0 1 12 15H4A2.5 2.5 0 0 1 1.5 12.5v-7A2.5 2.5 0 0 1 4 3V1.75ZM3 7.5h10v5A1 1 0 0 1 12 13.5H4A1 1 0 0 1 3 12.5v-5Z" clipRule="evenodd" /></svg>
                    <span className="font-[Manrope]">{event.date}</span>
                  </div>

                  {/* Title */}
                  <h3 className="font-[Manrope] text-base font-bold leading-snug text-[var(--hx-text-primary)]">{event.title}</h3>

                  {/* Meta */}
                  <div className="flex flex-col gap-1 text-xs text-[var(--hx-text-muted)]">
                    <div className="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" /></svg>
                      <span className="font-['DM_Sans']">{event.organizer}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0"><path fillRule="evenodd" d="M8 1.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM3.5 6a4.5 4.5 0 0 1 6.874-3.817A.75.75 0 1 1 9.5 3.5v-.001A3 3 0 1 0 11 6H3.5ZM8 13.25a5.235 5.235 0 0 1-4.298-2.25H3.5A4.5 4.5 0 0 0 8 14.75a4.5 4.5 0 0 0 4.5-3.75h-.202A5.235 5.235 0 0 1 8 13.25Z" clipRule="evenodd" /></svg>
                      <span className="font-['DM_Sans']">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0"><path d="M8.75 4.75a.75.75 0 0 0-1.5 0v3.5H5.75a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 .75-.75v-4.25Z"/><path fillRule="evenodd" d="M8 1.5a6.5 6.5 0 1 0 0 13A6.5 6.5 0 0 0 8 1.5ZM3 8a5 5 0 1 1 10 0A5 5 0 0 1 3 8Z" clipRule="evenodd"/></svg>
                      <span className="font-['DM_Sans']">{event.mode}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-auto flex items-center justify-between border-t border-[var(--hx-green-160)] pt-4">
                    <span className="font-[Manrope] text-base font-bold text-[var(--hx-text-primary)]">{event.price}</span>
                    <Link
                      to="/events"
                      className="btn-primary px-4 py-2 text-xs"
                    >
                      Register
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM FEATURES ─────────────────────────────────────────────── */}
      <section className="border-b border-[var(--hx-green-160)] bg-white py-16">
        <div className="mx-auto max-w-[1240px] px-7">
          <div className="mb-12 max-w-xl">
            <p className="font-[Manrope] text-xs font-semibold uppercase tracking-widest text-[var(--hx-text-muted)]">Why HubblerX</p>
            <h2 className="mt-2 font-[Manrope] text-2xl font-bold text-[var(--hx-text-primary)]">A professional growth system for students</h2>
            <p className="mt-3 font-['DM_Sans'] text-sm leading-6 text-[var(--hx-text-muted)]">
              Not just event registration — a verified activity record, gamified progress, and a shareable student identity.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                ),
                label: 'Activity Discovery',
                title: 'Find activities worth joining',
                body: 'Explore a curated catalog of workshops, fests, competitions, and volunteering — all in one place.',
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75Z" />
                  </svg>
                ),
                label: 'QR Passes',
                title: 'QR passes, zero paper',
                body: 'Every registration generates a unique QR pass — delivered instantly and scanned at entry for a seamless experience.',
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                  </svg>
                ),
                label: 'Verified Activity',
                title: 'Build a verified activity record',
                body: 'Every attended event becomes a verified entry in your Activity Passport — a professional, shareable growth story.',
              },
            ].map((f) => (
              <div key={f.label} className="hx-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--hx-green-160)] bg-[var(--hx-surface)] text-[var(--hx-green)]">
                  {f.icon}
                </div>
                <p className="mt-4 font-[Manrope] text-[0.7rem] font-semibold uppercase tracking-widest text-[var(--hx-text-muted)]">{f.label}</p>
                <h3 className="mt-1.5 font-[Manrope] text-base font-bold text-[var(--hx-text-primary)]">{f.title}</h3>
                <p className="mt-2 font-['DM_Sans'] text-sm leading-6 text-[var(--hx-text-muted)]">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GAMIFICATION PREVIEW ──────────────────────────────────────────── */}
      <section className="border-b border-[var(--hx-green-160)] bg-[var(--hx-surface)] py-16">
        <div className="mx-auto max-w-[1240px] px-7">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="font-[Manrope] text-xs font-semibold uppercase tracking-widest text-[var(--hx-text-muted)]">Gamification</p>
              <h2 className="mt-2 font-[Manrope] text-2xl font-bold text-[var(--hx-text-primary)]">
                Growth that feels rewarding
              </h2>
              <p className="mt-3 font-['DM_Sans'] text-sm leading-6 text-[var(--hx-text-muted)]">
                Earn XP, level up, unlock achievements, and compete on leaderboards — without it feeling like a game.
              </p>
              <ul className="mt-5 space-y-2">
                {['XP & Experience Points', 'Achievement Badges', 'Participation Streaks', 'Challenges & Milestones', 'Campus Leaderboards'].map((item) => (
                  <li key={item} className="flex items-center gap-2 font-['DM_Sans'] text-sm text-[var(--hx-text-muted)]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 shrink-0 text-[var(--hx-green)]">
                      <path fillRule="evenodd" d="M15.67 8a7.67 7.67 0 1 1-15.34 0 7.67 7.67 0 0 1 15.34 0Zm-3.86-1.7a.77.77 0 0 0-1.09-1.09L7.23 8.71 5.28 6.77a.77.77 0 0 0-1.09 1.09l2.5 2.5a.77.77 0 0 0 1.09 0l4.03-4.06Z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* XP Level card preview */}
            <div className="hx-card max-w-sm mx-auto w-full p-6 lg:max-w-none">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-[Manrope] text-xs font-semibold uppercase tracking-widest text-[var(--hx-text-muted)]">Active Learner</p>
                  <p className="mt-0.5 font-[Manrope] text-xl font-extrabold text-[var(--hx-text-primary)]">Level 8</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--hx-green)] text-white font-[Manrope] text-base font-extrabold">
                  8
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between font-['DM_Sans'] text-xs text-[var(--hx-text-muted)] mb-1.5">
                  <span>1,240 XP</span><span>80% to Level 9</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[var(--hx-green-160)] overflow-hidden">
                  <div className="h-full w-[80%] rounded-full bg-[var(--hx-green)] transition-all duration-500" />
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[var(--hx-green-160)] pt-5">
                {[['12', 'Events'], ['4', 'Badges'], ['8', 'Day streak']].map(([val, lbl]) => (
                  <div key={lbl} className="text-center">
                    <p className="font-[Manrope] text-lg font-bold text-[var(--hx-text-primary)]">{val}</p>
                    <p className="font-['DM_Sans'] text-xs text-[var(--hx-text-muted)]">{lbl}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section className="border-b border-[var(--hx-green-160)] bg-white py-16">
        <div className="mx-auto max-w-[1240px] px-7">
          <div className="mb-10">
            <p className="font-[Manrope] text-xs font-semibold uppercase tracking-widest text-[var(--hx-text-muted)]">Student stories</p>
            <h2 className="mt-2 font-[Manrope] text-2xl font-bold text-[var(--hx-text-primary)]">Loved by students & organizers</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((item) => (
              <div key={item.name} className="hx-card p-6">
                <p className="font-['DM_Sans'] text-sm leading-7 text-[var(--hx-text-muted)]">"{item.quote}"</p>
                <div className="mt-5 flex items-center gap-3 border-t border-[var(--hx-green-160)] pt-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--hx-green)] font-[Manrope] text-xs font-bold text-white">
                    {item.initials}
                  </div>
                  <div>
                    <p className="font-[Manrope] text-sm font-semibold text-[var(--hx-text-primary)]">{item.name}</p>
                    <p className="font-['DM_Sans'] text-xs text-[var(--hx-text-muted)]">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA STRIP ─────────────────────────────────────────────────────── */}
      <section className="bg-[var(--hx-green)] py-16">
        <div className="mx-auto max-w-[1240px] px-7 text-center">
          <p className="font-[Manrope] text-xs font-semibold uppercase tracking-widest text-white/60">Ready to grow?</p>
          <h2 className="mt-3 font-[Manrope] text-2xl font-extrabold text-white sm:text-3xl">
            Learn Beyond the Classroom.
          </h2>
          <p className="mt-3 mx-auto max-w-lg font-['DM_Sans'] text-sm leading-6 text-white/70">
            Join thousands of students building their verified activity record, earning XP, and growing beyond their studies.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {isAuthenticated ? (
              <Link to="/events" className="btn-primary bg-white text-[var(--hx-green)] hover:bg-white/90 shadow-none px-8 py-3">
                Explore activities
              </Link>
            ) : (
              <>
                <Link to="/signup" className="btn-primary bg-white text-[var(--hx-green)] hover:bg-white/90 shadow-none px-8 py-3">
                  Get started — it's free
                </Link>
                <Link to="/login" className="btn-secondary border-white/30 text-white bg-white/10 hover:bg-white/20 hover:border-white/50 px-8 py-3">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

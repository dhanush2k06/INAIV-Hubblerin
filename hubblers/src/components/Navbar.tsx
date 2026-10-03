import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/inaiv_logo.png'

interface NavbarProps {
  role: string | null
  onLogout: () => void
}

export function Navbar({ role, onLogout }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/events')
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[var(--hx-green-160)]">
      {/* Top bar: Logo + Nav + Search + Auth */}
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-3 px-4 py-3 sm:gap-6 sm:px-7">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <img
            src={logo}
            alt="HubblerX"
            className="h-7 w-auto object-contain transition-transform duration-200 group-hover:scale-105 sm:h-9"
          />
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/events"
            className={`rounded-tag px-3.5 py-1.5 text-sm font-[Manrope] font-medium transition-all duration-150 ${
              isActive('/events')
                ? 'bg-[var(--hx-green)] text-white font-semibold'
                : 'text-[var(--hx-text-muted)] hover:bg-[var(--hx-green-90)] hover:text-[var(--hx-green)]'
            }`}
          >
            Events
          </Link>
          <Link
            to="/about"
            className={`rounded-tag px-3.5 py-1.5 text-sm font-[Manrope] font-medium transition-all duration-150 ${
              isActive('/about')
                ? 'bg-[var(--hx-green)] text-white font-semibold'
                : 'text-[var(--hx-text-muted)] hover:bg-[var(--hx-green-90)] hover:text-[var(--hx-green)]'
            }`}
          >
            About
          </Link>
          {!role && (
            <Link
              to="/organizer-login"
              className={`rounded-tag px-3.5 py-1.5 text-sm font-[Manrope] font-medium transition-all duration-150 ${
                isActive('/organizer-login')
                  ? 'bg-[var(--hx-green)] text-white font-semibold'
                  : 'text-[var(--hx-text-muted)] hover:bg-[var(--hx-green-90)] hover:text-[var(--hx-green)]'
              }`}
            >
              For Organizers
            </Link>
          )}
        </nav>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-sm items-center gap-2 rounded-btn border border-[var(--hx-green-160)] bg-[var(--hx-green-40)] px-3 py-1.5 text-sm text-[var(--hx-text-muted)] focus-within:border-[var(--hx-green)] focus-within:bg-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-[var(--hx-green-650)]" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, workshops…"
            className="w-full bg-transparent font-['DM_Sans'] text-sm text-[var(--hx-text-primary)] placeholder-[var(--hx-text-muted)] focus:outline-none"
          />
        </form>

        {/* Location pill */}
        <div className="hidden xl:flex items-center gap-1 text-sm text-[var(--hx-text-muted)]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--hx-green)]" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z" />
          </svg>
          <span className="font-[Manrope] text-xs font-medium">All Locations</span>
        </div>

        {/* Auth */}
        <div className="hidden items-center gap-3 md:flex shrink-0">
          {!role ? (
            <>
              <Link to="/login" className="btn-tertiary text-sm">Sign in</Link>
              <Link to="/signup" className="btn-primary text-sm">Get Started</Link>
            </>
          ) : (
            <>
              <Link
                to="/dashboard"
                className="btn-tertiary text-sm"
              >
                Dashboard
              </Link>
              <span
                className="hx-tag"
              >
                {role === 'COLLEGE_ADMIN' ? 'College' : role}
              </span>
              <Link
                to="/dashboard?tab=profile"
                title="Profile & Settings"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--hx-green-160)] bg-[var(--hx-green-40)] text-[var(--hx-green)] transition hover:border-[var(--hx-green)] hover:bg-[var(--hx-green-90)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                </svg>
              </Link>
              <button
                onClick={onLogout}
                className="btn-secondary text-sm"
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-btn border border-[var(--hx-green-160)] bg-white text-[var(--hx-green)] transition hover:border-[var(--hx-green)] hover:bg-[var(--hx-green-40)]"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="border-t border-[var(--hx-green-160)] bg-white px-4 py-4 md:hidden animate-fadeIn">
          {/* Mobile search bar */}
          <form
            onSubmit={(e) => {
              handleSearch(e)
              setIsMenuOpen(false)
            }}
            className="mb-3 flex items-center gap-2 rounded-btn border border-[var(--hx-green-160)] bg-[var(--hx-green-40)] px-3 py-2 text-sm text-[var(--hx-text-muted)] focus-within:border-[var(--hx-green)] focus-within:bg-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-[var(--hx-green-650)]" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, workshops…"
              className="w-full bg-transparent font-['DM_Sans'] text-sm text-[var(--hx-text-primary)] placeholder-[var(--hx-text-muted)] focus:outline-none"
            />
          </form>

          <nav className="flex flex-col gap-1">
            <Link
              to="/events"
              onClick={() => setIsMenuOpen(false)}
              className={`rounded-btn px-4 py-2.5 text-sm font-[Manrope] font-medium transition ${
                isActive('/events')
                  ? 'bg-[var(--hx-green)] text-white font-semibold'
                  : 'text-[var(--hx-text-muted)] hover:bg-[var(--hx-green-90)] hover:text-[var(--hx-green)]'
              }`}
            >
              Events
            </Link>

            <Link
              to="/about"
              onClick={() => setIsMenuOpen(false)}
              className={`rounded-btn px-4 py-2.5 text-sm font-[Manrope] font-medium transition ${
                isActive('/about')
                  ? 'bg-[var(--hx-green)] text-white font-semibold'
                  : 'text-[var(--hx-text-muted)] hover:bg-[var(--hx-green-90)] hover:text-[var(--hx-green)]'
              }`}
            >
              About
            </Link>

            <Link
              to="/contact"
              onClick={() => setIsMenuOpen(false)}
              className={`rounded-btn px-4 py-2.5 text-sm font-[Manrope] font-medium transition ${
                isActive('/contact')
                  ? 'bg-[var(--hx-green)] text-white font-semibold'
                  : 'text-[var(--hx-text-muted)] hover:bg-[var(--hx-green-90)] hover:text-[var(--hx-green)]'
              }`}
            >
              Contact
            </Link>

            <Link
              to="/organizer-login"
              onClick={() => setIsMenuOpen(false)}
              className={`rounded-btn px-4 py-2.5 text-sm font-[Manrope] font-medium transition ${
                isActive('/organizer-login')
                  ? 'bg-[var(--hx-green)] text-white font-semibold'
                  : 'text-[var(--hx-text-muted)] hover:bg-[var(--hx-green-90)] hover:text-[var(--hx-green)]'
              }`}
            >
              For Organizers
            </Link>

            <div className="my-2 h-px bg-[var(--hx-green-160)]" />

            {!role ? (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="btn-secondary w-full justify-center py-2.5"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="btn-primary w-full justify-center py-2.5"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="btn-primary w-full justify-center py-2.5"
                >
                  Dashboard
                </Link>
                <Link
                  to="/dashboard?tab=tickets"
                  onClick={() => setIsMenuOpen(false)}
                  className="btn-secondary w-full justify-center py-2.5"
                >
                  My Tickets
                </Link>
                <Link
                  to="/dashboard?tab=profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="btn-secondary w-full justify-center py-2.5"
                >
                  My Profile
                </Link>
                <button
                  onClick={() => { onLogout(); setIsMenuOpen(false) }}
                  className="w-full rounded-btn border border-red-200 bg-red-50 py-2.5 text-center text-sm font-[Manrope] font-semibold text-red-600 hover:bg-red-100 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}


import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/inaiv_logo.png'

interface NavbarProps {
  role: string | null
  onLogout: () => void
}

export function Navbar({ role, onLogout }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Events', href: '/events' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ]

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
        
        {/* Left: Brand Logo */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <img src={logo} alt="INAIV Logo" className="h-10 w-auto sm:h-12 object-contain transition-transform duration-200 group-hover:scale-105" />
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                isActive(link.href)
                  ? 'bg-slate-100 font-semibold text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: Auth Action Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          {!role ? (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="rounded-full px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-95"
              >
                Sign Up
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-200 transition"
              >
                Dashboard
              </Link>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-600">
                {role === 'COLLEGE_ADMIN' ? 'COLLEGE' : role}
              </span>
              <Link
                to="/dashboard?tab=profile"
                title="Profile & Settings"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-black hover:text-black"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                </svg>
              </Link>
              <button
                onClick={onLogout}
                className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:border-black hover:text-black transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-400"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden animate-fadeIn">
          <nav className="flex flex-col gap-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  isActive(link.href)
                    ? 'bg-slate-100 font-bold text-slate-950'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="my-2 h-px bg-slate-100" />

            {!role ? (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full rounded-xl bg-slate-950 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full rounded-xl bg-slate-100 py-2.5 text-center text-sm font-bold text-slate-900"
                >
                  Go to Dashboard ({role})
                </Link>
                <Link
                  to="/dashboard?tab=profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-700"
                >
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    onLogout()
                    setIsMenuOpen(false)
                  }}
                  className="w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-center text-sm font-semibold text-red-600"
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

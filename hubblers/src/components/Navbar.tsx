import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/inaiv_logo.png'

interface NavbarProps {
  role: string | null
  onLogout: () => void
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

type SectionItem = { label: string; href: string }
type RoleKey = 'STUDENT' | 'COLLEGE_ADMIN' | 'SUPPORT'
type Sections = Record<RoleKey, SectionItem[]>

const sections: Sections = {
  STUDENT: [
    { label: '📊 Overview', href: '/dashboard?tab=overview' },
    { label: '⚡ Community Feed', href: '/dashboard?tab=feed' },
    { label: '🤝 Connections', href: '/dashboard?tab=connections' },
    { label: '🏆 Rewards & Badges', href: '/dashboard?tab=rewards' },
    { label: '🥇 Leaderboard', href: '/dashboard?tab=leaderboard' },
    { label: '📜 Certificates', href: '/dashboard?tab=certificates' },
    { label: '🛍️ XP Store', href: '/dashboard?tab=store' },
  ],
  COLLEGE_ADMIN: [
    { label: 'Overview', href: '/dashboard?tab=overview' },
    { label: 'Registration Base', href: '/dashboard?tab=registrations' },
    { label: 'My Events', href: '/dashboard?tab=events' },
  ],
  SUPPORT: [
    { label: 'Review', href: '/dashboard' },
    { label: 'Reports', href: '/dashboard' },
  ],
}

function isRoleKey(role: string): role is RoleKey {
  return role === 'STUDENT' || role === 'COLLEGE_ADMIN' || role === 'SUPPORT'
}

export function Navbar({ role, onLogout, theme, toggleTheme }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1 sm:px-6 lg:px-8">
        <div>
          <Link to="/" className="flex items-center gap-2">
<img src={logo} alt="INAIV Logo" className="h-9 w-auto sm:h-14" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 lg:flex">
          <nav className="flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-slate-600 transition hover:text-emerald-500 dark:text-slate-200 dark:hover:text-white">
              Home
            </Link>
            {role !== 'COLLEGE_ADMIN' && (
              <Link to="/events" className="text-sm font-medium text-slate-600 transition hover:text-emerald-500 dark:text-slate-200 dark:hover:text-white">
                Events
              </Link>
            )}
            {role === 'COLLEGE_ADMIN' && (
              <Link to="/dashboard?tab=registrations" className="text-sm font-medium text-emerald-600 font-semibold transition hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-white">
                Registration Base
              </Link>
            )}
            <Link to="/about" className="text-sm font-medium text-slate-600 transition hover:text-emerald-500 dark:text-slate-200 dark:hover:text-white">
              About
            </Link>
            <Link to="/contact" className="text-sm font-medium text-slate-600 transition hover:text-emerald-500 dark:text-slate-200 dark:hover:text-white">
              Contact
            </Link>
          </nav>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

{!role ? (
            <div className="flex items-center gap-4">
              <Link to="/organizer-login" className="hidden text-xs font-semibold text-slate-500 transition hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400 sm:inline-block">
                Organizer Portal
              </Link>
              <Link to="/login" className="text-sm font-medium text-slate-600 transition hover:text-emerald-500 dark:text-slate-200 dark:hover:text-white">
                Login
              </Link>
<Link to="/signup" className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-400">
                Sign Up
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {role}
              </span>
              <Link
                to="/dashboard"
                title="Go to Dashboard"
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-500 bg-slate-100 text-slate-700 shadow-sm transition hover:scale-105 hover:border-emerald-400 hover:shadow-md dark:bg-slate-800 dark:text-slate-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                </svg>
              </Link>
              <button onClick={onLogout} className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-400">
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Actions & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={toggleTheme}
            className="relative flex h-10 w-16 items-center rounded-full bg-slate-100 p-1 transition-colors duration-300 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
            aria-label="Toggle theme"
          >
            <div className={`flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:bg-emerald-500 ${
              theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
            }`}>
            </div>
          </button>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white/50 text-slate-600 shadow-sm transition-all duration-300 hover:border-emerald-500 hover:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:bg-slate-900 lg:hidden"
            aria-label="Toggle menu"
          >
            <span className={`block h-0.5 w-5 bg-current transition-all duration-300 ${isMenuOpen ? 'translate-y-1.5 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-5 bg-current transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-5 bg-current transition-all duration-300 ${isMenuOpen ? '-translate-y-1.5 -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-slate-200 bg-white p-4 transition-colors dark:border-slate-800 dark:bg-slate-950 lg:hidden">
          <nav className="flex flex-col gap-4">
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-slate-600 dark:text-slate-200">Home</Link>
            {role !== 'COLLEGE_ADMIN' && (
              <Link to="/events" onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-slate-600 dark:text-slate-200">Events</Link>
            )}
            {role === 'COLLEGE_ADMIN' && (
              <Link to="/dashboard?tab=registrations" onClick={() => setIsMenuOpen(false)} className="text-base font-semibold text-emerald-500 dark:text-emerald-400">Registration Base</Link>
            )}
            <Link to="/about" onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-slate-600 dark:text-slate-200">About</Link>
            <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-slate-600 dark:text-slate-200">Contact</Link>
            
            {role && isRoleKey(role) && (
              <>
                <div className="h-px bg-slate-200 dark:bg-slate-800" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Dashboard</p>
                {sections[role].map((item) => (
                  <Link 
                    key={item.label} 
                    to={item.href} 
                    onClick={() => setIsMenuOpen(false)} 
                    className="text-base font-medium text-slate-600 dark:text-slate-200"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                >
                  <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-500 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-bold text-slate-900 dark:text-white">My Account</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{role}</span>
                  </span>
                </Link>
              </>
            )}

            <div className="h-px bg-slate-200 dark:bg-slate-800" />
{!role ? (
              <div className="flex flex-col gap-3">
<Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-center text-base font-medium text-slate-600 dark:text-slate-200">Login</Link>
                <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="rounded-xl bg-emerald-500 py-3 text-center font-bold text-slate-950">Sign Up</Link>
              </div>
            ) : (
              <button onClick={() => { onLogout(); setIsMenuOpen(false); }} className="rounded-xl bg-rose-500 py-3 font-bold text-white">Logout</button>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

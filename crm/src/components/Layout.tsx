import { Outlet, Link, NavLink } from 'react-router-dom'

interface LayoutProps {
  role: string | null
  onLogout: () => void
}

const navItems = [
  { label: 'Overview', to: '/' },
  { label: 'Students', to: '/students' },
  { label: 'Organizers', to: '/organizers' },
  { label: 'Events', to: '/events' },
  { label: 'Activity', to: '/activity' },
]

export function Layout({ role, onLogout }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      <aside className="hidden h-screen w-64 shrink-0 flex-col gap-6 border-r border-slate-800 bg-slate-900/60 px-4 py-6 lg:flex lg:shrink-0">
        <div className="px-2">
          <p className="font-display text-lg font-bold text-white">HubblerX CRM</p>
          <p className="text-xs text-slate-500">Admin Control Panel</p>
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `rounded-2xl border px-4 py-3 text-sm transition ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-emerald-500 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <p className="rounded-2xl bg-slate-900 px-4 py-2 text-xs text-slate-400">
            Signed in as <span className="font-semibold text-slate-200">{role ?? 'Admin'}</span>
          </p>
          <button
            onClick={onLogout}
            className="w-full rounded-2xl bg-rose-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-400"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="h-screen flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-10">
        <div className="lg:hidden mb-6 flex items-center justify-between">
          <Link to="/" className="font-display text-lg font-bold text-white">
            HubblerX CRM
          </Link>
          <button onClick={onLogout} className="rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-bold text-white">
            Logout
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  )
}

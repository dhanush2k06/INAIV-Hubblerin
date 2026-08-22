import { Link } from 'react-router-dom'

interface SidebarProps {
  role: string | null
}

type SectionItem = { label: string; href: string }

type RoleKey = 'STUDENT' | 'COLLEGE_ADMIN' | 'SUPPORT'

type Sections = Record<RoleKey, SectionItem[]>

const sections: Sections = {
  STUDENT: [
    { label: 'Overview', href: '/dashboard' },
    { label: 'Profile', href: '/dashboard' },
  ],
  COLLEGE_ADMIN: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Programs', href: '/dashboard' },
  ],
  SUPPORT: [
    { label: 'Review', href: '/dashboard' },
    { label: 'Reports', href: '/dashboard' },
  ],
}

function isRoleKey(role: string): role is RoleKey {
  return role === 'STUDENT' || role === 'COLLEGE_ADMIN' || role === 'SUPPORT'
}

export function Sidebar({ role }: SidebarProps) {
  if (!role || !isRoleKey(role)) return null

  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-6 border-r border-slate-800 bg-slate-950 px-4 py-6 lg:flex">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Navigation</p>
        {sections[role].map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="block rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-500 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  )
}


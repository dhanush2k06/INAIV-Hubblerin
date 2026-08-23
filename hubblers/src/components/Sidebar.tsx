import { Link, useSearchParams } from 'react-router-dom'

interface SidebarProps {
  role: string | null
}

type SectionItem = { label: string; href: string; tabKey?: string }

type RoleKey = 'STUDENT' | 'COLLEGE_ADMIN' | 'SUPPORT'

type Sections = Record<RoleKey, SectionItem[]>

const sections: Sections = {
  STUDENT: [
    { label: '📊 Overview & Events', href: '/dashboard?tab=overview', tabKey: 'overview' },
    { label: '⚡ Community Feed', href: '/dashboard?tab=feed', tabKey: 'feed' },
    { label: '🤝 My Connections', href: '/dashboard?tab=connections', tabKey: 'connections' },
    { label: '🏆 Rewards & Badges', href: '/dashboard?tab=rewards', tabKey: 'rewards' },
    { label: '🥇 XP Leaderboard', href: '/dashboard?tab=leaderboard', tabKey: 'leaderboard' },
    { label: '📜 Verified Certificates', href: '/dashboard?tab=certificates', tabKey: 'certificates' },
    { label: '🛍️ XP Reward Store', href: '/dashboard?tab=store', tabKey: 'store' },
    { label: '🎒 Wardrobe & Vouchers', href: '/dashboard?tab=inventory', tabKey: 'inventory' },
  ],
  COLLEGE_ADMIN: [
    { label: 'Overview', href: '/dashboard?tab=overview', tabKey: 'overview' },
    { label: '👥 Registration Base (CRM)', href: '/dashboard?tab=registrations', tabKey: 'registrations' },
    { label: '🎪 My Events', href: '/dashboard?tab=events', tabKey: 'events' },
  ],
  SUPPORT: [
    { label: 'Review', href: '/dashboard?tab=review', tabKey: 'review' },
    { label: 'Reports', href: '/dashboard?tab=reports', tabKey: 'reports' },
  ],
}

function isRoleKey(role: string): role is RoleKey {
  return role === 'STUDENT' || role === 'COLLEGE_ADMIN' || role === 'SUPPORT'
}

export function Sidebar({ role }: SidebarProps) {
  const [searchParams] = useSearchParams()
  const currentTab = searchParams.get('tab') || 'overview'

  if (!role || !isRoleKey(role)) return null

  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-6 border-r border-slate-800 bg-slate-950 px-4 py-6 lg:flex">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 px-2">Navigation</p>
        <div className="space-y-1.5 pt-2">
          {sections[role].map((item) => {
            const isActive = currentTab === (item.tabKey || 'overview')
            return (
              <Link
                key={item.label}
                to={item.href}
                className={`block rounded-2xl border px-4 py-3 text-xs font-bold transition ${
                  isActive
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-sm'
                    : 'border-slate-800/80 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

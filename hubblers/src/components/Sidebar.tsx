import { Link, useSearchParams } from 'react-router-dom'

interface SidebarProps {
  role: string | null
}

type SectionItem = { label: string; icon: string; href: string; tabKey?: string }
type RoleKey = 'STUDENT' | 'COLLEGE_ADMIN' | 'SUPPORT'
type Sections = Record<RoleKey, SectionItem[]>

const sections: Sections = {
  STUDENT: [
    { label: 'Overview & Events',     icon: '◈', href: '/dashboard?tab=overview',     tabKey: 'overview' },
    { label: 'Profile & Settings',    icon: '◎', href: '/dashboard?tab=profile',      tabKey: 'profile' },
    { label: 'Community Feed',        icon: '⊕', href: '/dashboard?tab=feed',         tabKey: 'feed' },
    { label: 'My Connections',        icon: '⊞', href: '/dashboard?tab=connections',  tabKey: 'connections' },
    { label: 'Rewards & Badges',      icon: '◉', href: '/dashboard?tab=rewards',      tabKey: 'rewards' },
    { label: 'XP Leaderboard',        icon: '△', href: '/dashboard?tab=leaderboard',  tabKey: 'leaderboard' },
    { label: 'Verified Certificates', icon: '✦', href: '/dashboard?tab=certificates', tabKey: 'certificates' },
    { label: 'XP Reward Store',       icon: '⊛', href: '/dashboard?tab=store',        tabKey: 'store' },
    { label: 'Wardrobe & Vouchers',   icon: '⊘', href: '/dashboard?tab=inventory',    tabKey: 'inventory' },
  ],
  COLLEGE_ADMIN: [
    { label: 'Overview',              icon: '◈', href: '/dashboard?tab=overview',       tabKey: 'overview' },
    { label: 'College Profile',       icon: '◎', href: '/dashboard?tab=profile',        tabKey: 'profile' },
    { label: 'Registrations (CRM)',   icon: '⊞', href: '/dashboard?tab=registrations',  tabKey: 'registrations' },
    { label: 'My Events',             icon: '⊕', href: '/dashboard?tab=events',         tabKey: 'events' },
  ],
  SUPPORT: [
    { label: 'Review',  icon: '◎', href: '/dashboard?tab=review',  tabKey: 'review' },
    { label: 'Reports', icon: '△', href: '/dashboard?tab=reports', tabKey: 'reports' },
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
    <aside className="hidden w-[264px] shrink-0 flex-col border-r border-[var(--hx-green-160)] bg-[var(--hx-surface)] px-3 py-5 lg:flex">
      {/* Role badge */}
      <div className="mb-4 px-2">
        <span className="hx-tag">
          {role === 'COLLEGE_ADMIN' ? 'College Admin' : role === 'SUPPORT' ? 'Support' : 'Student'}
        </span>
      </div>

      {/* Nav label */}
      <p className="mb-2 px-2 font-[Manrope] text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--hx-text-muted)]">
        Navigation
      </p>

      <nav className="flex flex-col gap-0.5">
        {sections[role].map((item) => {
          const isActive = currentTab === (item.tabKey || 'overview')
          return (
            <Link
              key={item.label}
              to={item.href}
              className={`flex items-center gap-2.5 rounded-btn px-3 py-2.5 text-sm font-[Manrope] font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[var(--hx-green)] text-white font-semibold'
                  : 'text-[var(--hx-text-muted)] hover:bg-[var(--hx-green-90)] hover:text-[var(--hx-green)]'
              }`}
            >
              <span className={`w-4 shrink-0 text-center text-xs ${isActive ? 'text-white/80' : 'text-[var(--hx-green-350)]'}`}>
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

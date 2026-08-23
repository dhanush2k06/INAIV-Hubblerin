export interface XpLevel {
  level: number
  title: string
  minXp: number
  maxXp: number | null
  icon: string
  badgeId: string
  perks: string
}

export const XP_VALUES = {
  REGISTRATION: 5,
  ATTENDANCE: 20,
  WORKSHOP: 25,
  COMPETITION: 30,
  VOLUNTEERING: 40,
  FEEDBACK: 5,
  CERTIFICATE: 25,
  REFERRAL: 20,
} as const

export type XpActivityType = keyof typeof XP_VALUES | 'REWARD_REDEEM' | 'BONUS' | 'ADMIN_ADJUSTMENT'

export const LEVELS: XpLevel[] = [
  {
    level: 1,
    title: 'Novice Hubbler',
    minXp: 0,
    maxXp: 49,
    icon: '🌱',
    badgeId: 'LEVEL_1',
    perks: 'Access to public events & basic reward store items',
  },
  {
    level: 2,
    title: 'Campus Explorer',
    minXp: 50,
    maxXp: 149,
    icon: '🧭',
    badgeId: 'LEVEL_2',
    perks: 'Unlock Profile Themes & Referral bonuses',
  },
  {
    level: 3,
    title: 'Rising Star',
    minXp: 150,
    maxXp: 299,
    icon: '⭐',
    badgeId: 'LEVEL_3',
    perks: 'Unlock Profile Frames & Early Workshop RSVPs',
  },
  {
    level: 4,
    title: 'Event Specialist',
    minXp: 300,
    maxXp: 499,
    icon: '🎯',
    badgeId: 'LEVEL_4',
    perks: 'Unlock Special Titles & 25% Event Discount Vouchers',
  },
  {
    level: 5,
    title: 'Campus Champion',
    minXp: 500,
    maxXp: 799,
    icon: '🏆',
    badgeId: 'LEVEL_5',
    perks: 'Unlock 50% Event Discount Vouchers & Exclusive Badges',
  },
  {
    level: 6,
    title: 'Hubbler Master',
    minXp: 800,
    maxXp: 1199,
    icon: '⚡',
    badgeId: 'LEVEL_6',
    perks: 'VIP Early Access Pass to high-demand hackathons',
  },
  {
    level: 7,
    title: 'Grandmaster',
    minXp: 1200,
    maxXp: 1799,
    icon: '🔥',
    badgeId: 'LEVEL_7',
    perks: 'Golden Profile Glow & Free Event Pass Vouchers',
  },
  {
    level: 8,
    title: 'Platform Legend',
    minXp: 1800,
    maxXp: 2499,
    icon: '👑',
    badgeId: 'LEVEL_8',
    perks: 'Diamond Laurel Avatar & Priority Event Selection',
  },
  {
    level: 9,
    title: 'Mythic Achiever',
    minXp: 2500,
    maxXp: 3499,
    icon: '💎',
    badgeId: 'LEVEL_9',
    perks: 'Exclusive Mythic Titles & VIP Community Lounge Access',
  },
  {
    level: 10,
    title: 'Hubbler Immortal',
    minXp: 3500,
    maxXp: null,
    icon: '🌌',
    badgeId: 'LEVEL_10',
    perks: 'Max Prestige status, Immortal Hall of Fame plaque',
  },
]

export interface BadgeDefinition {
  id: string
  name: string
  description: string
  icon: string
  category: 'ACHIEVEMENT' | 'MONTHLY' | 'RANKING' | 'EXCLUSIVE'
  criteria: string
}

export const BADGES_CATALOG: BadgeDefinition[] = [
  // Achievement Badges
  {
    id: 'FIRST_STEP',
    name: 'First Step',
    description: 'Registered or attended your very first HubblerX event',
    icon: '🚀',
    category: 'ACHIEVEMENT',
    criteria: 'Register for 1 event',
  },
  {
    id: 'EVENT_ENTHUSIAST',
    name: 'Event Enthusiast',
    description: 'Attended 5 campus events and workshops',
    icon: '🌟',
    category: 'ACHIEVEMENT',
    criteria: 'Attend 5 events',
  },
  {
    id: 'EVENT_VETERAN',
    name: 'Event Veteran',
    description: 'Attended 10 campus events and demonstrated active engagement',
    icon: '🎖️',
    category: 'ACHIEVEMENT',
    criteria: 'Attend 10 events',
  },
  {
    id: 'FIRST_WIN',
    name: 'Podium Finisher',
    description: 'Won or secured a podium position in a campus competition',
    icon: '🥇',
    category: 'ACHIEVEMENT',
    criteria: 'Participate in competition events',
  },
  {
    id: 'WORKSHOP_PRO',
    name: 'Workshop Pro',
    description: 'Attended 3 or more skill-building workshops',
    icon: '🛠️',
    category: 'ACHIEVEMENT',
    criteria: 'Attend 3 workshops',
  },
  {
    id: 'SUPER_VOLUNTEER',
    name: 'Super Volunteer',
    description: 'Volunteered for community & campus organizing activities',
    icon: '🤝',
    category: 'ACHIEVEMENT',
    criteria: 'Participate in volunteering activities',
  },
  {
    id: 'FEEDBACK_GURU',
    name: 'Feedback Guru',
    description: 'Submitted constructive feedback for 3 or more events',
    icon: '💬',
    category: 'ACHIEVEMENT',
    criteria: 'Submit 3 event feedbacks',
  },
  {
    id: 'NETWORK_BUILDER',
    name: 'Super Networker',
    description: 'Invited fellow students to join HubblerX via referral',
    icon: '🌐',
    category: 'ACHIEVEMENT',
    criteria: 'Refer at least 1 student',
  },
  {
    id: 'CERTIFIED_ACHIEVER',
    name: 'Certified Achiever',
    description: 'Earned and verified 3 or more official event certificates',
    icon: '📜',
    category: 'ACHIEVEMENT',
    criteria: 'Earn 3 verified certificates',
  },
  {
    id: 'COLLECTOR',
    name: 'Reward Collector',
    description: 'Redeemed your first reward from the HubblerX XP Store',
    icon: '🎁',
    category: 'ACHIEVEMENT',
    criteria: 'Redeem 1 reward from the store',
  },

  // Monthly Badges
  {
    id: 'MONTHLY_CONTENDER',
    name: 'Monthly Contender',
    description: 'Earned 50+ XP in a single monthly season',
    icon: '🔥',
    category: 'MONTHLY',
    criteria: 'Earn 50+ XP in current month',
  },
  {
    id: 'ACTIVE_PIONEER',
    name: 'Active Pioneer',
    description: 'Participated in at least 3 events during the month',
    icon: '⚡',
    category: 'MONTHLY',
    criteria: '3 activities in a month',
  },

  // Monthly Ranking Badges
  {
    id: 'MONTHLY_GOLD',
    name: 'Monthly Champion',
    description: 'Finished 1st Place on the Monthly XP Leaderboard',
    icon: '👑',
    category: 'RANKING',
    criteria: 'Rank 1 on Monthly Leaderboard',
  },
  {
    id: 'MONTHLY_SILVER',
    name: 'Monthly Runner-Up',
    description: 'Finished 2nd Place on the Monthly XP Leaderboard',
    icon: '🥈',
    category: 'RANKING',
    criteria: 'Rank 2 on Monthly Leaderboard',
  },
  {
    id: 'MONTHLY_BRONZE',
    name: 'Monthly Bronze',
    description: 'Finished 3rd Place on the Monthly XP Leaderboard',
    icon: '🥉',
    category: 'RANKING',
    criteria: 'Rank 3 on Monthly Leaderboard',
  },

  // Exclusive Store Badges
  {
    id: 'BADGE_VIP_PIONEER',
    name: 'VIP Pioneer Badge',
    description: 'Special badge unlocked via the HubblerX Reward Store',
    icon: '💎',
    category: 'EXCLUSIVE',
    criteria: 'Redeem from Reward Store',
  },
  {
    id: 'BADGE_DIAMOND_PATRON',
    name: 'Diamond Patron',
    description: 'Prestige badge unlocked by elite HubblerX achievers',
    icon: '💠',
    category: 'EXCLUSIVE',
    criteria: 'Redeem from Reward Store',
  },
]

export interface SeedReward {
  id: string
  name: string
  description: string
  image: string
  xpCost: number
  category: 'THEME' | 'FRAME' | 'TITLE' | 'BADGE' | 'DISCOUNT' | 'ACCESS'
  minLevel: number
  minXp: number
  active: boolean
  valueData: Record<string, unknown>
}

export const INITIAL_REWARDS: SeedReward[] = [
  // Profile Themes
  {
    id: 'THEME_CYBERPUNK',
    name: 'Cyberpunk Neon Theme',
    description: 'Transform your profile with futuristic cyan & neon purple accents',
    image: '🌌',
    xpCost: 150,
    category: 'THEME',
    minLevel: 2,
    minXp: 50,
    active: true,
    valueData: { themeKey: 'cyberpunk', bgGradient: 'from-fuchsia-950 via-slate-950 to-cyan-950', accentColor: '#06b6d4' },
  },
  {
    id: 'THEME_EMERALD',
    name: 'Emerald Velvet Theme',
    description: 'Lush emerald green glow with premium metallic dark card styling',
    image: '🌿',
    xpCost: 100,
    category: 'THEME',
    minLevel: 2,
    minXp: 50,
    active: true,
    valueData: { themeKey: 'emerald', bgGradient: 'from-emerald-950 via-slate-950 to-teal-950', accentColor: '#10b981' },
  },
  {
    id: 'THEME_GOLDEN',
    name: 'Solar Gold Theme',
    description: 'Gleaming solar gold aura reserved for ambitious achievers',
    image: '☀️',
    xpCost: 250,
    category: 'THEME',
    minLevel: 3,
    minXp: 150,
    active: true,
    valueData: { themeKey: 'golden', bgGradient: 'from-amber-950 via-slate-950 to-yellow-950', accentColor: '#f59e0b' },
  },
  {
    id: 'THEME_MIDNIGHT',
    name: 'Midnight Aurora Theme',
    description: 'Deep cosmic indigo with shimmering northern lights highlights',
    image: '✨',
    xpCost: 200,
    category: 'THEME',
    minLevel: 3,
    minXp: 150,
    active: true,
    valueData: { themeKey: 'midnight', bgGradient: 'from-indigo-950 via-slate-950 to-violet-950', accentColor: '#8b5cf6' },
  },

  // Profile Frames
  {
    id: 'FRAME_DIAMOND',
    name: 'Diamond Hex Border',
    description: 'A sparkling diamond avatar frame for your student profile',
    image: '🔷',
    xpCost: 120,
    category: 'FRAME',
    minLevel: 2,
    minXp: 50,
    active: true,
    valueData: { frameKey: 'diamond', borderClass: 'ring-4 ring-cyan-400 shadow-lg shadow-cyan-500/50' },
  },
  {
    id: 'FRAME_GOLD_LAUREL',
    name: 'Golden Laurel Wreath',
    description: 'Victorious golden laurels framing your profile avatar',
    image: '🌿',
    xpCost: 220,
    category: 'FRAME',
    minLevel: 4,
    minXp: 300,
    active: true,
    valueData: { frameKey: 'gold_laurel', borderClass: 'ring-4 ring-amber-400 shadow-lg shadow-amber-500/50' },
  },
  {
    id: 'FRAME_NEON_PULSE',
    name: 'Neon Pulse Ring',
    description: 'Dynamic animated neon ring with pulsing energetic aura',
    image: '💫',
    xpCost: 180,
    category: 'FRAME',
    minLevel: 3,
    minXp: 150,
    active: true,
    valueData: { frameKey: 'neon_pulse', borderClass: 'ring-4 ring-fuchsia-500 shadow-lg shadow-fuchsia-500/50' },
  },

  // Special Titles
  {
    id: 'TITLE_PRODIGY',
    name: 'Hubbler Prodigy',
    description: 'Display "Hubbler Prodigy" as your prestigious title across HubblerX',
    image: '🎖️',
    xpCost: 80,
    category: 'TITLE',
    minLevel: 2,
    minXp: 50,
    active: true,
    valueData: { titleText: 'Hubbler Prodigy', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  },
  {
    id: 'TITLE_SAMURAI',
    name: 'Code Samurai',
    description: 'Display "Code Samurai" title on your student profile & leaderboard',
    image: '⚔️',
    xpCost: 160,
    category: 'TITLE',
    minLevel: 3,
    minXp: 150,
    active: true,
    valueData: { titleText: 'Code Samurai', badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  },
  {
    id: 'TITLE_PIONEER',
    name: 'Campus Pioneer',
    description: 'Display "Campus Pioneer" title honoring active campus leaders',
    image: '🚀',
    xpCost: 200,
    category: 'TITLE',
    minLevel: 4,
    minXp: 300,
    active: true,
    valueData: { titleText: 'Campus Pioneer', badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  },

  // Exclusive Badges
  {
    id: 'BADGE_VIP_PIONEER',
    name: 'VIP Pioneer Badge',
    description: 'Unlock and proudly showcase the rare VIP Pioneer achievement badge',
    image: '💎',
    xpCost: 300,
    category: 'BADGE',
    minLevel: 4,
    minXp: 300,
    active: true,
    valueData: { badgeId: 'BADGE_VIP_PIONEER' },
  },
  {
    id: 'BADGE_DIAMOND_PATRON',
    name: 'Diamond Patron Badge',
    description: 'The pinnacle badge for the top echelon of HubblerX power users',
    image: '💠',
    xpCost: 500,
    category: 'BADGE',
    minLevel: 5,
    minXp: 500,
    active: true,
    valueData: { badgeId: 'BADGE_DIAMOND_PATRON' },
  },

  // Event Discounts
  {
    id: 'DISCOUNT_50_OFF',
    name: '50% Off Workshop Pass',
    description: 'Get an instant 50% discount coupon code for any paid event or workshop',
    image: '🏷️',
    xpCost: 250,
    category: 'DISCOUNT',
    minLevel: 3,
    minXp: 150,
    active: true,
    valueData: { discountPercent: 50, prefix: 'HUB50' },
  },
  {
    id: 'DISCOUNT_FREE_PASS',
    name: 'Free VIP Event Pass Voucher',
    description: '100% Free VIP ticket entry pass code to any flagship campus event',
    image: '🎟️',
    xpCost: 450,
    category: 'DISCOUNT',
    minLevel: 5,
    minXp: 500,
    active: true,
    valueData: { discountPercent: 100, prefix: 'HUBFREE' },
  },

  // Early Event Access
  {
    id: 'ACCESS_EARLY_BIRD',
    name: '24hr Early Event Access Pass',
    description: 'Register 24 hours in advance for high-demand capped events and hackathons',
    image: '⏱️',
    xpCost: 150,
    category: 'ACCESS',
    minLevel: 2,
    minXp: 50,
    active: true,
    valueData: { accessType: 'EARLY_BIRD_24H', prefix: 'HUBVIP' },
  },
]

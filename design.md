# HubblerX Design Specification

## 1. Product Identity

**Product:** HubblerX\
**Tagline:** **Learn Beyond the Classroom**

HubblerX should feel like a professional student growth platform with
gamification, not a conventional gaming website. The visual language
should communicate learning, discovery, participation, community, and
achievement.

Core experience:

**Discover → Participate → Verify → Achieve → Connect → Grow**

The attached homepage establishes a clean editorial event-discovery
style with dark green, white, thin borders, strong typography, generous
whitespace, and geometric artwork. Preserve this visual character across
future screens.

## 2. Visual Direction

-   Professional
-   Modern
-   Youthful without looking childish
-   Editorial and premium
-   Campus/community oriented
-   Gamified through interaction and data rather than excessive game
    graphics
-   Minimal, clean, and highly readable

Avoid cartoon-heavy interfaces, excessive gradients, neon gaming
aesthetics, excessive shadows, overly rounded cards, and cluttered
dashboards.

## 3. Color System

### Primary

-   Hubbler Green: `#07573F`
-   White: `#FFFFFF`

Use the existing green opacity system for borders, muted text,
backgrounds, and hover states: - 95% strong overlays - 80% secondary
text - 65% muted labels - 35% subtle elements - 16% borders - 09%
hover/shadow backgrounds - 04% subtle surfaces

Primary buttons use green with white text. Active categories use green
with white text. Do not introduce a large new palette without a
functional reason.

## 4. Typography

The current interface uses: - **Manrope** for headings, branding,
labels, buttons, and high-emphasis UI - **DM Sans** for body text and
general interface content

Maintain this pairing. Use tight, strong Manrope headings and readable
DM Sans body copy.

## 5. Layout

Use a centered responsive content container.

Desktop: - Maximum width approximately 1184--1240px - Horizontal padding
around 28px - Generous whitespace - Grid-based category and event
layouts

Mobile: - Reduced horizontal padding - Collapsed navigation - Stacked
hero - One or two event columns depending on viewport - Comfortable
touch targets - No horizontal overflow

## 6. Header and Navigation

Desktop header:

**HubblerX logo → Search → Location → Sign in**

Secondary navigation: - Discover - Competitions - Workshops - College
Fests - Volunteering - For Organizers - My Tickets

After authentication, replace Sign in with profile/avatar, role
indicator, notifications where needed, and dashboard access.

Admin/support access must not appear in public navigation.

## 7. Homepage

The hero should communicate the brand philosophy immediately:

**Learn beyond\
the classroom.**

Supporting text should explain that students discover events, workshops,
competitions, volunteering opportunities, and other experiences.

Primary CTA: **Explore activities**

Retain the existing split hero pattern: - Large green content panel -
White editorial poster panel - Abstract geometric artwork - Minimal copy

## 8. Categories

Use the existing category grid style with simple line icons: -
Workshops - Competitions - College Fests - Volunteering - Seminars

Each category has an icon, label, chevron, hover state, and active
state. Preserve the current circular icon treatment.

## 9. Event Cards

Event cards should contain: - Event artwork/poster - Category tag -
Save/bookmark action - Date - Event title - Organizer - Venue - Event
mode - Registration state - Optional XP reward - Optional verification
badge

Visual style: - Thin border - Small corner radius - White background -
Minimal shadow - Subtle hover lift - Strong typography hierarchy

Prefer abstract geometric/editorial artwork over generic stock images.

## 10. Gamification

Gamification should feel like a professional growth system.

Use: - XP / Experience Points - Levels - Participation streaks -
Achievement badges - Challenges - Milestones - Leaderboards - Rewards

Example:

**Level 8 --- Active Learner**\
1,240 XP\
`████████░░` 80% to Level 9

Do not make every page visually resemble a game.

## 11. Activity Passport

The Activity Passport is a core product element and should look
professional rather than game-like.

Include: - HubblerID - Profile information - XP and level - Verified
activities - Certificates - Achievements - Participation streak -
Skills/interests - Activity timeline - Milestones

Use timelines, compact statistics, achievement cards, and verification
indicators.

## 12. Student Profile

The profile combines professional identity, verified activity history,
and gamification.

Suggested hierarchy: 1. Profile header 2. HubblerID 3. Level / XP 4.
Activity statistics 5. About / education 6. Skills and interests 7.
Activity Passport timeline 8. Certificates 9. Achievements 10.
Connections

The profile should be shareable and professionally credible.

## 13. Social Features

HubblerID is the student's public identity.

Support: - Search by HubblerID - Follow - Connect - Connection
requests - Mutual connections - Achievement posts - Likes/comments -
Privacy controls

Achievement posts should remain simple and professional, for example:

> **Achievement Unlocked**\
> Completed AI Innovation Workshop\
> +25 XP\
> Verified by HubblerX

Do not turn the platform into a generic social-media clone.

## 14. Student Dashboard

Prioritize what the student should do next.

Recommended structure: - Greeting, level, XP, streak - Recommended
activities - Upcoming registered events - Current challenges - Progress
toward next level - Recent achievements - Activity Passport preview -
Leaderboard - Certificates - Rewards - Connections

Keep the dashboard action-oriented and uncluttered.

## 15. Organizer / College Dashboard

Use the same visual language but make it more data-oriented.

Core areas: - Overview - Create Event - Manage Events - Registrations -
QR Check-in - Certificates - Participants - Analytics - Reports

Use tables, compact cards, statistics, charts, filters, and status
badges.

## 16. Admin / Support CRM

Use a more operational layout while retaining the HubblerX visual
system.

Use: - Dense tables - Search - Filters - Status indicators - Moderation
queues - Analytics cards - Audit information - Confirmation dialogs

Admin routes remain hidden from the public site.

## 17. Buttons and Controls

Primary: - Green background - White text - Compact height - Medium
corner radius

Secondary: - White background - Green border - Green text

Tertiary: - Transparent - Green text

Use pill shapes mainly for filters, tags, and status indicators.

## 18. Cards, Borders and Radius

Preferred style: - Thin borders - Small-to-medium corner radius -
Minimal shadows - Strong spacing - Clear grouping

Approximate radius: - Buttons: 7--9px - Cards: 12--14px - Hero:
16--18px - Tags: 4--6px - Circular controls: fully rounded

Avoid excessive glassmorphism.

## 19. Icons and Artwork

Use simple line icons with consistent stroke weight.

Existing icon language includes search, location, calendar, ticket,
user, bookmark, clock, building, workshop, competition, fest,
volunteering, seminar, and navigation.

For event artwork prefer: - Circles - Rings - Grids - Lines - Geometric
shapes - Typography - Abstract compositions

## 20. Responsive Design

The platform must be mobile-first.

Mobile priorities: - Accessible search - Collapsed navigation - Stacked
hero - Compact event cards - Responsive tables or card-based
alternatives - Stacked dashboard statistics - Highly accessible QR
pass - Prominent registration CTA

Do not simply shrink desktop layouts; restructure them when needed.

## 21. Interaction Principles

Interactions should feel fast and intentional.

Use: - Subtle hover transitions - Small card elevation - Clear active
states - Bookmark feedback - XP/level progress animation - Toasts for
successful actions - Loading skeletons - Useful empty states -
Confirmation dialogs for destructive actions

Avoid excessive animation.

## 22. Accessibility

Maintain: - Good contrast - Visible focus states - Keyboard navigation -
Semantic HTML - Accessible labels - Adequate touch targets - Clear form
validation - Clear error messages

Do not communicate important information through color alone.

## 23. Technical Design Constraints

The attached project is a React + Vite + Tailwind CSS application using
React 19, TypeScript, Vite, and Tailwind CSS v4.

Global styling is wired through `src/index.css`; the main UI is
implemented through React components in `src/App.tsx`.

When extending the design: - Reuse existing components and design
tokens - Prefer Tailwind utilities and the existing global CSS system -
Avoid unnecessary dependencies - Preserve responsive behavior - Do not
break existing interactions - Keep component boundaries clean as the
application grows

## 24. Core Design Principle

> **Make learning and participation feel rewarding without making the
> platform look like a game.**

HubblerX should feel like:

**Professional student identity + campus discovery + verified activity
history + subtle gamification**

Every new screen should reinforce:

### **Learn Beyond the Classroom.**

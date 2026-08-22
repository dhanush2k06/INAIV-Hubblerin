# CRM Dashboard Implementation Plan

## Goal
Create a separate, admin-only CRM dashboard to track user (students/organizers) activities. The CRM is NOT visible to regular users and is hosted/deployed separately.

## Steps

### 1. Backend — Add ADMIN role
- [x] Add `ADMIN` to `Role` type in `server/src/types.ts`
- [x] Update `server/src/types.ts` role ENUM to include `ADMIN`

### 2. Backend — Activity logging service
- [x] Create `server/src/services/activityLogger.ts`
- [x] Add activity log Firestore type to `server/src/types.ts`

### 3. Backend — Add activity logging to existing routes
- [x] `server/src/routes/auth.ts` — log login + signup
- [x] `server/src/routes/events.ts` — log register/unregister
- [x] `server/src/routes/users.ts` — log profile updates
- [x] `server/src/routes/colleges.ts` — log college/organizer submit, approve, reject

### 4. Backend — CRM API routes (admin-only)
- [x] Create `server/src/routes/crm.ts`
  - [x] `GET /api/crm/overview` — KPIs
  - [x] `GET /api/crm/users` — searchable/filterable user list
  - [x] `GET /api/crm/users/:id` — user detail + activity timeline
  - [x] `GET /api/crm/events` — events with registration counts
  - [x] `GET /api/crm/analytics` — insights
  - [x] `GET /api/crm/activity` — activity feed
- [x] Mount CRM routes in `server/src/index.ts`
- [x] Add `authorizeRoles('ADMIN')` guard
- [x] Update login route to support ADMIN + SUPPORT email/password auth

### 5. Backend — Firestore rules
- [x] Update `server/firestore.rules` to grant ADMIN read access across collections + activityLogs

### 6. Separate CRM frontend app (standalone, `crm/` folder)
- [x] Create `crm/package.json`
- [x] Create `crm/vite.config.ts`
- [x] Create `crm/index.html`
- [x] Create `crm/src/main.tsx`
- [x] Create `crm/src/App.tsx` + routing
- [x] Create `crm/src/services/api.ts`
- [x] Create `crm/src/services/firebaseAuth.ts`
- [x] Create `crm/src/firebaseClient.ts`
- [x] Create `crm/src/pages/LoginPage.tsx`
- [x] Create `crm/src/pages/OverviewPage.tsx`
- [x] Create `crm/src/pages/StudentsPage.tsx`
- [x] Create `crm/src/pages/OrganizersPage.tsx`
- [x] Create `crm/src/pages/EventsPage.tsx`
- [x] Create `crm/src/pages/ActivityPage.tsx`
- [x] Create `crm/src/pages/UserDetailPage.tsx`
- [x] Create `crm/src/components/Layout.tsx`
- [x] Create `crm/src/index.css`, `vite-env.d.ts`
- [x] Create `crm/tailwind.config.ts`, `postcss.config.js`, `tsconfig*.json`

### 7. Admin seed account
- [x] Create `server/src/seedAdmin.ts` + `seed:admin` npm script
- [x] Set default admin credentials: hubblersgroup@gmail.com / hubblerx47#
- [x] CRM login uses only the admin custom-token flow (prefilled credentials)

### 8. Build & verify
- [x] `npm install` in `crm/`
- [x] Build backend + main app
- [x] Build CRM app separately
- [x] Test admin access + role isolation (users see no CRM)

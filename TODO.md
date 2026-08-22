# CRM Fixes & Visualizations — Task Tracking

## Part 1: CRM Login "Not Found" Fix
- [x] Fix verified — `/api/auth/login` via 5174 now returns 200

## Part 2: CRM User Detail — Firestore Composite Index Error
- [x] Fix verified — user activity query no longer requires a composite index

---

## Part 3: Add Interactive Visualizations to the CRM

### Goal
Enrich the CRM with interactive charts (donut, bars, area trend) using `recharts` to make it interactive and data-driven.

### Steps
- [x] 1. Install `recharts` dependency in `crm/` (v3.10.1)
- [x] 2. Enrich backend `/api/crm/analytics` to return visualization data:
      roleDistribution, verificationStatus, activityByType, activityTrend (7-day)
- [x] 3. Update `crm/src/services/api.ts` `CrmAnalytics` interface + `fetchAnalytics`
- [x] 4. Add interactive charts to `crm/src/pages/OverviewPage.tsx`
- [x] 5. Add activity-by-type chart to `crm/src/pages/ActivityPage.tsx`
- [x] 6. Verify TypeScript compiles and charts render

### Result
- [x] Charts added — donut (role distribution), bars (verification status,
      activity by type, top colleges), area trend (7-day activity).
      recharts installed, TypeScript compiles cleanly on backend and CRM.

### Files to Edit
- `crm/package.json` — add `recharts`
- `hubblers/server/src/routes/crm.ts` — enrich `/analytics`
- `crm/src/services/api.ts` — extend `CrmAnalytics`
- `crm/src/pages/OverviewPage.tsx` — add charts
- `crm/src/pages/ActivityPage.tsx` — add chart


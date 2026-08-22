# CRM Error Resolution TODO

Fix the `npm run lint` error in the CRM folder (ESLint not installed / no config).

## Steps
- [x] Add ESLint devDependencies to `crm/package.json`
- [x] Create `crm/eslint.config.js` (mirroring hubblers setup)
- [x] Install dependencies via `npm install`
- [x] Run `npm run lint` (surfaced 5 errors)
- [x] Fix `react-hooks/set-state-in-effect` in App/Students/Organizers/UserDetail
- [x] Fix `preserve-caught-error` in api.ts
- [x] Re-run `npm run lint` to confirm clean
- [x] Re-run `npm run build` to confirm nothing broke

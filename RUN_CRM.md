# Running the HubblerX CRM as a Separate Monitoring Site

The HubblerX CRM is a **fully isolated admin dashboard** (`crm/`) that is never
bundled with the main user-facing app (`hubblers/`). It runs on its own Vite
port (`5174`) and connects to the same backend + Firebase project, letting
administrators monitor user activities, manage students/organizers, inspect
events, and review the activity feed.

---

## Architecture at a Glance

| Layer        | Dev URL / Port | Path                | Purpose                                  |
| ------------ | -------------- | ------------------- | ---------------------------------------- |
| Hubblers app | http://localhost:5173 | `hubblers/`    | Student-facing main app                  |
| **CRM app**  | **http://localhost:5174** | `crm/`  | **Admin monitoring dashboard (this)**    |
| Backend API  | http://localhost:4000 | `hubblers/server/` | Express + TypeScript REST API          |
| Database     | Firebase Firestore | —                    | `users`, `activityLogs`, `events`, etc.  |

- The CRM reads `users`, `colleges`, `events`, `activityLogs`, and `userEvents`
  collections from Firestore.
- Every user action (login, signup, event registration, college submission,
  etc.) is written to the `activityLogs` collection by
  `hubblers/server/src/services/activityLogger.ts`.
- The CRM exposes that data for monitoring via `/api/crm/*` routes in
  `hubblers/server/src/routes/crm.ts`.
- **Security:** All CRM routes require an `ADMIN` role.
  ```ts
  router.use(verifyFirebaseToken, authorizeRoles('ADMIN'))
  ```

---

## Prerequisites

1. **Node.js** (v18+ recommended) and `npm` installed.
2. **Firebase project** credentials configured for the backend
   (`hubblers/server/.env` already has a service-account JSON and env vars).
3. An **ADMIN account** seeded for the CRM login (see Step 2 below).

---

## Steps to Run the CRM as a Separate Site

### Step 1 — Install dependencies

Open a terminal in the project root. Install dependencies in **both** the
backend/monorepo and the CRM app:

```bash
npm install
```

Install the CRM dependencies separately (it is an isolated app):

```bash
cd crm
npm install
cd ..
```

> The CRM has its own `package.json`, `vite.config.ts`, and build output, which
> is why it must be installed and run independently from the `hubblers/` app.

---

### Step 2 — Seed the ADMIN account (once)

The CRM only accepts ADMIN logins. Run the provided seed script from the
`hubblers/` directory to create/update the admin user in Firebase Auth + the
`users/{uid}` Firestore doc with the `ADMIN` claim:

```bash
cd hubblers
npm run seed:admin
cd ..
```

Set credentials via environment variables:

```bash
ADMIN_EMAIL="admin@hubblerx.com" \
ADMIN_PASSWORD="ChangeMe123!" \
ADMIN_NAME="HubblerX Admin" \
npm run seed:admin
```

Use the credentials you specified above to log in to the CRM dashboard.

---

### Step 3 — Start the backend API

The CRM depends on the Express backend (port `4000`). Run it in a terminal:

```bash
cd hubblers
npm run dev:server
```

You should see:
```
Hubblers backend listening on http://localhost:4000
```

> Keep this terminal running in the background. Restart it whenever you change
> backend code (the `dev:server` script uses `tsx watch`, so it auto-restarts).

---

### Step 4 — Start the CRM app (the separate monitoring site)

In a **second terminal**, start the CRM's Vite dev server:

```bash
cd crm
npm run dev
```

You should see Vite serving on port **5174**:
```
➜  Local:   http://localhost:5174/
```

> - The CRM dev server proxies `/api` → `http://localhost:4000`
>   (`crm/vite.config.ts`), so requests stay same-origin and never hit CORS.
> - It runs independently of the main app (port 5173), so you can run both at
>   the same time.

---

### Step 5 — Open the CRM dashboard and monitor activities

Open your browser and go to:

```
http://localhost:5174
```

Sign in with the ADMIN credentials you seeded in Step 2. Once signed in, you
can monitor user activity from the sidebar:

| Page                | Route        | What it shows                                             |
| ------------------- | ------------ | --------------------------------------------------------- |
| Overview            | `/`          | KPIs (users, students, organizers, colleges, events, registrations) |
| Students            | `/students`  | Manage / search all student accounts                      |
| Organizers          | `/organizers`| Manage / search college-admin accounts                    |
| Events              | `/events`    | Events with registration counts                           |
| **Activity Feed**   | `/activity`  | **Live timeline of user & admin activity** (LOGIN, SIGNUP, EVENT_REGISTER, COLLEGE_SUBMIT, etc.) |
| User Detail         | `/users/:id` | Per-user activity timeline + registered events            |

To monitor specific user activity, open the **Activity Feed**, click **"View
user"** on any entry, and you'll land on that user's detailed activity
timeline.

---

## Production / Deployment (optional)

Because the CRM is a separate app, you can build and host it independently:

```bash
cd crm
npm run build
npm run preview   # serves the built app locally to verify
```

- The build output goes to `crm/dist/`, which you can deploy to Render as a
  **Static Site** (see `render.yaml` in the project root — `hubblerx-crm` service).
- The backend `/api` must be reachable. Point the CRM at your deployed backend
  by setting the `VITE_API_BASE` env var to the full backend URL, e.g.:

  ```bash
  VITE_API_BASE="https://api.your-backend.com" npm run build
  ```

  (Leaving it empty uses the Vite/static host proxy for same-origin requests.)

> Some backends whitelist origins via `CORS_ORIGIN` / `CORS_ORIGINS` in
> `hubblers/server/.env`. Add the CRM's deployed URL to that list if you deploy
> the CRM to a different origin than the backend.

---

## Troubleshooting

| Symptom                                | Likely cause / fix                                                                   |
| -------------------------------------- | ----------------------------------------------------------------------------------- |
| CRM loads but API calls fail with CORS/connection | Backend not running — start `npm run dev:server` in `hubblers/`. |
| "Not allowed by CORS" on `/api/crm/*`  | The requesting origin isn't whitelisted. Add `http://localhost:5174` (or your host) to `CORS_ORIGIN`/`CORS_ORIGINS` in `hubblers/server/.env`, then restart the backend. |
| `403 Forbidden` on CRM pages           | Logged-in user isn't ADMIN. Re-run `npm run seed:admin` and log in with the ADMIN account. |
| `401 Expired session`                  | Stale Firebase token. Log out and sign in again on `http://localhost:5174`.           |
| Activity feed is empty                 | No `activityLogs` docs yet. Perform a user action (login, signup, event registration) in the main app first. |

---

## Summary

```bash
# Terminal 1 — backend
cd hubblers
npm install
npm run seed:admin
npm run dev:server

# Terminal 2 — CRM (separate site)
cd crm
npm install
npm run dev

# Open http://localhost:5174 and sign in with the ADMIN credentials.
```


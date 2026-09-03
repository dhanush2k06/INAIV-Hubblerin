# Render Production Deployment Guide — HubblerX

Complete guide to deploy the full HubblerX platform on [Render](https://render.com) using the free plan.

---

## Architecture on Render

HubblerX deploys as **3 separate Render services** from a single GitHub repository:

| Service | Render Type | Root Directory | URL |
| :--- | :--- | :--- | :--- |
| **Backend API** | Web Service (Node) | `hubblers` | `https://hubblerx-backend.onrender.com` |
| **Main App** | Static Site | `hubblers` | `https://hubblerx-app.onrender.com` |
| **CRM Dashboard** | Static Site | `crm` | `https://hubblerx-crm.onrender.com` |

All services are defined in [`render.yaml`](./render.yaml) at the project root
and can be deployed together using Render Blueprints.

---

## Option A — Deploy via Blueprint (Recommended, One-Click)

1. Push the project to a GitHub repository.
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**.
3. Connect your GitHub repository.
4. Render will detect `render.yaml` automatically and provision all 3 services.
5. After creation, fill in the secret environment variables in each service
   (marked `sync: false` in `render.yaml`) — see the tables below.

---

## Option B — Deploy Services Manually

### 1. Backend API (Web Service)

| Setting | Value |
| :--- | :--- |
| **Type** | Web Service |
| **Runtime** | Node |
| **Root Directory** | `hubblers` |
| **Build Command** | `npm install && npx tsc -p server/tsconfig.json` |
| **Start Command** | `node dist-server/index.js` |
| **Health Check Path** | `/api/health` |
| **Plan** | Free |

#### Backend Environment Variables

| Variable | Required | Description |
| :--- | :---: | :--- |
| `NODE_ENV` | ✅ | Set to `production` |
| `NODE_VERSION` | ✅ | Set to `20` |
| `PORT` | ✅ | Set to `4000` |
| `JWT_SECRET` | ✅ | High-entropy secret (64+ hex chars) for signing JWT tokens |
| `FIREBASE_PROJECT_ID` | ✅ | Firebase project ID (e.g. `hubblers-9ff7b`) |
| `FIREBASE_CLIENT_EMAIL` | ✅ | Firebase Admin service account email |
| `FIREBASE_PRIVATE_KEY` | ✅ | Full RSA private key including `-----BEGIN PRIVATE KEY-----` headers |
| `FIREBASE_STORAGE_BUCKET` | ✅ | Firebase Storage bucket (e.g. `hubblers-9ff7b.firebasestorage.app`) |
| `CORS_ORIGIN` | ✅ | Main app URL (e.g. `https://hubblerx-app.onrender.com`) |
| `CORS_ORIGINS` | ✅ | Comma-separated additional origins (e.g. `https://hubblerx-crm.onrender.com`) |
| `EMAILJS_SERVICE_ID` | ⚠️ Optional | EmailJS service ID — falls back to console simulator if unset |
| `EMAILJS_TEMPLATE_ID` | ⚠️ Optional | EmailJS registration email template ID |
| `EMAILJS_REPORT_TEMPLATE_ID` | ⚠️ Optional | EmailJS report acknowledgement template ID |
| `EMAILJS_PUBLIC_KEY` | ⚠️ Optional | EmailJS public key |
| `EMAILJS_PRIVATE_KEY` | ⚠️ Optional | EmailJS private key |
| `EMAILJS_REPLY_TO` | ⚠️ Optional | Reply-to address for outgoing emails |

> [!NOTE]
> `RENDER_EXTERNAL_URL` is **automatically injected** by Render into all Web Services.
> The self-ping keep-alive in `server/src/index.ts` reads this variable and
> pings `/api/health` every **4 minutes** to prevent the free-tier cold starts.

---

### 2. Main App (Static Site)

| Setting | Value |
| :--- | :--- |
| **Type** | Static Site |
| **Root Directory** | `hubblers` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |
| **Plan** | Free |

Add a rewrite rule: `/* → /index.html` (SPA routing).

#### Main App Environment Variables

| Variable | Required | Description |
| :--- | :---: | :--- |
| `NODE_ENV` | ✅ | `production` |
| `VITE_API_BASE` | ✅ | Full URL of your backend service (e.g. `https://hubblerx-backend.onrender.com`) |
| `VITE_FIREBASE_API_KEY` | ✅ | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase Auth Domain (e.g. `hubblers-9ff7b.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | ✅ | Firebase Web App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | ⚠️ Optional | Firebase Measurement ID (Analytics) |

---

### 3. CRM Dashboard (Static Site)

| Setting | Value |
| :--- | :--- |
| **Type** | Static Site |
| **Root Directory** | `crm` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |
| **Plan** | Free |

Add a rewrite rule: `/* → /index.html` (SPA routing).

#### CRM Environment Variables

Same Firebase + API variables as the main app (see table above).
The CRM also needs `VITE_API_BASE` pointed at the backend.

---

## Keep-Alive — Preventing Cold Starts

The backend has a built-in self-ping that fires every **4 minutes**, keeping
Render from sleeping the service (Render sleeps free-tier services after 15 min
of inactivity). This activates automatically — no extra configuration needed
since `RENDER_EXTERNAL_URL` is injected by Render.

For an extra layer of reliability, add a free external monitor:

1. Sign up at [uptimerobot.com](https://uptimerobot.com) (free).
2. **Add New Monitor**:
   - Type: `HTTP(s)`
   - Name: `HubblerX API`
   - URL: `https://hubblerx-backend.onrender.com/api/health`
   - Interval: **5 minutes**
3. Click **Create Monitor**.

With both in place, cold starts are effectively eliminated.

---

## Seeding the Admin Account

To create the first CRM admin user, run the seed script locally against your
production Firebase project:

```bash
cd hubblers

# Set your desired admin credentials
ADMIN_EMAIL="admin@hubblerx.com" \
ADMIN_PASSWORD="YourStrongPassword123!" \
ADMIN_NAME="HubblerX Admin" \
npm run seed:admin
```

This creates/updates a user in Firebase Auth and sets the `ADMIN` role claim
on the Firestore `users/{uid}` document. Use these credentials to log in to
the CRM dashboard.

---

## CORS Configuration

After deploying, update the backend's `CORS_ORIGIN` and `CORS_ORIGINS` to match
your actual Render URLs:

```
CORS_ORIGIN  = https://hubblerx-app.onrender.com
CORS_ORIGINS = https://hubblerx-crm.onrender.com
```

If you add a custom domain, add it to `CORS_ORIGINS` as well.

---

## Deployment Checklist

- [ ] Push project to GitHub
- [ ] Create Render services (Blueprint or manual)
- [ ] Set all `Required` environment variables on the backend service
- [ ] Set `VITE_API_BASE` + Firebase vars on both static sites
- [ ] Set `CORS_ORIGIN` / `CORS_ORIGINS` to point at your Render static site URLs
- [ ] Run `npm run seed:admin` locally to create the first admin user
- [ ] Add UptimeRobot monitor on `/api/health` (optional but recommended)
- [ ] Verify `/api/health` returns `{ "message": "Hubblers API is running" }`
- [ ] Log in to main app and CRM with a test account

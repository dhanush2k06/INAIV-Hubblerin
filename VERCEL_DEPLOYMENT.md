# Vercel Production Deployment Guide — HubblerX

Complete guide to deploying the entire HubblerX platform (Main App, Serverless Backend API, and CRM Dashboard) on [Vercel](https://vercel.com).

---

## 🏗️ Architecture on Vercel

On Vercel, HubblerX deploys as **two dedicated projects** from your single GitHub repository:

| Project | What It Runs | Root Directory | Output Directory | Notes |
| :--- | :--- | :---: | :---: | :--- |
| **`hubblerx-app`** | **Fullstack App**: React 19 Frontend + Express API Serverless Functions | `hubblers` | `dist` | Frontend and `/api/*` run on the **same domain** (zero CORS overhead) |
| **`hubblerx-crm`** | **Admin CRM Dashboard**: React 19 + Recharts monitoring SPA | `crm` | `dist` | Client-side SPA connecting to the main app's `/api` |

---

## 📋 Preparation Completed in the Codebase

The following configurations were prepared for Vercel:

1. **Serverless API Bridge** (`hubblers/api/index.ts` & `api/index.ts`):
   - Modularized Express app ([`app.ts`](./hubblers/server/src/app.ts)) so it exports as a Vercel Serverless Function handler without port binding errors.
2. **Dynamic CORS Support**:
   - Backend automatically allows all `*.vercel.app` domains (production and preview branches).
3. **SPA Rewrites & API Routing** ([`hubblers/vercel.json`](./hubblers/vercel.json) & [`crm/vercel.json`](./crm/vercel.json)):
   - Routes `/api/(.*)` to the serverless function while routing all other paths to `/index.html` for clean client-side routing without 404 errors on page refreshes.

---

## 🚀 Step-by-Step Deployment Guide

### Step 1 — Push Code to GitHub

Make sure all your latest changes are committed and pushed:

```bash
git add .
git commit -m "chore: configure Vercel deployment and serverless API handlers"
git push origin main
```

---

### Step 2 — Deploy the Main App & API (`hubblerx-app`)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..."** → **"Project"**.
2. Select your GitHub repository (`INAIV-Hubblerin` / `Project - HubblerX`).
3. In the project configuration:
   - **Project Name**: `hubblerx-app` (or your choice)
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select **`hubblers`**
   - **Build Command**: `npm run build` *(default)*
   - **Output Directory**: `dist` *(default)*
4. Expand **Environment Variables** and add the following:

#### Backend / Serverless Variables
| Variable | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production environment flag |
| `FIREBASE_PROJECT_ID` | `hubblers-9ff7b` | Your Firebase Project ID |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-...@...iam.gserviceaccount.com` | Firebase Admin Service Account email |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...-----END PRIVATE KEY-----` | Firebase private key (with newlines or standard PEM) |
| `FIREBASE_STORAGE_BUCKET` | `hubblers-9ff7b.firebasestorage.app` | Firebase Storage bucket name |
| `JWT_SECRET` | *(Random 32+ character string)* | Secret used for session signing |

#### Optional EmailJS Variables (for event notifications)
| Variable | Value |
| :--- | :--- |
| `EMAILJS_SERVICE_ID` | `service_xxxxxxx` |
| `EMAILJS_TEMPLATE_ID` | `template_xxxxxxx` |
| `EMAILJS_PUBLIC_KEY` | `xxxxxxxxxxxxxx` |
| `EMAILJS_PRIVATE_KEY` | `xxxxxxxxxxxxxx` |
| `EMAILJS_REPLY_TO` | `noreply@hubblerx.com` |

#### Frontend Variables (Exposed via Vite)
| Variable | Value |
| :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Your Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `hubblers-9ff7b.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `hubblers-9ff7b` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `hubblers-9ff7b.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Your Firebase Web App ID |
| `VITE_API_BASE` | *(Leave empty — frontend and API run on the same origin)* |

5. Click **"Deploy"**.
6. Once deployed, note down your production URL (e.g. `https://hubblerx-app.vercel.app`).
   - Test the API health endpoint: `https://hubblerx-app.vercel.app/api/health`
   - You should see: `{"message":"Hubblers API is running"}`

---

### Step 3 — Deploy the CRM Dashboard (`hubblerx-crm`)

1. In the [Vercel Dashboard](https://vercel.com/dashboard), click **"Add New..."** → **"Project"** again.
2. Select the **same** GitHub repository.
3. Configure the CRM project:
   - **Project Name**: `hubblerx-crm`
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select **`crm`**
   - **Build Command**: `npm run build` *(default)*
   - **Output Directory**: `dist` *(default)*
4. Expand **Environment Variables** and add:

| Variable | Value | Notes |
| :--- | :--- | :--- |
| `VITE_API_BASE` | `https://hubblerx-app.vercel.app` | **Target the URL of Project 1 deployed in Step 2** |
| `VITE_FIREBASE_API_KEY` | Your Firebase Web API Key | Same as Project 1 |
| `VITE_FIREBASE_AUTH_DOMAIN` | `hubblers-9ff7b.firebaseapp.com` | Same as Project 1 |
| `VITE_FIREBASE_PROJECT_ID` | `hubblers-9ff7b` | Same as Project 1 |
| `VITE_FIREBASE_STORAGE_BUCKET` | `hubblers-9ff7b.firebasestorage.app` | Same as Project 1 |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your Firebase Sender ID | Same as Project 1 |
| `VITE_FIREBASE_APP_ID` | Your Firebase App ID | Same as Project 1 |

5. Click **"Deploy"**.
6. Once deployed, note down your CRM URL (e.g. `https://hubblerx-crm.vercel.app`).

---

### Step 4 — Seed the Admin Account for CRM Access

The CRM dashboard requires an account with custom claims set to `ADMIN`. If you haven't seeded one yet:

```powershell
$env:ADMIN_EMAIL="admin@hubblerx.com"; $env:ADMIN_PASSWORD="YourSecurePassword123!"; npm run seed:admin
```

Log in to `https://hubblerx-crm.vercel.app` using these credentials to view platform analytics, live activity logs, students, and events.

---

## 🔍 Verification & Troubleshooting

| Check | Expected Result | What to verify if failing |
| :--- | :--- | :--- |
| `GET /api/health` | `{"message":"Hubblers API is running"}` | Check Vercel Function logs under `hubblerx-app` → *Logs* tab |
| Main App Page Refresh | Any route (e.g. `/events`) reloads cleanly | Ensure `hubblers/vercel.json` rewrites are present |
| CRM Page Refresh | Any route (e.g. `/students`) reloads cleanly | Ensure `crm/vercel.json` rewrites are present |
| CRM API Requests | Returns 200 OK | Confirm `VITE_API_BASE` is set to the full URL of `hubblerx-app` without trailing slash |

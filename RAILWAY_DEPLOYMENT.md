# Railway Production Deployment Guide for HubblerX

This guide provides the complete, production-ready steps to deploy the **HubblerX** platform on [Railway](https://railway.app).

---

## 🏗️ Architecture on Railway

HubblerX is composed of three services:
1. **Backend Web Service** (`hubblers/server`): Express + TypeScript REST API on port `4000` (or Railway dynamic `$PORT`).
2. **Main Frontend App** (`hubblers`): Vite + React Single Page Application.
3. **CRM Admin Dashboard** (`crm`): Vite + React Admin Dashboard.

---

## 🚀 1. Backend Service Deployment

### Service Settings
- **Source Directory / Root Directory**: `hubblers`
- **Build Command**: `npm install && npx tsc -p server/tsconfig.json`
- **Start Command**: `node dist-server/index.js`
- **Healthcheck Path**: `/api/health`

### Required Environment Variables (Backend)

Set these under **Variables** in your Railway Backend Service:

| Variable | Description | Example / Note |
| :--- | :--- | :--- |
| `PORT` | Web server port | Auto-provided by Railway (defaults to `4000`) |
| `NODE_ENV` | Environment mode | `production` |
| `JWT_SECRET` | Secret key for custom auth & support session tokens | E.g. `your-high-entropy-jwt-secret-key-32-chars` |
| `FIREBASE_PROJECT_ID` | Firebase Project ID | E.g. `hubblerx-prod` |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin Service Account Email | E.g. `firebase-adminsdk-xxxxx@hubblerx-prod.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin Service Account Private Key | Exact RSA private key including `-----BEGIN PRIVATE KEY-----` |
| `FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket name | E.g. `hubblerx-prod.firebasestorage.app` |
| `CORS_ORIGIN` | Primary Frontend URL | E.g. `https://hubblerx.up.railway.app` or `*` |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins | E.g. `https://hubblerx.up.railway.app,https://hubblerx-crm.up.railway.app` |
| `EMAILJS_SERVICE_ID` | *(Optional)* EmailJS Service ID | E.g. `service_xxxxx` (falls back to simulator if unset) |
| `EMAILJS_TEMPLATE_ID` | *(Optional)* EmailJS Template ID | E.g. `template_xxxxx` |
| `EMAILJS_PUBLIC_KEY` | *(Optional)* EmailJS Public Key | E.g. `user_xxxxx` |
| `EMAILJS_PRIVATE_KEY` | *(Optional)* EmailJS Private Key | E.g. `key_xxxxx` |

> [!TIP]
> The backend automatically detects when running behind reverse proxies like Railway (`app.set('trust proxy', 1)`), handles private keys with literal or escaped newlines (`\n`), and supports all `.railway.app` origins out-of-the-box.

---

## 🌐 2. Main Frontend App Deployment

### Service Settings
- **Source Directory / Root Directory**: `hubblers`
- **Build Command**: `npm install && npm run build`
- **Output Directory / Static Directory**: `dist`
- **Start Command**: `npx serve -s dist -l $PORT` (or deploy as a Static Site)

### Environment Variables (Frontend)

| Variable | Description |
| :--- | :--- |
| `VITE_API_BASE` | URL of your deployed backend service (e.g. `https://hubblerx-backend.up.railway.app`) |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain (e.g. `hubblerx-prod.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID |

---

## 🛡️ 3. CRM Dashboard Deployment

### Service Settings
- **Source Directory / Root Directory**: `crm`
- **Build Command**: `npm install && npm run build`
- **Output Directory / Static Directory**: `dist`
- **Start Command**: `npx serve -s dist -l $PORT`

### Environment Variables (CRM)

| Variable | Description |
| :--- | :--- |
| `VITE_API_BASE` | URL of your deployed backend service |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID |

---

## 🔒 Security Best Practices

1. **Zero Secret Leakage**: Firebase Private Key, EmailJS Private Key, and JWT Secrets are **only** placed in the Backend Web Service variables and never exposed to client Vite builds.
2. **Rate Limiting Protection**: High-frequency API calls are allowed with scaled limits (1500 req / 15 min), while auth brute-force endpoints are strictly bounded (60 req / 15 min).
3. **Automatic Admin Seeding**: To create or promote your primary CRM admin user on Railway, run:
   ```bash
   ADMIN_EMAIL="admin@yourdomain.com" ADMIN_PASSWORD="YourStrongPassword" npm run seed:admin
   ```

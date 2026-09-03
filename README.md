# HubblerX

**A full-stack student-college engagement platform** that connects students, college administrators, and event organizers through role-based access, event management, credit systems, and a dedicated CRM dashboard.

---

## 🏗️ Project Structure

```
Project - HubblerX/
├── CHANGELOG.md               # Centralized change & task tracking log
├── hubblers/                  # Main application
│   ├── src/                   # React frontend (Vite + TypeScript + Tailwind)
│   │   ├── pages/             # Home, Login, Signup, Dashboard, Events, etc.
│   │   ├── components/        # Navbar, Sidebar, UI components
│   │   ├── services/          # API client & Firebase auth
│   │   └── firebaseClient.ts  # Firebase client SDK config
│   ├── server/                # Express backend (TypeScript)
│   │   ├── src/
│   │   │   ├── routes/        # auth, users, events, colleges, dashboard, crm
│   │   │   ├── middleware/    # JWT auth, role guards
│   │   │   ├── services/     # Email (EmailJS), QR code generation
│   │   │   └── schemas/      # Zod validation schemas
│   │   └── .env.example       # Backend env var template
│   └── .env.example           # Frontend env var template
├── crm/                       # Admin CRM dashboard (separate Vite app)
│   ├── src/
│   │   ├── pages/             # Overview, Students, Organizers, Events, Reports
│   │   ├── components/        # Dashboard layout, charts, data tables
│   │   └── services/          # API client & Firebase auth
│   └── .env.example           # CRM env var template
└── .gitignore                 # Root-level gitignore
```

> 📖 **Project History & Task Tracking**: See [CHANGELOG.md](./CHANGELOG.md) for a centralized record of all changes, features, bug fixes, and development milestones.

## ✨ Features

### Main App (`hubblers/`)
- **Multi-role Authentication** — Students, College Admins, Organizers, and Support staff
- **Firebase Auth** — Email/password + Google sign-in with custom claims for role management
- **Event System** — Create, browse, register for events with QR code ticket generation
- **XP & Credits** — Gamified reward system for event participation
- **Role-based Dashboards** — Personalized dashboards per user role
- **College Registration** — Institution onboarding with admin approval workflow
- **Organizer Portal** — Event creation, attendee management, attendance tracking
- **Email Notifications** — Automated welcome, registration, and ticket emails via EmailJS

### CRM Dashboard (`crm/`)
- **Admin Overview** — Platform-wide analytics with charts (Recharts)
- **User Management** — View, search, and manage all students and organizers
- **College Approvals** — Review and approve/reject college registrations
- **Event Moderation** — Monitor events, handle reports
- **Activity Logs** — Track platform activity
- **Report Management** — Review flagged content (spam, scam, fake events)

### Backend API (`hubblers/server/`)
- **Express + TypeScript** — Fully typed REST API
- **Firebase Admin SDK** — Server-side auth verification, Firestore, and Cloud Storage
- **Zod Validation** — Schema-based request validation
- **Rate Limiting** — API abuse protection with `express-rate-limit`
- **Security** — Helmet headers, CORS configuration, JWT session tokens
- **QR Code Generation** — Unique QR tickets for event registrations

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS, Vite |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | Firebase Firestore |
| **Auth** | Firebase Authentication (Email/Password + Google) |
| **Storage** | Firebase Cloud Storage |
| **Email** | EmailJS |
| **Charts** | Recharts (CRM dashboard) |
| **Validation** | Zod |
| **QR Codes** | `qrcode` library |

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ and **npm**
- A **Firebase project** with Authentication, Firestore, and Storage enabled
- An **EmailJS** account (for transactional emails)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/HubblerX.git
cd HubblerX
```

### 2. Install dependencies

```bash
# Main app + backend
cd hubblers
npm install

# CRM dashboard
cd ../crm
npm install
```

### 3. Configure environment variables

```bash
# Backend
cp hubblers/server/.env.example hubblers/server/.env

# Main app frontend
cp hubblers/.env.example hubblers/.env

# CRM frontend
cp crm/.env.example crm/.env
```

Fill in your Firebase credentials, EmailJS keys, and other config in each `.env` file. See the `.env.example` files for documentation on every variable.

### 4. Seed the admin account

```bash
cd hubblers
ADMIN_EMAIL="admin@yourdomain.com" ADMIN_PASSWORD="YourSecurePassword" npm run seed:admin
```

### 5. Start development servers

```bash
# Terminal 1 — Backend API (port 4000)
cd hubblers
npm run dev:server

# Terminal 2 — Main app frontend (port 5173)
cd hubblers
npm run dev

# Terminal 3 — CRM dashboard (port 5174)
cd crm
npm run dev
```

Or start the backend + main frontend together:

```bash
cd hubblers
npm run dev:all
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register a new user (Student / Organizer / College) |
| `POST` | `/api/auth/login` | Login with Firebase ID token |
| `GET` | `/api/auth/me` | Get current authenticated user |
| `GET` | `/api/users/profile` | Fetch user profile |
| `PUT` | `/api/users/profile` | Update user profile |
| `GET` | `/api/events` | List all events |
| `POST` | `/api/events` | Create a new event (Organizers) |
| `POST` | `/api/events/:id/register` | Register for an event |
| `GET` | `/api/events/mine` | Organizer's own events |
| `GET` | `/api/events/registered` | Student's registered events |
| `POST` | `/api/colleges/register` | Register a new college |
| `GET` | `/api/colleges/pending` | List pending college approvals |
| `PUT` | `/api/colleges/approve/:id` | Approve a college (Admin) |
| `PUT` | `/api/colleges/reject/:id` | Reject a college (Admin) |
| `GET` | `/api/dashboard/student` | Student dashboard data |
| `GET` | `/api/dashboard/college` | College admin dashboard data |
| `GET` | `/api/crm/*` | CRM admin endpoints |

## 🏗️ Production Build

```bash
# Build main app + backend
cd hubblers
npm run build

# Build CRM dashboard
cd ../crm
npm run build
```

## 📄 License

This project is proprietary software. See [LICENSE.md](./LICENSE.md) for details.

---

Built with ❤️ by the HubblerX team.

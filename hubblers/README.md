# HubblerX

HubblerX is a student-college engagement platform with role-based access for students, college admins, and support staff.

## Project structure

- `src/` — frontend React application
- `server/` — backend Express + TypeScript API
- `server/sql/schema.sql` — MySQL schema for users and colleges
- `server/.env.example` — server environment variables

## Setup

1. Install project dependencies:

   ```bash
   npm install
   ```

2. Create environment files from the templates:

   ```bash
   # Backend (required)
   cp server/.env.example server/.env

   # Frontend (required)
   cp .env.example .env
   ```

   Then update each `.env` with your Firebase and service configuration.
   See the `.env.example` files for documentation on each variable.

3. If you have a separate CRM dashboard (`../crm/`):

   ```bash
   cd ../crm
   cp .env.example .env
   ```

4. Seed the admin account for the CRM dashboard:

   ```bash
   ADMIN_EMAIL="admin@yourdomain.com" ADMIN_PASSWORD="YourSecurePassword" npm run seed:admin
   ```

## Development

Start the frontend and backend separately:

```bash
npm run dev
```

```bash
npm run dev:server
```

## Production build

To build both frontend and backend for production:

```bash
npm run build
```

## Backend API

Key endpoints:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users/profile`
- `PUT /api/users/profile`
- `POST /api/colleges/register`
- `GET /api/colleges/pending`
- `PUT /api/colleges/approve/:id`
- `PUT /api/colleges/reject/:id`
- `GET /api/dashboard/student`
- `GET /api/dashboard/college`
- `GET /api/dashboard/support`

## Notes

- Firebase is used for authentication and storage.
- MySQL is used for user, college, and QR metadata.
- Tailwind CSS is configured for responsive UI styling.
- JWT is used for backend session protection.

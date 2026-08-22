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

2. Create backend environment file:

   ```bash
   cp server/.env.example server/.env
   ```

   Then update `server/.env` with your Firebase and MySQL configuration.

3. Create the database schema:

   - Run the SQL in `server/sql/schema.sql` against your MySQL instance.
   - Add a support account manually if needed using the commented example insert statement.

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

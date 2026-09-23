# 🐳 Docker Integration Guide — HubblerX

This guide allows you to build and run the entire HubblerX ecosystem (Backend API, Main Student/Organizer App, and Admin CRM Dashboard) on any machine (macOS, Windows, Linux) without needing Node.js, npm, or any local tools installed.

---

## 📋 Prerequisites

- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (Windows / macOS) or **Docker Engine + Docker Compose v2** (Linux).
- Make sure Docker is running on your machine.

---

## ⚡ Quick Start (Run Everything with Docker)

### 1. Clone the repository
```bash
git clone https://github.com/dhanush2k06/INAIV-Hubblerin.git
cd INAIV-Hubblerin
```

### 2. Configure Environment Variables
Copy the unified `.env.example` at the root:
```bash
cp .env.example .env
```
Fill in your Firebase credentials in `.env` (or you can keep your existing `.env` files in `hubblers/server/.env`, `hubblers/.env`, and `crm/.env`).

### 3. Build & Run the Containers
To start all 3 services in production mode:
```bash
docker compose up --build
```
*(Or in detached background mode)*:
```bash
docker compose up -d --build
```

---

## 🌐 Running Services & Ports

Once Docker Compose finishes building and starting, the services are available at:

| Service | Port | Local URL | Description |
| :--- | :---: | :--- | :--- |
| **Main App** | `5173` | [http://localhost:5173](http://localhost:5173) | React frontend for Students & Organizers |
| **CRM Dashboard** | `5174` | [http://localhost:5174](http://localhost:5174) | Admin CRM analytics & moderation portal |
| **Backend API** | `4000` | [http://localhost:4000](http://localhost:4000) | Express TypeScript REST API |
| **API Health Check** | `4000` | [http://localhost:4000/api/health](http://localhost:4000/api/health) | Verifies backend connectivity |

---

## 🛠️ Useful Docker Commands

### View Container Logs
```bash
# View all logs in real time
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend
docker compose logs -f app
docker compose logs -f crm
```

### Stop All Services
```bash
docker compose down
```

### Restart a Service
```bash
docker compose restart backend
```

### Rebuild from Scratch
If you make dependency or code updates and want a fresh build:
```bash
docker compose build --no-cache
docker compose up -d
```

---

## 💻 Development Mode (Live Hot Reloading in Docker)

If you are developing inside Docker and want changes you make in your IDE to reflect instantly without rebuilding images:

```bash
docker compose -f docker-compose.dev.yml up --build
```

This mounts your local files into the containers:
- Backend: auto-reloads via `tsx watch`
- Main App: Vite Hot Module Replacement (HMR)
- CRM: Vite Hot Module Replacement (HMR)

---

## 🛡️ Architecture & Production Design

- **Backend**: Multi-stage Node 20 Alpine build compiling TypeScript to `dist-server/` with production dependencies only.
- **Frontends (App & CRM)**: Multi-stage builds compiling Vite bundles, served through lightweight high-performance **Nginx Alpine** containers.
- **Routing & Proxy**: Both Nginx instances handle SPA history fallback routing (`try_files $uri /index.html`) and transparently reverse-proxy `/api/*` requests to the `backend` container via Docker's internal DNS bridge network (`hubblerx-network`).

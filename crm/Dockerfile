# ==============================================================
# HubblerX Admin CRM Dashboard — Dockerfile
# ==============================================================

# ── Stage 1: Build CRM Assets with Vite ──
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy full CRM source code
COPY . .

# Build production bundle
RUN npm run build

# ── Stage 2: Production Nginx Server ──
FROM nginx:alpine AS runner

# Remove default nginx HTML
RUN rm -rf /usr/share/nginx/html/*

# Copy built CRM assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose CRM dashboard port
EXPOSE 5174

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5174/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

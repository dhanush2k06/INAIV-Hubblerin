# ==============================================================
# HubblerX Main App Frontend — Dockerfile
# ==============================================================

# ── Stage 1: Build Frontend Assets with Vite ──
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy full frontend source code
COPY . .

# Build production client bundle
RUN npm run build:client

# ── Stage 2: Production Nginx Server ──
FROM nginx:alpine AS runner

# Remove default nginx HTML
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose main app port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5173/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

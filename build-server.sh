#!/usr/bin/env sh
# Render backend build script
# Handles both cases: running from repo root or running inside hubblers/
set -e

if [ -d "hubblers" ]; then
  echo "[build-server] Moving into hubblers directory..."
  cd hubblers
fi

echo "[build-server] Installing dependencies in $(pwd)..."
npm install

echo "[build-server] Compiling TypeScript server..."
npx tsc -p server/tsconfig.json

echo "[build-server] Build successful. Output in $(pwd)/dist-server"

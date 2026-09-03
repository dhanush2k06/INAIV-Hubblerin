#!/usr/bin/env sh
# Render backend build script
# Runs from the repo root — navigates into hubblers/ and compiles the server TS
set -e

echo "[build-server] Installing dependencies..."
cd hubblers
npm install

echo "[build-server] Compiling TypeScript server..."
npx tsc -p server/tsconfig.json

echo "[build-server] Done. Output → hubblers/dist-server/"

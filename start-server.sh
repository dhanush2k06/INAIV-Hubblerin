#!/usr/bin/env sh
# Render backend start script
# Handles both cases: running from repo root or running inside hubblers/
set -e

if [ -d "hubblers" ]; then
  cd hubblers
fi

exec node dist-server/index.js

#!/usr/bin/env sh
# Render backend start script
# Runs from the repo root — navigates into hubblers/ and starts the compiled server
set -e

cd hubblers
exec node dist-server/index.js

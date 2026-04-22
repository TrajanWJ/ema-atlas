#!/bin/bash
# ClaudeForge startup script

cd "$(dirname "$0")"

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22 2>/dev/null || true

# Ensure claude is on PATH
export PATH="$HOME/.local/bin:$PATH"

# Load .env
set -a
source .env
set +a

echo "Starting ClaudeForge..."
echo "  Claude CLI: $(which claude 2>/dev/null || echo 'NOT FOUND')"
echo "  Node: $(node --version)"
echo "  Server port: ${SERVER_PORT:-3001}"

# Start combined server + bot
exec node --import tsx packages/server/src/start.ts
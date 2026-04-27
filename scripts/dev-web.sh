#!/usr/bin/env bash
# Run the EMA web shell in dev (Next.js).
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE/../apps/web"

if command -v pnpm >/dev/null 2>&1; then
  exec pnpm dev
elif command -v npm >/dev/null 2>&1; then
  exec npm run dev
else
  echo "neither pnpm nor npm found on PATH"
  exit 1
fi

#!/usr/bin/env bash
# Run the EMA desktop shell (Tauri v2) in dev.
# Expects the daemon and the web dev server to already be running in
# separate terminals.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE/../apps/desktop"

if ! command -v cargo >/dev/null 2>&1; then
  echo "cargo (Rust) not found. Install: https://rustup.rs/"
  exit 1
fi

if command -v pnpm >/dev/null 2>&1; then
  exec pnpm tauri dev
elif command -v npm >/dev/null 2>&1; then
  exec npm run tauri dev
else
  echo "neither pnpm nor npm found on PATH"
  exit 1
fi

#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24"
LOG_DIR="$ROOT/.ema-dev/logs"
PID_DIR="$ROOT/.ema-dev/pids"
WEB_URL="http://localhost:5173/"

mkdir -p "$LOG_DIR" "$PID_DIR"

export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:$PATH"
export npm_config_manage_package_manager_versions=false

cd "$ROOT"

echo "EMA 0.0.5 web dev launcher"
echo "root: $ROOT"
echo "This helper opens the browser web surface. The desktop app is the Tauri bundle in apps/desktop."

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is not available. Install Node/pnpm first."
  exit 1
fi

if ! command -v gleam >/dev/null 2>&1; then
  echo "gleam is not available. Install Gleam/BEAM first."
  exit 1
fi

if ! lsof -nP -iTCP:49555 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "starting EMA daemon stub..."
  (
    cd "$ROOT/apps/daemon"
    gleam run
  ) >"$LOG_DIR/daemon.log" 2>&1 &
  echo "$!" >"$PID_DIR/daemon.pid"
else
  echo "daemon port 49555 already has a listener."
fi

if ! lsof -nP -iTCP:5173 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "starting EMA web surface..."
  pnpm --filter @ema/web dev -- --host 127.0.0.1 --port 5173 >"$LOG_DIR/web.log" 2>&1 &
  echo "$!" >"$PID_DIR/web.pid"
else
  echo "web port 5173 already has a listener."
fi

echo "opening $WEB_URL"
open "$WEB_URL"

echo ""
echo "Logs:"
echo "  $LOG_DIR/daemon.log"
echo "  $LOG_DIR/web.log"
echo ""
echo "Press Ctrl-C to stop watching logs. EMA processes keep running in the background."

tail -n 40 -f "$LOG_DIR/web.log" "$LOG_DIR/daemon.log"

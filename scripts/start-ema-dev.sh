#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24"
LOG_DIR="$ROOT/.ema-dev/logs"
PID_DIR="$ROOT/.ema-dev/pids"
WEB_URL="http://localhost:5173/"
TAIL_LOGS=1

for arg in "$@"; do
  case "$arg" in
    --no-tail)
      TAIL_LOGS=0
      ;;
    -h|--help)
      cat <<EOF
start-ema-dev.sh — start EMA daemon + Next.js web surface

Options:
  --no-tail   Start services, open the browser, then exit instead of tailing logs.
  -h, --help  Show this help.
EOF
      exit 0
      ;;
    *)
      echo "unknown option: $arg" >&2
      exit 2
      ;;
  esac
done

mkdir -p "$LOG_DIR" "$PID_DIR"

export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:$PATH"
export npm_config_manage_package_manager_versions=false

cd "$ROOT"

echo "EMA 0.0.5 web dev launcher"
echo "root: $ROOT"
echo "This helper opens the Next.js browser web surface. The desktop app is the Tauri bundle in apps/desktop."

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
  nohup bash -c '
    set -euo pipefail
    trap "" INT
    cd "$1/apps/daemon"
    exec gleam run
  ' bash "$ROOT" >"$LOG_DIR/daemon.log" 2>&1 &
  daemon_pid="$!"
  echo "$daemon_pid" >"$PID_DIR/daemon.pid"
  disown "$daemon_pid" 2>/dev/null || true
else
  echo "daemon port 49555 already has a listener."
fi

if ! lsof -nP -iTCP:5173 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "starting EMA web surface..."
  nohup bash -c '
    set -euo pipefail
    trap "" INT
    cd "$1"
    exec pnpm --filter @ema/web dev
  ' bash "$ROOT" >"$LOG_DIR/web.log" 2>&1 &
  web_pid="$!"
  echo "$web_pid" >"$PID_DIR/web.pid"
  disown "$web_pid" 2>/dev/null || true
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
if [ "$TAIL_LOGS" -eq 0 ]; then
  echo "EMA launch complete."
  exit 0
fi

echo "Press Ctrl-C to stop watching logs."
tail -n 40 -f "$LOG_DIR/web.log" "$LOG_DIR/daemon.log"

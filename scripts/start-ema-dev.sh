#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
LOG_DIR="$ROOT/.ema-dev/logs"
PID_DIR="$ROOT/.ema-dev/pids"
WEB_URL="http://localhost:5173/"
TAIL_LOGS=1
WAIT_SECONDS=20
USE_LAUNCHCTL="${EMA_USE_LAUNCHCTL:-0}"

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

echo "EMA 0.0.6 web dev launcher"
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

wait_for_port() {
  local name="$1"
  local port="$2"
  local waited=0
  while ! lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; do
    if [ "$waited" -ge "$WAIT_SECONDS" ]; then
      echo "$name did not open port $port within ${WAIT_SECONDS}s." >&2
      return 1
    fi
    sleep 1
    waited=$((waited + 1))
  done
  return 0
}

write_pid_for_port() {
  local name="$1"
  local port="$2"
  local pid
  pid="$(lsof -t -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | head -n 1 || true)"
  if [ -n "$pid" ]; then
    echo "$pid" >"$PID_DIR/$name.pid"
  fi
}

start_service() {
  local name="$1"
  local label="$2"
  local command="$3"
  local log_file="$4"
  if [ "$USE_LAUNCHCTL" -eq 1 ]; then
    launchctl remove "$label" >/dev/null 2>&1 || true
    launchctl submit -l "$label" -- /bin/bash -lc "export PATH='/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'; export npm_config_manage_package_manager_versions=false; $command >>'$log_file' 2>&1"
  else
    nohup bash -lc "$command" </dev/null >"$log_file" 2>&1 &
    echo "$!" >"$PID_DIR/$name.pid"
    disown "$!" 2>/dev/null || true
  fi
}

if ! lsof -nP -iTCP:49555 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "starting EMA daemon stub..."
  start_service \
    daemon \
    org.ema.dev.daemon \
    "cd '$ROOT/apps/daemon' && exec gleam run" \
    "$LOG_DIR/daemon.log"
else
  echo "daemon port 49555 already has a listener."
fi

if ! lsof -nP -iTCP:5173 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "starting EMA web surface..."
  start_service \
    web \
    org.ema.dev.web \
    "cd '$ROOT' && exec pnpm --filter @ema/web dev" \
    "$LOG_DIR/web.log"
else
  echo "web port 5173 already has a listener."
fi

echo "opening $WEB_URL"
wait_for_port daemon 49555
wait_for_port web 5173
write_pid_for_port daemon 49555
write_pid_for_port web 5173
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

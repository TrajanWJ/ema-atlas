#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
PID_DIR="$ROOT/.ema-dev/pids"

DAEMON_PORT=49555
WEB_PORT=5173
GRACE_SECONDS=5

FORCE_PORT_KILL=0
for arg in "$@"; do
  case "$arg" in
    --force-port-kill)
      FORCE_PORT_KILL=1
      ;;
    -h|--help)
      cat <<EOF
stop-ema-dev.sh — clean shutdown companion to start-ema-dev.sh

Reads .ema-dev/pids/{daemon,web}.pid, sends SIGTERM, waits up to ${GRACE_SECONDS}s,
then SIGKILL if still alive. Removes stale pid files. Leaves logs alone.

Options:
  --force-port-kill   Also kill anything listening on ports ${DAEMON_PORT} or
                      ${WEB_PORT} after the pidfile shutdown. Off by default
                      because those ports may be held by an unrelated user
                      session; running with this flag against someone else's
                      daemon is disallowed without coordinator approval
                      (see WORKSPACE-HYGIENE orchestrator non-negotiables).
  -h, --help          Show this help.

Exits 0 whether or not anything was running. Prints "nothing to stop." when
no pidfiles and no ports were acted on.
EOF
      exit 0
      ;;
    *)
      echo "unknown option: $arg" >&2
      echo "see: $0 --help" >&2
      exit 2
      ;;
  esac
done

stopped_any=0

if [ "${EMA_USE_LAUNCHCTL:-0}" = "1" ] && [ "$(uname -s)" = "Darwin" ] && command -v launchctl >/dev/null 2>&1; then
  for label in org.ema.dev.daemon org.ema.dev.web; do
    if launchctl print "gui/$(id -u)/$label" >/dev/null 2>&1; then
      echo "$label: removing launchctl job..."
      launchctl remove "$label" >/dev/null 2>&1 || true
      stopped_any=1
    fi
  done
fi

stop_by_pidfile() {
  local name="$1"
  local pidfile="$PID_DIR/$name.pid"
  if [ ! -f "$pidfile" ]; then
    return 1
  fi
  local pid
  pid="$(tr -d '[:space:]' <"$pidfile" 2>/dev/null || true)"
  if [ -z "$pid" ]; then
    rm -f "$pidfile"
    return 1
  fi
  if ! kill -0 "$pid" 2>/dev/null; then
    echo "$name: pid $pid not alive; removing stale pid file."
    rm -f "$pidfile"
    return 1
  fi
  echo "$name: sending SIGTERM to pid $pid..."
  kill -TERM "$pid" 2>/dev/null || true
  local waited=0
  while kill -0 "$pid" 2>/dev/null; do
    if [ "$waited" -ge "$GRACE_SECONDS" ]; then
      echo "$name: still alive after ${GRACE_SECONDS}s; sending SIGKILL to pid $pid."
      kill -KILL "$pid" 2>/dev/null || true
      break
    fi
    sleep 1
    waited=$((waited + 1))
  done
  rm -f "$pidfile"
  echo "$name: stopped."
  return 0
}

if stop_by_pidfile daemon; then stopped_any=1; fi
if stop_by_pidfile web; then stopped_any=1; fi

for port in "$DAEMON_PORT" "$WEB_PORT"; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    if [ "$FORCE_PORT_KILL" -eq 1 ]; then
      pids_on_port="$(lsof -t -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | tr '\n' ' ' | sed 's/[[:space:]]*$//')"
      if [ -n "$pids_on_port" ]; then
        echo "port $port: still held; --force-port-kill set. killing pids: $pids_on_port"
        # shellcheck disable=SC2086
        kill -TERM $pids_on_port 2>/dev/null || true
        sleep 2
        # shellcheck disable=SC2086
        kill -KILL $pids_on_port 2>/dev/null || true
        stopped_any=1
      fi
    else
      echo "port $port: still held by another process. not killed. pass --force-port-kill if you are sure."
    fi
  fi
done

if [ "$stopped_any" -eq 0 ]; then
  echo "nothing to stop."
fi

echo "stop summary:"
daemon_listener_after="$(lsof -nP -iTCP:"$DAEMON_PORT" -sTCP:LISTEN || true)"
web_listener_after="$(lsof -nP -iTCP:"$WEB_PORT" -sTCP:LISTEN || true)"
[ -n "$daemon_listener_after" ] && echo "$daemon_listener_after"
[ -n "$web_listener_after" ] && echo "$web_listener_after"

# Final structured line so the reinstall gate can grep stop-result without
# parsing per-step output. Parsed by tooling/reinstall-ema-0.0.6.mjs.
if [ -z "$daemon_listener_after" ] && [ -z "$web_listener_after" ]; then
  echo "stop-result: ports_clear daemon=$DAEMON_PORT web=$WEB_PORT"
else
  echo "stop-result: ports_held daemon=$DAEMON_PORT web=$WEB_PORT"
fi

exit 0

#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DAEMON_DIR="$ROOT/apps/daemon"

echo "=== B1 two-daemon smoke ==="
echo "root=$ROOT"
echo "date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

echo
echo "=== substrate ==="
if command -v iroh >/dev/null 2>&1; then
  echo "iroh_path=$(command -v iroh)"
  iroh --version || true
else
  echo "BLOCKED: iroh binary is not installed on PATH"
  echo "expected sidecar invocation: iroh start"
  IROH_MISSING=1
fi

echo
echo "=== guarded code smoke ==="
(
  cd "$DAEMON_DIR"
  gleam test
)

echo
echo "=== trust-gate scan ==="
if rg -n "ema_collab\\.apply_frame" "$ROOT/apps/daemon/src/ema_replication" \
  | rg -v "ema_collab_sync.gleam" >/tmp/ema-b1-direct-apply.$$; then
  cat /tmp/ema-b1-direct-apply.$$
  rm -f /tmp/ema-b1-direct-apply.$$
  echo "FAIL: sidecar path contains a direct ema_collab.apply_frame call"
  exit 1
fi
rm -f /tmp/ema-b1-direct-apply.$$
echo "ok: only ema_collab_sync calls ema_collab.apply_frame"

echo
echo "=== gate scan ==="
rg -n "pub fn replication_enabled|False|Peer\\(_\\)|Deferred\\(" \
  "$ROOT/apps/daemon/src/ema_replication/ema_replication.gleam"

if [[ "${IROH_MISSING:-0}" == "1" ]]; then
  echo
  echo "SMOKE FAILED: real two-daemon Iroh path cannot run without an iroh sidecar binary"
  exit 2
fi

echo
echo "SMOKE INCOMPLETE: harness reached local guarded checks, but real two-daemon orchestration is not implemented in this script yet"
exit 3

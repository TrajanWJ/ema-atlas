#!/usr/bin/env bash
set -euo pipefail

units=(
  openclaw-gateway.service
  oauth-credentials-watcher.service
  ema-observer.service
)

for unit in "${units[@]}"; do
  echo "restarting $unit"
  systemctl --user restart "$unit"
  systemctl --user --no-pager --full status "$unit" | sed -n '1,10p'
  echo
 done

echo 'done'

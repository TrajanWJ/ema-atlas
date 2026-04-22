#!/usr/bin/env bash
set -euo pipefail

pass() { printf '[PASS] %s\n' "$1"; }
warn() { printf '[WARN] %s\n' "$1"; }
fail() { printf '[FAIL] %s\n' "$1"; }

echo '== ema doctor =='

if systemctl --user is-active --quiet ema-observer.service; then
  pass 'ema-observer.service active'
else
  fail 'ema-observer.service inactive'
fi

if ss -ltn 2>/dev/null | grep -q ':3200 '; then
  pass 'observer port 3200 listening'
else
  fail 'observer port 3200 not listening'
fi

if ss -ltnp 2>/dev/null | grep -q ':4488 '; then
  pass 'EMA API transport on 4488 present'
else
  warn 'no listener on 4488 detected'
fi

if ss -ltnp 2>/dev/null | grep ':4488 ' | grep -q 'ssh'; then
  warn '4488 appears to be SSH-tunnel-backed'
fi

if [ -f /home/trajan/logs/ema-observer.log ]; then
  pass 'ema observer log present'
  if tail -n 50 /home/trajan/logs/ema-observer.log | grep -q 'ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL'; then
    warn 'observer log shows prior forced termination / restart'
  fi
else
  warn 'ema observer log missing'
fi

if curl -fsS --max-time 3 http://127.0.0.1:3200 >/dev/null 2>&1; then
  pass 'observer HTTP responds on localhost:3200'
else
  warn 'observer HTTP check failed on localhost:3200'
fi

echo '== done =='

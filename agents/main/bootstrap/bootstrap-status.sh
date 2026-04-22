#!/usr/bin/env bash
set -euo pipefail

echo '== OpenClaw =='
openclaw status | sed -n '1,120p'

echo
echo '== User services =='
for unit in openclaw-gateway.service oauth-credentials-watcher.service ema-observer.service claudeforge.service opentabs.service; do
  systemctl --user --no-pager --full status "$unit" 2>/dev/null | sed -n '1,12p' || echo "$unit: not found"
  echo
 done

echo '== MCP baseline =='
python3 - <<'PY'
import json, pathlib
p = pathlib.Path('/home/trajan/.openclaw/agents/main/workspace/bootstrap/mcp-baseline.json')
obj = json.loads(p.read_text())
print('\n'.join(sorted(obj['mcpServers'].keys())))
PY

echo
echo '== Cron count =='
(crontab -l 2>/dev/null || true) | grep -v '^#' | grep -v '^$' | wc -l

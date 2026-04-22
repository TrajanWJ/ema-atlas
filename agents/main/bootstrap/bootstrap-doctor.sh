#!/usr/bin/env bash
set -euo pipefail

pass() { printf '[PASS] %s\n' "$1"; }
warn() { printf '[WARN] %s\n' "$1"; }
fail() { printf '[FAIL] %s\n' "$1"; }

echo '== bootstrap doctor =='

if command -v openclaw >/dev/null 2>&1; then
  pass 'openclaw installed'
else
  fail 'openclaw missing'
fi

if systemctl --user is-active --quiet openclaw-gateway.service; then
  pass 'openclaw-gateway.service active'
else
  fail 'openclaw-gateway.service inactive'
fi

if systemctl --user is-active --quiet oauth-credentials-watcher.service; then
  pass 'oauth-credentials-watcher.service active'
else
  warn 'oauth-credentials-watcher.service inactive'
fi

if systemctl --user is-active --quiet ema-observer.service; then
  pass 'ema-observer.service active'
else
  warn 'ema-observer.service inactive'
fi

status_out="$(openclaw status 2>&1 || true)"
if printf '%s' "$status_out" | grep -q 'plugin not found'; then
  warn 'openclaw status reports stale plugin entries'
else
  pass 'no stale plugin warnings in openclaw status'
fi

python3 - <<'PY'
import json
from pathlib import Path
baseline = json.loads(Path('/home/trajan/.openclaw/agents/main/workspace/bootstrap/mcp-baseline.json').read_text())['mcpServers']
claude = json.loads(Path('/home/trajan/.claude/mcp.json').read_text())['mcpServers']
missing = sorted(set(baseline) - set(claude))
extra = sorted(set(claude) - set(baseline))
if missing or extra:
    print('[WARN] Claude MCP differs from baseline')
    if missing:
        print('  missing:', ', '.join(missing))
    if extra:
        print('  extra:', ', '.join(extra))
else:
    print('[PASS] Claude MCP matches baseline')
PY

python3 - <<'PY'
from pathlib import Path
text = Path('/home/trajan/.codex/config.toml').read_text()
required = [
    '[mcp_servers.codebase-memory-mcp]',
    '[mcp_servers.ema]',
    '[mcp_servers.filesystem]',
    '[mcp_servers.vault-filesystem]',
    '[mcp_servers.qmd]',
    '[mcp_servers.sequential-thinking]',
    '[mcp_servers.memory]',
    '[mcp_servers.context7]',
    '[mcp_servers.git]',
    '[mcp_servers.fetch]',
    '[mcp_servers.playwright]',
]
missing = [x for x in required if x not in text]
if missing:
    print('[WARN] Codex MCP differs from expected baseline sections')
    for item in missing:
        print('  missing:', item)
else:
    print('[PASS] Codex MCP includes expected baseline sections')
PY

cron_count=$( (crontab -l 2>/dev/null || true) | grep -v '^#' | grep -v '^$' | wc -l )
if [ "$cron_count" -gt 0 ]; then
  pass "user crontab present ($cron_count entries)"
else
  warn 'user crontab appears empty'
fi

echo '== done =='

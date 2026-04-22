#!/usr/bin/env python3
import json
from pathlib import Path

BASELINE = Path('/home/trajan/.openclaw/agents/main/workspace/bootstrap/mcp-baseline.json')
CLAUDE = Path('/home/trajan/.claude/mcp.json')

baseline = json.loads(BASELINE.read_text())['mcpServers']
claude = {'mcpServers': baseline}
CLAUDE.write_text(json.dumps(claude, indent=2) + '\n')
print(f'synced {CLAUDE}')
print('note: codex MCP remains TOML-managed; use the baseline as canonical parity reference')

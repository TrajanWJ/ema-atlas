#!/usr/bin/env python3
import json
from pathlib import Path

BASELINE = Path('/home/trajan/.openclaw/agents/main/workspace/bootstrap/mcp-baseline.json')
CODEX = Path('/home/trajan/.codex/config.toml')

baseline = json.loads(BASELINE.read_text())['mcpServers']
order = [
    'codebase-memory-mcp', 'ema', 'filesystem', 'vault-filesystem', 'qmd',
    'sequential-thinking', 'memory', 'context7', 'git', 'fetch', 'playwright'
]

def toml_value(v):
    if isinstance(v, str):
        return '"' + v.replace('\\', '\\\\').replace('"', '\\"') + '"'
    if isinstance(v, list):
        return '[' + ', '.join(toml_value(x) for x in v) + ']'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if v is None:
        return '""'
    return str(v)

text = CODEX.read_text()
lines = text.splitlines()
kept = []
skip = False
for line in lines:
    stripped = line.strip()
    if stripped.startswith('[mcp_servers.'):
        skip = True
        continue
    if skip and stripped.startswith('['):
        skip = False
    if not skip:
        kept.append(line)

while kept and kept[-1].strip() == '':
    kept.pop()

kept.append('')
for name in order:
    if name not in baseline:
        continue
    cfg = baseline[name]
    section = name.replace('-', '-')
    kept.append(f'[mcp_servers.{section}]')
    kept.append(f'command = {toml_value(cfg["command"])}')
    if 'args' in cfg:
        kept.append(f'args = {toml_value(cfg["args"])}')
    if 'env' in cfg and cfg['env']:
        kept.append('')
        kept.append(f'[mcp_servers.{section}.env]')
        for k, v in cfg['env'].items():
            kept.append(f'{k} = {toml_value(v)}')
    kept.append('')

CODEX.write_text('\n'.join(kept).rstrip() + '\n')
print(f'synced {CODEX}')

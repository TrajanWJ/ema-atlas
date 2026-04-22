import json
from pathlib import Path
p = Path.home() / '.claude/settings.json'
data = json.loads(p.read_text())
data.setdefault('mcpServers', {})['filesystem'] = {
  'command': 'npx',
  'args': ['-y', '@modelcontextprotocol/server-filesystem', '/home/trajan/Projects', '/home/trajan/vault', '/home/trajan/Desktop/EMA-v1.1-Next-Steps']
}
p.write_text(json.dumps(data, indent=2) + '\n')
print(f'patched {p}')

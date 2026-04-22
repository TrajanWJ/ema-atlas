#!/usr/bin/env bash
set -euo pipefail
python3 - <<'PY'
import json
from collections import Counter
from pathlib import Path
p=Path('/home/trajan/.openclaw/agents/main/workspace/bootstrap/automation-registry.curated.json')
obj=json.loads(p.read_text())
entries=obj['entries']
print('entries:', len(entries))
for label, key in [('owners','owner'), ('domains','domain'), ('classes','class'), ('kinds','kind'), ('risks','risk')]:
    print(f'\n{label}:')
    c=Counter(e.get(key,'unknown') for e in entries)
    for k,v in sorted(c.items()):
        print(f'  {k}: {v}')
PY

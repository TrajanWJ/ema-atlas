#!/usr/bin/env bash
# manifest.sh — regenerate SYSTEM_MANIFEST.json from graph/nodes/*.qmd
# Pure bash + python3. Read-only against git, write to repo root.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

python3 - <<'PY' > SYSTEM_MANIFEST.json
import json, os, re, subprocess, time
nodes = []
ndir = "graph/nodes"
for fn in sorted(os.listdir(ndir)):
    if not fn.endswith(".qmd"): continue
    p = os.path.join(ndir, fn)
    s = open(p).read()
    m = re.match(r'^---\n(.*?)\n---', s, re.S)
    if not m: continue
    fm = {}
    for line in m.group(1).splitlines():
        if ":" not in line: continue
        k, v = line.split(":", 1)
        v = v.strip()
        if v.startswith("[") and v.endswith("]"):
            v = [x.strip() for x in v[1:-1].split(",") if x.strip()]
        elif v.isdigit():
            v = int(v)
        fm[k.strip()] = v
    nodes.append(fm)

edges = []
edir = "graph/edges"
for fn in sorted(os.listdir(edir)):
    if not fn.endswith(".md"): continue
    edges.append({"topic": fn[:-3], "path": f"{edir}/{fn}"})

# Branch -> head sha
branches = {}
try:
    out = subprocess.check_output(["git","for-each-ref","--format=%(refname:short) %(objectname)","refs/remotes/origin"]).decode()
    for line in out.strip().splitlines():
        ref, sha = line.split()
        if ref in ("HEAD","origin"): continue
        if ref.startswith("origin/"): ref = ref[len("origin/"):]
        branches[ref] = sha
except Exception:
    pass

manifest = {
  "schema_version": 1,
  "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
  "repo": "TrajanWJ/ema-transfer-pack-20260422-060938",
  "canonical_rule": "EMA owns truth. Hermes owns execution. Surfaces do not own state.",
  "entry_docs": [
    "README.md","MACBOOK_AGENT_HANDOFF_MASTER.md","SYSTEM_GRAPH.md",
    "AGENT_TRAVERSAL.md","AGENT_BOOTSTRAP.md","GLOSSARY.md","OPEN_QUESTIONS.md",
    "05-fresh-context-project-app-model.md"
  ],
  "branch_count": len(branches),
  "node_count": len(nodes),
  "edge_topics": [e["topic"] for e in edges],
  "branches": branches,
  "nodes": nodes,
}
print(json.dumps(manifest, indent=2, sort_keys=False))
PY

echo "wrote SYSTEM_MANIFEST.json ($(wc -c < SYSTEM_MANIFEST.json) bytes)"

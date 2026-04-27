#!/usr/bin/env bash
# graph-json.sh — regenerate graph.json (machine-readable view of the lineage graph)
# for the atlas Next.js app and any external tooling.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
python3 - <<'PY' > graph.json
import json, os, re, time
ndir = "graph/nodes"
nodes = []
for fn in sorted(os.listdir(ndir)):
    if not fn.endswith(".qmd"): continue
    p = os.path.join(ndir, fn)
    s = open(p).read()
    m = re.match(r'^---\n(.*?)\n---', s, re.S)
    if not m: continue
    fm = {}
    for line in m.group(1).splitlines():
        if ":" not in line: continue
        k, v = line.split(":", 1); v = v.strip()
        if v.startswith("[") and v.endswith("]"):
            v = [x.strip() for x in v[1:-1].split(",") if x.strip()]
        elif v.isdigit():
            v = int(v)
        fm[k.strip()] = v
    body_match = re.search(r'^---\n.*?\n---\n# .+?\n\n(.+?)(?:\n\n|$)', s, re.S)
    fm["summary"] = body_match.group(1).strip() if body_match else ""
    fm["node_path"] = p
    nodes.append(fm)
triples = []
for n in nodes:
    src = n["id"]
    for kind in ("preserves_from","inspires","superseded_by","adjacent_to"):
        for tgt in n.get(kind, []):
            triples.append({"source": src, "kind": kind, "target": tgt})
edir = "graph/edges"
topics = []
node_ids = {n["id"] for n in nodes}
for fn in sorted(os.listdir(edir)):
    if not fn.endswith(".md"): continue
    p = os.path.join(edir, fn)
    body = open(p).read()
    rule = ""
    for l in body.splitlines():
        if l.strip().startswith("**Rule:**"):
            rule = l.strip().lstrip("*").strip(" *"); break
    cited = sorted({m for m in re.findall(r'`([a-z0-9-]+)`', body) if m in node_ids})
    topics.append({"topic": fn[:-3], "edge_path": p, "rule": rule, "cited_nodes": cited})
oq = open("OPEN_QUESTIONS.md").read()
questions = []
for m in re.finditer(r'^## (Q\d+) — (.+?)\n([\s\S]*?)(?=^## Q\d+|\Z)', oq, re.M):
    qid, title, body = m.group(1), m.group(2), m.group(3)
    status = re.search(r'^- \*\*Status:\*\* (.+)$', body, re.M)
    blast  = re.search(r'^- \*\*Blast radius:\*\* (.+)$', body, re.M)
    questions.append({
      "id": qid, "title": title,
      "status": status.group(1) if status else "open",
      "blast_radius": blast.group(1) if blast else ""
    })
gloss = []
for m in re.finditer(r'^\| \*\*(.+?)\*\* \| (.+?) \| (.+?) \|', open("GLOSSARY.md").read(), re.M):
    gloss.append({"term": m.group(1), "definition": m.group(2), "source": m.group(3)})
graph = {
  "schema_version": 1,
  "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
  "repo": "TrajanWJ/ema-transfer-pack-20260422-060938",
  "canonical_rule": "EMA owns truth. Hermes owns execution. Surfaces do not own state.",
  "counts": {
    "nodes": len(nodes), "triples": len(triples),
    "topics": len(topics), "questions": len(questions),
    "glossary_terms": len(gloss),
  },
  "nodes": nodes, "triples": triples, "topics": topics,
  "open_questions": questions, "glossary": gloss,
}
print(json.dumps(graph, indent=2, ensure_ascii=False))
PY
echo "wrote graph.json ($(wc -c < graph.json) bytes)"

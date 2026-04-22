#!/usr/bin/env bash
# check-graph.sh — best-effort graph integrity check. Warns, never blocks.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
warn=0; w(){ echo "WARN: $*"; warn=$((warn+1)); }

# 1. every remote branch has a node file
git fetch --quiet --all 2>/dev/null || true
for b in $(git for-each-ref --format='%(refname:short)' refs/remotes/origin | sed 's|origin/||' | grep -vE '^(HEAD|origin)$'); do
  [ -f "graph/nodes/$b.qmd" ] || w "no graph/nodes/$b.qmd for branch origin/$b"
done

# 2. every node file references a real branch
for f in graph/nodes/*.qmd; do
  id=$(basename "$f" .qmd)
  git show-ref --verify --quiet "refs/remotes/origin/$id" || w "graph/nodes/$id.qmd has no matching branch"
done

# 3. every key_artifacts path exists in its branch (sample-check first 3)
for f in graph/nodes/*.qmd; do
  id=$(basename "$f" .qmd)
  awk '/^key_artifacts:/{flag=1;next} /^[a-z_]+:/{flag=0} flag' "$f" \
    | sed 's/[][,]//g; s/^- //; s/^ *//' | grep -v '^$' | head -3 \
    | while read -r p; do
        [ -z "$p" ] && continue
        git show "origin/$id:$p" >/dev/null 2>&1 || w "graph/nodes/$id.qmd: missing path '$p' in origin/$id"
      done
done

# 4. reciprocal preserves_from / inspires
for f in graph/nodes/*.qmd; do
  id=$(basename "$f" .qmd)
  for tgt in $(awk '/^preserves_from:/{gsub(/[][,]/,""); for(i=2;i<=NF;i++) print $i}' "$f"); do
    [ -f "graph/nodes/$tgt.qmd" ] || { w "$id preserves_from missing node $tgt"; continue; }
    grep -q "$id" "graph/nodes/$tgt.qmd" || w "$tgt should list $id under inspires:"
  done
done

echo "graph check done — $warn warning(s)"
exit 0

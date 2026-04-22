#!/usr/bin/env bash
# build-mermaid-svg.sh — render content/diagrams/<slug>/*.mmd to SVG.
#
# Output: content/diagrams/<slug>/<name>.svg next to each .mmd.
# Idempotent. Requires mmdc (mermaid-cli) — install with
# `npm i -g @mermaid-js/mermaid-cli`.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
have() { command -v "$1" >/dev/null 2>&1; }

if ! have mmdc; then
  echo "mmdc not found. install with:"
  echo "  npm i -g @mermaid-js/mermaid-cli"
  exit 1
fi

count=0
for mmd in content/diagrams/*/*.mmd; do
  svg="${mmd%.mmd}.svg"
  if [ "$svg" -nt "$mmd" ] 2>/dev/null; then
    continue   # svg fresher than mmd
  fi
  echo "  $mmd -> $svg"
  mmdc -i "$mmd" -o "$svg" -b transparent 2>&1 | tail -3
  count=$((count+1))
done
echo "rendered $count diagram(s)."

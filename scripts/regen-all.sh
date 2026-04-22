#!/usr/bin/env bash
# regen-all.sh — run every regenerator in the right order.
# Use as a pre-commit / pre-push convenience or in CI.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[1/4] check-graph"
./scripts/check-graph.sh

echo "[2/4] manifest"
./scripts/manifest.sh

echo "[3/4] graph-json"
./scripts/graph-json.sh

echo "[4/4] index"
./scripts/index.sh

echo
echo "regen-all done."

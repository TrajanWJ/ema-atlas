#!/usr/bin/env bash
set -euo pipefail

DEST="/home/trajan/.openclaw/agents/main/workspace/host-mirror"
mkdir -p "$DEST/ema-docs" "$DEST/ema-qmd" "$DEST/vault-wiki"

rsync -az --delete --prune-empty-dirs \
  --include='*/' --include='*.md' --include='*.qmd' --exclude='*' \
  host-machine:/home/trajan/Projects/ema/docs/ \
  "$DEST/ema-docs/"

rsync -az --delete --prune-empty-dirs \
  --include='*/' --include='*.md' --include='*.qmd' --exclude='*' \
  host-machine:/home/trajan/Desktop/EMA-v1.1-Next-Steps/ \
  "$DEST/ema-qmd/"

rsync -az --delete --prune-empty-dirs \
  --include='*/' --include='*.md' --include='*.qmd' --exclude='*' \
  host-machine:/home/trajan/vault/wiki/ \
  "$DEST/vault-wiki/"

echo "Host docs mirror refreshed at $DEST"

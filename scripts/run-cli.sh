#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN="$ROOT/apps/cli/dist/bin.js"

if [ ! -f "$BIN" ]; then
  echo "ema cli: built CLI not found at apps/cli/dist/bin.js" >&2
  echo "Run: pnpm build:cli" >&2
  exit 1
fi

node "$BIN" "$@"

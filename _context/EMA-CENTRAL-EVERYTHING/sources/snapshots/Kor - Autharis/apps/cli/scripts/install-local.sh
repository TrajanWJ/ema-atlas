#!/usr/bin/env bash
# Install the Autharis CLI into the user's global pnpm store.
# Lane G2.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "[autharis-cli] building…"
pnpm build

echo "[autharis-cli] linking global bin 'autharis'…"
pnpm link --global

echo "[autharis-cli] ready. Try: autharis --help"

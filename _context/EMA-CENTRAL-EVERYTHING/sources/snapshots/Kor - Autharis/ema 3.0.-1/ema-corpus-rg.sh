#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "usage: $0 <pattern> [extra rg args...]"
  exit 1
fi

PATTERN="$1"
shift || true

ROOTS=(
  "/Users/tawj/Desktop/ema 0.0.3"
  "/Users/tawj/Desktop/Kor - Autharis/autharis"
  "/Users/tawj/Desktop/Kor - Autharis/ema 3.0.-1"
)

exec rg -n \
  --glob '!**/node_modules/**' \
  --glob '!**/.next/**' \
  --glob '!**/.git/**' \
  --glob '!**/dist/**' \
  --glob '!**/build/**' \
  --glob '!**/coverage/**' \
  "$PATTERN" \
  "${ROOTS[@]}" \
  "$@"

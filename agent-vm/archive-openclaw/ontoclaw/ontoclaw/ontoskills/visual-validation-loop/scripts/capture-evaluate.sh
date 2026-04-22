#!/usr/bin/env bash
# capture-evaluate.sh — Capture screenshots at multiple viewports for visual validation
#
# Usage:
#   ./capture-evaluate.sh <URL> [viewport1] [viewport2] ...
#   ./capture-evaluate.sh http://localhost:3000 1280x800 375x812 768x1024
#
# Defaults: 1280x800 and 375x812 if no viewports specified.
# Output: PNG files in /tmp/visual-validation/<timestamp>/
# Returns: newline-separated paths to captured screenshots (for agent to evaluate)

set -euo pipefail

URL="${1:?Usage: capture-evaluate.sh <URL> [viewport1] [viewport2] ...}"
shift

# Default viewports if none provided
if [ $# -eq 0 ]; then
  VIEWPORTS=("1280x800" "375x812")
else
  VIEWPORTS=("$@")
fi

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTDIR="/tmp/visual-validation/${TIMESTAMP}"
mkdir -p "$OUTDIR"

CAPTURED=()

for VP in "${VIEWPORTS[@]}"; do
  WIDTH="${VP%%x*}"
  HEIGHT="${VP##*x}"
  FILENAME="${OUTDIR}/screenshot-${WIDTH}x${HEIGHT}.png"

  # Try npx playwright screenshot first (fast, no browser skill dependency)
  if command -v npx &>/dev/null && npx --yes playwright screenshot \
    --viewport-size="${WIDTH},${HEIGHT}" \
    --full-page \
    "$URL" "$FILENAME" 2>/dev/null; then
    CAPTURED+=("$FILENAME")
  # Fallback: use chromium directly via playwright
  elif command -v playwright &>/dev/null && playwright screenshot \
    --viewport-size="${WIDTH},${HEIGHT}" \
    --full-page \
    "$URL" "$FILENAME" 2>/dev/null; then
    CAPTURED+=("$FILENAME")
  else
    echo "WARN: Could not capture ${VP} — neither npx playwright nor playwright CLI available" >&2
    echo "HINT: Use the browser tool instead: browser action=screenshot url=$URL width=$WIDTH height=$HEIGHT" >&2
  fi
done

# Output results
if [ ${#CAPTURED[@]} -eq 0 ]; then
  echo "ERROR: No screenshots captured. Ensure Playwright is installed or use the browser tool directly." >&2
  echo "  npm install -g playwright && playwright install chromium" >&2
  exit 1
fi

echo "--- Captured ${#CAPTURED[@]} screenshot(s) to ${OUTDIR} ---"
for F in "${CAPTURED[@]}"; do
  echo "$F"
done

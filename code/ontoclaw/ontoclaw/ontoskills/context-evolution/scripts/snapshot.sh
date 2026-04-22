#!/usr/bin/env bash
# snapshot.sh - Backup current SOUL.md for an agent
set -euo pipefail

AGENT=""
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="$(dirname "$SCRIPT_DIR")/data/snapshots"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --agent) AGENT="$2"; shift 2 ;;
    -h|--help) echo "Usage: $0 --agent NAME"; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

[[ -z "$AGENT" ]] && { echo "Error: --agent is required"; exit 1; }

SOUL_PATH="$HOME/.openclaw/agents/${AGENT}/workspace/SOUL.md"
[[ -f "$SOUL_PATH" ]] || SOUL_PATH="$HOME/.openclaw/agents/${AGENT}/workspace/agent/SOUL.md"
[[ -f "$SOUL_PATH" ]] || { echo "Error: SOUL.md not found for agent: $AGENT"; exit 1; }

TIMESTAMP=$(date -u +"%Y-%m-%dT%H%M%S")
SNAP_DIR="$DATA_DIR/$AGENT"
mkdir -p "$SNAP_DIR"

SNAP_FILE="$SNAP_DIR/${TIMESTAMP}.md"
cp "$SOUL_PATH" "$SNAP_FILE"

# Add to index
WORD_COUNT=$(wc -w < "$SNAP_FILE")
MD5=$(md5sum "$SNAP_FILE" | cut -d' ' -f1)
echo "${TIMESTAMP} | words: ${WORD_COUNT} | md5: ${MD5}" >> "$SNAP_DIR/index.log"

echo "Snapshot saved: $SNAP_FILE (${WORD_COUNT} words)"

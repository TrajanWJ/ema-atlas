#!/usr/bin/env bash
# rollback.sh - Restore SOUL.md from snapshot
set -euo pipefail

AGENT="" TARGET=""
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SNAP_DIR="$(dirname "$SCRIPT_DIR")/data/snapshots"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --agent) AGENT="$2"; shift 2 ;;
    --to) TARGET="$2"; shift 2 ;;
    -h|--help) echo "Usage: $0 --agent NAME [--to TIMESTAMP]"; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

[[ -z "$AGENT" ]] && { echo "Error: --agent is required"; exit 1; }

AGENT_SNAPS="$SNAP_DIR/$AGENT"
[[ -d "$AGENT_SNAPS" ]] || { echo "Error: No snapshots found for agent: $AGENT"; exit 1; }

if [[ -n "$TARGET" ]]; then
  SNAP_FILE="$AGENT_SNAPS/${TARGET}.md"
else
  SNAP_FILE=$(ls -t "$AGENT_SNAPS"/*.md 2>/dev/null | head -1)
fi

[[ -f "$SNAP_FILE" ]] || { echo "Error: Snapshot not found: ${TARGET:-latest}"; exit 1; }

SOUL_PATH="$HOME/.openclaw/agents/${AGENT}/workspace/SOUL.md"
[[ -f "$SOUL_PATH" ]] || SOUL_PATH="$HOME/.openclaw/agents/${AGENT}/workspace/agent/SOUL.md"
[[ -f "$SOUL_PATH" ]] || { echo "Error: Current SOUL.md not found for agent: $AGENT"; exit 1; }

# Safety backup before rollback
SAFETY_BACKUP="$AGENT_SNAPS/pre-rollback-$(date -u +%Y%m%dT%H%M%S).md"
cp "$SOUL_PATH" "$SAFETY_BACKUP"
echo "Safety backup: $SAFETY_BACKUP"

cp "$SNAP_FILE" "$SOUL_PATH"
echo "Rolled back $AGENT SOUL.md to: $(basename "$SNAP_FILE" .md)"

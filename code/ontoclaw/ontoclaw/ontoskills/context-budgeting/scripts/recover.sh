#!/usr/bin/env bash
# context-budgeting: recover.sh
# After compaction, reads the latest checkpoint and prints a structured
# recovery summary that the agent can use to restore critical context.
#
# Usage:
#   bash recover.sh              # Read latest checkpoint
#   bash recover.sh --all        # List all available checkpoints
#   bash recover.sh --file PATH  # Read a specific checkpoint
#   bash recover.sh --check      # Check if recovery is needed (exit 0=yes, 1=no)

set -euo pipefail

CHECKPOINT_DIR="/tmp"
MODE="latest"
SPECIFIC_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --all)   MODE="list"; shift ;;
    --file)  MODE="specific"; SPECIFIC_FILE="$2"; shift 2 ;;
    --dir)   CHECKPOINT_DIR="$2"; shift 2 ;;
    --check) MODE="check"; shift ;;
    -h|--help)
      echo "Usage: recover.sh [--all] [--file PATH] [--check] [--dir DIR]"
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

# Find checkpoints
CHECKPOINTS=$(ls -1t "${CHECKPOINT_DIR}"/context-checkpoint-*.md 2>/dev/null || true)

if [[ -z "$CHECKPOINTS" ]]; then
  echo "⚠️  No checkpoints found in ${CHECKPOINT_DIR}/"
  echo ""
  echo "No prior state to recover. You'll need to reconstruct context manually:"
  echo "  1. Check CONTINUE.md if it exists"
  echo "  2. Use lcm_grep to search compacted history"
  echo "  3. Re-read task-relevant files"
  exit 1
fi

case "$MODE" in
  check)
    LATEST=$(echo "$CHECKPOINTS" | head -1)
    AGE_SEC=$(( $(date +%s) - $(stat -c %Y "$LATEST" 2>/dev/null || stat -f %m "$LATEST" 2>/dev/null) ))
    if [[ $AGE_SEC -lt 3600 ]]; then
      echo "Recovery checkpoint available (${AGE_SEC}s old): $LATEST"
      exit 0
    else
      echo "Latest checkpoint is ${AGE_SEC}s old — may be stale."
      exit 1
    fi
    ;;

  list)
    echo "📋 Available checkpoints:"
    echo ""
    while IFS= read -r f; do
      SIZE=$(wc -c < "$f")
      MTIME=$(stat -c '%Y' "$f" 2>/dev/null || stat -f '%m' "$f" 2>/dev/null)
      AGE=$(( $(date +%s) - MTIME ))
      if [[ $AGE -lt 60 ]]; then
        AGE_STR="${AGE}s ago"
      elif [[ $AGE -lt 3600 ]]; then
        AGE_STR="$(( AGE / 60 ))m ago"
      else
        AGE_STR="$(( AGE / 3600 ))h ago"
      fi
      echo "  $(basename "$f")  (${SIZE}B, ${AGE_STR})"
    done <<< "$CHECKPOINTS"
    echo ""
    echo "Total: $(echo "$CHECKPOINTS" | wc -l) checkpoint(s)"
    ;;

  specific)
    if [[ ! -f "$SPECIFIC_FILE" ]]; then
      echo "❌ File not found: $SPECIFIC_FILE" >&2
      exit 1
    fi
    echo "🔄 CONTEXT RECOVERY — Reading specific checkpoint"
    echo "   Source: $SPECIFIC_FILE"
    echo "========================================================"
    echo ""
    cat "$SPECIFIC_FILE"
    ;;

  latest)
    LATEST=$(echo "$CHECKPOINTS" | head -1)
    AGE_SEC=$(( $(date +%s) - $(stat -c %Y "$LATEST" 2>/dev/null || stat -f %m "$LATEST" 2>/dev/null) ))

    echo "🔄 CONTEXT RECOVERY"
    echo "   Latest checkpoint: $(basename "$LATEST")"
    echo "   Age: ${AGE_SEC}s"
    echo "   Available checkpoints: $(echo "$CHECKPOINTS" | wc -l)"
    echo "========================================================"
    echo ""
    cat "$LATEST"
    echo ""
    echo "========================================================"
    echo ""
    echo "📌 RECOVERY CHECKLIST:"
    echo "  □ Read the task description above — is it still your current task?"
    echo "  □ Review critical decisions — do they still hold?"
    echo "  □ Re-read any active files listed above (only the ones you need next)"
    echo "  □ Check pending work — pick up from where you left off"
    echo "  □ State your understanding: 'I'm working on X, completed Y, next is Z'"
    echo ""

    # Also check for CONTINUE.md
    WORKSPACE="${HOME}/.openclaw/agents/main/workspace"
    if [[ -f "${WORKSPACE}/CONTINUE.md" ]]; then
      echo "📎 CONTINUE.md also exists — this may have cross-session context:"
      echo "   ${WORKSPACE}/CONTINUE.md"
      echo ""
    fi

    if [[ $AGE_SEC -gt 1800 ]]; then
      echo "⚠️  Checkpoint is >30 minutes old. Context may have drifted."
      echo "   Consider re-checkpointing after recovery."
    fi
    ;;
esac

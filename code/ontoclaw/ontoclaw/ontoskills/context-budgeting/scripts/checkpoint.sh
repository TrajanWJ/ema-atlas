#!/usr/bin/env bash
# context-budgeting: checkpoint.sh
# Creates a structured checkpoint of critical context state before compaction.
# Saves to /tmp/context-checkpoint-{timestamp}.md
#
# Usage:
#   bash checkpoint.sh \
#     --task "Build the auth module" \
#     --state "Implementing JWT validation" \
#     --decisions "Using RS256; Storing refresh tokens in Redis" \
#     --files "src/auth.ts:JWT handler,src/config.ts:Redis config" \
#     --pending "Add token refresh endpoint; Write tests; Update docs" \
#     --context "User requires backward compat with v1 tokens"
#
# All flags are optional. Omitted fields show as "(not provided)".

set -euo pipefail

# --- Defaults ---
TASK=""
STATE=""
DECISIONS=""
FILES=""
PENDING=""
CONTEXT=""
CHECKPOINT_DIR="/tmp"
MAX_CHECKPOINTS=10

# --- Parse args ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --task)     TASK="$2"; shift 2 ;;
    --state)    STATE="$2"; shift 2 ;;
    --decisions) DECISIONS="$2"; shift 2 ;;
    --files)    FILES="$2"; shift 2 ;;
    --pending)  PENDING="$2"; shift 2 ;;
    --context)  CONTEXT="$2"; shift 2 ;;
    --dir)      CHECKPOINT_DIR="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: checkpoint.sh [--task T] [--state S] [--decisions D] [--files F] [--pending P] [--context C] [--dir DIR]"
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

TIMESTAMP=$(date "+%Y%m%d-%H%M%S")
CHECKPOINT_FILE="${CHECKPOINT_DIR}/context-checkpoint-${TIMESTAMP}.md"

# --- Build checkpoint ---
cat > "$CHECKPOINT_FILE" << 'HEADER'
# Context Checkpoint
HEADER

cat >> "$CHECKPOINT_FILE" << EOF
> Generated: $(date "+%Y-%m-%d %H:%M:%S %Z")
> Host: $(hostname)
> Session PID: $$

## Task
${TASK:-"(not provided)"}

## Current State
${STATE:-"(not provided)"}

## Critical Decisions
EOF

# Format decisions as bullet list (semicolon-separated)
if [[ -n "$DECISIONS" ]]; then
  IFS=';' read -ra DECISION_LIST <<< "$DECISIONS"
  for d in "${DECISION_LIST[@]}"; do
    d_trimmed=$(echo "$d" | xargs)
    [[ -n "$d_trimmed" ]] && echo "- $d_trimmed" >> "$CHECKPOINT_FILE"
  done
else
  echo "(none recorded)" >> "$CHECKPOINT_FILE"
fi

cat >> "$CHECKPOINT_FILE" << EOF

## Active Files
EOF

# Format files as table (comma-separated path:purpose pairs)
if [[ -n "$FILES" ]]; then
  echo "| Path | Purpose |" >> "$CHECKPOINT_FILE"
  echo "|------|---------|" >> "$CHECKPOINT_FILE"
  IFS=',' read -ra FILE_LIST <<< "$FILES"
  for f in "${FILE_LIST[@]}"; do
    f_trimmed=$(echo "$f" | xargs)
    path="${f_trimmed%%:*}"
    purpose="${f_trimmed#*:}"
    [[ "$path" == "$purpose" ]] && purpose="(no purpose given)"
    echo "| \`$path\` | $purpose |" >> "$CHECKPOINT_FILE"
  done
else
  echo "(no files tracked)" >> "$CHECKPOINT_FILE"
fi

cat >> "$CHECKPOINT_FILE" << EOF

## Pending Work
EOF

# Format pending items as numbered list (semicolon-separated)
if [[ -n "$PENDING" ]]; then
  IFS=';' read -ra PENDING_LIST <<< "$PENDING"
  i=1
  for p in "${PENDING_LIST[@]}"; do
    p_trimmed=$(echo "$p" | xargs)
    if [[ -n "$p_trimmed" ]]; then
      echo "${i}. $p_trimmed" >> "$CHECKPOINT_FILE"
      ((i++))
    fi
  done
else
  echo "(none)" >> "$CHECKPOINT_FILE"
fi

cat >> "$CHECKPOINT_FILE" << EOF

## Additional Context
${CONTEXT:-"(none)"}

---
*Recovery: run \`bash ~/skills/context-budgeting/scripts/recover.sh\` after compaction.*
EOF

# --- Prune old checkpoints (keep last MAX_CHECKPOINTS) ---
EXISTING=$(ls -1t "${CHECKPOINT_DIR}"/context-checkpoint-*.md 2>/dev/null | tail -n +$((MAX_CHECKPOINTS + 1)))
if [[ -n "$EXISTING" ]]; then
  echo "$EXISTING" | xargs rm -f
  PRUNED=$(echo "$EXISTING" | wc -l)
  echo "Pruned $PRUNED old checkpoint(s)."
fi

echo "✅ Checkpoint saved: $CHECKPOINT_FILE"
echo "   Size: $(wc -c < "$CHECKPOINT_FILE") bytes"

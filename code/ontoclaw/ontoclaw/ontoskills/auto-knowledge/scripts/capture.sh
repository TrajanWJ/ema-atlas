#!/usr/bin/env bash
# capture.sh — Process top suggestion from auto-knowledge queue → vault note
# Called by auto-knowledge-gated.sh (cron every 3h)
# Principle: self-contained, no pip, no LLM calls, one note per run
set -euo pipefail

VAULT="$HOME/vault"
QUEUE="/tmp/auto-knowledge-queue.json"
OUTPUT_DIR="$VAULT/Inbox"
DATE=$(date -u +%Y-%m-%d)
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
LOG_PREFIX="[capture.sh]"

mkdir -p "$OUTPUT_DIR"

# Check if queue exists and has entries
if [ ! -f "$QUEUE" ]; then
    echo "$LOG_PREFIX No queue file at $QUEUE — run transcript-scanner.py first"
    exit 0
fi

ENTRIES=$(jq 'length' "$QUEUE" 2>/dev/null || echo 0)
if [ "$ENTRIES" -eq 0 ]; then
    echo "$LOG_PREFIX Queue empty, nothing to capture"
    exit 0
fi

# Pop the top (highest-scored) suggestion
TOP=$(jq '.[0]' "$QUEUE")
REMAINING=$(jq '.[1:]' "$QUEUE")

TYPE=$(echo "$TOP" | jq -r '.type // "unknown"')
TITLE=$(echo "$TOP" | jq -r '.title // "Untitled"')
CONTENT=$(echo "$TOP" | jq -r '.content // ""')
SOURCE_SESSION=$(echo "$TOP" | jq -r '.session // "unknown"')
SCORE=$(echo "$TOP" | jq -r '.score // 0')
TAGS=$(echo "$TOP" | jq -r '.tags // [] | join(", ")')

# Sanitize title early (needed for log messages below)
SAFE_TITLE=$(echo "$TITLE" | tr -cs 'A-Za-z0-9 -' ' ' | sed 's/  */ /g; s/^ //; s/ $//' | head -c 80)

# Quality gate: skip low-quality captures
WORD_COUNT=$(echo "$CONTENT" | wc -w)
SCORE_INT=${SCORE%%.*}  # handle decimal scores

if [ "$WORD_COUNT" -lt 50 ]; then
    echo "$LOG_PREFIX Skipping low-quality capture: '$SAFE_TITLE' ($WORD_COUNT words < 50 min)"
    echo "$REMAINING" > "$QUEUE"
    exit 0
fi

if [ "$SCORE_INT" -lt 3 ]; then
    echo "$LOG_PREFIX Skipping low-score capture: '$SAFE_TITLE' (score $SCORE < 3 min)"
    echo "$REMAINING" > "$QUEUE"
    exit 0
fi

# Skip captures with generic/meaningless titles
if [[ "$SAFE_TITLE" =~ ^(the update|dropping to|the output|the external|Untitled)$ ]]; then
    echo "$LOG_PREFIX Skipping generic title: '$SAFE_TITLE'"
    echo "$REMAINING" > "$QUEUE"
    exit 0
fi

NOTE_FILE="$OUTPUT_DIR/${DATE} ${SAFE_TITLE}.md"

# Deduplicate: skip if exact title already captured today
if [ -f "$NOTE_FILE" ]; then
    echo "$LOG_PREFIX Skipping duplicate: $SAFE_TITLE (already captured today)"
    echo "$REMAINING" > "$QUEUE"
    exit 0
fi

# Write the vault note
cat > "$NOTE_FILE" << EOF
---
type: auto-captured
source: session-transcript
captured: $TS
session: $SOURCE_SESSION
category: $TYPE
score: $SCORE
tags: [$TAGS]
---

# $TITLE

$CONTENT

---
*Auto-captured by auto-knowledge pipeline from session \`$SOURCE_SESSION\`*
*Score: $SCORE | Category: $TYPE*
EOF

echo "$LOG_PREFIX Captured: $SAFE_TITLE (score: $SCORE, type: $TYPE)"

# Update queue (remove processed entry)
echo "$REMAINING" > "$QUEUE"

# Immediately classify the new note (don't wait for hourly cron)
if command -v /home/trajan/bin/vault-classify.sh &>/dev/null || [[ -x /home/trajan/bin/vault-classify.sh ]]; then
    /home/trajan/bin/vault-classify.sh >> /tmp/vault-classify.log 2>&1 &
    echo "$LOG_PREFIX Triggered immediate classification (background)"
fi

# Notify OpenClaw via system event (best-effort)
if command -v openclaw &>/dev/null; then
    openclaw system event --type "auto-knowledge-capture" \
        --data "{\"title\":\"$SAFE_TITLE\",\"type\":\"$TYPE\",\"score\":$SCORE}" 2>/dev/null || true
fi

echo "$LOG_PREFIX Done. Queue remaining: $(jq 'length' "$QUEUE" 2>/dev/null || echo 0)"

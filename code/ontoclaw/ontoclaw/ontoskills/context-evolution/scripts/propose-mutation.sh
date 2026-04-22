#!/usr/bin/env bash
# propose-mutation.sh - Propose SOUL.md changes based on reflection
set -euo pipefail

AGENT=""
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="$(dirname "$SCRIPT_DIR")/data/proposals"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --agent) AGENT="$2"; shift 2 ;;
    -h|--help) echo "Usage: $0 --agent NAME"; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

[[ -z "$AGENT" ]] && { echo "Error: --agent is required"; exit 1; }

# Generate reflection first
REFLECTION=$("$SCRIPT_DIR/reflect.sh" --agent "$AGENT")

# Get current SOUL.md
SOUL_PATH="$HOME/.openclaw/agents/${AGENT}/workspace/SOUL.md"
[[ -f "$SOUL_PATH" ]] || SOUL_PATH="$HOME/.openclaw/agents/${AGENT}/workspace/agent/SOUL.md"
[[ -f "$SOUL_PATH" ]] || { echo "Error: SOUL.md not found for agent: $AGENT"; exit 1; }

TIMESTAMP=$(date -u +"%Y-%m-%dT%H%M%S")
PROPOSAL_DIR="$DATA_DIR/$AGENT"
mkdir -p "$PROPOSAL_DIR"
PROPOSAL_FILE="$PROPOSAL_DIR/${TIMESTAMP}.md"

# Use claude to generate mutation proposal
PROMPT="Based on this performance reflection for the '$AGENT' agent, propose specific changes to its SOUL.md.

Current SOUL.md:
$(cat "$SOUL_PATH")

Performance Reflection:
$REFLECTION

Reply with ONLY a JSON object:
{
  \"confidence\": 0.0-1.0,
  \"rationale\": \"why these changes\",
  \"additions\": [\"lines to add\"],
  \"removals\": [\"lines to remove\"],
  \"modifications\": [{\"old\": \"original line\", \"new\": \"modified line\"}]
}"

RAW_PROPOSAL=$(echo "$PROMPT" | claude -p 2>/dev/null || echo '{"confidence": 0.0, "rationale": "proposal generation failed", "additions": [], "removals": [], "modifications": []}')

# Strip markdown code fences that Claude often wraps JSON in
PROPOSAL=$(echo "$RAW_PROPOSAL" | sed '/^```\(json\)\?$/d' | sed '/^```$/d')

# Validate JSON - if invalid, wrap in fallback
if ! echo "$PROPOSAL" | jq empty 2>/dev/null; then
  # Try to extract JSON object from mixed output
  PROPOSAL=$(echo "$RAW_PROPOSAL" | grep -Pzo '\{[^{}]*("confidence"[^{}]*)\}' | tr '\0' '\n' | head -1)
  if ! echo "$PROPOSAL" | jq empty 2>/dev/null; then
    PROPOSAL='{"confidence": 0.0, "rationale": "JSON parse failed from claude output", "additions": [], "removals": [], "modifications": []}'
  fi
fi

CONFIDENCE=$(echo "$PROPOSAL" | jq -r '.confidence // 0' 2>/dev/null || echo "0.0")

cat > "$PROPOSAL_FILE" <<EOF
---
agent: ${AGENT}
timestamp: ${TIMESTAMP}
status: pending
confidence: ${CONFIDENCE}
---

# Mutation Proposal: ${AGENT}

## Reflection Summary
${REFLECTION}

## Proposed Changes
\`\`\`json
${PROPOSAL}
\`\`\`

## Confidence
${CONFIDENCE}
EOF

echo "confidence: $CONFIDENCE"
echo "Proposal saved: $PROPOSAL_FILE (confidence: $CONFIDENCE)"

#!/usr/bin/env bash
# run-loop.sh - Execute full evolution pipeline for an agent
set -euo pipefail

AGENT="" ALL=false THRESHOLD="0.8"
CE_SCRIPTS="$HOME/skills/context-evolution/scripts"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --agent) AGENT="$2"; shift 2 ;;
    --all) ALL=true; shift ;;
    --threshold) THRESHOLD="$2"; shift 2 ;;
    -h|--help) echo "Usage: $0 --agent NAME|--all [--threshold N]"; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

[[ -z "$AGENT" && "$ALL" != "true" ]] && { echo "Error: --agent or --all required"; exit 1; }

evolve_agent() {
  local agent="$1"
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local evo_dir="$HOME/vault/Agents/Evolution"
  local evo_file="$evo_dir/${agent}.md"
  mkdir -p "$evo_dir"

  echo "=== Evolving: $agent ==="

  # Check performance data exists
  local perf_file="$HOME/vault/Agents/Performance/${agent}.md"
  if [[ ! -f "$perf_file" ]]; then
    echo "  No performance data, skipping"
    return
  fi

  # Step 1: Reflect
  echo "  Reflecting..."
  local reflection
  reflection=$("$CE_SCRIPTS/reflect.sh" --agent "$agent" 2>&1) || { echo "  Reflect failed"; return; }

  # Step 2: Propose mutation
  echo "  Proposing mutation..."
  local proposal_output
  proposal_output=$("$CE_SCRIPTS/propose-mutation.sh" --agent "$agent" 2>&1) || { echo "  Proposal failed"; return; }

  # Extract confidence from proposal output
  local confidence
  confidence=$(echo "$proposal_output" | grep -oP 'confidence: \K[0-9.]+' | head -1 || echo "0.0")
  [[ -z "$confidence" ]] && confidence="0.0"

  # Step 3: Decide
  local action="skipped"
  local snap_path=""
  if (( $(echo "$confidence >= $THRESHOLD" | bc -l) )); then
    echo "  Confidence $confidence >= $THRESHOLD, applying..."
    # Snapshot first
    snap_output=$("$CE_SCRIPTS/snapshot.sh" --agent "$agent" 2>&1)
    snap_path=$(echo "$snap_output" | grep -oP 'Snapshot saved: \K\S+' || echo "unknown")
    action="applied"
  else
    echo "  Confidence $confidence < $THRESHOLD, skipping"
  fi

  # Step 4: Log
  if [[ ! -f "$evo_file" ]]; then
    cat > "$evo_file" <<EOF
---
agent: ${agent}
type: evolution-log
---

# ${agent} Evolution Log

EOF
  fi

  cat >> "$evo_file" <<EOF
## ${timestamp}
- **Action**: ${action}
- **Confidence**: ${confidence}
- **Mutation**: $(echo "$proposal_output" | tail -1)
- **Snapshot**: ${snap_path:-n/a}

EOF

  echo "  Done: $action (confidence: $confidence)"
}

if [[ "$ALL" == "true" ]]; then
  for agent_dir in "$HOME"/.openclaw/agents/*/; do
    agent=$(basename "$agent_dir")
    [[ "$agent" == "_archived" ]] && continue
    evolve_agent "$agent"
  done
else
  evolve_agent "$AGENT"
fi

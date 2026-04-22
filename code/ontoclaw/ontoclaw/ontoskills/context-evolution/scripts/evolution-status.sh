#!/usr/bin/env bash
# evolution-status.sh - Show evolution state for agents
set -euo pipefail

AGENT=""
ALL=false
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")/data"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --agent) AGENT="$2"; shift 2 ;;
    --all) ALL=true; shift ;;
    -h|--help) echo "Usage: $0 --agent NAME | --all"; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

[[ -z "$AGENT" && "$ALL" != "true" ]] && { echo "Error: --agent NAME or --all required"; exit 1; }

show_status() {
  local agent="$1"
  local snap_dir="$BASE_DIR/snapshots/$agent"
  local prop_dir="$BASE_DIR/proposals/$agent"

  local snap_count=0 pending=0 last_snap="never"
  [[ -d "$snap_dir" ]] && snap_count=$(ls "$snap_dir"/*.md 2>/dev/null | wc -l)
  [[ -d "$prop_dir" ]] && pending=$(grep -rl "status: pending" "$prop_dir" 2>/dev/null | wc -l)
  [[ -d "$snap_dir" ]] && last_snap=$(ls -t "$snap_dir"/*.md 2>/dev/null | head -1 | xargs basename 2>/dev/null | sed 's/.md$//' || echo "never")

  echo "## $agent"
  echo "- Snapshots: $snap_count"
  echo "- Pending proposals: $pending"
  echo "- Last snapshot: $last_snap"
  echo ""
}

echo "# Evolution Status"
echo ""

if [[ "$ALL" == "true" ]]; then
  for agent_dir in "$HOME"/.openclaw/agents/*/; do
    agent=$(basename "$agent_dir")
    [[ "$agent" == "_archived" ]] && continue
    show_status "$agent"
  done
else
  show_status "$AGENT"
fi

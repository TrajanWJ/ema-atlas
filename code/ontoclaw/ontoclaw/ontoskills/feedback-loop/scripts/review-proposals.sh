#!/usr/bin/env bash
# review-proposals.sh - List and act on pending evolution proposals
set -euo pipefail

AGENT="" ALL=false APPROVE="" REJECT=""
PROPOSALS_BASE="$HOME/skills/context-evolution/data/proposals"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --agent) AGENT="$2"; shift 2 ;;
    --all) ALL=true; shift ;;
    --approve) APPROVE="$2"; shift 2 ;;
    --reject) REJECT="$2"; shift 2 ;;
    -h|--help) echo "Usage: $0 --agent NAME|--all [--approve ID] [--reject ID]"; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

[[ -z "$AGENT" && "$ALL" != "true" ]] && { echo "Error: --agent or --all required"; exit 1; }

handle_action() {
  local dir="$1" id="$2" action="$3"
  local file="$dir/${id}.md"
  [[ -f "$file" ]] || { echo "Proposal not found: $id"; return 1; }

  local dest_dir="$dir/../${action}ed"
  mkdir -p "$dest_dir"
  sed -i "s/status: pending/status: ${action}ed/" "$file"
  mv "$file" "$dest_dir/"
  echo "Proposal ${action}ed: $id"
}

if [[ -n "$APPROVE" || -n "$REJECT" ]]; then
  [[ -z "$AGENT" ]] && { echo "Error: --agent required with --approve/--reject"; exit 1; }
  if [[ -n "$APPROVE" ]]; then
    handle_action "$PROPOSALS_BASE/$AGENT" "$APPROVE" "approve"
  else
    handle_action "$PROPOSALS_BASE/$AGENT" "$REJECT" "reject"
  fi
  exit 0
fi

list_proposals() {
  local agent="$1"
  local prop_dir="$PROPOSALS_BASE/$agent"
  [[ -d "$prop_dir" ]] || return

  local files=$(find "$prop_dir" -name "*.md" -exec grep -l "status: pending" {} \; 2>/dev/null | sort -r)
  [[ -z "$files" ]] && return

  echo "## $agent"
  for f in $files; do
    local ts=$(basename "$f" .md)
    local confidence=$(grep -oP 'Confidence.*?\K[0-9.]+' "$f" 2>/dev/null | head -1 || echo "?")
    echo "  [$ts] confidence: $confidence"
  done
  echo ""
}

echo "# Pending Proposals"
echo ""

if [[ "$ALL" == "true" ]]; then
  for d in "$PROPOSALS_BASE"/*/; do
    [[ -d "$d" ]] && list_proposals "$(basename "$d")"
  done
else
  list_proposals "$AGENT"
fi

#!/usr/bin/env bash
# feed-evolution.sh - Export performance data as JSON for evolution system
set -euo pipefail

AGENT=""
[[ "${1:-}" == "--agent" ]] && AGENT="${2:-}"

PERF_DIR="$HOME/obsidian-vault/Agents/Performance"

process_agent() {
  local f="$1"
  local agent=$(basename "$f" .md)
  local total=0 success=0 failure=0 partial=0 corrections_sum=0 duration_sum=0

  while IFS='|' read -r _ ts task outcome corr dur notes _; do
    outcome=$(echo "$outcome" | xargs)
    corr=$(echo "$corr" | xargs)
    dur=$(echo "$dur" | xargs)
    [[ "$outcome" =~ ^(success|failure|partial)$ ]] || continue
    ((total++)) || true
    case "$outcome" in
      success) ((success++)) || true ;;
      failure) ((failure++)) || true ;;
      partial) ((partial++)) || true ;;
    esac
    corrections_sum=$((corrections_sum + ${corr:-0}))
    duration_sum=$((duration_sum + ${dur:-0}))
  done < "$f"

  if [[ $total -gt 0 ]]; then
    local rate=$(echo "scale=3; $success / $total" | bc)
    local avg_corr=$(echo "scale=2; $corrections_sum / $total" | bc)
    local avg_dur=$(echo "scale=2; $duration_sum / $total" | bc)
    printf '{"agent":"%s","total":%d,"success":%d,"failure":%d,"partial":%d,"success_rate":%s,"avg_corrections":%s,"avg_duration_min":%s}' \
      "$agent" "$total" "$success" "$failure" "$partial" "$rate" "$avg_corr" "$avg_dur"
  fi
}

if [[ -n "$AGENT" ]]; then
  f="$PERF_DIR/${AGENT}.md"
  [[ -f "$f" ]] || { echo "No data for agent: $AGENT"; exit 1; }
  process_agent "$f"
  echo
else
  echo "["
  first=true
  for f in "$PERF_DIR"/*.md; do
    [[ -f "$f" ]] || continue
    result=$(process_agent "$f")
    [[ -z "$result" ]] && continue
    $first || echo ","
    echo "  $result"
    first=false
  done
  echo "]"
fi

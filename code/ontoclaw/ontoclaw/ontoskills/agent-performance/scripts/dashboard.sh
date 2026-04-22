#!/usr/bin/env bash
# dashboard.sh - Render markdown performance dashboard
set -euo pipefail

PERF_DIR="$HOME/obsidian-vault/Agents/Performance"

if [[ ! -d "$PERF_DIR" ]] || [[ -z "$(ls "$PERF_DIR"/*.md 2>/dev/null)" ]]; then
  echo "No performance data found in $PERF_DIR"
  exit 0
fi

echo "# Agent Performance Dashboard"
echo ""
echo "| Agent | Tasks | Success% | Avg Corrections | Avg Duration |"
echo "|-------|-------|----------|-----------------|--------------|"

for f in "$PERF_DIR"/*.md; do
  agent=$(basename "$f" .md)
  total=0; success=0; corrections_sum=0; duration_sum=0

  while IFS='|' read -r _ ts task outcome corr dur notes _; do
    outcome=$(echo "$outcome" | xargs)
    corr=$(echo "$corr" | xargs)
    dur=$(echo "$dur" | xargs)
    [[ "$outcome" =~ ^(success|failure|partial)$ ]] || continue
    ((total++)) || true
    [[ "$outcome" == "success" ]] && ((success++)) || true
    corrections_sum=$((corrections_sum + ${corr:-0}))
    duration_sum=$((duration_sum + ${dur:-0}))
  done < "$f"

  if [[ $total -gt 0 ]]; then
    pct=$((success * 100 / total))
    avg_corr=$(echo "scale=1; $corrections_sum / $total" | bc)
    avg_dur=$(echo "scale=1; $duration_sum / $total" | bc)
    echo "| $agent | $total | ${pct}% | $avg_corr | ${avg_dur}m |"
  fi
done

echo ""
echo "_Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")_"

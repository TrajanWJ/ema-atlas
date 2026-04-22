#!/usr/bin/env bash
# reflect.sh - Analyze performance data and generate structured reflection
# Parses structured markdown performance files (Entry-based format)
set -euo pipefail

AGENT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --agent) AGENT="$2"; shift 2 ;;
    -h|--help) echo "Usage: $0 --agent NAME"; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

[[ -z "$AGENT" ]] && { echo "Error: --agent is required"; exit 1; }

PERF_FILE="$HOME/vault/Agents/Performance/${AGENT}.md"
[[ -f "$PERF_FILE" ]] || { echo "Error: No performance data for agent: $AGENT"; exit 1; }

# Parse structured markdown entries
TOTAL=0 SUCCESS=0 FAILURE=0 PARTIAL=0 CORRECTIONS_SUM=0
DURATIONS=()
TASKS=()
FAILURE_TASKS=()

while IFS= read -r line; do
  case "$line" in
    *"- **Task**:"*|*"- Task:"*)
      CURRENT_TASK="${line#*: }"
      ;;
    *"- **Outcome**:"*|*"- Outcome:"*)
      outcome="${line#*: }"
      outcome=$(echo "$outcome" | xargs | tr '[:upper:]' '[:lower:]')
      # Handle outcomes like "11/15 passed (73%)" or percentage-based
      if [[ "$outcome" =~ ([0-9]+)/([0-9]+) ]]; then
        passed="${BASH_REMATCH[1]}"
        total_tests="${BASH_REMATCH[2]}"
        if [[ "$passed" -eq "$total_tests" ]]; then
          outcome="success"
        elif [[ "$passed" -gt 0 ]]; then
          outcome="partial"
        else
          outcome="failure"
        fi
      elif [[ "$outcome" =~ ([0-9]+)% ]]; then
        pct="${BASH_REMATCH[1]}"
        if [[ "$pct" -ge 80 ]]; then outcome="success"
        elif [[ "$pct" -ge 50 ]]; then outcome="partial"
        else outcome="failure"; fi
      fi
      ((TOTAL++)) || true
      TASKS+=("$CURRENT_TASK")
      case "$outcome" in
        success) ((SUCCESS++)) || true ;;
        failure) ((FAILURE++)) || true; FAILURE_TASKS+=("$CURRENT_TASK") ;;
        partial) ((PARTIAL++)) || true; FAILURE_TASKS+=("$CURRENT_TASK (partial)") ;;
      esac
      ;;
    *"- **Corrections**:"*|*"- Corrections:"*)
      corr="${line#*: }"
      corr=$(echo "$corr" | grep -oP '^\d+' || echo "0")
      CORRECTIONS_SUM=$((CORRECTIONS_SUM + corr))
      ;;
    *"- **Duration**:"*|*"- Duration:"*)
      dur="${line#*: }"
      dur_min=$(echo "$dur" | grep -oP '^\d+' || echo "0")
      DURATIONS+=("$dur_min")
      ;;
  esac
done < "$PERF_FILE"

[[ $TOTAL -eq 0 ]] && { echo "No task records found for $AGENT"; exit 0; }

SUCCESS_RATE=$((SUCCESS * 100 / TOTAL))
AVG_CORR=$(echo "scale=1; $CORRECTIONS_SUM / $TOTAL" | bc 2>/dev/null || echo "0")

# Calculate avg duration
TOTAL_DUR=0
for d in "${DURATIONS[@]:-}"; do
  TOTAL_DUR=$((TOTAL_DUR + ${d:-0}))
done
if [[ ${#DURATIONS[@]} -gt 0 ]]; then
  AVG_DUR=$((TOTAL_DUR / ${#DURATIONS[@]}))
else
  AVG_DUR=0
fi

cat <<EOF
# Reflection: ${AGENT}
Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

## Performance Summary
- Total tasks: $TOTAL
- Success rate: ${SUCCESS_RATE}%
- Successes: $SUCCESS
- Failures: $FAILURE
- Partial completions: $PARTIAL
- Avg corrections per task: $AVG_CORR
- Avg duration: ${AVG_DUR}min

## Failure Analysis
$(if [[ ${#FAILURE_TASKS[@]} -gt 0 ]]; then
  for ft in "${FAILURE_TASKS[@]}"; do
    echo "- $ft"
  done
else
  echo "- No failures recorded"
fi)

## Analysis
$(if [[ $SUCCESS_RATE -ge 80 ]]; then
  echo "- Strong overall performance (${SUCCESS_RATE}%). Focus on reducing the remaining ${FAILURE} failure(s)."
elif [[ $SUCCESS_RATE -ge 50 ]]; then
  echo "- Moderate performance (${SUCCESS_RATE}%). Significant room for improvement."
  echo "- Review failed tasks for scope or prompt clarity issues."
else
  echo "- Poor performance (${SUCCESS_RATE}%). SOUL.md may need significant revision."
  echo "- Consider reviewing task delegation patterns and narrowing scope."
fi)
$(if (( $(echo "$AVG_CORR > 2" | bc -l 2>/dev/null || echo 0) )); then
  echo "- High correction frequency ($AVG_CORR/task) — agent needs better initial task understanding."
fi)
$(if [[ $AVG_DUR -gt 10 ]]; then
  echo "- Long average runtime (${AVG_DUR}min) — consider tighter scope or timeout enforcement."
fi)

## Recommendations
$(if [[ $FAILURE -gt 0 ]]; then
  echo "- Review failure cases for common patterns (scope too broad? missing context?)"
fi)
$(if [[ $PARTIAL -gt 0 ]]; then
  echo "- Partial completions suggest scope/capability mismatches — tighten dispatch scope"
fi)
$(if [[ $AVG_DUR -gt 5 ]]; then
  echo "- Enforce incremental writes every 2min to survive timeouts"
fi)
- Review SOUL.md specificity — is the agent's domain clearly bounded?
- Cross-check with agent-performance.md dispatch history
EOF

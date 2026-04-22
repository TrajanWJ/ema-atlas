#!/usr/bin/env bash
# log-task.sh - Log agent task completion to vault
set -euo pipefail

AGENT="" TASK="" OUTCOME="" CORRECTIONS=0 DURATION=0 NOTES=""

usage() {
  echo "Usage: $0 --agent NAME --task DESC --outcome success|failure|partial [--corrections N] [--duration-min N] [--notes TEXT]"
  exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --agent) AGENT="$2"; shift 2 ;;
    --task) TASK="$2"; shift 2 ;;
    --outcome) OUTCOME="$2"; shift 2 ;;
    --corrections) CORRECTIONS="$2"; shift 2 ;;
    --duration-min) DURATION="$2"; shift 2 ;;
    --notes) NOTES="$2"; shift 2 ;;
    -h|--help) usage 0 ;;
    *) echo "Unknown option: $1"; usage 1 ;;
  esac
done

[[ -z "$AGENT" || -z "$TASK" || -z "$OUTCOME" ]] && { echo "Error: --agent, --task, and --outcome are required"; usage 1; }
[[ "$OUTCOME" =~ ^(success|failure|partial)$ ]] || { echo "Error: --outcome must be success|failure|partial"; exit 1; }

PERF_DIR="$HOME/obsidian-vault/Agents/Performance"
PERF_FILE="$PERF_DIR/${AGENT}.md"
mkdir -p "$PERF_DIR"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if [[ ! -f "$PERF_FILE" ]]; then
  cat > "$PERF_FILE" <<EOF
---
agent: ${AGENT}
type: performance-log
---

# ${AGENT} Performance Log

| Timestamp | Task | Outcome | Corrections | Duration (min) | Notes |
|-----------|------|---------|-------------|----------------|-------|
EOF
fi

echo "| ${TIMESTAMP} | ${TASK} | ${OUTCOME} | ${CORRECTIONS} | ${DURATION} | ${NOTES} |" >> "$PERF_FILE"
echo "Logged: ${AGENT} / ${TASK} → ${OUTCOME}"

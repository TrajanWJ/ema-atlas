#!/usr/bin/env bash
# install-cron.sh - Schedule recurring evolution runs via crontab
set -euo pipefail

AGENT="" SCHEDULE="0 3 * * 0"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --agent) AGENT="$2"; shift 2 ;;
    --schedule) SCHEDULE="$2"; shift 2 ;;
    -h|--help) echo "Usage: $0 --agent NAME [--schedule 'CRON_EXPR']"; echo "Default: weekly Sunday 3am"; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

[[ -z "$AGENT" ]] && { echo "Error: --agent is required"; exit 1; }

LOOP_SCRIPT="$HOME/skills/evolution-loop/scripts/run-loop.sh"
LOG_DIR="$HOME/.evolution-snapshots/logs"
mkdir -p "$LOG_DIR"

TAG="# evolution-loop:${AGENT}"
CRON_LINE="${SCHEDULE} ${LOOP_SCRIPT} --agent ${AGENT} >> ${LOG_DIR}/${AGENT}.log 2>&1 ${TAG}"

# Remove existing entry for this agent, add new one
(crontab -l 2>/dev/null | grep -v "evolution-loop:${AGENT}"; echo "$CRON_LINE") | crontab -

echo "Installed cron for ${AGENT}: ${SCHEDULE}"
echo "Log: ${LOG_DIR}/${AGENT}.log"
echo "Verify: crontab -l | grep evolution-loop"

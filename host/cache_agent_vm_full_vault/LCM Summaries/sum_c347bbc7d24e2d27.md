# LCM Summary sum_c347bbc7d24e2d27

Created: 2026-03-19 07:39:47
Kind: leaf
Depth: 0
Conversation: 509
Tokens: 1215
Descendants: 0
Earliest: 2026-03-19T04:26:36.000Z
Latest: 2026-03-19T04:26:37.000Z

## Content

[2026-03-19 04:26 UTC]
#!/bin/bash
# work-engine.sh — The 24/7 sequential work chain with task chaining
# 
# Design: Triggered by cron every 10 min. Picks highest-priority task from
# ~/dispatch/queue/, executes it, then CHAINS to the next task immediately
# without waiting for the next cron cycle.
#
# State: Maintains work-engine-state.json with current task, completed count,
# chain length, and circuit breaker status.
#
# Circuit breaker: 3 consecutive failures → pause 30 min and alert.

set -euo pipefail

LOCKFILE="/tmp/work-engine.lock"
PIDFILE="/tmp/work-engine-agent.pid"
LOG="/var/log/work-engine.log"
COOLDOWN_FILE="/tmp/work-engine-last"
COOLDOWN=540  # 9 min minimum between cron triggers

QUEUE_DIR="$HOME/dispatch/queue"
ACTIVE_DIR="$HOME/dispatch/active"
DONE_DIR="$HOME/dispatch/done"
FAILED_DIR="$HOME/dispatch/failed"
STATE_FILE="$HOME/.openclaw/agents/main/workspace/work-engine-state.json"
HEALTH_FILE="$HOME/dispatch/agent-health.json"
MAX_CHAIN=5  # Max tasks per chain before yielding to cron

log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" >> "$LOG"; }

mkdir -p "$QUEUE_DIR" "$ACTIVE_DIR" "$DONE_DIR" "$FAILED_DIR" "$(dirname "$STATE_FILE")"

# Initialize state file if missing
init_state() {
    if [[ ! -f "$STATE_FILE" ]]; then
        cat > "$STATE_FILE" <<'EOF'
{
  "current_task": null,
  "completed_today": 0,
  "last_completed": null,
  "chain_length": 0,
  "consecutive_failures": 0,
  "paused_until": null,
  "last_cycle": null,
  "today": null
}
EOF
    fi
}

# Read a field from state JSON
state_get() {
    python3 -c "import json; print(json.load(open('$STATE_FILE')).get('$1', '$2'))" 2>/dev/null || echo "$2"
}

# Update state file (key=value pairs)
state_set() {
    local tmp="${STATE_FILE}.tmp"
    local py_updates=""
    while [[ $# -ge 2 ]]; do
        local key="$1" val="$2"
        shift 2
        # Detect type: null, number, or string
        if [[ "$val" == "null" ]]; then
            py_updates="${py_updates}d['$key']=None; "
        elif [[ "$val" =~ ^[0-9]+$ ]]; then
            py_updates="${py_updates}d['$key']=$val; "
        else
            py_updates="${py_updates}d['$key']='$val'; "
        fi
    done
    python3 -c "
import json
d = json.load(open('$STATE_FILE'))
${py_updates}
json.dump(d, open('$tmp', 'w'), indent=2)
" 2>/dev/null && mv "$tmp" "$STATE_FILE"
}

# Reset daily counter if date changed
check_daily_reset() {
    local today
    today=$(date -u +%Y-%m-%d)
    local state_today
    state_today=$(state_get "today" "")
    if [[ "$state_today" != "$today" ]]; then
        state_set "today" "$today" "completed_today" "0" "chain_length" "0"
        log "📅 Daily counter reset for $today"
    fi
}

# Circuit breaker check: 3 consecutive failures → pause 30 min
check_circuit_breaker() {
    local failures
    failures=$(state_get "consecutive_failures" "0")
    local paused_until
    paused_until=$(state_get "paused_until" "null")

    # Check if we're in a pause period
    if [[ "$paused_until" != "null" && "$paused_until" != "None" ]]; then
        local pause_epoch
        pause_epoch=$(date -d "$paused_until" +%s 2>/dev/null || echo 0)
        local now_epoch
        now_epoch=$(date +%s)
        if [[ $now_epoch -lt $pause_epoch ]]; then
            local remaining=$(( (pause_epoch - now_epoch) / 60 ))
            log "⏸️  Circuit breaker active — ${remaining}min remaining"
            return 1
        fi
        # Pause expired, reset
        state_set "paused_until" "null" "consecutive_failures" "0"
        log "🔄 Circuit breaker reset — resuming"
    fi

    # Check if we hit 3 failures
    if [[ "$failures" -ge 3 ]]; then
        local pause_until
        pause_until=$(date -u -d "+30 minutes" +%Y-%m-%dT%H:%M:%SZ)
        state_set "paused_until" "$pause_until"
        log "🔴 CIRCUIT BREAKER TRIPPED: $failures consecutive failures. Paused until $pause_until"
        
        # Alert via dispatch-notify
        if [[ -x "$HOME/bin/dispatch-notify.sh" ]]; then
            "$HOME/bin/dispatch-notify.sh" "fail" "🔴 **Work Engine Circuit Breaker** — $failures consecutive failures. Paused for 30 min." &
        fi
        return 1
    fi
    return 0
}

# Pick the highest-priority task from queue
# Sort by priority (P1 < P2 < P3 < P4), then by creation time (oldest first)
pick_next_task() {
    local best_file=""
    local best_priority=99
    local best_created="9999"

    for f in "$QUEUE_DIR"/*.json; do
        [[ -f "$f" ]] || continue

        local pri_str
        pri_str=$(python3 -c "import json; print(json.load(open('$f')).get('priority', 'P9'))" 2>/dev/null || echo "P9")
        local pri_num="${pri_str//[^0-9]/}"
        pri_num="${pri_num:-9}"
        
        local created
        created=$(python3 -c "import json; print(json.load(open('$f')).get('cre
[LCM fallback summary; truncated for context management]

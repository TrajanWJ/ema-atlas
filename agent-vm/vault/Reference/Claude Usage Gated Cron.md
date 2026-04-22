---
title: "Claude Usage Gated Cron"
created: 2026-03-14
updated: 2026-04-15
type: reference
status: active
confidence: 0.75
confidence_updated: 2026-04-15
source: auto-capture
tags: [claude, code, knowledge, ops, skills]
summary: "Usage-gated cron pattern: runs expensive background tasks only when Claude subscription usage is below threshold, now using pace file instead of openclaw CLI"
---
# Claude Usage-Gated Cron Pattern

**Created:** 2026-03-14
**Status:** Active

## What It Does

Runs expensive background tasks (like [[auto-knowledge]] extraction) **only when Claude subscription usage is below a threshold**. Prevents burning through your weekly quota on background work.

## How to Check Usage

### Current Method (EMA v5, as of 2026-04-15)

Usage data is read from a pace file:

```bash
# Check the pace file
cat ~/.claude-pace.json
# Example: {"timestamp":1713100000,"used_pct":35,"window_remaining":65}
```

- `used_pct`: Percentage of weekly quota consumed
- `timestamp`: Unix epoch when pace data was last updated
- If pace file is >6h old, the gate proceeds anyway (stale data = don't block)

### Legacy Method (pre-EMA v5)

```bash
# Via OpenClaw CLI (may still work)
openclaw models status 2>&1 | grep "anthropic usage:"
```

## The Gated Script

**Location:** `/home/trajan/bin/auto-knowledge-gated.sh`

```bash
# Key logic (EMA v5 — reads pace file, not openclaw CLI):
PACE_FILE=/home/trajan/.claude-pace.json
USED_PCT=$(jq -r '.used_pct // 0' "$PACE_FILE" 2>/dev/null)
if [ "$USED_PCT" -gt 55 ]; then
    # Skip — more than 55% of weekly quota used
    exit 0
fi
# Run the actual task
```

**Threshold:** 55% used. If pace file is missing or >6h stale, proceeds anyway.

Uses `flock` for concurrency safety (red-team fix from 2026-03).

## Cron Schedule

```
# Current (EMA v5 — as of 2026-04-15):
0 */6 * * *  flock -n /tmp/transcript-scanner.lock /home/trajan/bin/transcript-scanner.sh
```

Runs every 6 hours (was every 3 hours pre-EMA v5). The transcript scanner calls the gated script internally.

## Applying This Pattern

Any expensive background task can use this gate:

```bash
#!/bin/bash
PACE_FILE=/home/trajan/.claude-pace.json
exec 200>"/tmp/my-gated-task.lock"
flock -n 200 || exit 0  # prevent concurrent runs

USED_PCT=$(jq -r '.used_pct // 0' "$PACE_FILE" 2>/dev/null)
[ -z "$USED_PCT" ] && USED_PCT=0  # no pace file = proceed
[ "$USED_PCT" -gt 55 ] && exit 0  # too expensive
# ... your task here ...
```

## Logs

- Gate decisions: `/tmp/auto-knowledge-gated.log`
- Capture output: `/tmp/auto-knowledge-last.md`

## Related

- [[OpenClaw Extensions]] — [[Engram]] plugin config
- [[System Services]] — all cron jobs
- [[claude-usage-check]] skill: `~/.openclaw/agents/main/workspace/skills/claude-usage-check/`

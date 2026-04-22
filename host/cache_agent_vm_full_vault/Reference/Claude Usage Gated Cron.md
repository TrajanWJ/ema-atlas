---
title: "Claude Usage Gated Cron"
created: 2026-03-14
updated: 2026-03-14
type: reference
status: active
confidence: 0.40
confidence_updated: 2026-03-18
source: auto-capture
tags: [claude, code, knowledge, openclaw, ops, skills]
summary: "Runs expensive background tasks (like [[auto-knowledge]] extraction) **only when Claude subscription usage is below a threshold**. Prevents burning th"
---
# Claude Usage-Gated Cron Pattern

**Created:** 2026-03-14
**Status:** Active

## What It Does

Runs expensive background tasks (like [[auto-knowledge]] extraction) **only when Claude subscription usage is below a threshold**. Prevents burning through your weekly quota on background work.

## How to Check Usage

```bash
# Quick check via OpenClaw
openclaw models status 2>&1 | grep "anthropic usage:"
# Output: anthropic usage: 5h 0% left ⏱21m · Week 74% left ⏱5d 11h

# Full check via skill script
bash ~/.openclaw/agents/main/workspace/skills/claude-usage-check/scripts/check-usage.sh
```

### Reading the Output

```
anthropic usage: 5h 0% left ⏱21m · Week 74% left ⏱5d 11h
                 ^^^^^^^^^^        ^^^^^^^^^^^^
                 5h window: 0%     Weekly: 74% remaining
                 remaining         (= 26% used)
                 resets in 21m     resets in 5d 11h
```

- **5h window**: Short-term rate limit. Resets every 5 hours.
- **Week**: Total weekly allocation. This is what matters for budgeting.
- "74% left" means 26% used — plenty of room.

## The Gated Script

**Location:** `/home/trajan/bin/auto-knowledge-gated.sh`

```bash
# Key logic:
WEEKLY_REMAINING=$(openclaw models status 2>&1 | grep "anthropic usage:" | grep -oP 'Week \K\d+(?=% left)')
if [ "$WEEKLY_REMAINING" -lt 45 ]; then
    # Skip — more than 55% of weekly quota used
    exit 0
fi
# Run the actual task
bash /path/to/capture.sh
```

**Threshold:** 45% remaining = 55% used. Configurable via `USAGE_THRESHOLD` variable.

## Cron Schedule

```
0 */3 * * *  bash /home/trajan/bin/auto-knowledge-gated.sh
```

Runs every 3 hours. Checks usage first, only runs [[auto-knowledge]] if weekly usage < 55%.

## Applying This Pattern

Any expensive background task can use this gate:

```bash
#!/bin/bash
USAGE_LINE=$(timeout 10 openclaw models status 2>&1 | grep "anthropic usage:" | head -1)
WEEKLY_REMAINING=$(echo "$USAGE_LINE" | grep -oP 'Week \K\d+(?=% left)')
[ -z "$WEEKLY_REMAINING" ] && exit 0  # can't check = don't run
[ "$WEEKLY_REMAINING" -lt 45 ] && exit 0  # too expensive
# ... your task here ...
```

## Logs

- Gate decisions: `/tmp/auto-knowledge-gated.log`
- Capture output: `/tmp/auto-knowledge-last.md`

## Related

- [[OpenClaw Extensions]] — [[Engram]] plugin config
- [[System Services]] — all cron jobs
- [[claude-usage-check]] skill: `~/.openclaw/agents/main/workspace/skills/claude-usage-check/`

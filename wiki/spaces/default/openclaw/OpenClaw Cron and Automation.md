---
title: "OpenClaw Cron and Automation"
type: reference
created: 2026-04-06
tags: [openclaw, archived, cron, automation, scheduling]
summary: "Cron definitions, automation patterns, and scheduling lessons from OpenClaw"
---

# OpenClaw Cron and Automation

## Active Cron Jobs (at shutdown)

### 1. vault-feed (every 30m)
- **Agent:** main
- **Session:** isolated
- **Task:** Check for new/updated vault files in last 30 minutes, post summary if changes found
- **Timeout:** 120s

### 2. github-interesting (every 30m)
- **Agent:** main
- **Session:** isolated
- **Model:** claude-sonnet-4-6
- **Task:** Find 5-10 interesting GitHub items, post to Discord #github-interesting (channel 1482258431997116531) using components v2, save best to vault
- **Timeout:** 300s

### 3. transcript-scanner (every 6h)
- **Agent:** main
- **Session:** isolated
- **Model:** claude-sonnet-4-6
- **Task:** Process `/tmp/auto-knowledge-queue.md` for knowledge suggestions, write top 1-2 to vault notes, delete processed entries

### 4. morning-briefing (daily at 14:00 UTC)
- **Agent:** main
- **Session:** isolated
- **Task:** Execute `/home/trajan/bin/morning-briefing.sh`, post output to #concierge (channel 1482997518362214422) with identity bar

## Schedule Types

- `at` -- one-shot (fire once at specific time)
- `every` -- interval (repeat every N minutes/hours)
- `cron` -- crontab syntax (precise schedules)

## Execution Modes

- **Main session**: shared context, has conversation history
- **Isolated session**: fresh context, no history, cleaner but no memory

## Heartbeat vs Cron Decision Matrix

**Use heartbeat when:**
- Multiple checks batch together (inbox + calendar + notifications in one turn)
- Need conversational context from recent messages
- Timing can drift slightly (every ~30 min is fine)
- Want to reduce API calls by combining checks

**Use cron when:**
- Exact timing matters ("9:00 AM sharp every Monday")
- Task needs isolation from main session history
- Want a different model or thinking level
- One-shot reminders
- Output should deliver directly to a channel without main session involvement

## Known Issues and Lessons

1. **`openclaw doctor --fix` wipes crons** -- always verify after running doctor
2. **Duplicate crons on restart** -- without matching IDs in definitions, gateway restarts create duplicates (incident: 18 duplicates found on March 17)
3. **Engine starvation pattern** -- harvesters creating seeds without schedules caused proposal engine to stall (fixed April 5)
4. **IDs must be stable** -- cron-definitions.json IDs must match jobs.json to prevent restart duplicates

## Cron Persistence Architecture

```
cron-definitions.json  (source of truth, survives doctor --fix)
       |
       v
    jobs.json  (runtime state, can be corrupted)
       |
       v
    runs/      (JSONL execution logs per job ID)
```

The `_comment` and `_updated` fields in cron-definitions.json serve as documentation headers.

## Related

- [[OpenClaw System Overview]]
- [[OpenClaw System Environment]]
- [[OpenClaw Protocols]]

---
title: Queue Architecture v2
created: '2026-03-19'
updated: '2026-03-19'
type: knowledge
status: active
confidence: 0.95
source: 'agent:main'
domain: agent-architecture
summary: >-
  Dispatch v2 — single script, 5 task sources, feedback loops, replacing 22 dead
  scripts with 3 working ones
tags:
  - dispatch
  - queue
  - architecture
  - feedback-loop
aliases:
  - dispatch-v2
  - queue-v2
wiki_id: system/architecture/Queue_Architecture_v2
imported_from: vault/Architecture/Queue Architecture v2.md
imported_at: '2026-04-04T00:23:56.773Z'
---

# Queue Architecture v2

> **Shipped:** 2026-03-19
> **Replaces:** dispatch-engine.sh + 21 helper scripts, DAG resolver, DLQ, 14 dead directories

## Core Insight

The previous system failed because it tried to be infrastructure. Bash cron spawning Claude Code processes is too many indirection layers. The fix: **Right Hand IS the executor.** No separate engine. Tasks queue up as files, Right Hand drains them during heartbeats.

## Architecture

```
TASK SOURCES                           QUEUE                    EXECUTOR
─────────────────                ─────────────────          ──────────────
Trajan (P0-P1) ──┐              ~/dispatch/queue/          Right Hand
Feedback chains ──┤                    │                   (during heartbeats)
Signals (3h) ─────┤──→ dispatch.sh add │──→ dispatch.sh run ──→ sessions_spawn
Schedule (1h) ────┤                    │                         │
Self-generated ───┘              ┌─────┴─────┐                   │
                                 │           │                   │
                            active/      done/  ←── dispatch.sh done
                                         │                      │
                                    failed/ ←── dispatch.sh fail │
                                         │                      │
                                         └── outcome-tracker.json
                                                     │
                                              fitness-recalc.sh
                                                     │
                                              agent-performance.md
```

## The Five Task Sources

### Source 1: Trajan (P0-P1)
Direct instruction in any channel. Right Hand parses intent, determines agent + priority, queues via `dispatch.sh add`.

### Source 2: Feedback Chains (P1-P2)
Tasks have `on_complete` fields that auto-queue follow-ups:
```json
"on_complete": {
  "if_success": { "agent": "coder", "description": "write tests for {output}" },
  "if_fail": { "agent": "coder", "description": "debug: {error}" }
}
```
This is the **chaining primitive** — it's how work propagates without human intervention.

### Source 3: Signals (P2-P3)
`signal-to-queue.sh` runs every 3h. Detects conditions, queues tasks:
- Vault staleness (>20 notes older than 30 days)
- High correction rate (>3/day → update SOUL.md)
- Disk pressure (>85%)
- Failed task pileup (>10)
- Fitness recalc trigger (>20 new outcomes)

Extensible — add new signal detectors as bash functions.

### Source 4: Schedule (P3)
`~/dispatch/schedule.json` defines recurring tasks. Loaded hourly by `dispatch.sh schedule`. Deduplicates by checking if already queued today.

### Source 5: Self-Generated (P3-P4)
Right Hand notices patterns during work and queues improvements:
- "I've done this 3 times manually" → queue: create a script
- "Agent X keeps failing on Y" → queue: investigate

## Task Schema

```json
{
  "id": "task-a1b2c3",
  "created_at": "2026-03-19T21:00:00Z",
  "source": "trajan|signal|chain:task-xyz|schedule:weekly-hygiene",
  "priority": 2,
  "agent": "coder",
  "description": "Build feature X",
  "success_criteria": "Test passes",
  "timeout_min": 15,
  "depends_on": ["task-other"],
  "on_complete": {},
  "attempts": 0,
  "max_attempts": 2
}
```

## Feedback Loop

Every `dispatch.sh done` or `dispatch.sh fail` logs to `memory/outcome-tracker.json`:
```json
{
  "task_id": "task-a1b2c3",
  "agent": "coder",
  "result": "success",
  "duration_s": 180,
  "description": "Build feature X",
  "timestamp": "2026-03-19T21:15:00Z"
}
```

After 20+ outcomes: `fitness-recalc.sh` updates `memory/agent-performance.md` with per-agent fitness scores (Bayesian success rate with regularization).

## Crons (the full picture)

| Cron | Interval | Purpose |
|---|---|---|
| `signal-to-queue.sh` | 3h | Detect conditions → queue tasks |
| `dispatch.sh schedule` | 1h | Load recurring tasks |
| Heartbeat (OpenClaw) | ~15m | Right Hand drains queue |

**No dispatch engine cron.** No PID files. No circuit breakers. Just file-based queue + Right Hand.

## Related

- [[Discord UX Philosophy]]
- [[Aspirational Agent System]]
- [[Agent Architecture Overview]]
- [[AGENTS.md]]

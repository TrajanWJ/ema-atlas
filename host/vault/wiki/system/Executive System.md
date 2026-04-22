---
type: knowledge
domain: agent-architecture
summary: >-
  Executive functioning system - 15 CLI tools for goals, scheduling, focus,
  energy tracking, and personal management
confidence: 0.95
source: 'agent:main'
tags:
  - executive-function
  - productivity
  - tools
  - system
aliases:
  - exec system
  - executive tools
  - productivity system
created: '2026-03-19'
wiki_id: system/Executive_System
imported_from: vault/System/Executive System.md
imported_at: '2026-04-04T00:23:57.235Z'
---

# Executive Functioning System

A CLI-based executive functioning prosthetic. Two layers: agent management and human support.

## Quick Reference

### Daily Rhythm
```bash
# Morning
daily-planning.sh morning          # Review + set intentions
energy-tracker.sh log 4 4 3       # Log morning energy
focus-guard.sh start "deep task" --duration 90m

# During work
brain-dump.sh capture "random thought"
context-switch.sh save "current" --notes "where I am" --next "what to do next"
reminder-engine.sh add "check PR" --due "in 3 hours"

# Evening
daily-planning.sh evening          # Review + reflect
energy-tracker.sh log 2 2 3       # Log evening energy
```

### Agent Management
```bash
goal-manager.sh status             # Goal hierarchy tree
scheduler.sh today                 # Today's time blocks
deadline-tracker.sh upcoming       # Coming deadlines
checkin-engine.sh check            # Stale task alerts
initiative.sh list                 # Queued observations
estimate.sh predict coder code     # Duration prediction
```

### Full Dashboard
```bash
executive-dashboard-v3.sh          # Everything at a glance
executive-dashboard-v3.sh compact  # One-liner summary
```

## All Scripts

| Script | Layer | Purpose |
|--------|-------|---------|
| `reminder-engine.sh` | Both | Reminders with relative times, repeats, snooze |
| `goal-manager.sh` | Agent | Goals -> Projects -> Tasks hierarchy |
| `scheduler.sh` | Agent | Time-block scheduling with conflict detection |
| `checkin-engine.sh` | Agent | Stale task + agent health monitoring |
| `initiative.sh` | Both | Queue for noticed-but-not-urgent items |
| `deadline-tracker.sh` | Both | Deadline awareness with auto-bump |
| `estimate.sh` | Agent | Duration prediction from outcome history |
| `weekly-retro.sh` | Both | Structured weekly retrospective |
| `executive-dashboard-v3.sh` | Both | Unified dashboard |
| `exec-cron.sh` | Agent | Fires reminders + checks every 5min |
| `energy-tracker.sh` | Human | Energy/focus/mood tracking + patterns |
| `brain-dump.sh` | Human | Capture unstructured thoughts for later processing |
| `context-switch.sh` | Human | Save/restore working context |
| `daily-planning.sh` | Human | Morning planning + evening review |
| `focus-guard.sh` | Human | Focus blocks + deep work tracking |

## Data

All state in `~/data/` as JSON:
- `reminders.json` - Active/fired reminders
- `goals.json` - Goal hierarchy
- `schedule.json` - Time blocks
- `checkin-rules.json` + `checkin-state.json` - Monitoring rules
- `initiatives.json` - Observation queue
- `energy-log.json` - Energy readings
- `brain-dumps.json` - Captured thoughts
- `contexts.json` - Saved working contexts
- `focus-sessions.json` - Focus blocks + deep work minutes
- `daily-plans.json` - Intentions/wins/blockers

## Cron

- `exec-cron.sh` runs every 5 minutes - fires due reminders, checks deadlines, nudges on stale tasks

## Links

- [[Agent Performance]]
- [[AGENTS]]

---
_Created 2026-03-19. Updated by Right Hand._

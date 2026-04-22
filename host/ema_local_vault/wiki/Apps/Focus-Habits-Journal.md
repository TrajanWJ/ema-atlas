---
title: "Focus, Habits & Journal"
space: wiki
tags: ["apps","focus","habits","journal","personal"]
source: manual
---

# Focus, Habits & Journal

Personal productivity apps running inside EMA.

## Focus Timer

Pomodoro-style focus sessions linked to tasks.

```bash
ema focus start --duration 25 --task <id>   # Start 25min session
ema focus pause                              # Pause
ema focus resume                             # Resume
ema focus stop                               # End session
ema focus current                            # Active session state
ema focus today                              # Today's stats
ema focus weekly                             # This week's stats
```

| Endpoint | Purpose |
|----------|---------|
| `POST /api/focus/start` | Start (target_ms, break_ms, task_id) |
| `POST /api/focus/stop` | Stop |
| `POST /api/focus/pause` | Pause |
| `POST /api/focus/resume` | Resume |
| `GET /api/focus/current` | Active session |
| `GET /api/focus/today` | Today's stats |
| `GET /api/focus/weekly` | Weekly stats |

## Habits

Daily/weekly/monthly habit tracking with streaks.

```bash
ema habit list                    # All habits
ema habit create "Morning run"    # New habit
ema habit toggle <id>             # Toggle today
ema habit today                   # Today's checklist
ema habit archive <id>            # Archive
```

| Endpoint | Purpose |
|----------|---------|
| `GET /api/habits` | List all |
| `POST /api/habits` | Create |
| `GET /api/habits/today` | Today's logs |
| `POST /api/habits/:id/toggle` | Toggle date |
| `POST /api/habits/:id/archive` | Archive |

## Journal

Daily entries with mood, energy tracking, and full-text search.

```bash
ema journal read                              # Today's entry
ema journal read --date 2026-04-05            # Specific date
ema journal write "Shipped auth" --mood good  # Write entry
ema journal search "auth"                     # Full-text search
ema journal list                              # Recent entries (last 30)
```

Fields: content, one_thing, mood, energy_p (AM), energy_m (PM), energy_e (evening), gratitude, tags

| Endpoint | Purpose |
|----------|---------|
| `GET /api/journal/:date` | Read entry |
| `PUT /api/journal/:date` | Write/update |
| `GET /api/journal/search?q=X` | Search |

## Related

- [[CLI Reference]]
- [[Quick Reference]]

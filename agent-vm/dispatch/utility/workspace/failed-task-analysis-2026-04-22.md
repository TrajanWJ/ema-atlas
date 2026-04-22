---
title: "Failed Task Analysis — 2026-04-22"
type: analysis
created: 2026-04-22
agent: utility
task_id: task-1367c0c3
---

# Failed Task Analysis — 2026-04-22

**Analyzed:** 198 failed tasks (accumulated 2026-04-17 through 2026-04-21)
**Archived:** 198 (all superseded by recurring loops or newer active tasks)
**DB updated:** 78 DB-tracked tasks moved from `failed` → `cancelled`
**Remaining failures:** 0

---

## Failure Breakdown

| Category | Count | Agent | Date Range | Failure Reason |
|---|---|---|---|---|
| vault-improve | 85 (43%) | researcher | 04-17 to 04-21 | exit code 1 (84), exit code 0 (1) |
| utility-task | 42 (21%) | utility | 04-17 to 04-21 | exit code 1 (40), exit code 0 (1), parse error (1) |
| ops-task | 37 (19%) | ops | 04-17 to 04-21 | exit code 1 (37) |
| reddit-intel | 28 (14%) | researcher | 04-17 to 04-21 | exit code 1 (28) |
| github-trending | 5 (3%) | researcher | 04-17 to 04-21 | exit code 1 (5) |
| competitive-scan | 1 (<1%) | researcher | 04-20 | exit code 1 (1) |

### vault-improve (85 tasks — largest category)

Batches of 2-3 tasks every 4 hours. Running continuously across all 5 days. **100% failure rate** — zero vault-improve successes in done/ after 04-16. Most recent successes are from 04-14 to 04-16. New batch queued for 04-22.

This is the most concerning pattern — the researcher agent has been unable to complete vault-improve tasks for 5+ days.

### utility-task (42 tasks)

Two subtypes:
- **Vault staleness signals** (~38): Recurring every 3 hours. The note count varies (114-300 stale notes) confirming the staleness signal itself works. The utility agent fails to process them.
- **Dispatch failed-task analysis** (~4): Meta-tasks to analyze failures — ironic that they also failed. The current task (task-1367c0c3) is the active retry.

### ops-task (37 tasks)

All disk cleanup signals. Disk usage ranged 86-95% across the period. Recurring every 3 hours. Some succeeded (12 in done/) but most failed. Mid-day failures are consistent — possible resource contention when other agents are active.

### reddit-intel (28 tasks)

5-6 per day, all failed. Some succeed (14 in done/) but mostly from 04-14 to 04-15. Degraded sharply after 04-16.

### github-trending (5 tasks)

1 per day, all failed. Only 2 successes in done/ (04-14 and 04-15).

---

## Cross-Day Trends (04-17 through 04-21)

| Date | vault-improve | utility | ops | reddit-intel | github-trending | Total |
|---|---|---|---|---|---|---|
| 04-17 | 16 | 7 | 6 | 5 | 1 | 35 |
| 04-18 | 18 | 8 | 8 | 6 | 1 | 41 |
| 04-19 | 18 | 9 | 8 | 6 | 1 | 42 |
| 04-20 | 18 | 9 | 8 | 6 | 1 | 42 (+1 competitive) |
| 04-21 | 15 | 8 | 7 | 5 | 1 | 36 |

**Stable failure rate** — ~35-42 failures/day for 5 consecutive days. This is systemic, not transient.

---

## Root Cause Analysis

### Primary: Researcher agent degradation (119/198 = 60% of failures)

vault-improve, reddit-intel, github-trending, and competitive-scan all run under the researcher agent. Combined 119 failures with near-zero success rate after 04-16. This is the same pattern flagged in prior analyses (04-14 through 04-17) — it has not been resolved.

Likely causes (unchanged from prior reports):
- API rate limits or key issues
- Token budget exhaustion
- Agent process timeout
- Resource contention (disk at 86-95% may cause slow I/O)

### Secondary: Utility agent vault-staleness failures (38/198 = 19%)

The utility agent cannot process vault staleness signals. May share root cause with researcher (resource contention, disk space).

### Tertiary: Ops disk cleanup failures (37/198 = 19%)

The ops agent fails to clean disk during mid-day hours. The disk usage climbing from 86% to 95% over the period suggests the cleanup tasks are failing when they're most needed. Some off-peak successes (00:00, 03:00, 21:00) indicate the agent works when load is low.

---

## Systemic Issues

1. **No dedup guard**: Recurring signals create new tasks every 3 hours regardless of whether prior instances succeeded. A vault-staleness signal at 06:00 creates a new task even though the 03:00 task already failed. This is the primary contributor to failure accumulation.

2. **Failed tasks accumulate indefinitely**: 198 failures accumulated over 5 days with no automatic cleanup. Prior manual cleanups (04-13 through 04-17) each cleared the queue, but it re-fills at ~35-42/day.

3. **Disk pressure feedback loop**: Disk cleanup tasks fail → disk stays full → other agents fail due to disk pressure → more failed tasks accumulate → more cleanup tasks are created. This is a positive feedback loop.

---

## Recommendations

1. **P0: Investigate researcher agent** — 60% of failures. Check API keys, rate limits, token budgets, and process health. This is the 8th+ consecutive day of degradation.

2. **P1: Add recurring task dedup** — "Skip if same-type task succeeded in last 6h" would eliminate ~60% of failure accumulation.

3. **P1: Fix disk cleanup** — The 86%→95% trend is dangerous. The ops agent should be given priority scheduling or run at fixed off-peak hours (00:00, 06:00) where it succeeds.

4. **P2: Auto-archive old failures** — Add a sweep that archives failed tasks older than 48h if a newer instance exists (active or done).

5. **P3: Exit-code-0 failures** — 2 tasks exited cleanly but were marked failed. The task runner should log why.

---

## Actions Taken

- Moved all 198 failed task files from `failed/` to `archive/cleared-20260422/`
- Updated 78 DB-tracked tasks from `failed` to `cancelled` with audit log entries
- `failed/` directory is now clean (0 entries)
- DB status: active=10, cancelled=181, done=64, queued=1

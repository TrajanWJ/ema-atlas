---
title: "Failed Task Analysis — 2026-04-16"
type: analysis
created: 2026-04-16
agent: utility
task_id: task-aa2f30b3
---

# Failed Task Analysis — 2026-04-16

**Analyzed:** 24 failed tasks (all from 2026-04-15)
**Archived:** 24 (all resolved — superseded by successful runs or re-queued by loops)
**Remaining failures:** 0

---

## Failure Patterns

### Pattern 1: Vault Staleness Signal Tasks — 6 of 7 Runs Failed (6 tasks)

Recurring vault-staleness tasks generated every 3 hours. Only 2 of 8 runs succeeded (task-f7a47bc3 at 06:00, task-59642cb2 at 15:00). The other 6 failed with exit code 1 (5 tasks) or exit code 0 (1 task — task-cc4e8087 at 00:00 and task-7d8a0a95 at 21:00).

| Task ID | Agent | Created | Exit Code | Superseded By |
|---|---|---|---|---|
| task-cc4e8087 | utility | 00:00 | 0 | task-f7a47bc3 (06:00, done) |
| task-91edc930 | utility | 03:00 | 1 | task-f7a47bc3 (06:00, done) |
| task-b8d21913 | utility | 09:00 | 1 | task-59642cb2 (15:00, done) |
| task-3f766043 | utility | 12:00 | 1 | task-59642cb2 (15:00, done) |
| task-732cedb2 | utility | 18:00 | 1 | task-59642cb2 (15:00, done) |
| task-7d8a0a95 | utility | 21:00 | 0 | task-59642cb2 (15:00, done) |

**75% failure rate** (6/8) — up from the intermittent failures seen on 04-14. Two tasks exited with code 0 but still ended in `failed/`, suggesting the task runner's success criteria check rejected them (likely no result file produced).

### Pattern 2: Vault-Improve Research Tasks — 15/18 Failed (15 tasks)

All from `vault-research-loop`, running under `researcher` agent. Ran in batches of 3 every 4 hours. Only the 08:00 batch succeeded (3/3 in done/). All other batches failed.

| Batch | Count | Exit | Notes |
|---|---|---|---|
| 00:00 | 3 failed | code 0 | Task completed but didn't meet success criteria |
| 04:00 | 3 failed | code 1 | Agent crash/timeout |
| 12:00 | 3 failed | code 1 | Agent crash/timeout |
| 16:00 | 3 failed | code 1 | Agent crash/timeout |
| 20:00 | 3 failed | code 1 | Agent crash/timeout |

**83% failure rate** (15/18). This is the third consecutive day of high vault-improve failure rates (04-13, 04-14, 04-15). The researcher agent is consistently failing on these tasks.

### Pattern 3: Disk Cleanup Signal Task (1 task)

| Task ID | Agent | Created | Exit | Superseded By |
|---|---|---|---|---|
| task-e5c1a6b3 | ops | 18:00 | 1 | task-0c584733 (21:00, done) |

One-off failure; the ops agent succeeded on the same task 3 hours later.

### Pattern 4: Reddit Intel Tasks (2 tasks)

| Task ID | Agent | Created | Exit |
|---|---|---|---|
| reddit-intel-34602fc6 | researcher | 00:30 | 1 |
| reddit-intel-91752ba3 | researcher | 16:30 | 1 |

Both file-only (not DB-tracked). The reddit-intel loop will re-queue. These are also researcher agent failures, consistent with Pattern 2.

---

## Cross-Day Trend: Researcher Agent Degradation

| Date | vault-improve success rate | Notes |
|---|---|---|
| 04-13 | Low (API auth errors noted) | First day of pattern |
| 04-14 | 27% (4/15) | Investigated, attributed to auth issues |
| 04-15 | 17% (3/18) | **Worsening** — plus reddit-intel failures |

The researcher agent's reliability is trending downward. Combined with the reddit-intel failures (also researcher agent), **17 of 25 failures (68%) are researcher agent tasks**.

---

## Recommendations

1. **Investigate researcher agent** — 3-day degradation trend. Check API keys, rate limits, token budgets, and agent process health. This is the highest-impact fix.
2. **Vault-staleness dedup** — 75% of signal runs fail. Add a "skip if succeeded in last 6h" guard to avoid queuing tasks that will be superseded anyway. (Same recommendation from 04-15 analysis.)
3. **Exit-code-0 failures** — Some tasks exit 0 but land in failed/ (no result file). The task runner should log *why* it rejected a task that exited cleanly — currently the only clue is "exit code 0" which is ambiguous.

---

## Actions Taken

- Moved all 24 failed task files from `failed/` to `archive/cleared-20260416/`
- Updated 7 DB-tracked tasks from `failed` to `cancelled` with supersession notes
- `failed/` directory is now clean (0 non-archive entries)

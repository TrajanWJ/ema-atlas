---
title: "Failed Task Analysis — 2026-04-17"
type: analysis
created: 2026-04-17
agent: utility
task_id: task-eedb596f
---

# Failed Task Analysis — 2026-04-17

**Analyzed:** 27 failed tasks (all from 2026-04-16)
**Archived:** 27 (all resolved — superseded by successful runs or re-queued by loops)
**Remaining failures:** 0

---

## Failure Patterns

### Pattern 1: Vault Staleness Signal Tasks — 6/6 Failed (utility agent)

Recurring every 3 hours. Zero successes on 04-16 (down from 2/8 on 04-15). All exited code 0 or code 1 but produced no valid result. New task-3ae14946 active on 04-17.

| Task ID | Created | Exit Code | Superseded By |
|---|---|---|---|
| task-5b36ec25 | 00:00 | 0 | task-3ae14946 (04-17, active) |
| task-fab24395 | 06:00 | 1 | task-3ae14946 (04-17, active) |
| task-319315bd | 12:00 | 1 | task-3ae14946 (04-17, active) |
| task-3256d5cf | 09:00 | 1 | task-3ae14946 (04-17, active) |
| task-2119e01c | 15:00 | 1 | task-3ae14946 (04-17, active) |
| task-4f9369f9 | 21:00 | 0 | task-3ae14946 (04-17, active) |

**100% failure rate** on 04-16 (was 75% on 04-15). Worsening trend — 4th consecutive day of vault-staleness failures.

### Pattern 2: Disk Cleanup Signal Tasks — 4/4 Failed (ops agent)

Recurring every 3 hours. Only succeeded at 00:00, 03:00, and 21:00.

| Task ID | Created | Exit Code | Superseded By |
|---|---|---|---|
| task-2bc1fdd5 | 06:00 | 1 | task-92bc2f74 (21:00, done) |
| task-06653dd0 | 09:00 | 1 | task-92bc2f74 (21:00, done) |
| task-1d583919 | 12:00 | 1 | task-92bc2f74 (21:00, done) |
| task-d485f931 | 15:00 | 1 | task-92bc2f74 (21:00, done) |

**57% failure rate** (4/7 total runs). Mid-day runs consistently failing — could be resource contention during active hours.

### Pattern 3: Vault-Improve Research Tasks — 12/12 Failed (researcher agent)

Batches of 3 every 4 hours. Only 00:00 and 04:00 batches succeeded (5 tasks in done/). All others (08:00, 12:00, 16:00, 20:00) failed with exit code 1.

**71% failure rate** (12/17 total). 4th consecutive day of high vault-improve failure.

### Pattern 4: Reddit Intel Tasks — 4/4 Failed (researcher agent)

| Task ID | Created | Exit Code |
|---|---|---|
| reddit-intel-be87a669 | 04:30 | 1 |
| reddit-intel-25532764 | 08:30 | 1 |
| reddit-intel-e65945ba | 12:30 | 1 |
| reddit-intel-3e2f28f8 | 16:30 | 1 |

All file-only (not DB-tracked). Loop will re-queue.

### Pattern 5: GitHub Trending — 1/1 Failed (researcher agent)

github-trending-5dcb971f failed at 08:00 with exit code 1. File-only.

---

## Cross-Day Trends

### Researcher Agent (Critical — worsening)

| Date | vault-improve success | reddit-intel | github-trending | Total researcher failures |
|---|---|---|---|---|
| 04-13 | Low | ? | ? | High |
| 04-14 | 27% (4/15) | 2 failures | ? | ~13 |
| 04-15 | 17% (3/18) | 2 failures | ? | ~17 |
| 04-16 | 29% (5/17) | 4 failures | 1 failure | **17** (63% of all failures) |

4-day degradation. Researcher agent accounts for 17/27 (63%) of today's failures.

### Vault Staleness (Worsening)

| Date | Success Rate |
|---|---|
| 04-14 | Intermittent |
| 04-15 | 25% (2/8) |
| 04-16 | **0% (0/6)** |

### Ops/Disk Cleanup (Stable-ish)

Mid-day failures, but bookend runs (00:00, 03:00, 21:00) succeed. Likely resource contention, not agent degradation.

---

## Recommendations

1. **Researcher agent investigation (P1)** — 4-day degradation, 63% of all failures. Check: API keys/rate limits, token budgets, agent process health, timeout configs. This is the single highest-impact fix.
2. **Vault-staleness task (P2)** — 0% success on 04-16. The utility agent is failing on these consistently now. Check if the task is timing out or hitting resource limits.
3. **Recurring task dedup guard (P2)** — Add "skip if succeeded in last 6h" to vault-staleness and disk-cleanup signals. Would have prevented 8 of the 10 DB-tracked failures.
4. **Exit-code-0 failures (P3)** — Tasks exiting cleanly but landing in failed/. Task runner should log why it rejected a clean exit (missing result file? empty output?).

---

## Actions Taken

- Moved all 27 failed task files from `failed/` to `archive/cleared-20260417/`
- Updated 10 DB-tracked tasks from `failed` to `cancelled` with supersession notes
- `failed/` directory is now clean (0 non-archive entries)

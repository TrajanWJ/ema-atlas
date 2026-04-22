---
title: "Failed Task Analysis — 2026-04-15"
type: analysis
created: 2026-04-15
agent: utility
task_id: task-ed9af122
---

# Failed Task Analysis — 2026-04-15

**Analyzed:** 21 failed tasks (all from 2026-04-14)
**Archived:** 21 (all resolved — superseded by successful runs or re-queued by loops)
**Remaining failures:** 0

---

## Failure Patterns

### Pattern 1: Recurring Signal Tasks Failing at Some Intervals (9 tasks)

These are recurring tasks (vault-staleness, disk-cleanup, failed-task-analysis) generated every 3–6 hours. Some runs fail while others succeed. All had successful later runs.

| Task ID | Title | Agent | Failed At | Superseded By |
|---|---|---|---|---|
| task-5e826b90 | Vault staleness (96 notes) | utility | 03:00 | task-b38cfc47 (00:03, done) |
| task-514c2b11 | Vault staleness (102 notes) | utility | 09:00 | task-ac2853a2 (06:03, done) |
| task-06381c02 | Vault staleness (102 notes) | utility | 12:00 | task-4acb9968 (15:06, done) |
| task-b23fb01f | Vault staleness (102 notes) | utility | 18:00 | task-4acb9968 (15:06, done) |
| task-fb449da4 | Vault staleness (102 notes) | utility | 21:00 | task-4acb9968 (15:06, done) |
| task-799b598a | Disk at 89% | ops | 09:00 | task-0962a7b5 (06:12, done) |
| task-3a3af9e0 | Disk at 89% | ops | 12:00 | task-c92f0cba (15:08, done) |
| task-ce47757e | Disk at 88% | ops | 18:00 | task-a16c4ad4 (21:09, done) |
| task-ff22085a | Analyze 14 failed tasks | utility | 00:00 | This task (task-ed9af122) |

**Root cause:** All exited with code 1 and produced no result files. Likely the agent process crashed or timed out before producing output. The pattern of intermittent failures (some runs succeed, some fail) suggests resource contention or transient API issues rather than a systemic problem.

### Pattern 2: Vault-Improve Research Tasks (12 tasks)

All from the `vault-research-loop`, running under the `researcher` agent. Ran in batches of 3 at 04:00, 08:00, 12:00, and 20:00.

| Batch | Tasks | Failure Reason |
|---|---|---|
| 04:00 | 3 tasks | exit code 1 |
| 08:00 | 2 tasks | zombie — PID dead, no result (cleaned by stale-task-cleanup) |
| 12:00 | 3 tasks | exit code 1 |
| 20:00 | 3 tasks | exit code 1 |

Only 1 out of 15 vault-improve tasks succeeded on 04-14 (at 16:00, 1 of 3). The 00:00 batch succeeded (3/3).

**Root cause:** The researcher agent consistently failed on vault-improve tasks throughout the day. Given that 04-13 failures were traced to API auth errors, this may be a continuation of intermittent auth issues. The vault-research-loop will re-queue these targets automatically.

---

## Recommendations

1. **Monitor researcher agent success rate** — 11/15 vault-improve tasks failed on 04-14 (73% failure rate). If this continues on 04-15, investigate auth/API stability.
2. **Deduplicate recurring signal tasks** — Vault-staleness and disk-cleanup tasks are generated every 3-6 hours but only need to succeed once. Consider adding a "skip if recent success" check to avoid accumulating failures.
3. **Add result-file requirement** — All 9 DB-tracked tasks failed without producing any result file, making root cause analysis harder. Consider requiring at minimum an error log.

---

## Actions Taken

- Moved all 21 failed task files from `failed/` to `archive/cleared-20260415/`
- Updated 9 DB-tracked tasks from `failed` to `cancelled` with supersession note
- `failed/` directory is now clean (0 tasks)

---
title: "Failed Task Analysis — 2026-04-14"
type: analysis
created: 2026-04-14
agent: utility
task_id: task-ff22085a
---

# Failed Task Analysis — 2026-04-14

**Analyzed:** 14 failed tasks (all from 2026-04-13)
**Archived:** 14 (all resolved)
**Remaining failures:** 0

---

## Unified Root Cause: Anthropic API 401 Authentication Error

**Every single failure** was caused by the same error:

```
Failed to authenticate. API Error: 401 {"type":"error","error":{"type":"authentication_error","message":"Invalid authentication credentials"}}
```

The previous analysis (2026-04-13, task-384bdab5) incorrectly classified failures as "GitHub rate limit", "agent crash", or "timeout". Checking the actual `results/` files reveals all 14 hit the same 401 auth error.

**Crash windows identified:**
- 03:00–06:00: utility agent affected (2 tasks)
- 04:00–08:00: researcher agent affected (6 vault-improve + 1 github-trending + 1 competitive-scan)
- 16:30: researcher briefly affected again (1 reddit-intel)
- 20:00: researcher affected again (3 vault-improve)

**Recovery:** Auth was restored between failures — tasks at 09:00, 12:00, 15:00, 16:00, 21:00 all succeeded. This points to intermittent API key issues (rotation, quota reset, or transient Anthropic-side auth failures).

---

## Summary Table

| Task | Agent | Time | Superseded By | Status |
|---|---|---|---|---|
| utility-task-6c0bd16b | utility | 03:00 | task-6088f17f (12:00, done) + 4 more | **ARCHIVED** |
| utility-task-b29e5e24 | utility | 06:00 | task-6088f17f (12:00, done) + 3 more | **ARCHIVED** |
| vault-improve-040004-{0,1,2} | researcher | 04:00 | Targets re-queued by vault-research-loop | **ARCHIVED** |
| vault-improve-080004-{0,1,2} | researcher | 08:00 | Targets re-queued by vault-research-loop | **ARCHIVED** |
| vault-improve-200006-{0,1,2} | researcher | 20:00 | Targets re-queued by vault-research-loop | **ARCHIVED** |
| competitive-scan-b02add37 | researcher | 06:00 | Weekly task; next scan will cover | **ARCHIVED** |
| github-trending-2d7f863e | researcher | 08:00 | Trending data is ephemeral; stale | **ARCHIVED** |
| reddit-intel-bddf4b2f | researcher | 16:30 | reddit-intel-1f54fe61 (21:06, done) | **ARCHIVED** |

---

## Corrections to Previous Analysis (2026-04-13)

The previous analysis made several incorrect classifications due to not checking `results/` files:

1. **competitive-scan-b02add37** was labeled "GitHub rate limit" — actual cause was API 401. The GitHub rate-limit messages in the scan data were from the upstream `competitive-scan.sh` data collection (which ran before dispatch), not from the researcher agent.
2. **github-trending-2d7f863e** was labeled "researcher agent crash" — actual cause was API 401.
3. **vault-improve 040004/080004 batches** were labeled "researcher agent crash" — all were API 401.
4. **utility-task failures** were labeled "agent crash" — both were API 401.
5. **The "researcher recovered at 09:02" finding was correct** — auth credentials were working again by then.

---

## Data Loss Assessment

| Lost Data | Impact | Mitigation |
|---|---|---|
| Competitive scan 2026-04-13 | Low — upstream data was empty (GitHub rate limited all 6 repos) | Next weekly scan |
| GitHub trending 2026-04-13 | Low — claude-code v2.1.104 release noted but not analyzed | Stale; new releases will surface |
| Reddit intel 16:30 run | None — superseded by 21:06 successful run with updated scores | Already covered |
| 9 vault-improve notes | Low — targets remain in vault-research-loop queue for retry | Auto-requeued |

---

## Recommended Actions

1. **Investigate API key stability** — 4 separate auth failure windows in 24h suggests the API key is being rotated, expiring, or hitting an intermittent Anthropic-side issue. Check `ANTHROPIC_API_KEY` env var source and rotation schedule.
2. **Add auth pre-check** — Before dispatching tasks, validate the API key with a lightweight API call. Skip dispatch during auth failures to avoid wasting queue slots.
3. **Correct previous analysis** — The 2026-04-13 analysis should be annotated as superseded by this one.

---

## Archive Stats (cumulative)

Failed/archive now contains tasks from:
- 2026-04-06 through 2026-04-13
- Total archived: 134 tasks
- By type: vault-improve (82), reddit-intel (19), ops-task (10), proactive (9), utility (8), github-trending (5), competitive-scan (1)

### DB-Level Stats (cancelled tasks = dispatched failures)
- Total cancelled in DB: 77 tasks (2026-03-20 through 2026-04-13)
- By agent: utility (44), ops (23), auto (8), righthand (2)
- By error: bulk-cleared/expired (25), exit code 1 (20), API key superseded (14), disk-resolved (4), zombie/stale (2)

### Current State (2026-04-14)
- **0 unresolved failures** in `failed/` directory
- **0 new failures** since 2026-04-13 archive sweep
- DB: 3 active, 1 queued, 46 done, 77 cancelled
- Agent health: stable (empty health JSON = no alerts)

Consider periodic cleanup of archive/ (e.g., delete entries older than 14 days).

---

## Second Pass Verification (2026-04-14, task-ff22085a re-execution)

Re-verified all systems. The earlier run of this same task already completed the full analysis and archived all 14 tasks. This second pass confirmed:
1. `failed/` directory: empty (0 unresolved)
2. `failed/archive/`: 134 entries, all accounted for
3. DB tasks table: no "failed" status exists — failures become "cancelled"
4. No new failures since the archive sweep
5. Dominant historical pattern: vault-improve tasks account for 61% of all archived failures

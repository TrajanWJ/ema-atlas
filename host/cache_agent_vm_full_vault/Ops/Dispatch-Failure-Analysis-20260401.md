---
title: "Dispatch Failure Analysis — 2026-04-01"
type: ops
created: 2026-04-01
tags: [dispatch, failures, ops, incident]
summary: "Analysis of 14 failed dispatch tasks — all caused by transient API key invalidation. Archived and jq bug fixed."
---

# Dispatch Failure Analysis — 2026-04-01

## Summary

14 tasks accumulated in `/home/trajan/dispatch/failed/` between 2026-03-30 and 2026-04-01. All failures share a single root cause.

## Root Cause

**Transient API key invalidation** — all 14 result files contained only:
```
Invalid API key · Fix external API key
```

The dispatch engine's result-validator detected this as "result file contains error output, not real work" and marked tasks failed. The API key issue resolved itself (tasks are completing successfully again as of 2026-04-01T20:34Z).

## Failed Tasks by Type

| Type | Count | Agent | Pattern |
|------|-------|-------|---------|
| reddit-intel | 8 | researcher | 4h intervals, 2026-03-30 to 2026-04-01 |
| github-trending | 2 | researcher | 2026-03-30 and 2026-03-31 |
| competitive-scan | 1 | researcher | 2026-03-30 |
| proactive vault-keeper | 1 | vault-keeper | 2026-04-01 |
| utility (self-analysis tasks) | 2 | utility | Previous attempts at THIS task |

## Actions Taken

1. **Archived**: All 14 tasks moved to `dispatch/archive/cleared-20260401/`
2. **Result files**: Moved 14 error-only txt files to `~/.trash/`
3. **Bug fix** `self-improvement-hook.sh`: Changed `. + [$entry]` to `.tasks += [$entry]` (line 225) — matches outcome-tracker.json schema v2
4. **Bug fix** `self-improvement-topic.sh`: Updated jq queries (lines 15, 34) to use `.tasks //` for schema compatibility

## Secondary Finding: Recurring jq Error in dispatch-completion.log

Every task completion since ~2026-03-29 logged:
```
jq: error: object ({"version":...) and array ([{"agent":"...) cannot be added
```

**Cause**: `self-improvement-hook.sh` treated outcome-tracker.json as a bare array but it was upgraded to schema v2 `{"version": "1.0", "tasks": [...]}`. Fixed.

## Recurring Pattern Note

reddit-intel tasks fail in clusters during API outages — 8 tasks failed across a ~4-day window because they run every 4h with no retry. Consider adding `max_retries: 1` with a delay for scheduled intel tasks to reduce future accumulation.

## Related

- [[Dispatch Engine]]
- [[Agent Health]]

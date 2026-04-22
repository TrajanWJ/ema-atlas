---
title: "Dispatch Failure Analysis — 2026-04-05"
type: reference
created: 2026-04-05
tags: [dispatch, ops, failures, api-key]
summary: "10 failed dispatch tasks cleared. Root cause: API key expiry 2026-04-04 to 2026-04-05."
---

# Dispatch Failure Analysis — 2026-04-05

## Context
Task task-76abe008 analyzed 10 failed tasks in [[dispatch.db]] that had accumulated since 2026-04-04.

The EMA dispatch engine reported "41 failed tasks" (the title was inherited from a previous failed iteration of this same recurring task; actual failed count at time of analysis was 10 failed + 44 previously-cancelled).

## Root Cause
**Single root cause: API key expiry.**

All 10 failed task result files contained:
```
Invalid API key · Fix external API key
```

The dispatch engine's Claude API key was invalid for approximately 20 hours (2026-04-04T09:00 → 2026-04-05T04:XX). During this window, every scheduled task that attempted to run an agent failed immediately.

## Failed Tasks

| ID | Title | Created | Category |
|---|---|---|---|
| task-cd55d0d2 | Disk at 87% clean | 2026-04-04T09 | ops/disk |
| task-d73d2ef6 | Disk at 87% clean | 2026-04-04T12 | ops/disk |
| task-708c92e9 | Analyze 12 failures | 2026-04-04T12 | utility/self |
| task-3770e315 | Disk at 87% clean | 2026-04-04T15 | ops/disk |
| task-d8b16908 | Analyze 19 failures | 2026-04-04T15 | utility/self |
| task-51bbba82 | Disk at 88% clean | 2026-04-04T18 | ops/disk |
| task-a7d0bb92 | Analyze 25 failures | 2026-04-04T18 | utility/self |
| task-2559316d | Analyze 23 failures | 2026-04-04T21 | utility/self |
| task-1f25de6c | Analyze 25 failures | 2026-04-05T00 | utility/self |
| task-09b085e1 | Analyze 30 failures | 2026-04-05T03 | utility/self |

## Actions Taken
- 6 analyze-failure tasks → `cancelled` (superseded by task-76abe008)
- 4 disk-clean tasks → `cancelled` (disk resolved to 80%)

## Structural Issues Found

### 1. Recursive analyze-failure cron task
The "Dispatch has X failed tasks. Analyze failure patterns" task re-queues itself when it fails. This inflates the reported count and creates cascading noise. The count grew: 12 → 19 → 25 → 23 → 25 → 30 → 41 (current).

**Fix**: Add dedup logic — if an identical analyze-failures task already exists (queued or failed), don't create a new one. Or: cap at 1 retry without success before requiring manual intervention.

### 2. No API key health check
The dispatch engine has no pre-flight API key validation. A bad key causes every scheduled task to fail with a cryptic "result file contains errors" until someone investigates.

**Fix**: Add a lightweight API key ping at engine startup or as a cron health check. Surface "API_KEY_INVALID" as a distinct engine state, not a per-task failure.

## Disk Status
- Current: 80% (69G/87G on /dev/vda1)
- Alert threshold appears to be 87%
- Headroom: ~7% before alerts trigger again (~6.1 GB)

## Links
- [[dispatch.db]] — task database at /home/trajan/dispatch/dispatch.db
- [[Agent OS Foundation Repair]] — architecture spec for dispatch system

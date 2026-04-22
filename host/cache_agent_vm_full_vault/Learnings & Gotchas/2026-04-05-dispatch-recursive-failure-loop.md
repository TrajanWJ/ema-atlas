---
title: "Dispatch Recursive Failure Loop"
type: reference
created: 2026-04-05
tags: [dispatch, gotcha, cron, openclaw]
summary: "analyze-failure cron re-queues itself on failure, inflating failed task count from 12 to 41"
---

# Dispatch Recursive Failure Loop

## The Problem

The `analyze-failure` cron task dispatches itself when it detects failed tasks. When **it** fails (e.g., due to expired API key), it creates a new failed task — which the next cycle picks up, creating a cascade:

```
12 failed → 19 → 25 → 23 → 25 → 30 → 41
```

The count inflates rapidly, obscuring the original root cause (which was just an expired API key affecting 10 real tasks).

## Root Cause

No deduplication or retry cap on the analyze-failure dispatch. Each cycle treats its own failure as a new task to analyze.

## Fix

1. Add dedup logic: if an `analyze-failure` task already exists in PENDING/FAILED state, don't create another
2. Cap retries: after N consecutive failures, require manual intervention instead of re-queuing
3. Consider making `analyze-failure` a local script (not dispatched) so it can't pollute the task queue

## Observed

2026-04-05 — API key expiry caused 10 genuine failures; recursive loop inflated to 41.

## Related

- [[Dispatch Exit Code 0 Can Mean FAILED]]
- [[Dispatch API Key Health Check]]

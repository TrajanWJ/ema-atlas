---
title: "Dispatch API Key Health Check"
type: reference
created: 2026-04-05
tags: [dispatch, gotcha, api, openclaw, operations]
summary: "Missing pre-flight API key validation causes silent cascade failures across all scheduled tasks"
---

# Dispatch API Key Health Check

## The Problem

The dispatch engine has no pre-flight API key validation. When the API key expires, every scheduled task fails with a cryptic "result file contains errors" message. The real cause (expired key) is buried.

## Timeline (2026-04-05)

- API key expired ~2026-04-04 09:00
- All tasks dispatched between 04-04 09:00 and 04-05 ~04:XX failed
- 10 genuine task failures + recursive analyze-failure inflation to 41
- Root cause only identified during manual failure analysis

## Fix

Add a lightweight API key health check:

1. **At engine startup**: Ping the API with a minimal request before accepting tasks
2. **As cron health check**: Periodic key validity check (e.g., every 30 min)
3. **Surface as distinct engine state**: `ENGINE_STATE=API_KEY_INVALID` rather than letting individual tasks fail

## Degraded Mode Exit Criteria

Before resuming automation after key expiry:
1. Auth confirmed valid (ping succeeds)
2. One real end-to-end dispatch succeeds
3. Only then re-enable scheduled tasks

## Related

- [[Dispatch Recursive Failure Loop]]
- [[Dispatch Exit Code 0 Can Mean FAILED]]
- [[Degraded Mode Operations Protocol]]

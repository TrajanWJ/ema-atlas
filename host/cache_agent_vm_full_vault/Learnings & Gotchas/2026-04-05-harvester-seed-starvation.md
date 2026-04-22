---
title: "Harvester Seed Starvation Pattern"
type: reference
created: 2026-04-05
tags: [ema, harvester, gotcha, scheduler, seeds]
summary: "Harvesters creating seeds without schedules causes scheduler to ignore them — engine starvation"
---

# Harvester Seed Starvation Pattern

## The Problem

Harvesters create seeds in EMA but don't attach schedules to them. The scheduler only processes seeds that have schedules, so unscheduled seeds are silently ignored. This causes **engine starvation** — the proposal engine has no work to process despite seeds existing.

## Timeline

- First appeared: 2026-04-04
- Manual kick worked temporarily
- Durable fix landed: 2026-04-05, commit `19b027e`

## The Fix (commit 19b027e)

Two issues fixed together:
1. **Harvester seed schedules**: Harvesters now attach proper schedules when creating seeds
2. **SeedController nil clobber**: The update endpoint was clobbering fields with nil on partial updates

## Related Gotcha: SeedController Partial Updates

Until the nil clobber fix is confirmed stable, **always send full payload** when updating seeds. Partial updates can lose data (fields not included in the request get set to nil).

## Detection

If the proposal engine appears idle but seeds exist:
```bash
# Check for unscheduled seeds
curl localhost:4000/api/seeds?scheduled=false
```

## Related

- [[EMA Engine Architecture]]
- [[Dispatch API Key Health Check]]

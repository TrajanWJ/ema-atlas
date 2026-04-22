# Config Change: Anthropic silently reverted prompt cache TTL from 1h→5m around March 6-8 2026, confirmed via 120K API call regression analysis — causes 17% cost increase and faster quota exhaustion, likely explains widespread 'model degradation' complaints as users hit quota and get downgraded

- **Source:** 3be0242e.txt
- **Suggested:** 2026-04-12T09:06:51Z
- **Impact:** 4/5

## Change Details

Add cache TTL awareness to dispatch cost model — update any token budget calculations that assumed 1h cache lifetime to use 5m; consider restructuring prompt compilation to maximize cache hits within 5m window; document in vault as known platform behavior change

## Status

Auto-flagged for application. Verify before applying to production configs.

---
Tags: #intelligence #config-change #auto-applied

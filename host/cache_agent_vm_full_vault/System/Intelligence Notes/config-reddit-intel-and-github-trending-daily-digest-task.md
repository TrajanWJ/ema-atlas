# Config Change: reddit-intel and github-trending daily digest tasks also crash immediately — these scheduled tasks are wasting dispatch cycles on a broken executor

- **Source:** task-f808613f.txt
- **Suggested:** 2026-04-13T00:04:08Z
- **Impact:** 2/5

## Change Details

Pause reddit-intel and github-trending cron schedules alongside vault-improve until executor is fixed. All share the same root cause (exit 1 within 60s).

## Status

Auto-flagged for application. Verify before applying to production configs.

---
Tags: #intelligence #config-change #auto-applied

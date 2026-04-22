# Config Change: vault-improve cron runs every 4h spawning researcher agent tasks that immediately crash — 68 failures accumulated from a recurring schedule with no health gate

- **Source:** task-f808613f.txt
- **Suggested:** 2026-04-13T00:04:07Z
- **Impact:** 3/5

## Change Details

Disable or pause the vault-improve cron entry (likely in crontab or dispatch scheduler config) until the executor crash root cause is fixed. Check `crontab -l` for the 4h vault-improve schedule.

## Status

Auto-flagged for application. Verify before applying to production configs.

---
Tags: #intelligence #config-change #auto-applied

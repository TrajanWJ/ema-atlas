---
type: config
wiki_id: >-
  system/Intelligence_Notes/config-cron-activation-pattern-for-agent-os-background-jo
imported_from: >-
  vault/System/Intelligence
  Notes/config-cron-activation-pattern-for-agent-os-background-jo.md
imported_at: '2026-04-04T00:23:57.243Z'
tags: []
summary: ''
---
# Config Change: Cron activation pattern for agent OS background jobs: weekly-vault-hygiene (Mon 4am), weekly-synthesis (Sun 3am), daily-vault-frontmatter (4am), proposal-engine-v2.sh (every 30min)

- **Source:** task-07cf58b8.txt
- **Suggested:** 2026-03-20T18:38:00Z
- **Impact:** 3/5

## Change Details

Add 4 crontab entries: Mon 4am weekly-vault-hygiene, Sun 3am weekly-synthesis, daily 4am vault-frontmatter, every 30min proposal-engine-v2.sh

## Status

Auto-flagged for application. Verify before applying to production configs.

---
Tags: #intelligence #config-change #auto-applied

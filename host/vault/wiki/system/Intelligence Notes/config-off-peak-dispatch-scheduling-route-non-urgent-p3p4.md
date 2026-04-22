---
type: config
wiki_id: >-
  system/Intelligence_Notes/config-off-peak-dispatch-scheduling-route-non-urgent-p3p4
imported_from: >-
  vault/System/Intelligence
  Notes/config-off-peak-dispatch-scheduling-route-non-urgent-p3p4.md
imported_at: '2026-04-04T00:23:57.243Z'
tags: []
summary: ''
---
# Config Change: Off-peak dispatch scheduling: route non-urgent P3/P4 tasks to run during Anthropic's documented off-peak windows (typically midnight–6am) to consume double-rate quota without touching peak allocation

- **Source:** best-practices-enrichment-001.txt
- **Suggested:** 2026-03-27T06:35:56Z
- **Impact:** 3/5

## Change Details

Add a scheduled_window field to dispatch task JSON; in dispatch-engine.sh, hold P3/P4 tasks in a deferred queue and release them between 00:00–06:00 local time via cron or a sleep-until loop

## Status

Auto-flagged for application. Verify before applying to production configs.

---
Tags: #intelligence #config-change #auto-applied

---
type: config
wiki_id: >-
  system/Intelligence_Notes/config-claude-code-v2184-model-capability-override-env-va
imported_from: >-
  vault/System/Intelligence
  Notes/config-claude-code-v2184-model-capability-override-env-va.md
imported_at: '2026-04-04T00:23:57.242Z'
tags: []
summary: ''
---
# Config Change: claude-code v2.1.84: model capability override env vars — env flags to override what capabilities Claude reports, enabling capability-gated routing without model switching

- **Source:** 81b52f1e.txt
- **Suggested:** 2026-03-26T08:08:48Z
- **Impact:** 2/5

## Change Details

Document available env var names (from v2.1.84 changelog) in OpenClaw agent env config. Useful for routing tasks to capability-limited agents without spawning a different model.

## Status

Auto-flagged for application. Verify before applying to production configs.

---
Tags: #intelligence #config-change #auto-applied

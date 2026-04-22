---
type: config
wiki_id: >-
  system/Intelligence_Notes/config-add-modelhint--complexity-fields-to-dispatch-task-
imported_from: >-
  vault/System/Intelligence
  Notes/config-add-modelhint--complexity-fields-to-dispatch-task-.md
imported_at: '2026-04-04T00:23:57.242Z'
tags: []
summary: ''
---
# Config Change: Add model_hint + complexity fields to dispatch task JSON for token-aware routing — 9.7× thinking token variance makes current cost estimates unreliable without per-task routing metadata

- **Source:** best-practices-enrichment-001.txt
- **Suggested:** 2026-03-27T06:28:39Z
- **Impact:** 4/5

## Change Details

Edit dispatch task JSON schema (dispatch.sh and any task-creation scripts) to add optional model_hint (e.g. 'sonnet'|'opus'|'haiku') and complexity ('low'|'medium'|'high') fields; dispatch engine reads these to select model at task pickup time

## Status

Auto-flagged for application. Verify before applying to production configs.

---
Tags: #intelligence #config-change #auto-applied

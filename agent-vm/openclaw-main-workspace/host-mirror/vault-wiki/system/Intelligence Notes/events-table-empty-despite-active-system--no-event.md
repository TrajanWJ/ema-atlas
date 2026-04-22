---
type: knowledge
wiki_id: system/Intelligence_Notes/events-table-empty-despite-active-system--no-event
imported_from: >-
  vault/System/Intelligence
  Notes/events-table-empty-despite-active-system--no-event.md
imported_at: '2026-04-04T00:23:57.246Z'
tags: []
summary: ''
---
# Events table empty despite active system — no events being generated means the feed pipeline has a silent gap between task execution and event emission

- **Category:** best-practice
- **Source:** task-a56abb87.txt
- **Applied:** 2026-03-20T23:12:30Z
- **Impact:** 4/5
- **Project:** Auto Delegator Layer

## Details

Check emit_feed_event() hook wiring in dispatch-engine.sh — confirm task_started/task_completed hooks write to claudeforge.db events table (not just feed.jsonl); add a canary event on dispatch engine startup to verify the pipeline end-to-end

## Source Context

Extracted from agent result: `task-a56abb87.txt`

---
Tags: #intelligence #best-practice #auto-applied

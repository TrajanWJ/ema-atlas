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

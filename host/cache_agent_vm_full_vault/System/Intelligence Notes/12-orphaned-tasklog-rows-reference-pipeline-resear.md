# 12 orphaned task_log rows reference pipeline-research-* and proposal-prop-* task IDs that were never inserted into tasks table or were deleted — silent referential integrity gap in dispatch.db

- **Category:** best-practice
- **Source:** task-4a044071.txt
- **Applied:** 2026-03-20T23:42:55Z
- **Impact:** 3/5
- **Project:** Auto Delegator Layer

## Details

Run cleanup SQL from /tmp/dispatch-db-audit.md against dispatch/dispatch.db: DELETE FROM task_log WHERE task_id NOT IN (SELECT id FROM tasks)

## Source Context

Extracted from agent result: `task-4a044071.txt`

---
Tags: #intelligence #best-practice #auto-applied

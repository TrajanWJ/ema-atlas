# Config Change: Missing indexes on tasks(pipeline_id), inbox(task_id), inbox(from_agent), feed(type) — unindexed foreign keys and filter columns that will degrade as table sizes grow

- **Source:** task-4a044071.txt
- **Suggested:** 2026-03-20T23:42:56Z
- **Impact:** 3/5

## Change Details

Execute 4 CREATE INDEX statements from /tmp/dispatch-db-audit.md against dispatch/dispatch.db — no schema migration required, safe on live DB

## Status

Auto-flagged for application. Verify before applying to production configs.

---
Tags: #intelligence #config-change #auto-applied

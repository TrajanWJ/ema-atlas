---
type: knowledge
wiki_id: system/Intelligence_Notes/ensurecolumns-pattern-sqlite-migration-helper-that
imported_from: >-
  vault/System/Intelligence
  Notes/ensurecolumns-pattern-sqlite-migration-helper-that.md
imported_at: '2026-04-04T00:23:57.246Z'
tags: []
summary: ''
---
# _ensure_columns() pattern: SQLite migration helper that checks for missing columns before use, enabling safe schema evolution without destructive migrations on tables created by old bash scripts

- **Category:** technique
- **Source:** peer-pr-20260324-210438-556357.txt
- **Applied:** 2026-03-24T21:28:47Z
- **Impact:** 3/5
- **Project:** ClaudeForge

## Details

Add an _ensure_columns() guard to any Python code that opens dispatch.db or ClaudeForge.db — prevents crashes when new columns are added by bash scripts before Python migration runs

## Source Context

Extracted from agent result: `peer-pr-20260324-210438-556357.txt`

---
Tags: #intelligence #technique #auto-applied

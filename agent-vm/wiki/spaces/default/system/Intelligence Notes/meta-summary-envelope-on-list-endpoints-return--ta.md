---
type: knowledge
wiki_id: system/Intelligence_Notes/meta-summary-envelope-on-list-endpoints-return--ta
imported_from: >-
  vault/System/Intelligence
  Notes/meta-summary-envelope-on-list-endpoints-return--ta.md
imported_at: '2026-04-04T00:23:57.248Z'
tags: []
summary: ''
---
# Meta summary envelope on list endpoints: return { tasks/proposals: [...], meta: { total, active, queued, blocked } } for richer client-side state without extra requests

- **Category:** best-practice
- **Source:** task-f4103744.txt
- **Applied:** 2026-03-20T18:37:50Z
- **Impact:** 2/5
- **Project:** ClaudeForge

## Details

Apply meta envelope pattern to any remaining bridge API endpoints that return bare arrays — add total counts and status breakdowns to response root

## Source Context

Extracted from agent result: `task-f4103744.txt`

---
Tags: #intelligence #best-practice #auto-applied

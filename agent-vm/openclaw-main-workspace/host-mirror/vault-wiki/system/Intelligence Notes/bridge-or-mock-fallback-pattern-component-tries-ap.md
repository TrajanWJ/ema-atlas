---
type: knowledge
wiki_id: system/Intelligence_Notes/bridge-or-mock-fallback-pattern-component-tries-ap
imported_from: >-
  vault/System/Intelligence
  Notes/bridge-or-mock-fallback-pattern-component-tries-ap.md
imported_at: '2026-04-04T00:23:57.241Z'
tags: []
summary: ''
---
# Bridge-or-mock fallback pattern: component tries `/api/feed/:id` first, falls back to rich local mock data when bridge isn't live — enables development without live backend

- **Category:** design-pattern
- **Source:** task-1467181f.txt
- **Applied:** 2026-03-20T18:30:51Z
- **Impact:** 4/5
- **Project:** Agent-OS-Frontend

## Details

In fetch calls: `try { data = await fetch('/api/...').then(r => r.json()) } catch { data = MOCK_DATA }` — keeps demo pages functional without a running backend

## Source Context

Extracted from agent result: `task-1467181f.txt`

---
Tags: #intelligence #design-pattern #auto-applied

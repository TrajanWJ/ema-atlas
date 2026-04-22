---
type: knowledge
wiki_id: system/Intelligence_Notes/sse-registry-pattern-maintain-a-set-of-active-sse-
imported_from: >-
  vault/System/Intelligence
  Notes/sse-registry-pattern-maintain-a-set-of-active-sse-.md
imported_at: '2026-04-04T00:23:57.251Z'
tags: []
summary: ''
---
# SSE registry pattern: maintain a Set of active SSE clients, broadcast() automatically routes feed-type events to all connected clients, with heartbeat keepalive every 30s

- **Category:** design-pattern
- **Source:** task-19d2d0c9.txt
- **Applied:** 2026-03-20T18:37:53Z
- **Impact:** 4/5
- **Project:** Agent-OS-Frontend

## Details

Connect Agent-OS-Frontend dashboard to GET /api/feed/stream SSE endpoint instead of polling; use since_offset=N on reconnect for replay without gaps

## Source Context

Extracted from agent result: `task-19d2d0c9.txt`

---
Tags: #intelligence #design-pattern #auto-applied

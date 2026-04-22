---
type: knowledge
wiki_id: system/Intelligence_Notes/differentiated-polling-intervals-fast-data-agent-s
imported_from: >-
  vault/System/Intelligence
  Notes/differentiated-polling-intervals-fast-data-agent-s.md
imported_at: '2026-04-04T00:23:57.245Z'
tags: []
summary: ''
---
# Differentiated polling intervals: fast data (agent status) polls every 5s, slow data (queue, proposals) polls every 10s — reduces bridge load while keeping critical state fresh

- **Category:** best-practice
- **Source:** task-75abbaaf.txt
- **Applied:** 2026-03-20T18:38:09Z
- **Impact:** 3/5
- **Project:** Agent-OS-Frontend

## Details

In workbench.js initWorkbench(), split setInterval calls by data freshness requirement: agents at 5000ms, queue+proposals at 10000ms

## Source Context

Extracted from agent result: `task-75abbaaf.txt`

---
Tags: #intelligence #best-practice #auto-applied

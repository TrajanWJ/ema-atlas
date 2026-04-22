---
type: knowledge
wiki_id: system/Intelligence_Notes/context-enrichment-layer-buildtaskindexbuildpipeli
imported_from: >-
  vault/System/Intelligence
  Notes/context-enrichment-layer-buildtaskindexbuildpipeli.md
imported_at: '2026-04-04T00:23:57.244Z'
tags: []
summary: ''
---
# Context enrichment layer: buildTaskIndex/buildPipelineIndex/buildGoalIndex helpers compose a delegation chain (_chain: {task, pipeline, goal}) attached opt-in to feed events via ?enrich=true

- **Category:** design-pattern
- **Source:** task-19d2d0c9.txt
- **Applied:** 2026-03-20T18:37:53Z
- **Impact:** 4/5
- **Project:** Agent-OS-Frontend

## Details

In Agent-OS-Frontend feed display, pass ?enrich=true and render _chain breadcrumb (goal→pipeline→task) alongside each event row for full delegation context

## Source Context

Extracted from agent result: `task-19d2d0c9.txt`

---
Tags: #intelligence #design-pattern #auto-applied

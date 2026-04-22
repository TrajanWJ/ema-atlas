---
type: knowledge
wiki_id: system/Intelligence_Notes/routing-correction-pattern-dispatch-is-overused-fo
imported_from: >-
  vault/System/Intelligence
  Notes/routing-correction-pattern-dispatch-is-overused-fo.md
imported_at: '2026-04-04T00:23:57.250Z'
tags: []
summary: ''
---
# Routing correction pattern: dispatch is overused for trivial tasks — apply a complexity gate before spawning agents (most recent active pattern in corrections.md)

- **Category:** best-practice
- **Source:** task-e66d5b3f.txt
- **Applied:** 2026-03-20T18:43:30Z
- **Impact:** 4/5
- **Project:** Auto Delegator Layer

## Details

Add a complexity gate check in dispatch.sh or proposal-engine-v2.sh: only dispatch when task has >1 step, requires external tools, or estimated duration >5min. Log skipped dispatches as direct-execute.

## Source Context

Extracted from agent result: `task-e66d5b3f.txt`

---
Tags: #intelligence #best-practice #auto-applied

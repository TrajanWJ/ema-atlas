---
type: knowledge
wiki_id: system/Intelligence_Notes/proposal-lifecycle-state-machine-in-proposal-state
imported_from: >-
  vault/System/Intelligence
  Notes/proposal-lifecycle-state-machine-in-proposal-state.md
imported_at: '2026-04-04T00:23:57.249Z'
tags: []
summary: ''
---
# Proposal lifecycle state machine in proposal-state.json: tracks each proposal through proposed→dispatched→completed with success/fail outcomes for feedback loop

- **Category:** design-pattern
- **Source:** task-11b91882.txt
- **Applied:** 2026-03-20T18:38:10Z
- **Impact:** 3/5
- **Project:** Auto Delegator Layer

## Details

Create dispatch/proposal-state.json with schema {id, status, created_at, dispatched_at, outcome, engine_source}; update on each proposal-engine run by scanning dispatch/done/ for matching task IDs

## Source Context

Extracted from agent result: `task-11b91882.txt`

---
Tags: #intelligence #design-pattern #auto-applied

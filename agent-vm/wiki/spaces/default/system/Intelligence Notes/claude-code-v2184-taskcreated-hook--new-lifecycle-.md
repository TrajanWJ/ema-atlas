---
type: knowledge
wiki_id: system/Intelligence_Notes/claude-code-v2184-taskcreated-hook--new-lifecycle-
imported_from: >-
  vault/System/Intelligence
  Notes/claude-code-v2184-taskcreated-hook--new-lifecycle-.md
imported_at: '2026-04-04T00:23:57.241Z'
tags: []
summary: ''
---
# claude-code v2.1.84: TaskCreated hook — new lifecycle hook fires when a task is created, enabling reactive agent workflows before task execution begins

- **Category:** technique
- **Source:** 81b52f1e.txt
- **Applied:** 2026-03-26T08:08:47Z
- **Impact:** 3/5
- **Project:** Auto Delegator Layer

## Details

Add TaskCreated hook entry to dispatch-engine hook config (alongside existing CwdChanged/FileChanged hooks from v2.1.83). Wire to task-intake validator or pre-flight enrichment script in ~/dispatch/hooks/.

## Source Context

Extracted from agent result: `81b52f1e.txt`

---
Tags: #intelligence #technique #auto-applied

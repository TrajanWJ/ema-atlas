---
type: knowledge
wiki_id: system/Intelligence_Notes/2-orphaned-agenthealth-rows-for-main-and-utility-a
imported_from: >-
  vault/System/Intelligence
  Notes/2-orphaned-agenthealth-rows-for-main-and-utility-a.md
imported_at: '2026-04-04T00:23:57.239Z'
tags: []
summary: ''
---
# 2 orphaned agent_health rows for 'main' and 'utility' agent names with no matching agents table entry — likely renamed/removed agents leaving stale health data

- **Category:** best-practice
- **Source:** task-4a044071.txt
- **Applied:** 2026-03-20T23:42:56Z
- **Impact:** 2/5
- **Project:** Auto Delegator Layer

## Details

Run cleanup SQL: DELETE FROM agent_health WHERE agent_name NOT IN (SELECT name FROM agents)

## Source Context

Extracted from agent result: `task-4a044071.txt`

---
Tags: #intelligence #best-practice #auto-applied

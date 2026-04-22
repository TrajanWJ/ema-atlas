---
type: knowledge
wiki_id: system/Intelligence_Notes/15-minute-response-lag-to-user-messages-causes-dir
imported_from: >-
  vault/System/Intelligence
  Notes/15-minute-response-lag-to-user-messages-causes-dir.md
imported_at: '2026-04-04T00:23:57.239Z'
tags: []
summary: ''
---
# 15-minute response lag to user messages causes direct frustration: heartbeat scan must run first before any other agent work

- **Category:** best-practice
- **Source:** proposal-prop-1774031326-1698a6fd.txt
- **Applied:** 2026-03-20T18:47:43Z
- **Impact:** 4/5
- **Project:** Auto Delegator Layer

## Details

Add inbox/message check as first step in dispatch-engine.sh main loop before task processing; ensure Trajan messages get P0 priority and preempt queued work

## Source Context

Extracted from agent result: `proposal-prop-1774031326-1698a6fd.txt`

---
Tags: #intelligence #best-practice #auto-applied

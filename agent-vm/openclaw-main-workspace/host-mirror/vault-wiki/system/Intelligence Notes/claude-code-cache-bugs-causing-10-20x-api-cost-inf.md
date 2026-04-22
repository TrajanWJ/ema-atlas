---
type: knowledge
wiki_id: system/Intelligence_Notes/claude-code-cache-bugs-causing-10-20x-api-cost-inf
imported_from: >-
  vault/System/Intelligence
  Notes/claude-code-cache-bugs-causing-10-20x-api-cost-inf.md
imported_at: '2026-04-04T00:23:57.241Z'
tags: []
summary: ''
---
# Claude Code cache bugs causing 10-20x API cost inflation: broken cache writes (v2.1.59, #28899) and stale KV cache after compaction (v2.1.62, #29230) — both have documented workarounds

- **Category:** best-practice
- **Source:** 51f63b17.txt
- **Applied:** 2026-03-30T12:39:05Z
- **Impact:** 4/5
- **Project:** Auto Delegator Layer

## Details

Read GitHub issues #28899 and #29230 for workarounds; apply to dispatch-engine.sh and any long-running claude CLI invocations in Auto Delegator Layer. Pin or document affected version ranges in SOUL.md.

## Source Context

Extracted from agent result: `51f63b17.txt`

---
Tags: #intelligence #best-practice #auto-applied

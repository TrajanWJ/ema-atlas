---
type: config
wiki_id: >-
  system/Intelligence_Notes/config-claude-code-v2184-worktreecreate-http-hook--fires-
imported_from: >-
  vault/System/Intelligence
  Notes/config-claude-code-v2184-worktreecreate-http-hook--fires-.md
imported_at: '2026-04-04T00:23:57.243Z'
tags: []
summary: ''
---
# Config Change: claude-code v2.1.84: WorktreeCreate HTTP hook — fires when a worktree is created, enabling agent OS to track isolated branch workspaces automatically

- **Source:** 81b52f1e.txt
- **Suggested:** 2026-03-26T08:08:48Z
- **Impact:** 2/5

## Change Details

Register WorktreeCreate HTTP hook in claude settings pointing to bridge API /api/hooks/worktree endpoint. Log worktree creation events to feed.jsonl for visibility in Agent-OS-Frontend.

## Status

Auto-flagged for application. Verify before applying to production configs.

---
Tags: #intelligence #config-change #auto-applied

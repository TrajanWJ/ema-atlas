---
type: config
wiki_id: >-
  system/Intelligence_Notes/config-claude-code-v2183-claudecodesubprocessenvscrub1-sc
imported_from: >-
  vault/System/Intelligence
  Notes/config-claude-code-v2183-claudecodesubprocessenvscrub1-sc.md
imported_at: '2026-04-04T00:23:57.242Z'
tags: []
summary: ''
---
# Config Change: claude-code v2.1.83: CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1 scrubs credentials from subprocess envs — security hardening for agent spawning

- **Source:** 2d043f24.txt
- **Suggested:** 2026-03-25T18:48:27Z
- **Impact:** 3/5

## Change Details

Add CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1 to dispatch-engine.sh environment setup and any agent launch scripts to prevent credential leakage to spawned subprocesses

## Status

Auto-flagged for application. Verify before applying to production configs.

---
Tags: #intelligence #config-change #auto-applied

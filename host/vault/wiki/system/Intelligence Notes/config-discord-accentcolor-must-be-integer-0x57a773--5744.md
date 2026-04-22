---
type: config
wiki_id: >-
  system/Intelligence_Notes/config-discord-accentcolor-must-be-integer-0x57a773--5744
imported_from: >-
  vault/System/Intelligence
  Notes/config-discord-accentcolor-must-be-integer-0x57a773--5744.md
imported_at: '2026-04-04T00:23:57.243Z'
tags: []
summary: ''
---
# Config Change: Discord accentColor must be integer (0x57A773 = 5744499), not a hex string — components v2 silently rejects string format causing invisible styling failures

- **Source:** peer-pr-20260324-210438-556357.txt
- **Suggested:** 2026-03-24T21:28:47Z
- **Impact:** 3/5

## Change Details

Audit all Discord emit calls in the codebase for accentColor fields; convert any hex string values to integer literals

## Status

Auto-flagged for application. Verify before applying to production configs.

---
Tags: #intelligence #config-change #auto-applied

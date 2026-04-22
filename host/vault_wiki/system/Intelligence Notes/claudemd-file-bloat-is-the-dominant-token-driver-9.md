---
type: knowledge
wiki_id: system/Intelligence_Notes/claudemd-file-bloat-is-the-dominant-token-driver-9
imported_from: >-
  vault/System/Intelligence
  Notes/claudemd-file-bloat-is-the-dominant-token-driver-9.md
imported_at: '2026-04-04T00:23:57.242Z'
tags: []
summary: ''
---
# CLAUDE.md file bloat is the dominant token driver: 99.4% of session tokens are input tokens from CLAUDE.md content, not output — modular @imports syntax can recover up to 82% of those tokens by lazy-loading sections

- **Category:** technique
- **Source:** c16122f1.txt
- **Applied:** 2026-03-26T16:42:37Z
- **Impact:** 4/5
- **Project:** OpenClaw Agent Setup

## Details

Audit ~/.claude/CLAUDE.md and split large sections into separate files under ~/.claude/rules/ or ~/.claude/context/, then reference them via @import syntax. Prioritize removing sections that are rarely needed per session (e.g. long reference tables, infrequently-used SOPs). Target: reduce inline CLAUDE.md to under 2KB of always-needed content.

## Source Context

Extracted from agent result: `c16122f1.txt`

---
Tags: #intelligence #technique #auto-applied

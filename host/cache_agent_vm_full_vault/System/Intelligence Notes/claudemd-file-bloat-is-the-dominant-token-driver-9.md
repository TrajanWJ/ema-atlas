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

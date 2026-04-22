---
type: knowledge
wiki_id: system/Intelligence_Notes/leaked-512k-line-claude-code-codebase-circulating-
imported_from: >-
  vault/System/Intelligence
  Notes/leaked-512k-line-claude-code-codebase-circulating-.md
imported_at: '2026-04-04T00:23:57.248Z'
tags: []
summary: ''
---
# Leaked 512K-line Claude Code codebase (circulating as of 2026-03-31) was used with Codex to find/patch bugs — likely targets include the autocompact cascade failure and axios@1.14.1 RAT supply chain compromise; both may affect production Claude Code instances

- **Category:** best-practice
- **Source:** e45fbf51.txt
- **Applied:** 2026-04-01T00:52:02Z
- **Impact:** 3/5
- **Project:** OpenClaw Agent Setup

## Details

Verify current Claude Code version is not affected by autocompact cascade failure or axios@1.14.1 RAT compromise: run `claude --version`, check `node_modules/axios/package.json` version, and pin or upgrade if on a vulnerable version. Add version pin to agent OS bootstrap script.

## Source Context

Extracted from agent result: `e45fbf51.txt`

---
Tags: #intelligence #best-practice #auto-applied

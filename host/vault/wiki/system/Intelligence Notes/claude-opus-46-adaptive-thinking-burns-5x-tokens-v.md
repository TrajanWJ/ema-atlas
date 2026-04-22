---
type: knowledge
wiki_id: system/Intelligence_Notes/claude-opus-46-adaptive-thinking-burns-5x-tokens-v
imported_from: >-
  vault/System/Intelligence
  Notes/claude-opus-46-adaptive-thinking-burns-5x-tokens-v.md
imported_at: '2026-04-04T00:23:57.241Z'
tags: []
summary: ''
---
# Claude Opus 4.6 adaptive thinking burns ~5x tokens vs standard mode and context window degrades meaningfully past 256K tokens in practice — community consensus: use 4.6 for code tasks, revert to 4.5 for writing/creative tasks

- **Category:** best-practice
- **Source:** c16122f1.txt
- **Applied:** 2026-03-26T16:42:37Z
- **Impact:** 3/5
- **Project:** Auto Delegator Layer

## Details

Update agent routing config to default code/engineering agents to claude-opus-4-6 and writing/synthesis agents to claude-opus-4-5. Add a note to dispatch engine or agent SOUL.md that extended thinking mode should be disabled for non-reasoning tasks to avoid 5x token multiplier.

## Source Context

Extracted from agent result: `c16122f1.txt`

---
Tags: #intelligence #best-practice #auto-applied

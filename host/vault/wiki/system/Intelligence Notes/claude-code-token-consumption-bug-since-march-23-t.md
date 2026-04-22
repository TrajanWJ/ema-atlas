---
type: knowledge
wiki_id: system/Intelligence_Notes/claude-code-token-consumption-bug-since-march-23-t
imported_from: >-
  vault/System/Intelligence
  Notes/claude-code-token-consumption-bug-since-march-23-t.md
imported_at: '2026-04-04T00:23:57.241Z'
tags: []
summary: ''
---
# Claude Code token consumption bug since ~March 23: trivial interactions (single-word greetings) burning 22% of Max plan quota per session. GitHub #38335 documents 5-hour windows exhausting in 1-2 hours with unchanged workload. Anthropic labeled issue 'invalid'.

- **Category:** best-practice
- **Source:** 4a0fc6bc.txt
- **Applied:** 2026-03-26T02:34:26Z
- **Impact:** 4/5
- **Project:** Auto Delegator Layer

## Details

Add a warm-start prompt or initialPrompt in agent definition files to avoid trivial first-turn exchanges. Audit dispatch-engine.sh and any claude CLI invocations to ensure the first message is substantive, not a greeting or preamble. Monitor token usage per agent session against baseline.

## Source Context

Extracted from agent result: `4a0fc6bc.txt`

---
Tags: #intelligence #best-practice #auto-applied

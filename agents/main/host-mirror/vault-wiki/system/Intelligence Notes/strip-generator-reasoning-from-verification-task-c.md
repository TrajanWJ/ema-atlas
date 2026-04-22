---
type: knowledge
wiki_id: system/Intelligence_Notes/strip-generator-reasoning-from-verification-task-c
imported_from: >-
  vault/System/Intelligence
  Notes/strip-generator-reasoning-from-verification-task-c.md
imported_at: '2026-04-04T00:23:57.251Z'
tags: []
summary: ''
---
# Strip generator reasoning from verification task context — passing the original generator's chain-of-thought to the verifier causes confirmation bias, not independent checking

- **Category:** best-practice
- **Source:** best-practices-enrichment-001.txt
- **Applied:** 2026-03-27T06:28:40Z
- **Impact:** 3/5
- **Project:** Auto Delegator Layer

## Details

In dispatch-engine.sh or the task handoff scripts, when spawning a verification/peer-review task, pass only the output artifact and success criteria — not the generator agent's reasoning or intermediate steps

## Source Context

Extracted from agent result: `best-practices-enrichment-001.txt`

---
Tags: #intelligence #best-practice #auto-applied

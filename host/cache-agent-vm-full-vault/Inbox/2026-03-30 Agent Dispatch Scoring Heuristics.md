---
type: auto-captured
source: session-transcript
captured: 2026-03-30T02:37:00Z
session: transcript-scanner
tags: [agents, dispatch, intelligent-delegation, routing, heuristics]
score: manual
---

# Agent Dispatch Scoring Heuristics

## What This Is

The Right Hand dispatch protocol uses multi-factor scoring to route tasks to the best-fit agent. This note captures the scoring dimensions referenced in session conversations and codified in AGENTS.md.

## Scoring Factors

| Factor | What It Measures |
|---|---|
| **Task similarity** | Does this task resemble tasks the agent has done successfully before? (from `memory/agent-performance.md`) |
| **Word overlap** | Do key terms in the task match the agent's documented skills and triggers? |
| **Domain matching** | Which domain does the task fall in — coding, research, ops, security, etc.? |
| **File overlap** | Are the relevant files in the agent's normal working scope? |
| **Recency** | Has this agent recently completed or failed a similar task? (affects confidence) |

## How It Works in Practice

Before dispatching, Right Hand scores the task across these factors to pick the primary agent. When scores are close between two agents, the tie-breaker is:
1. Which agent has the better recent performance record for this domain
2. Which agent has the more specific skill (prefer specialist over generalist)

## Current Fitness Scores

Maintained in `memory/agent-performance.md`. Key dynamics:
- **Vault Keeper** needs 8min+ for full scans → factor into timeout estimates
- **Researcher** needs 8min+ for ClawHub tasks
- **Prompt Engineer** is fast (~2min)
- **Ops** is moderate (~3min)

## Crystallization Signal

If a dispatch pattern repeats 5+ times with 70%+ success, it becomes a crystallization candidate → hardens into a routing shortcut in AGENTS.md or a dedicated script.

## Related
- [[AGENTS.md]] — dispatch protocol and agent roster
- [[memory/agent-performance.md]] — live fitness scores
- [[memory/workflow-patterns.json]] — tracked patterns
- [[vault/Research/Self-Critique and Auto-Evolution Design.md]] — evolution framework

## Follow-Up
- Consider adding explicit scoring weights to AGENTS.md dispatch section
- The word-overlap factor could be formalized — each agent gets a canonical keyword list

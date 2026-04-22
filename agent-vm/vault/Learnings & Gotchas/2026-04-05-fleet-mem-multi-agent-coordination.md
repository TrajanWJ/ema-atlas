---
title: "Fleet-Mem Multi-Agent Coordination Pattern"
type: reference
created: 2026-04-05
tags: [pattern, agent-coordination, fleet-mem, multi-agent, concurrency]
summary: "AST-aware semantic search + file locks + discovery sharing for parallel agent work on same codebase"
---

# Fleet-Mem Multi-Agent Coordination Pattern

## The Problem

When multiple agents work on the same codebase simultaneously (e.g., gh-issues spawning multiple Coders), they can:
- Edit the same file concurrently → merge conflicts
- Duplicate discovery work → wasted tokens
- Use stale context → contradictory changes

## Fleet-Mem Solution

Four capabilities that compose together:

1. **AST-aware semantic code search**: Structural understanding, not just text grep
2. **Multi-agent file locks**: Prevent concurrent edits to the same file
3. **git-concurrent coordination**: Merge strategy layer for parallel branches
4. **Discovery sharing**: Agent A finds X → recorded in fleet-mem → Agent B reads before starting

## Advantages Over Current Pattern (Vault + Handoff Envelopes)

| Current | Fleet-Mem |
|---------|-----------|
| No file locks → race conditions | File locks prevent conflicts |
| Discoveries shared post-session | Discoveries shared in-session |
| Text search | Structural code understanding |
| Conflicts detected at merge | Conflicts prevented before work starts |

## When to Use

Batch parallel agent work — anytime 2+ agents touch the same repo simultaneously. Not needed for sequential handoffs or independent repos.

## Status

Analyzed and documented as of 2026-04-04. Not yet prototyped. Recommendation: test on non-critical repo before fleet-wide adoption.

## Related

- [[KAIROS Pattern — Cross-Session Memory Distillation]]
- [[Degraded Mode Operations Protocol]]

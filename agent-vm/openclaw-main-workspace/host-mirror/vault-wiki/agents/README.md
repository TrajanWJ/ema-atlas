---
title: README
created: '2026-03-16'
updated: '2026-03-16'
type: agent-learning
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: manual
tags:
  - agents
  - architecture
  - evolution
  - knowledge
summary: >-
  This directory is the shared memory system for all agents in the fleet. Every
  agent reads these files on startup to benefit from collective experience
wiki_id: agents/README
imported_from: vault/Agents/README.md
imported_at: '2026-04-04T00:23:56.689Z'
---
# Agent-Learnings — Shared Cross-Agent Memory

This directory is the shared memory system for all agents in the fleet. Every agent reads these files on startup to benefit from collective experience.

## Purpose

Agents operate independently but learn collectively. When one agent discovers a pattern, makes a mistake, or finds a tool trick, it records the learning here so all agents benefit.

## Files

| File | Purpose |
|------|---------|
| `patterns.md` | Reusable patterns any agent has discovered |
| `mistakes.md` | Things that failed — so no agent repeats them |
| `tools.md` | Tool usage tips and tricks |

## Entry Format

All files use an append-only format:

```markdown
## YYYY-MM-DD | Agent Name | Brief Title

Description of the learning.
```

## How Agents Use This

1. **On startup**: Read all three files to prime context
2. **During work**: Apply relevant learnings
3. **After tasks**: Append new discoveries via the evolution loop or manually

## Rules

- Entries are **append-only** — never edit or delete previous entries
- Keep entries concise — 2-3 sentences max
- Include the agent name so patterns can be traced
- Only record learnings that generalize across agents

## Related

- [[README]]

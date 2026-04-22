---
title: "Ship Core Loop"
intent_level: 1
intent_kind: goal
intent_status: active
intent_priority: 1
project: ema
parent: "[[EMA-Life-OS]]"
tags: ["goal", "core-loop", "execution"]
---

# Ship Core Loop

End-to-end execution loop: brain dump to completed work with harvested results.

## What
The core loop that makes EMA useful: capture an idea, refine it through proposals, approve it, dispatch to an agent, harvest the result, and feed it back into the knowledge base.

## Current State
Phase 1 complete. The loop works end-to-end:
```
brain dump → proposal pipeline → approval → execution dispatch → Claude CLI → result artifact → completion
```

## Children
- [[Execution-Engine]]
- [[Proposal-Pipeline]]
- [[Second-Brain]]

## What's Left
- Outcome linker (proposal to result feedback)
- Auto-approve rules for safe proposals
- Pattern crystallizer (Phase 3)

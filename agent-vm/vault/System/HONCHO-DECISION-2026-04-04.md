---
title: "Honcho Decision — Build Native EMA Memory Engine"
type: decision
status: decided
decided_at: 2026-04-04T00:58Z
decided_by: Trajan
tags: [ema, honcho, memory, superman, intents, proposals, wiki, architecture]
---

# Honcho Decision

## Decision

**Skip external Honcho entirely. Build a native EMA Memory Engine that takes Honcho's concepts and integrates them deeply with EMA's existing systems.**

## Rationale

Honcho (v2/v3) is fundamentally a user modeling + long-term memory service for AI apps. Its core value:
- Session-scoped user memory
- Metamemory (tracking what matters, what's stale)
- Context injection at dispatch time
- Cross-session persistence

EMA already has better native primitives:
- **Intents** (`.superman` files) — structured per-project goals and constraints
- **Proposals** — captures user decisions and preferences over time  
- **Superman** (`context_for/2`) — context assembly at dispatch time
- **Wiki/Vault** — persistent semantic knowledge graph
- **SessionWatcher** — Claude session history, outcomes, patterns

Building natively means:
- Full control over data model
- Intents/proposals/Superman/wiki are first-class memory sources (not serialized into external schema)
- No external service dependency
- Memory is queryable, linkable, and part of the same vault

## What We're Building

`Ema.Memory` — Native EMA Memory Engine

### Core Concepts (cross-pollinated from Honcho)

| Honcho Concept | EMA Native Equivalent |
|---|---|
| User model | `.superman` IDENTITY + persistent intent history |
| Session memory | `ClaudeSessions.SessionWatcher` outcomes + execution history |
| Metamemory | Outcome tracker + signal processor (what worked, what didn't) |
| Context injection | `Superman.context_for/2` (already designed) |
| Cross-session persistence | Vault notes + proposal history + execution log |
| Memory tiers (hot/warm/cold) | Loomkin-inspired tiering (already in context_for spec) |

### Architecture

```
Ema.Memory
  ├── IntentStore       — reads/writes .superman INTENT entries
  ├── OutcomeStore      — execution results, proposal resolutions
  ├── SessionStore      — claude session outcomes (via SessionWatcher)
  ├── WikiIndex         — vault semantic search (VaultWatcher + embeddings)
  └── ContextAssembler  — Superman.context_for/2 (hot/warm/cold tiers)
```

### Integration Points

- **Proposal generation** → seeded by Intent history (what has Trajan approved before?)
- **Pre-dispatch injection** → Superman.context_for/2 feeds Memory context into each agent invocation
- **Post-execution** → execution outcomes written back to OutcomeStore + wiki notes
- **Wiki** → vault notes are queryable memory, linked via wikilinks

## What This Unlocks

- Reflexion injection (Week 8) — agents learn from past execution outcomes
- Scope Advisor — built on outcome history from OutcomeStore
- Semantic vault search — WikiIndex powers context retrieval
- Intent-aware proposals — proposals know your pattern of decisions

## Implementation Order

1. `OutcomeStore` — simplest, just wraps existing execution log (Week 7)
2. `IntentStore` — reads .superman files, persists intent edits (Week 7)  
3. `ContextAssembler` — implement `Superman.context_for/2` for real (Week 8)
4. `WikiIndex` — semantic embedding pipeline (Week 8-9)
5. `SessionStore` — cross-session learning (Week 9)

## Files to Create

- `daemon/lib/ema/memory/` — top-level Memory context
- `daemon/lib/ema/memory/intent_store.ex`
- `daemon/lib/ema/memory/outcome_store.ex`
- `daemon/lib/ema/memory/context_assembler.ex` (= Superman.context_for/2 implementation)
- `daemon/lib/ema/memory/wiki_index.ex` (Week 8-9)

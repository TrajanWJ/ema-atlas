---
type: auto-captured-manual
source: session-transcript
captured: 2026-04-05T15:35:00Z
session: 342e4041-e948-401b-b6ad-b48edab69feb
category: fix
tags: [elixir, ema, superman, knowledge-graph, compiler, hot-reload]
---

# Elixir built-in type collision in `knowledge_graph.ex`

A concrete EMA daemon compile failure came from redefining Elixir's built-in `node/0` type inside `daemon/lib/ema/superman/knowledge_graph.ex`.

## What happened

Compilation failed with:

```text
** (Kernel.TypespecError) lib/ema/superman/knowledge_graph.ex:10: type node/0 is a built-in type and it cannot be redefined
```

The local module had declared:

```elixir
@type node :: %{...}
```

That collided with Elixir's built-in `node/0` type.

## Fix

Rename the custom typespec to something module-specific, e.g.:

```elixir
@type kg_node :: %{...}
```

## Operational wrinkle

During the session, Phoenix dev code reloading made the situation look noisier than it was. The agent observed that HEAD already contained the `kg_node` rename, but hot reload / old compiled beams were still surfacing the stale `node/0` error while other edits were in flight.

Practical takeaway:
- if a typespec collision looks "already fixed at HEAD" but the daemon still errors,
- suspect stale compiled artifacts or dev reloader churn before assuming the source file is still wrong.

## Why this is worth remembering

This is an easy Elixir footgun in domain-heavy modules: avoid generic typespec names like `node`, `pid`, etc. Prefer explicit local names (`kg_node`, `graph_node`, `intent_node`) to avoid collisions with built-ins and to make compiler errors more legible.

---
*Captured manually from transcript review because the auto-knowledge queue entry was truncated.*

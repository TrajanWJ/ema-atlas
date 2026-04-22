---
id: "3e986166-9905-4ab9-af70-b9576307b26e"
title: ""
space: wiki
tags: []
source: manual
---

---
title: Skipped Repos — Final Steals
tags: [research, cross-pollination, steal]
source: session-2026-04-07
---

# Skipped Repos Deep Dive — 5 Final Steals

## 1. Durable (Elixir) — Crash-Recoverable Executions [HIGHEST PRIORITY]
Step-level DB persistence before/after each step. On restart, query for
running/waiting executions and resume from last checkpoint. Saga compensations
for multi-step failures. DIRECTLY applicable to Ema.Executions.Dispatcher.

## 2. Graphiti — RRF Hybrid Search (~10 lines Elixir)
Reciprocal Rank Fusion merges keyword + semantic + graph search results.
Items ranking high across multiple methods bubble to top.
Also: temporal validity windows on edges (valid_at/invalid_at).

```elixir
def rrf(result_lists, rank_const \\ 1) do
  result_lists
  |> Enum.flat_map(fn results ->
    results |> Enum.with_index() |> Enum.map(fn {id, i} -> {id, 1/(i+rank_const)} end)
  end)
  |> Enum.group_by(&elem(&1, 0), &elem(&1, 1))
  |> Enum.map(fn {id, scores} -> {id, Enum.sum(scores)} end)
  |> Enum.sort_by(&elem(&1, 1), :desc)
end
```

## 3. Mem0 — LLM-Mediated Memory Consolidation
Instead of dumb summarization: extract facts, compare to existing memory,
LLM decides ADD/UPDATE/DELETE/NOOP. UUID-to-integer mapping prevents hallucination.
Replaces AgentMemory compression with intelligent consolidation.

## 4. Minutes — Relationship Scoring with Decay
score = mention_count × (1/(1 + days_since/30)) × min(shared_tags/3, 1)
Apply to vault graph for prioritized relationship map + losing_touch alerts.

## 5. Ruflo — Topology-Aware Agent Connections (Low Priority)
Define which agents can communicate (mesh/hierarchical/ring).
EMA's actor system already more sophisticated.

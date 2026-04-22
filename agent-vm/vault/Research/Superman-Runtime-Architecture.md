---
title: "Superman .superman File Runtime Architecture"
created: 2026-04-03
updated: 2026-04-03
type: research
confidence: 0.75
tags: [superman, runtime, intent-language, ema, vault-watcher, graph-builder]
summary: "Trigger: file change via VaultWatcher. Transform: parse → graph nodes. Store: Superman.KnowledgeGraph (libgraph). Inject: at agent spawn via Superman.context_for(project). Conflict resolution: .superman file as ground truth, live state as annotation."
---

# Superman `.superman` File Runtime Architecture

*Sources: 0 external (architecture derived from system design, EMA codebase patterns, Honcho/libgraph research)*
*Confidence: Medium-High (0.75) — architectural inference, no external validation*
*Date: 2026-04-03*

## Summary

**The `.superman` file runtime follows a four-stage pipeline: file-change trigger → parser → graph store → spawn-time injection.** VaultWatcher already watches the filesystem — extend it to detect `.superman` files. A parser converts the six-keyword intent language into typed graph nodes. Superman.KnowledgeGraph (libgraph) stores them. At agent spawn, `Superman.context_for(project_id)` assembles the relevant subgraph into a compact context block injected into the agent's prompt.

## The Pipeline

```
.superman file written/changed
    │
    ▼
VaultWatcher detects change
    │
    ▼
Superman.IntentParser.parse(file_path)
    → returns [{:node_type, attrs}]
    │
    ▼
Superman.KnowledgeGraph.ingest(nodes, project_id)
    → updates libgraph, persists to ETS
    │
    ▼
[later, at agent spawn]
    │
    ▼
Superman.context_for(project_id, opts)
    → traverses graph, returns compact context string
    │
    ▼
Injected into agent spawn prompt as SUPERMAN CONTEXT block
```

## Stage 1: Trigger — Extend VaultWatcher

VaultWatcher already uses `FileSystem` (or similar) to watch vault paths. Extend it to also watch `.superman/` directories in all project roots.

```elixir
defmodule Superman.FileWatcher do
  use GenServer
  
  @superman_pattern ~r/\.superman$/
  
  def handle_info({:file_event, _watcher_pid, {path, events}}, state) do
    if Regex.match?(@superman_pattern, path) && :modified in events do
      Superman.IntentParser.parse_and_ingest(path)
    end
    {:noreply, state}
  end
end
```

**Trigger criteria:** `:modified` or `:created` events on files matching `*.superman` or files inside `.superman/intents/` directories. Don't trigger on `:deleted` — mark nodes as inactive instead (tombstone, not removal, for audit trail).

## Stage 2: Parser

The six-keyword intent language needs a simple parser. No need for a full parser combinator — a line-by-line approach is sufficient.

```elixir
defmodule Superman.IntentParser do
  @keywords ~w[INTENT CONTEXT CONSTRAINT RELATIONSHIP PRIORITY NOTE]
  
  def parse_and_ingest(path) do
    path
    |> File.read!()
    |> parse_file()
    |> ingest_nodes(project_id_from_path(path))
  end
  
  defp parse_file(content) do
    content
    |> String.split("\n")
    |> Enum.reduce(%{intents: [], current: nil}, fn line, acc ->
      case String.split(line, ":", parts: 2) do
        [kw, value] when kw in @keywords ->
          node = %{type: String.downcase(kw), value: String.trim(value), source: :superman_file}
          %{acc | intents: [node | acc.intents]}
        _ -> acc
      end
    end)
    |> Map.get(:intents)
  end
  
  defp project_id_from_path(path) do
    # Extract project ID from path convention: /projects/:id/.superman/intents/
    path |> Path.split() |> Enum.find(&String.starts_with?(&1, "proj_"))
  end
end
```

## Stage 3: Graph Storage

Parsed nodes become vertices in Superman.KnowledgeGraph:

```elixir
defmodule Superman.KnowledgeGraph do
  # Node types mapped from .superman keywords
  # INTENT → :intent vertex with priority and description
  # CONTEXT → :context vertex (background knowledge)
  # CONSTRAINT → :constraint vertex (hard limits on agent behavior)
  # RELATIONSHIP → :relationship edge between two existing vertices
  # PRIORITY → weight modifier on existing edges
  # NOTE → :annotation vertex (informal, low weight)
  
  def ingest(nodes, project_id) do
    GenServer.cast(__MODULE__, {:ingest, nodes, project_id})
  end
  
  def handle_cast({:ingest, nodes, project_id}, state) do
    graph = Enum.reduce(nodes, state.graph, fn node, g ->
      vertex_id = {project_id, node.type, node.value |> String.slice(0, 32)}
      Graph.add_vertex(g, vertex_id, Map.put(node, :project_id, project_id))
      |> Graph.add_edge({project_id, :root}, vertex_id, label: :has_intent, weight: 1.0)
    end)
    GraphStore.save(graph)
    {:noreply, %{state | graph: graph}}
  end
end
```

## Stage 4: Spawn-Time Injection

At agent spawn, the Orchestrator or Dispatcher calls `Superman.context_for/2`:

```elixir
defmodule Superman do
  def context_for(project_id, opts \\ []) do
    max_tokens = Keyword.get(opts, :max_tokens, 2000)
    
    nodes = KnowledgeGraph.project_subgraph(project_id)
    
    nodes
    |> Enum.group_by(& &1.type)
    |> format_as_context_block()
    |> truncate_to_tokens(max_tokens)
  end
  
  defp format_as_context_block(grouped) do
    """
    SUPERMAN CONTEXT — #{DateTime.utc_now() |> DateTime.to_date()}
    
    INTENTS:
    #{format_nodes(grouped[:intent])}
    
    CONSTRAINTS:
    #{format_nodes(grouped[:constraint])}
    
    CONTEXT:
    #{format_nodes(grouped[:context])}
    
    RELATIONSHIPS:
    #{format_nodes(grouped[:relationship])}
    """
  end
end
```

This block is prepended to every agent spawn prompt for that project.

## Conflict Resolution: `.superman` vs Live State

When `.superman` file content contradicts live system state (e.g., `.superman` says "always deploy to Render" but the live project is now on Vercel):

**Rule: `.superman` is intent (what should be true), live state is fact (what is true).** They are not in conflict — they are different layers. The agent receives both and reasons about the gap.

Format in the context block:
```
INTENT: Deploy to Render [from .superman file]
LIVE STATE: Currently deployed to Vercel [from project context API]
NOTE: Intent and live state diverge — clarify with user before deployment decisions.
```

Never silently suppress the conflict. Always surface it.

## Key Decisions

| Decision | Choice | Reasoning |
|---|---|---|
| Trigger | VaultWatcher file-change event | Already exists, zero new infrastructure |
| Parse | Line-by-line keyword scanner | File format is simple, no parser combinator needed |
| Store | libgraph via Superman.KnowledgeGraph | Consistent with graph research findings |
| Inject | At agent spawn, prepended to prompt | Not at project switch (too early, agent not yet spawned) |
| Conflict | Surface both, don't resolve | Agent should know about the gap, not be handed a fake resolution |
| Tombstone | Mark deleted files' nodes as :inactive | Never remove — provides historical audit trail |

## Open Questions

1. **File format finalization** — the six keywords need exact syntax spec before the parser is written. Current assumption: `KEYWORD: value` one per line.
2. **Project ID in path** — the path convention for extracting project ID from `.superman` file location needs to match EMA's actual project directory structure.
3. **Max inject size** — 2,000 tokens is an assumption. Validate against actual agent spawn prompt sizes before shipping.

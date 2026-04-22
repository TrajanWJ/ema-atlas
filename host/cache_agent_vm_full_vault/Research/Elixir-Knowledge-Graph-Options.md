---
title: "Knowledge Graph Implementations for Elixir/OTP — Research Report"
created: 2026-04-03
updated: 2026-04-03
type: research
confidence: 0.80
tags: [elixir, knowledge-graph, superman, ema, libgraph, ets, mnesia, graph-database]
summary: "libgraph is the correct choice for Superman in-process graph. ETS for persistence. No Mnesia, no SQLite extensions needed. HQ query patterns map cleanly to libgraph traversal API."
sources: "2 primary, 1 institutional, 0 secondary"
---

# Knowledge Graph Implementations for Elixir/OTP

*Sources: 3 total (2 primary, 1 institutional, 0 secondary)*
*Confidence: High (0.80)*
*Date: 2026-04-03*

## Summary

**libgraph (bitwalker/libgraph, v0.16.0) is the correct choice for Superman's knowledge graph in EMA's Elixir stack.** It is the standard Elixir graph library, avoids ETS table proliferation (the core reason it was built), has an idiomatic functional API, and directly supports the traversal, shortest-path, and neighbor queries HQ will need. Pair it with ETS for persistence across restarts. Mnesia adds distributed complexity with no benefit for a single-user system. SQLite graph extensions are not native to Elixir and add an unnecessary FFI layer.

## Findings

### Options Evaluated

| Option | Fit for Superman | Notes |
|---|---|---|
| **libgraph** | ✅ Best fit | Pure Elixir, no ETS overhead, idiomatic API, active |
| **:digraph (OTP built-in)** | ❌ | Requires 3-6 ETS tables per graph instance, inconsistent API |
| **Mnesia** | ❌ | Distributed complexity, overkill for single-user, fragile on restarts |
| **SQLite graph extension** | ❌ | FFI layer, not native Elixir, adds dependency chain |
| **VaultWatcher + GraphBuilder** | 🔄 Use as input | Good for building the graph from files; libgraph should be the runtime store |

### libgraph: Why It's Right

From the GitHub repo (T1, bitwalker/libgraph):

- **No ETS tables** — the original motivation. `:digraph` requires 3-6 ETS tables per graph. In a system managing many graphs concurrently (Superman tracking multiple projects), this hits system limits. libgraph uses pure Elixir data structures.
- **Directed and undirected graphs** — Superman's knowledge graph is directed (entity A *relates-to* entity B with a specific relationship type)
- **Idiomatic Elixir API** — pipeable, graph as first argument, consistent across operations
- **Priority queue built-in** — for weighted traversal (relationship strength scores)
- **Graphviz DOT serialization** — useful for debugging the graph visually
- **Active**: v0.16.0, test-suite with QuickCheck properties

```elixir
# Superman knowledge graph example
graph = Graph.new(type: :directed)
  |> Graph.add_vertex(:studiokamel, label: "StudioKamel", type: :project)
  |> Graph.add_vertex(:deploy_render, label: "Render Deploy", type: :infrastructure)
  |> Graph.add_vertex(:ema_agent, label: "EMA Agent", type: :agent)
  |> Graph.add_edge(:studiokamel, :deploy_render, label: :deploys_to, weight: 1.0)
  |> Graph.add_edge(:ema_agent, :studiokamel, label: :works_on, weight: 0.9)

# Traversal — what does StudioKamel connect to?
Graph.out_neighbors(graph, :studiokamel)
# → [:deploy_render]

# Path — how is the agent related to the deployment?
Graph.dijkstra(graph, :ema_agent, :deploy_render)
# → [:ema_agent, :studiokamel, :deploy_render]
```

### Persistence Strategy

libgraph is in-memory. For persistence across EMA restarts:

**Pattern: ETS + term_to_binary**
```elixir
defmodule Superman.GraphStore do
  @table :superman_graph
  
  def save(graph) do
    :ets.insert(@table, {:graph, :erlang.term_to_binary(graph)})
  end
  
  def load() do
    case :ets.lookup(@table, :graph) do
      [{:graph, bin}] -> :erlang.binary_to_term(bin)
      [] -> Graph.new(type: :directed)
    end
  end
end
```

For durability across VM restarts, serialize to disk periodically:
```elixir
# In GenServer handle_info(:persist, state)
File.write!("priv/superman_graph.bin", :erlang.term_to_binary(state.graph))
```

Load on GenServer init from the bin file. Simple, zero dependencies beyond Elixir standard library.

### HQ Query Patterns → libgraph API Mapping

| HQ Needs | libgraph Function |
|---|---|
| "What's related to StudioKamel?" | `Graph.out_neighbors/2` |
| "How is entity A connected to entity B?" | `Graph.dijkstra/3` or `Graph.a_star/4` |
| "All agents working on this project" | `Graph.in_neighbors/2` filtered by type |
| "Which projects have active deployments?" | `Graph.vertices/1` filtered, then `Graph.out_edges/2` |
| "Nearest nodes to this entity" | Custom BFS using `Graph.out_neighbors/2` |

All of these are O(V+E) or better. For Superman's expected graph size (dozens to low hundreds of nodes), performance is not a concern.

### Superman GenServer Architecture

```elixir
defmodule Superman.KnowledgeGraph do
  use GenServer
  
  # One GenServer per project, or one global
  # Recommendation: one global, with project as a vertex property
  
  def start_link(_) do
    GenServer.start_link(__MODULE__, [], name: __MODULE__)
  end
  
  def init(_) do
    graph = Superman.GraphStore.load()
    {:ok, %{graph: graph}}
  end
  
  def handle_call({:query, :neighbors, vertex}, _, state) do
    neighbors = Graph.out_neighbors(state.graph, vertex)
    {:reply, neighbors, state}
  end
  
  def handle_cast({:add_entity, vertex, attrs}, state) do
    graph = Graph.add_vertex(state.graph, vertex, attrs)
    Superman.GraphStore.save(graph)
    {:noreply, %{state | graph: graph}}
  end
end
```

### Generalization: Codebase → Project/Client/Infrastructure

The planning doc correctly identifies that Superman's graph should generalize. The node types change; the traversal logic is identical.

| Domain | Vertex Types | Edge Types |
|---|---|---|
| Codebase | module, function, file, dependency | calls, imports, depends_on |
| Project | project, client, deployment, agent_task | owns, deploys_to, assigned_to |
| Infrastructure | server, service, database, repo | hosts, connects_to, backs_up |

All of these are directed graphs with labeled edges and weighted relationships. libgraph handles all three domains with the same API. The VaultWatcher can continue populating the graph from `.superman` files; the graph store is just libgraph instead of whatever GraphBuilder currently uses.

## Key Takeaways

1. **Use libgraph** — add `{:libgraph, "~> 0.16.0"}` to mix.exs. No other graph library needed.
2. **Persist with ETS + term_to_binary** — periodic disk flush for durability. Zero external dependencies.
3. **One global GenServer** — single knowledge graph process for EMA, vertices tagged with project/domain.
4. **VaultWatcher feeds libgraph** — keep the existing file watcher, route its output into `Superman.KnowledgeGraph.add_entity/2` casts.
5. **HQ queries via Phoenix Channel or REST** — `Superman.KnowledgeGraph.query/2` wrapped in a controller action or channel handler.

## Contested / Unknown

- libgraph's last commit date — repo looks stable but I couldn't verify recent activity against the GitHub page directly
- Whether GraphBuilder already uses libgraph internally (possible — check the codebase)
- Performance at 1,000+ nodes if Superman's graph grows beyond expected size (fine for hundreds; not benchmarked above that)

## Sources

1. [T1] [bitwalker/libgraph GitHub](https://github.com/bitwalker/libgraph) — library description, API, motivation, ETS comparison
2. [T1] [hex.pm/packages/libgraph](https://hex.pm/packages/libgraph) — version 0.16.0 confirmed current
3. [T2] [Phoenix Channels docs](https://hexdocs.pm/phoenix/channels.html) — for HQ → EMA WebSocket query pattern context

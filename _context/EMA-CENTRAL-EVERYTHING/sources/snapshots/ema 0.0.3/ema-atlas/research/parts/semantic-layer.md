# Semantic Layer / Knowledge System — Gleam mapping

## Part summary

The semantic layer is EMA's knowledge substrate: persistent,
addressable, linkable nodes (wiki, blueprint, references, inline
prompts) that humans and agents both reach. The Elixir tree already
has `second_brain/indexer.ex` establishing that knowledge indexing is
a daemon responsibility; "Superman" (vault-candidate) is a documented
embedding/index/query infrastructure that has not been built. The
Gleam port models nodes and typed edges as first-class records and
keeps `context_for/2` as the canonical retrieval function — typed
once and called from every driver.

## Type sketch

```gleam
import gleam/option.{type Option}
import gleam/list

pub opaque type NodeId { NodeId(String) }
pub opaque type EdgeId { EdgeId(String) }

pub type NodeKind {
  Concept
  Decision
  OpenQuestion
  Proposal
  Component
  Rule
  Doctrine
  Reference
  WikiPage
  Blueprint
}

pub type Visibility {
  ProjectScoped(project: ProjectId)
  SpaceScoped(space: SpaceId)
  OrgWide(org: OrgId)
  Public
}

pub type Node {
  Node(
    id: NodeId,
    kind: NodeKind,
    title: String,
    body: String,
    visibility: Visibility,
    author: Actor,
    promotion: Promotion,
    updated_at_ms: Int,
  )
}

pub type Promotion { Draft InReview Canonical Deprecated }

pub type Edge {
  Edge(
    id: EdgeId,
    relation: Relation,
    from: NodeId,
    to: NodeId,
    by: Actor,
  )
}

pub type Relation {
  References
  Refines
  Contradicts
  Implements
  DerivedFrom
  PromotedFrom
}

pub type ContextRequest {
  ContextRequest(
    project: ProjectId,
    actor: Actor,
    query: String,
    limit: Int,
  )
}

pub type ContextHit {
  ContextHit(node: NodeId, score: Float, snippet: String)
}
```

The retrieval contract:

```gleam
pub fn context_for(req: ContextRequest)
  -> Result(List(ContextHit), ContextError)
```

## Actor sketch

```gleam
pub type GraphStoreMsg {
  Upsert(node: Node, reply_to: Subject(Result(Nil, GraphError)))
  Connect(edge: Edge, reply_to: Subject(Result(Nil, GraphError)))
  Get(id: NodeId, reply_to: Subject(Option(Node)))
  Neighbours(id: NodeId, reply_to: Subject(List(Edge)))
}

pub type IndexerMsg {
  Reindex(node: NodeId)
  Search(req: ContextRequest, reply_to: Subject(List(ContextHit)))
}

pub type PromotionMsg {
  Propose(node: NodeId, by: Actor, reply_to: Subject(Result(Nil, PromError)))
  Approve(node: NodeId, by: Actor, reply_to: Subject(Result(Nil, PromError)))
}
```

- `ema/semantic/graph_store` — `Subject(GraphStoreMsg)`. New for
  v0.0.3; today only the unstructured `second_brain/indexer.ex`
  exists.
- `ema/semantic/indexer` — `Subject(IndexerMsg)`. Wraps SQLite FTS5
  via `sqlight` and emits index updates on every `Upsert`. Maps
  loosely to `Ema.SecondBrain.Indexer`.
- `ema/semantic/promotion` — `Subject(PromotionMsg)`. Validates the
  Draft → InReview → Canonical transitions and emits a
  `command_bus.Append` so promotions land in the event log.
- `ema/semantic/context_resolver` — pure functions; no actor. Wraps
  `indexer.Search` with visibility filtering against the calling
  actor's identity.

## Supervision tree fragment

```text
root_supervisor
└── semantic/supervisor (one_for_one)
    ├── semantic/graph_store
    ├── semantic/indexer
    └── semantic/promotion
```

`semantic/supervisor` boots after `persistence/repo` (shares the
SQLite handle) and after `identity/registry` (visibility resolution
needs Org/Space/Member). It is independent of `surfaces/supervisor`
and therefore can be rebuilt without restarting surfaces.

## Where it leans on Erlang/Elixir interop

- SQLite FTS5 via `sqlight`; for FTS-specific tokenizers (porter,
  trigram) FFI to `:esqlite3` and execute raw `CREATE VIRTUAL TABLE
  ... USING fts5(...)`.
- For embeddings (if Superman is adopted): FFI HTTP via `:gun` to a
  local embedding server, since Gleam has no native vector store. An
  `:ets` table can hold the in-memory ANN index, accessed via
  `:ets.new/2`, `:ets.lookup/2`.
- `:erlang.phash2/1` for stable `NodeId` derivation from canonical
  title strings.
- `:zlib.gzip/1` for storing large WikiPage bodies compressed.
- For eventual P2P federation (`OrgWide`/`Public` nodes published to
  peers), `:rpc.call/4` is the BEAM-native way; Gleam has no direct
  wrapper.

## Tests this part needs at v0.0.3

- Property test (`gleam_qcheck`): for any list of `Upsert` /
  `Connect` operations, the resulting graph has no dangling edges
  (every `Edge.from` and `Edge.to` resolves to a stored `Node`).
- Visibility-filter test: a `context_for` request from an actor in
  `ProjectId(A)` does not return nodes whose `Visibility =
  ProjectScoped(B)`.
- Promotion-event test: `Approve` on a node in `InReview` emits an
  event into `event_log` with `EventBody.ProposalProposed`-shaped
  payload (proves the promotion path is on the bus).
- FTS round-trip test: index 100 nodes, search on a known token,
  assert top hit is the node containing it.
- Edge-relation closure test: given a small graph, `Neighbours(id)`
  returns exactly the edges with `from = id` (and not `to = id`)
  unless explicitly requested.
- Compile-fail fixture: `NodeId` cannot be passed to a function
  expecting `WorkspaceArtifactId` or `ExecutionId`.

## Open questions specific to Gleam mapping

- **Q2** — if collab state moves into `event_log`, then `Node.body`
  has to become a projection actor over events, not a stored string.
  Today the type signature assumes "body is a string"; Q2 changing
  forces a rewrite of `graph_store.Upsert`.
- **Q8** — sync model decides whether `Node.body` is a `String`, a
  Yjs document handle (`String` of doc id), an Automerge change log,
  or a hybrid. With no Gleam-native CRDT lib, FFI to a Node-side
  sidecar process or a pure-BEAM CRDT becomes the forced fork. The
  retrieval contract `context_for` does not change; the storage
  contract for `Node` does.
- **Q1** — `Node.author: Actor` and `Edge.by: Actor` need first-class
  agent identity. Without Q1, every agent inline-prompt lands as a
  human-attributed edit and the "what did the AI add" view is wrong.
- **Q3 / Q9** — `Visibility.SpaceScoped` and `OrgWide` are typeable
  today but cannot be evaluated against any real Space lifecycle
  until Q3 lands; cross-peer federation of `OrgWide` needs Q9.
- Whether to **adopt Superman or build inline** — Superman as a
  separate BEAM service means the Gleam daemon FFI's into it via
  `:gen_server.call`; building inline means `semantic/indexer` grows
  an embedding pipeline. Today both paths are typeable.

## Read next

- `graph/edges/memory.md`, `graph/edges/collab.md`
- `content/briefs/semantic-layer.md`
- `codebase-ema/code/ema/daemon/lib/ema/second_brain/indexer.ex`
- `docs-ema-next-steps/.../ULTIMATE-WIKI-ARCHITECTURE.qmd`
- `docs-host-obsidian-vault/.../Intelligence-Integrations/superman-architecture.md`
- `OPEN_QUESTIONS.md` Q1, Q2, Q3, Q8, Q9
- `sqlight` FTS notes: https://hexdocs.pm/sqlight/
- Gleam stdlib: https://hexdocs.pm/gleam_stdlib/

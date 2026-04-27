# Semantic Layer / Knowledge System

## The frame

The semantic layer is the part of EMA that decides what counts as
*knowledge* inside the system: not chat scrollback, not transient session
context, but persistent, addressable, linkable nodes that humans and agents
can both reach. It is the connective tissue between the wiki, the
blueprint, the graph view, and the inline-prompt edges that turn a
reference into an action. Under the canonical rule —
*EMA owns truth. Hermes owns execution. Surfaces do not own state.* —
the semantic layer is a peculiar middle case: it is not control-plane
truth (no proposal, dispatch, or incident lives there) but it is also not
a transient surface artifact. It is the durable substrate of meaning that
control-plane records and execution lineage *point at*.

The hard frame question: does the semantic layer **index** the truth that
EMA records, or does it **author** truth that EMA later ratifies? A wiki
that only describes the world is a reference book. A wiki whose nodes can
become proposals, blueprints, or dispatched work is part of the operating
system. The three visions below pull in different directions on exactly
that axis.

## What's already true

- A `second_brain` indexer already exists in the daemon at
  `codebase-ema/code/ema/daemon/lib/ema/second_brain/indexer.ex` (see
  `graph/edges/memory.md`), establishing that "indexing knowledge" is a
  daemon-side responsibility, not a surface concern.
- An ultimate wiki architecture has been drafted under
  `docs-ema-next-steps/.../ULTIMATE-WIKI-ARCHITECTURE.qmd` and a source
  map under `ULTIMATE-WIKI-SOURCE-MAP.qmd` (cited in
  `graph/edges/collab.md` and `graph/edges/memory.md`).
- A knowledge ingest plan from the OpenClaw lineage is preserved at
  `docs-ema-next-steps/.../OPENCLAW-KNOWLEDGE-INGEST-PLAN.qmd`.
- Vault candidate terms in `GLOSSARY.md` document a richer cognitive
  stack already explored in the host vault: **Vault Cognitive Layer**
  (metabolism + graph + cognition), **Superman (Semantic Layer)** as
  the embedding/index/query infrastructure with `context_for/2`, and
  **Intelligence Layer** as a pre-routing reasoning tier — all sourced
  from `docs-host-obsidian-vault/...`.
- The Blueprint concept (Karpathy-style) is named in
  `05-fresh-context-project-app-model.md` §5 as the structuring artifact
  that integrates with the Wiki and intent capture.

## What's still open

- Q2: collaboration state in `event_log` or adjacent — directly
  determines whether semantic-layer edits are control-plane events or
  live in a separate sync substrate.
- Q8: sync model (Yjs / Automerge / pure-Elixir CRDT / event-log /
  hybrid) — picks the physical shape of every wiki node and edge.
- The promotion path from a wiki node to a proposal, blueprint, or
  dispatch is undefined (`05-fresh-context-project-app-model.md` §5
  gestures at it; no schema).
- Q1 indirectly: if agents are first-class members, they author wiki
  nodes with attribution; if not, every agent edit must be re-attributed
  to a human principal, which constrains the inline-prompting model.
- Whether **Superman** (vault-candidate semantic infrastructure) is
  adopted as the canonical embedding tier or rebuilt inside the daemon
  is unresolved — it sits in `GLOSSARY.md` as a candidate, not canon.

## The three futures, expanded

### Disciplined Reference System (semantic-operator-cathedral)

The semantic layer becomes a tightly governed reference system. Every
node has a canonical type, every edge a typed relation, and promotion
from "draft" to "canonical" requires an explicit gate. The graph is
small enough that an agent can be expected to know its shape.

- **What this would force you to build first:** a strict node/edge schema
  in `control_plane/schema.ex`; a promotion workflow that turns a draft
  into a canonical node with an event-log entry; a `context_for/2`-style
  retrieval contract (analogous to vault-candidate **Superman**) that
  agents must call instead of free-text search.
- **What this would force you to give up:** the casual capture velocity
  of an Obsidian-style vault; the ability for agents to scribble freely
  without prior schema awareness.
- **Smallest provable slice:** a 2-week vertical that ships ~8 canonical
  node types (Concept, Decision, Open-Question, Proposal, Component,
  Rule, Doctrine, Reference), a typed edge set, and one workflow:
  draft → review → canonical with an event-log emission per promotion.

### Living Notebook-City (semantic-living-workspace)

The semantic layer behaves like a continuously inhabited graph: humans
annotate, agents inline-prompt, threads spawn from nodes, and pages
accumulate marginalia. Nothing is "finished." Promotion is social, not
ceremonial. This maps closely to the vault-candidate
**Vault Cognitive Layer** and **Brain Dump** intake surface.

- **What this would force you to build first:** a CRDT or hybrid sync
  substrate (Q8) so simultaneous edits don't collide; an
  inline-prompting model where an agent op is a proposal referencing
  `object_id + range` (per `graph/edges/collab.md`); a
  Brain-Dump-style capture inbox per Space.
- **What this would force you to give up:** confidence that any given
  page reflects a decision; the ability to cite a node as authoritative
  without a freshness check.
- **Smallest provable slice:** in two weeks, ship one Space's wiki
  with live multi-cursor editing (Yjs as the lift), an "ask the agent
  about this selection" inline-prompt that creates a control-plane
  proposal, and a daily "what got promoted" digest emitted from the
  daemon.

### Federated Memory Substrate (semantic-mesh-commonwealth)

The semantic layer becomes a substrate that spans Orgs, Spaces, peers,
and long-running agent work. A node can be local to one Project, mirrored
into a Space, or published to a peer Org. **Distributed AI Delegation**
(vault-candidate term) becomes relevant: a peer's semantic layer can be
queried under capability lease.

- **What this would force you to build first:** Q1 and Q9 settled
  enough to name what replicates; per-node visibility scopes that align
  with Org/Space identity; an MCP-style outbound boundary —
  vault-candidate **MCP Gateway** is the obvious shape — so peer agents
  can query without raw read access.
- **What this would force you to give up:** the simplicity of "the wiki
  is one place"; any hope of a single search index without explicit
  federation.
- **Smallest provable slice:** in two weeks, ship two daemons that each
  hold a local semantic layer, an authority-leased read of a single
  node-type from peer A to peer B via the MCP Gateway shape, and a
  visible provenance pill on every cross-peer node.

## Decision pressure

1. **Schema-first vs capture-first** — Schema-first costs velocity at
   intake; capture-first costs coherence forever after.
2. **Index reality vs author reality** — Indexing keeps the layer honest
   but inert; authoring makes it operational but contestable.
3. **One graph vs per-Space graphs** — One graph is searchable; per-Space
   graphs are governable.
4. **Embed inside daemon vs adopt Superman** — Embedding inside keeps
   ownership; adopting an external semantic infra ships sooner but
   couples the roadmap.
5. **CRDT for nodes vs event-log only** — CRDT enables real-time co-edit
   but multiplies merge edge cases; event-log keeps audit but kills
   simultaneous editing.
6. **Open promotion vs gated promotion** — Open promotion produces
   energy; gated promotion produces trust.

## Read next

- `lib/ema-atlas.ts` — `parts[]` entry `slug: "semantic-layer"`,
  visions `semantic-operator-cathedral`, `semantic-living-workspace`,
  `semantic-mesh-commonwealth`.
- `graph/edges/memory.md`
- `graph/edges/collab.md`
- `docs-ema-next-steps/.../ULTIMATE-WIKI-ARCHITECTURE.qmd`
- `docs-ema-next-steps/.../OPENCLAW-KNOWLEDGE-INGEST-PLAN.qmd`
- `docs-host-obsidian-vault/.../Vault-Cognitive-Layer.md`
- `docs-host-obsidian-vault/.../Intelligence-Integrations/superman-architecture.md`
- `OPEN_QUESTIONS.md` Q2, Q8
- `codebase-ema/code/ema/daemon/lib/ema/second_brain/indexer.ex`

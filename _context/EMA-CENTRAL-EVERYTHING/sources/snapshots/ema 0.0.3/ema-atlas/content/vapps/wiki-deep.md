# Wiki — deep brief

> Sibling to `content/vapps/wiki.md`. The 300-500 word brief is the
> stance summary; this file is the next layer of pressure.

## Stance

The Wiki is the **collaboration-plane** vApp in EMA's seven-layer stack
(`ARCHITECTURE.md` — *Surfaces · Collaboration plane · Shared workspace ·
Control plane · Hermes drivers · Runtimes/peers/tools/models*). It sits
in the Collaboration plane row, marked in `ARCHITECTURE.md` as "P9:
adjacent to control" and "Substrate TBD — Q2/Q8". That placement is
load-bearing: the Wiki is *not* a control-plane authority and *not* a
shared-workspace artifact store. It is a live, multi-cursor surface
whose underlying objects (nodes, edges, inline-prompt threads) require
either CRDT semantics or a per-object event log — neither of which fits
the append-only `event_log` shape of the control plane (P9,
`DESIGN_PRINCIPLES.md`).

Under the canonical rule — *EMA owns truth. Hermes owns execution.
Surfaces do not own state.* — the Wiki occupies the most ambiguous
position in the stack. Its objects feel like truth (they are durable,
addressable, citable) but they are not control-plane records. The
working frame from `research/parts/semantic-layer.md` and
`content/briefs/semantic-layer.md`: the semantic layer **indexes** what
the control plane records, while the Wiki **renders and proposes**
edits to that semantic substrate. A wiki node can be promoted to a
control-plane proposal (via `command_bus.Append` per
`research/parts/semantic-layer.md`), but the node itself is not a
proposal until that promotion fires.

The Wiki is also where two vault-candidate concepts collide. **Vault
Cognitive Layer** (metabolism + graph + cognition,
`GLOSSARY.md`) wants the wiki to be an active participant —
contradiction detection, gap surfacing, activation decay. **Superman
(Semantic Layer)** wants the wiki to be a fingerprinted index that
powers `context_for/2`. Both can be true; the Wiki vApp is the surface
those two systems render through. Whether either is adopted is a
direct function of Q2/Q8 and a separate decision about whether
Superman becomes canonical or is rebuilt inline (`semantic-layer.md`,
"Embed inside daemon vs adopt Superman").

The vApp explicitly refuses to become the source of truth for the
collaboration objects it renders. Per `howto/add-a-vapp.md` step 2
("State ownership must be unambiguous — the vApp does not own state"),
every Wiki mutation must traverse `collab_plane.propose_edit/2` (per
existing `content/vapps/wiki.md`) and be reconciled by the collab
supervisor sketched in `ARCHITECTURE.md` under `collab/supervisor (NEW
— substrate TBD)`. There is no `Repo.insert` permitted in any Wiki
surface module.

## Object model

Objects the Wiki renders (none owned canonically — all references
trace to plane owners):

- **Wiki Node** — typed page (`Concept | Decision | OpenQuestion |
  Proposal | Component | Rule | Doctrine | Reference | WikiPage |
  Blueprint`, per `research/parts/semantic-layer.md` `NodeKind`). Lives
  on the **Collab plane** (body) with a **Control plane** record for
  promotion lineage. Visibility scoped via
  `Visibility.{ProjectScoped|SpaceScoped|OrgWide|Public}`.
- **Edge** — typed relation (`References | Refines | Contradicts |
  Implements | DerivedFrom | PromotedFrom`, per
  `semantic-layer.md`). Lives on the Collab plane; emits a
  `WikiEdgeAdded` projection event for the Vault Cognitive Layer.
- **Inline Comment** — selection-anchored prose. Collab plane only.
- **Inline Prompt Thread** — selection-anchored agent invocation that
  bidirectionally links to a Chat session (per existing
  `content/vapps/wiki.md`). The prompt itself becomes a
  `Proposal{intent, project_id, member_id}` per `ARCHITECTURE.md`
  ("send user intent back as Proposal"). The resulting Chat session
  lives on the Runtime plane (Hermes Subject); only the *link* lives
  in the Wiki.
- **Backlink** — derived projection from the semantic indexer
  (`semantic/indexer` `Subject(IndexerMsg)` per
  `research/parts/semantic-layer.md`). Read-only.
- **Presence pill** — ephemeral, lives nowhere durable; rendered from
  `ws_hub` subscriptions (per `research/parts/shells-surfaces.md`).
- **Promotion record** — when a node moves
  `Draft → InReview → Canonical` (per `Promotion` type in
  `semantic-layer.md`), an event lands on the **Control plane** via
  the `semantic/promotion` actor.

Objects the Wiki does *not* render: dispatches, executions, sessions,
lanes, handoffs, tasks. Those belong to other vApps (Chat, Agent vEnv,
Threads). A wiki node *about* a dispatch is fine; the dispatch record
stays in `event_log`.

## Three futures (deepening the universal stances)

### Operator Cathedral — *Disciplined Reference System*

The Wiki is a tightly governed reference system. Every node has a
canonical type from a fixed schema (the eight `NodeKind` values in
`semantic-layer.md`), every edge is one of six `Relation` values,
promotion from `Draft → Canonical` is gated and event-logged. Inline
prompts are first-class typed proposals, not free-form chat.

- **Bet:** that EMA's value comes from being citable. A wiki node you
  can point at and trust is worth more than a wiki node anyone can
  scribble on.
- **Tension:** the schema is the bottleneck. Casual capture velocity
  collapses under `Promotion.{Draft|InReview|Canonical|Deprecated}`
  ceremony. Agents must know the schema before they can write.
- **Question:** does promotion gating produce trust, or just produce
  the appearance of trust by suppressing dissent? See
  `content/briefs/semantic-layer.md` decision pressure #6 ("Open
  promotion vs gated promotion").

### Living Workspace — *Notebook-City*

The Wiki is a continuously inhabited graph. Multi-cursor edits via Yjs
or Automerge (Q8). Inline prompts are conversational and create proposals
as a side effect, not as an imposed gate. Brain Dump (vault candidate,
`GLOSSARY.md`) is the per-Space intake surface that auto-classifies into
nodes. The Vault Cognitive Layer runs activation decay across the graph
so stale nodes fade visibly.

- **Bet:** that energy beats discipline at the substrate layer. A graph
  where edits feel cheap is a graph where edits *happen*.
- **Tension:** "what is the current decision" becomes a freshness
  query, not a lookup. Citing a node requires a snapshot hash. Q8
  decides the pain shape: Yjs gives sidecar FFI complexity; pure-BEAM
  CRDT gives implementation cost.
- **Question:** when an agent edits a node mid-conversation, is that an
  edit by the agent (Q1: agent identity) or a proposal-by-proxy
  attributed to the human? `research/parts/semantic-layer.md` Q1 note:
  "without Q1, every agent inline-prompt lands as a human-attributed
  edit and the 'what did the AI add' view is wrong."

### Mesh Commonwealth — *Federated Memory Substrate*

The Wiki spans Orgs, Spaces, and peers. A node can be `ProjectScoped`,
`SpaceScoped`, `OrgWide`, or `Public`. Cross-peer reads go through the
**MCP Gateway** (vault candidate); cross-peer writes are leased.
**Distributed AI Delegation** lets a peer's wiki feed your agent's
context window without exposing raw read access.

- **Bet:** that knowledge wants to flow across boundaries, and EMA
  earns its keep by making federation safe.
- **Tension:** every cross-peer read needs a permission story
  (Q10). Every replication choice needs Q9 settled. The "one search
  index" intuition dies; every query becomes a federation query.
- **Question:** if peer A's wiki node contradicts peer B's, who
  resolves? The Vault Cognitive Layer's contradiction detection is
  defined per-graph; cross-graph contradiction is undefined territory.

## What humans do here

1. **Create a wiki node.** Artifact: a new `Node` on the Collab plane
   with `Promotion = Draft`. Control-plane record:
   `WikiNodeCreated{node_id, project_id, author, kind}` (per existing
   `content/vapps/wiki.md` chronicle section). Presupposes Q2 (where
   the body lives) and Q1 (whether agents can be set as `author`).
2. **Edit a node.** Artifact: revised `Node.body` (string or CRDT
   handle, depending on Q8). Control-plane record: `WikiEdit{node_id,
   author, prior_hash, semantic_reindex_hint}` (per `wiki.md`).
   Presupposes Q8 (CRDT vs string) and Q2.
3. **Drop an inline comment.** Artifact: a `Comment{node_id, range,
   body}` on the Collab plane. No control-plane record. Presupposes Q2
   only.
4. **Drop an inline prompt on a selection.** Artifact: a `PromptThread`
   linked to a new Chat session. Control-plane record:
   `Proposal{intent: "wiki.inline_prompt", project_id, member_id,
   selection_ref}` per `ARCHITECTURE.md`. Presupposes Q1 (so the
   agent's reply can be attributed) and Q2.
5. **Promote a comment thread to a workspace artifact.** Artifact: a
   shared-workspace file under `workspace/shared/notes/` (per P3,
   `DESIGN_PRINCIPLES.md`). Control-plane record:
   `WorkspacePromotion{from_thread_id, to_artifact_path}`. Presupposes
   Q3 (Project ↔ Space cardinality decides the workspace root path).
6. **Resolve a `Contradicts` edge.** Artifact: edited node body on one
   or both sides plus an edge state change. Control-plane record:
   `ContradictionResolved{edge_id, by, method}`. Presupposes Q2 and
   the Vault Cognitive Layer's contradiction-detection contract.
7. **Open a node in Blueprint.** Artifact: none new — a render in the
   Blueprint vApp. No control-plane record. Presupposes a Blueprint
   vApp exists (currently in `content/vapps/blueprint.md`, separate
   brief).

## What agents do here via CLI

Parity with the human surface is required (`howto/add-a-vapp.md`
verification: "every action a human can take in the UI has a CLI path
documented").

1. **`ema wiki node create --title --type --space`** (existing
   `wiki.md`). Same artifact + control-plane record as human #1.
   Vault-candidate term that applies: **Brain Dump** if the agent is
   capturing raw thoughts before classification; **Auto-Resolve Gate**
   does *not* apply here (creation is not a queue item).
2. **`ema wiki node edit <id> --patch <file>`** (existing). Same as
   human #2. The **Auto-Resolve Gate** (vault candidate, confidence ≥
   0.85 plus vault precedent + preferences + corrections, `GLOSSARY.md`)
   applies if the edit was triggered by a queue item — the agent can
   resolve silently rather than escalate.
3. **`ema wiki edge add <from> <to> --kind`** (existing). Edge
   relation must be one of the six `Relation` values. The
   **Handoff Envelope** (vault candidate) does not apply directly here
   but does apply if the edge add is the closing act of an agent-to-agent
   handoff carrying the wiki context.
4. **`ema wiki prompt <node> --selection --prompt`** (existing). Emits
   the `Proposal` per human #4. The **Background Results Contract**
   (vault candidate, XML `<background-results>` wrapper, `GLOSSARY.md`)
   applies if the prompt is dispatched async — the result re-enters
   the originating session via that wrapper.
5. **`ema wiki search --query --space`** (existing). Calls
   `semantic/indexer.Search` per `research/parts/semantic-layer.md`.
   No artifact, no control-plane record (read-only).
   The **Scope Advisor** (vault candidate) may pre-filter the query
   based on Honcho-modeled context before dispatch.
6. **`ema wiki node promote <id> --to canonical`** (extension over
   existing CLI). Calls `semantic/promotion.Approve` per
   `research/parts/semantic-layer.md`, which emits an event-log entry
   shaped like `EventBody.ProposalProposed`. Presupposes Q1 (so the
   `by: Actor` field is meaningful).
7. **`ema wiki contradiction surface --space`** (extension). Reads the
   Vault Cognitive Layer's contradiction detector and lists open
   `Contradicts` edges. Vault-candidate term **Vault Cognitive Layer**
   applies directly; this CLI is the operator-side observation hook.

## Smallest provable v0.0.3 slice

**Scope:** read-only wiki renderer over a single Project's collab
substrate, plus inline-prompt-as-proposal, plus one promotion path.

**2-week acceptance criteria:**

1. A `WikiNode` type exists in the Gleam tree with the eight
   `NodeKind` values from `research/parts/semantic-layer.md`.
2. `semantic/graph_store` actor (`Subject(GraphStoreMsg)`) handles
   `Upsert` and `Get` for one project; `semantic/indexer` runs an FTS5
   round-trip via `sqlight` (per `semantic-layer.md` test list).
3. The Wiki vApp renders a list of nodes for `project_id = X` via a
   typed projection from `event_log` — surface code contains no
   `event_log.append` and no in-memory node store (the
   `http/supervisor` "endpoint-last" assertion from
   `research/parts/shells-surfaces.md` test list applies).
4. An inline-prompt action posts a `Proposal{intent:
   "wiki.inline_prompt"}` through the `command_bus`; the resulting
   Chat session id appears as a backlink on the node within one tick.
5. `ema wiki node promote <id> --to canonical` fires
   `semantic/promotion.Approve`, which emits an `event_log` entry; the
   Wiki vApp re-renders with `Promotion = Canonical` on next
   projection refresh.
6. Property test: visibility filter — a `context_for` request from an
   actor in `ProjectId(A)` does not return nodes whose `Visibility =
   ProjectScoped(B)` (test from `research/parts/semantic-layer.md`).

**Build-step dependencies:**

- `research/build-steps/01-control-plane-skeleton.md` — `event_log`,
  `command_bus`, `replay`. Required for the `Proposal` and promotion
  events.
- `research/build-steps/02-identity-registry-skeleton.md` — `Actor`
  type, `Visibility` resolution, `context_for(project, actor)`.
  Required for visibility filtering and node authorship.
- `research/build-steps/05-collab-substrate-skeleton.md` — per-object
  event log adjacent to control plane. Required for `WikiNode.body`
  storage without committing to Q2/Q8.
- `research/build-steps/06-surfaces-skeleton.md` — mist + wisp HTTP/WS
  with typed projections. Required for the renderer.

**Explicitly deferred:** multi-cursor live editing (Q8 unresolved), the
Vault Cognitive Layer (contradiction detection, activation decay),
Superman embedding tier (decision pressure #4 in
`semantic-layer.md`), cross-peer wiki federation (Q9), Blueprint vApp
integration.

## Decision pressure unique to this vApp

1. **Schema-first vs capture-first node creation.** Per
   `content/briefs/semantic-layer.md` decision pressure #1.
   Schema-first matches the eight `NodeKind` values cleanly but kills
   intake velocity; capture-first needs a Brain Dump intake surface
   and an auto-classifier (vault candidate term, currently
   unimplemented).
2. **Inline prompts as Chat sessions vs as in-Wiki agent turns.**
   Existing `wiki.md` says "Inline-prompt threads link bidirectionally
   to their session in Chat" — but is the prompt a *Chat session
   rendered in the Wiki* or a *Wiki-native conversation that emits a
   Chat record*? The first keeps Chat as the only conversation
   surface; the second creates a second conversation surface.
3. **CRDT body vs event-log body for `Node.body`.** Per
   `research/parts/semantic-layer.md` Q8 note. CRDT enables
   simultaneous editing and forces FFI to a Yjs sidecar (or pure-BEAM
   CRDT cost). Event-log keeps audit and forces serialized edit
   semantics (no real multi-cursor).
4. **Promotion as gate vs promotion as ritual.** Gate: `InReview`
   blocks rendering as canonical until `Approve`. Ritual: promotion is
   a label change with no enforcement, the Vault Cognitive Layer
   surfaces unpromoted nodes for cleanup.
5. **One graph per Project vs one graph spanning Spaces.** Depends on
   Q3. One-per-Project means `LaneId`-style scoping and clean
   federation later; spanning means `Visibility.SpaceScoped` is the
   primary scope and `ProjectId` becomes a tag.
6. **Backlinks computed live vs stored.** Live: every render runs
   `Neighbours(id)` against `graph_store`; cheap to write, expensive
   to read at scale. Stored: maintained by the indexer on every
   `Upsert`; cheap to read, denormalization debt to maintain.
7. **Adopt Superman vs build inline.** Per `semantic-layer.md`
   decision pressure #4. Superman as separate BEAM service means
   `:gen_server.call` FFI; inline means `semantic/indexer` grows the
   embedding pipeline.

## Cross-references

- `content/vapps/wiki.md` — the 300-500 word stance (sibling, do not
  modify)
- `ARCHITECTURE.md` — seven-layer stack, `collab/supervisor (NEW —
  substrate TBD)`, `Node`/`Edge` plane assignment table
- `DESIGN_PRINCIPLES.md` — P1 (authority before surface), P3
  (workspace state durable), P9 (collab adjacent to control), P10
  (org/space first-class)
- `howto/add-a-vapp.md` — pressure-check, "vApp does not own state"
- `research/parts/semantic-layer.md` — `NodeKind`, `Relation`,
  `Visibility`, `Promotion`, `context_for/2`, actor sketches, test
  list, Q1/Q2/Q3/Q8/Q9 mapping
- `content/briefs/semantic-layer.md` — three futures expanded, decision
  pressure list #1–#6
- `research/build-steps/01-control-plane-skeleton.md`
- `research/build-steps/02-identity-registry-skeleton.md`
- `research/build-steps/05-collab-substrate-skeleton.md`
- `research/build-steps/06-surfaces-skeleton.md`
- `GLOSSARY.md` — Brain Dump, Vault Cognitive Layer, Superman,
  Intelligence Layer, MCP Gateway, Distributed AI Delegation,
  Auto-Resolve Gate, Background Results Contract, Scope Advisor
- `OPEN_QUESTIONS.md` — Q1, Q2, Q3, Q8, Q9, Q10

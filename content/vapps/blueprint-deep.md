# Blueprint — deep brief

> Sibling to `content/vapps/blueprint.md`. The 300-500 word brief is
> the stance summary; this file is the next layer of pressure.

## Stance

Blueprint is the **structuring** vApp in EMA's seven-layer stack
(`ARCHITECTURE.md` — *Surfaces · Collaboration plane · Shared
workspace · Control plane · Hermes drivers · Runtimes/peers/tools/
models*). It sits in the Surfaces row and renders against the
Collaboration plane row marked "P9: adjacent to control" and
"Substrate TBD — Q2/Q8". Blueprint is a *specialization* of the Wiki
vApp — it renders the same `Node`/`Edge` substrate documented in
`research/parts/semantic-layer.md`, but only for the subgraph whose
nodes carry the `Blueprint` `NodeKind` (or whose role tags say
`concept | intent | question | decision | dependency`, per existing
`content/vapps/blueprint.md`). It is the canvas-and-topology view of
the same graph the Wiki shows as prose.

Under the canonical rule — *EMA owns truth. Hermes owns execution.
Surfaces do not own state.* — Blueprint is the surface where the
Karpathy-style framing of "draw the project's shape" runs head-on into
the architectural insistence that nothing here is canonically owned.
The blueprint canvas *feels* like a workspace artifact (a single named
diagram you save), but every node and edge it draws is a Collab-plane
object addressable from elsewhere. A blueprint is therefore a
**typed projection over the wiki graph**, not a private document. Two
people opening the same blueprint by id see the same nodes because the
nodes are the wiki, not the canvas.

Blueprint is also the system's primary **intent-capture** surface. Per
`05-fresh-context-project-app-model.md` §5, Blueprint "should integrate
tightly with wiki system, Karpathy-style knowledge structuring, and
intent capture" — and "intent" is a load-bearing word. An intent
captured on a blueprint is the upstream of a `Proposal{intent,
project_id, member_id}` (`ARCHITECTURE.md`, "Surfaces send user intent
back as `Proposal`"). Blueprint is therefore the surface where the
seam between *thinking* (collab-plane editing) and *acting*
(control-plane proposals) is most visible. Inline prompts on a
blueprint node use the same Wiki mechanic — they create a
`Proposal{intent: "blueprint.inline_prompt"}` and link to a Chat
session.

The vApp's tightest coupling is to the Wiki vApp and to the
vault-candidate **Vault Cognitive Layer** (`GLOSSARY.md` —
"three-subsystem layer (metabolism = activation decay, graph = typed
edges, cognition = injection/contradiction/gap detection)"). The
Cognitive Layer's "gap detection" subsystem is the natural source for
Blueprint's open-question pins (where is the team thinking hardest,
which edges are missing). Whether that subsystem ships at v0.0.3 is
deferred per the existing `blueprint.md` ("**After v0.0.3.**
Blueprint depends on the Wiki, which depends on the collab plane.").

## Object model

Objects Blueprint renders (none owned canonically — all references
trace to plane owners):

- **Blueprint** — a named, addressable subgraph of the wiki carrying
  the `Blueprint` `NodeKind` (per `research/parts/semantic-layer.md`)
  as its anchor node. Lives on the **Collab plane**. Has a stable
  `NodeId` and a `Visibility` per `semantic-layer.md`
  (`ProjectScoped | SpaceScoped | OrgWide | Public`).
- **Blueprint Node** — a typed wiki `Node` with a `role` tag
  (`concept | intent | question | decision | dependency`, per existing
  `content/vapps/blueprint.md`). The `role` is not a separate
  taxonomy; it is a constrained subset of `NodeKind`:
  `concept → Concept`, `intent → Proposal`, `question → OpenQuestion`,
  `decision → Decision`, `dependency → Component`. Lives on the
  Collab plane.
- **Blueprint Edge** — a typed wiki `Edge` (per `Relation` in
  `semantic-layer.md`: `References | Refines | Contradicts |
  Implements | DerivedFrom | PromotedFrom`). Blueprint adds two view
  filters — `prerequisite` (renders `DerivedFrom` reversed) and
  `blocks` (renders `Contradicts` between an `intent` and a
  `dependency`). View-only; the underlying edge is one of the six
  canonical `Relation` values. Lives on the Collab plane.
- **Intent stack** — a derived projection of the blueprint's
  `intent`-role nodes ordered by recency; pure view, no state.
- **Open-question pin** — a `Node` of `kind = OpenQuestion`
  cross-linked to `OPEN_QUESTIONS.md` Q-id by a `References` edge.
  Lives on the Collab plane; the Q-id is a string in `Node.body`
  metadata.
- **Build-order projection** — a topological sort of the blueprint's
  `dependency` nodes derived live by walking `graph_store.Neighbours`.
  Read-only; rendered as an exportable plan.
- **Promotion record** — when a blueprint subgraph is promoted to
  wiki-canonical, an event lands on the **Control plane** as a
  `BlueprintPromotion{blueprint_id, by, at_ms}` (per existing
  `blueprint.md` chronicle list). The wiki nodes themselves move
  `Draft → Canonical` per `Promotion` in `semantic-layer.md`.
- **Plan export** — a workspace artifact emitted at
  `workspace/shared/plans/<blueprint_id>.md` (per P3,
  `DESIGN_PRINCIPLES.md`). Lives on the **Workspace plane**.

Objects Blueprint does *not* render: chat sessions, dispatches,
executions, calendar events, queue items, threads. A blueprint can
*reference* a session id or a dispatch id (via a `References` edge to
a `Reference` node), but it does not render those records natively.

## Three futures (deepening the universal stances)

### Operator Cathedral — *Disciplined Diagram-of-Record*

Blueprint is a precision instrument for project shape. Every node has
one of five fixed roles, every edge is one of six `Relation` values,
and every blueprint has a versioned promotion lineage. The Cognitive
Layer's gap detector is mandatory: a blueprint with unresolved open
questions cannot be exported as a plan. Build-order projections are
deterministic; an agent reading the export sees the same dependency
order a human does.

- **Bet:** that a project's value compounds when its shape is
  citable. A blueprint you can point at and replay is worth more than
  one anyone can rearrange.
- **Tension:** the schema discipline kills exploratory drawing. A
  user who wants to "just sketch" runs into the role taxonomy on
  every node-add. Q2/Q8 must be settled enough to support a
  promotion-gated CRDT story.
- **Question:** does the role taxonomy reflect how teams actually
  decompose intent, or does it reflect how this lineage decomposes
  it? `05-fresh-context-project-app-model.md` §5 names "Karpathy-style
  knowledge structuring" without committing to a schema; the
  cathedral commits the schema in v0.0.3.

### Living Workspace — *Whiteboard-City*

Blueprint is an inhabited canvas. Multiple cursors, agents drawing
edges, intents captured as raw text and auto-classified by a
**Brain Dump** (`GLOSSARY.md` vault candidate) intake into the
appropriate role. The Cognitive Layer's metabolism subsystem fades
stale subgraphs visibly. Inline prompts spawn Chat sessions
sidecar-style. Promotion is social — a blueprint becomes "the"
blueprint because people stop editing it, not because someone hit
Approve.

- **Bet:** that energy beats discipline at the structuring layer.
  People draw when drawing is cheap; people stop drawing when the
  schema is the gate.
- **Tension:** "what is the current decomposition" becomes a
  freshness query, not a lookup. Two blueprints disagreeing about a
  single intent's dependencies is a real state, not a bug. Q1
  matters: an agent's drawn edge needs attribution that distinguishes
  it from a human's.
- **Question:** when a blueprint and a wiki page contradict each
  other on the same `Concept` node, which view is canonical? The
  `Contradicts` `Relation` lives on the underlying graph, not on the
  view; the contradiction is real either way.

### Mesh Commonwealth — *Federated Project-Shape Substrate*

Blueprints span peers. A blueprint can be `OrgWide` or `Public`; a
peer can subscribe to read a blueprint via the **MCP Gateway** (vault
candidate, `GLOSSARY.md`) without raw graph access. **Distributed AI
Delegation** lets a peer's agent reason over your blueprint as
context. Build-order projections become cross-peer plans.

- **Bet:** that project shape is the most natural cross-peer
  collaboration object — looser than code, tighter than chat.
- **Tension:** every cross-peer node needs Q9 settled (replication
  boundary) and Q10 settled (permission policy). A peer's read of
  your blueprint is one MCP call away from a leak.
- **Question:** if peer A's blueprint imports peer B's `Concept`
  node, who owns the `Refines` edge that A draws on top? The collab
  plane has no story for cross-peer edge ownership today.

## What humans do here

1. **Create a blueprint.** Artifact: a new wiki `Node` of
   `kind = Blueprint` with a name and a `Visibility`. Control-plane
   record: none directly (collab-plane object). The implicit chain:
   the `Upsert` flows through `semantic/graph_store.Upsert` per
   `research/parts/semantic-layer.md`. Presupposes Q2 (where collab
   state lives) and Q3 (Project ↔ Space cardinality decides
   `Visibility` resolution).
2. **Drag a concept onto the canvas.** Artifact: a new
   `Node{kind: Concept}` with a `role: concept` tag and an edge to
   the blueprint anchor node. Control-plane record: none direct;
   `Upsert` and `Connect` on the graph store. Presupposes Q2.
3. **Draw a `prerequisite` edge.** Artifact: an `Edge{relation:
   DerivedFrom}` (the view inverts it). Control-plane record: none
   direct. Presupposes Q2.
4. **Capture a raw intent.** Artifact: a `Node{kind: Proposal,
   role: intent}` plus an edge to the blueprint. Control-plane
   record: when promoted, a `Proposal{intent, project_id, member_id,
   blueprint_id}` per `ARCHITECTURE.md`. Presupposes Q1 (so an
   agent-drawn intent can be attributed) and Q2.
5. **Pin an open question to a node or edge.** Artifact: a
   `Node{kind: OpenQuestion}` with `Node.body` carrying the Q-id
   string and a `References` edge to the pinned node. Control-plane
   record: none direct. The cross-link to `OPEN_QUESTIONS.md` is a
   convention, not a typed reference. Presupposes Q2.
6. **Drop an inline prompt on a blueprint node.** Artifact: a
   `PromptThread` (per the Wiki vApp) linked to a new Chat session.
   Control-plane record: `Proposal{intent: "blueprint.inline_prompt",
   project_id, member_id, node_id}`. Presupposes Q1, Q2.
7. **Promote a blueprint subgraph to wiki-canonical.** Artifact:
   nodes in the subgraph move `Draft → Canonical` per `Promotion` in
   `semantic-layer.md`. Control-plane record: `BlueprintPromotion{
   blueprint_id, subgraph_node_ids, by, at_ms}` (per existing
   `blueprint.md` chronicle).
8. **Export a build-order projection.** Artifact: a workspace file
   under `workspace/shared/plans/<blueprint_id>.md` (P3). Control-plane
   record: `PlanExported{blueprint_id, artifact_path, by}`.
   Presupposes Q3 for path resolution.

## What agents do here via CLI

Parity with the human surface is required (`howto/add-a-vapp.md`
verification: "every action a human can take in the UI has a CLI path
documented").

1. **`ema blueprint create --space --title`** (existing
   `blueprint.md`). Same artifact as human #1. Vault-candidate term
   that applies: **Brain Dump** if the agent is dumping raw thoughts
   and a downstream classifier turns them into roles; **Scope
   Advisor** (`GLOSSARY.md`) if the agent queries Honcho before
   choosing the blueprint's `Visibility`.
2. **`ema blueprint node add --kind --label --parent`** (existing).
   Same as human #2/#3/#4 depending on `--kind`. The
   **Auto-Resolve Gate** (vault candidate, confidence ≥ 0.85,
   `GLOSSARY.md`) applies if the node-add is the agent's resolution
   of a queue item — passing the gate means no human approval is
   required for the draft node.
3. **`ema blueprint edge add --from --to --kind`** (existing).
   `--kind` must be one of the six `Relation` values from
   `semantic-layer.md`. The view-side names (`prerequisite`,
   `blocks`) are not first-class; the CLI accepts only canonical
   relations.
4. **`ema blueprint pin-question <node> --question-id`** (existing).
   Adds an `OpenQuestion`-kind node with the Q-id in `Node.body`.
   No control-plane record. The **Vault Cognitive Layer** (vault
   candidate) reads pinned-question density per blueprint as a
   "where is the team thinking hardest" signal — if adopted.
5. **`ema blueprint export-plan <id> --to workspace`** (existing).
   Same artifact as human #8. The export path resolves through the
   `Project.workspace_root` per `ARCHITECTURE.md`. The
   **Handoff Envelope** (vault candidate) wraps the plan if the
   export is the closing act of an agent-to-agent handoff.
6. **`ema blueprint promote <id> --subgraph <node_ids>`**
   (extension over existing CLI). Calls
   `semantic/promotion.Approve` per `research/parts/semantic-layer.md`
   on each subgraph node. Emits `BlueprintPromotion` to `event_log`.
   Presupposes Q1 (so `by: Actor` is meaningful).
7. **`ema blueprint inline-prompt <node> --prompt`** (extension).
   Emits the `Proposal` per human #6. The
   **Background Results Contract** (`GLOSSARY.md` vault candidate)
   applies if the prompt is dispatched async and its outcome
   re-enters the originating session via the XML wrapper.
8. **`ema blueprint diff <id> --since <ts>`** (extension). Read-only
   subscriber to the blueprint's slice of the graph since `ts`. Useful
   for an agent observing structure drift without subscribing to the
   full collab firehose.

## Smallest provable v0.0.3 slice

**Scope:** a read-mostly blueprint renderer over the existing
`/futures-board` route (per existing `blueprint.md` — "the existing
`/futures-board` route — a static three-futures-per-question grid is
already a degenerate blueprint"), backed by typed `Node`/`Edge`
records, with one inline-prompt-as-proposal path. Per
`blueprint.md`, Blueprint is **after v0.0.3** as a full vApp; this
slice is the v0.0.3-shaped *shadow* of it that proves the canonical
rule end-to-end on the structuring surface.

**2-week acceptance criteria:**

1. A `Blueprint` `NodeKind` value exists in the Gleam tree alongside
   the eight already-defined values in
   `research/parts/semantic-layer.md`.
2. `semantic/graph_store` (`Subject(GraphStoreMsg)`, per
   `semantic-layer.md`) handles `Upsert` and `Neighbours` for
   blueprint-tagged nodes; the existing FTS5 round-trip via
   `sqlight` covers blueprint search at no extra cost.
3. The Blueprint vApp renders one project's blueprints by reading a
   typed projection over `event_log` filtered by
   `kind = Blueprint`. Surface code contains no `event_log.append`
   and no in-memory canvas store (per the
   `http/supervisor` "endpoint-last" assertion in
   `research/parts/shells-surfaces.md` test list).
4. An inline-prompt action posts a `Proposal{intent:
   "blueprint.inline_prompt"}` through the `command_bus`; the
   resulting Chat session id appears as a backlink on the blueprint
   node within one tick.
5. A `prerequisite` view filter renders `DerivedFrom` edges inverted
   without mutating the underlying edge. Property test:
   `view.render(edges) ≠ store.read(edges)` is allowed; the canonical
   relation in `event_log` is unchanged.
6. `ema blueprint export-plan <id> --to workspace` writes a file
   under `workspace/shared/plans/`, emits `PlanExported` to
   `event_log`, and the file's contents reproduce a topological sort
   of the blueprint's dependency nodes.
7. Visibility filter (test reused from `semantic-layer.md`): a
   `context_for` request from an actor in `ProjectId(A)` does not
   return blueprint nodes whose `Visibility = ProjectScoped(B)`.

**Build-step dependencies:**

- `research/build-steps/01-control-plane-skeleton.md` — `event_log`,
  `command_bus`, `replay`. Required for the `Proposal`,
  `BlueprintPromotion`, and `PlanExported` events.
- `research/build-steps/02-identity-registry-skeleton.md` — `Actor`,
  `Visibility` resolution, `context_for(project, actor)`. Required
  for visibility filtering and node authorship.
- `research/build-steps/05-collab-substrate-skeleton.md` —
  per-object event log adjacent to control plane. Required for
  `Node.body` and `Edge` storage without committing to Q2/Q8.
- `research/build-steps/06-surfaces-skeleton.md` — mist + wisp
  HTTP/WS with typed projections. Required for the canvas renderer.

**Explicitly deferred:** multi-cursor live drawing (Q8 unresolved),
Vault Cognitive Layer gap detection, Brain Dump auto-classification,
cross-peer blueprint federation (Q9), the full canvas UX (drag,
snap, autolayout), and the Karpathy-style intent decomposition
prompt-chain.

## Decision pressure unique to this surface

1. **Blueprint as wiki view vs blueprint as separate substrate.**
   View: every node and edge is a wiki object; Blueprint is pure
   rendering plus role tags. Substrate: blueprint nodes have
   blueprint-only fields (geometry, layer, lock state) that the wiki
   doesn't model. View keeps the canonical rule clean; substrate
   tempts a second collab-object type. `content/briefs/semantic-layer.md`
   decision pressure #2 ("Index reality vs author reality") applies
   here in the inverse: does Blueprint *render* the wiki or
   *author* a parallel structure?
2. **Role taxonomy fixed vs extensible.** Fixed: five roles from
   existing `blueprint.md` (`concept | intent | question | decision |
   dependency`). Extensible: per-project role sets, with the wiki's
   eight `NodeKind` values as the underlying constraint. Fixed is
   easier to render and reason about; extensible matches how teams
   actually decompose work.
3. **`prerequisite` and `blocks` as view filters vs new
   `Relation` values.** View filters keep the six-relation closure
   from `semantic-layer.md`. New values force a `Relation` schema
   change and ripple through every caller of `Neighbours`.
4. **Promotion as subgraph-atomic vs node-by-node.** Atomic: a
   `BlueprintPromotion` event moves N nodes Draft→Canonical in one
   record; if any fail, none promote. Node-by-node: each node fires
   its own `semantic/promotion.Approve`; partial promotion is a
   visible state. Atomic matches plan semantics; node-by-node matches
   how `semantic-layer.md` already models promotion.
5. **Build-order export as live projection vs frozen snapshot.**
   Live: every export call walks the current graph; the file is a
   snapshot of "now". Frozen: the export captures the dependency
   tree's hash and the file is immutable until re-exported. Live
   matches P3 (workspace artifacts are durable but the source is
   live); frozen matches reproducible-plan semantics.
6. **Open-question pin as `OpenQuestion` node vs dedicated
   `Pin` object.** Node: pins are first-class wiki objects with
   their own promotion lineage. Pin: pins are pure annotations on
   the blueprint canvas, with no separate identity. Node matches the
   "everything is a wiki object" stance; Pin matches how teams use
   sticky notes.
7. **Karpathy-style decomposition as agent prompt vs human
   workflow.** Prompt: the Intelligence Layer (`GLOSSARY.md` vault
   candidate) decomposes a captured intent into concept/dependency
   nodes pre-dispatch. Workflow: a human draws the decomposition by
   hand. Prompt scales; workflow keeps the structuring step
   human-led.

## Cross-references

- `content/vapps/blueprint.md` — the 300-500 word stance (sibling,
  do not modify)
- `content/vapps/wiki.md` and `content/vapps/wiki-deep.md` —
  Blueprint reuses the Wiki's `Node`/`Edge` substrate; read these
  for the canonical object model
- `ARCHITECTURE.md` — seven-layer stack, `collab/supervisor (NEW —
  substrate TBD)`, "send user intent back as `Proposal`"
- `DESIGN_PRINCIPLES.md` — P1 (authority before surface), P3
  (workspace state durable), P9 (collab adjacent to control), P10
  (org/space first-class)
- `howto/add-a-vapp.md` — pressure-check, "vApp does not own state"
- `research/parts/semantic-layer.md` — `NodeKind` (including
  `Blueprint`), `Relation`, `Visibility`, `Promotion`,
  `context_for/2`, actor sketches, test list, Q1/Q2/Q3/Q8/Q9
  mapping
- `content/briefs/semantic-layer.md` — three futures expanded,
  decision pressure #1–#6 (especially #2 "Index reality vs author
  reality" and #5 "CRDT vs event-log only")
- `research/build-steps/01-control-plane-skeleton.md`
- `research/build-steps/02-identity-registry-skeleton.md`
- `research/build-steps/05-collab-substrate-skeleton.md`
- `research/build-steps/06-surfaces-skeleton.md`
- `05-fresh-context-project-app-model.md` §5 — Blueprint surface
  frame ("Karpathy-style knowledge structuring, and intent capture")
- `GLOSSARY.md` — Blueprint, Brain Dump, Vault Cognitive Layer,
  Superman, Intelligence Layer, MCP Gateway, Distributed AI
  Delegation, Auto-Resolve Gate, Background Results Contract,
  Handoff Envelope, Scope Advisor
- `OPEN_QUESTIONS.md` — Q1, Q2, Q3, Q8, Q9, Q10

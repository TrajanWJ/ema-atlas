# Chat — deep brief

> Sibling to `content/vapps/chat.md`. The 300-500 word brief is the
> stance summary; this file is the next layer of pressure.

## Stance

Chat is the **runtime surface** vApp. In the seven-layer stack
(`ARCHITECTURE.md`) it sits in the *Surfaces* row, but its rendered
state belongs to two layers below: live sessions live on the Hermes
harness/driver layer (P2/P5, `DESIGN_PRINCIPLES.md`), and turn-by-turn
lineage lands in the EMA control plane via the
`execution_supervisor`'s `DispatchUpdate*` events
(`ARCHITECTURE.md`, "Drivers emit DispatchUpdate* into event_log
only"). Chat is the place where the canonical rule —
*EMA owns truth. Hermes owns execution. Surfaces do not own state.* —
gets exercised end-to-end on every turn: the surface renders, Hermes
runs, the control plane records.

Chat is also the most likely surface to violate that rule, because
chat scrollback is the historical home of state drift. The Elixir
era's surface seam (`codebase-claudeforge/packages/server/src/providers/
hermes-provider.ts` with `X-Hermes-Session-Id`, per `ARCHITECTURE.md`)
already proved that session continuity can ride a typed contract;
Chat's job is to keep doing that. P3 (`DESIGN_PRINCIPLES.md` —
"Workspace artifacts live in repo-/space-owned storage, not in chat
scrollback") is a direct constraint on Chat: nothing of value is
allowed to live only inside the conversation.

The vApp also sits at a contested seam in the harness/driver story
(P5, `DESIGN_PRINCIPLES.md` — *Harnesses are not just providers*).
Per `05-fresh-context-project-app-model.md`: "EMA's role is not fully
clear: sometimes a secondary harness over Claude/Codex/Hermes CLI,
sometimes Hermes is the shared backbone." Chat is the surface where
that ambiguity becomes visible — the user picks a `DriverTarget`
(`HermesNative | ClaudeCli | CodexCli | PeerRemote(NodeId) |
SimulatedTui`, per `ARCHITECTURE.md`). Picking is itself a P5
statement: drivers and providers are not interchangeable, and Chat
must surface that distinction without leaking it as UI cruft.

The vault-candidate **Intelligence Layer** (`GLOSSARY.md` —
"always-on pre-routing reasoning tier that does intent parsing,
metaprompting, and prompt consulting on every inbound request before
any dispatch") would sit upstream of every Chat turn if adopted. The
**Cognitive Cockpit** stance (vault candidate) treats the operator UI
as ambient awareness rather than chat-with-bots; under that frame,
Chat is one calm surface among several, not the front door.

## Object model

Objects Chat renders (none owned canonically — all references trace
to the Hermes runtime or the control plane):

- **Session** — live runtime continuity, `session_id` distinct from
  `execution_id` and `provider_session_id` (P4,
  `DESIGN_PRINCIPLES.md`; `GLOSSARY.md` row "Session"). Lives on the
  **Runtime plane** (`gleam_otp` Subjects in the Hermes driver tree,
  `ARCHITECTURE.md`). Persisted lineage on the **Control plane**.
- **Turn** — one user→model→tool exchange. Lives on the Runtime plane
  while in flight, on the Control plane (`event_log`) once
  `DispatchUpdate*` lands.
- **ToolCall** — driver-side tool invocation. Same lifecycle as Turn.
- **Delegation** — sub-agent dispatch from inside a session. Emits a
  child `Dispatch{execution_id, project_id, intent, placement,
  capability_set, continuation_id}` per the `Dispatch` record sketch
  in `ARCHITECTURE.md`.
- **Driver/Provider selector** — UI affordance over the typed
  `DriverTarget` and underlying `Placement` (`Local | Daemon |
  Peer(NodeId) | HostAffinity(_)`, `ARCHITECTURE.md`). State lives in
  the driver registry (`drivers (NEW — typed registry)`).
- **Workspace artifact attachment** — drag-in of a plan, handoff,
  note, export. Lives on the **Workspace plane** (`workspace/shared/`,
  per `ARCHITECTURE.md`). Chat renders a reference; never copies the
  artifact into scrollback as truth.
- **Wiki node attachment** — drag-in of a `Node`. Lives on the Collab
  plane (per Wiki vApp). Chat renders a reference + snippet via
  `context_for/2` (per `research/parts/semantic-layer.md`).
- **Chronicle pane** — projection of the `event_log` filtered by
  `execution_id`. Read-only. Lives on the Control plane.
- **Background-results message** — XML `<background-results>` wrapper
  (vault candidate **Background Results Contract**, `GLOSSARY.md`)
  injecting an async sub-agent's outcome back into the live session.
- **Continuation token** — `continuation_id: Option(ContinuationId)`
  on `Dispatch`, used for fork/branch.

Objects Chat does *not* render: lanes, handoffs, schedule events,
queue items (those belong to Agent vEnv), wiki nodes as primary
content (Wiki vApp), thread/channel membership (Threads vApp).

## Three futures (deepening the universal stances)

### Operator Cathedral — *Sessions as audited transactions*

Chat is a precision instrument. Every turn is an audited
transaction. `DriverTarget` and `Placement` are explicit, never
hidden. The Intelligence Layer pre-routes every inbound message — no
prompt reaches a driver without intent parsing, metaprompting, and
prompt consulting (vault candidate, `GLOSSARY.md`). Forking a
session creates an explicit `continuation_id` lineage. Chronicle pane
is open by default.

- **Bet:** that legibility is the product. The user trusts EMA
  *because* they can see what happened.
- **Tension:** the Intelligence Layer adds latency on every turn. The
  chronicle pane is dense and pushes most users to "just give me the
  answer." Driver/placement controls become surfaceable cruft.
- **Question:** at what point does audit infrastructure stop
  protecting the user and start performing for them? The
  `04-…orchestration.md`-era event-flood problem returns here.

### Living Workspace — *Sessions as collaborative threads*

Chat is calm. Sessions feel like ongoing conversations rather than
one-shot transactions. The **Cognitive Cockpit** (vault candidate)
stance shapes the surface: ambient, low-friction, agents and humans
both contributing. The chronicle pane is collapsed. Background results
arrive as inline messages via the **Background Results Contract**, not
as modal interrupts. Workspace artifacts and wiki nodes get pulled in
fluidly, not via a dedicated import affordance.

- **Bet:** that adoption depends on the surface feeling like it
  *helps you think*. Calm beats precise at the daily-driver layer.
- **Tension:** the canonical rule keeps biting. "Calm" tempts the
  surface to cache state, render-without-record, or treat scrollback
  as memory. P3 violation surface area is high.
- **Question:** if a session feels collaborative because agents and
  humans co-edit a shared turn buffer, is that a Chat surface or a
  Wiki surface? Hard question 2 from `content/briefs/shells-surfaces.md`
  ("Whether Chat and Threads are distinct products or two views of
  one underlying model") generalizes here to Chat-vs-Wiki.

### Mesh Commonwealth — *Sessions as routed work*

Chat is a routing surface. A turn can dispatch locally, to a daemon,
to a peer (`Peer(NodeId)`, per `ARCHITECTURE.md`), or be subject to
**Distributed AI Delegation** (vault candidate — "rate-limited EMA
node routes Claude/inference calls through a peer node's
credentials"). Driver picker shows remote drivers as first-class.
Capability locality (P8) is visible: which tools work where.

- **Bet:** that Chat is the surface where peer-aware execution earns
  its keep, because conversations are the most natural place to
  accept "this is going to a remote peer" friction.
- **Tension:** Q9 (replication boundary) is deliberately deferred
  until Q1/Q2/Q3 settle (`DESIGN_PRINCIPLES.md` P6, `OPEN_QUESTIONS.md`
  Q9). Building peer-aware Chat early violates P6.
- **Question:** when a peer's driver fulfills your turn, does the
  resulting `Turn` record live in *your* `event_log` shard or theirs
  or both? P10 says `project_id` is on every record; this puts
  cross-project replication squarely on the table.

## What humans do here

1. **Start a session.** Artifact: a new Hermes Subject (Runtime).
   Control-plane records: `Dispatch{execution_id, project_id, intent,
   placement, capability_set, continuation_id: None}` followed by
   `SessionStart` (per existing `chat.md` chronicle list). Presupposes
   Q5 (harness contract surface) for any non-`hermes-native` driver.
2. **Send a message.** Artifact: a `Turn` record. Control-plane
   records: `Turn`, then `ToolCall*` and possibly `Delegation*` per
   `chat.md`. Presupposes Q4 (where personal AI executes) if the
   driver target is the user's personal AI.
3. **Inject a workspace artifact as context.** Artifact: an artifact
   reference attached to the session. Control-plane record:
   `ContextAttached{session_id, artifact_path}`. Presupposes Q3
   (Project ↔ Space cardinality decides workspace root resolution).
4. **Inject a wiki node as context.** Artifact: a node reference.
   Control-plane record: same shape as #3 but pointing at a `NodeId`
   per `research/parts/semantic-layer.md`. Presupposes Q2 (where
   collab state lives).
5. **Switch driver mid-conversation.** Artifact: a `DriverSwitch`
   event on the session. Control-plane record: `DriverSwitch{from,
   to, at_turn}`. Presupposes Q5 and a clean continuation contract
   per `Dispatch.continuation_id`.
6. **Approve / reject a control-plane proposal raised mid-session.**
   Artifact: a `ProposalDecision`. Control-plane record:
   `ProposalApproved | ProposalRejected{by, at, proposal_id}`.
   Presupposes Q1 (so attribution is meaningful when the proposer is
   an agent).
7. **Fork a session.** Artifact: a new Subject with a fresh
   `execution_id` and a `continuation_id` pointing back. Control-plane
   record: `SessionFork{parent_id, child_id, at_turn}`. Presupposes
   Q5 — driver must support continuation tokens.
8. **Promote a session to a workstream / workspace artifact.**
   Artifact: a workspace file under `workspace/shared/sessions/`.
   Control-plane record: `SessionPromoted{session_id,
   to_artifact_path}`. Presupposes Q3 for path resolution.

## What agents do here via CLI

Parity with the human surface is required (`howto/add-a-vapp.md`).

1. **`ema chat session start --project --driver --provider --space`**
   (existing `chat.md`). Same `Dispatch` + `SessionStart` as human #1.
   The **Scope Advisor** (vault candidate, `GLOSSARY.md`) runs
   pre-dispatch via Honcho to advise scope; the **Intelligence Layer**
   parses intent before the driver sees the prompt.
2. **`ema chat session continue <id> --message`** (existing). Same as
   human #2. The **Auto-Resolve Gate** (vault candidate, confidence ≥
   0.85, `GLOSSARY.md`) applies if the message is the agent's response
   to a queue item — if the gate passes, no human review is required.
3. **`ema chat session fork <id> --at-turn`** (existing). Same as
   human #7. The fork is itself a candidate handoff point: the
   **Handoff Envelope** (vault candidate — status, confidence,
   completeness, provenance per `GLOSSARY.md`) wraps the parent
   session's tail when handing off to the forked child agent.
4. **`ema chat session export <id> --to workspace`** (existing). Same
   as human #8. Promoted artifact lives under `workspace/shared/`
   (P3). Control-plane record: `SessionPromoted`.
5. **`ema chat tool register --schema`** (existing). Driver-side tool
   surface registration. Control-plane record: `ToolRegistered{driver,
   schema_hash, project_id}`. Presupposes Q5 (driver contract surface)
   and Q10 (tool permissions vs org/space permissions).
6. **`ema chat delegate --to <agent_id> --intent --capability_set`**
   (extension). Emits a child `Dispatch` with the parent's
   `continuation_id`. **Handoff Envelope** is mandatory here per the
   vault definition. Background result returns via the **Background
   Results Contract** XML wrapper.
7. **`ema chat watch --session --filter` (streaming)** (extension).
   Read-only subscriber to the session's `DispatchUpdate*` stream via
   `ws_hub` (per `research/parts/shells-surfaces.md`). No artifact, no
   control-plane record.

## Smallest provable v0.0.3 slice

**Scope:** single-driver (`hermes-native`) Chat with one tool, a
chronicle pane, and the canonical-rule round-trip proven end-to-end.
This is the minimum from existing `chat.md` ("Yes — ship in v0.0.3").

**2-week acceptance criteria:**

1. A `Session` type exists in the Gleam tree with `session_id`
   distinct from `execution_id` and `provider_session_id` (P4).
2. `drivers/registry` (`Subject(DriverRegistryMsg)`, per
   `ARCHITECTURE.md`) holds `hermes-native` and `simulated-tui`. A
   `Dispatch` against `hermes-native` produces `DispatchUpdate*`
   events that land in `event_log` via `execution_supervisor` —
   *never* on the surface socket directly (P2 verification).
3. The Chat vApp renders one session via a typed projection of
   `event_log` filtered by `execution_id`. Surface code contains no
   provider keys, no event log, no replay logic (per `chat.md`
   canonical-rule statement).
4. One tool registered via `ema chat tool register`; one full
   user→model→tool round-trip lands as `Turn` + `ToolCall` events.
5. The chronicle pane shows the lineage chain by reading
   `control_plane/replay` for the current turn.
6. Surface-restart test: kill the surface, restart it; the session
   view rehydrates from `event_log` alone. (Test from
   `research/parts/shells-surfaces.md` — "Surfaces hold no durable
   state".)
7. The `X-Hermes-Session-Id` continuity contract from
   `codebase-claudeforge/packages/server/src/providers/hermes-provider.ts`
   is preserved across the surface↔Hermes seam (per `ARCHITECTURE.md`).

**Build-step dependencies:**

- `research/build-steps/01-control-plane-skeleton.md` — `event_log`,
  `command_bus`, `replay`. Required for the Turn / ToolCall record
  path and for the chronicle pane projection.
- `research/build-steps/02-identity-registry-skeleton.md` —
  `Member`/`Agent`, `context_for(project, actor)`. Required so the
  session has a typed `Actor` and the driver picker shows scoped
  options.
- `research/build-steps/03-driver-registry-skeleton.md` — typed
  `Driver` contract, `drivers/registry`, `simulated-tui` and
  `hermes-native` implementations. **This is the load-bearing
  dependency for Chat** — Chat is the surface that exercises this
  registry.
- `research/build-steps/04-sessions-and-babysitter.md` — typed
  sessions with the three distinct id types, `execution/supervisor`.
  Required for fork/branch and for take-over semantics.
- `research/build-steps/06-surfaces-skeleton.md` — mist + wisp HTTP/WS
  with typed projections. Required for the renderer and the
  `X-Hermes-Session-Id` seam.

**Explicitly deferred:** multi-driver picker (Q5), peer routing
(Q4/Q9), Background Results Contract async injection, Intelligence
Layer pre-routing, Distributed AI Delegation, fork tree visualization,
workspace/wiki inject affordances.

## Decision pressure unique to this vApp

1. **EMA-as-secondary-harness vs Hermes-as-shared-backbone.** Per
   `05-fresh-context-project-app-model.md` ("EMA's role is not fully
   clear"). Secondary-harness: EMA wraps Claude/Codex/Hermes CLIs as
   drivers, never executes. Backbone: Hermes is the canonical runtime
   and other CLIs are imported via the driver contract. This pick
   determines what `hermes-native` actually means at v0.0.3.
2. **Driver picker as user choice vs daemon policy.** User choice:
   the human picks `HermesNative | ClaudeCli | CodexCli | PeerRemote
   | SimulatedTui` per turn. Daemon policy:
   `Project.default_harness_policy: DriverTarget` (per
   `ARCHITECTURE.md`) handles it and the picker is a power-user
   override.
3. **Scrollback as ephemeral vs scrollback as derived.** Ephemeral:
   refresh blows it away, view rehydrates from `event_log`.
   Derived: the Chat vApp maintains a local cache that is
   provably-equal to the projection. Both honor P1; the second
   tempts P3 violation.
4. **Background results as inline messages vs as side panel.**
   Inline (per **Background Results Contract** XML wrapper) keeps the
   conversation linear at the cost of context-window pressure. Side
   panel keeps the conversation clean at the cost of attention split.
5. **Tool permission gating in Chat vs upstream.** In-Chat: the user
   sees a per-call permission prompt for sensitive tools. Upstream:
   `capability_set: Set(Capability)` on `Dispatch` (per
   `ARCHITECTURE.md`) is fixed at session start; Chat just renders the
   blocked-tool error. Q10 decides where the policy lives.
6. **Sessions are project-scoped vs user-scoped.** Project-scoped:
   `Personal AI` (`GLOSSARY.md`) needs to spawn one session per
   project context. User-scoped: one personal-AI session spans
   projects, requires Q3/Q4 settled and a multi-tenant context model
   inside Hermes.
7. **Chat distinct from Threads vs unified.** Per `content/briefs/
   shells-surfaces.md` hard question #2. Distinct: two surfaces, two
   underlying models. Unified: one session model, two view modes.

## Cross-references

- `content/vapps/chat.md` — the 300-500 word stance (sibling, do not
  modify)
- `ARCHITECTURE.md` — seven-layer stack, `Dispatch`/`DriverMsg`/
  `Placement` sketches, `surface↔Hermes` seam at
  `codebase-claudeforge/packages/server/src/providers/hermes-provider.ts`
- `DESIGN_PRINCIPLES.md` — P1 (authority before surface), P2
  (execution as substrate), P3 (workspace state durable), P4 (identity
  layers separate), P5 (harness ≠ provider), P10 (org/space
  first-class)
- `howto/add-a-vapp.md` — pressure-check, CLI parity requirement
- `research/parts/shells-surfaces.md` — `mist`/`wisp` endpoint, `ws_hub`,
  surface-as-projection-subscriber, "endpoint-last" boot order,
  surface-rehydrate test
- `content/briefs/shells-surfaces.md` — three futures expanded,
  decision pressure, hard question #2 (Chat vs Threads)
- `research/build-steps/01-control-plane-skeleton.md`
- `research/build-steps/02-identity-registry-skeleton.md`
- `research/build-steps/03-driver-registry-skeleton.md`
- `research/build-steps/04-sessions-and-babysitter.md`
- `research/build-steps/06-surfaces-skeleton.md`
- `GLOSSARY.md` — Session, Driver, Driver targets, Provider, Harness,
  Placement, Capability locality, Personal AI, Intelligence Layer,
  Cognitive Cockpit, Background Results Contract, Auto-Resolve Gate,
  Handoff Envelope, Scope Advisor, Distributed AI Delegation
- `OPEN_QUESTIONS.md` — Q1, Q3, Q4, Q5, Q9, Q10
- `05-fresh-context-project-app-model.md` §2 — Chat surface frame

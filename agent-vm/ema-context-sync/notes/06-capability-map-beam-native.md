# EMA Capability Map — BEAM-Native, Post-v1 Target

Generated from the user's verbatim correction memo and aligned to the collection workspace.

## Actual user verbatim constructed intent

> "Both docs converged on the same vision from two angles, and the right next artifact is the capability map — but before I produce it, two corrections need to propagate into the map so it doesn't bake in errors:
>
> 1. BEAM-native, not TypeScript. The earlier docs implicitly assume TS interfaces / Electron-shaped primitives. That framing is stale. EMA stays on BEAM because the actor model, distributed Erlang, :pg / Phoenix.PubSub, hot code loading, and OTP supervision are load-bearing for the swarm + time-aware agent design — not decorative. Gleam is the bridge to JS when the GUI eventually lands. The capability map below names BEAM primitives directly because that's what the implementation will actually touch.
>
> 2. Temporal isn't a sibling substrate — it wraps the existing spine. The docs treat Semantic / Temporal / Operational as three co-equal layers. That reads clean but it's structurally wrong for EMA, because Intent → Proposal → Approval → Execution → Canon Update is already the spine, and time is an attribute of entities on that spine, not a parallel dimension. An Intent can carry a scheduled window. A Proposal can carry an execution window. An Execution inherently timestamps. An \"agent calendar\" is a computed view over scheduled entities owned by that actor — same pattern as Task/Todo being computed views. This keeps the graph normalized and prevents a second source of truth.
>
> With those locked in, here's the map.
> EMA Capability Map (post-v1 target, v1 subset marked ✓)
> 1. Canonical Graph — knowledge substrate
>
>     Entities: Note, Intent, Proposal, Approval, Execution, CanonUpdate, Edge. All durable, git-tracked markdown + YAML frontmatter.
>     Actions: traverse, link, query by frontmatter, diff, merge, cite.
>     Agent affordances: structured read via MCP; deterministic context bundle assembly; citation edges back into canon.
>     Human affordances: (deferred) graph view, backlinks, full-text, frontmatter filters.
>     BEAM home: file-watcher GenServer + ETS index; no independent state — git is the store.
>     v1 scope: ✓ CLI reads/writes, ETS index, no GUI.
>
> 2. Temporal Engine — time-awareness for the spine
>
>     Entities added to graph: TimeBlock, Event, Phase, Cadence (recurring loop definition).
>     Entities extended: Intent / Proposal / Execution gain optional scheduled_window, phase, cadence_ref frontmatter fields.
>     Actions: schedule, reschedule, claim window, release, tick (advance time), trigger cadence.
>     Agent affordances: self-paced day/week planning; commit to windows; schedule revisit loops (\"review PROP-017 on Thursday\"); pacing check against plan.
>     Human affordances: (deferred) calendar GUI, drag/drop, manual override of agent schedules.
>     BEAM home: a Clock GenServer with Process.send_after/3 for scheduled dispatch; Phase modeled as a gen_statem; cadences as supervised periodic tasks under a DynamicSupervisor.
>     v1 scope: scheduled_window field in frontmatter + CLI commands ema block, ema schedule, ema agenda --actor X --day today. No LiveView calendar yet.
>
> 3. Operational Fabric — projects, tasks, decomposition (all computed)
>
>     First-class entities: Intent (already exists), Dependency edge, Priority, Status, SubIntent (Intent with parent edge).
>     Computed views: Task list, Todo list, Kanban, dependency graph, critical path. These are queries, not records.
>     Actions: decompose (Intent → child Intents with parent edges), block/unblock, prioritize, complete.
>     Agent affordances: recursive architecture decomposition into Intent trees; query \"what's next for me\" as a view over open Intents + my scheduled windows.
>     Human affordances: (deferred) board/list/tree views.
>     BEAM home: query processes that assemble views on demand from graph index + temporal engine.
>     v1 scope: ✓ Intent decomposition via CLI, dependency edges, ema intent list --status open.
>
> 4. Agent Runtime Workspace — where agents actually live
>
>     Entities: Agent (persistent identity in graph), Session (ephemeral, per-invocation), ContextBundle (materialized read), CLIHistory, VirtualCLI attachment.
>     Actions: invoke agent, assemble bundle, attach to PTY / codex-sdk stream, record session, close session → produce Proposal or CanonUpdate.
>     Agent affordances: own calendar view, own task view, own CLI history, virtual planning vApp, context-efficiency vApp.
>     Human affordances: observe tmux panes live; intervene; approve proposals from session output.
>     BEAM home: one GenServer per active session under a DynamicSupervisor; PTY attachment via ports or erlexec; Codex JSONL stream via Gleam decoder; session state in ETS, persisted to graph on close.
>     v1 scope: ✓ Single-agent, tmux PTY + codex-sdk both supported, session records written as canonical Execution nodes.
>
> 5. Swarm Coordination — multi-actor shared world
>
>     Entities: Actor registry, Handoff, Channel, Role, Assignment edge.
>     Actions: handoff (transfer ownership of Intent), claim, release, broadcast on channel, role-gate access.
>     Coordination primitives: :pg for actor group membership; Phoenix.PubSub for channels; scheduled sync events via Temporal Engine.
>     BEAM home: native — this is exactly what distributed Erlang is for. libcluster for node discovery; CRDTs (via delta_crdt or Gleam port) for eventually-consistent assignment state across peers.
>     v1 scope: deferred. But Intent and Execution schemas already carry actor fields so the door is open.
>
> 6. Interface Layer — human GUI + P2P sync
>
>     Human GUI: Phoenix LiveView for a web/desktop client, OR Gleam-compiled JS embedded in a lightweight shell. LiveView is the path of least resistance; Gleam-to-JS is the path that preserves shared types across runtime and UI.
>     Agent interface: CLI (v1 ✓) + daemon + MCP server exposing the graph for external agent tooling.
>     P2P sync: distributed Erlang + libcluster for trusted peers; libp2p via Rust NIF for open peer mesh if/when needed. Workspace state and CLI history sync separately from the graph (graph syncs via git remotes).
>     v1 scope: CLI + MCP server only.
>
> What this map makes clear
>
>     v1 stays tight: modules 1, 2 (partial), 3, 4 land. 5 and 6 are architected-for but not built.
>     BEAM earns its keep in three specific places: session supervision (module 4), temporal dispatch (module 2), swarm coordination (module 5). Those are the three features that are genuinely painful without OTP, and they're the three that differentiate EMA from yet-another-agent-framework.
>     The temporal unlock is real but cheap to add now: it's three frontmatter fields + a Clock GenServer + a handful of CLI verbs. Defer the GUI calendar; keep the data model.
>
> Recommended next artifact
>
> Update EMA-GENESIS-PROMPT.md and SCHEMATIC-v0.md with: (a) the temporal frontmatter fields on Intent/Proposal/Execution, (b) the Clock + Session supervision tree sketch, (c) the six-module boundary above as the post-v1 architectural target. Then the v1 slice is still \"CLI + library over a folder of markdown\" — the map doesn't grow v1, it just makes sure v1's shape doesn't have to be undone later.
>
> Want me to draft those frontmatter schema additions + the OTP supervision sketch next, or push further on one specific module (my vote: Temporal, since it's the one with the least prior art in your canon)?"

## Freeform: what the user is trying to do

The user is tightening the architecture now, not adding scope for its own sake.

The correction is important because it reveals the actual implementation philosophy:
- the system is not trying to be stack-agnostic anymore
- it is explicitly choosing **BEAM-native primitives** because supervision, actor isolation, distributed coordination, timed dispatch, and shared runtime state are core to the product itself
- the system is also rejecting the temptation to treat calendar/time as a separate app or parallel ontology
- instead, time is being folded into the existing canonical spine: `Intent -> Proposal -> Approval -> Execution -> Canon Update`

That means the user is trying to preserve one normalized truth model while still gaining:
- scheduling
- pacing
- calendar views
- agent agendas
- revisit cadences
- swarm coordination

The deeper move here is architectural discipline:
- keep the graph normalized
- keep views computed
- keep OTP where OTP actually matters
- keep v1 tight enough to ship
- make sure the eventual GUI and p2p layers do not force a rewrite of the data model

## Corrections that supersede earlier notes

### 1. BEAM-native is the actual target
Any earlier framing that implicitly leaned on:
- TypeScript interface-first design
- Electron-shaped runtime assumptions
- JS-native orchestration primitives

should be treated as stale.

The implementation target is:
- Elixir / Erlang / OTP as the runtime core
- Gleam as a bridge where useful, especially for JS-facing code later
- Phoenix LiveView or Gleam-to-JS for human GUI paths

### 2. Temporal wraps the spine; it is not a sibling substrate
The cleaner but wrong model was:
- Semantic
- Temporal
- Operational

The corrected model is:
- canonical graph / spine first
- time expressed as fields and related graph entities on top of that spine
- computed calendar/task/todo views over scheduled entities

That avoids a second truth system.

## Condensed capability map

### 1. Canonical Graph
Durable git-tracked markdown + frontmatter canon.

Core entities:
- Note
- Intent
- Proposal
- Approval
- Execution
- CanonUpdate
- Edge

BEAM home:
- file watcher GenServer
- ETS-backed index
- git remains the source of truth

v1:
- CLI read/write
- ETS index
- no GUI

### 2. Temporal Engine
Time-awareness for canonical entities, not a separate substrate.

New entities:
- TimeBlock
- Event
- Phase
- Cadence

Extended entities:
- Intent
- Proposal
- Execution

New fields:
- `scheduled_window`
- `phase`
- `cadence_ref`

BEAM home:
- Clock GenServer
- `Process.send_after/3`
- `gen_statem` for phases
- DynamicSupervisor for cadence loops

v1:
- frontmatter fields
- CLI verbs like `ema block`, `ema schedule`, `ema agenda`
- no GUI calendar yet

### 3. Operational Fabric
Projects, tasks, dependencies, and decomposition as computed views over the graph.

First-class graph concepts:
- Intent
- Dependency edge
- Priority
- Status
- SubIntent

Computed views:
- tasks
- todos
- kanban
- critical path
- dependency graph

v1:
- Intent decomposition
- dependency edges
- list/query commands

### 4. Agent Runtime Workspace
Where agents actually operate.

Entities:
- Agent
- Session
- ContextBundle
- CLIHistory
- VirtualCLI attachment

BEAM home:
- one GenServer per active session
- DynamicSupervisor
- PTY via ports / erlexec
- stream decoders in Gleam where appropriate
- ETS session state, persisted back into canon on close

v1:
- single-agent
- tmux PTY + codex-sdk stream support
- session closes produce canonical Execution nodes

### 5. Swarm Coordination
Multi-actor shared world.

Entities:
- Actor registry
- Handoff
- Channel
- Role
- Assignment edge

BEAM primitives:
- `:pg`
- Phoenix.PubSub
- distributed Erlang
- libcluster
- CRDT layer later

v1:
- deferred
- but schema should already leave room for actor ownership fields

### 6. Interface Layer
Human GUI + p2p sync surfaces.

Human path:
- Phoenix LiveView first
- Gleam-to-JS later if it proves worth it

Agent path:
- CLI
- daemon
- MCP server

P2P path:
- distributed Erlang + libcluster for trusted peers first
- libp2p / NIF path only if truly needed later

v1:
- CLI + MCP only

## What this map clarifies

1. v1 is still small.
2. The data model gets future-proofed without exploding scope.
3. BEAM is justified by the actual hard parts:
   - session supervision
   - temporal dispatch
   - swarm coordination
4. Calendar/time can land early in a cheap, normalized way.
5. GUI and swarm can be deferred without invalidating v1.

## Recommended next artifact

The user's recommendation is correct:
update the foundational docs/specs with:
- temporal frontmatter fields on Intent/Proposal/Execution
- Clock + Session supervision tree sketch
- the six-module boundary as the post-v1 architectural target

That preserves the simple v1 implementation shape:
- CLI + library over a folder of markdown

while preventing future rework.

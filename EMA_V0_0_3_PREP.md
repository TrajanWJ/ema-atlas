# EMA v0.0.3 — Preparation Spec

> Status: prep doc, not implementation. The actual v0.0.3 build will land
> in TrajanWJ/ema (Gleam/BEAM). This file tracks what must be true before
> that build starts so we don't carry ambiguity into the new substrate.

## Stance

**Why Gleam/BEAM.** EMA's identity has been daemon-first since the
Elixir/Phoenix consolidation in 2026-03 → 2026-04 (`TIMELINE.md`, "EMA
daemon consolidation"), and the strategic direction is explicitly
P2P-first on a BEAM-family base
(`03-architectural-evolution-and-major-decisions.md` §4, §5). The system
needs supervision, durable processes, evented control-plane logic,
concurrency for orchestration and sync, and an actor-shaped runtime that
naturally extends into peer dispatch — all of which already motivated
Elixir. Gleam keeps the BEAM alignment while adding compile-time types
to interfaces (drivers, harness contracts, control-plane records) that
were the primary source of identity-conflation risk under
Elixir/Phoenix. The bet is that *typing the contracts where the
historical drift happened* (execution_id vs session_id vs
provider_session_id vs object_id; provider vs driver vs harness) is the
single largest leverage point left, and BEAM gives that for free without
giving up supervision or P2P fit.

**What the move costs.** The Elixir/Phoenix EMA already has a working
OTP supervision tree, a control-plane event log, sessions, babysitter,
surfaces, and a Hermes client seam (see "Carries forward" below).
Walking off it costs the working Phoenix endpoint (`EmaWeb.Endpoint`),
the existing Repo + Ecto schema, the live HTTP control-plane API
documented in `AGENT-CONTRACT.md` (`/api/control-plane/*`), and the
ClaudeForge↔Hermes provider seam in TypeScript that already proves the
surface↔execution split. v0.0.3 has to re-stand all of those on Gleam,
and the doctrines crystallized in
`03-architectural-evolution-and-major-decisions.md` §4 ("Why Elixir is
strategically appropriate") apply to Gleam only to the extent the rewrite
preserves them — supervision, durable daemon, evented control plane,
explicit lineage.

## Carries forward from Elixir/Phoenix EMA (the canonical rule + what's already real)

The canonical rule survives unchanged: **EMA owns truth. Hermes owns
execution. Surfaces do not own state.** (`MACBOOK_AGENT_HANDOFF_MASTER.md`
§2.) Concrete pieces from `codebase-ema` that v0.0.3 must reproduce, not
reinvent:

- **Append-only event_log as the spine of authority** — `code/ema/daemon/lib/ema/control_plane/event_log.ex`. Source: `graph/edges/authority.md`, `GLOSSARY.md` "Control-plane record".
- **Replay over the event log** — `code/ema/daemon/lib/ema/control_plane/replay.ex`. Source: `GLOSSARY.md` "Execution lineage".
- **Persistence + store + schema split inside control_plane/** — `control_plane/persistence.ex`, `control_plane/store.ex`, `control_plane/schema.ex`, `control_plane/supervisor.ex` (verified via `git ls-tree origin/codebase-ema:code/ema/daemon/lib/ema`).
- **Execution supervisor and dispatch reconciler** — `control_plane/execution_supervisor.ex`, `control_plane/dispatch_reconciler.ex`.
- **Incidents subsystem** — `control_plane/incidents/{authority,event,executor,incident,policy}.ex`.
- **Host transition log** — `control_plane/host_transition_log.ex`. The notion that host/queue/degraded-mode is its own truth surface is from `AGENT-CONTRACT.md` ("Preferred read path" #4).
- **Babysitter watchdog tier** — `code/ema/daemon/lib/ema/babysitter/` (chain_scheduler, takeover_manager, tick_router, command_router, stream_ticker, channel_policy, stream_channels, tick_renderer). Source: `GLOSSARY.md` "Babysitter", `graph/edges/orchestration.md`.
- **Sessions tree with separate session_id** — `code/ema/daemon/lib/ema/sessions/` plus `Ema.Sessions.Monitor` shadow. Source: `GLOSSARY.md` "Session" (session_id distinct from execution_id and provider_session_id).
- **Provider registry strictly below drivers** — `code/ema/daemon/lib/ema/claude/provider_registry.ex`. Source: `GLOSSARY.md` "Provider".
- **Surface-vs-execution split, with Hermes as substrate** — `code/ema/daemon/lib/ema/surfaces/hermes_client.ex`, plus the working ClaudeForge seam at `codebase-claudeforge/packages/server/src/providers/hermes-provider.ts` carrying `X-Hermes-Session-Id`. Source: `graph/edges/execution.md`, `MACBOOK_AGENT_HANDOFF_MASTER.md` §18.
- **Workspace overlay supervision + repo-owned shared workspace root** — `Ema.Workspace.Supervisor` plus `code/ema/workspace/shared/`. Source: `graph/edges/workspace.md`, `GLOSSARY.md` "Workspace (shared)".
- **Stream-of-consciousness layer** — `Ema.Stream.Manager`, `Ema.Stream.Babysitter` (verified in `application.ex`).
- **Second Brain FTS5 indexer** — `code/ema/daemon/lib/ema/second_brain/indexer.ex`. Source: `graph/edges/memory.md`.
- **Config control plane that boots first** — `Ema.Config.Supervisor` (the first child in `application.ex` because every other service depends on its registry).
- **Control-plane HTTP contract** — the verb/endpoint set in `code/ema/docs/AGENT-CONTRACT.md` (`/api/control-plane`, `context_for`, `live`, host-truth, command grammar). v0.0.3 should keep this contract stable for any caller that already speaks it.

## What changes in the rewrite (deliberate breaks)

1. **Typed driver/harness contract above providers.** The Elixir tree only
   has `claude/provider_registry.ex`; the harness/driver layer is still
   only a doc (`code/ema/docs/HERMES_HARNESS_DRIVER_REGISTRY.md`).
   v0.0.3 lands the registry as a typed Gleam contract, with the five
   target driver kinds (`hermes-native`, `claude-cli`, `codex-cli`,
   `peer-remote`, `simulated-tui`) as compile-checked variants.
   Motivation: `graph/edges/execution.md` and the registry doc itself.
2. **Org/Space/Project/Member identity as a first-class control-plane
   schema.** Today there is no schema for it anywhere
   (`graph/edges/identity.md`: "No schema exists yet anywhere in the
   lineage."). v0.0.3 must land an Org/Space/Project/Member shape in the
   control_plane schema before any subsystem hardcodes "no scope" again.
   Motivation: `graph/edges/identity.md`, `GLOSSARY.md` "Project",
   "Space", "Member", `OPEN_QUESTIONS.md` Q1/Q3.
3. **Explicit `placement` field on every dispatch.** The transport edge
   says distributed semantics must not precede single-node clarity
   (`graph/edges/transport.md`). v0.0.3 introduces `placement` as a
   typed field on dispatch records (`local | daemon | peer | host-affinity`)
   without yet shipping a peer-remote driver. Motivation:
   `GLOSSARY.md` "Placement", `graph/edges/transport.md`.
4. **Collaboration-state subsystem is adjacent to event_log, not inside
   it.** `graph/edges/collab.md` rules: "Live collaboration objects need
   their own sync substrate, separate from `control_plane/event_log`.
   Daemon is the auth/permission gateway." v0.0.3 wires collab as an
   adjacent OTP subtree with the daemon mediating, not as a new
   event_log subtype. Motivation: `graph/edges/collab.md`,
   `OPEN_QUESTIONS.md` Q2.
5. **Phoenix endpoint replaced by a smaller Gleam HTTP/WS server that
   preserves the `AGENT-CONTRACT.md` verb set.** Surfaces speak the same
   control-plane endpoints; the implementation underneath swaps. The
   sub-project A draft for the prior Elixir era already prototyped this
   move with a Fastify retirement (`docs-ema-next-steps/host/EMA-v1.1-Next-Steps/01-PLANS/2026-04-13-SUBPROJECT-A-DAEMON-BACKBONE-SPEC-DRAFT.md`
   §3.2). The Gleam rewrite does the same kind of swap but for the
   Phoenix endpoint.
6. **Identity ID separation enforced at the type level.** The
   `02-project-transfer-brief.md` §11 list (execution_id, local
   session_id, provider session_id, workspace artifact_id, peer_id,
   org/space/member/agent identity) becomes distinct opaque Gleam types,
   not bare strings. Motivation: `03-architectural-evolution-and-major-decisions.md`
   §7 design principle #4 ("Identity layers must stay separate").

## OTP layout proposal (sketch only)

Precedent: the Elixir tree in
`origin/lineage-original-elixir-ema:code/daemon/lib/ema/application.ex`
(verified via `git show`) starts these children under
`Ema.Supervisor`, strategy `:one_for_one`, in this order: `Ema.Config.Supervisor`,
`Ema.Repo`, `Phoenix.PubSub`, `Ema.Claude.TaskSupervisor`,
`Ema.Claude.ProviderRegistry`, `Ema.Workspace.Supervisor`,
`Ema.Sessions.Supervisor`, `Ema.ControlPlane.Supervisor`,
`Ema.ControlPlane.HostTransitionLog`, `Ema.Sessions.Monitor`,
`Ema.Babysitter.StreamTicker`, `Ema.Babysitter.ChainScheduler`,
`Ema.Babysitter.TakeoverManager`, `Ema.Stream.Manager`,
`Ema.Stream.Babysitter`, `Ema.Surfaces.Supervisor`,
`Ema.Surfaces.HostTruthWatcher`, `Ema.Surfaces.HostSessionSync`,
`Ema.SecondBrain.Indexer`, `EmaWeb.Endpoint`.

Neutral Gleam-side sketch preserving that ordering discipline (config
first, endpoint last, control-plane up before surfaces):

```text
ema_app/application
└── root_supervisor (one_for_one)
    ├── config/supervisor             # boots first; everything reads from it
    ├── persistence/repo              # SQLite or Postgres handle
    ├── pubsub                        # in-process event bus
    ├── identity/registry             # Org/Space/Project/Member resolution (NEW)
    ├── workspace/supervisor          # shared workspace overlay
    ├── sessions/supervisor           # session_id-keyed runtime continuity
    ├── control_plane/supervisor
    │   ├── event_log
    │   ├── store
    │   ├── persistence
    │   ├── execution_supervisor
    │   ├── dispatch_reconciler
    │   ├── replay
    │   ├── host_transition_log
    │   └── incidents/{authority,executor,policy}
    ├── sessions/monitor              # shadow watcher
    ├── babysitter/supervisor
    │   ├── stream_ticker
    │   ├── chain_scheduler
    │   ├── takeover_manager
    │   ├── tick_router
    │   └── command_router
    ├── stream/{manager,babysitter}
    ├── drivers/registry              # typed driver/harness registry (NEW)
    │   └── drivers/{hermes_native,claude_cli,codex_cli,peer_remote,simulated_tui}
    ├── surfaces/supervisor
    │   ├── hermes_client
    │   ├── host_truth_watcher
    │   └── host_session_sync
    ├── second_brain/indexer
    ├── collab/supervisor             # adjacent to event_log (NEW)
    └── http/endpoint                 # last; preserves AGENT-CONTRACT.md verbs
```

`(NEW)` marks subtrees with no Elixir precedent — they implement the
deliberate breaks above. Names are neutral; no business logic invented
beyond what already exists in the lineage.

## Required pre-build decisions

Each item references an `OPEN_QUESTIONS.md` Q-number and states the
minimum answer needed. v0.0.3 does not require fully-resolved versions of
these questions — it requires the smallest answer the build can ship
against without retroactive damage.

### Identity (Q1, Q3, Q4)

- **Q1 — Are agent identities first-class members of Org/Space?**
  v0.0.3 needs: a yes/no commitment, because the `identity/registry`
  subtree's type signatures depend on whether `Member` is a sum
  (`Human(...) | Agent(...)`) or only `Human(...)` with agents attached
  via a separate relation.
- **Q3 — Project ↔ Space cardinality.** v0.0.3 needs: one chosen
  variant from `{N:M, Project-inside-Space, Space-inside-Project,
  disjoint-with-shared-membership}`, because the
  `control_plane/schema` foreign-key shape and the `context_for`
  resolution path both fork on this.
- **Q4 — Where does the Personal AI execute?** v0.0.3 needs: the
  default placement value (one of `user-machine | daemon |
  project-affine | per-call`) so that `placement` defaults are typed
  rather than runtime-inferred.

### Collab (Q2, Q8)

- **Q2 — Is collaboration state in `event_log` or adjacent?** v0.0.3
  needs: the adjacency commitment (already implied by
  `graph/edges/collab.md`), reduced to whether the daemon owns
  permission gating only, or also owns conflict resolution.
- **Q8 — Sync model for docs/wiki/canvas.** v0.0.3 needs: a chosen
  family (`Yjs | Automerge | pure-BEAM CRDT | centralized event log |
  hybrid`) so the `collab/supervisor` subtree's children are typeable.
  An implementation can be deferred; the contract cannot.

### Execution / drivers (Q5)

- **Q5 — Harness/driver contract surface.** v0.0.3 needs: one transport
  picked from `{sync RPC, streaming events with continuation tokens,
  gRPC, JSON-RPC}`, plus confirmation that the five target driver kinds
  (`hermes-native`, `claude-cli`, `codex-cli`, `peer-remote`,
  `simulated-tui`) are still the right first-wave list per
  `code/ema/docs/HERMES_HARNESS_DRIVER_REGISTRY.md` §4.

### Surfaces (Q6, Q7)

- **Q6 — Discord mirror direction.** v0.0.3 needs: which direction is
  authoritative at the Threads/Server boundary
  (`read-only-to-Discord | bidirectional | EMA-superset`), so the
  `surfaces/supervisor` knows whether to ship a Discord webhook
  outbound, an inbound bridge, or both.
- **Q7 — Surface stack for Launchpad/HQ.** v0.0.3 needs: at minimum a
  decision on whether the v0.0.3 milestone *includes* a Launchpad/HQ
  surface, or only the daemon + control-plane API + a single CLI/Web
  reference surface. If included, a stack pick (native vs web vs both).

### Replication (Q9, Q10)

- **Q9 — Replication boundary.** v0.0.3 needs: an explicit deferral —
  Q9 must remain unanswered, but the `placement` field must be typed
  in. The minimum is: ship `placement` as a value with no `peer-remote`
  driver implementation behind it. (Per `OPEN_QUESTIONS.md` Q9 note: do
  not answer before Q1, Q2, Q3 settle.)
- **Q10 — How org/space permissions map onto runtime/tool permissions.**
  v0.0.3 needs: one of `{simple inheritance, explicit policy bundles}`
  picked, so the `identity/registry` and `drivers/registry` know
  whether tool-permission resolution is a join or a lookup.

## Gleam-vs-Elixir specific concerns

- **Static types replace runtime guards.** Elixir leans on pattern
  matching at runtime; Gleam forces ID separation
  (`02-project-transfer-brief.md` §11) into the type system. The cost is
  that every existing JSON shape (event_log records, dispatch envelopes,
  proposals, incidents) needs an explicit decoder/encoder pair instead
  of free-form maps.
- **No macros, no Phoenix.** No `EmaWeb.Endpoint`, no Plug pipeline, no
  Ecto. Choose a Gleam HTTP server (e.g. mist/wisp) and an explicit
  query layer; the `AGENT-CONTRACT.md` verb surface must be reproduced
  by hand.
- **Process model is the same; supervisors are user code.** Gleam OTP
  exists but is leaner than Elixir's; supervision trees that were
  declarative in `application.ex` become explicit child-spec functions.
  The ordering discipline above (config first, endpoint last) has to be
  preserved manually.
- **Immutability is total.** Any place the Elixir tree relied on
  mutating ETS tables or process-dictionary tricks must become explicit
  GenServer state. Most of `control_plane/store.ex` and the babysitter
  state machines are already shaped this way; the Stream/SecondBrain
  subtrees may not be.
- **Erlang interop is the escape hatch.** Anything for which there is no
  Gleam library (FTS5, Phoenix.PubSub equivalent, Ecto migration runner)
  comes in via `:erlang`/`:gen_server` interop. Each interop call is a
  contract boundary that should be wrapped in a typed Gleam module.
- **Release/escript model.** Elixir releases via `mix release`; Gleam
  produces escripts or Erlang releases via `gleam export`. The
  `ema daemon start` ergonomics from the sub-project A spec
  (`docs-ema-next-steps/host/EMA-v1.1-Next-Steps/01-PLANS/2026-04-13-SUBPROJECT-A-DAEMON-BACKBONE-SPEC-DRAFT.md`
  §3.1) need a Gleam-side equivalent decided before the build starts.
- **Tooling parity gap.** No Phoenix LiveDashboard, no Observer
  integration as polished. Plan for either Erlang-side `:observer` or a
  custom introspection surface from day one.

## Verification gates before declaring v0.0.3 ready to build

Each gate must be testable. A "yes" on each is the minimum bar; if any
gate is "no" or "ambiguous", the build is not ready.

1. The control_plane HTTP verb set in
   `code/ema/docs/AGENT-CONTRACT.md` is reproduced as a typed Gleam
   request/response contract, callable from a smoke test.
2. `event_log` round-trips (write → persist → replay → read) for one
   record kind from each family in
   `code/ema/daemon/lib/ema/control_plane/` (proposal, execution,
   dispatch_update, incident, host_transition).
3. The OTP child-start order from the Elixir `application.ex` is
   preserved in the Gleam supervision tree, with config first and the
   HTTP endpoint last, verified by a startup-order test.
4. `execution_id`, `session_id`, `provider_session_id`,
   `workspace_artifact_id`, `peer_id`, and `member_id` are six distinct
   Gleam types that do not coerce into each other (compiler enforces).
5. The `drivers/registry` exposes the five driver kinds from
   `HERMES_HARNESS_DRIVER_REGISTRY.md` §4 as a typed sum, even if only
   `hermes-native` and `simulated-tui` have implementations.
6. `placement` is present and typed on every dispatch record;
   `peer-remote` is rejected at runtime with a clear "deferred" error,
   not silently accepted.
7. An Org/Space/Project/Member shape exists in the control_plane schema
   and a `context_for(project)` query returns a bounded working set
   matching the contract in `AGENT-CONTRACT.md` "Preferred read path"
   #2.
8. A surface (CLI or web) round-trips a proposal → run → complete
   sequence end-to-end against the Gleam daemon, demonstrating the
   surface↔execution split (the same shape proven by
   `codebase-claudeforge/packages/server/src/providers/hermes-provider.ts`).
9. `babysitter/takeover_manager` equivalent in Gleam takes over a
   stalled chain in a deterministic test, proving the doctrine from
   `lineage-openclaw` and `graph/edges/orchestration.md` survives the
   port.
10. `workspace/shared/` artifacts (plan, task, handoff, note, session
    export, context bundle per `graph/edges/workspace.md`) are
    addressable from a control-plane record by ID, proving Slice 1/2 of
    `docs-ema-next-steps/host/EMA-v1.1-Next-Steps/01-PLANS/...VERTICAL-SLICES-DRAFT.md`.
11. A `collab/supervisor` exists and is adjacent to (not inside) the
    event_log subtree, with at least a stub permission-gate proving
    `graph/edges/collab.md`'s rule.
12. The five "non-negotiable product properties"
    (`03-architectural-evolution-and-major-decisions.md` §6 #1–#4 plus
    "humans and agents must share workspace state" #5) have at least
    one assertion-level test each in the Gleam test suite.

## Provenance

This doc is grounded on direct reads of the following files in
`/Users/tawj/Desktop/ema 0.0.3/ema-transfer-pack-20260422-060938/`:

- `MACBOOK_AGENT_HANDOFF_MASTER.md`
- `OPEN_QUESTIONS.md`
- `GLOSSARY.md` (including the "Vault candidate terms" section)
- `02-project-transfer-brief.md`
- `03-architectural-evolution-and-major-decisions.md`
- `TIMELINE.md`
- `graph/edges/authority.md`
- `graph/edges/collab.md`
- `graph/edges/execution.md`
- `graph/edges/identity.md`
- `graph/edges/memory.md`
- `graph/edges/orchestration.md`
- `graph/edges/recovery.md`
- `graph/edges/surfaces.md`
- `graph/edges/transport.md`
- `graph/edges/ux-metaphor.md`
- `graph/edges/workspace.md`
- `graph.json` (counts only: 36 nodes, 91 triples, 11 topics, 10 open
  questions, 48 glossary terms)

And on `git show` reads against `origin` in this repo:

- `origin/lineage-original-elixir-ema:code/daemon/lib/ema/application.ex`
  (full OTP child list, verbatim)
- `origin/codebase-ema:code/ema/daemon/lib/ema/application.ex`
  (cross-checked against the lineage version)
- `origin/codebase-ema:code/ema/docs/HERMES_HARNESS_DRIVER_REGISTRY.md`
- `origin/codebase-ema:code/ema/docs/AGENT-CONTRACT.md`
- `origin/codebase-ema:code/ema/daemon/lib/ema/` tree listing
  (verified `control_plane/`, `babysitter/`, `claude/provider_registry.ex`,
  etc. exist as cited)
- `origin/docs-ema-next-steps:host/EMA-v1.1-Next-Steps/01-PLANS/2026-04-13-SUBPROJECT-A-DAEMON-BACKBONE-SPEC-DRAFT.md`
- `origin/docs-ema-next-steps:host/EMA-v1.1-Next-Steps/01-PLANS/CURRENT-PRIORITIES.md`

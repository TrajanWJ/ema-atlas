# Architecture

The single doc that shows EMA's intended shape end-to-end, grounded in
what already exists (Elixir daemon `lineage-original-elixir-ema`,
ClaudeForge surface seam, OpenClaw doctrine) and oriented toward what
ships in v0.0.3 on Gleam/BEAM.

> **This is a map, not a spec.** The spec lands as Gleam modules in
> `TrajanWJ/ema` for v0.0.3. See [`EMA_V0_0_3_PREP.md`](EMA_V0_0_3_PREP.md)
> for the build-readiness checklist and
> [`research/GLEAM_BEAM_FIT.md`](research/GLEAM_BEAM_FIT.md) for the
> language-level orientation.

## Layered view

```
            ┌─────────────────────────────────────────────────────────┐
            │  Humans + Agents                                        │
            └──────┬──────────────────────────────────────────────────┘
                   │
            ┌──────▼──────────────────────────────────────────────────┐
            │  Surfaces (P1: do not own state)                        │
            │  Discord · Web · Native desktop · CLI · Editor          │
            │  Top-level: Launchpad · HQ · Virtual Desktop            │
            └──────┬──────────────────────────────────────────────────┘
                   │ projection subscribers; typed contracts only
            ┌──────▼──────────────────────────────────────────────────┐
            │  Collaboration plane (P9: adjacent to control)          │
            │  Docs · Wiki · Canvas · Threads                         │
            │  Substrate TBD — Q2/Q8 (see COLLAB_PLANE_OPTIONS.md)    │
            └──────┬──────────────────────────────────────────────────┘
                   │ object identity, no state authority
            ┌──────▼──────────────────────────────────────────────────┐
            │  Shared workspace (P3: durable, addressable)            │
            │  Plans · Handoffs · Notes · Exports · Context bundles   │
            │  Lives at workspace/shared/ in repo-/space-owned dirs   │
            └──────┬──────────────────────────────────────────────────┘
                   │ artifact references
            ┌──────▼──────────────────────────────────────────────────┐
            │  EMA control plane (P1: AUTHORITY · Gleam/BEAM)         │
            │  · event_log (append-only, sharded by project_id)       │
            │  · proposal_events / execution_supervisor               │
            │  · incidents/{authority, event, executor, policy}       │
            │  · sessions/{registry, supervisor, monitor}             │
            │  · babysitter/{chain_scheduler, takeover_manager,       │
            │                tick_router, command_router}             │
            │  · second_brain/indexer (memory)                        │
            │  · identity (Org · Space · Project · Member · Agent)    │
            └──────┬──────────────────────────────────────────────────┘
                   │ typed Dispatch{execution_id, project_id,
                   │                intent, placement, capability_set}
            ┌──────▼──────────────────────────────────────────────────┐
            │  Hermes harness/driver layer (P2: EXECUTION · P5)       │
            │  Driver registry — Subject(DriverMsg) per driver        │
            │  · hermes-native (reference)                            │
            │  · claude-cli                                           │
            │  · codex-cli                                            │
            │  · peer-remote                                          │
            │  · simulated-tui                                        │
            │  Drivers emit DispatchUpdate* into event_log only       │
            └──────┬──────────────────────────────────────────────────┘
                   │ explicit placement (Local | Daemon | Peer | …)
            ┌──────▼──────────────────────────────────────────────────┐
            │  Runtimes / peers / tools / models                      │
            │  Anthropic API · OpenAI API · local model · MCP servers │
            │  Mesh transport (deferred — Q9)                         │
            └─────────────────────────────────────────────────────────┘
```

## What's already real

| Layer | Where the real code lives |
|---|---|
| Control plane (Elixir) | `lineage-original-elixir-ema/code/daemon/lib/ema/control_plane/{event_log,store,replay,execution_supervisor,proposal_events,persistence,schema,supervisor}.ex` |
| Babysitter (Elixir) | `lineage-original-elixir-ema/code/daemon/lib/ema/babysitter/{chain_scheduler,channel_policy,command_router,stream_channels,stream_ticker,takeover_manager,tick_renderer,tick_router}.ex` |
| Sessions (Elixir) | `lineage-original-elixir-ema/code/daemon/lib/ema/sessions/{registry,supervisor,monitor}.ex` |
| Surface seam | `codebase-claudeforge/packages/server/src/providers/hermes-provider.ts` (with `X-Hermes-Session-Id` continuity) and `codebase-ema/code/ema/daemon/lib/ema/surfaces/hermes_client.ex` |
| Shared workspace | `codebase-ema/code/ema/workspace/shared/` |
| Memory indexer (Elixir) | `lineage-original-elixir-ema/code/daemon/lib/ema/second_brain/indexer.ex` |

## What changes for v0.0.3

The OTP supervision tree skeleton (per
[`EMA_V0_0_3_PREP.md`](EMA_V0_0_3_PREP.md)) ports the Elixir shape onto
Gleam:

```
ema_app
├── control_plane
│   ├── event_log_writer        Subject(EventLogMsg)
│   ├── store
│   ├── replay
│   ├── execution_supervisor    Subject(ExecMsg)
│   ├── incidents/*
│   └── proposal_events
├── identity (NEW)
│   ├── registry                Org · Space · Project · Member · Agent
│   └── policy
├── sessions
│   ├── registry
│   ├── supervisor
│   └── monitor
├── babysitter
│   ├── chain_scheduler
│   ├── takeover_manager
│   └── tick_router
├── drivers (NEW — typed registry)
│   ├── registry                Subject(DriverRegistryMsg)
│   ├── hermes_native
│   └── simulated_tui
├── collab/supervisor (NEW — substrate TBD)
└── surfaces
    └── hermes_client            HTTP/WS bridge
```

Two deliberate breaks from Elixir:
1. **Identity registry as its own OTP app** — Org/Space/Project/Member/
   Agent are first-class (P10). The Elixir lineage didn't have this.
2. **Drivers registry as its own OTP app** — driver targets are typed
   contracts (P5), not buried under provider abstractions.

A third subtree (`collab/supervisor`) is sketched but its substrate is
gated on Q2/Q8.

## Identity model (sketch — Q1, Q3 still open)

```gleam
pub type OrgId = OrgId(String)
pub type SpaceId = SpaceId(String)
pub type ProjectId = ProjectId(String)
pub type MemberId = MemberId(String)
pub type AgentId = AgentId(String)

pub type Member {
  HumanMember(id: MemberId, user: String)
  AgentMember(id: AgentId, role: String)   // depends on Q1 resolution
  ServicePrincipal(id: String, label: String)
}

pub type Project {
  Project(
    id: ProjectId,
    org: OrgScope,                    // Personal(MemberId) | Org(OrgId)
    spaces: List(SpaceId),            // depends on Q3 resolution
    event_log_shard: String,
    workspace_root: String,
    default_harness_policy: DriverTarget,
  )
}
```

## Driver contract (sketch — Q5 open on shape)

```gleam
pub type DriverTarget {
  HermesNative
  ClaudeCli
  CodexCli
  PeerRemote(NodeId)
  SimulatedTui
}

pub type Placement {
  Local
  Daemon
  Peer(NodeId)
  HostAffinity(String)
}

pub type Dispatch {
  Dispatch(
    execution_id: ExecutionId,
    project_id: ProjectId,
    intent: Intent,
    placement: Placement,
    capability_set: Set(Capability),
    continuation_id: Option(ContinuationId),
  )
}

pub type DriverMsg {
  Dispatch(Dispatch, reply_to: Subject(DispatchAck))
  Cancel(ExecutionId)
  Stream(ExecutionId, sink: Subject(DispatchUpdate))
}
```

The `DispatchUpdate` stream lands in `event_log` via the
`execution_supervisor`, never on a surface socket directly.

## Three state planes (P9)

| Plane | Owner | Mutability | Substrate |
|---|---|---|---|
| Control | EMA `control_plane/event_log` | append-only | sqlight + parrot, or mnesia via FFI |
| Runtime | Hermes drivers (per-actor) | live, in-memory | gleam_otp Subjects |
| Collab | TBD subsystem | CRDT-merge or sequenced | y_ex / riak_dt / event-log-per-object |
| Workspace | repo-/space-owned files | revisioned by humans/agents | filesystem + index in control plane |

Surfaces render projections of all four. Surfaces own none.

## What surfaces look like (P1)

Surfaces are **typed projection subscribers**. They:
1. Subscribe to a typed projection of `event_log` (per project, per
   space, or per object).
2. Render. Make no canonical mutations.
3. Send user intent back as `Proposal{intent, project_id, member_id, …}`
   — which the control plane validates and turns into `Dispatch`.

Concrete surface candidates for v1.x:
- The atlas itself (`app/` — a meta surface for understanding EMA, not
  for operating it)
- Discord (read-only mirror first per Q6)
- Native desktop (Tauri, inheriting from `codebase-place-companion`)
- Web (Next.js Launchpad/HQ/Virtual Desktop, inheriting from
  `codebase-place-org`)
- CLI (talking to the daemon's HTTP/WS API)
- Editor extensions

Top-level surfaces (Launchpad, HQ, Virtual Desktop) are framing for
*how* surfaces compose, not separate state owners.

## What this architecture refuses

These are deliberate non-goals enforced by P1–P10:

- **Surfaces as primary state container.** Discord/web/CLI are not the
  source of truth. The Elixir era already proved this rule by walking
  away from OpenClaw's drift.
- **Driver and provider as the same abstraction.** Conflation here is
  one of the named architecture mistakes.
- **Distributed orchestration before local clarity.** Mesh/P2P is
  deferred (Q9) until single-node semantics are crisp.
- **Untyped message passing.** Every actor in v0.0.3 owns a typed
  `Subject(Msg)`. No `dynamic` outside FFI boundaries.
- **Implicit project scope.** Every control-plane record carries
  `project_id` from day one. Retrofitting tenancy is not a v2 problem.

## Cross-references

- [`VISION.md`](VISION.md) — north star paragraph
- [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md) — the P1–P10 invariants
- [`EMA_V0_0_3_PREP.md`](EMA_V0_0_3_PREP.md) — build readiness
- [`GLEAM_NOTES.md`](GLEAM_NOTES.md) — language orientation
- [`research/GLEAM_BEAM_FIT.md`](research/GLEAM_BEAM_FIT.md) — capability survey
- [`research/COLLAB_PLANE_OPTIONS.md`](research/COLLAB_PLANE_OPTIONS.md) — Q2/Q8 substrate options
- [`research/parts/`](research/parts/) — per-part Gleam mappings (8 files)
- [`graph/edges/`](graph/edges/) — topic edges that derive from this architecture
- [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) — what's still open

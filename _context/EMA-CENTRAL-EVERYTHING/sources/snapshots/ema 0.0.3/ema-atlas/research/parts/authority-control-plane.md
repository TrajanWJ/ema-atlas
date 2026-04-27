# Authority / Control Plane — Gleam mapping

## Part summary

Authority is the bookkeeping layer that decides what counts as having
happened, who may make the next thing happen, and where the canonical
record of both lives. The Elixir tree at
`codebase-ema/code/ema/daemon/lib/ema/control_plane/` already runs an
append-only event log, a command bus, dispatch reconciliation, an
incidents split (authority/executor/policy), persistence, replay and a
host-transition log. The Gleam port preserves this shape but pushes the
identity-conflation problems (execution_id vs session_id vs
provider_session_id) into the type system rather than runtime guards.

## Type sketch

```gleam
import gleam/option.{type Option}
import gleam/dynamic.{type Dynamic}

pub opaque type ExecutionId { ExecutionId(String) }
pub opaque type SessionId { SessionId(String) }
pub opaque type ProviderSessionId { ProviderSessionId(String) }
pub opaque type MemberId { MemberId(String) }
pub opaque type ProjectId { ProjectId(String) }
pub opaque type WorkspaceArtifactId { WorkspaceArtifactId(String) }
pub opaque type PeerId { PeerId(String) }

pub type Placement {
  Local
  Daemon
  Peer(PeerId)
  HostAffinity(String)
}

pub type Actor {
  HumanActor(MemberId)
  AgentActor(MemberId)
  System
}

pub type Command {
  StartExecution(execution: ExecutionId, project: ProjectId,
                 by: Actor, placement: Placement)
  ApprovePlan(execution: ExecutionId, by: Actor)
  Handoff(execution: ExecutionId, from: Actor, to: Actor)
  RetireWorkstream(project: ProjectId, by: Actor, reason: String)
  RecordIncident(incident: IncidentRef, by: Actor)
}

pub type EventBody {
  ProposalProposed(execution: ExecutionId, project: ProjectId)
  ExecutionStarted(execution: ExecutionId, placement: Placement)
  DispatchUpdate(execution: ExecutionId, kind: DispatchKind)
  IncidentOpened(incident: IncidentRef, severity: Severity)
  HostTransition(from_host: String, to_host: String)
}

pub type Event {
  Event(seq: Int, at_ms: Int, by: Actor,
        body: EventBody, payload: Dynamic)
}

pub type DispatchKind { Queued Running Stalled Completed Failed }
pub type Severity { Info Warn Error Critical }
pub type IncidentRef { IncidentRef(String) }
```

## Actor sketch

```gleam
// gleam_otp 1.x style
import gleam/erlang/process.{type Subject}
import gleam/otp/actor

pub type EventLogMsg {
  Append(event: Event, reply_to: Subject(Result(Int, AppendError)))
  Recent(limit: Int, reply_to: Subject(List(Event)))
  ReplayFrom(seq: Int, reply_to: Subject(List(Event)))
}

pub fn start_event_log() -> Result(Subject(EventLogMsg), actor.StartError)
```

Modules and their Subjects:

- `ema/control_plane/event_log` — owns `Subject(EventLogMsg)`. Appends
  go to disk via FFI to `:dets` or `sqlight` then to an in-memory ring
  for `recent`. Maps to Elixir `Ema.ControlPlane.EventLog` and
  `Ema.ControlPlane.Persistence`.
- `ema/control_plane/store` — `Subject(StoreMsg)` snapshots projected
  state. Maps to `Ema.ControlPlane.Store`.
- `ema/control_plane/command_bus` — `Subject(CommandMsg)` validates
  Commands then either rejects or appends to the log. Maps to
  `Ema.ControlPlane.Command`.
- `ema/control_plane/dispatch_reconciler` — periodic actor that
  diffs declared dispatches against runtime; `Subject(ReconcileTick)`.
  Maps to `Ema.ControlPlane.DispatchReconciler`.
- `ema/control_plane/replay` — stateless functions over the log; no
  actor of its own. Maps to `Ema.ControlPlane.Replay`.
- `ema/control_plane/host_transition_log` — own log, separate
  Subject. Maps to `Ema.ControlPlane.HostTransitionLog`.
- `ema/control_plane/incidents/{authority,executor,policy}` — three
  small actors mirroring the Elixir split.

All of these slot under one `control_plane/supervisor` (rest_for_one
so a crashed event_log restarts everyone downstream).

## Supervision tree fragment

```text
root_supervisor (one_for_one)
└── control_plane/supervisor (rest_for_one)
    ├── event_log
    ├── persistence
    ├── store
    ├── command_bus
    ├── execution_supervisor   (dynamic; per-run children)
    ├── dispatch_reconciler
    ├── replay                  (library; not a child)
    ├── host_transition_log
    └── incidents/supervisor (one_for_one)
        ├── incidents/authority
        ├── incidents/executor
        └── incidents/policy
```

## Where it leans on Erlang/Elixir interop

- `:sqlight` (via the `sqlight` Hex package) for the append-only event
  table. If FTS or migrations are needed, fall through to
  `:erlang.apply(:mnesia, ...)` or raw `:esqlite3`.
- `:gen_server.call/3` is the underlying mechanism for every
  `process.call`; we wrap it but cite it because timeouts and `noproc`
  are still raw `:exit` signals.
- `:erlang.monitor/2` to watch dynamic execution children from the
  reconciler.
- `:erlang.system_time(:millisecond)` for `at_ms` in events (Gleam has
  `gleam/erlang` but the underlying call is the Erlang BIF).
- `Phoenix.PubSub` is gone; replace with a Gleam-side fan-out actor or
  FFI to `:pg` (process groups) for the daemon-internal bus.
- JSON encode/decode via `gleam_json`; for legacy JSON envelopes
  produced by the Elixir tree, FFI to `:jsone` or `:jsx`.

## Tests this part needs at v0.0.3

- Property test (`gleam_qcheck`): for any list of `Command` values that
  pass `command_bus.validate`, the resulting event sequence is
  monotonic in `seq` and replayable to the same `Store` snapshot.
- Example test: `ExecutionId` and `SessionId` cannot be passed to each
  other's constructors; this is a *compile-fail* fixture under
  `test/typecheck/`.
- Round-trip test: write one of each EventBody variant, persist to
  sqlight, restart the event_log actor, replay; recovered events equal
  originals byte-for-byte.
- Reconciler test: declare a dispatch, kill the execution child via
  `:erlang.exit(pid, :kill)`, assert reconciler emits `Stalled` then
  `Failed` within N ticks.
- Incident split test: opening an authority incident does not write
  into the executor incident store, and vice versa.
- Startup-order test: the supervisor starts `event_log` before
  `command_bus`; killing `event_log` restarts `command_bus` (rest_for_one
  semantics verified via `process.monitor`).

## Open questions specific to Gleam mapping

- **Q1** — without first-class agent `MemberId`, the `Actor` sum
  collapses to `HumanActor` only, and every event from an agent has to
  be re-attributed at write time. Concrete pressure: `command_bus`
  cannot currently type-check "this command came from an agent" at all.
- **Q2 / Q8** — with no Gleam-native CRDT lib (per the repo's
  `GLEAM_BEAM_FIT.md` note), do we FFI Riak DT, build a minimal
  append-only log under sqlight, or wrap a Yjs/Automerge node-side
  process? Each choice changes whether `EventLog` is the only writer
  or one of two writers. Q2/Q8 still open.
- **Q5** — until the harness contract is picked, `EventBody` cannot
  close over `DispatchKind` payloads; today they are `Dynamic`, which
  defeats half the typing leverage of moving to Gleam.
- **Q9** — `Placement.Peer(PeerId)` is typeable today but no constructor
  in `command_bus` should accept it; we need a `placement_guard` that
  rejects `Peer(_)` at runtime with a "deferred" error per gate #6 of
  EMA_V0_0_3_PREP.md.
- **Q10** — without a permission model, the `by: Actor` field is
  decorative; `command_bus.validate` cannot check authority.

## Read next

- `graph/edges/authority.md`, `graph/edges/recovery.md`
- `content/briefs/authority-control-plane.md`
- `codebase-ema/code/ema/daemon/lib/ema/control_plane/{event_log,store,replay,dispatch_reconciler,persistence,command}.ex`
- `EMA_V0_0_3_PREP.md` gates #1, #2, #3, #4, #6
- `OPEN_QUESTIONS.md` Q1, Q2, Q5, Q9, Q10
- Gleam OTP: https://hexdocs.pm/gleam_otp/

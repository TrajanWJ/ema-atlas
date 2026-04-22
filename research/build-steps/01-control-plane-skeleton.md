# Step 1 — Control plane skeleton

> **Goal:** stand up the typed authority spine — `event_log` writer,
> in-memory `store`, persistence behind sqlight, a `command_bus` that
> appends validated `Command`s, and a `replay` function — with a
> `rest_for_one` supervisor and the six identity-id opaque types from
> `02-project-transfer-brief.md` §11. Everything else in v0.0.3 hangs
> off this. 1-2 sentences, done.
>
> **Depends on:** nothing. This is the *first* thing to write in v0.0.3,
> matching `EMA_V0_0_3_PREP.md` "Carries forward" #1 ("Append-only
> event_log as the spine of authority") and gate #1 of the verification
> gates.
>
> **Open questions held open:**
> - **Q1** (agent-as-Member). This step types `Actor` as
>   `HumanActor(MemberId) | AgentActor(MemberId) | System` *but*
>   `command_bus.validate` does not yet check that `AgentActor(_)` came
>   from a registered agent — Step 2 (identity registry) does. Coded
>   assumption: any `MemberId` is provisionally valid; validation is
>   deferred.
> - **Q5** (harness contract surface). `EventBody.DispatchUpdate`
>   carries a `payload: Dynamic` until Step 3 freezes the driver
>   contract. Coded assumption: `DispatchUpdate` round-trips byte-for-byte
>   via `gleam_json` even though the payload is opaque.
> - **Q9** (replication boundary). `Placement.Peer(PeerId)` is typeable
>   here but `command_bus.validate` rejects it at runtime with a
>   `Deferred` error per gate #6 of `EMA_V0_0_3_PREP.md`. No coded
>   assumption beyond "rejection is loud."
> - **Q10** (org/space → runtime perms). `Command.by: Actor` is
>   decorative until Step 2 lands `policy.Evaluate`. Coded assumption:
>   every command is allowed.

## What this step produces

Concrete Gleam modules under `apps/ema/src/ema_control_plane/`:

- `ids.gleam` — opaque `ExecutionId`, `SessionId`, `ProviderSessionId`,
  `MemberId`, `ProjectId`, `WorkspaceArtifactId`, `PeerId` (six + one).
- `event.gleam` — `Event`, `EventBody`, `Actor`, `Severity`,
  `IncidentRef`, `DispatchKind`.
- `event_log.gleam` — actor; owns `Subject(EventLogMsg)`.
- `persistence.gleam` — sqlight handle owner; one append + one range
  read function. Hidden from non-control-plane callers.
- `store.gleam` — projection actor; folds events into a snapshot.
- `command.gleam` — `Command` sum + `validate` function.
- `command_bus.gleam` — actor that calls `validate` then `event_log.append`.
- `replay.gleam` — pure functions over the persistence handle (no actor).
- `supervisor.gleam` — `static_supervisor` builder, `RestForOne`.

Plus tests under `apps/ema/test/ema_control_plane/`:

- `event_log_roundtrip_test.gleam`
- `command_bus_test.gleam`
- `replay_test.gleam`
- `placement_guard_test.gleam`
- `id_separation_test.gleam` (compile-fail fixtures referenced from
  `apps/ema/test/typecheck/`)

## Type sketches

```gleam
import gleam/dynamic.{type Dynamic}
import gleam/option.{type Option}
import gleam/erlang/process.{type Subject}
import gleam/otp/actor

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

pub type DispatchKind {
  Queued
  Running
  Stalled
  Completed
  Failed
}

pub type Severity { Info Warn Error Critical }
pub type IncidentRef { IncidentRef(String) }

pub type EventBody {
  ProposalProposed(execution: ExecutionId, project: ProjectId)
  ExecutionStarted(execution: ExecutionId, placement: Placement)
  DispatchUpdate(execution: ExecutionId, kind: DispatchKind)
  IncidentOpened(incident: IncidentRef, severity: Severity)
  HostTransition(from_host: String, to_host: String)
}

pub type Event {
  Event(seq: Int, at_ms: Int, by: Actor, body: EventBody, payload: Dynamic)
}

pub type Command {
  StartExecution(
    execution: ExecutionId,
    project: ProjectId,
    by: Actor,
    placement: Placement,
  )
  ApprovePlan(execution: ExecutionId, by: Actor)
  Handoff(execution: ExecutionId, from: Actor, to: Actor)
  RetireWorkstream(project: ProjectId, by: Actor, reason: String)
  RecordIncident(incident: IncidentRef, by: Actor)
}

pub type AppendError {
  PersistenceFailed(reason: String)
  Deferred(reason: String)
}

pub type EventLogMsg {
  Append(event: Event, reply_to: Subject(Result(Int, AppendError)))
  Recent(limit: Int, reply_to: Subject(List(Event)))
  ReplayFrom(seq: Int, reply_to: Subject(List(Event)))
}

pub fn start_event_log() -> Result(Subject(EventLogMsg), actor.StartError)
```

## Module layout

```
apps/ema/src/
└── ema_control_plane/
    ├── ids.gleam              -- (no Elixir analog; this is the v0.0.3 typing leverage)
    ├── event.gleam            -- cf. lineage-original-elixir-ema/code/daemon/lib/ema/control_plane/event_log.ex (record shape)
    ├── event_log.gleam        -- cf. lineage-original-elixir-ema/code/daemon/lib/ema/control_plane/event_log.ex
    ├── persistence.gleam      -- cf. lineage-original-elixir-ema/code/daemon/lib/ema/control_plane/persistence.ex
    ├── store.gleam            -- cf. lineage-original-elixir-ema/code/daemon/lib/ema/control_plane/store.ex
    ├── command.gleam          -- cf. lineage-original-elixir-ema/code/daemon/lib/ema/control_plane/command.ex
    ├── command_bus.gleam      -- cf. lineage-original-elixir-ema/code/daemon/lib/ema/control_plane/command.ex
    ├── replay.gleam           -- cf. lineage-original-elixir-ema/code/daemon/lib/ema/control_plane/replay.ex
    └── supervisor.gleam       -- cf. lineage-original-elixir-ema/code/daemon/lib/ema/control_plane/supervisor.ex
```

The Elixir originals were verified via
`git show origin/lineage-original-elixir-ema:code/daemon/lib/ema/application.ex`,
which boots `Ema.ControlPlane.Supervisor` *after* `Ema.Repo` and
`Ema.Workspace.Supervisor` and *before* `Ema.Sessions.Monitor`. Step 1
preserves that ordering: control_plane comes up before any subsystem
that reads events.

## Supervision tree fragment

```text
root_supervisor (one_for_one)
└── ema_control_plane/supervisor (rest_for_one)
    ├── persistence            -- owns the sqlight handle; everyone reads it
    ├── event_log              -- single writer; depends on persistence
    ├── store                  -- subscribes to event_log; folds projection
    └── command_bus            -- validates + delegates to event_log
```

`rest_for_one` is deliberate per
`research/parts/authority-control-plane.md`: a crashed `event_log`
restarts everything downstream so no command is ever appended without
a healthy store and command_bus pair.

## Acceptance criteria (testable)

1. `event_log.start/0` returns a healthy `Subject(EventLogMsg)` and
   `Append(_, reply)` returns `Ok(seq)` with monotonically increasing
   `seq` across N appends.
2. Killing the `event_log` actor (`process.kill`) restarts `store` and
   `command_bus` (verified with `process.monitor` in test).
3. `command_bus.route(StartExecution(..., placement: Peer(_)))` returns
   `Error(Deferred(...))` and does **not** write to the log.
4. `replay.from(0)` after one of each `EventBody` variant has been
   appended returns events equal byte-for-byte to what was written
   (round-trip through sqlight).
5. The compile-fail fixture `test/typecheck/id_swap.gleam` does not
   compile when `SessionId` is passed where `ExecutionId` is expected
   (verified by the build script asserting non-zero `gleam build` exit).
6. `store.snapshot()` after appending one `ExecutionStarted` and one
   `DispatchUpdate(_, Completed)` reports the execution as `Completed`.
7. The supervisor builds via `static_supervisor.add_child` calls in the
   order persistence → event_log → store → command_bus and rejects out-of-order
   construction (test inspects child specs).
8. A startup-order test instantiates the whole subtree and asserts
   `event_log` is alive before `command_bus` accepts its first message.

## Property tests (gleam_qcheck)

1. **Monotonic seq.** For any list of `Event` values appended via
   `event_log.append`, the returned `seq` values are strictly
   increasing and contiguous from the last persisted seq.
2. **Replay equals append.** For any list of `Command` values that pass
   `command.validate`, `replay.from(0)` after running them yields a
   `Store` snapshot equal to one built by folding the same `Event`s
   in memory (matches the property test in
   `research/parts/authority-control-plane.md`).
3. **Placement guard total.** For every generated `Command`, exactly
   one of `{Ok(_), Error(Deferred(_)), Error(PersistenceFailed(_))}` is
   returned by `command_bus.route` — never a crash, never a silent drop.

## What gets stubbed (and why)

- **`incidents/{authority,executor,policy}` actors** — shape declared
  in `event.gleam` (`IncidentOpened`) but no actors yet; deferred to a
  later step that lands the three-way incident split. Stub: writing
  `IncidentOpened` is allowed; reading is via `replay` only.
- **`dispatch_reconciler`** — the periodic actor in the Elixir tree
  (`control_plane/dispatch_reconciler.ex`) is not in Step 1 because it
  needs the driver registry (Step 3) to know what "running" means. Stub:
  none — the reconciler simply doesn't exist yet.
- **`host_transition_log`** — `EventBody.HostTransition` typeable;
  separate log actor deferred. Stub: `HostTransition` is appended into
  the main `event_log` provisionally; the split lands later.
- **Agent-actor validation** — see Q1 above. `command_bus.validate`
  treats `AgentActor(_)` as opaque. Step 2 will tighten this.
- **`payload: Dynamic` on Event** — see Q5. Stays `Dynamic` until Step 3
  freezes the driver contract; encoder/decoder pair is hand-written per
  `EventBody` variant via `gleam_json` and `gleam/dynamic/decode`.
- **HTTP endpoint reproducing `AGENT-CONTRACT.md`** — gate #1 of
  `EMA_V0_0_3_PREP.md`; deferred. Step 1 exposes only the typed Gleam
  API. The HTTP shell lands last, matching the Elixir
  `EmaWeb.Endpoint`-is-last convention.

## Cross-references

- Brief: `content/briefs/authority-control-plane.md`
- Part mapping: `research/parts/authority-control-plane.md`
- Edge: `graph/edges/authority.md`, `graph/edges/recovery.md`
- Glossary: "Control-plane record", "Execution lineage"
- Howto: `howto/extract-doctrine-from-a-legacy-branch.md` (when
  porting the Elixir `event_log.ex` shape, do not copy code).
- Prep doc: `EMA_V0_0_3_PREP.md` "Carries forward" #1, gates #1, #2,
  #3, #4, #6.
- Elixir originals (verified):
  `lineage-original-elixir-ema/code/daemon/lib/ema/control_plane/{event_log,persistence,store,command,replay,supervisor}.ex`.
- `OPEN_QUESTIONS.md` Q1, Q5, Q9, Q10.

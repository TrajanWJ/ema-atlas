# Step 4 — Sessions + babysitter (porting OpenClaw doctrine)

> **Goal:** land typed sessions (`session_id` distinct from
> `execution_id` and `provider_session_id`), the per-run
> `execution/supervisor` (factory-supervisor of live drivers), and the
> babysitter family — `stream_ticker`, `chain_scheduler`,
> `takeover_manager`, `tick_router`, `command_router` — porting the
> takeover/heartbeat/cadence doctrine from
> `lineage-openclaw` and the existing Elixir babysitter into typed
> Gleam actors.
>
> **Depends on:** Step 1 (event_log + command_bus — babysitter writes
> `Handoff` commands and reads `DispatchUpdate` events), Step 2
> (identity registry — handoffs and lane ownership reference
> `MemberId`), Step 3 (driver registry — `execution/supervisor` spawns
> drivers via the registry).
>
> **Open questions held open:**
> - **Q1** (agent-as-Member). Coded assumption: `Lane.owner: Actor` and
>   `Handoff.{from,to}: Actor` accept `AgentActor(_)`. If Q1 resolves
>   "no", drift attribution to agents loses its typed hook.
> - **Q3** (Project ↔ Space cardinality). Coded assumption: Lanes are
>   keyed by `(ProjectId, LaneId)` only. If Q3 picks Spaces-span-projects,
>   the registry's `Dict(LaneId, Lane)` keying changes (per
>   `research/parts/coordination-environment.md`).
> - **Q5** (harness contract). Coded assumption: `DriverHeartbeat` from
>   Step 3's drivers reaches the takeover manager. If Q5 changes the
>   signature, the takeover manager falls back to wall-clock-only
>   deadlines (worse than Elixir behaviour, explicitly noted).
> - **Q6** (Discord mirror direction). Coded assumption: `tick_router`
>   does not yet ship a Discord webhook. The router fan-out is generic;
>   any Discord bridge attaches as another subscriber once Q6 settles.
> - **Q10** (org/space → runtime perms). Coded assumption:
>   `command_router.Route` accepts a `Handoff` on actor identity
>   alone; permission gating is deferred to a later wiring step.

## What this step produces

Concrete Gleam modules under `apps/ema/src/ema_sessions/` and
`apps/ema/src/ema_babysitter/`:

Sessions:
- `session.gleam` — `Session`, `SessionState`.
- `registry.gleam` — actor; `Subject(SessionRegistryMsg)` binding
  `ExecutionId ↔ SessionId ↔ Option(ProviderSessionId)`.
- `monitor.gleam` — shadow watcher actor.
- `supervisor.gleam` — `static_supervisor` for registry + monitor.

Execution:
- `execution_supervisor.gleam` — `factory_supervisor` of per-run
  driver children; `Subject(ExecutionSupervisorMsg)`.
- `run_actor.gleam` — wraps a single driver invocation, owns the
  `Subject(DriverEvent)` sink, forwards into `bridge_to_event_log`.

Babysitter:
- `lane.gleam`, `task.gleam`, `handoff.gleam`, `tick.gleam` — domain
  records.
- `stream_ticker.gleam` — cadence actor.
- `chain_scheduler.gleam` — lane/task queue actor.
- `takeover_manager.gleam` — `:gen_statem` candidate (per part doc).
- `tick_router.gleam` — fan-out via `:pg`.
- `command_router.gleam` — wraps Step 1's `command_bus.route`.
- `lane_registry.gleam` — `Dict(LaneId, Lane)` actor.
- `supervisor.gleam` — `one_for_one` for the five babysitter children
  + `lane_registry`.

Plus tests:

- `session_id_separation_test.gleam` (compile-fail fixture).
- `session_registry_test.gleam`
- `execution_supervisor_test.gleam`
- `takeover_test.gleam` (the OpenClaw doctrine test).
- `chain_scheduler_property_test.gleam`
- `tick_fanout_test.gleam`
- `handoff_as_command_test.gleam`
- `lane_lease_expiry_test.gleam`

## Type sketches

```gleam
import gleam/option.{type Option}
import gleam/erlang/process.{type Subject}
import ema_control_plane/ids.{
  type ExecutionId, type SessionId, type ProviderSessionId,
  type ProjectId, type MemberId,
}
import ema_control_plane/event.{type Actor, type Command}
import ema_drivers/envelope.{type DispatchEnvelope, type RunHandle}
import ema_drivers/events.{type DriverEvent}

pub type SessionState {
  SessionFresh
  SessionBound(execution: ExecutionId)
  SessionStalled(since_ms: Int)
  SessionRetired
}

pub type Session {
  Session(
    id: SessionId,
    state: SessionState,
    provider: Option(ProviderSessionId),
    project: ProjectId,
    actor: Actor,
  )
}

pub type SessionRegistryMsg {
  Bind(
    execution: ExecutionId,
    session: SessionId,
    provider: Option(ProviderSessionId),
  )
  Resolve(
    session: SessionId,
    reply_to: Subject(Option(ExecutionId)),
  )
  Retire(session: SessionId)
}

pub type ExecutionSupervisorMsg {
  Spawn(
    env: DispatchEnvelope,
    reply_to: Subject(Result(RunHandle, SpawnError)),
  )
  Cancel(handle: RunHandle, reply_to: Subject(Result(Nil, CancelError)))
}

pub type SpawnError {
  DriverNotFound
  DriverDeferred(reason: String)
  PolicyDenied(reason: String)
}

pub type CancelError { NotRunning }

pub opaque type LaneId { LaneId(String) }
pub opaque type TaskId { TaskId(String) }
pub opaque type HandoffId { HandoffId(String) }

pub type LaneStatus { Open Claimed Stalled Retired }

pub type Lane {
  Lane(
    id: LaneId,
    project: ProjectId,
    name: String,
    owner: Actor,
    lease_until_ms: Option(Int),
    status: LaneStatus,
  )
}

pub type TaskState { Queued InProgress Blocked Done Dropped }

pub type Task {
  Task(
    id: TaskId,
    lane: LaneId,
    title: String,
    assignee: Option(Actor),
    state: TaskState,
    created_at_ms: Int,
  )
}

pub type Handoff {
  Handoff(
    id: HandoffId,
    lane: LaneId,
    from: Actor,
    to: Actor,
    note: Option(String),
    at_ms: Int,
  )
}

pub type TickKind { Cadence Heartbeat Drift Checkup }

pub type Tick { Tick(at_ms: Int, kind: TickKind) }

pub type StreamTickerMsg {
  Subscribe(reply_to: Subject(Tick))
  SetCadence(ms: Int)
}

pub type ChainSchedulerMsg {
  Enqueue(lane: LaneId, task: TaskId)
  NextFor(actor: Actor, reply_to: Subject(Option(Task)))
}

pub type TakeoverManagerMsg {
  Watch(execution: ExecutionId, deadline_ms: Int)
  HeartbeatSeen(execution: ExecutionId, at_ms: Int)
}

pub type CommandRouterMsg {
  Route(cmd: Command, reply_to: Subject(Result(Nil, RouteError)))
}

pub type RouteError {
  RejectedDeferred(reason: String)
  RejectedPolicy(reason: String)
}
```

## Module layout

```
apps/ema/src/
├── ema_sessions/
│   ├── session.gleam              -- cf. lineage-original-elixir-ema/code/daemon/lib/ema/sessions/registry.ex (Session shape)
│   ├── registry.gleam             -- cf. lineage-original-elixir-ema/code/daemon/lib/ema/sessions/registry.ex
│   ├── monitor.gleam              -- cf. lineage-original-elixir-ema/code/daemon/lib/ema/sessions/monitor.ex
│   └── supervisor.gleam           -- cf. lineage-original-elixir-ema/code/daemon/lib/ema/sessions/supervisor.ex
├── ema_execution/
│   ├── execution_supervisor.gleam -- cf. lineage-original-elixir-ema/code/daemon/lib/ema/control_plane/execution_supervisor.ex
│   │                                  + lineage-original-elixir-ema/code/daemon/lib/ema/claude/task_supervisor.ex
│   └── run_actor.gleam            -- (no Elixir 1:1; folds runner.ex + shell.ex behaviours)
└── ema_babysitter/
    ├── lane.gleam                  -- (no Elixir analog; today markdown under workspace/shared/swarm/)
    ├── task.gleam                  -- (no Elixir analog)
    ├── handoff.gleam               -- (no Elixir analog)
    ├── tick.gleam                  -- cf. lineage-original-elixir-ema/code/daemon/lib/ema/babysitter/tick_router.ex (Tick shape)
    ├── stream_ticker.gleam         -- cf. lineage-original-elixir-ema/code/daemon/lib/ema/babysitter/stream_ticker.ex
    ├── chain_scheduler.gleam       -- cf. lineage-original-elixir-ema/code/daemon/lib/ema/babysitter/chain_scheduler.ex
    ├── takeover_manager.gleam      -- cf. lineage-original-elixir-ema/code/daemon/lib/ema/babysitter/takeover_manager.ex
    ├── tick_router.gleam           -- cf. lineage-original-elixir-ema/code/daemon/lib/ema/babysitter/tick_router.ex
    ├── command_router.gleam        -- cf. lineage-original-elixir-ema/code/daemon/lib/ema/babysitter/command_router.ex
    ├── lane_registry.gleam         -- (no Elixir analog)
    └── supervisor.gleam            -- shape mirrors the babysitter children list
                                          in lineage-original-elixir-ema/code/daemon/lib/ema/application.ex
                                          (verified via git show)
```

`git show origin/lineage-original-elixir-ema:code/daemon/lib/ema/application.ex`
boots, in order: `Ema.Sessions.Supervisor`, `Ema.ControlPlane.Supervisor`,
`Ema.Sessions.Monitor`, `Ema.Babysitter.StreamTicker`,
`Ema.Babysitter.ChainScheduler`, `Ema.Babysitter.TakeoverManager`. Step
4 preserves that ordering: sessions before execution_supervisor before
babysitter.

## Supervision tree fragment

```text
root_supervisor (one_for_one)
├── ema_control_plane/supervisor (rest_for_one)   -- Step 1
├── ema_identity/supervisor (rest_for_one)        -- Step 2
├── ema_drivers/supervisor (one_for_one)          -- Step 3
├── ema_sessions/supervisor (rest_for_one)
│   ├── registry
│   └── monitor
├── ema_execution/execution_supervisor            -- factory_supervisor
│   └── (dynamic) run_actor per ExecutionId
└── ema_babysitter/supervisor (one_for_one)
    ├── stream_ticker
    ├── chain_scheduler
    ├── takeover_manager
    ├── tick_router
    ├── command_router
    └── lane_registry
```

## Acceptance criteria (testable)

1. `sessions/registry.Bind(exec, sess, None)` followed by
   `Resolve(sess)` returns `Some(exec)`; `Resolve` of an unbound
   `SessionId` returns `None`.
2. The compile-fail fixture
   `test/typecheck/session_id_swap.gleam` does not compile when
   `SessionId` is passed to a function expecting `ExecutionId` or
   `ProviderSessionId` (extends Step 1's gate #4 fixture).
3. `execution_supervisor.Spawn(env)` for an envelope whose
   `DriverKind` is `PeerRemote` returns
   `Error(DriverDeferred("peer-remote not implemented"))` and does
   not start a child.
4. `execution_supervisor.Spawn(env)` for `SimulatedTui` starts a
   `run_actor` whose `DriverEvent` stream lands as
   `EventBody.DispatchUpdate` records on Step 1's `event_log`.
5. **Takeover doctrine test (the OpenClaw port).** Register a
   `simulated_tui` execution with `Watch(exec, deadline_ms: 500)`.
   Send no `HeartbeatSeen`. Assert `takeover_manager` issues a
   `Handoff` command into `command_router` within 1s, and the
   command appears in `event_log` as `EventBody.DispatchUpdate(_,
   Stalled)` followed by a `Command.Handoff(_, _, _)` append.
6. `chain_scheduler.NextFor(actor)` after N `Enqueue` calls returns
   each enqueued `(lane, task)` pair exactly once across N+1 calls.
7. `tick_router` fan-out: subscribe N actors, publish 10 ticks via
   `stream_ticker`, assert each subscriber receives all 10 in
   monotonic `at_ms` order.
8. **Handoff-as-command test.** Editing a markdown file under
   `workspace/shared/handoffs/` does **not** mutate
   `lane_registry`'s `Lane.owner`; only a `Handoff` command via
   `command_router` does. (Matches the gate from
   `research/parts/coordination-environment.md`.)
9. Lane lease expiry: a `Lane` with `lease_until_ms` in the past is
   reported as `Open` by the registry on the next `Cadence` tick.
10. Killing the `run_actor` for an execution causes
    `sessions/monitor` to mark the bound `SessionState` as
    `SessionStalled(_)` within 1s.

## Property tests (gleam_qcheck)

1. **No loss, no duplication in `chain_scheduler`.** For any sequence
   of `Enqueue`/`NextFor` interleavings, every enqueued `(lane, task)`
   pair is returned exactly once across `NextFor` calls (matches
   the property in `research/parts/coordination-environment.md`).
2. **Ticks are monotonic at every subscriber.** For any subscriber
   set and any `tick_router.PublishTick` sequence, each subscriber's
   received `Tick.at_ms` values are non-decreasing.
3. **Session binding is one-to-one.** For any `Bind` sequence, every
   `SessionId` resolves to at most one `ExecutionId`, and every
   `ExecutionId` is referenced by at most one `SessionId` — the
   registry rejects double-binds with a typed error rather than
   silently overwriting.

## What gets stubbed (and why)

- **Discord webhook subscriber on `tick_router`** — Q6 deferred. Stub:
  `tick_router` is generic fan-out; no Discord adapter ships.
- **Permission gating on `command_router.Route`** — Q10 deferred. Stub:
  router calls Step 1's `command_bus.route` directly; identity-based
  authorization happens in a later step.
- **`takeover_manager` as `:gen_statem`** — `research/parts/harness-execution.md`
  flags `:gen_statem` as the natural fit. Step 4 ships a plain
  `gleam/otp/actor` first; the FFI to `:gen_statem` is a refactor when
  per-state timeouts become unwieldy. Stub: timeouts via
  `:erlang.send_after`.
- **`tick_router` fan-out via `:pg`** — `research/parts/coordination-environment.md`
  recommends `:pg` (process groups). Step 4 ships per-subscriber
  Subjects first (typed but not as scalable); FFI to `:pg` is a
  follow-up. Stub: `Dict(MemberId, Subject(Tick))`.
- **`stream/{manager,babysitter}` (the stream-of-consciousness
  layer)** — present in the Elixir `application.ex` but deferred. Stub:
  no module; `DriverChunk` events pass through `bridge_to_event_log`
  only.
- **`workspace/shared/handoffs/` filesystem mirror** — the markdown
  side of handoffs lives in the workspace overlay, which is its own
  step. Stub: handoffs are typed records in `lane_registry`; rendering
  to markdown is deferred.
- **`provider_session_id` enforcement** — `Bind` accepts
  `Option(ProviderSessionId)` but Step 4 does not yet validate that
  the surface seam (`X-Hermes-Session-Id`) round-trips it; Step 3's
  `hermes_native` passes the header through as `String`. Typed
  enforcement waits until the HTTP endpoint lands.

## Cross-references

- Brief: `content/briefs/harness-execution.md`,
  `content/briefs/coordination-environment.md`
- Part mappings: `research/parts/harness-execution.md`,
  `research/parts/coordination-environment.md`
- Edge: `graph/edges/orchestration.md`, `graph/edges/recovery.md`,
  `graph/edges/execution.md`
- Glossary: "Babysitter", "Session", "Handoff", "Lane",
  "Takeover Manager"
- Howto: `howto/extract-doctrine-from-a-legacy-branch.md` (the
  OpenClaw takeover doctrine is mined as principles, not code copied).
- Prep doc: `EMA_V0_0_3_PREP.md` "Carries forward" bullets on
  babysitter and sessions; gates #4, #5, #9.
- Elixir originals (verified via
  `git show origin/lineage-original-elixir-ema:code/daemon/lib/ema/application.ex`):
  `lineage-original-elixir-ema/code/daemon/lib/ema/sessions/{registry,supervisor,monitor}.ex`,
  `lineage-original-elixir-ema/code/daemon/lib/ema/babysitter/{stream_ticker,chain_scheduler,takeover_manager,tick_router,command_router,channel_policy,stream_channels,tick_renderer}.ex`,
  `lineage-original-elixir-ema/code/daemon/lib/ema/control_plane/execution_supervisor.ex`.
- OpenClaw doctrine source: `lineage-openclaw` (per
  `EMA_V0_0_3_PREP.md` gate #9 reference).
- `OPEN_QUESTIONS.md` Q1, Q3, Q5, Q6, Q10.

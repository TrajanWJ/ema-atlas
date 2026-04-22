# Coordination / Agent Environment — Gleam mapping

## Part summary

Coordination is the layer that turns "many agents and humans moving at
once" into something humans can stay on top of: lanes, tasks, queues,
handoffs, checkups, weekly phases, focus blocks. The Elixir tree
already runs the babysitter family (chain_scheduler, command_router,
takeover_manager, tick_router, tick_renderer) and a control-plane
dispatch_reconciler; actor cards, handoffs, and swarm state live as
typed-but-loose markdown under `workspace/shared/`. The Gleam port
keeps the babysitter as long-running actors and lifts lane/handoff
into typed objects so "transfer ownership" becomes a typed Command,
not an ad-hoc file edit.

## Type sketch

```gleam
import gleam/option.{type Option}

pub opaque type LaneId { LaneId(String) }
pub opaque type TaskId { TaskId(String) }
pub opaque type HandoffId { HandoffId(String) }

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

pub type LaneStatus { Open Claimed Stalled Retired }

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

pub type TaskState { Queued InProgress Blocked Done Dropped }

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

pub type Tick {
  Tick(at_ms: Int, kind: TickKind)
}

pub type TickKind { Cadence Heartbeat Drift Checkup }
```

## Actor sketch

```gleam
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

pub type TickRouterMsg {
  PublishTick(tick: Tick)
  Subscribe(actor: Actor, reply_to: Subject(Tick))
}
```

- `ema/babysitter/stream_ticker` — `Subject(StreamTickerMsg)`. Maps to
  `Ema.Babysitter.StreamTicker`.
- `ema/babysitter/chain_scheduler` — `Subject(ChainSchedulerMsg)`.
  Maps to `Ema.Babysitter.ChainScheduler`.
- `ema/babysitter/takeover_manager` — `Subject(TakeoverManagerMsg)`.
  Maps to `Ema.Babysitter.TakeoverManager`. This is the `:gen_statem`
  candidate (explicit state, deadlines, takeover decisions).
- `ema/babysitter/command_router` — `Subject(CommandRouterMsg)`. Maps
  to `Ema.Babysitter.CommandRouter`.
- `ema/babysitter/tick_router` — `Subject(TickRouterMsg)`. Maps to
  `Ema.Babysitter.TickRouter`.
- `ema/coordination/lane_registry` — new for v0.0.3,
  `Subject(LaneRegistryMsg)` over a `Dict(LaneId, Lane)`. No Elixir
  analog; today lanes live as markdown under `workspace/shared/swarm/`.
- `ema/coordination/handoff_log` — wraps `event_log` writes for
  `Handoff` commands. No standalone actor; a thin module on top of
  `command_bus`.

## Supervision tree fragment

```text
root_supervisor
├── babysitter/supervisor (one_for_one)
│   ├── stream_ticker
│   ├── chain_scheduler
│   ├── takeover_manager
│   ├── tick_router
│   └── command_router
└── coordination/supervisor (one_for_one)         # NEW
    └── lane_registry
```

`coordination/supervisor` boots after `control_plane/supervisor` (it
needs `command_bus` to register `Handoff` as a typed command) and
after `babysitter/supervisor` (it subscribes to `tick_router` for
`Drift` and `Checkup` ticks).

## Where it leans on Erlang/Elixir interop

- `:gen_statem` for `takeover_manager` — Gleam's `gleam/otp/actor`
  models a single state with messages, but `:gen_statem` is the
  natural fit for "running → stalled → taken_over → released" with
  per-state timeouts. FFI via `gleam/erlang/atom` and an Erlang shim
  module.
- `:timer.send_interval/2` for cadence ticks (or use the Gleam
  `gleam_erlang.send_after` wrapper, which calls `:erlang.send_after`).
- `:pg` (process groups) for `tick_router` fan-out to many subscribers
  without a per-subscriber Subject.
- `:erlang.monitor(:process, pid)` to drop dead subscribers from
  `tick_router` without leaking entries.
- `:calendar` and `:erlang.system_time/1` for the weekly-phase /
  focus-block calendar derivations.

## Tests this part needs at v0.0.3

- Property test (`gleam_qcheck`): for any sequence of
  `Enqueue`/`NextFor` calls, every enqueued `(lane, task)` pair is
  returned exactly once across `NextFor` calls (no loss, no
  duplication).
- Takeover test: register an execution with a 500ms deadline, send no
  `HeartbeatSeen`, assert `takeover_manager` issues a `Handoff`
  command into `command_router` within 1s.
- Handoff-as-command test: editing a markdown file in
  `workspace/shared/handoffs/` does *not* change `Lane.owner`; only a
  `Handoff` command via `command_router` does.
- Tick fan-out test: subscribe N actors to `tick_router`, publish 10
  ticks, assert each subscriber sees all 10 in order.
- Drift detector test: a lane in `Claimed` status with no owning
  execution heartbeat for N ticks emits a `Drift` tick that the
  planner surface can pick up.
- Lane lease expiry test: a `Lane` with `lease_until_ms` in the past
  is reported as `Open` by the registry on the next tick, even
  without an explicit release.

## Open questions specific to Gleam mapping

- **Q1** — `Lane.owner: Actor` and `Handoff.{from,to}: Actor` need
  agents as first-class members. Without Q1, every agent owner is a
  `HumanActor(MemberId)` placeholder and drift attribution is wrong.
- **Q3** — if Spaces can span projects, `Lane` needs `space:
  Option(SpaceId)` and `chain_scheduler.NextFor` becomes a join
  rather than a lookup. Concrete pressure: the registry's
  `Dict(LaneId, Lane)` has to become a `Dict((ProjectId, SpaceId),
  Lane)` keyed differently.
- **Q5** — until the harness contract is picked, `Tick.kind =
  Heartbeat` cannot reliably arrive from drivers; the takeover
  manager has to fall back to wall-clock-only deadlines, which is
  worse than the current Elixir behaviour.
- **Q6** — Discord mirror direction decides whether
  `coordination/supervisor` ships an outbound webhook actor, an
  inbound bridge, or both. Today the Gleam tree has neither.
- **Q10** — "personal AI may move my tasks" is a permission decision
  that `command_router.Route` cannot enforce until org/space →
  runtime permission mapping exists. Without Q10 every `Handoff`
  command is accepted on actor identity alone.

## Read next

- `graph/edges/orchestration.md`, `graph/edges/workspace.md`,
  `graph/edges/authority.md`
- `content/briefs/coordination-environment.md`
- `codebase-ema/code/ema/daemon/lib/ema/babysitter/*.ex`
- `codebase-ema/code/ema/docs/REVIEW-GOVERNANCE-QUEUE-SPEC.md`
- `codebase-ema/code/ema/workspace/shared/swarm/CURRENT_STATE_*.md`
- `OPEN_QUESTIONS.md` Q1, Q3, Q5, Q6, Q10
- Erlang `:gen_statem`: https://www.erlang.org/doc/man/gen_statem.html

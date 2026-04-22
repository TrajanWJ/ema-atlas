# claude-a3 — OTP supervision sketch

- owner: claude-a3
- created_at: 2026-04-21T04:47Z
- status: draft
- scope: Clock + session supervision + cadence workers + shared-workspace watch/index boundary

## Thesis

EMA should treat time, sessions, and workspace indexing as three different authority domains inside OTP:

1. **Clock/cadence runtime** is supervised live state that decides when things should wake up.
2. **Session runtime** is supervised live state that owns active execution/session facts and process lifecycle.
3. **Workspace watch/index** is an **overlay cache** over markdown collaboration files, useful for discovery and CLI views, but never the canonical source of durable truth.

That separation matters because the repo already distinguishes:

- canonical truth in canon/docs/git-tracked records
- runtime truth in daemon/control-plane/supervised state
- shared workspace truth as temporary operational coordination

The OTP tree should make those boundaries explicit instead of relying on convention alone.

---

## What already exists

The current daemon already has the beginnings of the relevant shape:

- `Ema.Babysitter.StreamTicker` — long-lived cadence/tick GenServer
- `Ema.Babysitter.ChainScheduler` — named autonomous chain scheduler above the ticker
- `Ema.Sessions.Supervisor` + `Ema.Sessions.Registry` — runtime authority over execution/session facts
- `Ema.Surfaces.Supervisor` — `Registry` + `DynamicSupervisor` for Claude/Codex session processes
- `Ema.Surfaces.HostTruthWatcher` — periodic watcher pattern
- `Ema.SecondBrain.Indexer` — useful example of a supervised indexer/cache that is not itself the source of truth

So v1 should extend that direction rather than invent a radically different model.

---

## Proposed supervision tree sketch

```text
Ema.Application
└── Ema.Runtime.Supervisor                              (rest_for_one)
    ├── Ema.Clock.Supervisor                            (one_for_one)
    │   ├── Ema.Clock.Monotonic                         (GenServer)
    │   ├── Ema.Clock.CadenceRegistry                   (Registry)
    │   ├── Ema.Clock.CadenceSupervisor                 (DynamicSupervisor)
    │   └── Ema.Clock.TickBroadcaster                   (GenServer / PubSub bridge)
    │
    ├── Ema.Sessions.Supervisor                         (rest_for_one)
    │   ├── Ema.Sessions.Registry                       (GenServer)
    │   ├── Ema.Sessions.FactCache                      (ETS owner GenServer)
    │   ├── Ema.Sessions.SessionSupervisor              (DynamicSupervisor)
    │   ├── Ema.Sessions.HeartbeatWatcher               (GenServer)
    │   └── Ema.Sessions.Monitor                        (GenServer)
    │
    ├── Ema.Workspace.Supervisor                        (rest_for_one)
    │   ├── Ema.Workspace.Registry                      (Registry)
    │   ├── Ema.Workspace.WatchSupervisor               (DynamicSupervisor)
    │   ├── Ema.Workspace.IndexSupervisor               (DynamicSupervisor)
    │   ├── Ema.Workspace.IndexStore                    (ETS owner GenServer)
    │   ├── Ema.Workspace.ChangeBus                     (GenServer / PubSub bridge)
    │   └── Ema.Workspace.Reconcile                     (periodic GenServer)
    │
    ├── Ema.ControlPlane.Supervisor
    ├── Ema.Surfaces.Supervisor
    └── Phoenix / endpoint / API layer
```

### Why this shape

- **Clock** is a reusable runtime service, not just a feature of babysitter streams.
- **Sessions** need their own subtree because session process lifecycle and session fact ownership are tightly coupled.
- **Workspace** watchers/indexers should be restartable and disposable without poisoning session or canonical runtime state.
- `rest_for_one` is appropriate where downstream children depend on upstream registries/ETS stores being alive.

---

## 1. Clock supervision sketch

## Responsibility

The Clock layer should own:

- current monotonic/UTC tick source
- registration of cadence jobs
- scheduling/unscheduling cadence workers
- emitting wake-up events onto PubSub
- enforcing cadence bounds and jitter
- avoiding ad hoc `Process.send_after` usage across unrelated modules

Right now `StreamTicker` and `ChainScheduler` already do part of this, but v1 benefits from making “clock” an explicit runtime domain.

## Suggested modules

### `Ema.Clock.Monotonic`
A small GenServer that centralizes:

- monotonic time reads
- UTC now snapshots
- coarse drift/health checks
- optional heartbeat event emission

This is not because BEAM cannot read time directly, but because EMA will likely want one place for:

- deterministic tests
- synthetic/manual time injection later
- common clock health reporting

### `Ema.Clock.CadenceRegistry`
A `Registry` for named cadence workers:

- `{:cadence, cadence_ref}`
- `{:schedule_window, ref}`
- `{:agenda_tick, actor_id}`
- `{:workspace_reconcile, scope}`

This allows all cadence-triggered jobs to be addressable without conflating them with sessions.

### `Ema.Clock.CadenceSupervisor`
A `DynamicSupervisor` for worker-per-cadence processes.

Each cadence worker should be a lightweight GenServer that owns:

- cadence_ref
- schedule bounds
- next_fire_at
- policy metadata
- last_fire_at
- last_result
- target callback or PubSub target

This is a better fit than one giant scheduler if EMA expects many named, inspectable, start/stop/resumable cadences.

### `Ema.Clock.TickBroadcaster`
A single bridge that takes internal cadence events and emits PubSub topics like:

- `clock:tick`
- `clock:cadence:<cadence_ref>`
- `clock:window:<window_ref>`
- `agenda:tick:<actor_id>`

That keeps workers simple and gives other subsystems a clean subscription surface.

---

## 2. Cadence workers

## Cadence worker model

A cadence worker should represent a **runtime interpretation** of a timing policy, not the policy definition itself.

That distinction is critical:

- **canonical timing definition** may live in frontmatter / canon / proposal / execution metadata
- **runtime cadence worker** is the currently running BEAM process enforcing it
- **workspace schedules** may suggest local time blocks but should only become runtime cadences once admitted by the daemon

## Worker responsibilities

Each cadence worker should:

- receive a normalized `cadence_ref`
- resolve effective interval from:
  - canonical schedule window if available
  - runtime override if present
  - workspace overlay hint if allowed
- clamp into valid bounds
- schedule its next tick
- emit an event or invoke a callback target
- record minimal runtime metadata in ETS / session or clock cache
- survive transient handler failures with backoff

## Worker state sketch

```elixir
%{
  cadence_ref: "cadence:actor/hermes-a4/review-loop",
  source: :canonical | :workspace_overlay | :runtime_override,
  lane: :operator_rollup,
  phase: :active,
  requested_interval_ms: 60_000,
  effective_interval_ms: 90_000,
  jitter_ms: 1_500,
  next_fire_at: ~U[...],
  last_fire_at: ~U[...],
  target: {:pubsub, "agenda:tick:hermes-a4"},
  status: :running,
  last_result: :ok
}
```

## Failure stance

Cadence worker failure should **not** imply schedule loss in canon.

On crash:

- worker restarts from supervisor
- worker rehydrates from runtime admission state
- if admission state is missing, worker stops cleanly and emits a warning event
- canonical schedule definitions remain untouched

This preserves the authority boundary: runtime process death is not a truth rewrite.

---

## 3. Session supervision sketch

## Core split

Session runtime should be split into:

1. **session fact authority**
2. **session process lifecycle**
3. **session liveness/heartbeat observation**

The repo already hints at this split:

- `Ema.Sessions.Registry` is the fact authority
- `Ema.Surfaces.Supervisor` owns actual Claude/Codex child processes
- `Ema.Sessions.Monitor` forwards normalized activity

v1 should tighten that into one coherent subtree.

## Recommended structure

### `Ema.Sessions.Registry`
Keep this as the main authority over live session facts:

- execution_id ↔ session_id binding
- provider type
- host session binding
- status
- last activity/progress
- operator requests
- surface bindings

This should remain the daemon’s runtime truth for active session identity.

### `Ema.Sessions.FactCache`
ETS owned by a GenServer for fast reads:

- active sessions by execution id
- active sessions by actor
- stale sessions by heartbeat age
- execution → session bindings
- host session → execution bindings

Reason: CLI/API queries will hit this often, and the GenServer can remain the write authority while ETS serves reads.

### `Ema.Sessions.SessionSupervisor`
A `DynamicSupervisor` over actual session runtime workers.

These are not just provider wrappers; they are BEAM-owned execution surface processes, such as:

- Claude session workers
- Codex session workers
- future Hermes peer session workers
- imported/live-bound host sessions if wrapped as local proxies

This is already approximated by `Ema.Surfaces.SessionSupervisor`; the main design question is whether that remains under `Ema.Surfaces.Supervisor` or is pulled under `Ema.Sessions.Supervisor`.

### Recommended answer
Keep provider-specific process creation in `Ema.Surfaces`, but make `Ema.Sessions` the semantic owner of session truth.

That means:

- `Ema.Surfaces.*` starts/stops provider-backed processes
- `Ema.Sessions.*` owns semantic runtime session identity and status
- the APIs between them should be explicit

### `Ema.Sessions.HeartbeatWatcher`
A small watcher that periodically scans for:

- missing heartbeats
- stale PTY bindings
- runtime process alive? vs registry says running
- orphaned registry records
- imported host sessions that vanished

This watcher should emit incidents or transition events, not mutate canon.

### `Ema.Sessions.Monitor`
The current `Sessions.Monitor` is a good ingestion point for normalized activity.

Its role should stay narrow:

- accept activity signals
- normalize stream/session attribution
- update ticker/session liveness
- publish lightweight activity events

Do not make it the truth owner.

---

## 4. Session supervisor restart strategy

## Suggested restart semantics

### Registry/fact cache
- restart: `:permanent`
- strategy: `rest_for_one` with dependent children below it

If the registry or ETS owner dies, dependent liveness/watch processes should restart too so they can rebuild references cleanly.

### Session workers
- under `DynamicSupervisor`
- restart: `:transient` or `:temporary` depending on session class

Suggested split:

- **managed local Claude/Codex sessions**: `:transient`
- **imported observational host sessions**: `:temporary`

Reason:
- managed sessions may deserve restart/resume logic
- observational imports should not loop-restart when the external thing is gone

### Heartbeat watcher / monitor
- `:permanent`

These are cheap long-lived observers and should always come back.

---

## 5. Relationship between Clock and Sessions

Clock should not directly own session state, but it should wake session-related work.

Good examples:

- session stale-scan cadence
- actor agenda recompute cadence
- session closeout reminder cadence
- handoff follow-up cadence

The interaction should look like:

```text
Clock cadence worker
  -> PubSub tick or callback
  -> Sessions/Agenda/Workspace subsystem reacts
  -> runtime state updated
```

Not:

```text
Clock directly mutates canonical or workspace files
```

This keeps the clock composable and reduces hidden side effects.

---

## 6. Shared workspace watch/index sketch

## Goal

EMA should watch and index `workspace/shared/` so agents can discover:

- handoffs
- actor files
- schedules
- tasks
- session breadcrumbs
- swarm docs

But this index must remain an **overlay**.

The workspace should become:

- queryable
- filterable
- freshness-aware
- cross-linked to canonical/runtime refs

Without becoming:

- the new canonical database
- a shadow execution ledger
- an unbounded duplicate store

## Architectural stance

Treat workspace indexing like a search/materialized-view subsystem:

- derived from files
- rebuildable from disk
- discardable on crash
- clearly marked as non-canonical
- joinable with canonical/runtime state in CLI/API views

That is similar in spirit to `Ema.SecondBrain.Indexer`: useful, supervised, cached — but not truth.

---

## 7. Workspace supervision sketch

### `Ema.Workspace.Registry`
Registry for watchers and index workers by scope:

- `{:watch, :shared_root}`
- `{:watch, :handoffs}`
- `{:watch, :sessions}`
- `{:indexer, :actors}`
- `{:indexer, :schedules}`

### `Ema.Workspace.WatchSupervisor`
Dynamic supervisor for file watchers.

Practical v1 scopes:

- root watcher for `/workspace/shared`
- or folder watchers for:
  - `actors/`
  - `handoffs/`
  - `schedules/`
  - `tasks/`
  - `sessions/`
  - `swarm/`

Folder-scoped watchers are often simpler than per-file watchers and align with workspace semantics.

### `Ema.Workspace.IndexSupervisor`
Dynamic supervisor for parser/index workers.

Instead of having the file watcher parse everything inline:

- watcher emits normalized file events
- index worker parses markdown/frontmatter
- index store updates extracted metadata
- change bus broadcasts overlay update

That separation is healthier under load and easier to retry.

### `Ema.Workspace.IndexStore`
ETS-backed overlay index owned by a GenServer.

Suggested stored record shape:

```elixir
%{
  path: "workspace/shared/handoffs/hermes-a4--handoff.md",
  domain: :handoff,
  mtime: ~U[...],
  hash: "...",
  title: "review request",
  owner: "hermes-a4",
  actors: ["hermes-a4", "codex-a7"],
  status: :open,
  refs: %{
    intent_ids: [...],
    proposal_ids: [...],
    execution_ids: [...]
  },
  extracted: %{...},
  source_authority: :workspace_overlay
}
```

### `Ema.Workspace.ChangeBus`
PubSub/event bridge for:

- `workspace:file_changed`
- `workspace:index_updated`
- `workspace:index_failed`
- `workspace:stale_overlay_detected`

This lets CLI/API subscribe without coupling to watcher internals.

### `Ema.Workspace.Reconcile`
Periodic scanner to heal drift between:

- on-disk files
- watcher event stream
- ETS index contents

Why needed:
- file watchers can miss events
- editors can do temp-file rename patterns
- daemon restarts can happen mid-write

This process should periodically rescan and re-index deltas.

---

## 8. What gets indexed

Only extract enough structure to support discoverability and joins.

### `actors/`
Index:
- actor id
- status
- created_at / updated_at
- declared lane/role
- related refs
- summary headings

### `handoffs/`
Index:
- from_actor
- to_actor / to_role
- status
- priority
- blocking flag
- subject / ask
- related intent/proposal/execution ids

### `schedules/`
Index:
- actor/project scope
- start/end windows
- cadence refs
- phase
- status
- related execution/task refs

### `tasks/`
Index:
- task ids
- source kind
- owner/assignee
- status
- due window
- refs to canonical entities

### `sessions/`
Index:
- breadcrumb file id
- session id / execution id
- actor
- provider/model
- cwd/worktree
- last known status
- attached refs

### `swarm/`
Index:
- assignment docs
- channel/role declarations
- dispatch metadata
- role ownership
- current swarm session refs

---

## 9. What must not happen

The workspace indexer should **not**:

1. invent canonical ids just because a file exists
2. silently promote workspace data into canon
3. treat file presence as proof of live execution truth
4. overwrite runtime session truth from stale markdown
5. serve as the sole storage for claims/reservations
6. mutate files automatically except for tightly scoped generated exports/views

This is the key anti-drift principle:
**workspace files are readable coordination artifacts; index state is a derived cache over them.**

---

## 10. Admission rules: how workspace data affects runtime

A workspace file may influence runtime behavior only through an explicit admission step.

Examples:

### Allowed
- a schedule overlay file is parsed
- daemon surfaces it as a candidate agenda item
- operator/agent/CLI explicitly activates it
- clock cadence worker is started with `source: :workspace_overlay`

### Not allowed
- user drops markdown into `schedules/`
- daemon silently starts live cadence workers as if that were canonical law

Same rule for session breadcrumbs:

- breadcrumb file can help discover or resume a session
- it cannot by itself declare that a session is alive

This is how EMA avoids making the workspace canonical by accident.

---

## 11. Event flow sketch

## Workspace change

```text
file write/rename/delete
  -> Workspace watcher sees event
  -> Change normalized {path, event_type, mtime}
  -> Index worker parses markdown/frontmatter
  -> IndexStore upserts overlay entry
  -> PubSub broadcasts workspace:index_updated
  -> CLI/API agenda/task/session views recompute joins
```

## Cadence activation

```text
canonical or admitted overlay schedule
  -> Clock.CadenceSupervisor starts worker
  -> worker ticks on interval
  -> PubSub/callback emits wake signal
  -> Sessions/Agenda/Swarm component reacts
```

## Session lifecycle

```text
surface starts session process
  -> Sessions.Registry registers execution/session fact
  -> HeartbeatWatcher monitors liveness
  -> Sessions.Monitor records activity
  -> optional breadcrumb writer/export updates workspace
  -> workspace indexer notices breadcrumb change
  -> discoverability improves, but runtime truth still lives in Sessions.Registry
```

That last line is the whole point.

---

## 12. Suggested authority labels in data models

Every runtime/indexed object that can appear in CLI/API views should carry an authority marker:

- `:canonical`
- `:runtime`
- `:workspace_overlay`
- `:computed`

That lets EMA render joined views like:

- execution status = `runtime`
- proposal meaning = `canonical`
- handoff note = `workspace_overlay`
- agenda recommendation = `computed`

This is probably the simplest practical mechanism to stop conceptual drift.

---

## 13. Minimal v1 implementation slice

If EMA wants the smallest useful implementation, do this first:

### Step 1 — tighten current session/runtime shape
- keep `Ema.Sessions.Registry` as runtime authority
- add ETS-backed read cache if needed
- add `HeartbeatWatcher` for stale/orphan detection

### Step 2 — formalize clock/cadence subtree
- extract cadence worker concept from ad hoc timers
- keep `StreamTicker` as first major client of the clock layer
- allow named cadence workers for agenda/session scans

### Step 3 — add workspace overlay indexing
- watch `handoffs/`, `sessions/`, `schedules/`, `actors/`
- index frontmatter + key headings into ETS
- expose query API
- label results as `workspace_overlay`

### Step 4 — build joined views in CLI/API
- `ema agenda`
- `ema handoff inbox`
- `ema session ps`
- `ema workspace status`

All of those should join canonical + runtime + overlay, rather than privileging the workspace.

---

## Bottom line

The OTP design should encode this rule directly:

- **Clock/cadence** = supervised runtime scheduling
- **Sessions** = supervised runtime execution truth
- **Workspace watch/index** = supervised derived overlay for discoverability

If EMA keeps those three layers separate, the shared workspace becomes extremely useful without becoming a second, conflicting canon.

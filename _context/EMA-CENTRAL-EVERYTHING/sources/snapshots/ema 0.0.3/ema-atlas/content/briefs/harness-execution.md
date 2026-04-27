# Harness / Execution Fabric

## The frame

If the control plane is what counts as having happened, the harness is
what actually does the doing. Hermes, provider adapters, CLI runners,
local models, and subagents all live here — the runtime fabric beneath
EMA's authority. The canonical rule reasserts itself sharply at this
boundary: **EMA owns truth, Hermes owns execution, surfaces do not own
state.** Hermes is allowed to be loud, lossy, and improvisational; the
moment its events cross into EMA they are normalized, attributed, and
pinned to a workstream. Surfaces are not allowed to peek directly at the
runtime — they read the projection EMA produces from the events Hermes
returns.

The shape is partially built. There is a `hermes_client.ex` surface
adapter inside the daemon, a `claude/` provider stack with a runner,
shell, system shell, and task supervisor, a babysitter family that
manages stream channels and tick routing, and a session subsystem with
its own monitor, registry, and supervisor. There is also a planning
document, `HERMES_HARNESS_DRIVER_REGISTRY.md`, that names but does not
yet implement a multi-driver world. The open question is not whether
Hermes can run things — it can — but how disciplined the harness contract
becomes, how many runtimes are allowed under it, and how visible their
delegation trees are to humans.

## What's already true

- A surface-side Hermes client lives at
  `codebase-ema/code/ema/daemon/lib/ema/surfaces/hermes_client.ex`.
- A Claude provider stack already has a runner, shells, registry, and a
  task supervisor:
  `codebase-ema/code/ema/daemon/lib/ema/claude/runner.ex`,
  `codebase-ema/code/ema/daemon/lib/ema/claude/shell.ex`,
  `codebase-ema/code/ema/daemon/lib/ema/claude/system_shell.ex`,
  `codebase-ema/code/ema/daemon/lib/ema/claude/provider_registry.ex`,
  `codebase-ema/code/ema/daemon/lib/ema/claude/task_supervisor.ex`.
- The babysitter family handles streaming, scheduling, and takeover:
  `codebase-ema/code/ema/daemon/lib/ema/babysitter/chain_scheduler.ex`,
  `codebase-ema/code/ema/daemon/lib/ema/babysitter/command_router.ex`,
  `codebase-ema/code/ema/daemon/lib/ema/babysitter/stream_channels.ex`,
  `codebase-ema/code/ema/daemon/lib/ema/babysitter/takeover_manager.ex`,
  `codebase-ema/code/ema/daemon/lib/ema/babysitter/tick_router.ex`.
- Sessions are explicitly modeled rather than implicit:
  `codebase-ema/code/ema/daemon/lib/ema/sessions/monitor.ex`,
  `codebase-ema/code/ema/daemon/lib/ema/sessions/registry.ex`,
  `codebase-ema/code/ema/daemon/lib/ema/sessions/supervisor.ex`.
- Execution events feed back into the plane via
  `codebase-ema/code/ema/daemon/lib/ema/executions/events.ex` and
  `codebase-ema/code/ema/daemon/lib/ema/control_plane/execution_supervisor.ex`.
- The driver-registry concept is documented (not coded) at
  `codebase-ema/code/ema/docs/HERMES_HARNESS_DRIVER_REGISTRY.md` and the
  EMA↔engine boundary at
  `codebase-ema/code/ema/docs/HERMES-EMA-AI-ENGINE-INTERFACE-PLAN.md`.

## What's still open

- **Q5** — the harness/driver contract surface is the central open
  question for this part. Sync RPC, streaming events with continuation
  tokens, gRPC, JSON-RPC are all live variants and each one rules out a
  different family of drivers.
- **Q4** — where the Personal AI executes determines whether Hermes is a
  single backstage or also a per-user runtime, which changes the secret-
  handling and latency story underneath every adapter.
- **Q1** — without first-class agent identity, every run lands in
  `executions/events.ex` with weak attribution, so delegation trees are
  hard to render honestly.
- **Q9** — the deferred replication boundary controls whether
  `peer-remote` is a real driver or a polite fiction; it must not be
  answered before Q1/Q2/Q3.
- **Q10** — runtime/tool permissions versus org/space permissions: until
  they're reconciled, every driver invents its own allow-list.

## The three futures, expanded

### Hermes as Backstage Engine (operator-cathedral)

Backstage Hermes is a disciplined runtime under a strict EMA control
plane. Every run originates inside EMA, gets a run handle from
`sessions/registry.ex`, and emits normalized events through
`executions/events.ex`. Provider adapters are thin and uniform; the
contract surface from `HERMES_HARNESS_DRIVER_REGISTRY.md` is finalized
and enforced. Users see runs as first-class objects with explicit
lineage, not as opaque chat sessions.

**What this would force you to build first**
- A formal driver contract — finishing the work sketched in
  `HERMES_HARNESS_DRIVER_REGISTRY.md` — that every adapter must satisfy
  before it can dispatch.
- An event normalizer that maps provider-specific events onto a closed
  schema in `executions/events.ex`.
- Run handles that survive process death, extending
  `sessions/registry.ex` with a persisted shape rather than ephemeral
  ETS.

**What this would force you to give up**
- Adopting pre-existing provider sessions as-is — every external session
  needs an envelope before it can be tracked.
- Quick experimentation with new providers; each one pays driver-contract
  tax before it can ship.

**Smallest provable slice (2 weeks):** one new driver — `claude-cli` or
`codex-cli` — implemented against a frozen `HARNESS_DRIVER` behaviour,
emitting normalized events into `executions/events.ex`, with a run-handle
that survives daemon restart. One adapter, one contract, one persisted
handle.

### Hermes Woven into the Workspace (living-workspace)

In this future, execution is not a separate console. A thread is a run.
A wiki node can prompt. The babysitter's tick stream is folded into the
same surface where the user is writing. The boundary between "I am
talking to an agent" and "I am working in the project" disappears, with
the price that surface continuity can be confused for execution truth.

**What this would force you to build first**
- A unified surface adapter that lets `hermes_client.ex` deliver into
  collab objects, not just into a runtime panel.
- A clear visual signal — never optional — that a given turn was actually
  a Hermes execution and not a passive note.
- A reconciliation rule between the babysitter's stream channels and the
  collab object's event log so that one is provably derived from the
  other.

**What this would force you to give up**
- A clean separation between "execution telemetry" and "workspace
  artifact"; the two share a surface and you accept the cognitive load.
- Hard guarantees about what users are reading; surface continuity will
  sometimes outrun execution reality and you have to design for that.

**Smallest provable slice (2 weeks):** one wiki node that can host a
live Hermes session — prompt issued from the node, stream channel
rendered inline via `babysitter/stream_channels.ex`, every turn
persisted as both a node revision and an `executions/events.ex` event,
with explicit visual marking of which turns were executions.

### Hermes as Portable Labor Fabric (mesh-commonwealth)

Portable Hermes routes work across machines, peers, and organizations.
A run can originate on the user's laptop, dispatch to a peer's daemon
based on capability and policy, and return events that land in the
local control plane as if the run had been local. The
`peer-remote` driver from the registry document becomes real. Identity,
secrets, and provenance become the dominant concerns, not throughput.

**What this would force you to build first**
- A capability advertisement layer — peers publish what their Hermes can
  run — wired into the babysitter's `command_router.ex`.
- A policy gate that sits in front of dispatch and answers "is this run
  allowed to leave this machine."
- A signed event envelope so events arriving from a remote Hermes can be
  trusted and attributed inside `executions/events.ex`.

**What this would give up**
- The simplifying assumption that the daemon owns its own runtime.
  Every event has to declare which Hermes produced it.
- Latency predictability — a portable run is at the mercy of the slowest
  peer in its dispatch chain.

**Smallest provable slice (2 weeks):** two daemons, one workstream, one
remote run. A user dispatches a single bounded task from daemon A, it
runs on daemon B's Hermes, the events return signed and land in daemon
A's `executions/events.ex`, and a run handle in `sessions/registry.ex`
correctly reflects "this ran elsewhere."

## Decision pressure

1. **Adopt vs originate sessions.** Adopt: friendly to existing CLI
   workflows, weak attribution. Originate: every run gets a run handle
   from day one, but you lose the "I was already in a Claude session and
   want EMA to start tracking it" path.
2. **Streaming events with continuation tokens vs sync RPC drivers.**
   Streaming: matches Hermes' actual shape, harder to test. Sync RPC:
   trivially testable, hides the bursty reality of model output.
3. **Provider adapter vs harness driver.** Adapter: cheap to add, weaker
   contract. Driver (per `HERMES_HARNESS_DRIVER_REGISTRY.md`): heavier
   contract, but EMA can dispatch to it without surface-specific glue.
4. **Visible delegation trees vs collapsed top-level runs.** Visible:
   honest about subagent work, noisy. Collapsed: clean UI, easy to lose
   accountability when a subagent does the consequential thing.
5. **Hermes per project vs Hermes per host.** Per project: better
   isolation, more processes. Per host: one runtime, harder
   multi-tenant secret handling.
6. **Babysitter as authority on runtime vs babysitter as observer.**
   Authority: it can pause, takeover, reroute. Observer: it only reports
   and the control plane decides — slower reactions, cleaner separation.

## Read next

- `graph/nodes/codebase-ema.qmd`
- `graph/nodes/codebase-claudeforge.qmd`
- `graph/nodes/docs-clis-mcps-integrations.qmd`
- `graph/edges/execution.md`
- `graph/edges/orchestration.md`
- `graph/edges/transport.md`
- `codebase-ema/code/ema/docs/HERMES_HARNESS_DRIVER_REGISTRY.md`
- `codebase-ema/code/ema/docs/HERMES-EMA-AI-ENGINE-INTERFACE-PLAN.md`
- `codebase-ema/code/ema/docs/HERMES-EMA-CONTEXT-INTEGRATION-2026-04-20.md`
- `codebase-ema/code/ema/docs/claude-code-runtime-integration-plan.md`
- `codebase-ema/code/ema/docs/daemon-wiki/DISPATCH.md`
- `codebase-ema/code/ema/docs/daemon-wiki/ROUTING.md`
- `codebase-ema/code/ema/docs/daemon-wiki/CIRCUIT_BREAKER.md`
- `docs-ema-next-steps/host/EMA-v1.1-Next-Steps/01-PLANS/VERTICAL-SLICES-DRAFT.md`
- `docs-ema-next-steps/host/EMA-v1.1-Next-Steps/04-CANON/TS-RUNTIME-GAP-MAP-2026-04-13.md`

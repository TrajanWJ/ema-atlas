# Harness / Execution Fabric — Gleam mapping

## Part summary

The harness is what actually does the doing under EMA's authority:
Hermes, provider adapters, claude-cli, codex-cli, simulated-tui, and a
future peer-remote driver. The Elixir tree already has
`surfaces/hermes_client.ex`, a `claude/` provider stack with runner /
shell / system_shell / task_supervisor, the babysitter family
(chain_scheduler, command_router, stream_channels, takeover_manager,
tick_router), and a sessions subtree. The Gleam port turns the
"driver-registry" doc into a typed sum and pushes the harness contract
into a `behaviour`-style Gleam module so every driver compiles or
doesn't.

## Type sketch

```gleam
import gleam/option.{type Option}
import gleam/erlang/process.{type Subject}

pub type DriverKind {
  HermesNative
  ClaudeCli
  CodexCli
  PeerRemote
  SimulatedTui
}

pub opaque type RunHandle {
  RunHandle(execution: ExecutionId, driver: DriverKind, pid_ref: String)
}

pub type Prompt {
  Prompt(text: String, system: Option(String), tools: List(ToolRef))
}

pub type ToolRef { ToolRef(name: String, version: String) }

pub type DriverEvent {
  DriverStarted(handle: RunHandle, at_ms: Int)
  DriverChunk(handle: RunHandle, kind: ChunkKind, text: String)
  DriverToolCall(handle: RunHandle, tool: ToolRef, payload: String)
  DriverToolResult(handle: RunHandle, tool: ToolRef, ok: Bool, payload: String)
  DriverEnded(handle: RunHandle, outcome: Outcome)
  DriverHeartbeat(handle: RunHandle, at_ms: Int)
}

pub type ChunkKind { Stdout Stderr Reasoning Final }
pub type Outcome { Completed Cancelled Errored(reason: String) }

pub type DispatchEnvelope {
  DispatchEnvelope(
    execution: ExecutionId,
    project: ProjectId,
    placement: Placement,
    driver: DriverKind,
    prompt: Prompt,
    by: Actor,
  )
}
```

The driver "behaviour" is encoded as a record of functions (Gleam has
no behaviours; this is the idiomatic substitute):

```gleam
pub type Driver {
  Driver(
    kind: DriverKind,
    start: fn(DispatchEnvelope, Subject(DriverEvent)) ->
            Result(RunHandle, StartError),
    cancel: fn(RunHandle) -> Result(Nil, CancelError),
    describe: fn() -> DriverInfo,
  )
}
```

## Actor sketch

```gleam
pub type RegistryMsg {
  Register(driver: Driver)
  Lookup(kind: DriverKind, reply_to: Subject(Result(Driver, Nil)))
}

pub type ExecutionSupervisorMsg {
  Spawn(env: DispatchEnvelope,
        reply_to: Subject(Result(RunHandle, StartError)))
  Cancel(handle: RunHandle, reply_to: Subject(Result(Nil, CancelError)))
}

pub type SessionRegistryMsg {
  Bind(execution: ExecutionId, session: SessionId,
       provider: Option(ProviderSessionId))
  Resolve(session: SessionId, reply_to: Subject(Option(ExecutionId)))
}
```

- `ema/drivers/registry` — owns `Subject(RegistryMsg)`. New for v0.0.3,
  no direct Elixir analog (only `claude/provider_registry.ex` exists).
- `ema/execution/supervisor` — `Subject(ExecutionSupervisorMsg)`,
  spawns dynamic per-run children. Maps to
  `Ema.ControlPlane.ExecutionSupervisor` plus
  `Ema.Claude.TaskSupervisor`.
- `ema/sessions/registry` — `Subject(SessionRegistryMsg)`. Maps to
  `Ema.Sessions.Registry`.
- `ema/sessions/monitor` — shadow watcher; maps to `Ema.Sessions.Monitor`.
- `ema/babysitter/{stream_ticker,chain_scheduler,takeover_manager,tick_router,command_router}`
  — one Subject each; maps 1:1 to the Elixir babysitter family.
- `ema/surfaces/hermes_client` — `Subject(HermesClientMsg)`. Maps to
  `Ema.Surfaces.HermesClient`. The TS-side seam at
  `codebase-claudeforge/.../hermes-provider.ts` keeps using
  `X-Hermes-Session-Id` and is not touched by this rewrite.

## Supervision tree fragment

```text
root_supervisor
├── drivers/registry                       # NEW
├── execution/supervisor (rest_for_one)
│   ├── sessions/registry
│   ├── sessions/monitor
│   └── (dynamic) per-run driver child
├── babysitter/supervisor (one_for_one)
│   ├── stream_ticker
│   ├── chain_scheduler
│   ├── takeover_manager
│   ├── tick_router
│   └── command_router
└── surfaces/supervisor
    └── hermes_client
```

## Where it leans on Erlang/Elixir interop

- `:erlang.open_port/2` for `claude-cli` and `codex-cli` drivers
  (spawn external processes with `{:spawn_executable, path}`).
- `:os.cmd/1` is *not* used for long-running runs (no streaming).
- `:erlang.monitor(:process, pid)` to detect driver-process death and
  fold it into a `DriverEnded(Errored(...))` event.
- HTTP for `hermes-native`: `gleam_httpc` for sync, but for streaming
  we FFI to `:gun` (Cowboy's HTTP/2 client) which is the canonical
  BEAM streaming HTTP lib.
- `:gen_statem` for the `takeover_manager` if Gleam's `actor` proves
  too thin for explicit state machine + timeouts.
- For `simulated-tui`, no FFI — pure Gleam test-double.
- For `peer-remote`, deferred (see Q9). The driver record exists, but
  `start` returns `Error(StartError(Deferred))` at runtime.

## Tests this part needs at v0.0.3

- Driver-contract conformance test for each implemented driver
  (`hermes-native`, `simulated-tui`): a fixture envelope produces a
  valid `DriverStarted` ... `DriverEnded` event sequence with
  monotonic timestamps.
- Property test (`gleam_qcheck`): for any sequence of `DriverEvent`
  emitted by `simulated-tui`, the projection into
  `control_plane.EventBody.DispatchUpdate` preserves order and final
  outcome.
- Cancellation test: `Cancel(handle)` on a running `simulated-tui`
  yields `DriverEnded(Cancelled)` within 1s.
- Registry test: registering two drivers with the same `DriverKind`
  is rejected; `Lookup(PeerRemote)` succeeds (driver exists) but
  `start(...)` returns `Deferred`.
- Session-id separation test: `SessionRegistry.Bind` accepts an
  `ExecutionId` and a `SessionId` but the compiler rejects swapping
  them — encoded as a compile-fail fixture.
- Babysitter takeover test: stall a `simulated-tui` run (driver emits
  no `DriverHeartbeat` for N seconds), assert `takeover_manager`
  emits a `Handoff` command into `command_bus`.

## Open questions specific to Gleam mapping

- **Q5** — until the harness contract surface is chosen (sync RPC,
  streaming + continuation tokens, gRPC, JSON-RPC), the `Driver` record
  cannot freeze its `start` signature. Concrete pressure: every driver
  module currently has to take a `Subject(DriverEvent)` *and* return a
  `RunHandle`, which is two contracts at once.
- **Q1** — without first-class agent `MemberId`, `DispatchEnvelope.by`
  has to fall back to `HumanActor` for agent-initiated runs, which
  breaks delegation-tree rendering.
- **Q4** — Personal AI placement defaults change whether
  `Placement.Local` or `Placement.Daemon` is the registry's default.
  Today there is no default and every caller must pass one.
- **Q9** — `peer-remote` is typeable but not implementable; the
  `Deferred` runtime error must be loud and tested. Without Q9, we
  cannot decide whether `RunHandle.pid_ref` is local-only or carries a
  peer locator.
- **Q10** — the registry can't reject a driver based on tool
  permissions until org/space → runtime permission mapping exists.

## Read next

- `graph/edges/execution.md`, `graph/edges/orchestration.md`,
  `graph/edges/transport.md`
- `content/briefs/harness-execution.md`
- `codebase-ema/code/ema/docs/HERMES_HARNESS_DRIVER_REGISTRY.md`
- `codebase-ema/code/ema/daemon/lib/ema/{claude,babysitter,sessions,surfaces/hermes_client.ex}`
- `codebase-claudeforge/packages/server/src/providers/hermes-provider.ts`
- `OPEN_QUESTIONS.md` Q1, Q4, Q5, Q9, Q10
- Gleam HTTP / `:gun`: https://hexdocs.pm/gleam_httpc/, https://ninenines.eu/docs/en/gun/

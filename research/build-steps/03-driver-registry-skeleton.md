# Step 3 — Driver registry skeleton

> **Goal:** stand up the typed `Driver` contract, the `drivers/registry`
> actor, and two real driver implementations — `simulated-tui` (pure
> Gleam test-double) and `hermes-native` (HTTP via `gleam_httpc` for
> sync, FFI to `:gun` for streaming) — with the other three driver
> kinds (`claude-cli`, `codex-cli`, `peer-remote`) typeable but
> returning `Deferred` at `start` time.
>
> **Depends on:** Step 1 (control plane skeleton — driver events fold
> into `event_log` via `EventBody.DispatchUpdate`) and Step 2 (identity
> registry — `DispatchEnvelope.project` and `.by` are validated against
> the registry before a driver is invoked).
>
> **Open questions held open:**
> - **Q5** (harness contract surface). Coded assumption: streaming
>   events with a per-execution `Subject(DriverEvent)` sink, i.e. the
>   `start: fn(DispatchEnvelope, Subject(DriverEvent)) -> Result(RunHandle,
>   StartError)` signature in `research/parts/harness-execution.md`. If
>   Q5 picks sync RPC instead, the `start` signature collapses to
>   return a final `DriverEvent` list; the registry surface does not
>   change. If Q5 picks gRPC or JSON-RPC, the change is in
>   `hermes_native.gleam` only.
> - **Q1** (agent-as-Member). Coded assumption:
>   `DispatchEnvelope.by: Actor` accepts `AgentActor(_)` from Step 2;
>   if Q1 resolves "no", the field falls back to `HumanActor(_)` and
>   delegation-tree rendering loses an attribution hook.
> - **Q4** (Personal AI placement default). Coded assumption: if the
>   envelope omits `placement`, the registry asks
>   `ema_identity/personal_ai_resolver` for a default; today that
>   returns `Local`.
> - **Q9** (replication boundary). `PeerRemote` is a typed `DriverKind`
>   variant but the driver's `start` returns
>   `Error(StartError(Deferred("peer-remote not implemented")))`. Loud,
>   tested, deferred.
> - **Q10** (org/space → runtime perms). Coded assumption: the registry
>   does not check tool-permission policy at lookup time. Step 2's
>   `policy_evaluator` exists but is not wired into driver dispatch
>   yet.

## What this step produces

Concrete Gleam modules under `apps/ema/src/ema_drivers/`:

- `kind.gleam` — `DriverKind` sum (the five kinds from
  `HERMES_HARNESS_DRIVER_REGISTRY.md` §4).
- `envelope.gleam` — `DispatchEnvelope`, `Prompt`, `ToolRef`,
  `RunHandle`, `StartError`, `CancelError`.
- `events.gleam` — `DriverEvent`, `ChunkKind`, `Outcome`.
- `driver.gleam` — the `Driver` record-of-functions (Gleam's
  behaviour-substitute, per `research/parts/harness-execution.md`).
- `registry.gleam` — actor; owns `Subject(RegistryMsg)`.
- `simulated_tui.gleam` — pure-Gleam driver.
- `hermes_native.gleam` — HTTP driver; sync via `gleam_httpc`,
  streaming via FFI to `:gun`.
- `claude_cli.gleam` — driver record exists, `start` returns `Deferred`.
- `codex_cli.gleam` — driver record exists, `start` returns `Deferred`.
- `peer_remote.gleam` — driver record exists, `start` returns
  `Deferred("Q9-pending")`.
- `bridge_to_event_log.gleam` — folds `DriverEvent` into Step 1's
  `EventBody.DispatchUpdate`.
- `supervisor.gleam` — `static_supervisor` for the registry; the
  per-run drivers themselves are spun up under `factory_supervisor`
  (deferred to Step 4 with `execution/supervisor`).

Plus tests under `apps/ema/test/ema_drivers/`:

- `simulated_tui_conformance_test.gleam`
- `hermes_native_conformance_test.gleam`
- `registry_test.gleam`
- `driver_kind_dedup_test.gleam`
- `bridge_to_event_log_test.gleam`
- `peer_remote_deferred_test.gleam`

## Type sketches

```gleam
import gleam/option.{type Option}
import gleam/erlang/process.{type Subject}
import ema_control_plane/ids.{type ExecutionId, type ProjectId}
import ema_control_plane/event.{type Actor, type Placement}

pub type DriverKind {
  HermesNative
  ClaudeCli
  CodexCli
  PeerRemote
  SimulatedTui
}

pub type ToolRef {
  ToolRef(name: String, version: String)
}

pub type Prompt {
  Prompt(text: String, system: Option(String), tools: List(ToolRef))
}

pub opaque type RunHandle {
  RunHandle(execution: ExecutionId, driver: DriverKind, pid_ref: String)
}

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

pub type ChunkKind { Stdout Stderr Reasoning Final }

pub type Outcome {
  Completed
  Cancelled
  Errored(reason: String)
}

pub type DriverEvent {
  DriverStarted(handle: RunHandle, at_ms: Int)
  DriverChunk(handle: RunHandle, kind: ChunkKind, text: String)
  DriverToolCall(handle: RunHandle, tool: ToolRef, payload: String)
  DriverToolResult(
    handle: RunHandle,
    tool: ToolRef,
    ok: Bool,
    payload: String,
  )
  DriverEnded(handle: RunHandle, outcome: Outcome)
  DriverHeartbeat(handle: RunHandle, at_ms: Int)
}

pub type StartError {
  Deferred(reason: String)
  Rejected(reason: String)
  Crashed(reason: String)
}

pub type CancelError {
  NotFound
  AlreadyEnded
}

pub type DriverInfo {
  DriverInfo(kind: DriverKind, version: String, supports_streaming: Bool)
}

pub type Driver {
  Driver(
    kind: DriverKind,
    start: fn(DispatchEnvelope, Subject(DriverEvent)) ->
      Result(RunHandle, StartError),
    cancel: fn(RunHandle) -> Result(Nil, CancelError),
    describe: fn() -> DriverInfo,
  )
}

pub type RegistryMsg {
  Register(driver: Driver, reply_to: Subject(Result(Nil, RegisterError)))
  Lookup(kind: DriverKind, reply_to: Subject(Result(Driver, Nil)))
  ListAll(reply_to: Subject(List(DriverInfo)))
}

pub type RegisterError {
  DuplicateKind(DriverKind)
}
```

## Module layout

```
apps/ema/src/
└── ema_drivers/
    ├── kind.gleam                   -- (no Elixir analog; doc origin: codebase-ema/code/ema/docs/HERMES_HARNESS_DRIVER_REGISTRY.md §4)
    ├── envelope.gleam               -- (no Elixir analog)
    ├── events.gleam                 -- cf. lineage-original-elixir-ema/code/daemon/lib/ema/babysitter/stream_channels.ex (chunk shape)
    ├── driver.gleam                 -- (no Elixir analog — record-of-functions instead of behaviour)
    ├── registry.gleam               -- shape mirrors lineage-original-elixir-ema/code/daemon/lib/ema/claude/provider_registry.ex
    │                                   but typed at the driver layer above providers
    ├── simulated_tui.gleam          -- (no Elixir analog)
    ├── hermes_native.gleam          -- cf. lineage-original-elixir-ema/code/daemon/lib/ema/surfaces/hermes_client.ex
    │                                   (renamed: hermes is now a *driver*, not a surface)
    ├── claude_cli.gleam             -- cf. lineage-original-elixir-ema/code/daemon/lib/ema/claude/runner.ex
    ├── codex_cli.gleam              -- (no Elixir analog)
    ├── peer_remote.gleam            -- (no Elixir analog — Q9 deferred)
    ├── bridge_to_event_log.gleam    -- cf. lineage-original-elixir-ema/code/daemon/lib/ema/control_plane/dispatch_reconciler.ex
    │                                   (the "fold runtime into event_log" idea)
    └── supervisor.gleam             -- (no Elixir analog at this layer)
```

The Elixir tree only has `claude/provider_registry.ex` — a *provider*
registry one layer below the driver concept. Step 3's deliberate break
(per `EMA_V0_0_3_PREP.md` "What changes in the rewrite" #1) is to land
the driver registry as the typed Gleam contract above providers, with
the five driver kinds as compile-checked variants.

## Supervision tree fragment

```text
root_supervisor (one_for_one)
├── ema_control_plane/supervisor (rest_for_one)   -- Step 1
├── ema_identity/supervisor (rest_for_one)        -- Step 2
└── ema_drivers/supervisor (one_for_one)
    ├── registry                  -- Subject(RegistryMsg); built-in drivers register at boot
    └── bridge_to_event_log       -- subscribes to per-run Subject(DriverEvent)s,
                                      writes EventBody.DispatchUpdate into Step 1's event_log
```

Per-run driver children land in Step 4 under
`execution/supervisor (rest_for_one) → factory_supervisor` per
`research/parts/harness-execution.md`. Step 3 ships the registry and
the bridge only.

## Acceptance criteria (testable)

1. `registry.start/0` returns a `Subject(RegistryMsg)` with all five
   `DriverKind`s registered (the three deferred ones return `Deferred`
   at `start` time, but `Lookup` succeeds).
2. `Register(driver)` of a second driver with the same `DriverKind`
   returns `Error(DuplicateKind(_))` and does not replace the first.
3. `simulated_tui` produces a valid `DriverStarted ... DriverEnded`
   sequence with monotonic `at_ms` for a fixture envelope; the
   `Outcome` is `Completed` for the happy path and `Cancelled` within
   1s of `cancel(handle)`.
4. `hermes_native.start(envelope, sink)` against a stubbed HTTP server
   produces at least one `DriverChunk(_, Final, _)` and one
   `DriverEnded(_, Completed)` event into `sink`.
5. `peer_remote.start(_, _)` returns
   `Error(Deferred("peer-remote not implemented"))` — verified by an
   explicit test case.
6. `bridge_to_event_log` folds a `DriverEvent` stream into
   `EventBody.DispatchUpdate(Queued)` → `Running` → `Completed` on
   Step 1's event_log, with `seq` strictly increasing.
7. The compile-fail fixture
   `test/typecheck/run_handle_swap.gleam` does not compile when an
   `ExecutionId` is passed where a `RunHandle` is expected (gate #4
   of `EMA_V0_0_3_PREP.md` extended).
8. `DriverEnded(Cancelled)` arrives within 1s when `cancel/1` is
   called on a running `simulated_tui` handle.
9. The registry's `ListAll` returns five `DriverInfo` entries — never
   fewer — even when only two are implementable.

## Property tests (gleam_qcheck)

1. **Order preservation through the bridge.** For any `DriverEvent`
   stream emitted by `simulated_tui`, the corresponding
   `EventBody.DispatchUpdate` sequence in `event_log` is a monotonic
   prefix-extension of the input — no reordering, no loss.
2. **Outcome totality.** For any `DispatchEnvelope` driving
   `simulated_tui`, the resulting event stream ends with exactly one
   `DriverEnded(_, outcome)` and `outcome` is one of `{Completed,
   Cancelled, Errored(_)}`.
3. **Registry dedup.** For any list of `Register(driver)` calls,
   `Lookup(kind)` returns the *first-registered* driver for `kind` and
   subsequent registrations of the same `kind` return
   `Error(DuplicateKind(_))`.

## What gets stubbed (and why)

- **`peer_remote` driver implementation** — Q9 deferred. Stub:
  driver record exists, `start` returns `Deferred`, `cancel` returns
  `NotFound`, `describe` returns `DriverInfo(PeerRemote, "stub", False)`.
- **`claude_cli` and `codex_cli` driver implementations** — Q5
  deferred at the `:erlang.open_port/2` shape level. Stub: same as
  `peer_remote`.
- **Per-run dynamic supervision** — `execution/supervisor` and the
  `factory_supervisor` for live driver processes land in Step 4 (the
  babysitter port). Stub: Step 3 directly spawns drivers under the
  caller's process for tests; production wiring waits.
- **Tool permission enforcement** — Q10 deferred. Stub:
  `envelope.tools` is recorded but no policy check happens before
  `start`.
- **Streaming HTTP via `:gun`** — `hermes_native` uses `gleam_httpc`
  for the smoke-test path. The `:gun` FFI for true streaming is
  scaffolded but commented out until Step 4 needs it for live driver
  output.
- **`X-Hermes-Session-Id` continuity** — the existing TS surface seam
  (`codebase-claudeforge/.../hermes-provider.ts`) keeps using this
  header. `hermes_native` passes it through as a `String` field on
  the request; the typed `SessionId` binding lands in Step 4 where
  sessions are wired.

## Cross-references

- Brief: `content/briefs/harness-execution.md`
- Part mapping: `research/parts/harness-execution.md`
- Edge: `graph/edges/execution.md`
- Glossary: "Driver", "Harness", "Provider", "Placement"
- Howto: `howto/gleam-fit-review.md` (run when Q5 forces a `start`
  signature change).
- Prep doc: `EMA_V0_0_3_PREP.md` "What changes" #1, "Required pre-build
  decisions → Execution / drivers (Q5)", gates #5 and #6.
- Doc origin: `codebase-ema/code/ema/docs/HERMES_HARNESS_DRIVER_REGISTRY.md`
  §4 (the five-driver list).
- Surface seam (unchanged):
  `codebase-claudeforge/packages/server/src/providers/hermes-provider.ts`.
- Capability survey: `research/GLEAM_BEAM_FIT.md` "HTTP / web servers"
  and "Erlang/Elixir interop" sections.
- `OPEN_QUESTIONS.md` Q1, Q4, Q5, Q9, Q10.

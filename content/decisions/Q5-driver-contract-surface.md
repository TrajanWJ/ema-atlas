# Decision matrix — Q5 (Harness/driver contract surface)

Per-question decision matrix for resolving Q5 in
[`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md). Follows the shape laid
out in [`content/decision-matrix-template.md`](../decision-matrix-template.md)
verbatim.

> A matrix forces you to write the cost on each option **before** you
> pick. The point is that you should be able to read the matrix back
> later and see why the chosen option won — including in cases where
> the choice turns out wrong.

## Question

`Q5` — `Harness/driver contract surface`

(Restated verbatim from
[`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) Q5.)

The question's stated **blast radius** is "every non-`hermes-native`
driver, including planned `claude-cli`, `codex-cli`, `peer-remote`,
`simulated-tui`." It surfaces in `graph/edges/execution.md`,
`HERMES_HARNESS_DRIVER_REGISTRY.md`, and
`HERMES-EMA-AI-ENGINE-INTERFACE-PLAN.md`. The four named variants in
`OPEN_QUESTIONS.md` are: `sync RPC`, `streaming events with
continuation tokens`, `gRPC`, `JSON-RPC`.

The Step 3 build step
([`research/build-steps/03-driver-registry-skeleton.md`](../../research/build-steps/03-driver-registry-skeleton.md))
is currently coded against "streaming events with a per-execution
`Subject(DriverEvent)` sink" — concretely the signature

```gleam
start: fn(DispatchEnvelope, Subject(DriverEvent)) ->
        Result(RunHandle, StartError)
```

from
[`research/parts/harness-execution.md`](../../research/parts/harness-execution.md).
That `Subject(DriverEvent)` shape is the reference point for
comparing the four options below.

## Options being weighed

The four variants named in `OPEN_QUESTIONS.md`:

| Option | Short name | One-line description |
|---|---|---|
| Option A | `sync-RPC` | Driver `start` is a synchronous call returning a final `Result(List(DriverEvent), StartError)` (or single `DriverEnded`). No streaming during the run; the caller blocks until the driver finishes. |
| Option B | `streaming-events-Subject` | Driver `start` accepts a `Subject(DriverEvent)` sink and returns a `RunHandle` immediately; the driver process emits events into the sink until `DriverEnded(_)`. This is the Step 3 coded assumption. The "streaming events with continuation tokens" variant from `OPEN_QUESTIONS.md` is folded in here as a `continuation_id: Option(ContinuationId)` field on the envelope (already present in the `ARCHITECTURE.md` `Dispatch` sketch). |
| Option C | `gRPC` | Driver contract is a `.proto` interface; drivers are external services (or in-process actors wrapping an Erlang gRPC server). EMA generates Gleam stubs from the proto; streaming is HTTP/2 server-side stream. |
| Option D | `JSON-RPC` | Driver contract is a JSON-RPC 2.0 spec over stdio (for `claude-cli` / `codex-cli`), HTTP (for `hermes-native`), or WebSocket (for `peer-remote`). EMA owns a JSON-RPC client; drivers can be in any language. |

## Criteria

For each criterion, score each option `+ / 0 / – / blocker`. Add a
one-line "why" inline. Don't average — the criteria are not
interchangeable.

| Criterion | Why it matters | A `sync-RPC` | B `streaming-events-Subject` | C `gRPC` | D `JSON-RPC` |
|---|---|---|---|---|---|
| Aligns with canonical rule (P1) | Surfaces don't own state; drivers emit into `event_log` only. | + (driver returns; bridge writes events afterward) | + (per `ARCHITECTURE.md`: "DispatchUpdate stream lands in event_log via execution_supervisor, never on a surface socket directly") | + (server-stream lands in `bridge_to_event_log`) | + (responses land in the bridge) |
| Compatible with Q-deps if open | Q1 (agent-as-Member), Q4 (Personal AI placement), Q9 (replication boundary), Q10 (perms) all open. | + (least surface area; nothing depends on Q9) | 0 (the `Subject` is local; `peer-remote` needs a serializable equivalent — Q9 pressure) | 0 (network protocol; Q9 ready by construction but Q10 perm-checking lives in EMA before the call) | 0 (similar to gRPC; runs anywhere a JSON-RPC client/server pair runs) |
| Smallest provable slice | Can we exercise it in a 2-week vertical? | + (fewest moving parts; `simulated-tui` returns a fixed list) | + (Step 3 is already written against this; `simulated_tui_conformance_test.gleam` and `hermes_native_conformance_test.gleam` use it) | – (proto generation, stub generation, server runtime — no native Gleam gRPC per `GLEAM_BEAM_FIT.md` "What Gleam DOESN'T have": "No native gRPC / Protobuf libraries comparable to Elixir's `grpc` package") | 0 (JSON-RPC over stdio is simple but no idiomatic Gleam library; build it) |
| Reversible | Can we migrate off it cleanly later? | + (sync → streaming is the easiest direction; you wrap the sync call in an actor that emits a single batch event) | 0 (per Step 3: "If Q5 picks sync RPC instead, the `start` signature collapses to return a final `DriverEvent` list; the registry surface does not change") | – (gRPC code-gen is sticky; once `.proto` lives in source, replacing it is a multi-week migration) | 0 (JSON-RPC schema is portable but the wire format leaks into call sites if not encapsulated) |
| Gleam-native | Can we express it in typed Gleam without FFI escapes? | + (synchronous functions returning `Result` are the most natural Gleam shape) | + (per `GLEAM_BEAM_FIT.md`: `Subject(msg)` is "the unit of addressable identity at the actor level" — first-class in `gleam_otp`) | – (no native Gleam gRPC; FFI to Elixir `grpc` package, which means Elixir + protoc in the build) | 0 (JSON-RPC is just JSON over a transport; `gleam_json` per `GLEAM_BEAM_FIT.md` works but every method gets two hand-written codecs) |
| Auditability | Does it produce control-plane-visible records? | – (no intermediate events — only start and end land in `event_log`; `DriverChunk` / `DriverHeartbeat` / `DriverToolCall` history is lost) | + (`bridge_to_event_log` folds every `DriverEvent` into `EventBody.DispatchUpdate`; full lineage preserved per Step 3 acceptance criterion #6) | + (server-stream events land in the bridge same as B; auditability is identical) | + (each JSON-RPC notification lands in the bridge) |
| Tests writable in v0.0.3 | gleam_qcheck properties + example tests | + (fixture in, list out — trivial) | + (Step 3 already lists property test #1: "Order preservation through the bridge — for any DriverEvent stream emitted by `simulated_tui`, the corresponding EventBody.DispatchUpdate sequence is a monotonic prefix-extension") | – (need a stub gRPC server for tests; brittle on CI) | 0 (need a stub JSON-RPC peer for tests; less brittle than gRPC) |
| Identity-model-clean (Q1) | Doesn't constrain Q1 resolution. | + | + | + | + |
| P2 compliance (Execution is a substrate) | Drivers must not become a shadow state machine. | + (sync return = no in-flight state) | 0 (per-run `Subject(DriverEvent)` is in-flight state, but it's *typed* and bounded by the driver's lifetime; bridge folds into authority) | 0 (server-stream is in-flight state on the wire; same shape as B) | 0 (same as gRPC) |
| P5 compliance (Harnesses are not just providers) | Driver contract is above the provider layer; must not collapse them. | + (the contract is a Gleam function — clearly not a provider API) | + (the contract is `Driver` record-of-functions per `harness-execution.md`; provider lives below) | 0 (proto file becomes the contract; risk of drift toward "this is just the OpenAI proto") | 0 (JSON-RPC schema becomes the contract; risk of drift toward "this is just the provider's JSON shape") |
| P8 compliance (Capability locality) | Tools/auth/resources differ across human shells, agent turns, daemons, surfaces, machines. | – (sync RPC has no natural place to negotiate capability per-call beyond the envelope; long calls block the caller) | + (the `Subject` lives in the daemon; placement and capability are both first-class on the envelope per `ARCHITECTURE.md`'s `Dispatch` record) | 0 (gRPC metadata can carry capability set; but per-call negotiation is awkward over server-stream) | 0 (JSON-RPC params can carry capability set; same as gRPC) |
| Streaming fidelity | Does the driver produce intermediate `DriverChunk` / `DriverToolCall` / `DriverHeartbeat` events visible to the operator? | – blocker for `claude-cli` (every keystroke of stream is hidden until end) | + (matches `DriverEvent` sum exactly, including `DriverHeartbeat` and `DriverChunk(_, Reasoning, _)`) | + (server-stream supports it natively) | + (JSON-RPC notifications support it; ordering is application-layer) |
| Cancellation | Per Step 3 acceptance #8: `DriverEnded(Cancelled)` must arrive within 1s of `cancel/1`. | – (sync calls are not naturally cancellable in Gleam; need a separate kill channel which defeats sync simplicity) | + (`cancel(handle)` sends a typed `Cancel` to the driver actor; tested via Step 3 `simulated_tui_conformance_test.gleam`) | + (gRPC supports client-side cancellation natively) | 0 (JSON-RPC has no standardized cancel; implement an extension) |
| `peer-remote` fit (Q9-aware) | Per Step 3: `peer-remote` is "typeable but not implementable; `start` returns `Error(Deferred)`". The contract must allow a peer driver to slot in once Q9 settles. | – (sync call across the network has timeout / partition / retry semantics that have to be added later) | – (`Subject(DriverEvent)` is process-local on the BEAM; making it cross-node requires a typed peer-bridge per `GLEAM_BEAM_FIT.md` "P2P / mesh substrate" section — non-trivial) | + (gRPC was designed for cross-machine; `peer-remote` is the canonical use case) | + (JSON-RPC over WebSocket is the natural shape for `peer-remote`) |
| `claude-cli` / `codex-cli` fit | These drivers wrap external CLI processes. Per `harness-execution.md`: "`:erlang.open_port/2` for claude-cli and codex-cli drivers." | – (CLIs stream stdout token-by-token; sync RPC discards that until end) | + (`open_port` events fold directly into `DriverEvent`; matches Step 3's coded shape) | – (CLIs don't speak gRPC natively; need a wrapper process) | + (claude-cli already has a JSON output mode; JSON-RPC over stdio is a natural fit) |
| `hermes-native` fit | Per Step 3: `hermes_native` uses `gleam_httpc` for sync, FFI to `:gun` for streaming. | + (sync HTTP works) | + (`:gun` streams chunks straight into the `Subject`) | 0 (Hermes server would need to learn gRPC; doable but requires server-side work) | + (JSON-RPC over HTTP is a thin wrapper) |
| Build-step alignment | Step 3 currently codes the assumption (`Subject(DriverEvent)` sink). | – (every driver module rewrites its `start` signature; `bridge_to_event_log` simplifies; tests change) | + (no change to Step 3) | – (Step 3 entirely rewritten; new `proto/` directory; new build-time codegen step) | – (Step 3's `start` signature changes to a JSON-RPC client setup; conformance tests rewritten) |
| Operator visibility (Auto-Resolve Gate, babysitter takeover) | Per Step 3 acceptance #6 + Step 4 babysitter takeover: stalled runs must emit no `DriverHeartbeat` for N seconds, then trigger handoff. Requires intermediate event visibility. | – blocker for takeover detection (no heartbeat in sync RPC) | + (`DriverHeartbeat` is a first-class `DriverEvent` constructor; takeover_manager observes its absence) | + (heartbeat as server-stream message) | + (heartbeat as JSON-RPC notification) |

## Costs and bets

For each option, two bullets each.

### Option A — `sync-RPC`
- **Bet:** Most drivers will be short-lived and the operator does
  not need intermediate visibility. The babysitter's takeover
  doctrine can rely on out-of-band timeouts ("the call hasn't
  returned in N seconds, kill it") rather than heartbeat events.
  Auditability of intermediate `DriverChunk` / `DriverToolCall`
  events is a "nice to have", not a v0.0.3 requirement.
- **Cost:** Hard blocker for `claude-cli` / `codex-cli` (no
  streamed reasoning visible), for the babysitter's
  `takeover_manager` (no `DriverHeartbeat` to observe absence of),
  and for the Auto-Resolve Gate (no intermediate events to feed the
  confidence signal). Cancellation is awkward. The "every
  `DispatchUpdate` lands in event_log" auditability story collapses
  to "only start and end land".

### Option B — `streaming-events-Subject`
- **Bet:** The BEAM's typed `Subject(msg)` is a cheap, fast,
  type-safe in-process channel and that is exactly what most
  drivers actually need. The daemon hosts the driver actor; the
  driver actor emits events into a `Subject` owned by
  `bridge_to_event_log`; the bridge writes them into `event_log`.
  `peer-remote` is deferred behind `Error(Deferred)` until Q9
  settles, so we don't pay the cross-node serialization cost yet.
  Every other driver kind in
  [`HERMES_HARNESS_DRIVER_REGISTRY.md`](../../codebase-ema/code/ema/docs/HERMES_HARNESS_DRIVER_REGISTRY.md)
  fits this shape natively.
- **Cost:** `Subject(DriverEvent)` is process-local and not
  serializable. When Q9 lands, `peer-remote` will need a typed
  cross-node bridge — either via Erlang distribution +
  `gleam/erlang/node` (per `GLEAM_BEAM_FIT.md`), or via `partisan`,
  or via a separate transport (probably gRPC or JSON-RPC under the
  hood) — and the daemon will end up running both contracts in
  parallel until migration. Step 3 acknowledges this: the
  `peer_remote` driver record exists today but `start` returns
  `Deferred`. We inherit the cost of a second contract surface
  later.

### Option C — `gRPC`
- **Bet:** The driver layer is *strategically* a network protocol.
  Once `peer-remote` is real, every driver should be reachable the
  same way regardless of placement (`Local` / `Daemon` / `Peer`).
  Picking gRPC up front means the daemon, the CLI wrappers, and
  remote peer workers all speak the same protocol; placement
  becomes "what's the gRPC endpoint?" with no special-casing.
- **Cost:** Per `GLEAM_BEAM_FIT.md`, there is no native Gleam gRPC
  library; this means an Elixir `grpc` dep + protoc in the build,
  plus FFI wrappers. CLI drivers don't speak gRPC natively, so
  `claude-cli` / `codex-cli` need a sidecar wrapper. The
  `simulated-tui` test-double becomes heavier. Code-gen is sticky:
  once `.proto` files exist, replacing them is expensive. Step 3
  is rewritten end-to-end.

### Option D — `JSON-RPC`
- **Bet:** JSON-RPC is the lowest-common-denominator: every
  language has a client and a server, claude-cli already has a
  JSON output mode, the wire format is human-readable for
  debugging, and the same protocol works over stdio (CLIs), HTTP
  (`hermes-native`), and WebSocket (`peer-remote`). EMA's daemon
  speaks one protocol to all drivers regardless of transport.
- **Cost:** No idiomatic Gleam JSON-RPC library — every method
  gets two hand-written codecs (per `GLEAM_BEAM_FIT.md` "no
  automatic derivation" cost). JSON-RPC has no standard
  cancellation or heartbeat semantics; both have to be invented as
  protocol extensions. JSON over the wire is fatter than typed
  `Subject` messages on the same VM. Step 3's `Driver` record-of-
  functions is replaced by a JSON-RPC client; conformance tests
  rewritten.

## Open questions this decision creates

Resolving Q5 almost always opens new questions. Candidates the matrix
surfaces:

- **Q5.a — Backpressure.** If B is chosen, what happens when
  `bridge_to_event_log` falls behind a fast-emitting driver? Mailbox
  growth? Drop heartbeats? The `DriverEvent` sum has no
  flow-control message today.
- **Q5.b — Continuation tokens (the third
  `OPEN_QUESTIONS.md` variant phrasing).** The `Dispatch` record
  in `ARCHITECTURE.md` already carries `continuation_id:
  Option(ContinuationId)`. Whatever Q5 picks, the semantics of
  resuming a dispatch — across a daemon restart, across a peer
  takeover, across a `cancel`-then-retry — needs a separate
  decision. (Especially load-bearing for `peer-remote`.)
- **Q5.c — Tool call routing.** `DriverEvent.DriverToolCall(...)`
  is currently a notification. Are tool calls answered by the
  driver itself (it talks to MCP), by EMA's `MCP Gateway` (per
  `GLOSSARY.md`), or both? The contract surface determines who
  initiates the round trip.
- **Q5.d — Per-driver versioning.** `DriverInfo.version: String`
  exists in Step 3. How is contract-version skew handled when a
  peer-remote driver is on an older protocol?
- **Q5.e — Q5 + `peer-remote` (Q9 interaction).** If B is
  chosen, what is the cross-node serialization story for
  `Subject(DriverEvent)` when Q9 lands? Erlang distribution +
  `:erpc`? `partisan`? A second contract surface (gRPC/JSON-RPC) for
  peer-only?

If any of these deserves an entry in
[`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md), file it with a
Q-number greater than the current max.

## Reversibility plan

If we pick the chosen option and it turns out wrong, what's the
migration shape?

- **From `sync-RPC` to `streaming-events-Subject`.** Wrap each
  sync `start` call in a small actor that returns the final
  `DriverEvent` list as a single batch into a `Subject`. The
  registry surface does not change. Estimate: days, plus operator
  UX changes if intermediate event visibility now matters.
- **From `sync-RPC` to `gRPC` or `JSON-RPC`.** Effectively a
  rewrite — drivers are now external services. Estimate: weeks per
  driver kind.
- **From `streaming-events-Subject` to `sync-RPC`.** Per Step 3:
  "the `start` signature collapses to return a final `DriverEvent`
  list; the registry surface does not change." Easy mechanically,
  but the operator UX loses intermediate visibility; takeover
  detection has to be reworked. Estimate: 1-2 weeks.
- **From `streaming-events-Subject` to `gRPC` or `JSON-RPC`.** The
  `Driver` record-of-functions becomes a network client; per Step
  3, "if Q5 picks gRPC or JSON-RPC, the change is in
  `hermes_native.gleam` only" — *for hermes_native specifically*.
  For `claude-cli` / `codex-cli` / `peer-remote`, the migration is
  per-driver and includes adding a wrapper or upgrading the driver
  to speak the chosen wire protocol. Estimate: 2-4 weeks per
  driver kind, plus the toolchain bring-up cost (protoc for gRPC,
  hand-written JSON-RPC codecs for D).
- **From `gRPC` to `JSON-RPC` (or vice versa).** Both are wire
  protocols; map method-by-method. Easier than going to/from
  `streaming-events-Subject`. Estimate: 1-2 weeks per driver kind.
- **From `gRPC` or `JSON-RPC` to `streaming-events-Subject`.** Each
  driver becomes a Gleam actor again; for `claude-cli` /
  `codex-cli`, the wrapper layer disappears and `:erlang.open_port`
  takes over directly. Estimate: 2-4 weeks per driver kind.
- **What records does the chosen option produce that would have
  to be rewritten on migration?** For A: only `event_log` rows for
  the start/end of each dispatch — minimal. For B: `event_log` rows
  for every `DriverEvent` (per Step 3 bridge); migration to a
  different contract preserves these because the bridge format is
  contract-independent. For C: `.proto` files in source, generated
  stubs in the build directory, and any operator runbook entries
  that reference gRPC endpoints. For D: JSON-RPC schema documents
  and any client code that hand-decodes the wire format.

## Provenance

Cite every external doc, vault note, or branch read while filling this
in. The matrix is only as good as its grounding.

- [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) — Q5 wording,
  blast radius, the four named variants.
- [`DESIGN_PRINCIPLES.md`](../../DESIGN_PRINCIPLES.md) — P1, P2,
  P5, P8 (and the canonical rule); the named architecture mistake
  "Treating providers, runtimes, and agents as the same
  abstraction."
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — driver contract
  sketch ("Q5 open on shape"); `DispatchUpdate` stream lands in
  `event_log` via `execution_supervisor`; `Dispatch` carries
  `continuation_id: Option(ContinuationId)`; the `DriverMsg` Subject
  shape.
- [`research/parts/harness-execution.md`](../../research/parts/harness-execution.md)
  — the `Driver` record-of-functions; `start: fn(DispatchEnvelope,
  Subject(DriverEvent)) -> Result(RunHandle, StartError)`; `:gun`
  for streaming; `:erlang.open_port` for `claude-cli` / `codex-cli`;
  the explicit Q5 note: "until the harness contract surface is
  chosen, the `Driver` record cannot freeze its `start` signature."
- [`research/build-steps/03-driver-registry-skeleton.md`](../../research/build-steps/03-driver-registry-skeleton.md)
  — the coded assumption ("streaming events with a per-execution
  `Subject(DriverEvent)` sink"); Step 3 acceptance criteria #3, #4,
  #6, #8; the explicit "if Q5 picks sync RPC instead, the `start`
  signature collapses... if Q5 picks gRPC or JSON-RPC, the change
  is in `hermes_native.gleam` only" gloss.
- [`research/GLEAM_BEAM_FIT.md`](../../research/GLEAM_BEAM_FIT.md)
  — driver registry section: "Typed actor per driver, contract via
  `Subject(DriverMsg)`"; "One actor + behaviour-style trait via
  dispatch on a sum type"; "Driver as port / external process";
  "What Gleam DOESN'T have": "No native gRPC / Protobuf libraries
  comparable to Elixir's `grpc` package"; `Subject(msg)` as "the
  unit of addressable identity at the actor level"; `:gun` as
  "canonical BEAM streaming HTTP lib"; `gleam_json` as the
  encode/decode boundary.
- [`GLOSSARY.md`](../../GLOSSARY.md) — Driver ("typed adapter that
  takes an EMA dispatch and runs it on a specific harness/runtime;
  sits **above** raw model providers"); Driver targets
  (`hermes-native`, `claude-cli`, `codex-cli`, `peer-remote`,
  `simulated-tui`); Provider; Harness; MCP Gateway; Distributed AI
  Delegation; Auto-Resolve Gate.

## Decision

> **Resolution:** `<chosen option short name>`, decided `<YYYY-MM-DD>`.
> Recorded in: `<link to commit / decision doc / blockquote in node body>`.
> Affects: `<other Q-numbers whose blast radius shrinks>`.

When you fill the Decision section in, also:

1. Edit [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md): mark Q5 as
   `status: resolved YYYY-MM-DD → <link>`. **Do not delete the entry.**
2. Move any working assumptions in
   [`SECURITY_PRIVACY.md`](../../SECURITY_PRIVACY.md) that depended on
   Q5 to confidence-styled language, or move them into a hardened
   `SECURITY.md` / `PRIVACY.md`.
3. Trim the affected `graph/edges/execution.md` "Open" section.
4. Update [`CHANGELOG.md`](../../CHANGELOG.md) under the current wave.

## Cross-references

- [`howto/resolve-an-open-question.md`](../../howto/resolve-an-open-question.md)
- [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md)
- [`DESIGN_PRINCIPLES.md`](../../DESIGN_PRINCIPLES.md)
- [`SECURITY_PRIVACY.md`](../../SECURITY_PRIVACY.md)
- [`research/parts/harness-execution.md`](../../research/parts/harness-execution.md)
- [`research/build-steps/03-driver-registry-skeleton.md`](../../research/build-steps/03-driver-registry-skeleton.md)
- [`research/GLEAM_BEAM_FIT.md`](../../research/GLEAM_BEAM_FIT.md)

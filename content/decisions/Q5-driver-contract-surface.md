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
| Aligns with canonical rule (P1) | Drivers emit into `event_log` only. | + | + | + | + |
| Compatible with Q-deps if open | Q1, Q4, Q9, Q10. | + (least surface) | 0 (`Subject` is local; Q9 pressure for `peer-remote`) | 0 (Q9-ready; Q10 lives pre-call) | 0 (similar to gRPC) |
| Smallest provable slice | 2-week vertical. | + (fewest parts) | + (Step 3 already coded; conformance tests written) | – (no native Gleam gRPC per `GLEAM_BEAM_FIT.md`; needs protoc + Elixir `grpc`) | 0 (JSON-RPC simple but no idiomatic library) |
| Reversible | Migrate off cleanly. | + (sync → streaming is easiest direction) | 0 (Step 3: collapse `start` signature to final list, registry unchanged) | – (`.proto` is sticky once in source) | 0 (wire format leaks if not encapsulated) |
| Gleam-native | Typed without FFI. | + (sync `Result`) | + (`Subject(msg)` is first-class in `gleam_otp`) | – (no native gRPC; Elixir + protoc) | 0 (`gleam_json` works; hand-written codec per method) |
| Auditability | Control-plane-visible. | – (only start/end land; no `DriverChunk`/`DriverHeartbeat`/`DriverToolCall` history) | + (`bridge_to_event_log` folds every `DriverEvent` per Step 3 #6) | + (server-stream lands in bridge) | + (notifications land in bridge) |
| Tests writable in v0.0.3 | gleam_qcheck. | + (trivial) | + (Step 3 property test #1) | – (stub gRPC server brittle on CI) | 0 (stub JSON-RPC peer; less brittle) |
| Identity-model-clean (Q1) | Doesn't constrain Q1. | + | + | + | + |
| P2 (execution is substrate) | No shadow state machine. | + (sync = no in-flight state) | 0 (typed in-flight, bounded by driver) | 0 (in-flight on wire) | 0 (same as gRPC) |
| P5 (harnesses ≠ providers) | Above provider layer. | + (Gleam function) | + (`Driver` record-of-functions) | 0 (proto risks drifting to provider proto) | 0 (JSON-RPC risks provider-shape drift) |
| P8 (capability locality) | Tools/auth differ across shells. | – (no per-call negotiation beyond envelope; blocks caller) | + (`Subject` in daemon; placement & capability first-class per `Dispatch`) | 0 (gRPC metadata works but awkward) | 0 (JSON-RPC params work) |
| Streaming fidelity | Intermediate `DriverChunk`/`DriverToolCall`/`DriverHeartbeat` visible. | – blocker for `claude-cli` (token stream hidden until end) | + (matches `DriverEvent` sum exactly) | + (server-stream native) | + (notifications; ordering is app-layer) |
| Cancellation | Step 3 #8: `DriverEnded(Cancelled)` within 1s of `cancel/1`. | – (sync not naturally cancellable; needs side kill channel) | + (typed `Cancel` to driver actor) | + (gRPC client cancel native) | 0 (JSON-RPC has no standard cancel) |
| `peer-remote` fit (Q9-aware) | Per Step 3: `start` returns `Deferred` until Q9. | – (timeout/partition/retry semantics deferred) | – (`Subject` is process-local; cross-node bridge non-trivial per `GLEAM_BEAM_FIT.md`) | + (designed for cross-machine) | + (WebSocket natural for peer) |
| `claude-cli` / `codex-cli` fit | `:erlang.open_port/2` per `harness-execution.md`. | – (CLI tokens hidden until end) | + (port events fold into `DriverEvent`) | – (CLIs don't speak gRPC; need wrapper) | + (claude-cli has JSON output; JSON-RPC stdio fits) |
| `hermes-native` fit | `gleam_httpc` sync + `:gun` streaming. | + (sync HTTP works) | + (`:gun` streams into `Subject`) | 0 (Hermes needs gRPC server work) | + (JSON-RPC over HTTP is thin) |
| Build-step alignment | Step 3 codes `Subject(DriverEvent)` sink. | – (every driver rewrites `start`) | + (no change) | – (entire rewrite + `proto/` codegen) | – (`start` becomes JSON-RPC client) |
| Operator visibility (Auto-Resolve Gate, babysitter takeover) | Stalls detected via heartbeat absence. | – blocker (no heartbeat in sync) | + (`DriverHeartbeat` first-class) | + (server-stream message) | + (JSON-RPC notification) |

## Costs and bets

For each option, two bullets each.

### Option A — `sync-RPC`
- **Bet:** Most drivers are short-lived; operator doesn't need
  intermediate visibility. Babysitter takeover relies on
  out-of-band timeouts ("call hasn't returned in N seconds, kill")
  rather than heartbeat events. Intermediate event auditability is
  nice-to-have, not v0.0.3 critical.
- **Cost:** Hard blocker for `claude-cli` / `codex-cli` (no
  streamed reasoning), for `takeover_manager` (no `DriverHeartbeat`
  to observe absence of), and for Auto-Resolve Gate (no
  intermediate signal). Cancellation awkward. Auditability collapses
  to start/end only.

### Option B — `streaming-events-Subject`
- **Bet:** BEAM's typed `Subject(msg)` is a cheap, type-safe
  in-process channel — exactly what drivers need. Daemon hosts
  driver actor; driver emits into `Subject` owned by
  `bridge_to_event_log`; bridge writes `event_log`. `peer-remote`
  deferred behind `Error(Deferred)` until Q9. Every other driver
  kind in `HERMES_HARNESS_DRIVER_REGISTRY.md` fits natively.
- **Cost:** `Subject(DriverEvent)` is process-local, not
  serializable. When Q9 lands, `peer-remote` needs a typed
  cross-node bridge — Erlang distribution + `gleam/erlang/node`,
  `partisan`, or a separate transport — and daemon may run two
  contracts in parallel during migration.

### Option C — `gRPC`
- **Bet:** Driver layer is strategically a network protocol. Once
  `peer-remote` is real, every driver is reachable the same way
  regardless of placement (`Local` / `Daemon` / `Peer`). Picking
  gRPC up front: daemon, CLI wrappers, and peer workers speak one
  protocol; placement is just an endpoint.
- **Cost:** No native Gleam gRPC per `GLEAM_BEAM_FIT.md` — needs
  Elixir `grpc` dep + protoc + FFI wrappers. CLI drivers don't
  speak gRPC; `claude-cli`/`codex-cli` need sidecars.
  `simulated-tui` test-double becomes heavier. Code-gen sticky.
  Step 3 rewritten end-to-end.

### Option D — `JSON-RPC`
- **Bet:** Lowest common denominator. Every language has client +
  server; claude-cli has JSON output mode; same protocol works
  over stdio (CLIs), HTTP (`hermes-native`), WebSocket
  (`peer-remote`). Daemon speaks one protocol to all drivers.
- **Cost:** No idiomatic Gleam JSON-RPC library — every method =
  two hand-written codecs (per `GLEAM_BEAM_FIT.md` "no automatic
  derivation"). No standard cancellation or heartbeat — both are
  protocol extensions. JSON wire fatter than typed `Subject` on the
  same VM. Step 3 conformance tests rewritten.

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

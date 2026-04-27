# Gleam / BEAM Fit for EMA v0.0.3

> Research grounding for orienting EMA's program around Gleam's nature
> and the BEAM ecosystem. Not a recommendation; an enumeration of
> capabilities, idioms, and gaps with EMA-specific commentary.

## Why Gleam (the language's nature)

Gleam is a statically-typed, eagerly-evaluated functional language that
compiles to either Erlang bytecode (running on the BEAM VM) or to
JavaScript. Its type system is in the Hindley-Milner family with
algebraic data types (sum types via `pub type Foo { A | B(Int) }`),
records, generics, and exhaustive pattern matching. There are no
exceptions in idiomatic Gleam: errors are values carried in `Result(a,
e)`, and the absence of nulls is enforced by `Option(a)`. This matters
for EMA because the historical drift it suffered (`execution_id` vs
`session_id` vs `provider_session_id` vs `object_id`; "provider" vs
"driver" vs "harness") was caused by string-typed identifiers and
free-form maps. Gleam lets each of those become a distinct opaque type
that the compiler refuses to coerce, which is the central bet of the
v0.0.3 prep doc (`EMA_V0_0_3_PREP.md` §"What changes" item 6).
[gleam.run/](https://gleam.run/),
[hexdocs.pm/gleam_stdlib](https://hexdocs.pm/gleam_stdlib/).

Message passing is type-safe via `Subject(message)` — a Subject is a
typed mailbox handle, and the compiler refuses to send a message of the
wrong shape to an actor that does not accept it. Actors look like
Erlang's `gen_server` or Elixir's `GenServer` but each one declares its
message type and the compiler checks every send against it
([hexdocs.pm/gleam_otp/gleam/otp/actor](https://hexdocs.pm/gleam_otp/gleam/otp/actor.html)).
For EMA, that means the babysitter→executor handoffs, the dispatch
reconciler's commands, and the surface↔control-plane channel can each
get a dedicated Subject type instead of relying on `handle_call/3`
pattern-matches that drift over time.

The two compile targets matter differently. The Erlang target gives
EMA the BEAM (preemptive scheduling of millions of green processes,
per-process GC that never stops the world, OTP supervision, hot-code
loading, the existing libraries `gleam_otp` and `gleam_erlang` use)
([hexdocs.pm/gleam_otp](https://hexdocs.pm/gleam_otp/),
[hexdocs.pm/gleam_erlang](https://hexdocs.pm/gleam_erlang/)). The
JavaScript target compiles the same Gleam source down to JS with
TypeScript definitions and a different stdlib subset; this is relevant
to surfaces only — the daemon must run on Erlang because the OTP
libraries are Erlang-only. A surface written in Lustre can in principle
share decoder/encoder modules with the daemon by compiling them to both
targets, which is the only realistic way to keep the
`AGENT-CONTRACT.md` verb set typed end-to-end.

The "let it crash" model + supervisor trees survive the move from
Elixir, but become slightly more explicit. `gleam_otp` exposes
`static_supervisor` (a thin typed wrapper over Erlang's `:supervisor`,
which because of how the underlying OTP module works does not use
Subjects for its child specs) and `factory_supervisor` (for dynamic
children). Restart strategies are the standard `OneForOne`,
`OneForAll`, `RestForOne`
([hexdocs.pm/gleam_otp/gleam/otp/static_supervisor](https://hexdocs.pm/gleam_otp/gleam/otp/static_supervisor.html)).
The Elixir `application.ex` `:one_for_one` ordering carries over
verbatim; the difference is that the child-spec list becomes a typed
function, not a declarative `children = [...]` keyword. This forces the
ordering discipline ("config first, endpoint last") into a single
explicit module per OTP application.

Immutability is total. There is no mutable variable, no
process-dictionary trick, no in-place ETS update from idiomatic Gleam
code. Persistent data structures (`gleam/dict`, `gleam/list`,
`gleam/set`) come from the standard library and are structurally shared
under the hood
([hexdocs.pm/gleam_stdlib](https://hexdocs.pm/gleam_stdlib/)). For
EMA's babysitter and control_plane state machines, this fits: most of
them already evolved toward GenServer state passed through
`handle_call/3` returns. The places that did not — Stream/SecondBrain
subtrees, anything that quietly writes to ETS — must become explicit
actor state, or sit behind a typed FFI boundary that names the
mutation.

The build tool (`gleam build`, `gleam test`, `gleam add`, `gleam run`,
`gleam export erlang-shipment`) is a single binary with no separate
mix/rebar layer. Packages come from Hex
([hex.pm](https://hex.pm/)) with `gleam add foo@1` for caret-style
versioning. There is no `mix release` analogue but there is `gleam
export erlang-shipment` which produces a self-contained Erlang release
directory. EMA's daemon-first ergonomics (`ema daemon start`) need a
small wrapper around that.

## Core stdlib + OTP libraries

**`gleam_stdlib`** (v1.0.0 line; modules: `list`, `dict`, `set`, `pair`,
`dynamic`, `option`, `result`, `order`, `string`, `string_tree`, `uri`,
`int`, `float`, `io`, `bool`, `bit_array`, `bytes_tree`, `function`).
Compiles to both Erlang and JavaScript; requires OTP 26+.
[hexdocs.pm/gleam_stdlib](https://hexdocs.pm/gleam_stdlib/). EMA fit:
foundational. `dict` and `list` underlie every record store; `dynamic`
is the FFI decode boundary; `result` is how every fallible operation
(persistence, decode, dispatch) returns.

**`gleam_otp`** (v1.2.0). Modules: `actor`, `factory_supervisor`,
`port`, `static_supervisor`, `supervision`, `system`. Provides typed
actors with `Subject(msg)` mailboxes, supervisors with the three
classic restart strategies, and process-monitoring primitives.
Deliberately omits OTP features that cannot be type-safely modelled
(notably some forms of dynamic supervision and the full `gen_event`
behaviour). [hexdocs.pm/gleam_otp](https://hexdocs.pm/gleam_otp/),
[github.com/gleam-lang/otp](https://github.com/gleam-lang/otp). EMA
fit: every long-lived component in the v0.0.3 sketch (event_log,
execution_supervisor, babysitter children, sessions, drivers/registry,
collab/supervisor) becomes a `gleam_otp` actor or supervisor.

**`gleam_erlang`** (v1.3.0). Modules: `application`, `atom`, `charlist`,
`node`, `port`, `process`, `reference`. Requires OTP 27+.
[hexdocs.pm/gleam_erlang](https://hexdocs.pm/gleam_erlang/). EMA fit:
this is the bridge. `process` exposes `link`, `monitor`, `send`,
spawn primitives below the actor abstraction; `node` exposes
distributed-Erlang node identity, which becomes relevant the moment a
`peer-remote` driver is real; `application` is what an OTP-style
`start/2` callback uses.

**`gleam_javascript`** (v1.0.0). Modules: `array`, `promise`, `symbol`.
[hexdocs.pm/gleam_javascript](https://hexdocs.pm/gleam_javascript/).
EMA fit: only relevant if a surface is built directly in Gleam-on-JS
(via Lustre client) and needs Promise interop. Daemon code never sees
this.

## HTTP / web servers

**`mist`** (v6.0.3). Pure-Gleam HTTP/1.1 + WebSocket server. Supports
chunked responses, file serving with offset/limit, WebSocket text +
binary frames, custom message handlers, connection lifecycle hooks,
configurable body-size limits.
[hexdocs.pm/mist](https://hexdocs.pm/mist/). EMA fit: candidate for the
HTTP listener that reproduces the `AGENT-CONTRACT.md` verb set. The
WebSocket support also maps onto streaming control-plane events to
surfaces (replacing what `Phoenix.PubSub` + Phoenix Channels did).

**`wisp`** (v2.2.2). Web framework on top of `mist` with handler +
middleware idioms (`use logger <- middleware.from_fn`). Built-in
request logging, static asset serving. Production-tested via
packages.gleam.run. [hexdocs.pm/wisp](https://hexdocs.pm/wisp/). EMA
fit: the natural shape for `/api/control-plane/*` routes — each verb
is a typed handler returning a typed response, middleware handles auth
and request logging.

**`lustre`** (v5.6.0). Frontend framework with Elm-inspired model →
update → view. Supports client-side rendering, server-side rendering
to static HTML, and "universal components" runnable in browser, as
Web Components, or as server components with diffing
([hexdocs.pm/lustre](https://hexdocs.pm/lustre/)). EMA fit: candidate
for Launchpad/HQ web surface (Q7). The server-component model is
particularly interesting because it lets a Gleam-on-Erlang daemon push
view diffs to a browser over WebSocket without a separate JS app — the
closest analogue to Phoenix LiveView available in pure Gleam.

## Persistence

**`sqlight`** (v1.1.0). SQLite via the `esqlite` NIF on Erlang and
`x/sqlite` (WASM) on Deno. Supports parameterized queries, in-memory
or file-backed databases, transactions, and a `decode_bool` helper
because SQLite stores booleans as ints.
[hexdocs.pm/sqlight](https://hexdocs.pm/sqlight/). EMA fit: most
direct candidate for `control_plane/event_log` and `host_transition_log`
when the system is single-node. SQLite's WAL gives durable
append-only writes; FTS5 (used by `second_brain/indexer.ex`) is
available via SQLite virtual tables but Gleam has no high-level
wrapper, so it lands as raw SQL.

**`pog`** / **`gleam_pgo`** (v0.14.0 line for the older `gleam_pgo`
name; the project has been renamed to `pog`,
[github.com/lpil/pog](https://github.com/lpil/pog)). PostgreSQL client
based on the `pgo` Erlang library. Connection pooling with the warning
that pools should be created once at startup because Erlang atoms are
not garbage-collected
([hexdocs.pm/gleam_pgo](https://hexdocs.pm/gleam_pgo/)). EMA fit: if
the event_log eventually outgrows SQLite (multi-writer, multi-host) or
if Org/Space/Project schema needs richer relational semantics. Costs
operational complexity (running Postgres) for richer indexing and
concurrent-writer support.

**`squirrel`**. Code-generation tool that reads `.sql` files, connects
to a live Postgres 16+ to introspect types, and emits a `sql.gleam`
module of typed query functions. Maps Postgres bool/text/int/float,
arrays, JSON, UUID, dates, timestamps, and custom enums into Gleam
types. [hexdocs.pm/squirrel](https://hexdocs.pm/squirrel/). EMA fit:
makes the schema-vs-decoder synchronization that Ecto handled in
Elixir become a build-time guarantee instead of a runtime decoder
hand-write.

**`parrot`**. Type-safe SQL code generator for Gleam that supports
SQLite, PostgreSQL, and MySQL using sqlc-style annotations.
[hexdocs.pm/parrot](https://hexdocs.pm/parrot/). EMA fit: the only
generator in the search that supports SQLite, so it's the natural
companion to `sqlight` if EMA wants build-time-typed queries on a
single-node SQLite event_log.

For full-distributed BEAM-native storage, `mnesia` and `ets`/`dets`
remain available via FFI; there are no idiomatic Gleam wrappers
(see "What Gleam DOESN'T have" below)
([github.com/gleam-lang/gleam discussion #1717](https://github.com/gleam-lang/gleam/discussions/1717)).

## Serialization / contracts

**`gleam_json`** (v3.1.0). Encoders via `json.object`, `json.string`,
`json.int`, `json.array`, `json.to_string`. Decoders go through
`json.parse` returning `Dynamic`, then composed via the `gleam/dynamic/decode`
module from `gleam_stdlib`
([hexdocs.pm/gleam_json](https://hexdocs.pm/gleam_json/)). The pattern
is: every external-facing record (proposal, execution, dispatch_update,
incident, host_transition) declares an `encode/1 : Foo -> json.Json`
and a `decoder() : decode.Decoder(Foo)`. There is no automatic
derivation, which is the cost: every JSON shape gets two hand-written
modules. The benefit is that those are the *only* place coercion
happens, so the rest of the program stays in domain types.

`gleam/dynamic/decode` itself is the canonical decoder combinator
library, and is the right place for decoding everything that crosses an
FFI or network boundary — including responses from Erlang/Elixir
modules called via FFI. EMA fit: the harness driver contract, however
it shapes (sync RPC vs streaming events vs JSON-RPC, per Q5), gets one
encoder/decoder pair per message kind, and the driver registry's typed
sum (`hermes_native | claude_cli | codex_cli | peer_remote | simulated_tui`)
is enforced before any byte hits the wire.

## Concurrency primitives

The vocabulary EMA needs is small and crisp:

- **`Subject(msg)`** — a typed handle for sending `msg` values to a
  process. Created by an actor when it starts and either returned or
  registered. Compiler enforces send/receive shape. EMA fit: every
  control-plane component (event_log, execution_supervisor, dispatch
  reconciler, babysitter chain_scheduler, etc.) gets its own `Subject`
  type. The "babysitter sends a `TakeOver` command to chain_scheduler"
  becomes a `process.send(chain_scheduler_subject, TakeOver(...))` that
  fails to compile if the message variants drift.
- **`Selector`** (in `gleam_erlang/process` and used by `gleam_otp/actor`)
  — a structure that lets an actor receive from multiple Subjects of
  different types in one `receive`, mapping each to a unified message
  type. EMA fit: actors that bridge two subsystems (e.g. babysitter
  watcher receiving both ticks and incident events) use a Selector to
  remain typed across the merge.
- **`actor`** — the Gleam analogue of `gen_server`. Has `init`,
  `handle_message`, optional `system` callback. Returns `Continue` or
  `Stop` and may carry side effects via a `Selector` update.
  ([hexdocs.pm/gleam_otp/gleam/otp/actor](https://hexdocs.pm/gleam_otp/gleam/otp/actor.html))
- **`static_supervisor`** — wraps Erlang `:supervisor`. Children are
  declared once via `add_child` builder calls. Restart: `OneForOne`
  (default), `OneForAll`, `RestForOne`
  ([hexdocs.pm/gleam_otp/gleam/otp/static_supervisor](https://hexdocs.pm/gleam_otp/gleam/otp/static_supervisor.html)).
- **`factory_supervisor`** — for dynamic children spun up over the life
  of the system (sessions, executions, per-collab-doc actors).
  ([hexdocs.pm/gleam_otp](https://hexdocs.pm/gleam_otp/))

Mapping to existing EMA tree:

- `babysitter/{stream_ticker, chain_scheduler, takeover_manager,
  tick_router, command_router}` → each is one actor with one Subject;
  parent is a `static_supervisor` keyed `OneForOne` so a stalled
  ticker does not kill the takeover manager.
- `sessions/supervisor` → `factory_supervisor` so sessions can be
  started and stopped per-actor; each session is an actor whose state
  carries `session_id`, the bound `provider_session_id`, and any
  workspace-scoped state.
- `control_plane/event_log` → single actor (the writer) holding the
  open SQLite handle, with a typed `Subject(EventLogMsg)` used by
  every other component that needs to append. Replay is a separate
  function callable directly (no actor needed, since it's read-only).
- `control_plane/execution_supervisor` → `factory_supervisor` for
  per-execution actors.

## Erlang/Elixir interop

Gleam can call Erlang or Elixir functions via the `@external(erlang,
"module", "function")` attribute. From the Erlang side, calling Gleam
modules is identical to calling any other Erlang module; from Elixir,
modules are referenced as `:gleam_module.function(...)`. Custom Gleam
types come back to Elixir as tuples (first element is the constructor
atom, then the field values), and that representation is round-trippable
([Erlang Solutions webinar overview](https://www.erlang-solutions.com/webinars/gleams-interoperability-with-erlang-and-elixir/);
[AppSignal: Enhancing Your Elixir Codebase with Gleam](https://blog.appsignal.com/2024/07/23/enhancing-your-elixir-codebase-with-gleam.html)).

The hard constraint: **Elixir macros cannot be called from Gleam**,
because macros run at Elixir compile time and Gleam's compiler does not
participate in that pipeline. The standard workaround is to write a thin
Elixir module that uses the macros (Phoenix routers, Ecto schemas,
LiveView components) and expose plain functions for Gleam to call
([Gleam FAQ](https://gleam.run/frequently-asked-questions/)).

**`glixir`** (v1.5.0,
[hexdocs.pm/glixir](https://hexdocs.pm/glixir/)) wraps the most common
Elixir/OTP interop targets in typed Gleam helpers: GenServers,
Supervisors, Agents, Registry, `Phoenix.PubSub`, `libcluster`, `syn`.
The library itself documents that it achieves "70-90% type safety" for
these surfaces, with explicit phantom types and runtime decoders for
the rest. EMA fit: this is the realistic path for reusing the Elixir
EMA daemon's `lineage-original-elixir-ema/code/daemon/lib/ema/control_plane/*`
patterns where direct port would cost more than wrapping. It is also
the realistic path if Hermes turns out to be the Elixir version of
itself (currently uncertain in the prep doc) — Gleam can call into
the Hermes Elixir process via `glixir` instead of waiting for a Gleam
re-implementation.

For pure-Erlang OTP libraries (mnesia, ets, dets, gen_event, syn,
pg) that have no idiomatic Gleam wrapper, `@external` works directly
but each call must be typed by hand. `strucord`
([github.com/QuinnWilton/strucord](https://github.com/QuinnWilton/strucord))
exists for Erlang-record interop. EMA fit: any FTS5 query, any mnesia
table operation, any direct ETS lookup is a hand-typed FFI module that
the rest of the codebase imports as if it were native Gleam.

## CRDT / collaboration substrate (relevant to OPEN_QUESTIONS Q2/Q8)

**`riak_dt`** ([github.com/basho/riak_dt](https://github.com/basho/riak_dt)).
Apache-2.0. State-based CRDTs implemented in Erlang (counters, sets,
maps, registers, flags), originally part of Riak and now a reusable
library. ~358 stars, the project posture is "library, not database."
EMA fit: usable for collab-state convergence under FFI, but it is
state-based (full-state shipping), which has implications for
bandwidth on large objects. No Gleam wrapper exists — every call is
hand-typed FFI. Maturity: production-tested in Riak's history but not
recently active.

**`mnesia`**. The BEAM-native distributed database (in OTP itself).
Provides multi-master replication with `:async_dirty` and ACID
transactions across nodes. EMA fit: tempting for Org/Space membership
and policy bundles because it is in-VM and replicates without extra
infrastructure. Costs: schema migrations are notoriously fragile,
recovery from netsplits is operator work, and there is no Gleam
wrapper. Documented widely; canonical reference
[learnyousomeerlang.com/mnesia](https://learnyousomeerlang.com/mnesia).

**`ra`** ([github.com/rabbitmq/ra](https://github.com/rabbitmq/ra)).
Apache-2.0 / MPL-2.0. Production-grade Raft implementation by the
RabbitMQ team. Supports leader election, log replication, dynamic
membership, log compaction, snapshot installation. Supports many
concurrent Raft clusters per node. Requires OTP 26 or 27. Used in
production for RabbitMQ quorum queues, streams, and Khepri.
EMA fit: the strongest BEAM-native option if EMA wants strong-consistency
replication of control-plane records across nodes. Heavier than gossip
+ CRDT for collab state, but exactly the right shape for the event_log
once it is multi-node.

**`partisan`**
([github.com/lasp-lang/partisan](https://github.com/lasp-lang/partisan)).
Replacement for Distributed Erlang's full-mesh topology. Supports full
mesh with TCP failure detection, HyParView for high-churn / high-scale,
star, and static topologies. Multiple TCP channels per node, separation
of background from application traffic, monotonic channels for redundant
message dropping. Targets cluster sizes beyond the ~60-200-node ceiling
of standard distributed Erlang. EMA fit: only relevant once the mesh
is real (Q9). For v0.0.3 it is a future-proofing note: do not bake the
default `:net_kernel` topology assumptions into anything that touches
`peer-remote` placement.

**`y_ex`** ([github.com/satoren/y_ex](https://github.com/satoren/y_ex)).
MIT. Elixir bindings to `y-crdt` (Rust port of Yjs). Supports YText,
YMap, YArray, XML elements, transactions, observer patterns, undo/redo,
awareness protocol, WebSocket integration via `y-phoenix-channel`.
Lacks Snapshots and WebRTC. ~149 stars. EMA fit: if Q8 lands on
Yjs-family, this is the only realistic BEAM-side path, and it lives in
Elixir — so Gleam EMA would call into it via `glixir` or raw FFI. The
"Elixir component is 74.2% of code, Rust 25.8%" composition means a
Gleam project pulling this in must accept Elixir + Rust toolchains in
its build.
[Yjs ports overview](https://docs.yjs.dev/ecosystem/ports-to-other-languages).

## P2P / mesh substrate (relevant to OPEN_QUESTIONS Q9, transport edge)

**Erlang distribution + `epmd`**. Built into the BEAM. Full-mesh by
default, cookie-based authentication, TLS available. Scales reliably
to a few dozen nodes. EMA fit: zero-cost option for a small trusted
cluster. Inadequate for true mesh (Q9). Surfaces as `gleam/erlang/node`.

**`partisan`** (above). The realistic upgrade path inside the BEAM
when EMA's mesh ambitions outgrow standard distribution.

**`iroh`** ([iroh.computer](https://www.iroh.computer/)). Rust P2P
networking stack focused on direct connections via QUIC, hole-punching,
and PeerId-based dialing. Has an Elixir binding `iroh_ex`
([hex.pm/packages/iroh_ex](https://hex.pm/packages/iroh_ex)) updated
March 2026. Erlang community has been running ~2000-node iroh gossip
stress tests under an Erlang supervisor
([LambdaClass: The Wisdom of Iroh](https://blog.lambdaclass.com/the-wisdom-of-iroh/)).
EMA fit: the most credible BEAM-callable option for actual P2P
(NAT traversal across user machines), assuming a `peer-remote` driver
ever ships. Calling from Gleam goes via Elixir/FFI.

**`libp2p`**. No first-party Erlang or Gleam bindings as of early
2026 [UNVERIFIED for completeness — searches surfaced general libp2p
discussions but no maintained BEAM library]. EMA fit: not a credible
path without writing bindings.

**Hypercore / hyperdrive**. JavaScript/Node ecosystem; no BEAM bindings.
EMA fit: only via a Lustre/JS surface or a separate Node sidecar; not
a daemon-side option.

## Process/identity primitives that map to EMA's needs

**Subjects as typed mailboxes.** A `Subject(msg)` is the unit of
addressable identity at the actor level. EMA fit: any
"who-do-I-talk-to-for-X" question — "the event_log writer", "the
session bound to session_id Y", "the driver for execution Z" —
becomes a `Subject` lookup in a registry.

**`erlang:monitor` / `erlang:link`** (via `gleam/erlang/process`). EMA
fit: the babysitter takeover doctrine (`graph/edges/orchestration.md`)
needs both — link for "die together with my supervisor", monitor for
"notice when this peer actor dies and react without dying myself".
Both are typed in `gleam_erlang`.

**`:global` vs `:pg` vs custom registry.** `:global` is an
auto-replicated name registry across distributed Erlang nodes (one name
per process, cluster-wide). `:pg` (process groups) is one-name-many-pids
across a cluster. Both are accessible via `glixir.registry` or direct
FFI. `processgroups` is a thin Gleam wrapper
([hexdocs.pm/processgroups](https://hexdocs.pm/processgroups/index.html))
and `chip` is a higher-level Gleam registry that combines ideas from
Elixir Registry, Erlang `pg`, and `syn`
([github.com/chouzar/chip](https://github.com/chouzar/chip)). EMA fit:
- Org/Space identity is data, not process — lives in the schema, not
  registry.
- Member/Agent identity that maps to a *running* process (active
  session, live driver) wants `chip` or a typed wrapper over `pg`,
  keyed by `(member_id, session_id)`.
- Cluster-wide singletons (the event_log writer, the dispatch
  reconciler) want `:global` if EMA goes multi-node, otherwise a
  named Subject inside the local supervision tree.

## What Gleam DOESN'T have (and EMA needs)

- **No macros / metaprogramming.** Gleam has no Lisp-style macros and
  no compile-time AST manipulation. The language team is open to a
  future limited form but committed to fast compile times and
  readability over expressiveness
  ([lpil.uk: How to add metaprogramming to Gleam](https://lpil.uk/blog/how-to-add-metaprogramming-to-gleam/);
  [Gleam FAQ](https://gleam.run/frequently-asked-questions/)). EMA
  consequence: every JSON shape, every event_log record, every API
  response needs hand-written encoders/decoders. There is no Ecto
  schema-DSL equivalent and no Phoenix router-DSL equivalent.
  `glemplate` ([hexdocs.pm/glemplate](https://hexdocs.pm/glemplate/))
  exists for templates but parses at startup, not at compile time.

- **No idiomatic ETS / DETS / mnesia bindings.** These are reachable
  only via FFI, and every call is hand-typed
  ([gleam-lang/gleam discussion #1717](https://github.com/gleam-lang/gleam/discussions/1717);
  [Jonas Hietala: Exploring the Gleam FFI](https://www.jonashietala.se/blog/2024/01/11/exploring_the_gleam_ffi/)).
  EMA consequence: the second_brain FTS5 indexer, any in-memory
  presence cache, any `:ets`-backed counter is FFI surface.

- **No Phoenix LiveView equivalent in pure Gleam.** Lustre's server
  components are the closest analogue but the ecosystem is younger.
  EMA consequence: either accept Lustre's posture, or call Phoenix
  LiveView through Elixir (which means accepting an Elixir module in
  the build and calling it via `glixir`).

- **No mature observability suite analogous to Phoenix LiveDashboard.**
  Erlang `:observer` and `:recon` work via FFI; there is no Gleam-side
  visualization. EMA consequence: introspection surfaces (host-truth
  watcher, incident dashboard) need to be built deliberately rather
  than inherited.

- **No native gRPC / Protobuf libraries** comparable to Elixir's
  `grpc` package [UNVERIFIED — search did not surface a maintained
  Gleam gRPC library; if Q5 lands on gRPC for the harness contract,
  this becomes an Erlang/Elixir FFI bridge].

- **No first-class Mnesia migration tooling.** Compare to Ecto's
  migration runner — there is no Gleam analogue. Schema evolution is
  hand-rolled SQL files (with sqlight/parrot) or hand-rolled mnesia
  scripts (via FFI).

- **No idiomatic JSON-Schema / OpenAPI generator** that turns Gleam
  types into a published contract document [UNVERIFIED].

- **No widely-adopted authentication / OIDC libraries.** Surface auth
  for Discord/web/CLI is hand-built or wrapped from Elixir.

- **No first-party libp2p bindings** [UNVERIFIED — no maintained Gleam
  or Erlang library found].

## Concrete proposals (no recommendations)

### `control_plane/event_log`

1. **`sqlight` + custom append helper.** Single SQLite file in WAL
   mode, one writer actor that owns the connection, parameterized
   inserts via a hand-typed wrapper or `parrot`-generated functions.
   Costs: single-node only without operator-managed replication; no
   built-in fan-out beyond LISTEN/NOTIFY-style polling. Buys: zero
   external dependency, atomic durability, easy to reason about,
   identical semantics to the historical SQLite event_log shape.
2. **`pog` + Postgres + `squirrel`.** Postgres pool in the supervision
   tree, `squirrel` generates typed query functions from `.sql`
   files. Costs: external Postgres process, more build-time machinery
   (squirrel needs a live DB to introspect), atom-leak warning on
   pool creation must be respected. Buys: real concurrent writers,
   richer indexing (GIN, full-text), LISTEN/NOTIFY for in-VM
   broadcast, easier multi-node story.
3. **`mnesia` via FFI.** Tables defined in Erlang, accessed from Gleam
   via hand-typed `@external` wrappers. Costs: Mnesia operational
   overhead is real (netsplit recovery, schema upgrades), no Gleam
   typing for table reads beyond what the wrapper enforces, every
   query is FFI. Buys: in-VM, replicated by default, no second
   process to run.

### Drivers

1. **Typed actor per driver, contract via `Subject(DriverMsg)`.** Each
   driver kind is one Gleam module exposing `start_link` returning a
   typed Subject. The driver registry is a `chip` group keyed by
   driver kind. Costs: a new driver is real Gleam code with a real
   actor. Buys: compile-time enforcement that no driver answers a
   message it does not handle; "drivers above providers" rule becomes
   a type, not a doctrine.
2. **One actor + behaviour-style trait via dispatch on a sum type.**
   A single executor actor pattern-matches on the typed
   `DriverTarget` variant and inlines the per-target logic. Costs:
   one giant module, harder to vendor third-party drivers. Buys:
   even tighter compile-time guarantee that all five targets are
   handled (exhaustive match).
3. **Driver as port / external process** for `claude-cli` and
   `codex-cli`, modelled with `gleam/erlang/port`. Costs: process
   lifetime / cleanup is harder than in-VM; per-invocation latency.
   Buys: mirrors the actual CLI invocation shape exactly, no
   in-process model coupling.

### Surfaces

1. **`mist` + `wisp` + `lustre` (server components).** Pure-Gleam
   stack. Costs: Lustre server components are newer than Phoenix
   LiveView; ecosystem of widgets is small. Buys: one language
   end-to-end, shared types between daemon and surface, no Elixir in
   the build.
2. **`mist` + `wisp` for the API surface, separate Next.js / SwiftUI
   surface for Launchpad/HQ.** Costs: a real cross-language contract
   (the AGENT-CONTRACT verbs) maintained at the boundary; surfaces
   evolve independently. Buys: best-in-class native client UX where
   it matters, daemon stays simple.
3. **Phoenix LiveView via Elixir interop.** `mix`-driven Phoenix app
   embedded in the release; daemon logic in Gleam called from Elixir
   controllers. Costs: dual toolchains, Elixir macros / Ecto need
   shadow Elixir code, deployment becomes a Mix release with a Gleam
   dep. Buys: LiveView is mature, Phoenix.PubSub works as before,
   easier near-term migration off the existing Phoenix endpoint.

### Collab

1. **`y_ex` via `glixir`.** Gleam daemon mediates permission and
   storage; Yjs documents live in `y_ex` actors per doc; surfaces
   speak the Yjs binary protocol over WebSocket from `mist`.
   Costs: Elixir + Rust in build; Yjs lacks Snapshots in `y_ex`;
   protocol details must be wrapped. Buys: Yjs is the
   industry-default; client libraries for web/canvas/wiki exist.
2. **`riak_dt` via FFI for state-based CRDT objects.** Daemon stores
   CRDT state in a sqlight table per object; merge on read; broadcast
   updates over WebSocket. Costs: state-based shipping is
   bandwidth-heavy on large objects; no JS-side library to mirror;
   every CRDT type wrapped by hand. Buys: pure-BEAM, no Rust, no
   Elixir.
3. **Centralized event log + per-doc actor with optimistic
   concurrency tokens (no CRDT).** Each doc edit appends to a
   per-doc log; clients reconcile via vector clocks; daemon is
   authority. Costs: not real-time-collab semantics under network
   partition (last-writer-wins or conflict surfacing). Buys:
   simplest model, no third-party CRDT runtime.

### Identity registry

1. **`chip`-backed, schema-stored.** Org/Space/Project/Member rows
   live in sqlight or pog; live actor handles (sessions, drivers
   bound to a member) registered in `chip` keyed by composite IDs.
   Costs: two systems of record (DB + registry) must be kept
   coherent. Buys: separation matches the actual semantics — data
   in DB, processes in registry.
2. **`:global` for cluster-wide singletons + `:pg` for sets via
   `processgroups`.** Lower-level than `chip`. Costs: more boilerplate.
   Buys: closer to the Erlang stdlib, less library risk.

## Verification gates Gleam-side

These complement the 12 gates in `EMA_V0_0_3_PREP.md` "Verification
gates" section with Gleam-specific checks:

1. **All actor types compile-time-checked.** Every long-lived
   component declares its `Subject(Msg)` and the `Msg` sum type;
   `gleam check` passes with no warnings about pattern non-exhaustiveness
   on message handling.
2. **No `dynamic` escape hatches in domain code.** The only places
   `dynamic` (or `decode.Dynamic`) appears are at FFI boundaries
   (Erlang interop, raw HTTP body parse, raw JSON parse). A grep
   over `src/ema/` for `dynamic` returns only files explicitly named
   `*_ffi.gleam` or `*_decoder.gleam`.
3. **Schema migrations are explicit Gleam (or SQL) files.** No
   auto-generated migrations from a derive-style macro (which Gleam
   does not have anyway). Each schema change is a numbered SQL file
   under `priv/migrations/` applied in order by a small migration
   actor at boot.
4. **Every supervisor tree is grounded in a typed module per OTP
   application.** Each `(NEW)` subtree in the v0.0.3 sketch
   (identity/registry, drivers/registry, collab/supervisor) has its
   own `*_supervisor.gleam` returning a typed `Supervisor` value;
   `application.gleam` composes them with `static_supervisor` builder
   calls in the documented order.
5. **Property-based tests via `qcheck`.** At minimum: ID-distinctness
   property (no decoder ever produces an `execution_id` from a
   `session_id` JSON); event_log replay determinism property
   (replaying the same byte sequence yields the same in-memory
   snapshot); driver-target exhaustiveness property (every
   `DriverTarget` variant has a registered actor)
   ([hexdocs.pm/qcheck](https://hexdocs.pm/qcheck/)).
6. **`gleeunit` round-trip tests** for every encoder/decoder pair
   ensuring `decode(encode(x)) == Ok(x)`
   ([hexdocs.pm/gleeunit](https://hexdocs.pm/gleeunit/)).
7. **FFI boundary surface enumerated.** A single
   `priv/FFI_INVENTORY.md` lists every `@external` call, the Erlang
   or Elixir module it targets, and the typed wrapper module that
   owns it. Compiler-enforced via a build-time check that no other
   file declares `@external`.
8. **Build reproducibility.** `gleam export erlang-shipment` produces
   the same byte output for the same input commit; the resulting
   release boots and runs the supervision tree in the documented
   order under `gleam test --target=erlang`.
9. **Distributed-Erlang-readiness gate (does NOT require running
   distributed).** A grep ensures no module imports
   `gleam/erlang/node` outside of `transport/` and
   `drivers/peer_remote/`. This keeps the deferred Q9 deferred at
   the type level.

## Provenance

Internal:

- `/Users/tawj/Desktop/ema 0.0.3/ema-transfer-pack-20260422-060938/EMA_V0_0_3_PREP.md`
- `/Users/tawj/Desktop/ema 0.0.3/ema-transfer-pack-20260422-060938/MACBOOK_AGENT_HANDOFF_MASTER.md`
- `/Users/tawj/Desktop/ema 0.0.3/ema-transfer-pack-20260422-060938/OPEN_QUESTIONS.md`
- `/Users/tawj/Desktop/ema 0.0.3/ema-transfer-pack-20260422-060938/GLOSSARY.md`
- `/Users/tawj/Desktop/ema 0.0.3/ema-transfer-pack-20260422-060938/graph/edges/execution.md`
- `/Users/tawj/Desktop/ema 0.0.3/ema-transfer-pack-20260422-060938/graph/edges/authority.md`
- `/Users/tawj/Desktop/ema 0.0.3/ema-transfer-pack-20260422-060938/graph/edges/orchestration.md`
- `/Users/tawj/Desktop/ema 0.0.3/ema-transfer-pack-20260422-060938/graph/edges/transport.md`

External (every URL fetched or referenced during research):

- https://gleam.run/
- https://gleam.run/frequently-asked-questions/
- https://hexdocs.pm/gleam_stdlib/
- https://hexdocs.pm/gleam_otp/
- https://hexdocs.pm/gleam_otp/gleam/otp/actor.html
- https://hexdocs.pm/gleam_otp/gleam/otp/static_supervisor.html
- https://hexdocs.pm/gleam_otp/gleam/otp/factory_supervisor.html
- https://github.com/gleam-lang/otp
- https://hexdocs.pm/gleam_erlang/
- https://hexdocs.pm/gleam_erlang/gleam/erlang/process.html
- https://hexdocs.pm/gleam_javascript/
- https://hexdocs.pm/mist/
- https://hexdocs.pm/wisp/
- https://hexdocs.pm/lustre/
- https://hexdocs.pm/sqlight/
- https://hexdocs.pm/gleam_pgo/
- https://github.com/lpil/pog
- https://hexdocs.pm/squirrel/
- https://hexdocs.pm/parrot/
- https://hexdocs.pm/gleam_json/
- https://hexdocs.pm/gleeunit/
- https://hexdocs.pm/qcheck/
- https://hexdocs.pm/glixir/
- https://hexdocs.pm/processgroups/index.html
- https://hexdocs.pm/glemplate/
- https://github.com/chouzar/chip
- https://github.com/QuinnWilton/strucord
- https://github.com/gleam-lang/gleam/discussions/1717
- https://github.com/basho/riak_dt
- https://github.com/lasp-lang/partisan
- https://github.com/rabbitmq/ra
- https://github.com/satoren/y_ex
- https://docs.yjs.dev/ecosystem/ports-to-other-languages
- https://www.iroh.computer/
- https://hex.pm/packages/iroh_ex
- https://blog.lambdaclass.com/the-wisdom-of-iroh/
- https://learnyousomeerlang.com/mnesia
- https://www.erlang-solutions.com/webinars/gleams-interoperability-with-erlang-and-elixir/
- https://blog.appsignal.com/2024/07/23/enhancing-your-elixir-codebase-with-gleam.html
- https://www.jonashietala.se/blog/2024/01/11/exploring_the_gleam_ffi/
- https://lpil.uk/blog/how-to-add-metaprogramming-to-gleam/
- https://www.infoq.com/news/2024/03/gleam-erlang-virtual-machine-1-0/
- https://hex.pm/

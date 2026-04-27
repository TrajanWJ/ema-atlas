# Collaboration plane — option survey

> Survey of BEAM-side substrates for EMA's docs/wiki/canvas/threads
> collaboration. OPEN_QUESTIONS Q2 (where collaboration state lives) and
> Q8 (sync model) drive the analysis. No recommendation.

This survey enumerates the substrates EMA could plausibly adopt for the
collaboration plane named in `graph/edges/collab.md`: the wiki (semantic
layer), shared docs / canvas, threads, and any future inline-prompting
surface. The selection lens is "what can a Gleam/Elixir daemon actually
host or mediate," because the daemon is the auth/permission gateway per
`graph/edges/collab.md` and is also the object EMA already owns. Pure
JS/Rust libraries appear here only when there is a credible BEAM-side
embedding path (NIF binding, WebSocket bridge, sidecar process).

## What the collab plane must support (from briefs)

The requirements below are extracted directly from
`content/briefs/semantic-layer.md`,
`content/briefs/shared-workspace.md`,
`content/briefs/mesh-replication.md`, and the Wiki / Threads / Blueprint
sections of `05-fresh-context-project-app-model.md`:

- **Synchronous multi-user editing.** "Shared Google Docs + Discord +
  Wikipedia + Obsidian feel," with comment, edit, and prompt inline
  (`05-fresh-context-project-app-model.md` §1).
- **Agent-as-editor with attribution.** The inline-prompting model
  defines an "agent op = proposal referencing object_id+range"
  (`graph/edges/collab.md`); semantic-layer brief calls out attribution
  as Q1-dependent.
- **Durable history with branch references.** Wiki edits must be able
  to "reference control-plane execution records"
  (`graph/edges/collab.md`); the Blueprint builder must integrate with
  intent capture and persist (§5 of the 05- doc).
- **Org/Space-scoped permission gating.** Each project belongs to an
  org or is personal; per-Space datasets exist; the personal AI has
  cross-project visibility subject to membership
  (`05-fresh-context-project-app-model.md` "Confirmed new context").
- **Embedding execution lineage references.** The semantic layer is
  "the durable substrate of meaning that control-plane records and
  execution lineage point at" (`semantic-layer.md`).
- **Promotion path.** Wiki-node to proposal/blueprint/dispatch
  promotion is named but unschemaed; the substrate must not foreclose
  it (`semantic-layer.md` §"What's still open").
- **Agent op = ranged proposal.** Agents reference `object_id + range`,
  not whole-doc replace (`graph/edges/collab.md`,
  `semantic-layer.md` "Living Notebook-City").
- **Workspace-as-projection discipline.** "Surfaces do not own state"
  must hold even where the artifact "feels like a document"
  (`shared-workspace.md` §"The frame").
- **Long-term: offline-first replicas.** Mesh brief commits to
  P2P-first direction; Q9 will eventually decide which collab objects
  cross peers (`mesh-replication.md` §"What's already true",
  `OPEN_QUESTIONS.md` Q9).
- **Threads/Server with multi-agent visible conversations.** EMA's
  Discord-replacement surface needs message history control and
  "visible multi-agent conversations/DMs"
  (`05-fresh-context-project-app-model.md` §3).

## Pure CRDT options

### Yjs (JS) / Y-CRDT (Rust) via `y_ex`

Yjs is the dominant CRDT for collaborative text. The `y_ex` Hex package
is an Elixir Rustler-NIF wrapper around the Rust `yrs` port of Yjs,
maintained by `satoren`, MIT-licensed, latest version 0.10.5 (April
2026), ~1.5K weekly downloads
([hex.pm/packages/y_ex](https://hex.pm/packages/y_ex);
[github.com/satoren/y_ex](https://github.com/satoren/y_ex)). It exposes
`YText`, `YMap`, `YArray`, XML elements, sub-documents, observers, and
recursive nesting
([discuss.yjs.dev y\_ex thread](https://discuss.yjs.dev/t/yrs-elixir-bindings/2826)).
There is also `MRGRAVITY817/yex` as a parallel binding effort
([github.com/MRGRAVITY817/yex](https://github.com/MRGRAVITY817/yex)).

Yjs is a **state-based** CRDT internally (with delta encoding for the
wire); the protocol is well-documented at
[docs.yjs.dev](https://docs.yjs.dev/api/about-awareness). For a
Gleam-on-BEAM daemon, access is through Elixir interop or by running a
small Elixir node alongside the Gleam app — Gleam targets the same VM,
so a `y_ex`-hosting Elixir module is callable from Gleam. Alternatively,
the daemon can run a WebSocket Yjs server and treat Yjs as opaque blobs.

DEV.to and Medium walkthroughs show real Phoenix-LiveView-plus-Yjs
deployments (`ndrean/LiveView-PWA`, `dwyl/PWA-Liveview`) where Postgres
or SQLite stores the op log and LiveView fans operations out via PubSub
([dev.to LiveView CRDT
guide](https://dev.to/hexshift/how-to-build-collaborative-real-time-interfaces-in-phoenix-liveview-with-crdts-2iop);
[github.com/ndrean/LiveView-PWA](https://github.com/ndrean/LiveView-PWA);
[github.com/dwyl/PWA-Liveview](https://github.com/dwyl/PWA-Liveview)).
Browser-side Yjs ships a rich editor-binding ecosystem (ProseMirror,
TipTap, CodeMirror) which the wiki's Claude.ai-style UI inspiration
likely needs.

### Automerge (Rust core)

Automerge is a JSON-shaped CRDT with a Rust core, JS/Swift/Python/Java
bindings, columnar binary encoding, and a documented sync protocol
([github.com/automerge/automerge](https://github.com/automerge/automerge);
[automerge.org](https://automerge.github.io/)). It compresses to roughly
4–6 bytes/char of metadata, vs raw text — still 40–60% overhead
([systemdr.substack.com OT vs
CRDT](https://systemdr.substack.com/p/crdts-vs-operational-transformation)).
Each change carries an `ActorId` + sequence number plus dependency
hashes and an optional commit message
([automerge.org Rust
docs](https://automerge.org/automerge/automerge/struct.ActorId.html);
[liangrunda.com automerge
internals](https://liangrunda.com/posts/automerge-internal-2/)). Unlike
Yjs, Automerge ships first-class change history and named commits.

There is **no actively maintained Elixir Automerge binding on Hex** as
of this survey; a Gleam-via-Rustler binding existed and was retired
([general search:
automerge BEAM](https://hex.pm/packages/automerge)). Adoption requires
either writing a Rustler NIF wrapper or running Automerge as a sidecar
service speaking its sync protocol.

### Riak DT (Erlang)

`basho/riak_dt` is the canonical Erlang CRDT library, Apache-2.0,
implementing flags, registers, counters, sets (including ORSWOT), and
maps, all QuickCheck-tested
([github.com/basho/riak\_dt](https://github.com/basho/riak_dt);
[docs.riak.com data
types](https://docs.riak.com/riak/kv/latest/developing/data-types/index.html)).
It is **state-based** and well-suited to small JSON-shaped objects, not
rich text. The upstream prototype branch was archived as Riak KV
absorbed CRDT support directly, but `riak_dt` remains a reusable
library. The Hex package was last updated Feb 2016, so it is "stable but
unmaintained" rather than "current"
([hex.pm/packages/riak\_dt](https://hex.pm/packages/riak_dt)).

Native to BEAM. Callable from Gleam via Erlang FFI (`@external`).
Excellent for things like "set of agent IDs in a thread," "counter of
unread mentions," "map of presence facts." Poor for the wiki's
collaborative prose.

### DeltaCrdt (`delta_crdt_ex`)

`derekkraan/delta_crdt_ex` implements Almeida 2016 delta-state CRDTs in
pure Elixir, MIT, used internally by Horde.Registry and Horde.Supervisor
([github.com/derekkraan/delta\_crdt\_ex](https://github.com/derekkraan/delta_crdt_ex);
[hexdocs.pm/delta\_crdt](https://hexdocs.pm/delta_crdt/DeltaCrdt.html)).
The core type shipped is `DeltaCrdt.AWLWWMap` (Add-Wins
Last-Writer-Wins map). The library handles its own anti-entropy gossip
on a configurable interval (default 200 ms) between named neighbours
([medium.com Derek
Kraan](https://medium.com/@derek.kraan2/how-deltacrdt-can-help-you-write-distributed-elixir-applications-dc838c383ad5);
[workos.com Delta CRDT
post](https://workos.com/blog/in-memory-distributed-state-with-delta-crdts)).

Native to BEAM, easy to host inside the daemon supervision tree, but the
shipped data type is a key/value map — anything richer (rich text,
ordered list with intent, tree structure) must be encoded on top, which
is exactly the OT-class problem CRDT was meant to avoid.

### Lattice CRDT family (Gleam)

The Gleam package index lists a coherent CRDT family: `lattice_crdt`
(umbrella), `lattice_core` (version vectors, dot contexts),
`lattice_counters` (G-counter, PN-counter), `lattice_registers` (LWW,
MV), `lattice_sets` (G-Set, 2P-Set, OR-Set), and `lattice_maps` (LWW
map, OR map) — all v1.0 / 2.0 in 2026
([packages.gleam.run](https://packages.gleam.run/)). This is the only
native-Gleam CRDT toolkit and is small but matches the EMA daemon
language directly. It does **not** ship a sequence/text CRDT, so prose
editing would require building or borrowing one.

### Hypothetical: pure-Gleam minimal CRDT (op-log + grow-only set)

A pragmatic floor: a per-object append-only op log keyed by
`(actor_id, lamport_clock)`, plus a grow-only set of seen op-ids for
dedup. Equivalent expressive power to a delta-LWW-map without external
dependencies. Implementable in a single Gleam module on top of
`lattice_core` version vectors. Cannot do convergent rich text but can
sequence small structured edits.

## Operational transform alternatives

### ShareDB / Codemirror collab — same cross-runtime situation as Yjs

ShareDB is a Node.js OT server built around JSON0/text0
transformations, with a presence sub-protocol
([share.github.io/sharedb](https://share.github.io/sharedb/);
[github.com/teamwork/sharedb](https://github.com/teamwork/sharedb)).
There is no BEAM-native port. EMA could only consume ShareDB via a
sidecar Node process, with the daemon mediating auth at the WebSocket
seam. This buys Google-Docs-style intent preservation for rich text but
introduces a non-BEAM service in the trust boundary.

### Custom append-only event log per object (no CRDT, just sequencing)

The "centralized event log" variant in `OPEN_QUESTIONS.md` Q8. Single
writer per object via pessimistic lock; ops applied in order; offline
edits become "rejected, please rebase." Trivially implementable in
Gleam/Elixir on top of `event_log.ex` patterns already used by EMA's
control plane. Loses simultaneous editing; gains perfect audit.

This is also Fiberplane's choice — they argue OT-on-a-server keeps
intent semantics that CRDTs flatten away, particularly for richly
structured documents
([fiberplane.com OT vs
CRDT](https://fiberplane.com/blog/why-we-at-fiberplane-use-operational-transformation-instead-of-crdt/);
[tiny.cloud OT vs
CRDT](https://www.tiny.cloud/blog/real-time-collaboration-ot-vs-crdt/)).
The arxiv treatment by Sun et al. catalogues exactly which intent
properties CRDTs preserve and which they don't
([arxiv 1905.01517](https://arxiv.org/pdf/1905.01517)).

## Hybrid approaches

### Authoritative server sequence + opportunistic CRDT for offline edits

The pattern used by Phoenix.Sync / ElectricSQL: Postgres is the source
of truth, shapes are streamed to clients, and clients can buffer local
ops for replay
([github.com/electric-sql/phoenix\_sync](https://github.com/electric-sql/phoenix_sync);
[electric-sql.com phoenix
docs](https://electric-sql.com/docs/integrations/phoenix)). Online,
behaviour matches a sequenced log. Offline, a per-client CRDT (Yjs is
common) absorbs edits, then reconciles on reconnection. Phoenix.Sync is
explicitly framed as "the secret sauce behind fast, collaborative apps
like Figma and Linear"
([elixirconf.eu Phoenix.Sync
keynote](https://www.elixirconf.eu/keynotes/keynote-phoenix-sync-with-electricsql/)).
Fits EMA's "single-node clarity first, mesh later"
(`graph/edges/transport.md`) very cleanly.

### Per-object policy: some objects are CRDT, some are sequenced

Mesh brief explicitly contemplates this: "free-form notes, drafts" CRDT;
"handoffs, plans, status" arbitrated
(`mesh-replication.md` §"Workspace as Replica-Friendly Substrate"). Each
object type declares its convergence policy in a registry; the daemon
routes ops to the right substrate. Most expensive to design, most
faithful to the brief's actual demands.

### Slot for rich text vs structured docs separately

Wiki prose → Yjs YText with a ProseMirror binding. Wiki frontmatter,
edge metadata, semantic-layer node references → Riak DT or
DeltaCrdt-style maps. Threads → append-only event log. Three substrates,
one daemon, one auth gateway. Maps onto the "Living Notebook-City" +
"Federated Memory Substrate" gradient in `semantic-layer.md`.

## Each option's EMA-fit story

**Yjs via `y_ex`.** Buys collaborative rich text immediately, with a
huge editor-binding ecosystem that matches the Claude.ai UI inspiration
in the 05- doc. Costs: introduces a Rustler NIF and a non-Gleam-native
data model; daemon must serialize Yjs updates and store them in
`event_log` for audit. Makes Q5 (driver contract) urgent — agent-as-
editor needs the daemon to mediate Yjs ops with attribution, which means
the harness/driver contract must let an agent emit a structured "insert
range with origin=agent_x" rather than just a text reply.

**Automerge.** Buys principled change history with named commits and
Git-style branches — closest fit for the Blueprint builder's Karpathy-
style "structured knowledge with provenance." Costs: no maintained BEAM
binding, so EMA must own the Rustler wrapper or run a sidecar; columnar
overhead is real on small docs; forces a build investment before any
collab feature ships.

**Riak DT.** Buys solid native-BEAM CRDT primitives for the small
structured pieces (presence sets, mention counters, capability flags).
Costs: stale Hex package, no sequence/text type, no native rich-text
story. Picking it forces an explicit second substrate for prose and
makes "wiki page" a composite object.

**DeltaCrdt.** Buys Horde-grade in-process distributed map state with no
external runtime. Costs: only AWLWW maps out of the box; the
anti-entropy gossip assumes peers know each other (Horde.Cluster style),
which collides with the Q9-deferred mesh story; does not solve rich
text. Picking it makes Q9 (replication boundary) urgent because the
neighbour set is now load-bearing.

**Lattice CRDT family (Gleam).** Buys language-native CRDT primitives
with no FFI. Costs: young (1.0/2.0 in early 2026), no production track
record, no sequence type. Picking it commits EMA to either writing a
sequence CRDT or pairing this with a separate prose substrate.

**Hand-rolled op-log + grow-only set in Gleam.** Buys total ownership,
zero external dependencies, perfect alignment with the Gleam daemon.
Costs: every new object type means new convergence reasoning; no chance
of borrowing a community editor binding; rich text is effectively
ruled out.

**ShareDB.** Buys mature OT-for-rich-text and presence. Costs:
introduces Node into the trust boundary; daemon becomes a proxy/auth
gateway in front of ShareDB rather than the substrate owner; audit and
attribution sit outside BEAM.

**Append-only event log per object (Gleam-native).** Buys the smallest
possible substrate, perfectly aligned with `event_log.ex` already in the
daemon. Costs: kills simultaneous editing — explicitly named as a
tradeoff in `semantic-layer.md` decision pressure §5. Works only if the
wiki's "feel" can be achieved with sub-second turn-taking instead of
true co-cursor.

**Hybrid (Phoenix.Sync-shape).** Buys server-authoritative simplicity
now and an offline-first ramp later. Costs: ties EMA to Postgres as the
canonical store, which collides with the daemon's current Erlang/Elixir-
data-store assumptions; forces a decision on whether the wiki lives in
Postgres or in the existing workspace store.

**Per-object policy.** Buys exact fit to the brief. Costs: most design
work; introduces a registry that becomes its own object type; multiple
test harnesses.

**Slot-by-content-shape.** Buys best-of-breed per shape (Yjs for prose,
Riak DT for metadata, event log for threads). Costs: three substrates
to maintain, three audit stories to reconcile.

## Identity / attribution implications

- **Yjs** records `clientID` (a 32-bit integer) per op and supports an
  arbitrary `origin` field on transactions and awareness updates
  ([docs.yjs.dev awareness](https://docs.yjs.dev/api/about-awareness)).
  Agent attribution requires EMA to mint a stable `clientID` per agent
  identity and to populate `origin` with the agent/principal pair. If
  Q1 lands "agents are first-class members," `clientID` maps directly
  to agent identity; if not, every agent op must carry the human
  principal in `origin` and the `clientID` becomes a session token.

- **Automerge** has first-class `ActorId` per change with sequence
  numbers, dep hashes, and optional commit messages
  ([automerge.org Rust ActorId
  docs](https://automerge.org/automerge/automerge/struct.ActorId.html)).
  Closest fit for "agent-as-first-class-member" because attribution is
  immutable and built into the data model. Changing actor mid-session
  is explicitly discouraged
  ([liangrunda.com automerge
  internals](https://liangrunda.com/posts/automerge-internal-2/)),
  which constrains how EMA models "agent acting on behalf of human."

- **Riak DT** has no inherent author field; ORSWOT carries unique tags
  per add but those are randomness, not identity. Attribution must be
  layered on (e.g. by storing `{actor_id, payload}` in the set).

- **DeltaCrdt** AWLWWMap stores no actor — values overwrite by
  timestamp. EMA would have to encode authorship in the value tuple.

- **Lattice CRDTs (Gleam)** — registers and maps store value+timestamp;
  authorship is application-layer.

- **Pure op-log** — actor is whatever EMA puts in the op envelope.
  Most flexible, least standardized.

- **ShareDB** — has a `src` field per op identifying the connection;
  attribution is application-layer beyond that
  ([share.github.io/sharedb](https://share.github.io/sharedb/)).

- **Append-only event log** — actor is whatever EMA puts in the event;
  same as op-log, just centrally sequenced.

In every case, the "agent op = proposal referencing object_id+range"
shape from `graph/edges/collab.md` requires EMA to wrap the substrate
op in an envelope: substrate-op + agent_id + principal + lineage_ref.
The substrates differ in whether they make space for that envelope
natively (Automerge: yes via change message; Yjs: yes via origin; Riak
DT / DeltaCrdt: must be in payload).

## Permission gating implications

`graph/edges/collab.md` is unambiguous: "Daemon is the auth/permission
gateway." The substrate choice determines what the daemon mediates.

- **Yjs** ops are opaque binary updates. Permission gating means the
  daemon authenticates the WebSocket / channel and authorises *whether*
  the client may sync this document, not what's in each op. Field-level
  permissions (e.g. "agents may not edit the canonical block") require
  the daemon to parse Yjs updates server-side, which is slower than
  the typical "blob relay" pattern.

- **Automerge** changes are inspectable on the server (the Rust API
  exposes change contents), so per-field policies are tractable. Cost:
  daemon must keep a server-side replica to interpret incoming changes.

- **Riak DT** lives in-process; permission gating is a Gleam/Elixir
  function call before the operation reaches the type. Cleanest per-op
  authorisation surface.

- **DeltaCrdt** — same story as Riak DT for in-process auth, plus the
  daemon controls the gossip neighbour set, which is itself a
  permission boundary.

- **Lattice CRDTs (Gleam)** — same in-process story.

- **ShareDB** has an `agent` middleware hook
  ([share.github.io/sharedb](https://share.github.io/sharedb/)) but
  enforcement runs in Node. EMA would either re-implement gating in
  Gleam in front of ShareDB or trust the Node side, which violates the
  daemon-as-gateway rule.

- **Append-only event log** — gating is checked before append. Closest
  fit to the existing `control_plane/event_log.ex` discipline.

Org/Space scoping (per the 05- doc and `shared-workspace.md` Q3)
intersects with substrate at the question of *document identity*. CRDTs
generally key by document ID; Org/Space scoping is layered above. The
worst case is a substrate that gossips automatically between unrelated
documents (DeltaCrdt's neighbour set is the failure mode to watch for
here).

## Testing implications

- **Yjs / Automerge / OT generally** — concurrency replay is the core
  test. Property tests generate interleaved op sequences across N
  simulated clients and assert convergence + intent preservation. The
  Sun et al. paper formalises exactly which intent properties to test
  for ([arxiv 1810.02137](https://arxiv.org/pdf/1810.02137)).
  Network-partition simulation matters: split, edit on both sides,
  rejoin, assert merged state matches reference.

- **Riak DT** ships QuickCheck tests upstream; EMA inherits them. New
  tests cover the *envelope* (attribution, lineage refs).

- **DeltaCrdt** — gossip-interval tests, neighbour-departure tests,
  anti-entropy correctness. The library's own test suite covers the
  core; EMA tests would target the "what happens when a peer leaves
  mid-sync" envelope.

- **Lattice CRDTs (Gleam)** — being young, EMA likely needs to
  contribute property tests upstream. Same shape as Riak DT testing.

- **Pure op-log / event-log** — sequencing tests, lock contention
  tests, "what happens on simultaneous append" tests. Simpler than
  CRDT test surface; most of the work shifts to UI tests for
  conflict-resolution UX.

- **Hybrid (Phoenix.Sync)** — both. Server-side sequencing tests plus
  client-side CRDT replay tests plus reconciliation tests across the
  seam.

- **Slot-by-content-shape** — N substrates means N test harnesses plus
  envelope tests for cross-substrate references (e.g. "wiki page YText
  references thread event whose ID lives in a Riak DT set").

## Migration story

CRDT-to-CRDT migrations are generally feasible because both sides have
materialised state; the migration is "snapshot current state, write into
new substrate, switch writers." OT-to-CRDT (or vice versa) is harder
because OT requires a transformation history, not just a state.

- **Yjs → Automerge.** Snapshot Yjs `YText`/`YMap` to JSON, ingest into
  Automerge with a single bootstrap actor and synthesised commit. Loss:
  per-character authorship history.

- **Yjs → event-log.** Snapshot to markdown/JSON, append a single
  "imported" event. Loss: collaborative editing capability and
  per-edit history.

- **Automerge → Yjs.** Snapshot current document state, hydrate into
  Yjs. Loss: change-history depth (Automerge's named commits do not
  map onto Yjs's flat update log).

- **Riak DT → DeltaCrdt or vice versa.** Both are key/value at heart;
  iterate and re-insert. Trivial.

- **DeltaCrdt → Lattice CRDTs (Gleam).** Both are LWW-map-shaped;
  trivial copy.

- **Pure op-log → CRDT.** Replay the op-log into the CRDT once;
  thereafter the CRDT is canonical and the old log is archive.

- **CRDT → pure op-log.** Snapshot current state as a single "imported"
  event; subsequent edits become explicit ops with locking. Loss:
  simultaneous editing.

- **Hybrid (Phoenix.Sync) migration.** Phoenix.Sync's Postgres anchor
  means a substrate switch is equivalent to a Postgres-schema migration
  on the server side and a CRDT-replacement on the client side; the
  shape definitions decouple the two.

- **ShareDB → anything.** Snapshot the JSON document; everything
  downstream is the source case above. ShareDB's OT history is not
  meaningfully transferable.

The sharpest migration risk is **identity-model-driven**, not
substrate-driven: if Q1 resolves "agents not first-class" after EMA has
shipped Yjs with `clientID == agent_id`, every historical op needs
re-attribution to a human principal. Any substrate that bakes
attribution into the op (Automerge, Yjs with non-trivial origin) makes
this migration painful; any substrate that wraps the substrate-op in an
EMA envelope makes it cheap.

## Provenance

- [github.com/derekkraan/delta\_crdt\_ex](https://github.com/derekkraan/delta_crdt_ex) — DeltaCrdt repo, license, AWLWWMap.
- [hexdocs.pm/delta\_crdt](https://hexdocs.pm/delta_crdt/DeltaCrdt.html) — DeltaCrdt API docs.
- [medium.com Derek Kraan DeltaCrdt post](https://medium.com/@derek.kraan2/how-deltacrdt-can-help-you-write-distributed-elixir-applications-dc838c383ad5) — Almeida 2016 algorithm reference, gossip interval default.
- [workos.com Delta CRDT post](https://workos.com/blog/in-memory-distributed-state-with-delta-crdts) — Horde.Registry / Horde.Supervisor built on DeltaCrdt.
- [github.com/basho/riak\_dt](https://github.com/basho/riak_dt) — Riak DT repo, license, ORSWOT, Map.
- [docs.riak.com data types](https://docs.riak.com/riak/kv/latest/developing/data-types/index.html) — flags, registers, counters, sets, maps catalogue.
- [hex.pm/packages/riak\_dt](https://hex.pm/packages/riak_dt) — last-update date Feb 2016 [UNVERIFIED date pulled from search snippet, not directly fetched].
- [hex.pm/packages/y\_ex](https://hex.pm/packages/y_ex) — y\_ex 0.10.5, MIT, April 2026.
- [github.com/satoren/y\_ex](https://github.com/satoren/y_ex) — y\_ex repo.
- [discuss.yjs.dev y\_ex thread](https://discuss.yjs.dev/t/yrs-elixir-bindings/2826) — feature surface (YText, YMap, YArray, XML, sub-docs).
- [github.com/MRGRAVITY817/yex](https://github.com/MRGRAVITY817/yex) — alternative binding.
- [docs.yjs.dev awareness](https://docs.yjs.dev/api/about-awareness) — origin field and awareness protocol.
- [github.com/yjs/y-protocols](https://github.com/yjs/y-protocols) — awareness wire protocol.
- [github.com/automerge/automerge](https://github.com/automerge/automerge) — Automerge repo, JS/Rust core.
- [automerge.github.io](https://automerge.github.io/) — Automerge homepage, sync protocol claim.
- [automerge.org Rust ActorId docs](https://automerge.org/automerge/automerge/struct.ActorId.html) — ActorId structure.
- [liangrunda.com automerge internals](https://liangrunda.com/posts/automerge-internal-2/) — change metadata, dep hashes, actor change discouragement.
- [packages.gleam.run](https://packages.gleam.run/) — Gleam package index, lattice family.
- [share.github.io/sharedb](https://share.github.io/sharedb/) — ShareDB intro, OT model, presence, agent middleware.
- [github.com/teamwork/sharedb](https://github.com/teamwork/sharedb) — ShareDB fork.
- [fiberplane.com OT vs CRDT](https://fiberplane.com/blog/why-we-at-fiberplane-use-operational-transformation-instead-of-crdt/) — intent-preservation argument for OT.
- [tiny.cloud OT vs CRDT](https://www.tiny.cloud/blog/real-time-collaboration-ot-vs-crdt/) — overview comparison.
- [systemdr.substack.com OT vs CRDT](https://systemdr.substack.com/p/crdts-vs-operational-transformation) — Automerge size overhead figure (4–6 bytes/char).
- [arxiv 1905.01517](https://arxiv.org/pdf/1905.01517) — Sun et al., "Real Differences between OT and CRDT…" v1.
- [arxiv 1810.02137](https://arxiv.org/pdf/1810.02137) — Sun et al., earlier version covering intent properties.
- [github.com/electric-sql/phoenix\_sync](https://github.com/electric-sql/phoenix_sync) — Phoenix.Sync repo.
- [electric-sql.com phoenix docs](https://electric-sql.com/docs/integrations/phoenix) — Phoenix integration.
- [elixirconf.eu Phoenix.Sync keynote](https://www.elixirconf.eu/keynotes/keynote-phoenix-sync-with-electricsql/) — "secret sauce behind Figma and Linear" framing.
- [dev.to LiveView CRDT guide](https://dev.to/hexshift/how-to-build-collaborative-real-time-interfaces-in-phoenix-liveview-with-crdts-2iop) — LiveView+Yjs pattern.
- [github.com/ndrean/LiveView-PWA](https://github.com/ndrean/LiveView-PWA) — LiveView+Yjs example.
- [github.com/dwyl/PWA-Liveview](https://github.com/dwyl/PWA-Liveview) — multi-page LiveView+Yjs.
- [crdt.tech](https://crdt.tech/) — general CRDT background.

[UNVERIFIED] claims:
- Lattice CRDT family version numbers (1.0/2.0) and "updated approximately one week ago" — taken from packages.gleam.run search snippet, not from each package's individual page.
- Riak DT Hex package "last updated Feb 2016" — from search-result snippet, not directly verified against hex.pm/packages/riak_dt page.
- "No actively maintained Elixir Automerge binding on Hex" — based on absence of results in targeted searches; not exhaustively confirmed against every Hex package.
- Gleam/Erlang FFI reachability of `riak_dt` from Gleam — true in principle for Erlang libraries, but no example of `riak_dt` specifically called from Gleam was located.

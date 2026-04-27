# Decision matrix — Q8 (Sync model for docs/wiki/canvas)

Per-question decision matrix for resolving Q8 in
[`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md). Follows the shape laid
out in [`content/decision-matrix-template.md`](../decision-matrix-template.md)
verbatim.

> Q8 is a sub-question of Q2 (where collab state lives). Treat this
> matrix as sharpening Q2's sync-semantics axis.

## Question

`Q8` — `Sync model for docs/wiki/canvas`

(Restated verbatim from [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) Q8.)

The question's stated **blast radius** is "sub-question of Q2." Q8
decides what *sync semantics* the collab substrate exposes (how
concurrent edits merge), whereas Q2 decides *where* the state lives
(which substrate). The two should be resolved together if possible.

`OPEN_QUESTIONS.md` names four variants: `append-only`, `CRDT`, `OT`,
`hybrid`. Option texts below expand these against
[`research/COLLAB_PLANE_OPTIONS.md`](../../research/COLLAB_PLANE_OPTIONS.md)
and the current
[`research/build-steps/05-collab-substrate-skeleton.md`](../../research/build-steps/05-collab-substrate-skeleton.md)
assumption (per-object event-log as the reversible default).

## Options being weighed

| Option | Short name | One-line description |
|---|---|---|
| Option A | `append-only-per-object` | Every collab object is an append-only event log. Concurrent edits produce two entries; a reconciler materialises a view. No automatic merge; a conflict is surfaced as a side-by-side until a human picks. This is Step 5's coded default. |
| Option B | `CRDT-merge` | Ops carry CRDT metadata (Lamport clocks, actor ids). Concurrent writes merge automatically using a lattice. Yjs (rich text, via `y_ex`) and Riak DT (typed maps/sets, BEAM-native) are the two concrete substrates from `COLLAB_PLANE_OPTIONS.md`. |
| Option C | `OT-operational-transform` | Central server rewrites concurrent ops into a linear history (classical Google-Docs sync model). Requires an authoritative server — fits a single-node EMA, harder under P2P (Q9). |
| Option D | `hybrid-by-content-shape` | Rich text uses Yjs (Option B-Yjs); structured docs (cards, tasks, wiki frontmatter) use per-object event-log with typed reducers (Option A). The envelope around every op is EMA-controlled so the substrate swap is one module deep. |

## Criteria

| Criterion | Why it matters | A append-only | B CRDT | C OT | D hybrid |
|---|---|---|---|---|---|
| Aligns with canonical rule (P1 + P9) | Collab plane adjacent, daemon is auth gateway | + (daemon fully owns log) | 0 (CRDT metadata mostly opaque to daemon) | + (central OT server == daemon) | + (daemon owns envelopes; substrates underneath) |
| Works for rich text | Wiki/canvas core | – (no merge = clunky multi-edit) | + (Yjs is production-grade here) | + (OT is the canonical rich-text sync model) | + (rich text uses Yjs inside the hybrid) |
| Works for structured data | Tasks, cards, wiki frontmatter | + (reducers are typed) | 0 (Riak DT maps/sets work but can be awkward for complex schemas) | 0 (OT on structured is unnatural) | + (structured uses the typed-reducer path) |
| Reversible | Can migrate off cleanly | + (log is the ground truth; replay into anything) | – (Yjs/Riak DT binary state; migration off is lossy) | 0 (OT server state can be dumped, reconstructed) | + (envelopes make swap per-object) |
| Compatible with Q9 deferred | Single-node v0.0.3 OK | + (single-node trivial) | 0 (Yjs is JS/Rust; integration cost) | + (OT on single node is trivial) | 0 (Yjs integration is the only cost) |
| Compatible with Q1 open | Agent attribution | + (every log entry has `member_id`) | 0 (Yjs origin field; Riak DT actor_id) | + (OT op carries client id) | + (envelope carries `member_id`) |
| Tests writable in v0.0.3 | Concurrency replay | + (deterministic) | – (CRDT property tests against known-bad merge orders are non-trivial) | 0 (OT requires a server-sim) | 0 (hybrid means two test suites) |
| Smallest provable slice | 2-week vertical | + (Step 5 already codes against this) | – (Yjs integration alone is 2+ weeks) | 0 (OT server + client requires choice of existing lib) | – (two substrates mean both need to land) |
| Auditability | Control-plane-visible | + (every op is a log row) | 0 (Yjs updates are opaque binary) | 0 (OT history is recoverable but needs translation) | 0 (mixed auditability) |
| Gleam-native | Typed end-to-end | + (pure Gleam) | – (Yjs needs Elixir FFI through `y_ex`) | 0 (OT libs exist in BEAM but none Gleam-native) | – (hybrid inherits Yjs's FFI cost) |

## Costs and bets

### Option A — `append-only-per-object`
- **Bet:** For v0.0.3, we don't need simultaneous multi-user rich-text
  editing. Wiki pages, task lists, and canvas cards that users edit
  serially (one at a time) are enough. The append-only log is always
  the ground truth, so migrating to a real CRDT later is a replay.
- **Cost:** No live co-editing. Two users editing the same paragraph
  simultaneously see each other's changes as conflict cards, not as
  merged text. That's a step down from Google Docs and users may feel it.

### Option B — `CRDT-merge`
- **Bet:** v0.0.3 ships with live co-editing. Users get Google-Docs-
  grade simultaneous editing across the atlas. The Yjs ecosystem is
  the industry default.
- **Cost:** Yjs on BEAM means `y_ex` Elixir FFI. That violates
  "typed end-to-end" at the collab boundary. Migrating away from Yjs
  later is effectively a full rewrite of the collab state; the
  reversibility story is weak.

### Option C — `OT-operational-transform`
- **Bet:** If we stay single-node permanently (Q9 resolves to
  deferred-forever), OT is the cleanest sync model. The daemon is the
  OT server; clients submit ops, daemon sequences.
- **Cost:** OT is notoriously hard to get right. The lib ecosystem on
  BEAM is thin; we'd likely write a minimal OT engine ourselves. OT
  breaks in ways CRDT doesn't under network partition — which shows up
  the moment Q9 resolves to anything other than deferred-forever.

### Option D — `hybrid-by-content-shape`
- **Bet:** Right tool for each shape. Rich text gets Yjs. Structured
  data gets typed reducers. Envelopes hide the difference from
  callers.
- **Cost:** Two substrates to maintain. The FFI cost of Yjs is still
  incurred. More code than A, more flexibility than B, strictly less
  fun than either.

## Open questions this decision creates

- **What exactly is a "collab object"?** Does a wiki page's frontmatter
  live in the same CollabObject as its body, or are they separate
  objects with one authoritative link? (Affects hybrid design.)
- **Conflict-card UX.** For Option A, what does a conflict look like
  in the atlas UI? Side-by-side diff with merge button?
- **Migration timing.** If we pick A for v0.0.3, when do we revisit? Is
  it "whenever a user asks for live co-editing" or a fixed milestone?

## Reversibility plan

- **A → B/C/D later:** Easy-ish. The per-object log is a replay source
  for any other substrate. The cost is writing the replayer and
  accepting that old conflicts get one-shot resolved during migration.
- **B → A/C/D:** Hard. Yjs state is binary; extracting it into a
  typed log is lossy for rich-text structure.
- **C → A/B/D:** Moderate. OT history dumps into an event log
  cleanly; CRDT migration requires deciding how to break ties
  retroactively.
- **D → any single substrate:** Moderate per sub-substrate; easier
  for the structured-data half than the rich-text half.

## Provenance

- [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) Q8 (and Q2 dependency)
- [`research/COLLAB_PLANE_OPTIONS.md`](../../research/COLLAB_PLANE_OPTIONS.md)
  — full file; per-option EMA-fit story is the primary input.
- [`research/build-steps/05-collab-substrate-skeleton.md`](../../research/build-steps/05-collab-substrate-skeleton.md)
  — codes against Option A today.
- [`content/decisions/Q2-collab-state-location.md`](Q2-collab-state-location.md)
  — sibling matrix; Q2 and Q8 should be resolved together.
- [`DESIGN_PRINCIPLES.md`](../../DESIGN_PRINCIPLES.md) P6 (local before
  distributed) — constrains C.
- [`graph/edges/collab.md`](../../graph/edges/collab.md)
- [`research/GLEAM_BEAM_FIT.md`](../../research/GLEAM_BEAM_FIT.md) "HTTP / web servers" (for mist/wisp context) and the persistence section.

## Decision

> **Resolution:** _[leave blank — user fills in when decided]_
> Recorded in: _[link to commit or decision doc]_
> Affects: Q2 directly (substrate choice must be compatible with
> sync model); Q9 indirectly (OT breaks under mesh; CRDT handles it).

Once the Decision is filled in, follow
[`howto/resolve-an-open-question.md`](../../howto/resolve-an-open-question.md).
If you resolve Q2 and Q8 in the same pass, combine the decision docs.

## Cross-references

- [`content/decision-matrix-template.md`](../decision-matrix-template.md)
- [`content/decisions/Q2-collab-state-location.md`](Q2-collab-state-location.md)
- [`content/decisions/PRIORITY.md`](PRIORITY.md) — Q8 is Tier 2 alongside Q2
- [`content/vapps/wiki-deep.md`](../vapps/wiki-deep.md)
- [`research/parts/semantic-layer.md`](../../research/parts/semantic-layer.md)

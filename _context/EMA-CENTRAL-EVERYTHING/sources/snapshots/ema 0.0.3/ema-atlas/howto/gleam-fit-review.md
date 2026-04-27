# Playbook — Gleam fit review

Use this when you propose a new EMA part, subsystem, or driver and want to
pressure-test whether it fits Gleam/BEAM's nature *before* you start
writing modules.

> The point is not to bend EMA's design to Gleam's whims. It's to notice
> when EMA's needs and Gleam's idioms point in the same direction — and
> when they don't, to surface that pressure honestly so the user can
> decide.

## When to run this

- Adding a new subsystem to the Gleam OTP layout (see
  [`EMA_V0_0_3_PREP.md`](../EMA_V0_0_3_PREP.md))
- Adding a new harness driver (see [`add-a-driver.md`](add-a-driver.md))
- Adding a new vApp surface that touches the daemon (see
  [`add-a-vapp.md`](add-a-vapp.md))
- Resolving an open question that lands typed shapes (see
  [`resolve-an-open-question.md`](resolve-an-open-question.md))

## The seven pressure points

For your proposed part, answer each. If the answer is "I don't know",
that's a signal to research before coding.

### 1. Type sketch
Can you write the algebraic data type for the core data this part
traffics in? In code-fenced ```gleam syntax. If the data needs
non-uniform records (variants with very different fields), that's a hint
this part might actually be two parts.

### 2. Actor sketch
Which long-running concerns become actors? For each, write the
`Subject(Msg)` and the `Msg` variants. If a "concern" doesn't have
clear ownership of its own Subject, it's probably a function, not an
actor.

### 3. Supervisor placement
Where in the OTP supervision tree does this part live? Cite the sketch
in `EMA_V0_0_3_PREP.md`. If you can't place it cleanly under one of the
existing supervisors, you're proposing a new supervisor — flag that.

### 4. Persistence story
Does any state need to survive a node restart? If yes:
- Is it append-only (sqlight + custom helper)?
- Is it relational (parrot/squirrel)?
- Does it need cluster-wide visibility (mnesia via FFI)?
- Is it durable but ephemeral-OK (dets via FFI)?
Cite `research/GLEAM_BEAM_FIT.md` for option tradeoffs.

### 5. FFI boundaries
Does this part call any Erlang/Elixir code? List each call with the
target module. FFI calls land in their own Gleam module under
`<part>/ffi.gleam` so the boundary is auditable. No FFI from inside
domain logic.

### 6. Distribution story
Does this part need to work across nodes (mesh/P2P)? If yes, is the
mechanism `:erlang.send/2` to `{:via, :global, _}`, or partisan, or
explicit transport via mist? If the part is single-node-only, say so
explicitly — distribution that's added later without saying so up front
is the most common BEAM design rot.

### 7. Test shape
What property-based tests does this part need (gleam_qcheck)? What
example tests? What fuzz/concurrency tests? Tests grounded in the
type sketch from §1 stay aligned with the actor sketch from §2.

## The four red flags

Stop and re-think if any of these is true:

- ❌ The part needs to mutate `control_plane/event_log` from outside the
  control_plane app. (Violates the canonical rule.)
- ❌ The part uses `dynamic` outside the FFI boundary. (Type erasure —
  defeats the point of Gleam.)
- ❌ The part stores ambient state in process dictionary or mutable refs.
  (Runtime fragility; hides causality from the supervisor model.)
- ❌ The part's actors send each other unbounded streams of small messages
  with no back-pressure. (BEAM mailbox overflow = silent latency rot.)

## Output

Write a short Gleam fit review under
`research/parts/<slug>-fit-review.md` with the seven sections above
filled in. Then link it from:

- the matching `graph/nodes/<branch>.qmd` if the part lives in an
  existing branch (under `referenced_in_docs:`)
- the matching `graph/edges/<topic>.md` if it cuts across topics
- the matching brief in `content/briefs/<slug>.md` "Read next" section

## Verification

```bash
# the fit review must reference at least one section of GLEAM_BEAM_FIT.md
grep -l "GLEAM_BEAM_FIT" research/parts/<slug>-fit-review.md

# graph still passes
./scripts/check-graph.sh
```

If the fit review surfaces a new vocabulary need, add the term to
[`GLOSSARY.md`](../GLOSSARY.md) before promoting the proposal further.

## Cross-references

- [`GLEAM_NOTES.md`](../GLEAM_NOTES.md) — framing for all Gleam research
- [`EMA_V0_0_3_PREP.md`](../EMA_V0_0_3_PREP.md) — supervision sketch
- [`research/GLEAM_BEAM_FIT.md`](../research/GLEAM_BEAM_FIT.md) — capability survey
- [`research/parts/`](../research/parts/) — per-part Gleam mappings
- [`research/COLLAB_PLANE_OPTIONS.md`](../research/COLLAB_PLANE_OPTIONS.md) — Q2/Q8 substrate options

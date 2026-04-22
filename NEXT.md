# Next

What to do next, in priority order. Single source of "if you have one
hour to push EMA forward, do this." Refreshed when priorities shift.

> Last refresh: **2026-04-22, end of wave 6 + wave 7 in flight.**
> Re-write this file on each significant push so it stays specific.

---

## If you have 15 minutes

**Pick one of:**

1. Read [`AGENT_QUICKREF.md`](AGENT_QUICKREF.md) and
   [`PROJECT_STATUS.md`](PROJECT_STATUS.md). You'll know enough to
   converse precisely.
2. Open [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) and pick one Q whose
   answer you can write in the [decision matrix template](content/decision-matrix-template.md)
   without consulting anyone. Save the matrix to
   `content/decisions/Q<n>-<slug>.md`.
3. Run the atlas: `npm install && npm run dev`, open `localhost:3000/parts`,
   click through one part to its briefs/slides/canvas/diagrams.

## If you have an hour

**The single highest-value hour right now:**

> **Fill in the Q5 decision matrix** (driver contract surface).
> Q5 is the keystone for v0.0.3 build-step 03 — the moment Q5 is
> decided, `simulated-tui` and `claude-cli` drivers can start landing.
> Read [`research/build-steps/03-driver-registry-skeleton.md`](research/build-steps/03-driver-registry-skeleton.md)
> first, then the Driver section of [`research/GLEAM_BEAM_FIT.md`](research/GLEAM_BEAM_FIT.md),
> then write the matrix.

**Or, runner-up:**

- Fill in the Q1 matrix (agents as first-class members). Q1's blast
  radius is the largest. Settling it shrinks Q3, Q4, and Q10 simultaneously.
- Fill in the Q3 matrix (Project ↔ Space cardinality). Required to
  start [`research/build-steps/02-identity-registry-skeleton.md`](research/build-steps/02-identity-registry-skeleton.md).

## If you have a day

**Three coherent slices, pick one:**

### Slice A — Land Q1 + Q3 + Q5 minimum answers, kick off v0.0.3

End state: `TrajanWJ/ema` has a fresh Gleam project that compiles to a
booted supervision tree with stub actors, and the four type sketches
from build-steps 01-04 are landed as real `*.gleam` files.

Path:
1. Hour 1-2: write matrices for Q1, Q3, Q5; mark them resolved using
   [`howto/resolve-an-open-question.md`](howto/resolve-an-open-question.md).
2. Hour 3: copy `research/scaffold/` (when wave-7 lands it) into
   `TrajanWJ/ema` as `gleam new ema && cp ...`.
3. Hour 4-6: replace the `todo as "..."` bodies in event_log,
   identity/registry, drivers/registry, sessions with the real loops
   from build-steps 01-04.
4. Hour 7-8: write the gleam_qcheck properties from each build-step's
   "Property tests" section. Make them green.

### Slice B — Make the atlas self-presenting

End state: a fresh viewer can open `localhost:3000/`, walk through
`/demo` (now driven by [`content/demo/narrative.md`](content/demo/narrative.md)),
and exit knowing the project, the parts, the open questions, and what
they'd need to decide.

Path:
1. Wire `/demo` to render `content/demo/narrative.md` paginated by act.
2. Wire `/briefs/[slug]` to actually read `content/briefs/<slug>.md`
   (it currently uses Part data — the markdown briefs are richer).
3. Embed the 24 SVGs onto `/canvas/[slug]` (wave-7 subagent is doing
   this — confirm landed before duplicating).
4. Add a stable `/showroom` route that lists every shipped deliverable
   from `content/artifacts/inventory.md`.

### Slice C — Push the prep stage further

End state: the unanswered questions have **clearer** options
(narrower) even if not resolved.

Path:
1. Fill `content/decisions/Q2-collab-substrate.md` matrix using the
   options enumerated in [`research/COLLAB_PLANE_OPTIONS.md`](research/COLLAB_PLANE_OPTIONS.md).
2. Fill `content/decisions/Q4-personal-ai-placement.md` matrix using
   capability-locality framing from [`graph/edges/transport.md`](graph/edges/transport.md)
   and the "Distributed AI Delegation" vault candidate term.
3. Fill `content/decisions/Q9-replication-boundary.md` matrix —
   intentionally hold the answer at "deferred" but document **what
   single-node clarity must hold first** before P2P is even considered.
4. Update [`SECURITY_PRIVACY.md`](SECURITY_PRIVACY.md) — promote
   working assumptions to confidence-style as their gating Q resolves.

---

## If you have a week

The week's shape:

| Day | Focus |
|---|---|
| Mon | Slice A hour 1-3 (matrices for Q1, Q3, Q5) |
| Tue | Slice A hour 4-8 (Gleam scaffold + real event_log + identity registry) |
| Wed | Slice A continued (drivers + sessions/babysitter) |
| Thu | Slice B (atlas self-presenting) |
| Fri | Slice C (matrices for Q2, Q4, Q9 — even if resolutions are deferred) |

End-of-week state:
- v0.0.3 has a real OTP supervision tree booting in `TrajanWJ/ema`,
  with all 4 build-step skeletons compiled and a small set of property
  tests green.
- The atlas is a viewable, paginated narrative anyone can walk through.
- 6 of 10 open questions have decision matrices on disk (resolved or
  parked-with-rationale).

---

## Standing rules

- **Don't make decisions on behalf of the user.** Decision matrices
  surface options; the user picks.
- **Update [`PROJECT_STATUS.md`](PROJECT_STATUS.md)** after any
  significant push.
- **Update this file (`NEXT.md`)** when the priority order changes
  (e.g., Q1 lands → Slice A demotes; Q5 still open → it stays
  highest-value).

---

## Cross-references

- [`PROJECT_STATUS.md`](PROJECT_STATUS.md) — what's shippable today
- [`ROADMAP.md`](ROADMAP.md) — long-horizon stages
- [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) — what's not yet decided
- [`EMA_V0_0_3_PREP.md`](EMA_V0_0_3_PREP.md) — Gleam build readiness
- [`content/decision-matrix-template.md`](content/decision-matrix-template.md) — for matrix shape
- [`howto/resolve-an-open-question.md`](howto/resolve-an-open-question.md) — for the resolution flow

# Decisions — index

Working drafts of decision matrices for the open questions in
[`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md). Each file follows
[`content/decision-matrix-template.md`](../decision-matrix-template.md).

> A decision file appears here when someone is **actively** weighing a
> question. Not every question has a draft yet. The presence of a draft
> does not mean a decision is imminent — it means the matrix is being
> filled in.

## Active drafts

(none yet — promote a question by copying the template into
`Q<n>-<slug>.md` and starting to fill it.)

## Suggested first matrices

These are the questions whose blast radius makes them block v0.0.3
build start the most. Filling these in first opens the most downstream
ground.

| Question | Why it's a sensible first matrix |
|---|---|
| **Q1** — agents as first-class members | Touches identity, attribution, security, every later feature |
| **Q3** — Project ↔ Space cardinality | Schema impact across the whole control plane |
| **Q5** — driver contract surface | Every non-`hermes-native` driver waits on this |
| **Q5-sub** — execution_id format & lifecycle | Every event_log row carries one |

(See `EMA_V0_0_3_PREP.md` "Required pre-build decisions".)

## Process

When a draft becomes a decision:

1. Mark the matrix's "Decision" section with the chosen option, date,
   and link.
2. Update [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) using
   [`howto/resolve-an-open-question.md`](../../howto/resolve-an-open-question.md).
3. Move the matrix file from `content/decisions/Q<n>-<slug>.md` to
   `content/decisions/resolved/Q<n>-<slug>.md`. Don't delete; the matrix
   is the decision's provenance.
4. Update CHANGELOG.md and PROJECT_STATUS.md.

## How the atlas should expose this

The `/decisions` route currently shows the questions as cards (status
heuristic). When matrices land here, the route should grow:

- a "draft" badge on a question when a matrix file exists
- a click-through from the card to the matrix viewer (similar to
  `/research/[slug]`)
- a "resolved" pill linking to the matrix in `resolved/`

That wiring is currently a `// TODO`. Add it when the first matrix
goes live.

## Cross-references

- [`content/decision-matrix-template.md`](../decision-matrix-template.md)
- [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md)
- [`howto/resolve-an-open-question.md`](../../howto/resolve-an-open-question.md)
- [`SECURITY_PRIVACY.md`](../../SECURITY_PRIVACY.md) — many resolutions force
  changes here too

# Decision matrix — template

Per-question decision matrix for resolving an entry in
[`OPEN_QUESTIONS.md`](../OPEN_QUESTIONS.md). Copy this file to
`content/decisions/Q<n>-<slug>.md` when you're ready to start
weighing a question, then follow [`howto/resolve-an-open-question.md`](../howto/resolve-an-open-question.md)
to land the resolution.

> A matrix forces you to write the cost on each option **before** you
> pick. The point is that you should be able to read the matrix back
> later and see why the chosen option won — including in cases where
> the choice turns out wrong.

## Question

`Q<n>` — `<exact title from OPEN_QUESTIONS.md>`

(restate verbatim. Do not paraphrase the question.)

## Options being weighed

List 2-5 options. Each gets its own column in the matrix. Name them
short and stable — these names will appear in the decision doc, in
commit messages, and possibly in glossary entries.

| Option | Short name | One-line description |
|---|---|---|
| Option A | `<name>` | … |
| Option B | `<name>` | … |
| Option C | `<name>` | … |

## Criteria

For each criterion, score each option `+ / 0 / – / blocker`. Add a one-line
"why" inline. Don't average — the criteria are not interchangeable.

| Criterion | Why it matters | Option A | Option B | Option C |
|---|---|---|---|---|
| Aligns with canonical rule (P1) | Surfaces don't own state. | … | … | … |
| Compatible with Q<deps> if open | Can we ship without resolving its dependencies? | … | … | … |
| Smallest provable slice | Can we exercise it in a 2-week vertical? | … | … | … |
| Reversible | Can we migrate off it cleanly later? | … | … | … |
| Gleam-native | Can we express it in typed Gleam without FFI escapes? | … | … | … |
| Auditability | Does it produce control-plane-visible records? | … | … | … |
| Tests writable in v0.0.3 | gleam_qcheck properties + example tests | … | … | … |
| Identity-model-clean (Q1) | Doesn't constrain Q1 resolution | … | … | … |

(Add criteria as needed. Don't remove ones that are awkward — they're
the most informative.)

## Costs and bets

For each option, two bullets each:

### Option A — `<name>`
- **Bet:** what this option assumes is true about the future
- **Cost:** what we lose by picking this

### Option B — `<name>`
- **Bet:**
- **Cost:**

### Option C — `<name>`
- **Bet:**
- **Cost:**

## Open questions this decision creates

Resolving Q<n> almost always opens new questions. List them here. If any
deserves an `OPEN_QUESTIONS.md` entry, add it (with a Q-number > current max).

## Reversibility plan

If we pick the chosen option and it turns out wrong, what's the
migration shape?

- **From this option to the others:** for each non-chosen option, 1
  paragraph on what migration looks like (cost, blocking, time estimate)
- **What records does the chosen option produce that would have to be
  rewritten on migration?** Be honest.

## Provenance

Cite every external doc, vault note, or branch you read while filling
this in. The matrix is only as good as its grounding.

## Decision

> **Resolution:** `<chosen option short name>`, decided `<YYYY-MM-DD>`.
> Recorded in: `<link to commit / decision doc / blockquote in node body>`.
> Affects: `<other Q-numbers whose blast radius shrinks>`.

When you fill the Decision section in, also:

1. Edit [`OPEN_QUESTIONS.md`](../OPEN_QUESTIONS.md): mark Q<n> as
   `status: resolved YYYY-MM-DD → <link>`. **Do not delete the entry.**
2. Move any working assumptions in [`SECURITY_PRIVACY.md`](../SECURITY_PRIVACY.md)
   that depended on Q<n> to confidence-styled language, or move them
   into a hardened `SECURITY.md` / `PRIVACY.md`.
3. Trim the affected `graph/edges/<topic>.md` "Open" section.
4. Update [`CHANGELOG.md`](../CHANGELOG.md) under the current wave.

## Cross-references

- [`howto/resolve-an-open-question.md`](../howto/resolve-an-open-question.md)
- [`OPEN_QUESTIONS.md`](../OPEN_QUESTIONS.md)
- [`DESIGN_PRINCIPLES.md`](../DESIGN_PRINCIPLES.md)
- [`SECURITY_PRIVACY.md`](../SECURITY_PRIVACY.md)

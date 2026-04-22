# Decisions — priority

Which open question's matrix to draft **first**, second, third. Read this
when you can sit down for an hour and want to land the highest-leverage
matrix that hour.

> Priorities can shift as upstream questions resolve. Re-check this file
> after any matrix lands.

## Tier 1 — gate v0.0.3 build start

Drafting these unblocks the most downstream code.

| Q | Why it's tier 1 | Likely first option to weigh |
|---|---|---|
| **Q5** | Driver contract surface. Build-step 03 is held against this. The moment Q5 lands, `simulated-tui` and `claude-cli` drivers can ship. Smallest surface to write a matrix for. | streaming `Subject(DriverEvent)` (already assumed by build-step 03) vs sync RPC vs JSON-RPC |
| **Q1** | Agents as first-class members. Largest blast radius — touches identity, attribution, security, every later vApp. Settling Q1 shrinks Q3/Q4/Q10 simultaneously. | `agents-first-class` vs `agents-as-proxies` vs `hybrid-by-Space` |
| **Q3** | Project ↔ Space cardinality. Schema impact across the whole control plane. Build-step 02 currently codes against N:M; locking it in (or not) determines if the schema needs migration shape from day one. | N:M vs Project-inside-Space vs Space-inside-Project |

## Tier 2 — required before first vApp ships

| Q | Why | Notes |
|---|---|---|
| **Q2** | Where collab state lives. Required before the wiki / threads / canvas vApps move past stub. `research/COLLAB_PLANE_OPTIONS.md` enumerates options. | sqlight per-object event log (build-step 05 default) vs y_ex vs Riak DT vs hybrid |
| **Q8** | Sync model. Sub-question of Q2. Resolve together if possible. | append-only · CRDT · OT · hybrid |
| **Q4** | Where Personal AI executes. Required before personal-AI features land. Capability locality matters. | user-machine vs daemon vs Project-affine vs per-call |

## Tier 3 — required before mesh

| Q | Why | Notes |
|---|---|---|
| **Q9** | Replication boundary. Intentionally deferred. The matrix should land at "deferred" with a documented "what single-node clarity must hold first" list. | (deferred) |
| **Q10** | Org/Space → runtime/tool perms. Required before peer-remote driver. | inherited vs per-execution vs policy bundles |

## Tier 4 — surface decisions

| Q | Why | Notes |
|---|---|---|
| **Q6** | Discord direction. Read-only is safe for v0.0.3; bidirectional later. Matrix can resolve at "read-only for v0.0.3, revisit." | read-only mirror · bidirectional · superset with Discord as one rendering target |
| **Q7** | Surface stack for Launchpad/HQ. Partly answered by atlas Next.js choice. The matrix is mostly retroactive documentation. | Next.js (atlas already using) · native Tauri (place-companion lineage) · hybrid |

## How to use this file

1. Pick the highest-priority Q whose matrix isn't yet drafted (check
   `content/decisions/Q*.md` and `content/decisions/resolved/`).
2. Copy [`content/decision-matrix-template.md`](decision-matrix-template.md)
   to `content/decisions/Q<n>-<slug>.md`.
3. Fill in. Decision section stays blank until the user chooses.
4. Surface the draft via [`/decisions`](../../app/decisions/page.tsx)
   — when matrices land, the route should grow draft badges (currently
   a `// TODO` per `content/decisions/index.md`).

## When this file goes stale

Refresh after any matrix moves to `resolved/`, or when a new question
gets added to [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md).

## Cross-references

- [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) — full question text
- [`content/decision-matrix-template.md`](decision-matrix-template.md)
- [`howto/resolve-an-open-question.md`](../../howto/resolve-an-open-question.md)
- [`NEXT.md`](../../NEXT.md) — broader "what to do next" guide
- [`EMA_V0_0_3_PREP.md`](../../EMA_V0_0_3_PREP.md) — which Qs gate v0.0.3

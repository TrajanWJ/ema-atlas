# 07 — Blueprint planner events

ADR 06 nailed down the structural plane of Blueprint: documents, sections,
comments, attachments — the canonical scaffold the editor renders against.
That plane is sufficient for prose. It is **not** sufficient for the
LLM-driven Blueprint Planner vApp, which works on a different shape: an
intent graph of questions, gaps, deferred decisions, and aspirations
sitting alongside the structural tree.

This ADR proposes extending the canonical event family with the planner
node types from `BLUEPRINT-PLANNER.md`, while keeping the structural
events from ADR 06 untouched.

## Context

The structural section tree models *where prose lives*. The planner models
*what is unresolved*. Those are different graphs:

| Plane         | Owner question                                  | Existing events                                |
| ------------- | ----------------------------------------------- | ---------------------------------------------- |
| Structural    | "Where in the document does this prose go?"     | `blueprint.document.*`, `blueprint.section.*`  |
| Collaborative | "How is this prose body changing right now?"    | `collab.document.*` per ADR 06                 |
| Planner       | "What questions, gaps, and decisions remain?"   | *(none yet — this ADR)*                        |

The planner spec defines four canonical node types that live in the
intents layer of the graph: GAC cards (Gap / Assumption / Clarification),
Blocker cards, Aspiration entries, and locked Decisions. Each has a
distinct lifecycle. None of them fit cleanly under
`blueprint.section.*` — they are not headings, they are not prose, and
their state transitions don't correspond to structural edits.

Without canonical events for these nodes:

- The planner UI has nowhere to write. It would either fall back to
  ad-hoc storage (collab room, JSON blob in a section) or hang off
  comments, which are scoped to a single section.
- Auto-generated GAC cards from the agent loop have no append target and
  cannot be replayed.
- The intent graph view (Flow 4 in `BLUEPRINT-PLANNER.md`) has no read
  model. It would have to scrape comments or section bodies.
- Decisions get logged as prose inside sections, with no machine-readable
  supersession edge.

The fix is symmetric with how the structural family was introduced: a
new sub-family of canonical events under the `blueprint.*` namespace,
each with a typed payload and an explicit status machine.

## Decision

Add three new event sub-families and one decision-log sub-family under
`blueprint.*`, plus four new ULID prefixes:

**GAC cards** — `blueprint.gac.*`
- `blueprint.gac.created`
- `blueprint.gac.answered`
- `blueprint.gac.deferred`
- `blueprint.gac.promoted`

**Blockers** — `blueprint.blocker.*`
- `blueprint.blocker.opened`
- `blueprint.blocker.resolved`
- `blueprint.blocker.promoted`

**Aspirations** — `blueprint.aspiration.*`
- `blueprint.aspiration.captured`
- `blueprint.aspiration.promoted`
- `blueprint.aspiration.archived`

**Decisions** — `blueprint.decision.*`
- `blueprint.decision.locked`
- `blueprint.decision.superseded`

**New ULID prefixes**
- `blueprint_gac` — GAC card identity
- `blueprint_blocker` — Blocker card identity
- `blueprint_aspiration` — Aspiration entry identity
- `blueprint_dec` — Locked Decision identity

These are owned by `ema_blueprint`. Append-only, no in-place mutation.
State derives from the event sequence, exactly as it does for the
structural family.

## Payload sketches

Style matches `packages/contracts/events/blueprint.md`. All payloads are
in the `blueprint` family; all `*_id` fields use `<prefix>:<ulid>` form.

### `blueprint.gac.created`
```
payload {
  gac_id:      blueprint_gac:<ulid>
  project_id:  project:<ulid>
  category:    gap | assumption | clarification
  priority:    critical | high | medium | low
  question:    string
  options: [
    {
      label:        string                  // "A", "B", "1", "2", ...
      text:         string
      implications: string
    }
  ]
  connections: [
    { target: string, relation: string }    // e.g. references | derived_from
  ]
  context: {
    related_nodes: [ string ]               // node ids that informed this question
    section?:      blueprint_sec:<ulid>     // structural anchor, if any
  }
  created_by: actor:<ulid>
}
```

### `blueprint.gac.answered`
```
payload {
  gac_id:        blueprint_gac:<ulid>
  selected?:     string                     // option label, or null for freeform-only
  freeform?:     string
  result_action: create_canon | create_intent | update_node | defer_to_blocker
  target?:       string                     // id of the node created/updated
  answered_by:   actor:<ulid>
}
```

### `blueprint.gac.deferred`
```
payload {
  gac_id:      blueprint_gac:<ulid>
  blocker_id:  blueprint_blocker:<ulid>     // the blocker created from this defer
  reason?:     string
  deferred_by: actor:<ulid>
}
```

### `blueprint.gac.promoted`
```
payload {
  gac_id:      blueprint_gac:<ulid>
  target_kind: intent | proposal | canon
  target:      string                       // id of the node the GAC promoted to
  promoted_by: actor:<ulid>
}
```

### `blueprint.blocker.opened`
```
payload {
  blocker_id:    blueprint_blocker:<ulid>
  project_id:    project:<ulid>
  category:      tricky_question | deferred_decision | blocking_dependency
  priority:      critical | high | medium | low
  title:         string
  description:   string
  resolve_by?:   string                     // phase or condition
  promoted_from?: blueprint_gac:<ulid>      // GAC card it was deferred from, if any
  opened_by:     actor:<ulid>
}
```

### `blueprint.blocker.resolved`
```
payload {
  blocker_id:   blueprint_blocker:<ulid>
  resolved_to?: string                      // node id this resolves into
  note?:        string
  resolved_by:  actor:<ulid>
}
```

### `blueprint.blocker.promoted`
```
payload {
  blocker_id:  blueprint_blocker:<ulid>
  target_kind: gac | intent | proposal
  target:      string
  promoted_by: actor:<ulid>
}
```

### `blueprint.aspiration.captured`
```
payload {
  aspiration_id: blueprint_aspiration:<ulid>
  project_id:    project:<ulid>
  description:   string
  timeframe:     near_term | mid_term | long_term | aspirational
  source: {
    type:        auto_detected | manual_tag
    origin_app:  string                     // vApp the source text came from
    origin_text: string                     // the triggering text
    confidence?: number                     // 0.0–1.0, only when auto_detected
  }
  captured_by: actor:<ulid>                 // human confirmer or agent
}
```

### `blueprint.aspiration.promoted`
```
payload {
  aspiration_id: blueprint_aspiration:<ulid>
  target_kind:   intent | proposal
  target:        string
  promoted_by:   actor:<ulid>
}
```

### `blueprint.aspiration.archived`
```
payload {
  aspiration_id: blueprint_aspiration:<ulid>
  reason?:       string
  archived_by:   actor:<ulid>
}
```

### `blueprint.decision.locked`
```
payload {
  decision_id: blueprint_dec:<ulid>
  project_id:  project:<ulid>
  title:       string
  body:        string
  supersedes?: blueprint_dec:<ulid>         // optional reference to a prior decision
  locked_by:   actor:<ulid>
}
```

### `blueprint.decision.superseded`
```
payload {
  decision_id:    blueprint_dec:<ulid>     // the decision being retired
  superseded_by:  blueprint_dec:<ulid>     // the decision that replaces it
  reason?:        string
  superseded_by_actor: actor:<ulid>
}
```

## Mirror events vs canonical

These are **canonical events**, not mirrors. They are owned outright by
`ema_blueprint`. There is no upstream context to mirror from — GAC,
Blocker, Aspiration, and Decision nodes originate inside the Blueprint
vApp.

Contrast with `blueprint.attachment.linked`, which ADR 06 defines as a
**mirror** of `attachment.linked` from `ema_attachments`. Mirrors follow
the sequenced-not-atomic contract in ADR 06: canonical first, mirror
second, both inside the same writer call, with the projection tolerant
of an orphaned canonical event.

The new planner events do not invoke that contract. Each is a single
canonical append by the `ema_blueprint` writer. No second event
follows. No other context is required to acknowledge the fact.

If a planner node later needs a mirror in another family (for example, a
locked Decision mirrored as a `proposal.adopted`), that mirror obeys the
ADR 06 rules — but the canonical `blueprint.decision.locked` stands
alone.

## Status transitions

Status is derived state. The store does not write a `status` column; it
folds the event sequence to compute it.

### GAC card

```
                created
                   │
                pending
                   │
       ┌───────────┼───────────┐
       │           │           │
   answered    deferred    promoted
   (terminal) (→ blocker)  (→ intent/
                            proposal/
                            canon)
```

- `pending` is the implicit state after `created`.
- `answered` is terminal: a GAC is answered exactly once. Re-answering
  requires a fresh GAC.
- `deferred` always emits a paired `blueprint.blocker.opened`; the GAC
  itself is no longer in queue but its history is intact.
- `promoted` emits the target id and stops the GAC at the queue edge.

### Blocker

```
   opened
     │
     ┌──────────┬──────────┐
     │          │          │
   open    resolved    promoted
              (→ node)  (→ gac/
                         intent/
                         proposal)
```

- `open` after `opened`. Resolved and promoted are terminal.
- Promotion back to a GAC re-enters the planner queue as a fresh GAC,
  carrying `connections` back to the originating blocker.

### Aspiration

```
   captured
      │
      ┌──────────┬──────────┐
      │          │          │
  captured   promoted   archived
              (→ intent/
                 proposal)
```

- Promotion and archive are terminal.
- Archive is non-destructive; the aspiration remains visible for audit.

### Decision

```
   locked  ──►  superseded
   (committed)  (only mutation)
```

- Decisions are append-only canon-tier nodes. Once `locked`, the only
  permitted mutation is `superseded`, which references the replacement
  decision. The replacement is itself a `blueprint.decision.locked`.
- Repealing without a replacement is not modeled. If a decision needs to
  be retracted, lock a new decision that explicitly retracts and
  supersede with it.

## Catalog registration

This ADR proposes the following registrations. They land in a follow-up
contract change, not in this document.

### `packages/contracts/events/catalog.v0.md`

Add the family entries:

```
blueprint.gac.created
blueprint.gac.answered
blueprint.gac.deferred
blueprint.gac.promoted

blueprint.blocker.opened
blueprint.blocker.resolved
blueprint.blocker.promoted

blueprint.aspiration.captured
blueprint.aspiration.promoted
blueprint.aspiration.archived

blueprint.decision.locked
blueprint.decision.superseded
```

### `packages/contracts/types/ids.md`

Append four prefixes to the registered prefix table:

| Prefix                  | Entity                           |
| ----------------------- | -------------------------------- |
| `blueprint_gac`         | blueprint GAC card               |
| `blueprint_blocker`     | blueprint blocker card           |
| `blueprint_aspiration`  | blueprint aspiration entry       |
| `blueprint_dec`         | blueprint locked decision        |

### `apps/daemon/src/ema_daemon/event_envelope.gleam`

The `kind_in_catalog` Gleam helper enumerates known event kinds at
compile time. Update it to recognize the twelve new kinds above so the
envelope round-trips them without falling back to the unknown-kind
branch.

### `packages/contracts/events/blueprint.md`

Append the twelve new payload blocks to the existing blueprint contract
doc, in the same shape as `blueprint.section.added` and friends. The
sketches in this ADR are the source.

## Consequences

After this lands:

- **New writer modules** under `apps/daemon/src/ema_blueprint/`:
  - `gac_writer.gleam` — handles `gac.created/answered/deferred/promoted`
  - `blocker_writer.gleam` — handles `blocker.opened/resolved/promoted`
  - `aspiration_writer.gleam` — handles
    `aspiration.captured/promoted/archived`
  - `decision_writer.gleam` — handles `decision.locked/superseded`,
    enforces the supersession-only mutation rule
  - All four reuse the bus append helper and the per-daemon monotonic
    `txid` from ADR 06.

- **New CLI subcommands** under `pnpm cli blueprint`:
  - `pnpm cli blueprint gac create | answer | defer | promote | list`
  - `pnpm cli blueprint blocker open | resolve | promote | list`
  - `pnpm cli blueprint aspiration capture | promote | archive | list`
  - `pnpm cli blueprint decision lock | supersede | list`
  - Each subcommand is a thin wrapper over the writer, returning the new
    `<prefix>:<ulid>` on stdout for piping.

- **New projection** `blueprint.intent_graph`:
  - Read-only over the four planner node types plus their `connections`
    edges.
  - Folds the event sequence into the four status machines above.
  - Powers the Intent Graph view (Flow 4 in `BLUEPRINT-PLANNER.md`) and
    the GAC / Blockers / Aspirations queue tabs.
  - Distinct from the existing structural projection
    (`blueprint.document` / `blueprint.section`); the two are joined at
    query time when a node references a section via
    `context.section`.

- **Intent-graph edges** are derived from `connections[]` on each node
  and from explicit cross-references like `promoted_from` and
  `supersedes`. No separate edge events; edges are facets of node
  events, replayed deterministically.

- **Auto-generation hook**: the agent loop that scans canon for gaps
  (Flow 5) writes `blueprint.gac.created` directly through
  `gac_writer.gleam`. No new transport.

## What we are NOT changing

- The `blueprint.document.*` and `blueprint.section.*` families stay
  exactly as defined in ADR 06 and `blueprint.md`. No payload changes,
  no renames, no new fields.
- Prose still lives in BEAM `ema_collab` rooms keyed by
  `blueprint_sec:<ulid>`. The planner does not edit prose; planner nodes
  may *reference* a section via `context.section`, but the section's
  body is untouched.
- The canonical-vs-collab split from ADR 06 is preserved. Planner nodes
  are canonical only; they have no collab counterpart, no CRDT room, no
  checkpoint events.
- The mirror-event contract in ADR 06 is unchanged. New planner events
  are not mirrors. Existing mirrors (`blueprint.attachment.linked`)
  continue to follow the sequenced-not-atomic rules.
- `blueprint.comment.*` remains the per-section discussion thread. It
  does **not** become a generic planner-card mechanism. Comments stay
  scoped to sections; planner nodes carry their own `context` and
  `connections`.

## References

- `docs/architecture/06-blueprint-boundaries.md` — structural /
  collaborative split, mirror-event contract.
- `packages/contracts/events/blueprint.md` — existing blueprint event
  contract; new kinds append here.
- `packages/contracts/types/ids.md` — ULID prefix registry; four new
  prefixes append here.
- `Projects/EMA/atlas/archive/builds/all-ts-electron-ema/ema-genesis/canon/specs/BLUEPRINT-PLANNER.md`
  — canonical planner spec; data models and user flows are the source
  for the payload shapes above.

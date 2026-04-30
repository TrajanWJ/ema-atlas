# 08 — Workspace ↔ blueprint cross-references

## Context

Tier 1 of the cohesion plan landed canonical writers for lane / queue / planner / vcalendar lifecycles. Each subsystem now has its own canonical event log and projection. They are still strangers to each other.

A lane carries a free-text `scope` field; nothing in the canonical record says *which Blueprint section it ships*, *which GAC card it answers*, or *which decision it implements*. The planned intent-graph projection (ADR 09, forthcoming) needs those edges to graph anything beyond same-family relationships.

This ADR introduces those cross-references as **additive optional payload fields** on the existing workspace event family. No new event kinds. No new ID prefixes. Old events stay valid; the projection treats every cross-ref field as nullable.

## Decision

Extend the payload schemas of the workspace event families with three optional cross-reference fields:

- `blueprint_section_id` — `blueprint_sec:<ulid>`. The section the work ships *under* (or against).
- `blueprint_gac_id` — `blueprint_gac:<ulid>`. The GAC card the work answers (a lane can be the implementation arm of a planner question).
- `blueprint_decision_id` — `blueprint_dec:<ulid>`. The locked decision the work implements (for replay-then-verify of a canon decision).

Apply to:

- `lane.opened`
- `queue_item.added`

These are the two creation events; subsequent lifecycle events (`lane.claimed/blocked/released/closed`, `queue_item.ready/blocked/closed`) inherit the link via the lane/queue_item id and do not need to repeat it.

### Updated payload sketches

```text
### `lane.opened` (extension — additive)
payload {
  ... (existing fields) ...
  blueprint_section_id?:  blueprint_sec:<ulid>
  blueprint_gac_id?:      blueprint_gac:<ulid>
  blueprint_decision_id?: blueprint_dec:<ulid>
}

### `queue_item.added` (extension — additive)
payload {
  ... (existing fields) ...
  blueprint_section_id?:  blueprint_sec:<ulid>
  blueprint_gac_id?:      blueprint_gac:<ulid>
  blueprint_decision_id?: blueprint_dec:<ulid>
}
```

### Projection surface

`lane_registry_projection_json/1` and `queue_registry_projection_json/1` gain a `linked_blueprint` object on each record:

```json
{
  "id": "lane:...",
  "title": "...",
  "linked_blueprint": {
    "section_id": null,
    "gac_id": "blueprint_gac:...",
    "decision_id": null
  }
}
```

`null` for any unlinked field. When **all three** are null, the field can be omitted by the projection; consumers must tolerate either shape.

### CLI flags

```text
ema lane open ... [--blueprint-section <id>] [--blueprint-gac <id>] [--blueprint-decision <id>]
ema queue add ... [--blueprint-section <id>] [--blueprint-gac <id>] [--blueprint-decision <id>]
```

All three flags are optional. When omitted, the canonical event payload simply does not include the field (or includes it as JSON `null`).

## Consequences

1. **Intent graph (forthcoming ADR 09) gains edges.** A lane that opens with `--blueprint-gac blueprint_gac:xyz` will appear as a directed edge from `lane:abc` to `blueprint_gac:xyz` in the intent-graph projection.
2. **Backward compatibility is preserved.** Pre-existing `lane.opened` events have no cross-ref fields; the projection emits `null` for each and the surface treats those lanes as untethered.
3. **No event-kind explosion.** Cross-refs are payload fields, not new event families. The catalog (`packages/contracts/events/catalog.v0.md`) does not change.
4. **`linked_blueprint` is read-only on the projection side.** To change which Blueprint node a lane is linked to, open a new lane (with the new cross-ref) and close the old one with `reason: "rescoped to blueprint_gac:..."`. We do not yet support a `lane.relinked` event.
5. **Validation is shallow.** The writer only checks that the fields, when present, look like ULID-prefixed strings. We do not (yet) verify that the referenced `blueprint_sec/gac/dec` actually exists in the projection at write time. That would require either a synchronous projection read or a future `bus.exists(prefix:id)` helper.

## What we are NOT changing

- **Existing structural and planner contracts** (`blueprint.section.added`, `blueprint.gac.created`, etc.) — unchanged. Cross-refs flow *into* the workspace family, not *out of* the blueprint family.
- **Mirror events** (per ADR 06) are unaffected. `blueprint.attachment.linked` is still mirrored from the attachment family, and the mirror contract continues to apply.
- **The `scope` and `goal` free-text fields on `lane.opened`/`lane.claimed`** stay as they are. Cross-refs *complement* them, they do not replace them; humans still type free-form context.

## References

- `docs/architecture/06-blueprint-boundaries.md` — canonical/collab split.
- `docs/architecture/07-blueprint-planner-events.md` — planner-graph node types these refs point at.
- `packages/contracts/events/lane.md`
- `packages/contracts/events/queue_item.md`
- `packages/contracts/events/blueprint.md`

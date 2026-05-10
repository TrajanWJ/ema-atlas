<!-- wiki-id: ema:workspace-schema-v0 -->
<!-- see-also: ema:workspace-source-intake-contract, ema:multi-host-conflict-policy, ema:topology, ema:head-orchestrator -->

# Workspace Schema v0

Generated: 2026-05-10

This is the shared workspace projection contract for EMA 0.0.6. It is a
schema plan first, not a storage migration. The daemon remains the canonical
writer; CLI, web, and wiki surfaces consume compact projections.

## Locked Spine

```text
org -> host_set -> entity_class -> conflict_strategy
```

Every workspace entity resolves inside one org. Every org has a non-empty
host-set by doctrine. Every entity family declares a conflict strategy before
multi-host write behavior is allowed.

## Required Projections

| Projection | Authority | Conflict strategy | Purpose |
|---|---|---|---|
| `workspace.entities` | daemon event log + compact tables | per-entity policy | Entity catalog with ids, labels, family, org, space, project, and status. |
| `workspace.events` | daemon event log | append-only with vector-clock ordering later | Recent canonical events plus scope columns for audit and recovery. |
| `workspace.commands` | CLI command catalog + IPC contract | source-card prose | Command grammar, daemon op, required args, projection side effects. |
| `workspace.wiki_ids` | doc registry, daemon-canonical later | append-only + supersede | Stable wiki ids, paths, stamps, backlinks, check gaps. |
| `workspace.artifacts` | `artifact.*` events | append-only + archive | Durable files, screenshots, reports, and linked evidence. |
| `workspace.sources` | SourceRecord table/contract | append-only + supersede | Source posture, license posture, confidence, and route. |
| `workspace.donor_patterns` | PatternExtraction records | CRDT prose | Reusable mechanisms extracted from sources, separated from donor code. |

## Entity Classes

Initial entity classes reuse the conflict strategy labels from
`docs/orchestration/source-intake/pattern-routing-2026-05-10.md` and the
multi-host conflict ADR:

| Entity class | Examples | Conflict strategy |
|---|---|---|
| Blueprint prose | blueprint sections, source-card notes, reports | CRDT prose |
| Audit events | `events`, `agent reports`, `source_registry_update` | append-only events |
| Lane status fields | priority, scope text, due-when | LWW status fields |
| Lane claims | path/scope ownership | distributed mutex |
| Queue advances | ready/in-progress/done | LWW + state-machine validation |
| Approval sequencing | numbered approval queues | distributed sequencer |
| Capability grants | actor/scope/ttl uniqueness | uniqueness on `(actor, scope, ttl)` |
| Membership/permission | org membership, role grants | admin-signed append-only |
| Migration state | schema/migration leaders | leader election |
| Source records | retrieved external/internal sources | append-only + supersede |
| Donor patterns | extracted reusable mechanisms | CRDT prose |

## Source Registry Contract

`workspace.sources` and `workspace.donor_patterns` are the durable projection
names for Track 0 material:

- `workspace.sources` emits `SourceRecord` rows from
  `source-intake.md`, including `source_id`, `query_id`, `origin`,
  `retrieved_at`, `source_type`, `license_posture`, `confidence`,
  `target_route`, `target_objects`, `queue_refs`, and `verification_refs`.
- `workspace.donor_patterns` emits `PatternExtraction` rows, including
  `pattern_id`, `source_refs`, `pattern`, `target_object`, `entity_class`,
  `conflict_strategy`, `route`, and `verification_expected`.

No source or donor pattern may be implementation-ready until both projections
can point to a queue item or state why the work is parked.

## Wiki Resolver Path

`ema wiki resolve <id>` remains registry-backed today and becomes
daemon-canonical when `workspace.wiki_ids` is implemented. The existing
`~/.local/bin/wiki` file-backed resolver stays as the offline fallback.

## Implementation Notes

- Code import posture is not inferred from popularity. It is read from
  `workspace.sources.license_posture`.
- A new entity family must add an event contract row and a conflict strategy
  before a writer lands.
- The first daemon implementation may synthesize these projections from files
  and existing events; storage tables can follow after the projection shape is
  stable.

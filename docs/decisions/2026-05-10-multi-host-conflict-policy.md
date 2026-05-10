<!-- wiki-id: ema:multi-host-conflict-policy -->
# Multi-host conflict policy — 2026-05-10

> Status: **accepted, doctrine lock**.
> Codifies §1.5 ("Multi-host conflict resolution — per-entity classification")
> of `~/.claude/plans/your-missing-many-pieces-dazzling-tulip.md`.

## Context

The host-node doctrine (`2026-05-10-host-node-doctrine.md`) locks Q5 as
"all hosts accept writes; per-entity merge." That answer is not a single
algorithm — it implies a per-entity-family classification across the entire
EMA write surface. This ADR pins that classification and the phased rollout
that takes us from single-host orgs (no conflict possible) to fully
peer-multi-write.

Without this lock, every conflict-resolution discussion has to re-derive which
entities are CRDT-safe vs which need a real distributed-mutex algorithm. Pin
it once.

## Decision

### Per-entity conflict-resolution table

| Entity family | Conflict strategy | Notes |
|---|---|---|
| **Blueprint prose** | CRDT (delta_crdt) | Long-form text needs character-level merge. |
| **Intent capture / brain dump** | Append-only | Each entry is its own event. |
| **Events / audit trail / agent reports** | Append-only with vector-clock ordering | Events immutable; reordering surfaces via projection. |
| **Lane status fields** (priority, scope text, due-when) | Last-write-wins with timestamp | Loser sees their write dropped + can re-apply. |
| **Lane claims** (one-actor-at-a-time invariant) | **Distributed mutual exclusion** | Hard problem; needs algorithm. |
| **Queue item state advances** (ready → in-progress → done) | Last-write-wins with state-machine validation | Advances must be monotonic. |
| **Approval queue advances** (sequential numbering) | **Distributed sequence allocation** | Hard problem; needs algorithm. |
| **Capability token issuance** | Uniqueness on (actor, scope, ttl) | Same algorithm as lane claims. |
| **User profile fields** | Last-write-wins per-field | Self-edited only. |
| **Org membership / permission** | Append-only with admin-signed authoritative events | Authoritative source is user's signed action. |
| **Project records / atlas** | CRDT for prose, append-only for facts | Same as Blueprint. |
| **Schema / migration state** | **Single-source-of-truth via leader election** | Migrations cannot be peer-merged. |

### Hard parts (need real distributed algorithms)

- **Lane claims + capability token uniqueness** — distributed mutual
  exclusion (Lamport / Ricart-Agrawala / Paxos-lite class).
- **Approval queue sequencing** — distributed sequencer (or per-host advance
  + reconciliation, if the queue is small and reconciliation cost is
  bounded).
- **Migration leadership** — leader election. Small scope, infrequent.

### Soft parts (existing CRDT or trivial last-write-wins)

Approximately ~70% of entity surface area lands here. The phasing exploits
that ratio: ship the soft parts under multi-host, then graduate the hard
parts.

### Phased rollout

| Wave | Scope | What ships |
|---|---|---|
| **1** | Single-host orgs only | Multi-host topology allowed in model but not in practice. No conflict possible. |
| **2** | Multi-host for soft parts | CRDTs for Blueprint prose, append-only families, last-write-wins fields. Most cockpit work continues to function across multi-host. |
| **3** | Distributed mutual exclusion | Lane claims + capability tokens become safe under multi-host. |
| **4** | Distributed sequencer | Approval queue advances safe under multi-host. |

A migration-leader election (`6O`) is independent and can ship at any wave.

## Out of scope

- Choice between Lamport / Ricart-Agrawala / Paxos-lite for the
  mutual-exclusion algorithm. Wave 3 will pick.
- Whether the distributed sequencer is a per-org coordinator or a
  per-(org, queue) coordinator. Wave 4 will pick.
- CRDT choice for Blueprint prose: see
  [`../architecture/06-blueprint-boundaries.md`](../architecture/06-blueprint-boundaries.md);
  current direction is `delta_crdt`.

## Consequences

- The per-entity classification becomes the contract for any new entity
  family added to EMA. New families must declare their strategy at
  catalog-add time, picking from the seven listed strategies.
- Reviewing PRs that touch a writer becomes "which row in this table does
  this writer fall into?" rather than re-arguing conflict resolution from
  first principles.
- Wave 1's "single-host" path is the bootstrap default — every org is born
  with one host node, and the multi-host topology is provisional until the
  CRDT/LWW layer (`6G`) ships.

## Implementation anchors

- `6G` in the strategic stack: per-entity conflict-resolution layer (soft
  entities first).
- `6M` (distributed mutual exclusion) and `6N` (distributed sequencer) gate
  the hard rows.
- New entities must include a "Conflict strategy" row in their event-family
  doc under `packages/contracts/events/`.

## See also

- [`2026-05-10-host-node-doctrine.md`](./2026-05-10-host-node-doctrine.md)
- [`2026-04-24-transport-and-auth.md`](./2026-04-24-transport-and-auth.md)
- [`../architecture/06-blueprint-boundaries.md`](../architecture/06-blueprint-boundaries.md)
- [`../architecture/05-writer-topology.md`](../architecture/05-writer-topology.md)
- [`../architecture/04-lease-authority.md`](../architecture/04-lease-authority.md)

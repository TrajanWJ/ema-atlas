<!-- wiki-id: ema:blueprint-boundaries -->
<!-- see-also: ema:multi-host-conflict-policy, ema:workspace-source-intake-contract -->

# 06 — Blueprint boundaries

Blueprint is the first (and initially only) vApp. Its data splits across
two planes and the boundary between them is load-bearing.

## The split

| Concern                         | Lives in          | Why                                                           |
| ------------------------------- | ----------------- | ------------------------------------------------------------- |
| Project has a blueprint         | canonical truth   | project-level structural fact                                 |
| List of documents in blueprint  | canonical truth   | access control, linking, replication                          |
| Section tree (headings)         | canonical truth   | structural ops should replay cleanly                          |
| Section ordering                | canonical truth   | deterministic replay                                          |
| Prose body of a section         | BEAM collab doc   | real-time collab, offline convergence                         |
| Inline cursors / presence       | BEAM room state   | ephemeral                                                     |
| Comments on a section           | canonical truth   | need explicit promotion to proposal, audit trail              |
| Section → proposal promotion    | canonical truth   | cross-system event                                            |
| Attachments linked to a section | canonical truth   | pointer lives in `ema_attachments`, link is canonical         |

## Collaborative-prose shape

The prose plane needs BEAM-owned real-time collaboration with
offline-tolerant update replay. The structural plane (above) is canonical
event-sourced and does not use a CRDT.

**Wave-1 position:** no CRDT is wired. The Blueprint section tree renders
from canonical projections; prose bodies are placeholder text fields that
write to the canonical log (coarse-grained) until the CRDT lands.

**Priority direction:** live collaboration is now the top product proof point
per `17-live-collab-first.md`. The daemon is Gleam/BEAM; hosting a JS runtime
inside it is no longer an acceptable default. Preferred options in order:

1. A BEAM-native collaborative document process owned by `ema_blueprint` /
   `ema_collab`. One document ↔ one supervised BEAM process; auth boundary is
   per-document; updates persist in SQLite and later ride the p2p peer
   transport.
2. An Automerge-over-BEAM adapter, same shape.
3. A BEAM-native CRDT library such as `delta_crdt` if it fits the text model.

Rejected as document authority:

- Hocuspocus/Yjs sidecar;
- Node collaboration server;
- Google Docs/Drive as the storage substrate;
- browser-local document truth.

Whichever CRDT ships, the invariant is the same: **one document ↔ one
collaborative object**, not one-per-project. This preserves:

- auth boundary per-document;
- load cost per-document;
- replication shape simple (one doc ↔ one channel).

References to "Yjs" elsewhere in the repo are lineage, not canon. The live
document authority is BEAM-owned.

Blueprint prose uses the shared collab contract names:

- open command: `collab.document.open`
- replace command: `collab.document.replace`
- projection: `collab.document`
- checkpoint event: `collab.document.checkpointed`

## Structural events (canonical-side)

In `packages/contracts/events/blueprint.md`:

- `blueprint.document.created` / `.renamed` / `.archived`
- `blueprint.section.added` / `.renamed` / `.moved` / `.removed`
- `blueprint.section.promoted_to_proposal`
- `blueprint.comment.added` / `.resolved`
- `blueprint.attachment.linked` / `.unlinked` (mirrors
  `attachment.linked` with the blueprint context populated)

## Mirror events

Several Blueprint events are **mirrors** of canonical events owned by
another context (e.g. `blueprint.attachment.linked` mirrors
`attachment.linked` from `ema_attachments`).

Contract:

1. The canonical event is appended **first**, by its owning writer
   (`ema_attachments` for `attachment.linked`).
2. The mirror event is appended **in the same writer call**, immediately
   after, by a second `bus.append` invocation wrapped in the same
   command handler. The two events share `org_id`, `space_id` (if any),
   `project_id` (if any), `actor`, and `ts` (same wall clock moment).
3. Sequencing is via the bus's per-daemon monotonic `txid`. The mirror
   always has a greater `txid` than the canonical event it mirrors.
4. Appends are **sequenced, not atomic**. SQLite commits each append
   independently. If the mirror append fails after the canonical append
   succeeded, the canonical event stands; the writer emits an
   `internal` class `command_result.error` so the surface can retry.
5. Projections and replicas MUST tolerate an orphaned canonical event
   whose mirror is missing: treat mirror as derivable from canonical
   plus a family filter. Never treat the absence of a mirror as
   absence of the fact.

A retry of the same command re-runs validation; if the canonical event
already matches the requested intent, the writer MUST be idempotent
(no duplicate `attachment.linked`) and emit only the missing mirror.

## Per-entity conflict resolution

Locked 2026-05-10 by
[`../decisions/2026-05-10-multi-host-conflict-policy.md`](../decisions/2026-05-10-multi-host-conflict-policy.md).
Every host node in an org accepts writes for its connected clients;
conflicts across hosts resolve per entity family. Blueprint sits across
several rows of that table:

| Entity family | Conflict strategy | Notes |
|---|---|---|
| Blueprint prose (section bodies) | **CRDT (delta_crdt)** | Long-form text needs character-level merge; ships as part of the BEAM-native collab path above. |
| Blueprint section tree (canonical structural plane) | Append-only with vector-clock ordering | Structural ops replay deterministically. |
| Blueprint comments | Append-only | Each comment is its own event; resolution is a separate event. |
| Blueprint section → proposal promotion | Append-only with admin-signed authoritative event | Mirrors the cross-system ownership rule. |
| Blueprint attachment links (mirror events) | Append-only mirror; canonical lives in `ema_attachments` | See "Mirror events" below. |
| Project records / atlas | CRDT for prose, append-only for facts | Same as Blueprint prose vs structural split. |

The full per-entity table for non-Blueprint families lives in the conflict
policy ADR. Blueprint's CRDT direction (`delta_crdt` first, Automerge
adapter second) is the implementation expression of the "Blueprint prose"
row.

## What this wave ships

- Canonical event stubs in the catalog.
- `blueprint.md` vApp doc.
- A live Blueprint/Myro-style editor surface in `apps/web/app/page.tsx`.
- A supervised `ema_collab` actor with SQLite-backed replacement frames,
  `collab.document.open`, `collab.document.replace`, and live
  `collab.document` projection fan-out over shell IPC.
- Multi-machine p2p transport for collab frames remains the next layer; the
  single-daemon BEAM room is the local authority proof.

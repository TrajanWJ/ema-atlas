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
| Prose body of a section         | Yjs (per-doc)     | real-time collab, offline convergence                         |
| Inline cursors / presence       | Yjs awareness     | ephemeral                                                     |
| Comments on a section           | canonical truth   | need explicit promotion to proposal, audit trail              |
| Section → proposal promotion    | canonical truth   | cross-system event                                            |
| Attachments linked to a section | canonical truth   | pointer lives in `ema_attachments`, link is canonical         |

## Collaborative-prose shape

The prose plane needs a CRDT for real-time, offline-tolerant collaboration.
The structural plane (above) is canonical event-sourced and does not use a
CRDT.

**Wave-1 position:** no CRDT is wired. The Blueprint section tree renders
from canonical projections; prose bodies are placeholder text fields that
write to the canonical log (coarse-grained) until the CRDT lands.

**Wave-7 direction:** Yjs is not the committed choice. The daemon is
Gleam/BEAM; hosting a JS runtime inside it is undesirable. Preferred
options in order:

1. A BEAM-native CRDT (`delta_crdt`, or an Automerge-compatible port) owned
   by the daemon. One document ↔ one CRDT instance; auth boundary is
   per-document; replication rides the existing event bus + peer
   transport.
2. An Automerge-over-BEAM adapter, same shape.
3. Hocuspocus/Yjs sidecar as a last resort, behind a separate process and
   its own WS endpoint — only if neither BEAM-native option is credible.

Whichever CRDT ships, the invariant is the same: **one document ↔ one
collaborative object**, not one-per-project. This preserves:

- auth boundary per-document;
- load cost per-document;
- replication shape simple (one doc ↔ one channel).

References to "Yjs" elsewhere in the repo are lineage, not the locked
choice. Update them as the CRDT decision firms up.

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

## What this wave ships

- Canonical event stubs in the catalog.
- `blueprint.md` vApp doc.
- A placeholder vApp page in `apps/web/src/vapps/blueprint/` that renders
  a fake section tree from a projection and demonstrates the **Attach…**
  button handing off to git-ema's attach dialog.
- **No CRDT wiring yet.** Real-time collab is wave 7; the specific CRDT
  (BEAM-native preferred — see "Collaborative-prose shape" above) is
  deferred.

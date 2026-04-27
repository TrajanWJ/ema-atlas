# Blueprint (vApp)

Blueprint is the first vApp. It turns a project into a living,
structured document: section tree, prose, comments, promotion to
proposals.

## Owned objects

- `blueprint_document` (canonical)
- `blueprint_section` (canonical — structural node)
- `blueprint_comment` (canonical)
- prose body per section (BEAM-owned live collaboration document)

## Exposed truths

- "this project has a blueprint with N documents";
- "this section is resolved / pending / promoted to proposal";
- "these attachments are linked to this section".

## Human actions (wave 1)

- Open the blueprint page for the current project.
- Open a BEAM-owned live document room for the root Blueprint section.
- Edit the shared prose body through the browser access point.
- Publish a whole-body replacement frame to the daemon collab store and watch
  other subscribed browser tabs receive the `collab.document` projection.

Comments, promotion, and multi-machine p2p frame replication follow after the
single-daemon live document loop is stable.

## Runtime context

Blueprint hosts live document rooms under the BEAM daemon. The document room
actor owns prose state, presence fan-out, durable update persistence, and the
future peer-replication stream. Hocuspocus/Yjs is historical lineage, not the
current plan.

## Chronicle links

Blueprint events use the `blueprint.*` family
(`packages/contracts/events/blueprint.md`). Any `blueprint.*` event that
references an attachment MUST also be preceded by an `attachment.linked`
event; the blueprint event is a mirror, not a replacement.

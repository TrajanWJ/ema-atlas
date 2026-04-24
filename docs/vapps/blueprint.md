# Blueprint (vApp)

Blueprint is the first vApp. It turns a project into a living,
structured document: section tree, prose, comments, promotion to
proposals.

## Owned objects

- `blueprint_document` (canonical)
- `blueprint_section` (canonical — structural node)
- `blueprint_comment` (canonical)
- prose body per section (Yjs)

## Exposed truths

- "this project has a blueprint with N documents";
- "this section is resolved / pending / promoted to proposal";
- "these attachments are linked to this section".

## Human actions (wave 1)

- Open the blueprint page for the current project.
- See a fake section tree (projection-populated, no editing yet).
- Click **Attach…** on a section → attach dialog from git-ema opens.

Prose editing, real-time collab, comments, and promotion are later
waves.

## Runtime context

Blueprint will eventually host a Hocuspocus server actor under
`ema_blueprint`. This wave ships the context folder stub only.

## Chronicle links

Blueprint events use the `blueprint.*` family
(`packages/contracts/events/blueprint.md`). Any `blueprint.*` event that
references an attachment MUST also be preceded by an `attachment.linked`
event; the blueprint event is a mirror, not a replacement.

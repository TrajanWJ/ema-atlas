# ema_attachments

The daemon-side backend for `git-ema`. Owns canonical truth for:

- **attachments** — pointer + metadata records that any EMA object can
  link to.
- **connectors** — external-source connection state (Google Drive,
  GitHub). Demo-stubbed in 0.0.5 wave 1.

See:

- `../../../docs/architecture/07-git-ema.md` — full design.
- `../../../packages/contracts/events/attachment.md`
- `../../../packages/contracts/events/connector.md`
- `../../../packages/contracts/types/attachment.md`
- `../../../packages/contracts/types/connector.md`

## Modules

- `attachments.gleam` — attachments writer actor; handles
  `attachment.rename`, `attachment.delete`, `attachment.link`,
  `attachment.unlink`, and emits `attachment.created` (in response to
  `connector.import_resource`).
- `connectors.gleam` — connectors writer actor; handles
  `connector.connect`, `connector.disconnect`,
  `connector.import_resource`, `connector.list_picker_items`. Stub
  picker data lives here in-memory.

## Anti-silo contract

Other contexts MUST NOT own their own attachment stores. They reference
attachments by id and listen to `attachment.linked` / `attachment.unlinked`
to keep their projections current.

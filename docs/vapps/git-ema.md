# git-ema (vApp)

See `docs/architecture/07-git-ema.md` for the full design. This page is
the vApp-lens summary.

## One-line

The attachments + external-source vApp. Like Google Drive or GitHub, but
EMA-native and the canonical record of every file or codebase linked into
EMA workflows.

## Owned objects

- `attachment` (canonical — pointer + metadata)
- `connector` (canonical — external-source connection state)
- local blob content (plane 5 — out of scope this wave)

## Exposed truths

- "this project has these attachments";
- "this user has Google Drive / GitHub connected";
- "this attachment is linked to these N objects".

## Human actions (wave 1 — all demo-stubbed)

- Connect Google Drive (fake — flips to `connected` with
  `demo@example.com`).
- Connect GitHub (fake — flips to `connected` with `gh:demo-user`).
- Browse a fake picker of sample Drive files / GitHub repos.
- Create attachments from picked items.
- Attach any existing attachment to any EMA object via the shared
  attach dialog.
- Disconnect a connector (existing attachments preserved, marked
  "source unreachable").

## Runtime context

`ema_attachments` bounded context in the daemon owns:

- `attachments_writer` — validates + emits `attachment.*` events.
- `connectors_writer` — validates + emits `connector.*` events.
- projection actors for `git_ema.project_attachments` and
  `git_ema.user_connectors`.

## Chronicle links

- `attachment.*` and `connector.*` event families.
- Every `attachment.linked` carries `object_kind` + `object_id`, so
  downstream vApps can subscribe to links for their own objects without
  owning attachment storage.

## Anti-silo rule

Other vApps must not:

- open their own attachment stores;
- persist file bytes on their own objects;
- inspect connector internals (e.g. `fake` flag).

They MUST:

- open the shared attach dialog;
- reference attachments by id;
- treat connector state as opaque.

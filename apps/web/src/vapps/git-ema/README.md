# git-ema vApp (web surface)

See `../../../docs/architecture/07-git-ema.md` and
`../../../docs/vapps/git-ema.md` for design.

## Files

- `index.tsx` — page (user-scope or project-scope).
- `connectors-panel.tsx` — **Connect Google Drive** / **Connect GitHub**
  stub buttons + connected-state rows.
- `picker-dialog.tsx` — fake picker for imported items from a connected
  connector.
- `attachment-list.tsx` — list of attachments with delete.
- `attach-to-object.tsx` — shared attach dialog. Any other vApp renders
  this to link an attachment to one of its objects.

## Surface rules

- Never inspect `connector.fake` — treat connector state as opaque.
- Never persist attachment bytes locally — references only.
- Other vApps MUST import `AttachDialog` from
  `./attach-to-object` rather than building their own attach UI.

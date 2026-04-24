# connector

Owner: `ema_attachments` (the git-ema backend).

See `docs/architecture/07-git-ema.md` and `types/connector.md`.

This wave: demo-stubbed. `connector.connected` appends directly when the
user clicks a button; no real OAuth.

## Kinds

### `connector.connected`
```
payload {
  connector_id:  connector:<ulid>
  user_id:       user:<ulid>
  provider:      "google_drive" | "github"
  fake:          true                    // remove when real OAuth lands
  display_label: string                  // "demo@example.com", "gh:demo-user"
}
```

### `connector.disconnected`
```
payload { connector_id, by: user:<ulid>, reason?: string }
```

### `connector.linked_resource_imported`
Fires when the user picks an item from the (fake) picker and it becomes
an attachment. Emitted *after* the `attachment.created` for the
resulting attachment.
```
payload {
  connector_id:  connector:<ulid>
  attachment_id: attachment:<ulid>
  source_ref:    <SourceRef>         // same as on the attachment
}
```

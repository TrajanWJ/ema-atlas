# blueprint

Owner: `ema_blueprint`.

Structural events only — prose lives in the BEAM-owned collab document room
and emits canonical events only at checkpoint or promotion boundaries.

See `docs/architecture/06-blueprint-boundaries.md`.

## Kinds

### `blueprint.document.created`
```
payload {
  document_id: blueprint_doc:<ulid>
  project_id:  project:<ulid>
  title:       string
  created_by:  user:<ulid>
}
```

### `blueprint.document.renamed`
```
payload {
  document_id: blueprint_doc:<ulid>
  from:        string
  to:          string
}
```

### `blueprint.document.archived`
```
payload {
  document_id: blueprint_doc:<ulid>
  reason?:     string
}
```

### `blueprint.section.added`
```
payload {
  section_id: blueprint_sec:<ulid>
  document_id: blueprint_doc:<ulid>
  parent_section_id?: blueprint_sec:<ulid>
  title:       string
  position:    int
  added_by:    user:<ulid>
}
```

### `blueprint.section.renamed`
```
payload {
  section_id: blueprint_sec:<ulid>
  from:       string
  to:         string
}
```

### `blueprint.section.moved`
```
payload {
  section_id: blueprint_sec:<ulid>
  from: { parent?: string, position: int }
  to:   { parent?: string, position: int }
}
```

### `blueprint.section.removed`
```
payload {
  section_id:  blueprint_sec:<ulid>
  removed_by:  user:<ulid>
}
```

### `blueprint.section.promoted_to_proposal`
```
payload {
  section_id:  blueprint_sec:<ulid>
  proposal_id: proposal:<ulid>
  promoted_by: user:<ulid>
}
```

### `blueprint.comment.added`
```
payload {
  comment_id: blueprint_cmt:<ulid>
  section_id: blueprint_sec:<ulid>
  body:       string
  by:         user:<ulid>
}
```

### `blueprint.comment.resolved`
```
payload {
  comment_id:  blueprint_cmt:<ulid>
  resolved_by: user:<ulid>
}
```

### `blueprint.attachment.linked`
Mirror of `attachment.linked` with blueprint context populated. Emitted
*after* the canonical `attachment.linked` event.
```
payload {
  attachment_id: attachment:<ulid>
  section_id:    blueprint_sec:<ulid>
  by:            user:<ulid>
}
```

### `blueprint.attachment.unlinked`
```
payload {
  attachment_id: attachment:<ulid>
  section_id:    blueprint_sec:<ulid>
  by:            user:<ulid>
}
```

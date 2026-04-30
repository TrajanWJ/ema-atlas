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

## Planner-graph node families

See `docs/architecture/07-blueprint-planner-events.md` for the rationale.

### `blueprint.gac.created`
```
payload {
  gac_id:      blueprint_gac:<ulid>
  document_id: blueprint_doc:<ulid>
  section_id?: blueprint_sec:<ulid>
  category:    "gap" | "assumption" | "clarification"
  priority:    "critical" | "high" | "medium" | "low"
  question:    string
  options:     [{ label: string, text: string, implications?: string }]
  by:          user:<ulid>
}
```

### `blueprint.gac.answered`
```
payload {
  gac_id:        blueprint_gac:<ulid>
  selected:      string | null
  freeform?:     string
  result_action: "create_canon" | "create_intent" | "update_node" | "defer_to_blocker"
  target?:       string
  by:            user:<ulid>
}
```

### `blueprint.gac.deferred`
```
payload {
  gac_id:    blueprint_gac:<ulid>
  defer_to:  string
  reason?:   string
  by:        user:<ulid>
}
```

### `blueprint.gac.promoted`
```
payload {
  gac_id:        blueprint_gac:<ulid>
  promoted_kind: "canon" | "intent" | "blocker"
  target:        string
  by:            user:<ulid>
}
```

### `blueprint.blocker.opened`
```
payload {
  blocker_id:      blueprint_blocker:<ulid>
  document_id?:    blueprint_doc:<ulid>
  section_id?:     blueprint_sec:<ulid>
  category:        "tricky_question" | "deferred_decision" | "blocking_dependency"
  priority:        "critical" | "high" | "medium" | "low"
  title:           string
  description?:    string
  resolve_by?:     string
  promoted_from?:  blueprint_gac:<ulid>
  by:              user:<ulid>
}
```

### `blueprint.blocker.resolved`
```
payload {
  blocker_id:   blueprint_blocker:<ulid>
  resolved_to?: string
  note?:        string
  by:           user:<ulid>
}
```

### `blueprint.blocker.promoted`
```
payload {
  blocker_id:    blueprint_blocker:<ulid>
  promoted_kind: "gac"
  target:        blueprint_gac:<ulid>
  by:            user:<ulid>
}
```

### `blueprint.aspiration.captured`
```
payload {
  aspiration_id: blueprint_aspiration:<ulid>
  title:         string
  description?:  string
  timeframe:     "near_term" | "mid_term" | "long_term" | "aspirational"
  source: {
    type:        "auto_detected" | "manual_tag"
    origin_app?: string
    origin_text?: string
    confidence?: number
  }
  by: user:<ulid>
}
```

### `blueprint.aspiration.promoted`
```
payload {
  aspiration_id: blueprint_aspiration:<ulid>
  promoted_kind: "intent"
  target:        string
  by:            user:<ulid>
}
```

### `blueprint.aspiration.archived`
```
payload {
  aspiration_id: blueprint_aspiration:<ulid>
  reason?:       string
  by:            user:<ulid>
}
```

### `blueprint.decision.locked`
```
payload {
  decision_id:  blueprint_dec:<ulid>
  title:        string
  body:         string
  supersedes?:  blueprint_dec:<ulid>
  source_node?: string
  by:           user:<ulid>
}
```

### `blueprint.decision.superseded`
```
payload {
  decision_id:    blueprint_dec:<ulid>
  superseded_by:  blueprint_dec:<ulid>
  reason?:        string
  by:             user:<ulid>
}
```

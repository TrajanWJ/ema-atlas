# proposal

Owner: `ema_swarm_coordination`.

A proposal is a promotable change request: drafted, submitted, accepted
or rejected. Blueprint sections promote into proposals.

`proposal.drafted` is retained for the pre-existing blueprint section
promotion path and maps to projection status `drafted` with
`approver_required: false`. `proposal.created` is the canonical
pipeline-floor event and defaults to `approver_required: true`.

## Kinds

### `proposal.drafted`
```
payload {
  proposal_id: proposal:<ulid>
  project_id:  project:<ulid>
  title:       string
  draft_by:    user:<ulid>
  origin?:     { kind: "blueprint_section", section_id: string }
}
```

### `proposal.created`
```
payload {
  proposal_id: string
  intent_id: string
  title: string
  body?: string
  plan?: string
  approver_required: bool
  proposed_by_actor_id: actor:<ulid> | string
  status: "created" | "approved"
  created_at: iso8601
}
```

### `proposal.approved`
```
payload {
  proposal_id: string
  approved_by_actor_id: actor:<ulid> | string
  rationale: string
  approved_at: iso8601
}
```

### `proposal.submitted`
```
payload { proposal_id, submitted_by: user:<ulid> }
```

### `proposal.accepted`
```
payload { proposal_id, accepted_by: user:<ulid>, note?: string }
```

### `proposal.rejected`
```
payload { proposal_id, rejected_by: user:<ulid>, reason?: string }
```

### `proposal.superseded`
```
payload {
  proposal_id:      proposal:<ulid>
  superseded_by:    proposal:<ulid>
}
```

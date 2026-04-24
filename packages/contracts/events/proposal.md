# proposal

Owner: (future) `ema_swarm_coordination`.

A proposal is a promotable change request: drafted, submitted, accepted
or rejected. Blueprint sections promote into proposals.

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

# canon

Owner: `ema_canon`.

Canon nodes are durable truth records written from completed pipeline work.
Sprint 3's first required use is `execution_result` writeback from a harness
execution.

## Kinds

### `canon.written`
```
payload {
  canon_id: string
  kind: "execution_result" | "decision" | "doctrine" | "observation" | "retro" | "direction"
  content_hash: sha256(body)
  body: string
  source_kind: "execution" | "proposal" | "intent" | "manual" | "external"
  source_id?: string
  links: { kind: string, target_id: string }[]
  written_by_actor_id: actor:<ulid> | string
  approved_by_actor_id?: actor:<ulid> | string
  written_at: iso8601
}
```

The daemon writer recomputes `sha256(body)` and rejects writes where the
supplied `content_hash` differs.

### `canon.superseded`
```
payload {
  canon_id: string
  superseded_by_canon_id: string
  superseded_by_actor_id: actor:<ulid> | string
  rationale: string
  superseded_at: iso8601
}
```

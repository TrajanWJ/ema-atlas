# intention

Owner: `ema_intention_farmer`.

`intention` is the harvested-session **review surface** — distinct from
`intent` (the canonical pipeline-floor unit owned by `ema_swarm_coordination`).

Sprint 5 makes intention **review state** daemon-canonical instead of
file-backed. The four event kinds below replace
`.ema-dev/intention-backfeed/reviews.json` as the source of truth. The JSON
file remains as **migration/import evidence only** (read-only fallback in the
CLI when the daemon projection has no entry for a given intent_id).

## Kinds

### `intention.reviewed`
```
payload {
  intent_id: string                 % stable id from harvest projection (intent:<hex>)
  state: "accepted" | "rejected" | "deferred"
  reviewer_actor_id: actor:<ulid> | string
  reason: string
  evidence_ref: string              % source path or jsonl line ref
  reviewed_at: iso8601
}
```

Emitted when an operator (or agent) accepts/defers/rejects a harvested
intention. Replaces `reviews.json` as the canonical truth. Re-reviewing the
same `intent_id` is allowed; the projection takes the latest event by `txid`.

### `intention.backfeed.requested`
```
payload {
  intent_id: string
  destination: "queue" | "artifact"
  target_project: string
  approve_token: "reviewed"        % the explicit guard token; must match exactly
  requester_actor_id: actor:<ulid> | string
  requested_at: iso8601
}
```

Emitted at the start of a guarded `ema intention backfeed --approve reviewed`
flow, before the queue/artifact write is attempted. No auto-promotion: the
event is rejected by the writer if `state != accepted` for the referenced
intent_id, or if `approve_token != "reviewed"`.

### `intention.backfeed.completed`
```
payload {
  intent_id: string
  destination: "queue" | "artifact"
  target_project: string
  resource_id: string              % queue_item:<ulid> or artifact:<ulid>
  completed_at: iso8601
}
```

Emitted after the queue/artifact write succeeds. Pairs with the
`intention.backfeed.requested` event by `intent_id`.

### `intention.backfeed.failed`
```
payload {
  intent_id: string
  destination: "queue" | "artifact"
  target_project: string
  error_class: string
  message: string
  failed_at: iso8601
}
```

Emitted when the queue/artifact write fails (validator rejection, missing
project, unknown handler, etc.). Pairs with the `intention.backfeed.requested`
event by `intent_id`.

## Projection: `intention.review`

Reduces `intention.reviewed` + `intention.backfeed.*` events into a single
keyed-by-intent_id record:

```
{
  source: "daemon_events",
  reviews: [
    {
      intent_id: string,
      state: "accepted" | "rejected" | "deferred",
      reviewer_actor_id: string,
      reason: string,
      reviewed_at: iso8601,
      backfeed_state: "none" | "requested" | "completed" | "failed",
      backfeed_destination: "queue" | "artifact" | null,
      backfeed_resource_id: string | null,
      backfeed_target_project: string | null,
      backfeed_error_class: string | null,
      backfeed_message: string | null,
      updated_at: iso8601
    }
  ]
}
```

Implemented in `apps/daemon/src/ema_sqlite_helpers.erl` as
`intention_review_projection_json/1`.

## Migration: `.ema-dev/intention-backfeed/reviews.json`

The pre-Sprint-5 file format is preserved as a one-way **migration/import
evidence** path:

- The CLI MAY read `reviews.json` as a fallback when the daemon projection has
  no record for an `intent_id`, treating the file entry as a synthetic
  `intention.reviewed` (no txid, no resource_id, `backfeed_state: "none"`).
- The CLI MUST NOT write to `reviews.json` for new reviews once daemon
  emission is wired; new state goes through `intention.review.upsert`.
- A future migration tool (`ema intention migrate-reviews`) will replay the
  file as `intention.reviewed` events with `evidence_ref:
  "file:.ema-dev/intention-backfeed/reviews.json"`.

## Daemon command surface (planned)

The Gleam daemon does not yet expose IPC handlers for these commands; the CLI
emits via best-effort and falls back to file-backed reviews. When wired, the
handlers will be:

- `intention.review.upsert` → emits `intention.reviewed`
- `intention.backfeed.start` → emits `intention.backfeed.requested`
- `intention.backfeed.finish` → emits `intention.backfeed.completed` or
  `intention.backfeed.failed`

Until the handlers land, the CLI prints a `daemon_canonical: false` marker on
the emitted JSON so callers (cockpit web, agents) can detect the transitional
mode.

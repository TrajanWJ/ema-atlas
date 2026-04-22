# Stream of Thought Operator Runbook

## Current visible surface
- Category: `🧵 STREAM`
- Primary lane: `#babysitter-live`

## Operator intent
Use `#babysitter-live` for:
- visible work
- autonomous chain state
- START / STOP acknowledgements
- concise mission-control deltas

Do **not** use it for raw chatter dumps.

## HTTP control endpoints

### Operator-friendly command wrapper
- `POST /api/babysitter/command`

Example body:
```json
{
  "command": "START hermes-watch"
}
```

Accepted phrases:
- `START <chain>`
- `STOP <chain>`
- `PAUSE <chain>`
- `RESUME <chain>`
- `STATUS`
- `LIST CHAINS`
- `HINT <chain> <ms>`

### List chain state
- `GET /api/babysitter/chains`

### Inspect one chain
- `GET /api/babysitter/chains/:id`

### Start a chain
- `POST /api/babysitter/chains/:id/start`

Example body:
```json
{
  "profile": "hermes-watch"
}
```

### Stop a chain
- `POST /api/babysitter/chains/:id/stop`

### Pause / resume a chain
- `POST /api/babysitter/chains/:id/pause`
- `POST /api/babysitter/chains/:id/resume`

### Hint next wake time
- `POST /api/babysitter/chains/:id/hint`

Example body:
```json
{
  "next_tick_hint_ms": 900000
}
```

## Category rewrite

### Dry run
- `POST /api/babysitter/rewrite-category`
- default behavior is dry run planning

### Explicit apply
- `POST /api/babysitter/rewrite-category`
- pass `dry_run=false`

## What should appear in `#babysitter-live`

Examples:
- `▶️ START hermes-watch · medium · executor=hermes · stream=babysitter-live`
- `🧠 hermes-watch · <concise autonomous update> ...`
- `⏹️ STOP hermes-watch · stream=babysitter-live`

## Failure modes

### Hermes unavailable
Expected behavior:
- scheduler still runs
- Hermes-backed chains fall back to local summary text
- chain cadence stretches slightly instead of dying

### Discord config unavailable during category rewrite planning
Expected behavior:
- dry run still returns a plan
- category discovery is marked unavailable
- actions are shown as assumed creates

## Operational stance

- Keep the orchestrator independent here first.
- Use Hermes as runtime substrate, not as Discord surface owner.
- Bridge into broader EMA and multi-machine awareness only after this layer is stable.

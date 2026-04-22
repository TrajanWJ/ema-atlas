# Stream of Thought Control Spec

## Purpose

Define the independent orchestrator contract for the current `#babysitter-live` environment.

## Vocabulary

- **lane** — semantic meaning of an update (`operator_rollup`, `operations`, `attention`, etc.)
- **cadence bucket** — bounded timing range for a chain (`ultrafast`, `fast`, `medium`, `slow`, `trend`, `archive`)
- **emission tier** — push behavior from babysitter policy (`hot`, `medium`, `quiet`)
- **stream** — the visible surface key currently routed through babysitter (`babysitter-live`, `babysitter-ops`, `babysitter-alerts`)
- **chain** — an autonomous named loop that can be started, stopped, hinted, paused, and resumed

## Core rules

1. `#babysitter-live` is the operator rollup and control surface.
2. Raw chatter does not belong in `#babysitter-live`.
3. Chains may run concurrently.
4. Each chain stays inside its cadence bucket bounds.
5. Hermes is an execution substrate, not the Discord surface owner.
6. The first version is independent in this environment and only later bridges to wider EMA/multi-machine orchestration.

## Cadence buckets

- `ultrafast` → `5s–30s`
- `fast` → `30s–5m`
- `medium` → `5m–30m`
- `slow` → `30m–90m`
- `trend` → `90m–6h`
- `archive` → `6h+`

## Chain state

Each chain exposes at least:
- `id`
- `profile`
- `stream`
- `lane`
- `cadence_bucket`
- `status`
- `autonomous_enabled`
- `requested_next_tick_at`
- `next_tick_at`
- `last_tick_at`
- `last_event_at`
- `related_chain_ids`
- `priority`
- `visibility_mode`
- `executor`
- `last_summary`
- `last_control_command`

## Control actions

### START
Creates or reactivates a named autonomous chain.

Effects:
- chain enters `running`
- chain receives a scheduled next tick
- visible acknowledgement is emitted into `#babysitter-live`

### STOP
Stops a named autonomous chain.

Effects:
- chain enters `stopped`
- timer is cancelled
- visible acknowledgement is emitted into `#babysitter-live`

### PAUSE / RESUME
Optional operator controls for temporary halting without deleting chain state.

### HINT
Sets a preferred next wake time.

Effects:
- scheduler stores `requested_next_tick_at`
- scheduler clamps delay into cadence bucket bounds

## Hermes wiring

Hermes integration is correct when:
- Discord remains the existing visible surface
- Hermes is reached over its API server
- the orchestrator can query Hermes model/runtime availability
- Hermes-backed chains can ask Hermes for concise autonomous updates
- Hermes failure does not collapse the visible surface

## Category rewrite

The stream category rewrite path is explicit and dry-run first.

Endpoint behavior:
- dry run plans the `🧵 STREAM` category/channel alignment
- apply performs the Discord REST updates only when explicitly requested

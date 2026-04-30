# 13 — Lane cadence and auto-checkups

## Context

Lanes are first-class workstreams (ADR 05, ADR 08). Per the cohesion plan, the vcalendar subsystem is supposed to *drive* workspace work — phase boundaries, planning intervals, review checkups. But in T3.1 (soft phase enforcement) we observed that a lane has no canonical statement of its **review cadence** — how often the daemon should remind a human or agent to verify the lane is still on-scope.

This ADR adds an additive `lane_cadence` payload field to `lane.opened` and lays the foundation for the auto-checkup scheduler.

## Decision

### Additive payload field

`lane.opened` payload gains an optional `lane_cadence` field. Accepted values:

- `"daily"` — emit a `checkup.scheduled` event every 24 hours while the lane is `active`
- `"weekly"` — every 7 days
- `"per_handoff"` — only emit a checkup when an explicit handoff is requested; no time-based emit
- `null` (omitted) — same as `"daily"` for convention purposes; the canonical record carries `null`

Invalid values (anything other than the three above) are rejected by `agent_workspace.open_lane_linked` with `WorkspaceError.InvalidCadence`.

### Cadence threshold matrix

```
daily       => 86_400 seconds
weekly      => 604_800 seconds
per_handoff => infinite (never auto-emit)
```

### CLI flag

```
ema lane open ... [--cadence daily|weekly|per_handoff]
```

Default: not passed → null in payload.

### Projection

`lane_registry_projection_json/1` surfaces `lane_cadence` as a top-level string field per lane. `null` when not set.

### Auto-checkup scheduler — current state

The actor that performs the periodic scan-and-emit is **deferred to a follow-up wave**. The cadence data lands canonically now so future schedulers (Gleam OTP actor, external cron, or an MCP-equivalent watcher) have a deterministic data source.

For v0, an `ema vcalendar tick-checkups` CLI command (or a 1-minute cron loop running the same logic) is the manual trigger. The scheduler actor will:

1. Read `bus.lane_registry_projection_json` for `status: "active"` lanes.
2. For each, look up `lane_cadence` and the most-recent `checkup.scheduled` event for that lane (via projection).
3. If `now - last_checkup_ts > cadence_threshold`, emit `checkup.scheduled` with actor `actor:agent:checkup-scheduler` and payload `{lane_id, cadence, scheduled_by}`.

## Consequences

1. Old `lane.opened` events without `lane_cadence` are still valid; projection surfaces `null` and the (eventual) scheduler defaults them to `"daily"`.
2. The auto-checkup scheduler is purely additive — when it ships, it cannot violate phase enforcement (T3.1) because `checkup.scheduled` is allowed in every phase.
3. Nothing in T3.1 references `lane_cadence`, so the two ADRs are independent.

## What we are NOT changing

- The `checkup.scheduled` and `checkup.completed` event payloads — unchanged.
- `lane.claimed`, `lane.moved`, etc. — they do not carry cadence (it's set at lane open and is implicit thereafter).
- The catalog (`packages/contracts/events/catalog.v0.md`) — no new event kinds.
- ID prefixes — no new prefixes.

## References

- `docs/architecture/05-writer-topology.md`
- `docs/architecture/08-workspace-blueprint-cross-refs.md`
- `packages/contracts/events/lane.md`
- `packages/contracts/events/checkup.md`
- `apps/daemon/src/ema_swarm_coordination/agent_workspace.gleam#open_lane_linked`
- `apps/daemon/src/ema_vcalendar/ema_vcalendar.gleam#schedule_checkup` — the writer the scheduler will call.

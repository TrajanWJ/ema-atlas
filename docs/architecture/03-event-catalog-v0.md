# 03 — Event catalog v0

The canonical event catalog lives in
[`../../packages/contracts/events/`](../../packages/contracts/events/).

This file is a pointer and policy note, not the list itself.

## Why a versioned catalog

Event kinds are a system contract. They cross:

- daemon bounded contexts (via the in-process bus);
- daemon → surface (via IPC fan-out);
- daemon → daemon (via replication);
- audit + replay (via the canonical log).

Ad-hoc kinds break all four boundaries. Every kind in use MUST be present
in `packages/contracts/events/catalog.v0.md`. A pre-commit contract-check
script under `tooling/` enforces this.

## Families (v0)

`org`, `actor`, `identity`, `space`, `project`, `membership`, `invite`,
`access_session`, `device`, `peer`, `lease`, `replication`, `lane`,
`handoff`, `proposal`, `incident`, `dispatch`, `execution`, `tool`,
`blueprint`, `collab`, `attachment`, `connector`.

See `catalog.v0.md` for the full kind list; each family has its own
file with kinds, payload shapes, and intended consumers.

## Common envelope

Every event regardless of family carries:

```
{
  event_id:    event:<ulid>
  kind:        <family>.<verb>[.<subverb>]
  ts:          ISO-8601 UTC
  actor:       user:<ulid> | device:<ulid> | system:<component>
  org_id:      org:<ulid>
  space_id?:   space:<ulid>
  project_id?: project:<ulid>
  dispatch_id?: dispatch:<ulid>      (Hermes seam)
  execution_id?: execution:<ulid>    (Hermes seam)
  payload:     <family-specific>
}
```

## Hermes seam

`dispatch_id` and `execution_id` on the envelope are not optional
decorations — they mark the **Hermes seam**: the contract boundary
between two sibling bounded contexts inside the same daemon.

- `ema_control` owns the `dispatch.*` family. It decides *what* should
  run (a tool call, an agent turn, a mission step), appends
  `dispatch.*` events, and grants a scoped `secret_ref` for resources
  the work needs.
- `ema_exec` owns the `execution.*` and `tool.*` families. It watches
  the bus for new dispatches, runs them, and appends `execution.*` /
  `tool.*` events back, carrying the originating `dispatch_id` so
  causation is explicit.

The seam is **event-sourced, not RPC**. Both contexts share one
in-process bus; every handoff is an appended event. A future wave may
move `ema_exec` out of process — the seam shape does not change because
the transport is already the canonical log.

Scoped grants (`secret_ref:<ulid>`) ride on `dispatch.started`
payloads. Execution-side writers MUST NOT log the dereferenced secret
value; `tool.invoked` args MUST redact any field carrying a secret.

External MCP-backed toolkits such as Argent use the same seam. They are
represented as provider/tool metadata on `tool.*` events, not new event
families. See `25-mobile-agent-toolkits.md` for the mobile-agent-toolkit
projection direction.

When real external agents are wired (Hermes orchestrator), the same
seam is the wire contract: external runners subscribe to `dispatch.*`
and publish `execution.*` / `tool.*` back. See the future
`docs/architecture/XX-hermes-integration.md` for the external-wire
addendum; the internal-seam rules in this section remain authoritative.

## Conventions

See `packages/contracts/README.md` — **Conventions** section — for the
authoritative rules on:

- event-kind casing (`<family>.<verb>[.<subverb>]`, lowercase, past-tense)
- payload field naming (`snake_case`, typed ULIDs, ISO-8601 `_at` suffix)
- actor grammar (`user:` / `device:` / `system:<component>`)
- module naming in the Gleam daemon
- command-op casing in the IPC protocol
- the `contract-check.sh` coverage rules

Every family file MUST comply. Reviewers reject PRs that break these
rules.

## Versioning

- Additive changes (new kinds, new optional payload fields) do not require
  a catalog version bump.
- Removing a kind, renaming a kind, or changing a required payload field
  requires a new `catalog.vN.md` and a migration note.
- The old catalog files are preserved — never edited in place after v0
  ships.

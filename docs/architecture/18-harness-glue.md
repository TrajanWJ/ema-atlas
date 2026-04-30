# 18 — Harness Glue preparation

Harness Glue is the preparation layer for future Hermes orchestration.
It combines two donor builds:

- `Active builds/duct-tape-onion-harness/` supplies provider/session
  lifecycle ideas: WebSocket transport, session registry, adapters,
  simulated sessions, PTY, SDK, and inference scaffolding.
- `Active builds/chronicle/` supplies activity parsing and indexing:
  Claude, Codex, Hermes-format, shell, fs, git parsers, ingestion,
  timeline/search APIs, and WebSocket updates.

This is not Hermes. Hermes will consume Harness Glue later to plan,
dispatch, observe, replay, and audit work. Current CLI and contract
work should keep the actor identity as the current agent or
`actor:harness-glue`; it should not silently claim `actor:hermes`.

## First Slice

The first EMA slice is intentionally small:

- `ema harness providers --json` lists provider capabilities and the
  normalized event rail.
- `ema harness donors --json` names the Chronicle and Duct Tape donor
  roles.
- `ema harness status --json` gives the usable-now surface, pending daemon
  projections, pending provider adapters, and the explicit not-Hermes
  authority boundary.
- `ema harness start --provider codex|claude-code --json` starts a
  long-running tmux-backed worker, records a file-backed Harness execution,
  and emits `dispatch.started` / `execution.started` lineage while the
  daemon writer is pending.
- `ema harness list --json` lists the file-backed tmux execution registry;
  `--lane <lane-id>` narrows the view to sessions assigned to one lane.
- `ema harness assign --lane <lane-id> --execution <id> --json` binds an
  existing execution/session to a lane in the file-backed lane-session
  registry. This is the current bridge for “lanes have assigned sessions”
  until `dispatch.registry` and `execution.registry` are daemon-owned.
- `ema harness context --execution <id>|--lane <lane-id> --json` returns the
  registry record, current tmux liveness, recent captured output, event log
  entries, and exact follow-up commands so an agent can recover the latest
  status and context for a long-running session without reading chat scrollback.
- `ema harness events --execution <id>|--lane <lane-id> --json` reads the
  file-backed Harness event log plus start-lineage events embedded in older
  execution records.
- `ema harness grep --execution <id>|--lane <lane-id> --query <text> --json`
  builds a local search bundle from execution records, event entries, and
  captured tmux output, then searches it with `rg --json`.
- `ema harness log --execution <id> --json` captures recent tmux output for
  a running worker.
- `ema harness dispatch --provider simulated --json` emits a
  deterministic simulated execution timeline.
- `ema harness stream --execution <id> --json` replays the same
  normalized timeline shape.
- `ema harness search --query <text> --json` currently aliases the local
  Harness grep bridge; daemon-backed `chronicle.activity` remains the
  canonical destination.

The simulated timeline uses the canonical event names:

1. `dispatch.started`
2. `execution.started`
3. `tool.returned`
4. `execution.ended`
5. `dispatch.ended`

## Daemon Projections

Harness Glue prepares these daemon projections:

- `harness.providers` — provider inventory, adapter kind, capability,
  health, and source donor.
- `dispatch.registry` — dispatch records keyed by lane, actor, cwd,
  provider, prompt summary, scope, and status.
- `execution.registry` — active/recent execution state per dispatch.
- `tool.timeline` — tool-call and result summaries, redacted for audit.
- `chronicle.activity` — indexed activity from agent transcripts,
  shells, git, filesystem changes, and harness events.

## Boundary

Harness Glue does not decide what EMA should do next. It only exposes
runtime rails and observed activity. Workspace decisions stay in
lane/queue/problem/handoff records. Future Hermes may synthesize those
records into plans and dispatches, but every action must still flow
through daemon events, scoped grants, and auditable dispatch records.

Remote assist and peer execution stay explicit: actor, device, scope,
TTL, and audit events are required before tunneled dispatch or control.

## Donor Pollination Checklist

- Port Duct Tape's simulated adapter first.
- Then port provider/session registry shape and WebSocket method tests.
- Then map Codex/Claude PTY adapters behind local capability checks.
- Port Chronicle parsers into an EMA ingestion bounded context.
- Project fake and then real harness events into `chronicle.activity`.
- Only after those rails are visible should Hermes orchestration become
  more than a resume-packet/projection seed.

# EMA Agent Contract

Use this when wiring OpenClaw or any other agent/runtime to EMA.

## Authority rule

EMA is the system of record.
Agents should read status/context from EMA and report execution outcomes back into EMA.
Do not keep a shadow orchestration state machine in the caller.

## Capability locality rule

Treat capabilities as runtime-context-bound, not globally true.
A human shell, an agent turn, a coding-agent dispatch lane, and the EMA daemon may have different access to:
- SSH
- local files
- auth material
- provider credentials
- host tools

Prefer EMA daemon surfaces for canonical reads/writes.
Use SSH as an operator/debug lane, not as the required architecture for routine integration.

## Preferred read path

Use these endpoints in this order:

1. `GET /api/control-plane`
   - canonical control-plane summary
   - includes project counts, active incidents, and sweeper state
2. `GET /api/control-plane/context_for?project=<project>`
   - bounded working set for one project
   - includes `repo_context`
3. `GET /api/control-plane/live?limit=N`
   - recent execution + incident events for operator views
4. `GET /api/surfaces/host-truth`
   - host/queue/degraded-mode truth
   - use this for machine reality and backlog pressure
5. Fallback CRUD surfaces if needed:
   - `GET /api/status`
   - `GET /api/projects`
   - `GET /api/tasks`
   - `GET /api/proposals`
   - `GET /api/executions`

## Preferred write path

For operator/agent actions, prefer these control-plane endpoints:

- `POST /api/control-plane/command`
- `POST /api/control-plane/proposals`
- `POST /api/control-plane/proposals/:id/run`
- `POST /api/control-plane/executions/:id/complete`
- `POST /api/control-plane/executions/:id/dispatch-update`

## Minimal caller behavior

### Read status

- show `/api/control-plane` if available
- also surface `/api/surfaces/host-truth` when operator wants machine reality

### Start work

Either:
- submit a proposal with `POST /api/control-plane/proposals`
- or use `POST /api/control-plane/command` with `propose <project>|<intent>|<summary>`

Then run it with:
- `POST /api/control-plane/proposals/:id/run`
- or `POST /api/control-plane/command` with `run <proposal_id>`

### Finish work

When the external agent/runtime completes, report back via:
- `POST /api/control-plane/executions/:id/complete`
- or `POST /api/control-plane/executions/:id/dispatch-update`

## Command grammar

`POST /api/control-plane/command`

Supported commands:
- `status`
- `status <project>`
- `context_for <project>`
- `incidents`
- `incidents all`
- `propose <project>|<intent>|<summary>`
- `run <proposal_id>`
- `complete <execution_id>`
- `fail <execution_id>`
- `ack <incident_id>`
- `restart <incident_id>`
- `cancel <incident_id>`

## OpenClaw integration guidance

OpenClaw should:
- prefer EMA HTTP surfaces over ad-hoc local state
- treat EMA as canonical for execution lineage
- use `/api/control-plane/live` for operator-facing summaries
- use `/api/surfaces/host-truth` for degraded/host backlog awareness
- report external outcomes back through `dispatch-update` or `complete`

## Example flow

1. `GET /api/control-plane/context_for?project=ema`
2. `POST /api/control-plane/command` with `propose ema|incident-hardening|Normalize stale execution handling`
3. `POST /api/control-plane/command` with `run <proposal_id>`
4. external runtime does work
5. `POST /api/control-plane/executions/:id/dispatch-update`
6. operator watches `GET /api/control-plane/live?limit=50`

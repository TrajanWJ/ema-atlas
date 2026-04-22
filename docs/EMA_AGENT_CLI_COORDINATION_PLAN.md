# EMA Agent CLI Coordination Plan

## Why this exists

EMA should function as a coordination system for active work, not just a daemon with side tools.
Agents need a shared work ledger and a repeatable start/sync loop so work is visible, attributable, and resumable.

This plan aligns agent behavior around EMA CLI and defines the path from today's inspection-oriented CLI to a true agent work contract.

## Core framing

### A. EMA CLI is the shared work ledger
Agents should use EMA CLI while working, not just before or after.

### B. EMA centers on coordinated execution
The system's center of gravity is task/proposal/context/agent coordination, not repo housekeeping.

### C. Highest-leverage move: first-class work primitive
The CLI needs an explicit agent-facing workflow primitive for beginning and syncing work.

## Current reality discovered

There are currently two CLI stories in the repo:

1. `cli/ema_cli/cli.py`
   - large mock-harness / scenario-driven command surface
   - broad conceptual model
   - useful for simulation and product thinking

2. `cli/ema_cli/main.py` + `cli/ema_cli/commands/*`
   - narrower real HTTP-backed CLI
   - actual installed `./ema` entrypoint behavior
   - today includes: status, context, task, agent, metrics, project, proposal

This mismatch is important. EMA is in transition from a conceptual simulator into a real operator control surface.

There is also a second mismatch underneath that one:
- the real HTTP-backed CLI assumes `/api/projects`, `/api/tasks`, and `/api/executions`
- the current Phoenix daemon primarily exposes `/api/control-plane`, `/api/surfaces/*`, `/api/sessions/monitor`, and `/api/babysitter/*`

That means the coordination plan has two tracks:
1. improve the agent-facing CLI contract now
2. align daemon endpoints so the CLI contract is actually backed by durable server semantics

## Agent operating policy

Every agent working through EMA should follow this loop.

### Start-of-work
1. `ema status`
2. `ema context operator`
3. `ema context project <id|slug>` when project-scoped
4. `ema task list --status pending`
5. `ema agent ps`
6. `ema work start ...`

### During work
- update ledger when reality changes
- prefer explicit task state transitions over invisible progress
- use `ema work sync <task_id> --status ... --note ...`

### End-of-work
- mark the task done / blocked / failed
- leave enough detail for a handoff
- avoid orphaned work with no visible state

## Phase plan

### Phase 0 — establish the contract
Goal: make the workflow visible and easy to adopt.

Deliverables:
- `ema work` command group in real HTTP-backed CLI
- coordination plan in repo
- README/help text pointing agents toward the work loop

Status:
- first slice implemented in this phase

### Phase 1 — make work start practical
Goal: let agents begin work via a single command.

Target behavior:
- resolve project
- fetch operator/project context
- inspect pending tasks and active agents
- create or bind task
- set `in_progress`
- emit a work packet usable by the agent session

Current implementation:
- `ema work start`
- `ema work sync`
- `ema work packet`

Gaps:
- no explicit task claiming endpoint
- no conflict detection / reservation semantics
- note sync currently reuses description field

### Phase 2 — daemon-backed claim/sync semantics
Goal: move from CLI orchestration to first-class API semantics.

Needed daemon/API work:
- task claim endpoint
- task activity / notes stream
- execution registration for agent work begin/end
- richer task ownership model
- conflict handling when two agents target same work

Proposed endpoints:
- `POST /api/tasks/:id/claim`
- `POST /api/tasks/:id/notes`
- `POST /api/executions/begin`
- `POST /api/executions/:id/heartbeat`
- `POST /api/executions/:id/finish`

### Phase 3 — unify task/proposal/execution flow
Goal: make proposal → task → execution a continuous chain.

Needed behaviors:
- work start can bind to proposal-originated tasks
- execution state visible in `ema work packet`
- agent lifecycle reflected in both task and execution records
- proposal desk reflects active execution truth

### Phase 4 — policy and automation
Goal: all agents operate through EMA by default.

Possible measures:
- agent prompts / wrappers call `ema work start` automatically
- status dashboards highlight off-ledger work
- task updates required for session closeout
- routing / planning surfaces generate work packets automatically

## First-slice implementation rationale

The first slice should optimize for:
- immediate usefulness
- low daemon dependency
- compatibility with current HTTP-backed CLI
- making invisible work visible

That is why the current first slice is CLI-side.
It creates a usable contract without waiting for all daemon endpoints to exist.

## Review checklist

Review these next:
1. whether `ema work` command naming feels right
2. whether task update should carry notes separately from description
3. whether `agent_id` should be freeform or daemon-validated
4. whether `work packet` should include proposals / metrics / project health by default
5. what claim semantics the daemon should own

## Immediate next coding tasks

1. Add daemon-supported task notes / activity
2. Add explicit task claim endpoint
3. Add execution begin/finish registration aligned with `ema work`
4. Extend help/docs/examples across CLI
5. Add tests for `ema work` command flows

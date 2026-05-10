<!-- wiki-id: ema:operating-model -->
# Swarm Operating Model

EMA swarm coordination follows this control loop:

```text
orient -> meta-progress -> lane claim -> execute -> verify -> report
  -> queue/problem -> handoff -> loop
```

## Current Boundary

The swarm is not autonomous yet. In this wave:

- no durable daemon control loop claims lanes and starts executions without a
  coordinator;
- Hermes execution authority is future-tense;
- lane arbitration is enforced by worktree discipline, docs, and CLI shape
  until daemon writers cover every object;
- Agent Work can render the control room, but real authority comes from daemon
  projections and events.

## Core Rules

- One active objective should have one main write lane.
- Support lanes should reduce friction around that main lane.
- Recovery lanes exist only to capture drift, stale work, donor fragments, or
  blocked implementation.
- A worker without an explicit lane may inspect and report; it should not
  mutate project files.
- Reports, queue items, problems, and handoffs are durable coordination
  artifacts, not chat residue.
- Docs can bootstrap coordination, but the implementation target is daemon
  truth.

## Turn Contract

Every worker turn needs explicit inputs and outputs.

Read:

- project/campaign/mission pointer;
- current lane file or lane assignment;
- latest relevant `STATUS.md` entry;
- recent reports, handoffs, queue items, problems, checkups, and vCalendar
  phase.

Claim:

- branch or worktree;
- lane id or temporary title;
- allowed write scope;
- verification expectation;
- stop condition.

Write:

- lane-scoped code or docs;
- lane report;
- queue/problem/handoff records for unfinished work;
- narrow status pointers only when they reduce future cold-start cost.

Verify:

- run declared checks;
- run `git diff --check` on touched files;
- inspect `git status --short --branch`;
- record unavailable checks as explicit risk.

## Minimum Report Shape

```text
Lane Report:
- Lane:
- Actor / role:
- Branch / worktree:
- Changed files:
- Summary:
- Verification:
- Decisions:
- Risks:
- Queue items created:
- Problems created:
- Handoffs requested:
- Next action:
```

## Implementation Target

The docs in this folder become operational when these daemon-backed surfaces
exist:

- `lane.registry`
- `queue.registry`
- report ingestion
- handoff lifecycle
- problem/solution graph
- vCalendar/checkup cadence
- worktree/recovery candidate registry
- Agent Work live projection over those objects

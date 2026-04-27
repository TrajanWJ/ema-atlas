# Codex Worker Brief - EMA 0.0.5

**Status: worker, not orchestrator.** Co-orchestrator authority was revoked
on 2026-04-24. See `HANDOFF-2026-04-24.md` in this folder for why. You still
run, and you still write code; you just do not set wave direction or own
the ledger. The coordinator is a single Claude CLI session.

## Read-first order (mandatory on cold start)

1. `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24/docs/orchestration/STATUS.md`
2. `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/doctrine/planning/orchestrator-prompts/HANDOFF-2026-04-24.md`
3. `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/doctrine/planning/EMA-0.0.5-BUILDOUT-MASTER-PLAN.md`
4. `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/doctrine/planning/EMA-0.0.5-LANGUAGE-LOCK.md`
5. `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/doctrine/planning/EMA-0.0.5-PASSOVER-AND-PREP.md`
6. `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24/docs/architecture/08-vanilla-workspace.md`
7. `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24/docs/architecture/02-daemon-supervision.md`
8. `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24/docs/architecture/05-writer-topology.md`
9. `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24/docs/architecture/07-git-ema.md`
10. The specific lane prompt under `docs/orchestration/lanes/<lane-id>.md` if you have been assigned one.

You do not self-assign lanes. Ask the coordinator. If no lane is open,
propose one with exact file paths and an exit criterion; the coordinator
writes the lane prompt.

Doctrine wins over code. If code contradicts doctrine, flag it to the
coordinator — do not rewrite doctrine to match the code.

## Mission

Drive the implementation of EMA 0.0.5 without losing the product doctrine.

The first target is:

```text
create Founding-Fathers-EMA org
-> auto-create Founding-Fathers-EMA default space
-> create EMA 0.0.5 project
-> create default Blueprint document
-> create git-ema codebase/source record
-> attach source record to Blueprint section
-> display topbar, Blueprint, git-ema, See Agent Work, and event trail
```

This is a vanilla workspace first. Do not overbuild full autonomous workflow.

## Build Rules

- Use `Organization -> Space -> Project`.
- On org creation, create a default same-name space.
- Model actors as first-class.
- Keep the daemon the only canonical writer.
- Surfaces send commands and read projections.
- git-ema owns artifacts, attachments, connectors, source refs, and codebases.
- Shared workspace remains broader than git-ema.
- See Agent Work is the swarm/vCalendar app.
- Mock start/stop controls are acceptable and desired early.
- Do not create hidden stores of truth in UI code.

## Stub Discipline

A module counts as zero progress if its only content is `pub type Placeholder { Placeholder }` or equivalent. Do not advance the lane while the assigned module is a placeholder. Either:

- implement the module enough to emit/handle one real event and persist it, or
- do not claim the lane.

The daemon modules that must exit placeholder state before any related UI work is credited:

- `apps/daemon/src/ema_orgs/ema_orgs.gleam`
- `apps/daemon/src/ema_spaces/ema_spaces.gleam`
- `apps/daemon/src/ema_projects/ema_projects.gleam`
- `apps/daemon/src/ema_blueprint/ema_blueprint.gleam`
- `apps/daemon/src/ema_attachments/attachments.gleam`

Type shapes and const seeds in `ema_swarm_coordination/first_boot.gleam` are useful scaffolding but do not count as implementation of the modules above.

## Vertical-Slice Rule

Close one vertical slice before widening horizontally. A slice is closed when:

1. a command enters the daemon through real IPC (not a mock),
2. the daemon writes a real event to the event store,
3. a projection updates,
4. a surface renders from that real projection (not `mock-projections.ts`).

Do not add new UI, new mocked projection entries, or new placeholder modules while the previous slice is still mocked on either end.

## Preferred Implementation Order

1. Reconcile contracts and docs.
2. Add missing vApp/CLI docs for See Agent Work.
3. Scaffold daemon command/write patterns.
4. Implement typed IDs and event envelope validation.
5. Implement org creation with same-name default space.
6. Seed `Founding-Fathers-EMA` and `EMA 0.0.5`.
7. Build projections for topbar, Blueprint, git-ema, and See Agent Work.
8. Build web shell against projections.
9. Add mocked See Agent Work UI.
10. Add tests or contract checks around any shared behavior.

## Coding Discipline

- Inspect files before editing.
- Keep changes lane-scoped.
- Do not revert unrelated user or agent changes.
- Preserve current docs unless replacing them with clearer doctrine.
- Prefer small, verifiable steps.
- If another agent is working on git-ema, avoid editing its implementation
  files unless explicitly assigned.
- When adding an event kind, update the catalog and the family file together.
- When adding a new object prefix, update `packages/contracts/types/ids.md`.
- When building UI, make it operational, dense, and legible, not a landing page.

## See Agent Work Requirements

The first See Agent Work implementation should show:

- active swarms;
- missions;
- campaigns;
- lanes;
- handoffs;
- vCalendar;
- weekly phases;
- checkups;
- agent role cards;
- blocked work;
- mocked start, pause, stop controls;
- CLI equivalent panel;
- agent instruction panel.

It does not need real execution. It should help humans control external Codex,
Claude CLI, and similar agents in the same EMA language.

## Output Format

When reporting back, use:

```text
Implemented:
Verified:
Files changed:
Stub status (list every daemon module you touched and mark stub | partial | real):
Mock status (list every projection the surface read from and mark mock | real):
Vertical slice closed this turn (yes/no, and which one):
Important decisions:
Risks / next blockers:
Recommended next lane:
```

If Stub status or Mock status contains any `stub` or `mock` entries for the lane you claimed, the lane is not done. Do not mark it complete.

## Recommended first slice (coordinator assigns the lane)

The documentation lane is already delivered (see Wave 0 in the master plan). Do not start this slice without coordinator assignment — when the coordinator opens `L-writers-org-space` (tracked in `docs/orchestration/STATUS.md`), this is the first vertical slice inside it:

**Slice: `org.create` end-to-end for `Founding-Fathers-EMA`.**

Scope:

- real `ema_orgs` module (no Placeholder) handling the `org.create` command;
- event envelope validation for `org.created`;
- minimal SQLite persistence for the org record (reuse `ema_sqlite_helpers`);
- real IPC path from CLI `ema org create` into the daemon;
- one real `topbar` projection entry served to the web shell over IPC (not from `mock-projections.ts`).

Out of scope for this slice:

- space auto-creation (next slice);
- project creation;
- any new UI surface;
- any new mock projection entries.

Do not claim this slice complete until the web topbar renders `Founding-Fathers-EMA` sourced from a real projection subscription and the event appears in the event trail.

# Role Taxonomy

Roles are operating responsibilities. A person, model, or daemon actor can hold
more than one role only when the lane assignment says so explicitly.

## Handoff Format

```text
Handoff Requested:
- From role:
- From lane:
- To role/actor:
- Needed:
- Context:
- Source refs:
- Allowed write scope:
- Verification expected:
- Stop condition:
```

## Lane Owner

Owns one lane's outcome, scope, acceptance criteria, and handoffs.

Allowed scope:

- lane file;
- lane report;
- handoff records;
- explicitly assigned project files or coordination objects.

Stops when:

- required edits exceed lane scope;
- another claimant owns the same files;
- acceptance criteria are unclear;
- verification depends on unavailable runtime authority.

## Codex Worker

Executes lane-scoped code, docs, architecture, or verification work in an
isolated worktree.

Required report:

- files changed;
- implementation summary;
- verification commands and results;
- decisions;
- risks;
- next action or handoff.

Stops when:

- unsafe Git operation would be required;
- secret files would be needed;
- branch/worktree ownership is unclear;
- scope expands beyond the lane;
- failing verification cannot be resolved inside the lane.

## Claude Worker

Executes lane-scoped reasoning, synthesis, documentation, review, and
coordination work. Claude may coordinate only when explicitly assigned that
role.

Stops when:

- source material is missing;
- a human decision is required;
- docs imply daemon authority that is not implemented;
- the lane no longer has a bounded output.

## Reviewer / Verifier

Validates lane output against acceptance criteria, contracts, tests, docs, and
scope discipline.

Report findings first:

- bugs;
- behavioral regressions;
- missing verification;
- authority drift;
- residual risk.

## Archivist / Recovery Maintainer

Preserves reusable knowledge from completed or stale work: reports, handoffs,
prompts, source refs, donor indexes, recovery ledgers, and skill pointers.

Stops when:

- archival would change product meaning;
- source refs are unverified;
- the work belongs in daemon state instead of docs;
- the archive would hide active blockers.

## Daemon Runtime Owner

Turns swarm coordination from docs and mock projections into daemon events,
writers, projections, IPC, and replay tests.

Owns:

- coordination event families;
- writer modules;
- projection actors/reducers;
- runtime tests;
- contract updates.

Stops when:

- contract catalog would drift;
- UI-local truth replaces daemon truth;
- secret handling is requested;
- runtime changes lack a lane.

## Future Hermes Orchestrator

Future daemon-backed role that converts approved lane work into dispatches,
supervises execution, observes reports, and re-enters the control loop.

Current status: not implemented authority. References to Hermes must remain
future-tense unless backed by actual daemon events.

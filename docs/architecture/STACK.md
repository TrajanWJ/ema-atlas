# Current Stack Doctrine

Updated: 2026-05-10.

This file is the current stack source of truth for EMA 0.0.6. Any code,
doctrine, or configuration that presents another stack as the destination
runtime is stale until reconciled against this document.

## Destination runtime

- TS CLI: `apps/cli`
- Gleam/BEAM daemon: `apps/daemon`
- Canonical SQLite event log: `apps/daemon/canonical.db`
- Tauri viewer: `apps/desktop`
- Web surfaces: `apps/web`

Canonical SQLite means daemon-owned event and state storage. It does not mean
ad hoc file-backed JSON state, project-local SQLite indexes, or sidecar logs
are canonical just because they are durable.

## Archived and donor stacks

These stacks are translation sources only:

- the all-Electron iteration under `atlas/archive/builds/all-ts-electron-ema`
- the all-Elixir bootstrap phase
- the file-backed JSON state era

They can provide vocabulary, UX patterns, tests, or migration evidence. They
are not the runtime target for new EMA work.

## Capability honesty

Provider capability states must reflect executable proof, not installation
presence. `roundtrip-failed` means a provider is installed or configured enough
to attempt execution, but no successful recent executable roundtrip is cached.

Current Proslync execution readiness is proven only while all of these remain
true:

- a real successful Codex roundtrip through the EMA harness path
- restart-survival proof for execution records
- daemon-owned artifact/context/canon writeback

If any of those fail or go stale, Proslync bootstrap/readiness surfaces must
report blocked execution readiness even when daemon health, lane/queue reads,
and active-build discovery are healthy.

## External Dependencies

Codex adapter argv is validated against `codex-cli 0.130.0`. The executable
adapter lives in `apps/cli/src/commands/harness.ts` around `codexExecArgv(...)`
and the long-running provider command string nearby. Roundtrip proof dispatch
uses `codex exec --json --sandbox read-only --cd <cwd> --ephemeral <prompt>`;
the long-running provider command uses `codex exec --sandbox workspace-write`.
Codex CLI version bumps must be paired with an adapter argv smoke because CLI
flags have drifted across versions.

## Build hygiene

`apps/cli/dist/` is tracked in git in this repo, so any sprint that edits
`apps/cli/src/` must run `pnpm build:cli` before verification and before
trusting `node apps/cli/dist/bin.js`. Source/dist drift is a release blocker:
the built CLI is the executable surface used by smoke scripts and user-facing
verification commands.

## Naming clarifications

The system has two concepts whose names overlap:

- **intent** (canonical): the pipeline-floor concept. An intent is a declared
  unit of work that flows through Intent -> Proposal -> Approval -> Execution
  -> Canon. Canonical events: `intent.created`, `intent.updated`. CLI:
  `ema intent ...`. Pipeline-floor.
- **intention** (harvested): a session-level review tool that processes
  harvested working notes and optionally backfeeds into queue or artifact.
  File-backed and hybrid. CLI: `ema intention ...`. Not pipeline-floor.

Future doctrine should not collapse these two terms.

## Canonical pipeline floor -- current and deferred

As of sprint 3: actor (CLI added), intent (full vertical added), proposal
(lifecycle extended), and canon (writer + CLI added). `proposal.drafted` is
retained as the pre-existing blueprint-section-promotion path; new
`proposal.created` is the pipeline-floor event. `canon.written` is now the
execution-result writeback path used by harness executions.

Deferred beyond sprint 3:

- Self-knowledge canon nodes for stack doctrine, sprint history, and parked
  directions. These become orchestrator work after execution-result canon is
  proven.
- Execution resumption from checkpoint. Sprint 3 labels in-flight work
  `interrupted_by_restart`; restartable continuation is later work.

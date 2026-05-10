# See Agent Work Agent Usage

This document is the operating guide for external Codex, Claude CLI, and other
agent sessions working inside the EMA project while the active runtime build is
0.0.6, before EMA can run those agents directly.

See Agent Work is the human-visible control room. This file is the
agent-facing runbook for behaving as if that control room already exists.

> CLI doctrine (`~/Desktop/AGENTS.md`, 2026-05-07, post-cwt-absorption):
> EMA's CLI is `ema`. cwt is absorbed into EMA — its surface is the
> `cockpit` vApp (`?vapp=cockpit` in web; `ema cockpit …` in CLI). The
> `~/.local/bin/cwt` wrapper is a thin alias for `ema cockpit "$@"`. When
> asked "what projects/clients exist?" or "what's on for client X?", route
> through `ema cockpit …`.

## Default Scope

Unless a lane states otherwise, agents should assume:

```text
Organization: Trajan's Organization
Space: Personal Workspace
Project: EMA
Build: 0.0.6
```

The daemon also seeds Trajan's personal organization and `Personal Workspace`.
Project work must still pass `--project <name-or-id>` when a task names a
project, because daemon `home_current` is a convenience selection, not a
workspace contract.

## Read Before Working

Before editing, an external agent should read:

1. `../../../Projects/EMA/PROJECT-MAP.md`
2. `../WORKSPACE-ENTRYPOINT.md`
3. `../orchestration/STATUS.md`
4. `../architecture/01-topology.md`
5. `../architecture/10-first-boot.md`
6. `../architecture/09-see-agent-work.md`
7. `../vapps/see-agent-work.md`
8. `../cli/agent-workspace.md`
9. `../cli/see-agent-work.md`

If the lane touches git-ema, also read:

1. `../architecture/07-git-ema.md`
2. `../vapps/git-ema.md`

If the lane touches daemon writes, also read:

1. `../architecture/02-daemon-supervision.md`
2. `../architecture/05-writer-topology.md`

## Work Shape

Every agent should operate inside one explicit lane.

A lane should include:

- mission or campaign context;
- lane title;
- expected output;
- files or modules in scope;
- source refs or attachment refs;
- verification expectation;
- handoff owner if blocked.

Do not turn a lane into an unbounded project. If the work grows, propose a new
lane or request a handoff.

## Required Context Block

Every external-agent prompt generated from See Agent Work should include this
shape:

```text
EMA Scope:
- Organization: Trajan's Organization
- Space: Personal Workspace
- Project: EMA
- Build: 0.0.6

Mission:
<mission id/title/purpose>

Lane:
<lane id/title/status/owner>

Expected Output:
<specific deliverable>

Allowed Write Scope:
<files, folders, or docs the agent may edit>

Sources:
<git-ema source refs, attachment refs, codebase refs, or doc paths>

Rules:
- Keep work lane-scoped.
- Do not create hidden stores of truth.
- Preserve intent vs canon separation.
- Treat the daemon as the only canonical writer.
- Route artifacts, attachments, connectors, source refs, and codebases through git-ema language.
- Report changed files and verification.
```

## Canon and Intent

Agents should preserve the difference between intent and canon.

Intent is raw direction, conversation, reasoning, debate, or proposal material.
Canon is approved, structured truth in the system.

Until the proposal path exists, agents may write design docs, architecture
notes, mocked projections, and implementation plans. They should not claim that
an idea became canon unless the relevant doc, contract, or event explicitly
promotes it.

## Reporting Progress

When reporting back, use this shape:

```text
Implemented:
<what changed>

Verified:
<commands, checks, or manual review performed>

Files changed:
<paths>

Important decisions:
<decisions made or reinforced>

Risks / next blockers:
<what could break or remains unresolved>

Recommended next lane:
<one concrete next lane>
```

This is the same reporting shape used by the Codex orchestrator prompt. Keeping
the format stable lets See Agent Work render reports as lane updates later.

## Handoffs

Use handoff language when another actor needs to continue, review, or unblock
work.

Handoff shape:

```text
Handoff Requested:
- From lane: lane:<id or title>
- To actor: actor:<id or role>
- Needed: <specific review, implementation, decision, or verification>
- Context: <short state summary>
- Source refs: <docs, files, attachments, or codebase refs>
- Stop condition: <what counts as done>
```

A handoff is not a vague note. It is a transfer contract.

## Source Material

Agents should treat git-ema as the source and artifact authority.

Use git-ema language for:

- codebase records;
- source refs;
- attachments;
- artifacts;
- connectors;
- linked evidence;
- imported docs;
- generated reports.

See Agent Work may display those records, but it does not own them.

## vCalendar Behavior

The virtual calendar is a coordination model, not just real-world scheduling.

Agents should use vCalendar language when work has timing or cadence:

- agent day;
- agent week;
- weekly phase;
- focus block;
- checkup;
- review window;
- campaign milestone.

Early vCalendar entries may be mocked or doc-only. They should still be named
clearly so later projections can adopt them.

## Mocked Control Discipline

Start, pause, and stop controls are allowed to exist before real execution.

Agents must keep mocked state honest:

- say `mocked`, `doc-only`, `stub`, or `pending daemon writer` where true;
- do not imply a CLI command has executed if it only exists as contract text;
- do not create UI-local truth that bypasses daemon projections;
- prefer command-shaped placeholders over ad hoc buttons.

## What Not To Do

Do not:

- bypass `Organization -> Space -> Project`;
- write canon directly from a surface;
- hide durable state in UI-only objects;
- let git-ema become the whole shared workspace;
- duplicate attachment/source storage outside git-ema;
- create real autonomous execution in the first See Agent Work lane;
- edit another worker's active lane without coordination;
- flatten missions, campaigns, lanes, and handoffs into generic tasks.

## Example External-Agent Prompt

```text
You are working inside the EMA project, active runtime build 0.0.6.

Scope:
- Organization: Trajan's Organization
- Space: Personal Workspace
- Project: EMA
- Build: 0.0.6

Mission:
Build the vanilla workspace control surfaces.

Lane:
Document the See Agent Work external-agent usage protocol.

Expected Output:
Create or update the agent-facing doc that explains how Codex and Claude CLI
sessions should claim lanes, preserve canon/intent boundaries, report progress,
request handoffs, and use git-ema source refs.

Allowed Write Scope:
- Active builds/EMA-0.0.6/docs/agents/
- Active builds/EMA-0.0.6/docs/vapps/see-agent-work.md
- Active builds/EMA-0.0.6/docs/cli/see-agent-work.md
- Active builds/EMA-0.0.6/docs/architecture/09-see-agent-work.md
- Active builds/EMA-0.0.6/docs/WORKSPACE-ENTRYPOINT.md

Rules:
- Do not implement real execution.
- Keep mocked controls honest.
- Keep git-ema as the source/artifact owner.
- Report files changed and verification.
```

## First Acceptance Criteria

This agent usage guide is ready when:

- an external agent can understand the active org, space, and project;
- the agent can identify its lane and stop condition;
- the agent can preserve intent/canon boundaries;
- the agent knows when to use git-ema language;
- the agent knows how to report progress and request handoffs;
- the agent does not confuse mocked control affordances with real execution.

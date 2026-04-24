# See Agent Work (vApp)

See Agent Work is the swarm, mission, campaign, lane, and vCalendar control
surface for EMA.

It is the app that makes agent work visible before EMA can fully run the agents
itself.

## One-line

A beautiful operational control room for seeing, shaping, starting, pausing,
and reviewing agent/swarm work across missions, campaigns, lanes, handoffs,
and virtual calendar time.

## Product Purpose

The first EMA build should not hide agent work inside chat scrollback or
external CLI sessions. Even while Codex, Claude CLI, and other tools are doing
the real work outside EMA, EMA should show the structure those agents are
operating inside.

See Agent Work is that structure:

- what is active;
- who or what is assigned;
- what phase the work is in;
- what is blocked;
- what needs review;
- what calendar/checkup pressure exists;
- what command a human could run next;
- what prompt an external agent should receive.

## Owned or Rendered Objects

See Agent Work renders shared workspace and coordination objects. It should not
own canonical truth directly.

Rendered object families:

- `swarm`
- `mission`
- `campaign`
- `lane`
- `handoff`
- `queue_item`
- `proposal`
- `actor`
- `agent`
- `soul_profile`
- `vcalendar`
- `calendar_block`
- `weekly_phase`
- `checkup`
- `dispatch`
- `execution`
- `incident`
- `attachment`

Wave 1 may use mocked projections for families that do not have daemon writers
yet.

## Truths Exposed

The app should expose:

- current active swarms;
- campaign and mission hierarchy;
- lane ownership and status;
- handoff requests and completions;
- review and verification queues;
- upcoming checkups;
- weekly phase focus;
- vCalendar blocks;
- agent role/soul summaries;
- dispatch/execution status where available;
- linked sources and artifacts through git-ema;
- CLI equivalents for each major action.

## Human Actions

Humans should be able to:

- create a campaign;
- create a mission;
- open a lane;
- assign an actor;
- request a handoff;
- schedule a checkup;
- create a vCalendar block;
- start a swarm;
- pause a swarm;
- stop a swarm;
- copy a CLI equivalent;
- copy an agent prompt;
- attach source material;
- mark a lane blocked;
- mark work ready for review.

In early waves, these can emit mocked events or update mock projections.

## Agent Actions

Agents should be able to use the same shape through CLI or docs:

- list active missions;
- claim a lane;
- report progress;
- request a handoff;
- schedule a checkup;
- attach artifacts;
- propose a next step;
- mark blockers;
- produce a review summary.

The CLI equivalent is part of the app contract, not an afterthought.

Agent usage runbook:

`docs/agents/see-agent-work-agent-usage.md`

## First Screen

The first screen should be dense, calm, and operational.

Suggested regions:

- top swarm pulse: active swarms, active lanes, blocked items, next checkup;
- mission rail: campaigns, missions, current focus;
- lane board: idea, ready, active, review, blocked, done;
- vCalendar strip: today, this week, agent phases, checkups;
- agent roster: actor, role, current lane, status, stop/start affordance;
- command panel: selected action and CLI equivalent;
- agent instruction panel: prompt block for external Codex/Claude sessions;
- chronicle strip: recent events.

## Mocked Controls

The app should include controls even before real runtime is wired:

- `Start Swarm`
- `Pause Swarm`
- `Stop Swarm`
- `Open Mission`
- `Open Lane`
- `Assign Actor`
- `Request Handoff`
- `Schedule Checkup`
- `Add vCalendar Block`
- `Copy CLI`
- `Copy Agent Prompt`

Mocking rule: the UI must make mocked state honest. Controls may say
`mocked`, `draft`, `local only`, or `pending daemon writer`, but the product
shape should still be visible.

## CLI Parity

See:

`docs/cli/see-agent-work.md`

`docs/agents/see-agent-work-agent-usage.md`

Every control should eventually have one CLI equivalent. Early CLI commands
are allowed to be documentation-only.

## Relationship to git-ema

See Agent Work does not own source material. It links to artifacts and
codebases through git-ema attachment/source records.

Examples:

- a lane links to a codebase attachment;
- a mission links to a research doc;
- a checkup links to a generated report;
- an agent prompt links to a context bundle.

## Relationship to Blueprint

See Agent Work should let Blueprint sections become work:

```text
Blueprint section -> proposal -> mission/lane -> checkup/execution
```

This does not have to be functional in wave 1. It should be visible in the
information architecture and command language.

## Relationship to Hermes

Hermes/runtime owns live execution. See Agent Work can show dispatches and
executions, but it does not run tools directly.

Start/stop controls should eventually produce daemon commands that create
dispatch/scope events. Until then, they are mocked control affordances for
external agent orchestration.

## First Acceptance Criteria

The first See Agent Work slice is good enough when:

- it renders a realistic swarm control room;
- it includes missions, campaigns, lanes, handoffs, agents, and vCalendar;
- it shows mocked start/pause/stop controls;
- it shows CLI equivalents;
- it shows copyable agent prompts;
- it links source material through git-ema language;
- it does not pretend mocked execution is real;
- a human can use it as a command board for Codex or Claude CLI work today.

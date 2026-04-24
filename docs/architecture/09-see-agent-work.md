# 09 - See Agent Work

See Agent Work is the swarm and vCalendar control surface for EMA.

It is intentionally allowed to be visually and conceptually ambitious before
the full execution layer exists. Its first job is to make work visible,
steerable, and command-shaped.

## Role

See Agent Work is a vApp over shared workspace and coordination state.

It renders:

- swarms;
- campaigns;
- missions;
- lanes;
- handoffs;
- queues;
- vCalendar;
- weekly phases;
- checkups;
- agents and actor roles;
- mocked start/pause/stop controls;
- CLI equivalents;
- agent prompt blocks.

It does not own canonical truth directly.

## Ownership

Canonical ownership should land in daemon bounded contexts:

- `ema_swarm_coordination` for lanes, handoffs, queues, missions, campaigns,
  checkups, calendar blocks, weekly phases, and swarm state.
- `ema_identity` for users, actors, agents, personal AI, devices, and role
  bindings.
- `ema_attachments` / git-ema for source material, artifacts, codebases, and
  attachment links.
- `ema_exec_control` / Hermes seam for dispatches, executions, tool events,
  scope grants, and runtime status.

See Agent Work reads projections and sends commands.

## First Projection

The first projection can be mocked:

```text
see_agent_work.project_pulse
```

Suggested shape:

```text
{
  org_id,
  space_id,
  project_id,
  swarms: [...],
  campaigns: [...],
  missions: [...],
  lanes: [...],
  handoffs: [...],
  vcalendar: {
    weekly_phase,
    blocks,
    checkups_due
  },
  actors: [...],
  recent_events: [...],
  cli_suggestions: [...]
}
```

The projection may be hard-coded in wave 1 as long as the UI makes mocked state
honest.

## Command Shape

The first commands can be documentation-only or stubbed:

- `swarm.start`
- `swarm.pause`
- `swarm.stop`
- `mission.create`
- `campaign.create`
- `lane.open`
- `lane.claim`
- `handoff.request`
- `vcalendar.block.add`
- `checkup.schedule`
- `agent.prompt.generate`

When real command writers exist, each command should append daemon events and
let projections update naturally.

## Relationship to CLI

The CLI equivalent is part of the product contract.

See:

`docs/cli/see-agent-work.md`

`docs/agents/see-agent-work-agent-usage.md`

The UI should be able to show "what command would this action run?" even before
the command is executable. This lets external Codex and Claude CLI sessions use
the same object language.

## Relationship to Blueprint

Blueprint sections can eventually seed proposals, missions, or lanes.

Wave 1 can show this path as a visible affordance:

```text
Blueprint section -> proposal draft -> mission/lane
```

The affordance can be disabled or mocked until the proposal writer exists.

## Relationship to git-ema

See Agent Work links to source material through git-ema ids.

Examples:

- lane source refs;
- mission artifacts;
- campaign research packs;
- checkup reports;
- agent context bundles;
- codebase attachments.

See Agent Work must not create its own attachment store.

## Relationship to Hermes

Start, pause, and stop controls are not direct tool execution.

Long term, they should create daemon commands that lead to dispatch and
execution events. In wave 1, they are mocked control affordances that help
humans control external agents while preserving EMA language.

## UI Standard

The app should feel like an operational control room:

- dense but readable;
- calm but alive;
- organized around real objects;
- direct about mocked state;
- built for repeated use;
- useful for humans coordinating agents today.

Avoid a marketing-style page. The first screen should be the app.

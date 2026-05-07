# See Agent Work CLI Equivalent

For the broader agent-facing project-management and executive-function CLI
contract, read `docs/cli/agent-workspace.md` first. This file remains the
See Agent Work vApp-specific grammar.

> **Current state:** an `ema` CLI exists in the active build. This document is
> now the See Agent Work grammar reference for vApp-facing commands; use
> `ema <group> --help` for the current implemented flags and status.

This document defines the CLI language for the See Agent Work vApp.

The commands here are product-contract commands. Some are live daemon-backed
workspace operations, some are file-backed Harness Glue rails, and `swarm`
remains a projection seed until the See Agent Work projection is promoted.
External Codex and Claude sessions should use this language when operating
against EMA work.

For agent behavior, lane discipline, handoffs, mocked-control rules, and
reporting format, see:

`docs/agents/see-agent-work-agent-usage.md`

## Scope Flags

Every command should resolve into the active EMA scope:

```text
--org "Founding-Fathers-EMA"
--space "Founding-Fathers-EMA"
--project "EMA 0.0.5"
```

Short examples may omit these flags when the active scope is obvious.

## Swarm Commands

```text
ema swarm list --project "EMA 0.0.5"
ema swarm show --swarm "buildout"
ema swarm start --swarm "buildout"
ema swarm pause --swarm "buildout"
ema swarm stop --swarm "buildout"
ema swarm status --swarm "buildout"
ema swarm report --swarm "buildout"
```

Early behavior:

- `start`, `pause`, and `stop` may be mocked.
- `status` may read mock projections.
- `report` may generate a markdown summary.

## Campaign Commands

```text
ema campaign create --title "EMA 0.0.5 Buildout" --project "EMA 0.0.5"
ema campaign list --project "EMA 0.0.5"
ema campaign show --campaign campaign:<id>
ema campaign archive --campaign campaign:<id>
```

Campaigns are long-running initiatives made of missions.

## Mission Commands

```text
ema mission create --campaign campaign:<id> --title "Build vanilla workspace"
ema mission list --project "EMA 0.0.5"
ema mission show --mission mission:<id>
ema mission start --mission mission:<id>
ema mission pause --mission mission:<id>
ema mission complete --mission mission:<id>
```

Missions are goal-oriented bundles of lanes, checkups, proposals, artifacts,
and execution references.

## Lane Commands

```text
ema lane open --mission mission:<id> --title "Topbar projection"
ema lane list --mission mission:<id>
ema lane show --lane lane:<id>
ema lane claim --lane lane:<id> --actor actor:<id>
ema lane release --lane lane:<id> --actor actor:<id>
ema lane block --lane lane:<id> --reason "Waiting on event shape"
ema lane move --lane lane:<id> --status review
ema lane close --lane lane:<id> --reason "Verified"
```

Lanes are the first implementation-grade coordination unit. One lane should
have one active claimant unless policy explicitly allows pairing.

## Handoff Commands

```text
ema handoff request --from lane:<id> --to actor:<id> --needed "Review event catalog"
ema handoff accept --handoff handoff:<id>
ema handoff reject --handoff handoff:<id> --reason "Wrong lane"
ema handoff complete --handoff handoff:<id>
ema handoff list --project "EMA 0.0.5"
```

Handoffs are explicit transfer contracts, not chat paragraphs.

## vCalendar Commands

> **Implemented 2026-04-24.** The write path is real: each command appends a
> canonical event through the daemon bus (`calendar_block.added`,
> `calendar_block.moved`, `vcalendar.phase_set`, `checkup.scheduled`,
> `checkup.completed`). Reads use the `event_trail` last-8 projection with
> client-side filtering until a dedicated vcalendar projection actor lands.

```text
ema vcalendar show --actor actor:<id>
ema vcalendar week --project "EMA 0.0.5"
ema vcalendar block add --actor actor:<id> --kind focus --label "Blueprint section work"
ema vcalendar block move --block calendar_block:<id> --start "2026-04-24T15:00:00-04:00"
ema vcalendar phase set --actor actor:<id> --label "Implementation Week"
ema checkup schedule --lane lane:<id> --cadence daily
ema checkup complete --checkup checkup:<id> --result "Ready for review"
```

Defaults when flags are omitted: `--org` falls back to
`org:01J00000000000000000000001` (the first-boot Founding-Fathers-EMA seed);
`--actor` falls back to `actor:dev-console`. Pass `--json` for a structured
response. Creates (`block add`, `checkup schedule`) return the generated
resource id on the `resource` field so the next `move` / `complete` call can
use it directly.

The vCalendar supports real time and self-paced agent time. Agent weeks and
weekly phases are product concepts even before scheduling automation is real.

For live event tailing of calendar state:

```text
ema events tail --family calendar_block
ema events tail --family checkup
ema events tail --family vcalendar
```

## Agent Work Commands

```text
ema actor list --project "EMA 0.0.5"
ema agent list --project "EMA 0.0.5"
ema agent show --actor actor:<id>
ema agent assign --actor actor:<id> --lane lane:<id>
ema agent prompt --actor actor:<id> --mission mission:<id> --lane lane:<id>
ema agent prompt --lane lane:<id> --mode handoff --provider simulated
ema agent prompt --lane lane:<id> --mode delegate --provider codex
ema agent report --actor actor:<id> --lane lane:<id>
```

`ema agent prompt` generates a copyable prompt for external Codex, Claude CLI,
or another agent runner. The JSON form also returns a Harness Glue command:
`ema harness dispatch` for the simulated backend, or `ema harness start` for
tmux-backed `codex` / `claude-code` workers. It also emits handoff, context,
and report commands tied to the resolved lane.

## Source and Artifact Commands

Source material is routed through git-ema:

```text
ema source attach --object lane:<id> --attachment attachment:<id>
ema source attach --object mission:<id> --attachment attachment:<id>
ema source attach --object blueprint_sec:<id> --attachment attachment:<id>
ema source list --object lane:<id>
ema codebase link --project "EMA 0.0.5" --repo "/path/to/repo"
ema artifact create --project "EMA 0.0.5" --name "Build plan"
```

The canonical source identity belongs to git-ema records. See Agent Work only
references those ids.

## Proposal Commands

```text
ema proposal draft --from blueprint_sec:<id> --title "Build See Agent Work"
ema proposal submit --proposal proposal:<id>
ema proposal accept --proposal proposal:<id>
ema proposal reject --proposal proposal:<id> --reason "Not yet"
ema proposal queue --project "EMA 0.0.5"
```

Plan/spec commands should wait until the proposal path is real enough to need
them.

## Agent Prompt Template

When See Agent Work generates an external-agent prompt, it includes:

```text
You are working inside EMA via a delegated Harness Glue execution or handoff.

Scope:
- Organization: <resolved org id>
- Space: <resolved space id>
- Project: <resolved project name/id>
- Active build: <resolved active build>

Actor Contract:
- From: <requesting actor>
- To: <target actor>
- Mode: delegate | handoff | continue
- Provider: simulated | codex | claude-code

Mission:
<mission title and purpose>

Lane:
<lane id, title, status, owner, expected output>

Queue Context:
<ready and blocked queue items for the lane>

Rules:
- Run `ema tl about --json` and `ema vcalendar tick --json` first.
- Keep work lane-scoped and claim/refresh ownership before edits.
- Log later work with `ema queue add`.
- Report changed, verified, risks, and next with `ema agent report`.
- Use handoff language if blocked or transferring ownership.
```

## First CLI Acceptance Criteria

The CLI equivalent is ready when:

- every See Agent Work control has a command-shaped equivalent;
- command names match EMA object language;
- commands include org/space/project scope;
- source references route through git-ema;
- start/stop commands are clearly allowed to be mocked;
- external agents can use the prompt template without extra explanation.

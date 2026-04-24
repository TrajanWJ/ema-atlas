# See Agent Work CLI Equivalent

> **Wave 1: documentation-only.** No `ema` binary ships in wave 1. This doc
> locks the command grammar so external Codex / Claude sessions can narrate
> their work in EMA's language, and so the wave-N CLI has a pre-agreed
> surface to implement. Do not build a CLI in wave 1 — the daemon, IPC, and
> Blueprint/git-ema surfaces come first.

This document defines the CLI language for the See Agent Work vApp.

The commands here are product-contract commands — documentation-only in
wave 1, implemented later. External Codex and Claude sessions should use
this language when operating against EMA work.

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

```text
ema vcalendar show --actor actor:<id>
ema vcalendar week --project "EMA 0.0.5"
ema vcalendar block add --actor actor:<id> --kind focus --label "Blueprint section work"
ema vcalendar block move --block calendar_block:<id> --start "2026-04-24T15:00:00-04:00"
ema vcalendar phase set --actor actor:<id> --label "Implementation Week"
ema checkup schedule --lane lane:<id> --cadence daily
ema checkup complete --checkup checkup:<id> --result "Ready for review"
```

The vCalendar supports real time and self-paced agent time. Agent weeks and
weekly phases are product concepts even before scheduling automation is real.

## Agent Work Commands

```text
ema actor list --project "EMA 0.0.5"
ema agent list --project "EMA 0.0.5"
ema agent show --actor actor:<id>
ema agent assign --actor actor:<id> --lane lane:<id>
ema agent prompt --actor actor:<id> --mission mission:<id>
ema agent report --actor actor:<id> --lane lane:<id>
```

`ema agent prompt` should generate a copyable prompt for external Codex,
Claude CLI, or another agent runner.

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

When See Agent Work generates an external-agent prompt, it should include:

```text
You are working inside EMA 0.0.5.

Scope:
- Organization: Founding-Fathers-EMA
- Space: Founding-Fathers-EMA
- Project: EMA 0.0.5

Mission:
<mission title and purpose>

Lane:
<lane id, title, status, owner, expected output>

Sources:
<git-ema attachment/source refs>

Rules:
- Keep work lane-scoped.
- Do not mutate canon outside the assigned lane.
- Report files touched.
- Preserve open questions.
- Use handoff language if blocked.
```

## First CLI Acceptance Criteria

The CLI equivalent is ready when:

- every See Agent Work control has a command-shaped equivalent;
- command names match EMA object language;
- commands include org/space/project scope;
- source references route through git-ema;
- start/stop commands are clearly allowed to be mocked;
- external agents can use the prompt template without extra explanation.

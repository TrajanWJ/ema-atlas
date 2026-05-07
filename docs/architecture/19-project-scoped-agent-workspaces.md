# 19 - Project-scoped agent workspaces

Status: proposed
Date: 2026-04-29

## Problem

The CLI currently resolves agent workspace state as one global EMA daemon workspace plus a hard-coded file fallback at `Projects/EMA/subprojects/agent-workspace-vapp`.

That is not the intended Desktop model. Durable project state lives under `Desktop/Projects/<project>/`, while active coding happens under `Desktop/Active builds/<build>/`. Agent workspace records must follow the project being operated on.

The symptom is visible in `ema tl about --json` from `Active builds/EMA-0.0.5`: the active build is EMA, but `project_record` reports `Projects/EMA/subprojects/agent-workspace-vapp`. All lane, queue, vCalendar, checkup, and report state is therefore read as one shared workspace instead of a project/space-scoped workspace instance.

Current operator scope as of 2026-04-29:

- org: `Trajan's Organization` (`org:01J00000000000000000000012`)
- space: `Personal Workspace` (`space:01J00000000000000000000013`)
- project: `locked-in-ios-app` (`project:01KQD9RMA000Y2Z58RCSNCJNT0`)

Important model correction: a space can contain multiple projects.
`locked-in-ios-app` is a project inside the existing `Personal Workspace`
space. It is not a daemon space. The mistaken `lockedinIOSapp` space/project
created during bootstrap should be cleaned up only through daemon archive/move
writers once those exist.

## Decision

Add a project/space scope resolver shared by every CLI command that reads or writes agent workspace state.

The resolver chooses the workspace scope in this order:

1. Explicit CLI override flags:
   - `--project <project-id-or-name-or-path>`
   - `--space <space-id-or-name-or-path>`
   - optionally `--org <org-id-or-name>` when needed for disambiguation
2. Environment override for automation:
   - `EMA_PROJECT=<project-id-or-name-or-path>`
   - `EMA_SPACE=<space-id-or-name-or-path>`
3. Current working directory inference:
   - if cwd is inside `Desktop/Projects/<name>/...`, use that project record
   - if cwd is inside `Desktop/Projects/<name>/builds/<version>/...`, use that parent project record and build version
   - if cwd is inside `Desktop/Active builds/<build-name>/...`, map to the matching project by reading project records/build records, not by hard-coding EMA
   - if cwd is inside a symlink such as `Projects/EMA/code`, resolve the real path and still return `Projects/EMA`
4. User default/current daemon scope:
   - current org/space/project from daemon user context, if no cwd match exists
5. Safe fallback:
   - no implicit `Projects/EMA/subprojects/agent-workspace-vapp` fallback for ordinary EMA project commands
   - if no scope is resolved, fail loudly with a remediation message and `--project` examples

## Workspace instance shape

A resolved scope should be returned as a first-class object and included in JSON output:

```json
{
  "workspace_scope": {
    "org_id": "org:...",
    "space_id": "space:...",
    "project_id": "project:...",
    "project_name": "EMA",
    "project_record": "/Users/trajanm4air/Desktop/Projects/EMA",
    "active_build": "/Users/trajanm4air/Desktop/Active builds/EMA-0.0.5",
    "build_record": "/Users/trajanm4air/Desktop/Projects/EMA/builds/0.0.5",
    "resolution_source": "cwd-active-build",
    "cwd": "/Users/trajanm4air/Desktop/Active builds/EMA-0.0.5"
  }
}
```

Project-scoped agent workspace state then lives inside the project record, alongside the existing Desktop schema:

```text
Projects/<project>/
  project.md
  atlas/
  builds/
  lanes/
  queue/
  handoffs/
  executions/
  responsibilities/
  weekly/
  checkups/
  agent-workspace/
    reports/
    vcalendar/
    registry.json
```

The exact file layout can be reducer/projection-owned, but the identity and namespace must be project-scoped.

## Daemon event scoping

All canonical workspace events must carry the resolved scope:

- `org_id`
- `space_id`
- `project_id`
- optional `build_id` or `build_version` when a command is about a specific active build

Projection reducers for these surfaces must filter by scope:

- `lane.registry`
- `queue.registry`
- `vcalendar.state`
- `checkup.registry`
- `agent.reports`
- `handoff.registry`
- `problem.graph`

CLI commands should subscribe/read with a scope filter instead of accepting the daemon's global aggregate as the default answer.

## CLI contract

Every workspace-facing noun should accept the same scoping flags:

```text
ema tl about --project EMA --space Founding-Fathers-EMA --json
ema agent orient --project EMA --json
ema queue list --project EMA --status ready --json
ema lane open --project EMA --title "Project-scoped workspace resolver" --json
ema vcalendar tick --project EMA --json
ema checkup due --project EMA --json
```

If no flags are provided, the command uses cwd inference.

Examples:

```text
cd ~/Desktop/Active\ builds/EMA-0.0.5
ema tl about --json
# resolves to Projects/EMA, build 0.0.5

cd ~/Desktop/Projects/duct-tape-onion-harness
ema queue list --json
# resolves to Projects/duct-tape-onion-harness because cwd is the donor project

ema queue list --project EMA --json
# resolves to EMA regardless of cwd
```

## Relationship to agent-workspace-vapp

`Projects/EMA/subprojects/agent-workspace-vapp` is a project record for the vApp product/contract itself. It is not the default workspace instance for every project.

The agent-workspace-vApp may render and operate on many project workspace instances. It should be treated as a tool/surface project, not as the owner of all EMA lane and queue state.

## Implementation slices

1. CLI resolver library
   - Add `workspace-scope.ts` in `apps/cli/src/`.
   - Resolve `--project`, `--space`, env, cwd, and project/build records.
   - Include `workspace_scope` in `tl about`, `agent orient`, and `hermes orient` output.

2. Shared command plumbing
   - Add helpers in `workspace-daemon.ts` to attach scope to every workspace command/read.
   - Standardize `--project` and `--space` flags across lane, queue, vCalendar, checkup, agent, handoff, mission, campaign, problem, and report commands.

3. Daemon projection filtering
   - Filter registry projections by event envelope `project_id`/`space_id`.
   - Include `workspace_scope` metadata in projection payloads.
   - Preserve an explicit aggregate/all-project mode only behind `--all-projects`.

4. Migration/partition pass
   - Assign existing global EMA workspace events to `Projects/EMA` where they clearly reference EMA.
   - Keep ambiguous legacy records visible as `scope: legacy-unscoped` until reviewed.
   - Do not silently move records from `agent-workspace-vapp` into EMA unless their source and scope are clear.

5. Verification
   - From `Active builds/EMA-0.0.5`, `tl about` reports `Projects/EMA` and build `0.0.5`.
   - From `Projects/EMA`, `queue list` returns the same EMA-scoped queue.
   - From another `Projects/<name>`, `queue list` returns that project's queue or an honest empty scoped queue.
   - `--project EMA` returns EMA from any cwd.
   - `--all-projects` is required to see the aggregate registry.

## Acceptance criteria

- No ordinary CLI workspace command defaults to `Projects/EMA/subprojects/agent-workspace-vapp` unless cwd or `--project` actually selects that project.
- The CLI can explicitly choose any project/space for a command.
- Location-based inference works for both `Projects/<name>` and `Active builds/<build-name>`.
- JSON outputs expose how scope was resolved.
- Lane, queue, vCalendar, checkup, report, and handoff views are project-scoped by default.
- Legacy unscoped state is not lost; it is surfaced as legacy/unscoped until migrated.

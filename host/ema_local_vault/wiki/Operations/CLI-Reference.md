---
title: "CLI Reference"
space: wiki
tags: ["ops","cli","reference"]
source: manual
---

# CLI Reference

Full command reference for `ema` CLI v3.0.0 — 79 command groups. Source: `daemon/lib/ema/cli/`.

Global flags: `--json` / `-j` (JSON output), `--host URL` / `-H` (daemon URL, default localhost:4488).

Transport: CLI auto-resolves between Direct (in-process, when running as escript inside daemon) and HTTP (REST calls to daemon). Both produce identical output.

---

## Core Commands

### `ema status`

System health overview: daemon status, focus state, active agents, queued proposals, task counts.

### `ema watch`

Live PubSub event stream. Subscribes to Phoenix channels and prints events in real time. Requires Direct transport (runs inside daemon process).

| Option | Purpose |
|--------|---------|
| `--channel CHAN` | Filter: all, babysitter, campaigns, channels, executions, focus, goals, pipes, proposals, tasks, vault |
| `--format FMT` | pretty (default) or compact |

### `ema dump "thought"`

Quick brain dump capture. Shortest path to get something into EMA.

| Option | Purpose |
|--------|---------|
| `-p` / `--project` | Associate with project |
| `-s` / `--space` | Space ID |
| `-a` / `--actor` | Actor ID |
| `-t` / `--task` | Associate with task |

### `ema dashboard`

Dashboard summary view.

### `ema mcp-serve`

Start EMA MCP server over stdio (used by Claude Code).

---

## Task Management — `ema task`

| Subcommand | Args | Purpose |
|------------|------|---------|
| `list` | | List tasks. Filters: `--status`, `--project`, `--space`, `--actor`, `--limit` |
| `show` | `<id>` | Show task detail with tags and actor data |
| `create` | `"title"` | Create task. Options: `--project`, `--actor`, `--space`, `--priority`, `--description` |
| `update` | `<id>` | Update task. Options: `--title`, `--status`, `--priority`, `--description` |
| `transition` | `<id> <status>` | Transition task to new status directly |
| `delete` | `<id>` | Delete task |

---

## Project Management — `ema project`

| Subcommand | Args | Purpose |
|------------|------|---------|
| `list` | | List projects. Filters: `--status`, `--space` |
| `show` | `<slug>` | Show project detail by slug |
| `create` | `"name"` | Create project. Options: `--slug`, `--path`, `--repo`, `--description`, `--space` |
| `context` | `<slug>` | Full context bundle (tasks, proposals, executions, vault notes) |
| `dependencies` | `<slug>` | List project tasks |

---

## Goal Tracking — `ema goal`

| Subcommand | Args | Purpose |
|------------|------|---------|
| `list` | | List goals. Filters: `--status`, `--timeframe`, `--project`, `--space`, `--actor` |
| `show` | `<id>` | Show goal with child goals |
| `create` | `"title"` | Create goal. Options: `--description`, `--status`, `--timeframe`, `--parent`, `--project`, `--space`, `--actor` |
| `update` | `<id>` | Update goal. Options: `--title`, `--status`, `--description`, `--timeframe` |
| `delete` | `<id>` | Delete goal |

---

## Intent Engine — `ema intent`

Semantic hierarchy: L0=vision, L1=mission, L2=goal, L3=objective, L4=task, L5=step.

| Subcommand | Args | Purpose |
|------------|------|---------|
| `list` | | List intents. Filters: `--project`, `--level`, `--status`, `--kind`, `--limit` |
| `show` | `<id>` | Show intent detail |
| `create` | `"title"` | Create intent. Options: `--level` (0-5, default 4), `--kind` (default "task"), `--project`, `--description` |
| `tree` | | Full hierarchy tree. Filter: `--project` |
| `export` | | Markdown export of tree. Filter: `--project` |
| `status` | | Status summary. Filter: `--project` |
| `context` | `<id>` | Full context: links, lineage events, parent chain |
| `link` | `<id>` | Link intent. Options: `--depends-on <id>`, `--role` |
| `phase` | `<id> <phase>` | Transition intent phase |
| `reparent` | `<id>` | Move intent under new parent. Option: `--parent <id>` |
| `attach-actor` | `<id>` | Attach actor. Options: `--actor-type`, `--actor-id` |
| `attach-execution` | `<id>` | Link execution. Option: `--execution <id>` |
| `attach-session` | `<id>` | Link session. Option: `--session <id>` |
| `runtime` | `<id>` | Runtime state: linked executions, sessions, actors |

---

## Executions — `ema exec`

| Subcommand | Args | Purpose |
|------------|------|---------|
| `list` | | List executions. Filters: `--status`, `--project`, `--space`, `--actor`, `--limit` |
| `show` | `<id>` | Show execution detail |
| `create` | `"objective"` | Create execution. Options: `--title`, `--mode`, `--project`, `--space`, `--actor` |
| `approve` | `<id>` | Approve execution |
| `cancel` | `<id>` | Cancel execution |
| `events` | `<id>` | List execution events |

---

## Proposals — `ema proposal`

| Subcommand | Args | Purpose |
|------------|------|---------|
| `list` | | List proposals. Filters: `--status`, `--project`, `--space`, `--actor`, `--limit` |
| `show` | `<id>` | Show proposal detail |
| `approve` | `<id>` | Approve proposal (creates execution) |
| `kill` | `<id>` | Kill proposal (records to KillMemory) |
| `redirect` | `<id>` | Redirect (creates 3 seed angles). Option: `--note` |
| `lineage` | `<id>` | Show proposal lineage tree |

---

## Seeds — `ema seed`

| Subcommand | Args | Purpose |
|------------|------|---------|
| `list` | | List seeds. Filters: `--project`, `--active`, `--type` |
| `show` | `<id>` | Show seed detail |
| `create` | `"title"` | Create seed. Options: `--prompt`, `--type`, `--project` |
| `toggle` | `<id>` | Toggle active/paused |
| `run-now` | `<id>` | Trigger seed immediately |

---

## Proposal Engine — `ema engine`

| Subcommand | Purpose |
|------------|---------|
| `status` | Show pipeline stage health (Scheduler, Generator, Refiner, Debater, Tagger) |
| `pause` | Pause scheduler |
| `resume` | Resume scheduler |

---

## Brain Dump — `ema brain-dump`

| Subcommand | Args | Purpose |
|------------|------|---------|
| `list` | | List items. Filters: `--project`, `--space`, `--actor` |
| `unprocessed` | | List unprocessed items |
| `create` | `"content"` | Create item. Filters: `--project`, `--space`, `--actor` |
| `process` | `<id>` | Mark processed. Option: `--action` (default "archive") |
| `delete` | `<id>` | Delete item |

---

## Vault — `ema vault`

| Subcommand | Args | Purpose |
|------------|------|---------|
| `search` | `"query"` | Search vault notes. Option: `--limit` |
| `tree` | | Show directory tree |
| `read` | `<path>` | Read note by path (relative to vault root) |
| `write` | `<path>` | Create/update note. Options: `--content`, `--stdin` |
| `graph` | | Show link graph stats (node/edge counts) |
| `backlinks` | `<id>` | Show backlinks for a note |
| `imports` | | List imported content with provenance |
| `stale` | | Show intent projection files with ages |

---

## Focus Timer — `ema focus`

| Subcommand | Purpose |
|------------|---------|
| `start` | Start session. Options: `--duration` (minutes, default 25), `--task` |
| `stop` | Stop current session |
| `pause` | Pause session |
| `resume` | Resume paused session |
| `current` | Show active session state |
| `today` | Today's focus stats |
| `weekly` | This week's focus stats |

---

## Habits — `ema habit`

| Subcommand | Args | Purpose |
|------------|------|---------|
| `list` | | List active habits |
| `create` | `"name"` | Create habit. Option: `--cadence` (default "daily") |
| `toggle` | `<id>` | Toggle today's log. Option: `--date` |
| `today` | | Today's habit checklist |
| `archive` | `<id>` | Archive habit |

---

## Journal — `ema journal`

| Subcommand | Args | Purpose |
|------------|------|---------|
| `read` | | Read entry. Option: `--date` (default today) |
| `write` | `"content"` | Write entry. Options: `--date`, `--mood`, `--energy`, `--one-thing` |
| `search` | `"query"` | Full-text search |
| `list` | | List recent entries (last 30) |

---

## Agents — `ema agent`

| Subcommand | Args | Purpose |
|------------|------|---------|
| `list` | | List all agents |
| `show` | `<slug>` | Show agent detail |
| `chat` | `<slug> "message"` | Chat with agent. Option: `--context` |
| `conversations` | `<slug>` | List agent conversations |

---

## Sessions — `ema session`

| Subcommand | Args | Purpose |
|------------|------|---------|
| `list` | | List sessions. Filters: `--project`, `--status`, `--limit` |
| `active` | | Active sessions |
| `show` | `<id>` | Session detail |
| `resume` | `<id>` | Resume session. Option: `--prompt` |
| `kill` | `<id>` | Kill session |
| `spawn` | `"prompt"` | Spawn new session. Options: `--project`, `--task`, `--model` |
| `follow` | `<id>` | Check session status/output |
| `context` | | Orchestrator context. Option: `--project` |
| `all` | | All orchestrator sessions |

---

## Campaigns — `ema campaign`

| Subcommand | Args | Purpose |
|------------|------|---------|
| `list` | | List campaigns. Filter: `--project` |
| `show` | `<id>` | Campaign detail |
| `create` | `"name"` | Create campaign. Options: `--description`, `--project` |
| `run` | `<id>` | Start a run. Option: `--name` |
| `runs` | `<id>` | List campaign runs |
| `advance` | `<id>` | Advance campaign status |

---

## Channels — `ema channel`

| Subcommand | Args | Purpose |
|------------|------|---------|
| `list` | | List channel servers |
| `health` | | Channel health check |
| `inbox` | | Recent messages across channels |
| `send` | `<channel> "message"` | Send message to channel |

---

## Responsibilities — `ema resp`

| Subcommand | Args | Purpose |
|------------|------|---------|
| `list` | | List active responsibilities. Filters: `--project`, `--role` |
| `show` | `<id>` | Detail view |
| `create` | `"title"` | Create. Options: `--role`, `--cadence`, `--description`, `--project` |
| `check-in` | `<id>` | Record check-in. Options: `--notes`, `--status` |
| `at-risk` | | List at-risk responsibilities |

---

## Pipes — `ema pipe`

| Subcommand | Args | Purpose |
|------------|------|---------|
| `list` | | List pipes. Filter: `--project` |
| `show` | `<id>` | Pipe detail |
| `create` | `"name"` | Create pipe. Options: `--trigger`, `--description` |
| `toggle` | `<id>` | Enable/disable |
| `fork` | `<id>` | Clone pipe |
| `catalog` | | Available triggers/actions |
| `history` | | Run history. Option: `--limit` |

---

## Superman — `ema superman`

| Subcommand | Args | Purpose |
|------------|------|---------|
| `health` | | Superman API health |
| `status` | | Superman status |
| `context` | `<slug>` | Project context from Superman |
| `ask` | `"question"` | Ask about codebase. Option: `--project` |
| `gaps` | | Detected code gaps. Option: `--project` |
| `index` | | Trigger re-index. Option: `--project` |

---

## Additional Commands

These commands have CLI modules but are less commonly used:

| Command | Purpose |
|---------|---------|
| `ema babysitter` | Session babysitter management |
| `ema metamind` | Meta-cognitive operations |
| `ema ralph` | Ralph assistant |
| `ema vectors` | Vector index operations |
| `ema quality` | Quality gate management |
| `ema dispatch-board` | Dispatch board view |
| `ema tokens` | Token usage tracking |
| `ema config` | EMA configuration |
| `ema em` | Quick shorthand commands |
| `ema tag` | Tag management |
| `ema data` | Data import/export |
| `ema canvas` | Canvas workspace |
| `ema note` | Simple notes |
| `ema voice` | Voice input |
| `ema org` | Organization management |
| `ema actor` | Actor management (see below) |
| `ema space` | Space management (see below) |
| `ema gap` | Gap analysis |
| `ema integration` | Integration management |
| `ema reflexion` | Reflexion/review system |
| `ema ai-session` | AI session management |
| `ema routing` | Route management |
| `ema git-sync` | Git sync operations |
| `ema tunnel` | Tunnel management |
| `ema file-vault` | File vault operations |
| `ema messages` | Message operations |
| `ema team-pulse` | Team pulse checks |
| `ema metrics` | Metrics reporting |
| `ema feedback` | Feedback collection |
| `ema evolution` | Evolution tracking |

---

## Actor Management — `ema actor`

| Subcommand | Args | Purpose |
|------------|------|---------|
| `list` | | List actors. Filters: `--space`, `--phase` |
| `show` | `<id>` | Show actor detail |
| `create` | `"name"` | Create actor. Options: `--space`, `--type` |
| `transition` | `<id> <phase>` | Change actor phase |
| `data` | `<id>` | Show entity data for actor |
| `commands` | `<id>` | List available commands for actor |
| `phases` | `<id>` | List valid phases for actor |
| `register` | `<id>` | Register actor in a space |

---

## Space Management — `ema space`

| Subcommand | Args | Purpose |
|------------|------|---------|
| `list` | | List spaces |
| `show` | `<id>` | Show space detail |
| `create` | `"name"` | Create space |

---

## Actor Dispatch System

Commands can be dispatched to specific actors and spaces using global options:

| Option | Short | Purpose |
|--------|-------|---------|
| `--actor ID` | `-a` | Target actor |
| `--space ID` | `-s` | Target space |
| `--project ID` | `-p` | Target project |
| `--task ID` | `-t` | Target task |

This enables multi-actor workflows where the same CLI command can operate on behalf of different actors in different spaces.

## Related

- [[Quick Reference]]
- [[MCP-Tools-Reference]]
- [[EMA Architecture Overview]]

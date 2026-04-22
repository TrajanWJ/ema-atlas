# codex-a10 — v1 build order

- actor_id: codex-a10
- harness: Codex
- role: define the first sharply-scoped implementation slice after the meta-build swarm
- status: complete
- created_at: 2026-04-21T05:11Z
- updated_at: 2026-04-21T05:11Z
- inputs:
  - `workspace/shared/README.md`
  - `workspace/shared/WORKSPACE_CONTRACT.md`
  - `docs/AGENT_SHARED_WORKSPACE_ARCHITECTURE.md`
  - `workspace/shared/swarm/SWARM_META_BUILD_2026-04-21.md`
  - `workspace/shared/actors/claude-a1.md`
  - `workspace/shared/actors/claude-a2.md`
  - `workspace/shared/actors/claude-a3.md`
  - `workspace/shared/actors/hermes-a4.md`
  - `workspace/shared/actors/hermes-a5.md`
  - `workspace/shared/actors/codex-a6.md`
  - `workspace/shared/actors/codex-a7.md`

## Recommendation in one line

The first real post-swarm implementation slice should be:

> **a workspace-aware agent loop**: harden the shared workspace contract, add a BEAM read-model/indexer over `workspace/shared/`, and expose a small Python CLI surface for `workspace open`, `agenda`, `handoff inbox`, and `block` operations.

This is the smallest slice that creates immediate value across **BEAM + CLI + shared workspace** without prematurely requiring full canon v1, full distributed swarm coordination, or a new task database.

---

## Why this should land first

The repo already has:

- a running Elixir daemon with supervision, sessions, control-plane, and watcher/indexer patterns
- a real Python CLI path with `work`, `control`, `surfaces`, `context`, and `status`
- the new `workspace/shared/` architecture and swarm usage
- no real workspace index/runtime integration yet
- no workspace-oriented CLI entrypoint yet
- no stable file templates/conventions strong enough for reliable machine parsing yet

So the right first slice is not “build everything.”

It is:

1. make workspace files machine-readable
2. index them in BEAM
3. expose one actor-oriented CLI entrypoint over that index
4. prove the authority split:
   - workspace = collaboration overlay
   - runtime = live state
   - canon = later durable promotion

That slice unlocks the next slices cleanly:
- canon promotion
- task projections
- richer session breadcrumbs
- cadence workers
- swarm automation

---

## What not to build in this first slice

Do **not** try to land all of these at once:

- full canonical graph parser/indexer
- auto-promotion from workspace to canon
- full board/task engine
- full recurrence engine / RRULEs
- distributed swarm coordination
- GUI/TUI
- workspace write automation for every file type
- daemon-side mutation APIs for everything

That would spread effort across too many authority boundaries at once.

---

## The slice name

## Slice 1: Workspace-Aware Agent Loop

### Outcome
An agent can do this end-to-end:

```bash
ema workspace open --actor codex-a10
ema handoff inbox --actor codex-a10
ema agenda --actor codex-a10 --today
ema block create "Draft synthesis follow-up" --today 09:00-09:30 --actor codex-a10
```

And the daemon can:

- parse/index actor files
- parse/index handoff files
- parse/index schedule block files
- parse/index session breadcrumb files
- join workspace overlay with current runtime session state
- return a synthesized actor packet

That is enough to make the shared workspace operational rather than aspirational.

---

## Sharp build order

## 0. Lock the file contract before writing runtime code
**Why first:** the daemon and CLI cannot safely index or render files if file shapes are still drifting.

### Land in this step
Add only the minimum workspace hardening needed for machine readability:

- `workspace/shared/START_HERE.md`
- `workspace/shared/templates/actor.md`
- `workspace/shared/templates/handoff.md`
- `workspace/shared/templates/schedule-block.md`
- `workspace/shared/templates/session.md`
- `workspace/shared/conventions/STATUS_VOCAB.md`
- `workspace/shared/conventions/TIMESTAMP_RULES.md`
- folder `README.md` files for:
  - `actors/`
  - `handoffs/`
  - `schedules/`
  - `sessions/`

### Required machine-readable headers for v1
At minimum:

#### actor file
- `actor_id`
- `harness`
- `role`
- `status`
- `assignment`
- `updated_at`

#### handoff file
- `from`
- `to`
- `subject`
- `created_at`
- `status`

#### schedule block file
- `id`
- `actor`
- `title`
- `scheduled_window.start`
- `scheduled_window.end`
- `phase`
- `updated_at`

#### session breadcrumb file
- `actor`
- `provider`
- `session_id`
- `status`
- `updated_at`

### Stop condition
A new agent can create compliant actor/handoff/block/session files without guessing field names.

---

## 1. Add the BEAM workspace subtree as a read-only overlay index
**Why second:** this is the smallest BEAM feature that makes the workspace queryable without confusing it with canon or runtime truth.

### Land in daemon
Create a minimal workspace supervision subtree, reusing patterns already present in the daemon:

- `Ema.Workspace.Supervisor`
- `Ema.Workspace.IndexStore`
- `Ema.Workspace.Indexer`
- `Ema.Workspace.Synthesizer`

Optional in this slice if time is tight:
- file watcher process
- reconcile loop

If scope must stay very tight, start with:
- boot-time scan/index
- explicit manual refresh API
- no live file watching yet

### Initial indexed domains only
Index exactly these folders:

- `workspace/shared/actors/`
- `workspace/shared/handoffs/`
- `workspace/shared/schedules/`
- `workspace/shared/sessions/`

Do **not** index all workspace folders yet.

### Extracted fields
Store a normalized overlay record like:

```elixir
%{
  domain: :actor | :handoff | :schedule | :session,
  path: "...",
  owner: "...",
  status: "...",
  title: "...",
  updated_at: "...",
  refs: %{task_ref: nil, execution_ref: nil, project_ref: nil},
  source_authority: :workspace_overlay
}
```

### Important rule
This store must be explicitly rebuildable from disk.
It is an ETS/read-model layer, not a durable source of truth.

### Stop condition
The daemon can answer:
- active actor records
- handoffs addressed to actor X
- schedule blocks for actor X on day Y
- session breadcrumbs for actor X

---

## 2. Add one daemon synthesis endpoint for actor-oriented read access
**Why third:** raw indexes are useful for internals, but the CLI needs one stable packet.

### Add endpoint/API
Expose one read-model surface, for example:

- `GET /api/workspace/actors/:actor_id/packet`

Optional narrow endpoints after that:
- `GET /api/workspace/actors/:actor_id/handoffs`
- `GET /api/workspace/actors/:actor_id/agenda`
- `GET /api/workspace/actors/:actor_id/sessions`

### Packet contents
Merge:

#### from workspace index
- actor file
- handoffs addressed to actor
- schedule blocks for actor
- session breadcrumb files for actor

#### from runtime
- active EMA sessions from `Ema.Sessions.*`
- host/imported session facts when available

#### not yet from canon
Canon joins should be deferred unless they are trivially available.
Do not block this slice on canon v1 landing.

### Recommended output shape
- actor
- current_focus
- agenda.now
- agenda.next
- handoffs.inbox
- sessions.active
- sessions.resumable
- workspace_refs
- recommended_next_action

### Stop condition
The CLI can fetch one actor-scoped packet without scraping multiple endpoints or folders.

---

## 3. Add the minimal Python CLI surface on top of that packet
**Why fourth:** the repo already has a real Python CLI; this should piggyback on it rather than invent a new Elixir CLI first.

### Add commands
Implement these first:

```bash
ema workspace open --actor <actor-id>
ema handoff inbox --actor <actor-id>
ema agenda --actor <actor-id> [--today|--now]
ema block create <title> --start <ts> --end <ts> --actor <actor-id>
```

If needed, `ema block create` can write files directly to workspace in Python for v1.

### Why Python CLI first
Because today’s real operator surface is already:

- `cli/ema`
- `ema_cli.main`
- HTTP-backed command modules

That means the fastest path is:
- daemon provides workspace packet
- Python CLI renders it

Do not pause to redesign the CLI stack.

### Command behavior
#### `ema workspace open`
Calls the packet endpoint and renders:
- actor header
- current focus
- handoff inbox
- agenda now/next
- sessions
- next action

#### `ema handoff inbox`
Calls a narrower handoff endpoint or filters the packet.

#### `ema agenda`
Calls the packet and renders sorted schedule items:
1. active
2. in-window now
3. upcoming
4. optionally missed

#### `ema block create`
Writes a schedule-block markdown file into:
- `workspace/shared/schedules/`

Prefer path shape:
- `workspace/shared/schedules/YYYY-MM-DD--<slug>.md`

### Stop condition
A working agent can orient itself and create one near-term block entirely through supported CLI commands.

---

## 4. Add minimal runtime join with sessions, but no full workflow mutation layer
**Why fifth:** this makes the workspace packet materially better without opening the whole task/control-plane mutation surface.

### Integrate from runtime
Join the workspace packet with:

- active session bindings from `Ema.Sessions.Registry`
- active provider-backed sessions from `Ema.Surfaces.*`
- imported host sessions where available

### Do not add yet
- claiming tasks from workspace packet
- writing back into canon
- execution lifecycle mutation from workspace commands
- automatic session creation from `workspace open`

This slice should remain mostly read-oriented, with only one safe write path:
- creating schedule block files

### Stop condition
`ema workspace open --actor X` can tell the agent:
- whether a live session already exists
- whether a breadcrumb exists
- whether there is a resumable session candidate

---

## 5. Only after the above works: add watch/reconcile and validator commands
**Why last in slice:** useful, but not required to prove the first loop.

### Add if time remains
#### daemon
- folder watchers for the four indexed folders
- reconcile loop to rescan on missed events

#### CLI
- `ema workspace validate`
- `ema schedule validate [path]`

### Validation scope
Only validate:
- required fields exist
- timestamps parse
- `scheduled_window.end > start`
- status/phase values are from approved vocab

### Stop condition
Machine-readable files stay parseable over time and indexing errors are visible.

---

## Implementation order by repo area

## A. Shared workspace files first
Files/docs/templates:
1. `workspace/shared/START_HERE.md`
2. `workspace/shared/templates/*`
3. `workspace/shared/conventions/*`
4. per-folder `README.md`

This should be one small focused PR.

## B. Daemon read-model second
In `daemon/`:
1. `Ema.Workspace.Supervisor`
2. `Ema.Workspace.IndexStore`
3. `Ema.Workspace.Indexer`
4. packet endpoint/controller
5. add subtree to `Ema.Application`

This should be one bounded PR.

## C. Python CLI third
In `cli/ema_cli/commands/`:
1. `workspace.py`
2. `handoff.py` or subcommand under `workspace`
3. `agenda.py` or top-level agenda command
4. `block.py` or block subcommand

This should be one bounded PR.

## D. Watch/validate fourth
Only after the packet flow works.

---

## Acceptance demo for the slice

The slice is complete if all of this is true:

1. `workspace/shared/` has stable templates and conventions for actor/handoff/block/session files
2. daemon boot indexes the four target workspace domains
3. daemon exposes an actor packet endpoint
4. `ema workspace open --actor <id>` works end-to-end
5. `ema handoff inbox --actor <id>` works end-to-end
6. `ema agenda --actor <id> --today` works end-to-end
7. `ema block create ...` writes a compliant block file into shared workspace
8. packet output distinguishes:
   - workspace overlay facts
   - runtime live facts
   - absence of canon authority where canon is not yet integrated

If those are true, EMA has crossed from “architecture notes” into a real shared operating surface.

---

## Suggested exact first PR breakdown

## PR 1 — workspace contract hardening
- templates
- conventions
- per-folder README files
- `START_HERE.md`

## PR 2 — daemon workspace index
- supervisor + index store + boot scan
- actors/handoffs/schedules/sessions parsers
- packet endpoint

## PR 3 — CLI workspace commands
- `workspace open`
- `handoff inbox`
- `agenda`
- `block create`

## PR 4 — quality pass
- validators
- watcher/reconcile
- better session joins
- tests

This is much better than mixing all concerns into one giant implementation.

---

## Why this order is better than “canon first”

Canon v1 absolutely matters, but it is not the best first integrated slice here.

Why:

- the shared workspace is already live and already being used
- the daemon already has runtime/session/control-plane structure to join against
- the CLI already needs a practical actor landing flow
- workspace indexing is lower-risk than canon mutation/promotion
- computed task/agenda design depends on a reliable overlay/read model anyway

So the best first implementation slice is the one that operationalizes the collaboration surface now, while leaving canon promotion as the next major slice.

---

## Follow-on slice after this one

Once Slice 1 is stable, the next slice should be:

> **canon v1 parser + promotion boundary**

Meaning:
- `canon/` folder scaffold
- markdown/frontmatter entity parser
- ETS canon index
- `ema canon validate`
- `ema canon lineage <id>`
- explicit promotion links from workspace files into canon entities

That sequencing keeps the authority boundaries clean.

---

## Bottom line

Build the first real slice in this order:

1. **lock shared workspace file conventions**
2. **index four workspace domains in BEAM**
3. **expose one actor packet endpoint**
4. **add Python CLI commands that consume that packet**
5. **allow one safe write path: schedule block creation**
6. **only then add watchers/validators**

That is the smallest credible implementation that unifies **BEAM + CLI + shared workspace** and creates immediate daily value for agents.

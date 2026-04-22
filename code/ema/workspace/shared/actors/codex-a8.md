# codex-a8 — session breadcrumb model

- actor: codex-a8
- created_at: 2026-04-21T05:11Z
- status: proposed
- scope: design the active session breadcrumb model for `workspace/shared/sessions/`, including file layout, required fields, and clean linkage to PTY/tmux/execution records

## Bottom line

`workspace/shared/sessions/` should be a **human-readable breadcrumb layer**, not the canonical session database.

Its job is to make active work discoverable and resumable across agents by answering:

1. **what session/work is active**
2. **who owns it**
3. **what execution it belongs to**
4. **how to resume it**
5. **what host/runtime attachment exists** (`tmux`, PTY, provider session, imported host session)
6. **what changed last**

The cleanest v1 design is:

- one **session breadcrumb file per EMA session binding**
- one small **index file** for fast scanning
- optional **event/update append files** only when needed
- explicit separation between:
  - **EMA session binding identity**
  - **host runtime attachment identity** (`tmux`, PTY, imported host session)
  - **execution identity** (`exe_*`)
  - **surface identity** (Discord/thread/UI/channel) when present

## Design principle

Do not overload one ID to mean everything.

EMA should preserve distinct layers:

- `execution_id` = work lineage / why this session exists
- `session_binding_id` = EMA’s stable mapping for this resumable session
- `host_session_ref` = imported/discovered host session identity
- `pty_ref` = concrete PTY/subprocess identity if there is one
- `tmux_ref` = tmux server/session/window/pane attachment if there is one
- `provider_session_ref` = Claude/Codex/provider continuity ID if available
- `surface_ref` = Discord/UI/thread/channel binding if present

This matches the repo’s broader session-identity direction and avoids the common bug where “the tmux pane” accidentally becomes the authoritative session ID.

## What files should exist

## Recommended folder layout

```text
workspace/shared/sessions/
├── README.md
├── INDEX.md
├── active/
│   ├── sbind_<id>.md
│   └── ...
├── archive/
│   ├── 2026-04-21/
│   │   └── sbind_<id>.md
│   └── ...
└── events/
    ├── sbind_<id>.md
    └── ...
```

## File roles

### 1. `sessions/README.md`
Defines:
- purpose of the folder
- authority boundary
- filename convention
- required fields
- archive/close rules
- examples of resume data

### 2. `sessions/INDEX.md`
Small navigational file listing:
- active `session_binding_id`
- actor
- status
- execution
- cwd/project
- primary resume path
- last heartbeat / last activity

This is a maintained or computed index, not authority.

### 3. `sessions/active/sbind_<id>.md`
Primary breadcrumb record.

This is the **main file** another agent/operator reads to understand and resume work.

### 4. `sessions/archive/YYYY-MM-DD/sbind_<id>.md`
Closed/stale session records moved out of the active set.

### 5. `sessions/events/sbind_<id>.md` *(optional but useful)*
Append-only or lightly maintained event stream for notable transitions:
- created
- attached to tmux
- execution rebound
- resumed
- blocked
- handed off
- closed
- crashed/stale

Use this only for high-signal transitions, not raw logs.

## Naming convention

Use the EMA session binding as the primary filename anchor:

```text
sessions/active/sbind_<session_binding_id>.md
```

Example:

```text
sessions/active/sbind_ema_codex_a8_2026-04-21T05-11Z.md
```

Why:
- stable across tmux pane changes
- stable across PTY restarts
- stable across provider reconnects
- clearly distinguished from execution IDs and host session IDs

## Required fields for the primary breadcrumb file

Each active session file should begin with a compact metadata block.

## Minimum required fields

```yaml
session_binding_id: sbind_*
status: active | idle | blocked | stale | closing | closed | crashed
actor_id: codex-a8
harness: Codex | Claude | Hermes | other
project_ref: ema
workspace_ref: /home/trajan/Projects/ema
cwd: /home/trajan/Projects/ema
created_at: 2026-04-21T05:11:00Z
updated_at: 2026-04-21T05:18:00Z
last_activity_at: 2026-04-21T05:18:00Z
execution_id: exe_* | null
task_ref: task_* | intent:* | proposal:* | null
summary: short human-readable description of the current work
resume_hint: tmux attach -t ema:codex-a8
```

## Strongly recommended linkage fields

```yaml
intent_ref: int_* | null
proposal_ref: prp_* | null
surface_ref:
  kind: discord_thread | discord_channel | tui | cli | none
  id: ...
host_session_ref:
  kind: imported_host_session | runtime_session | none
  id: ...
provider_session_ref:
  provider: codex | claude | hermes | none
  id: ...
tmux_ref:
  server: default
  session: ema
  window: codex-a8
  pane: "%12"
pty_ref:
  kind: local_pty | subprocess | none
  id: ...
machine_ref: local-agent-vm
worktree_ref: /home/trajan/Projects/ema
branch_ref: main
```

## Operational state fields

```yaml
claim:
  actor_id: codex-a8
  claimed_at: 2026-04-21T05:11:00Z

lifecycle:
  started_at: 2026-04-21T05:11:00Z
  heartbeat_at: 2026-04-21T05:18:00Z
  last_resume_at: 2026-04-21T05:14:00Z
  close_requested_at: null
  closed_at: null

health:
  heartbeat_status: healthy | delayed | missing
  attachment_status: attached | detached | unknown
  execution_sync_status: synced | drifted | unknown
```

## Breadcrumb/handoff fields

These are what make the file actually useful to other agents.

```yaml
current_focus: design session breadcrumb model
next_action: write final actor-file recommendation
blockers: []
artifacts:
  - workspace/shared/actors/codex-a8.md
related_paths:
  - workspace/shared/swarm/SWARM_META_BUILD_2026-04-21.md
handoff_targets: []
```

## Suggested markdown body structure

After metadata, the body should stay compact and human-readable.

## Recommended template

```md
# session breadcrumb — <session_binding_id>

## Current state
- actor: codex-a8
- status: active
- execution: exe_123
- cwd: `/home/trajan/Projects/ema`
- focus: design session breadcrumb model
- resume: `tmux attach -t ema`

## Purpose
One paragraph on what this session is doing and why it exists.

## Resume paths
1. tmux: `tmux attach -t ema`
2. provider/session: `codex session <id>` or equivalent if supported
3. fallback cwd: `/home/trajan/Projects/ema`

## Linked records
- execution: `exe_123`
- intent: `int_456`
- proposal: `prp_789`
- actor output: `workspace/shared/actors/codex-a8.md`

## Latest breadcrumb
- 2026-04-21T05:18:00Z — drafted recommended file set and linking rules

## If I disappear
- check `tmux_ref` and `pty_ref`
- if tmux missing but execution still active, mark attachment drift
- if execution completed, archive this file
```

## Clean linking model for PTY/tmux/Execution

## Core rule

The session breadcrumb should **link to** PTY/tmux/execution records, not replace them.

Model it as a star, with `session_binding_id` at the center:

```text
execution_id  --->  session_binding_id  <---  tmux_ref
                           |
                           +--- pty_ref
                           |
                           +--- provider_session_ref
                           |
                           +--- surface_ref
```

## Why this is the right center

`session_binding_id` is the EMA-level concept of:

- “this work session”
- “resumable continuity for this actor/work”
- “the thing that may survive transport changes”

A tmux pane can die and be recreated.
A PTY PID can change.
A provider-native session may be absent.
An execution can pause and later resume in a different host attachment.

The breadcrumb should survive those changes.

## Recommended link semantics

### `execution_id`
Use when the session is attached to a specific execution record.

Meaning:
- why this session exists
- what work lineage it belongs to

Rules:
- one active breadcrumb usually points to one current `execution_id`
- a new execution may either:
  - rebind the same session binding, or
  - create a new session binding if continuity should be reset

### `tmux_ref`
Use only as host attachment data.

Meaning:
- how to attach from the shell
- which tmux location currently carries the session

Fields:
- `server`
- `session`
- `window`
- `pane`

Do **not** use tmux pane/window as the filename or canonical ID.

### `pty_ref`
Use for concrete subprocess/PTY identity.

Meaning:
- the live process attachment
- useful for runtime watchers and health checks

Fields:
- `kind`
- `id`
- optional `pid`
- optional `started_at`

PTY identity may rotate without changing the session binding.

### `host_session_ref`
Use when EMA imports/discovers an existing host session.

Meaning:
- imported or externally discovered continuity
- useful when the session existed before EMA fully bound it

This is how EMA can bridge “discovered host reality” into the workspace breadcrumb layer without confusing it with the EMA binding.

### `provider_session_ref`
Use for provider-native continuity:
- Claude conversation/session ID
- Codex run/session ID
- Hermes session/response ID

This is always secondary to EMA binding identity.

## Practical file examples

## Example 1 — tmux-backed active coding session

```yaml
session_binding_id: sbind_codex_a8_2026_04_21_001
status: active
actor_id: codex-a8
harness: Codex
project_ref: ema
workspace_ref: /home/trajan/Projects/ema
cwd: /home/trajan/Projects/ema
created_at: 2026-04-21T05:11:00Z
updated_at: 2026-04-21T05:18:00Z
last_activity_at: 2026-04-21T05:18:00Z
execution_id: exe_meta_build_008
task_ref: swarm:codex-a8
summary: design active session breadcrumb model for workspace/shared/sessions
resume_hint: tmux attach -t ema
host_session_ref:
  kind: runtime_session
  id: hsess_204
provider_session_ref:
  provider: codex
  id: codex_run_77
tmux_ref:
  server: default
  session: ema
  window: codex-a8
  pane: "%12"
pty_ref:
  kind: local_pty
  id: pty_9912
machine_ref: local-agent-vm
worktree_ref: /home/trajan/Projects/ema
branch_ref: main
current_focus: define files, fields, and linking rules
next_action: finalize actor-file markdown
blockers: []
artifacts:
  - workspace/shared/actors/codex-a8.md
related_paths:
  - workspace/shared/swarm/SWARM_META_BUILD_2026-04-21.md
handoff_targets: []
```

## Example 2 — imported host session with no active execution yet

```yaml
session_binding_id: sbind_import_2026_04_21_002
status: idle
actor_id: unknown
harness: Claude
project_ref: ema
workspace_ref: /home/trajan/Projects/ema
cwd: /home/trajan/Projects/ema
created_at: 2026-04-21T05:20:00Z
updated_at: 2026-04-21T05:20:00Z
last_activity_at: 2026-04-21T04:58:00Z
execution_id: null
task_ref: null
summary: imported resumable Claude session discovered on host
resume_hint: tmux attach -t ema-import
host_session_ref:
  kind: imported_host_session
  id: hsess_import_88
provider_session_ref:
  provider: claude
  id: claude_session_abc
tmux_ref:
  server: default
  session: ema-import
  window: claude-1
  pane: "%3"
pty_ref:
  kind: none
  id: null
machine_ref: local-agent-vm
worktree_ref: /home/trajan/Projects/ema
branch_ref: main
current_focus: unbound imported session
next_action: bind to actor/execution or archive if irrelevant
blockers: []
artifacts: []
related_paths: []
handoff_targets: []
```

## State machine recommendation

Use a small, explicit vocabulary:

- `active` — attached and currently in use
- `idle` — resumable but not currently active
- `blocked` — work paused by blocker, session still relevant
- `stale` — heartbeat or attachment unclear; needs inspection
- `closing` — close/archive in progress
- `closed` — finished and ready for archive
- `crashed` — session failed unexpectedly

Avoid ambiguous status words like `running`, `alive`, `open`, and `busy` unless they are clearly scoped to a lower-level runtime field.

## Archive rules

Move a session breadcrumb from `active/` to `archive/YYYY-MM-DD/` when any of the following is true:

- execution is completed/failed/cancelled and no resume path remains
- actor intentionally closed the session
- host attachments are gone and session is no longer relevant
- imported session was reviewed and deemed not useful
- session was superseded by a new binding

Before archiving, update:
- `status: closed | crashed | stale`
- `closed_at`
- final `summary`
- final `next_action` or “none”

## INDEX.md shape

Keep it short. Example:

```md
# sessions index

## Active
| session_binding_id | actor | status | execution | cwd | resume | last_activity |
|---|---|---|---|---|---|---|
| `sbind_codex_a8_2026_04_21_001` | `codex-a8` | `active` | `exe_meta_build_008` | `/home/trajan/Projects/ema` | `tmux attach -t ema` | `2026-04-21T05:18:00Z` |

## Needs attention
| session_binding_id | reason |
|---|---|
| `sbind_import_2026_04_21_002` | imported session unbound to actor/execution |
```

## What should stay out of the breadcrumb file

Do not turn the breadcrumb into:
- a raw terminal log
- a full transcript store
- canonical execution truth
- a duplicate task database
- an exhaustive process table
- a substitute for runtime/session persistence

If detailed logs exist, link out to them via refs/paths.

## Minimal v1 implementation recommendation

If EMA wants the smallest useful version now, ship just this:

```text
sessions/
├── README.md
├── INDEX.md
├── active/
│   └── sbind_<id>.md
└── archive/
```

And require these fields only:

```yaml
session_binding_id
status
actor_id
harness
cwd
created_at
updated_at
last_activity_at
execution_id
summary
resume_hint
tmux_ref
pty_ref
host_session_ref
provider_session_ref
current_focus
next_action
artifacts
```

That is enough to make sessions discoverable, resumable, and linkable without prematurely overbuilding the model.

## Recommendation summary

`workspace/shared/sessions/` should be a **workspace-visible breadcrumb overlay** centered on **EMA session bindings**, with explicit links outward to:

- `execution_id` for work lineage
- `tmux_ref` for shell resume
- `pty_ref` for live process attachment
- `host_session_ref` for imported/discovered continuity
- `provider_session_ref` for model/provider continuity
- optional `surface_ref` for Discord/UI bindings

The key architectural rule is simple:

> **Use `session_binding_id` as the breadcrumb anchor; treat tmux/PTy/provider/session imports as attachments, not identity.**

That keeps the shared workspace legible for humans, avoids authority confusion, and cleanly connects the collaboration layer to EMA’s runtime/session machinery.

# Implementation State — Workspace Slice 1

Generated after continuing implementation on 2026-04-21.

## What landed

### Shared workspace hardening
Added/updated:
- `workspace/shared/START_HERE.md`
- `workspace/shared/conventions/STATUS_VOCAB.md`
- `workspace/shared/conventions/TIMESTAMP_RULES.md`
- `workspace/shared/templates/actor.md`
- `workspace/shared/templates/handoff.md`
- `workspace/shared/templates/schedule-block.md`
- `workspace/shared/templates/session.md`
- per-folder READMEs for:
  - `actors/`
  - `handoffs/`
  - `schedules/`
  - `sessions/`
  - `plans/`
  - `tasks/`
  - `swarm/`
  - `exports/`
  - `inbox/`
  - `scratch/`

Added high-priority folder structure:
- `handoffs/active/`, `handoffs/archive/`
- `sessions/active/`, `sessions/archive/`, `sessions/events/`
- `actors/archive/`
- `plans/active/`, `plans/archive/`
- `schedules/active/`, `schedules/archive/`
- `inbox/new/`, `inbox/triaged/`, `inbox/archive/`
- `swarm/archive/`
- `exports/pending/`, `exports/promoted/`
- `scratch/shared/`
- `tasks/views/`, `tasks/exports/`

Generated/updated indexes:
- `actors/INDEX.md`
- `handoffs/INDEX.md`
- `sessions/INDEX.md`
- `swarm/INDEX.md`
- `swarm/CURRENT_STATE_2026-04-21.md`

### Python CLI
Added new command group:
- `cli/ema_cli/commands/workspace.py`

Wired into:
- `cli/ema_cli/main.py`

New commands:
- `ema workspace open --actor <id>`
- `ema workspace handoff-inbox --actor <id>`
- `ema workspace agenda --actor <id>`
- `ema workspace block-create <title> --actor <id> --start <ISO> --end <ISO>`

### Daemon / BEAM side
Added minimal workspace overlay subtree:
- `daemon/lib/ema/workspace/supervisor.ex`
- `daemon/lib/ema/workspace/indexer.ex`
- `daemon/lib/ema/workspace/index_store.ex`
- `daemon/lib/ema/workspace/synthesizer.ex`
- `daemon/lib/ema_web/controllers/workspace_controller.ex`

Wired into:
- `daemon/lib/ema/application.ex`
- `daemon/lib/ema_web/router.ex`

New endpoint:
- `GET /api/workspace/actors/:actor_id/packet`

## Verification status

### Python / CLI
Verified:
- `python3 -m py_compile ema_cli/commands/workspace.py ema_cli/main.py`
- `python3 -m pytest tests/test_mvp.py -q`
- Result: `61 passed`

### Elixir / daemon
Environment-blocked on this machine:
- local Elixir is `1.14.0`
- repo requires `~> 1.17`

That means daemon-side tests were not runnable here, even though the new endpoint/test scaffolding was added.

## Current shape of slice 1

This repo now has:
1. a hardened shared workspace contract
2. a minimal daemon-side workspace packet path
3. a real Python CLI surface for agents to open/use that workspace

This is the first concrete implementation step behind the swarm’s recommendations.

## Immediate next recommended work

1. strengthen daemon-side parsing/indexing coverage
2. add proper folder READMEs for remaining subfolders like `tasks/views/`, `sessions/active/`, etc.
3. add daemon-side tests once correct Elixir toolchain is available
4. deepen packet synthesis with canon/runtime joins
5. add validators / reconcile loop

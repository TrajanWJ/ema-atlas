# EMA

EMA is the orchestration and control-plane repo.

## Repo shape

- `daemon/` — canonical EMA core service (Elixir/Phoenix)
- `cli/` — local CLI and API test harness
- `wiki-engine/` — optional knowledge/wiki subsystem
- `claudeforge/` — adjacent operator surface / experimental UI
- `docs/` — architecture, contracts, rollout notes
- `workspace/shared/` — shared agent workspace on the agent VM for handoffs, plans, schedules, tasks, sessions, and swarm coordination

## What is canonical?

For now, the canonical EMA runtime is `daemon/`.

If you only want one thing running, run the daemon.

## Bootstrap goals

From a cold machine, the minimum successful bootstrap is:

1. install daemon dependencies
2. configure environment
3. start EMA daemon
4. verify health/status
5. optionally start adjacent surfaces

## Quick start

### Core only

```bash
cd daemon
mix deps.get
mix ecto.setup
mix phx.server
```

Default dev config binds EMA to `127.0.0.1:4488`.

### CLI harness

```bash
cd cli
./ema seed
./ema shell
```

## Optional subsystems

### wiki-engine

Optional subsystem for search, graph, and wiki-style context assembly.
Treat as non-canonical unless explicitly needed for the workflow you are testing.

### claudeforge

Adjacent operator surface / experimental UI.
Treat as non-canonical unless explicitly needed.

## Ports and binding policy

Document authoritative ports here and keep them current.

Current repo intent:
- EMA daemon dev bind: `127.0.0.1:4488`
- Non-core surfaces should default to loopback unless there is a deliberate reason not to.

If docs and runtime disagree, verify with live process / socket inspection and update this file.

## Environment

Core runtime variables currently visible in the repo:

- `OPENCLAW_GATEWAY_URL`
- `ANTHROPIC_API_KEY`
- `SECRET_KEY_BASE` (prod)
- `PORT` (prod)
- `EMA_SESSION_MODE` (`shadow|canary|primary|ema_only`)

## Repo hygiene

Runtime state, local databases, caches, and secrets are not source.
See `.gitignore`.

## Shared agent workspace

For active collaboration on the agent VM, start in:
- `workspace/shared/README.md`

Supporting architecture note:
- `docs/AGENT_SHARED_WORKSPACE_ARCHITECTURE.md`

This is the repo-owned shared landing zone so agents do not scatter working state across random VM folders.

## Agent-facing contract

If you are wiring OpenClaw or another agent runtime to EMA, use `docs/AGENT-CONTRACT.md`.

Short version:
- read status/context from `/api/control-plane` and `/api/control-plane/context_for`
- use `/api/control-plane/live` for operator event views
- use `/api/surfaces/host-truth` for host reality
- report work outcomes back via `/api/control-plane/executions/:id/complete` or `/api/control-plane/executions/:id/dispatch-update`

Related decisions:
- `docs/OPENCLAW-EMA-DECISIONS-2026-04-13.md`

## Current status

This repo is under active restructuring.
The current priority is to keep one sane bootstrap path and reduce ambiguity between source, runtime state, and optional surfaces.

## Reconciled note (2026-04-13)

Architecturally, EMA should still be treated as a daemon-centered local control/runtime system.
However, the active host implementation may differ from older daemon-era docs.
When repo and host reality diverge, reconcile against current host truth before promoting decisions.

See also:
- `docs/OPENCLAW-EMA-DECISIONS-2026-04-13-HOST-RECONCILED.md`

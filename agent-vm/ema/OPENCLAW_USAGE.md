# OpenClaw ↔ EMA usage lane

Use this as the canonical bridge from OpenClaw chat/runtime into EMA on the host.

## Primary rule

Prefer `ema openclaw ...` over ad-hoc raw endpoint calls whenever the wrapper covers the task.
Prefer daemon-native control-plane reads/writes over SSH when the daemon already exposes the needed truth.

## Capability locality

Do not assume a capability is globally available just because it works in one lane.
Distinguish between:
- human/operator shell access
- agent runtime access
- coding-agent dispatch access
- daemon-native access

Architecturally, treat SSH as an operator/debug lane.
Treat the EMA daemon contract as the primary machine-readable integration lane.

## Read path

```bash
cd /home/trajan/Projects/ema/cli
./ema openclaw status --project ema
./ema openclaw context --project ema
./ema openclaw host-truth
```

Use:
- `status` for operator snapshot
- `context` for bounded project working set
- `host-truth` for dispatch/machine reality

## Write path

```bash
./ema openclaw propose --project ema --intent <intent> --summary "<summary>"
./ema openclaw run <proposal_id>
./ema openclaw dispatch-update <execution_id> --status <status> --summary "<summary>"
./ema openclaw complete <execution_id> --status succeeded --summary "<summary>"
```

## Current compatibility rules

- Treat EMA control-plane as the system of record for execution lineage.
- On current daemon builds, some CRUD endpoints may be absent even when control-plane surfaces exist.
- When task CRUD is missing, use proposals/executions via `ema openclaw ...` instead of trying to force `ema task create/update`.
- When route behavior and on-disk code disagree, suspect a stale daemon process first.

## Fallback commands

```bash
./ema context operator
./ema control status
./ema control live --limit 20
./ema agent-snapshot --project ema
./ema surfaces host-sessions
```

## Smoke-test checklist after daemon restart

```bash
./ema status
./ema openclaw status --project ema
./ema openclaw context --project ema
./ema openclaw host-truth
./ema project list
./ema proposal list
./ema agent list
./ema task list
./ema surfaces list
```

Expected:
- wrapper read-path commands succeed
- compatibility-backed list/show commands succeed
- surfaces list no longer crashes
- if task CRUD still missing, task reads should still degrade gracefully

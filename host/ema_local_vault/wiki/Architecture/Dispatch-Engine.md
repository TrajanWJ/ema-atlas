---
title: "Dispatch Engine"
space: wiki
tags: ["architecture","dispatch","execution","agents"]
source: manual
---

# Dispatch Engine

> **Legacy system.** This page describes the original bash-based dispatch engine that ran on the agent-vm. The host daemon now uses `Ema.Executions.Dispatcher` (Elixir GenServer, PubSub-driven) as the primary execution path. The bash dispatch engine below is retained for historical reference and may still run on the VM.

The original execution system. A bash-based task queue that ran every 1 minute via cron on agent-vm. Managed 21 agent slots and 84+ tasks in dispatch.db. The agent-vm is currently offline (as of 2026-04-06), so this system is not running. `Ema.Executions.Dispatcher` (Elixir GenServer in the host daemon) is the only active execution path.

## How It Works

```
~/dispatch/queue/*.json          Task files submitted by CLI/API/agents
      │
      ▼
dispatch-engine.sh               Runs every 1min via cron
      ├── Acquires flock
      ├── Picks highest-priority queued task
      ├── Assigns to best available agent
      ├── Moves task file to active/
      ├── Spawns `claude` CLI process with task context
      ├── Captures output to results/
      ├── On completion: moves to done/ or failed/
      └── Posts status to Discord webhook
```

## dispatch.db Schema (14 tables)

```sql
-- tasks: the work queue (84 rows)
CREATE TABLE tasks (
  id TEXT PRIMARY KEY, title TEXT, description TEXT, agent TEXT,
  status TEXT DEFAULT 'queued',  -- queued/active/done/failed/partial/blocked/cancelled
  priority INTEGER DEFAULT 2, mission_id TEXT, pipeline_id TEXT,
  depends_on TEXT, timeout_min INTEGER DEFAULT 10,
  attempts INTEGER DEFAULT 0, max_attempts INTEGER DEFAULT 3,
  pid INTEGER, checkpoint TEXT, gateway_session_id TEXT, tags TEXT
);

-- agents: the 21-agent roster with circuit breaker state
CREATE TABLE agents (
  id TEXT PRIMARY KEY, name TEXT, emoji TEXT,
  status TEXT DEFAULT 'idle',  -- idle/active/error/circuit_open
  current_task_id TEXT, success_count INTEGER, failure_count INTEGER,
  circuit_state TEXT DEFAULT 'closed'
);

-- proposals: change proposals with approval workflow
CREATE TABLE proposals (
  id TEXT PRIMARY KEY, title TEXT, scope TEXT, task_breakdown TEXT,
  priority INTEGER, status TEXT DEFAULT 'pending',
  destructive INTEGER DEFAULT 0, auto_approved INTEGER DEFAULT 0
);
```

Other tables: missions, pipelines, feed, handoffs, inbox, vault_links, agent_health, engine_state, task_log, schema_version.

## Cron Jobs (key ones)

| Schedule | Script | Purpose |
|----------|--------|---------|
| Every 1min | `dispatch-engine.sh` | Core task execution |
| Every 15min | `dispatch-heartbeat.sh` | Liveness check |
| Every 30min | `stale-task-cleanup.sh` | Clean stuck tasks |
| Every 2h | `vault-autocommit.sh` | Git commit vault changes |
| Every 30min | `qmd update && qmd embed` | Semantic search index |

These cron jobs were on agent-vm, which is currently offline. Only 2 crons run on the host (qmd update every 30min, OAuth sync every 4h).

## Agent Roster (21 agents)

All managed via dispatch.db `agents` table. Circuit breaker state tracked per agent (closed/open). Success/failure counts maintained.

## Task Lifecycle

```
queued → active → done
                → failed (retry if attempts < max_attempts)
                → partial (checkpoint saved)
       → blocked (depends_on not met)
       → cancelled
```

## Daemon Integration

The daemon can also spawn sessions independently:

```
POST /api/surfaces/sessions/claude   → creates ClaudeSession GenServer
POST /api/surfaces/sessions/:id/prompt → sends prompt to session
POST /api/surfaces/dispatch          → native gateway dispatch
```

With agent-vm offline, the daemon's `Ema.Executions.Dispatcher` (Elixir GenServer, PubSub-driven) is the only active execution path.

## CLI Access

The CLI reads dispatch.db directly (read-only) for task/agent queries:

```bash
ema task list          # reads dispatch.db tasks
ema agent list         # reads dispatch.db agents
ema exec list          # reads dispatch.db + daemon API
ema dispatch status    # queue/active/done counts
```

For writes, the CLI enqueues to `~/dispatch/queue/` or uses daemon API.

## Why Bash?

The dispatch engine predates the Elixir daemon. It worked reliably when the agent-vm was running, with 21 agent slots. With the VM offline, the Elixir daemon's native execution system (`Ema.Executions.Dispatcher`) has taken over as the primary path.

## Related

- [[EMA Architecture Overview]]
- [[Agent Network]]
- [[Babysitter System]]

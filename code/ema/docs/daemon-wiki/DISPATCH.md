# EMA Dispatch System

The dispatch system is EMA's task execution layer — a file-based queue processed by `dispatch-engine.sh` every minute via cron.

## Directory Structure

```
~/dispatch/
├── queue/           ← Pending tasks (JSON). Picked up by dispatch-engine.sh
├── active/          ← Currently executing tasks (moved from queue/)
├── done/            ← Completed tasks (auto-pruned after 14 days)
├── failed/          ← Failed tasks with error context
├── results/         ← Task output artifacts (markdown, patches, logs)
├── locks/           ← flock-based concurrency locks
├── pipelines/       ← Multi-step pipeline definitions
└── scheduled/       ← Time-delayed tasks (loaded hourly by dispatch.sh schedule)
```

## Task Lifecycle

```
queued → active → done | failed
  ↑                       |
  └── retry (if retryable)┘
```

1. **Queued:** Task JSON written to `~/dispatch/queue/<task-id>.json`
2. **Active:** `dispatch-engine.sh` moves it to `active/`, acquires lock, spawns executor
3. **Done:** On success, moved to `done/` with result written to `results/`
4. **Failed:** On failure, moved to `failed/` with error context appended

## Task JSON Format

```json
{
  "id": "task-20260406-001",
  "type": "research|code|analysis|proposal|maintenance",
  "title": "Brief description",
  "description": "Full task details",
  "agent": "researcher|coder|ops",
  "priority": 1,
  "context": "Additional context or file references",
  "source": "cron|user|proposal-engine|signal-queue",
  "created_at": "2026-04-06T02:00:00Z",
  "timeout_minutes": 10,
  "retry_count": 0,
  "max_retries": 1
}
```

## dispatch-engine.sh

The core executor. Runs every minute via cron.

**What it does:**
1. Scans `~/dispatch/queue/` for pending tasks (sorted by priority)
2. Checks concurrency limits (max parallel tasks)
3. Acquires flock on `~/dispatch/locks/<task-id>.lock`
4. Moves task to `active/`
5. Spawns Claude Code session (or other executor) with task context
6. Captures output to `results/<task-id>.txt`
7. Moves to `done/` or `failed/` based on exit code
8. Posts status to Discord webhook if configured

## Lock Files

All concurrent access uses `flock`:

```bash
(
  flock -n 200 || exit 1
  # ... execute task ...
) 200>~/dispatch/locks/${task_id}.lock
```

- Non-blocking (`-n`): skip if another instance is running
- Lock auto-releases when subshell exits
- Stale locks cleaned by `stale-task-cleanup.sh` (runs every 30 min)

## EMA Daemon Integration

The Phoenix daemon integrates with dispatch through two paths:

### 1. Ema.Pipes.Executor
The `Ema.Pipes.Executor` module can write tasks to `~/dispatch/queue/` for execution by the shell-based engine:

```elixir
Ema.Pipes.Executor.dispatch(%{
  type: "code",
  title: "Implement feature X",
  agent: "coder",
  priority: 2
})
```

### 2. ema-surface-dispatch.sh
Routes tasks to different EMA surfaces:

- **CLI surface:** Spawns `claude` CLI subprocess
- **Daemon API:** POST to `localhost:4488/api/tasks`
- **Webhook:** POST to Discord webhook for notification

```bash
ema-surface-dispatch.sh --surface cli --task task-20260406-001.json
ema-surface-dispatch.sh --surface daemon --task task-20260406-001.json
```

## Pipelines

Multi-step workflows defined in `~/dispatch/pipelines/`:

```json
{
  "id": "pipeline-research-implement",
  "steps": [
    {"agent": "researcher", "type": "research", "title": "Research options"},
    {"agent": "coder", "type": "code", "title": "Implement chosen option", "depends_on": "step-1"}
  ]
}
```

Each step completion triggers the next via `dispatch-completion-hook.sh`.

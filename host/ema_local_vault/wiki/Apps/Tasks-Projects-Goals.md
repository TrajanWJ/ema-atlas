---
title: "Tasks, Projects & Goals"
space: wiki
tags: ["apps","tasks","projects","goals"]
source: manual
---

# Tasks, Projects & Goals

Work tracking hierarchy: Goals → Projects → Tasks → Executions.

## Goals

Top-level objectives. Support parent-child hierarchy.

```bash
ema goal create "Ship EMA v2" --description "CLI + TUI parity"
ema goal list
ema goal update <id> --status active
```

## Projects

Containers for tasks, proposals, and executions. Linked to filesystem paths.

```bash
ema project create "ProSlync" --slug proslync --path ~/Projects/proslync
ema project list
ema project show ema                 # Detail by slug
ema project context ema              # Full context bundle
ema project dependencies ema         # List project tasks
```

Key feature: `context` command assembles full project context (tasks, proposals, executions, vault notes) into a single bundle. Used for AI context injection.

## Tasks

Actionable work items within projects.

```bash
ema task create "Fix auth module" --project proslync --priority high
ema task list --status pending --project ema
ema task show <id>                          # Detail with tags/actor data
ema task update <id> --status active        # Update fields
ema task transition <id> done               # Status transition
ema task delete <id>
```

Task status: `pending → active → done | blocked`

Priority: low, medium, high, critical

## Intent Engine

The Intent Engine provides a semantic hierarchy above tasks. Intents span from L0 (vision) to L5 (step), with L4 mapping to tasks. Use intents for structured planning and the task system for execution tracking.

```bash
ema intent list --level 4 --status active   # Active task-level intents
ema intent tree --project ema               # Full hierarchy
ema intent context <id>                     # Links, lineage, parent chain
```

## API Reference

### Goals
| Endpoint | Purpose |
|----------|---------|
| `GET /api/goals` | List |
| `POST /api/goals` | Create |
| `GET /api/goals/:id` | Get |
| `PUT /api/goals/:id` | Update |
| `DELETE /api/goals/:id` | Delete |

### Projects
| Endpoint | Purpose |
|----------|---------|
| `GET /api/projects` | List |
| `POST /api/projects` | Create |
| `GET /api/projects/:id` | Get |
| `GET /api/projects/:id/context` | Context bundle |

### Tasks
| Endpoint | Purpose |
|----------|---------|
| `GET /api/tasks` | List (filter: status, project_id) |
| `POST /api/tasks` | Create |
| `GET /api/tasks/:id` | Get with subtasks + comments |
| `POST /api/tasks/:id/transition` | Change status |
| `POST /api/tasks/:id/comments` | Add comment |

## Related

- [[Proposal Pipeline]]
- [[Execution System]]

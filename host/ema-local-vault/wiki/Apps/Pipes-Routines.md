---
title: "Pipes & Routines"
space: wiki
tags: ["apps","pipes","routines","automation"]
source: manual
---

# Pipes & Routines

Event-driven automation and scheduled recurring tasks.

## Pipes

Trigger → Transform → Action chains. Event-driven automation.

| Concept | Purpose |
|---------|---------|
| **Trigger** | What starts the pipe (git push, timer, webhook, manual) |
| **Transform** | Data transformation between trigger and action |
| **Action** | What happens (create task, send message, run execution) |

### API

| Endpoint | Purpose |
|----------|---------|
| `GET /api/pipes` | List pipes |
| `POST /api/pipes` | Create pipe |
| `POST /api/pipes/:id/toggle` | Enable/disable |
| `POST /api/pipes/:id/fork` | Clone pipe |
| `GET /api/pipes/catalog` | Available triggers/actions/transforms |
| `GET /api/pipes/history` | Execution history |
| `GET /api/pipes/system` | System-level pipes |

## Routines

Scheduled recurring tasks (like cron jobs for EMA).

### API

| Endpoint | Purpose |
|----------|---------|
| `GET /api/routines` | List |
| `POST /api/routines` | Create |
| `POST /api/routines/:id/toggle` | Enable/disable |
| `POST /api/routines/:id/run` | Run now |

## CLI

Pipes now have full CLI coverage:

```bash
ema pipe list                               # All pipes
ema pipe show <id>                          # Pipe detail
ema pipe create "My Pipe" --trigger "tasks:created"  # Create
ema pipe toggle <id>                        # Enable/disable
ema pipe fork <id>                          # Clone pipe
ema pipe catalog                            # Available triggers/actions
ema pipe history                            # Execution run history
```

## Trigger Catalog

22 triggers available in the registry. Each emits a payload on the `"pipes:events"` PubSub topic.

| Trigger | Description |
|---------|-------------|
| `brain_dump:item_created` | New capture added |
| `brain_dump:item_processed` | Item routed to task/journal/note/archive |
| `tasks:created` | New task from any source |
| `tasks:status_changed` | Task status transition |
| `tasks:completed` | Task marked done |
| `proposals:seed_fired` | A seed was triggered |
| `proposals:generated` | Raw proposal created by generator |
| `proposals:refined` | Proposal passed through refiner |
| `proposals:debated` | Proposal passed through debater |
| `proposals:queued` | Proposal arrived in queue |
| `proposals:approved` | User green-lit a proposal |
| `proposals:redirected` | User yellow-lit a proposal |
| `proposals:killed` | User red-lit a proposal |
| `projects:created` | New project |
| `projects:status_changed` | Project lifecycle transition |
| `habits:completed` | Habit checked off |
| `habits:streak_milestone` | Streak hit 7/30/100 |
| `system:daemon_started` | Daemon boot |
| `system:daily` | Fires once per day |
| `system:weekly` | Fires once per week |

## Action Catalog

15 actions available. Each receives a payload and performs a side effect.

| Action | Description |
|--------|-------------|
| `brain_dump:create_item` | Add a capture |
| `tasks:create` | Create a new task |
| `tasks:transition` | Change task status |
| `proposals:create_seed` | Create a new seed prompt |
| `proposals:approve` | Green-light a proposal |
| `proposals:redirect` | Yellow-light a proposal |
| `proposals:kill` | Red-light a proposal |
| `projects:create` | Create a new project |
| `projects:transition` | Change project status |
| `projects:rebuild_context` | Force context document rebuild |
| `responsibilities:generate_due_tasks` | Generate tasks from due responsibilities |
| `vault:create_project_space` | Bootstrap vault directory for new project |
| `vault:create_note` | Create a note in the vault |
| `notify:desktop` | Send a desktop notification |
| `notify:log` | Write to system log |

Source: `daemon/lib/ema/pipes/registry.ex`

## Transform Catalog

5 transforms shape data between trigger and action.

| Transform | Description |
|-----------|-------------|
| `filter` | Pass/drop events based on conditions |
| `map` | Reshape payload before passing to actions |
| `delay` | Debounce — accumulate events, fire after quiet period |
| `claude` | Run Claude CLI as a transform (stub — returns payload unchanged) |
| `conditional` | Branch logic — if/then/else |

## Related

- [[EMA Architecture Overview]]
- [[Execution-System]]
- [[Proposal-Pipeline]]

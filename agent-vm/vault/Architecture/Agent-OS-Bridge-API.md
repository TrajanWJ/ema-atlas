---
type: architecture
status: active
tags: [agent-os, api, bridge, reference]
created: 2026-03-20
---

# Agent OS Bridge API Reference

Complete reference for the Agent OS Bridge Server API. The bridge runs on port 18790 at `192.168.122.10` and proxies between the WebUI and backend systems (OpenClaw, Discord, Vault, Dispatch).

**Base URL:** `http://192.168.122.10:18790`
**Auth:** Referer header must match `http://192.168.122.10:18790/app/`
**WebSocket:** `ws://192.168.122.10:18790` — broadcasts `{ type, action, data }` events

---

## Health

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Returns `{ status: 'ok', uptime }` |

---

## Discord

### Channels & Messages

| Method | Path | Description |
|---|---|---|
| GET | `/api/channels` | List all guild channels. Returns array of `{ id, name, type, topic, category }` |
| GET | `/api/channels/:id/messages` | Fetch messages. Query: `?limit=50&before=ID&after=ID`. Returns array of message objects |
| POST | `/api/channels/:id/messages` | Send a message. Body: `{ content, replyTo? }`. Returns sent message |
| POST | `/api/channels/:id/messages/:msgId/react` | Add reaction. Body: `{ emoji }` |
| POST | `/api/channels/:id/typing` | Send typing indicator |

### Threads

| Method | Path | Description |
|---|---|---|
| GET | `/api/channels/:id/threads` | List threads in a channel. Returns active + recently archived threads |
| GET | `/api/threads/:id/messages` | Fetch thread messages. Query: `?limit=50` |
| POST | `/api/threads/:id/messages` | Send message to thread. Body: `{ content }` |

### Guild

| Method | Path | Description |
|---|---|---|
| GET | `/api/guild/info` | Guild metadata: name, member count, role count, channel count |
| GET | `/api/guild/channels` | All channels grouped by category with unread indicators |
| GET | `/api/discord/recent` | Recent messages from agent-feed channel. Query: `?limit=20` |

---

## Vault (Mind Page)

### Search & Read

| Method | Path | Description |
|---|---|---|
| GET | `/api/vault/search` | Full-text search via QMD. Query: `?q=term&limit=10`. Returns `[{ docid, score, path, title, snippet }]` |
| GET | `/api/vault/note` | Read a note. Query: `?path=folder/note.md`. Returns `{ path, content, frontmatter, wikilinks, backlinks, wordCount, modified }` |
| GET | `/api/vault/recent` | Recently modified notes (last 24h). Query: `?limit=20`. Returns `[{ path, modified }]` |
| GET | `/api/vault/stats` | Vault statistics: total notes, folders, tags, word count, recent activity |
| GET | `/api/vault/folders` | Folder tree structure for browsing |
| GET | `/api/vault/tags` | All tags with usage counts |
| GET | `/api/vault/backlinks/:path` | Notes that link to the given path |
| GET | `/api/vault/graph` | Knowledge graph data. Query: `?limit=100`. Returns `{ nodes, edges }` for force-directed visualization |
| GET | `/api/vault` | Redirect to vault search UI |

### Write

| Method | Path | Description |
|---|---|---|
| POST | `/api/vault/note` | Create a new note. Body: `{ path, content, frontmatter? }`. Returns 409 if exists. Creates parent dirs automatically. Triggers QMD reindex. |
| PUT | `/api/vault/note/:path` | Update existing note. Body: `{ content, frontmatter? }`. Returns 404 if not found. |

---

## Dispatch Queue (Inbox/Tasks)

### Legacy Queue API

| Method | Path | Description |
|---|---|---|
| GET | `/api/queue` | List queued items (pending questions/tasks from agents) |
| GET | `/api/queue/history` | Resolved queue items |
| GET | `/api/queue/:id` | Single queue item detail |
| POST | `/api/queue/:id/resolve` | Resolve a queue item. Body: `{ answer, action? }` |

### Dispatch Tasks

| Method | Path | Description |
|---|---|---|
| POST | `/api/dispatch/task` | Create a dispatch task. Body: `{ title, agent?, priority?, description? }`. Defaults: agent=righthand, priority=P2 |
| POST | `/api/dispatch/task/:id/approve` | Move task from queue to active. Broadcasts WebSocket event. |

### Task Lifecycle

| Method | Path | Description |
|---|---|---|
| POST | `/api/tasks` | Quick task creation (logging only). Body: `{ title, agent, priority, description }` |
| GET | `/api/tasks/queue` | All queued tasks |
| GET | `/api/tasks/active` | Currently executing tasks |
| GET | `/api/tasks/done` | Completed tasks (limit 20) |
| GET | `/api/tasks/failed` | Failed tasks (limit 10) |
| GET | `/api/tasks/all` | Combined view across all statuses, sorted by creation time |
| GET | `/api/tasks/:id` | Single task detail with source proposal if linked |
| POST | `/api/tasks/:id/cancel` | Cancel a task. Body: `{ reason? }`. Moves to failed. |
| POST | `/api/tasks/:id/retry` | Retry a failed task. Copies back to queue with incremented retry count. |
| POST | `/api/tasks/:id/priority` | Change task priority. Body: `{ priority }` (P0-P4) |

---

## Proposals

| Method | Path | Description |
|---|---|---|
| POST | `/api/proposals` | Create a proposal. Body: `{ title, description, source_agent, confidence?, priority? }` |
| POST | `/api/proposals/generate` | Auto-generate proposals from current system state |
| GET | `/api/proposals` | List proposals. Query: `?status=pending&limit=20` |
| POST | `/api/proposals/:id/resolve` | Approve or reject. Body: `{ action: 'approve'|'reject', feedback? }` |
| POST | `/api/proposals/:id/approve-and-track` | Approve and auto-create a dispatch task from the proposal |

---

## Feed & Stream

| Method | Path | Description |
|---|---|---|
| GET | `/api/feed` | Raw feed events (JSONL). Query: `?limit=50&after=timestamp` |
| POST | `/api/feed` | Add a feed event. Body: `{ type, agent, summary, detail?, channel? }` |
| GET | `/api/stream` | Unified stream merging feed events + proposals. Returns typed items: completion, question, vault, error, proposal, activity |
| POST | `/api/stream/:id/action` | Take action on a stream item. Body: `{ action, message? }` |
| GET | `/api/events` | SSE endpoint for real-time event streaming |

---

## Timeline

| Method | Path | Description |
|---|---|---|
| GET | `/api/timeline` | Unified chronological view merging dispatch tasks, feed events, vault changes, and Discord activity. Query: `?limit=100&before=timestamp` |

---

## Agents

| Method | Path | Description |
|---|---|---|
| GET | `/api/agents/:id/activity` | Last 20 feed events for a specific agent |
| POST | `/api/agents/:id/stop` | Send stop signal for an agent |
| POST | `/api/agent/message` | Send message to an agent. Body: `{ agentId, message }` |
| POST | `/api/agent/chat` | Chat with an agent (request-response) |

---

## System (Operations Dashboard)

| Method | Path | Description |
|---|---|---|
| GET | `/api/system/overview` | System health: uptime, load averages, memory, disk, service statuses (openclaw-gateway, oauth-guardian, agent-os-bridge, bridge-sync) |
| GET | `/api/system/agents` | Dispatch queue + done counts per agent |
| GET | `/api/system/crons` | Crontab entries + systemd timers with schedules and last-run info |
| GET | `/api/system/services` | Systemd service statuses for key services |
| GET | `/api/system/logs` | Recent system logs. Query: `?service=name&lines=50` |
| GET | `/api/system/processes` | Running processes (ps-based) |
| GET | `/api/overview` | Redirect → `/api/system/overview` |

---

## Projects

| Method | Path | Description |
|---|---|---|
| GET | `/api/projects` | List projects. Auto-derives from dispatch data if no formal project files exist. Groups tasks by keyword patterns (agent-os, vault-knowledge, dispatch-v2, bridge-infra, security) |
| POST | `/api/projects` | Create/save a project. Body: `{ name, description, status?, ... }` |

---

## Missions (Goals & Hill Charts)

| Method | Path | Description |
|---|---|---|
| GET | `/api/missions` | All missions enriched with task cross-references, velocity, agent counts, milestones |
| GET | `/api/missions/:id` | Single mission with related tasks, vault notes, and activity timeline |
| POST | `/api/missions` | Create a mission/goal. Body: `{ title, description?, deadline?, category? }` |
| GET | `/api/missions/goals` | Raw goals from dispatch/goals directory |
| GET | `/api/missions/goals/archive` | Archived/completed goals |
| GET | `/api/missions/queue` | Queued mission tasks |
| GET | `/api/missions/done` | Completed mission tasks |
| GET | `/api/missions/failed` | Failed mission tasks |
| GET | `/api/missions/schedule` | Mission schedule/timeline |
| GET | `/api/missions/feed` | Mission-specific feed events |
| GET | `/api/missions/stats` | Aggregate statistics: total missions, completion rates, velocity trends |

---

## Plans (Kanban)

| Method | Path | Description |
|---|---|---|
| GET | `/api/plans` | List all plans (kanban boards) |
| POST | `/api/plans` | Create a plan. Body: `{ title, description? }` |
| GET | `/api/plans/:id` | Single plan detail |
| PUT | `/api/plans/:id` | Update plan metadata |
| DELETE | `/api/plans/:id` | Delete a plan |
| POST | `/api/plans/:id/tasks` | Add task to plan. Body: `{ title, description?, column? }` |
| PUT | `/api/plans/:id/tasks/:taskId` | Update plan task (move columns, edit) |
| DELETE | `/api/plans/:id/tasks/:taskId` | Remove task from plan |

---

## Life OS

### Dashboard

| Method | Path | Description |
|---|---|---|
| GET | `/api/life/dashboard` | Aggregated view: today's schedule, active goals, due reminders, energy trend, focus stats, brain dump count, initiatives |

### Goals & Schedule

| Method | Path | Description |
|---|---|---|
| GET | `/api/life/goals` | Personal goals with projects and tasks |
| GET | `/api/life/schedule` | Schedule blocks (calendar-like) |
| GET | `/api/life/reminders` | Active reminders with due dates |

### Energy & Focus

| Method | Path | Description |
|---|---|---|
| GET | `/api/life/energy` | Energy log readings (1-5 scale: energy, focus, mood) |
| POST | `/api/life/energy` | Log energy reading. Body: `{ energy, focus, mood, note? }` (1-5 each) |
| GET | `/api/life/focus` | Focus session data: current session, history, daily deep work minutes |
| POST | `/api/life/focus/start` | Start a focus session. Body: `{ task?, duration? }` (default 25min Pomodoro) |
| POST | `/api/life/focus/stop` | End current focus session. Body: `{ note? }` |

### Brain Dumps

| Method | Path | Description |
|---|---|---|
| GET | `/api/life/brain-dumps` | All brain dumps with processing status |
| POST | `/api/life/brain-dump` | Add brain dump. Body: `{ text }`. Broadcasts WebSocket event. |

---

## WebSocket Events

The bridge broadcasts JSON events to all connected WebSocket clients:

| Event Type | Trigger |
|---|---|
| `{ type: 'queue', action: 'new' }` | New dispatch task created |
| `{ type: 'task', action: 'approved' }` | Task moved to active |
| `{ type: 'task', action: 'cancelled' }` | Task cancelled |
| `{ type: 'proposal', action: 'new' }` | New proposal submitted |
| `{ type: 'proposal', action: 'resolved' }` | Proposal approved/rejected |
| `{ type: 'feed', action: 'new' }` | New feed event |
| `{ type: 'life', action: '*' }` | Life OS events (brain-dump, focus-start, focus-stop, energy) |
| `{ type: 'mission', action: 'created' }` | New mission/goal |
| `{ type: 'project', action: 'created' }` | New project saved |

## Related Notes

- [[Agent-OS-Overview]] — Architecture and page descriptions
- [[Agent-OS-Agent-Roster]] — Agent configuration and routing

---
title: "MCP Topology"
space: wiki
tags: ["architecture", "mcp", "integration", "verified-2026-04-06"]
source: manual
---

# MCP Topology

**Status:** Operational. EMA MCP server implements JSON-RPC 2.0 over stdio with 25 tools (17 core + 8 workspace) and 11 resources. Includes recursion guard, throttling, and cost tracking.
**Last verified:** 2026-04-06

## Architecture

Source: `daemon/lib/ema/mcp/server.ex`

The MCP server is a GenServer that owns a stdio port for line-based JSON-RPC 2.0 communication. It can run:

1. **Supervised inside the daemon** — started when `config :ema, :mcp_server, enabled: true`
2. **Standalone via Mix task** — `mix ema.mcp.stdio` or the `ema` escript

### Protocol Implementation

| Method | Purpose |
|--------|---------|
| `initialize` | Capabilities handshake. Advertises resources and tools. Protocol version `2024-11-05`. |
| `resources/list` | Returns all 11 MCP resources |
| `resources/read` | Fetches a specific resource by URI |
| `tools/list` | Returns 25 tools: 17 core from `Tools.list()` + 8 workspace tools (ema_orient, ema_phase_transition, ema_phase_status, ema_sprint_cycle, ema_workspace, ema_search, ema_decide, ema_dispatch) |
| `tools/call` | Invokes a tool with arguments |
| `notifications/cancelled` | Acknowledged, no action |

### Safety Features

**Recursion Guard** (`daemon/lib/ema/mcp/recursion_guard.ex`):
- ETS-backed depth tracking
- Tool calls include `x-mcp-depth` header on internal HTTP requests
- `resources/read` checks depth before fetching
- Prevents infinite loops when MCP tools call back into the daemon API

**Throttling:**
- Max 10 concurrent calls per source ID
- Returns JSON-RPC error `-32603` when exceeded

**Cost Tracking:**
- Every tool call logs to `/api/intelligence/mcp-calls` (fire-and-forget)
- Records: tool name, request ID, result, duration, depth, timestamp

## MCP Tools (25 total)

Source: `daemon/lib/ema/mcp/tools.ex` and `daemon/lib/ema/mcp/session_tools.ex`

### Core Tools (from `Ema.MCP.Tools`)

| Tool | Parameters | Description |
|------|-----------|-------------|
| `create_proposal` | title*, description*, project_id*, context_keys | Trigger the Proposal Pipeline. Returns proposal_id and streaming PubSub topic. |
| `create_task` | title*, description*, project_id*, goal_id, priority, estimated_time | Create a task under a project. |
| `update_task` | task_id*, status* (pending/active/done/blocked), notes | Update task status. Also fetches updated goal progress. |
| `query_vault` | query*, limit (default 5, max 20) | Semantic vault search. Degrades gracefully if vault unavailable. |
| `log_outcome` | task_id*, outcome* (success/failure/warning), feedback*, duration_seconds | Record outcome to tracker. Returns detected patterns. |
| `context_operator` | (none) | Fetch canonical operator context package from host EMA. |
| `context_project` | project* (id, slug, or name) | Fetch canonical project context package. Resolves project by ID/slug/name. |
| `bootstrap_status` | (none) | Fetch EMA bootstrap/readiness status. |
| `run_bootstrap` | (none) | Run onboarding/bootstrap sweep. |

### Intent Tools (from `Ema.MCP.Tools`)

| Tool | Parameters | Description |
|------|-----------|-------------|
| `ema_get_intents` | project_id, level (0-5), status, kind, limit (default 20) | List intents with filters. Returns serialized intents with level names. |
| `ema_create_intent` | title*, description, level (default 4), kind (default "task"), project_id, parent_id | Create intent in the hierarchy. Source type set to `"mcp"`. |
| `ema_get_intent_tree` | project_id | Get full nested intent hierarchy. |
| `ema_get_intent_context` | intent_id* | Get intent with links and lineage events. |
| `ema_attach_intent_actor` | intent_id*, actor_type*, actor_id* | Attach an actor (agent, user) to an intent. |
| `ema_attach_intent_execution` | intent_id*, execution_id* | Link an execution to an intent. |
| `ema_attach_intent_session` | intent_id*, session_id* | Link a Claude session to an intent. |
| `ema_get_intent_runtime` | intent_id* | Get runtime state for an intent (linked executions, sessions, actors). |

### Session Tools (from `Ema.MCP.SessionTools`)

| Tool | Parameters | Description |
|------|-----------|-------------|
| `ema_list_sessions` | active_only (boolean) | List all known Claude Code sessions. |
| `ema_spawn_session` | prompt*, project_slug, task_id, model (sonnet/opus/haiku), inject_context (default true) | Spawn a new Claude Code session with EMA context. |
| `ema_session_context` | project_slug | Get EMA context bundle for a project. |
| `ema_check_session` | session_id* | Check status and output of a session. |
| `ema_resume_session` | session_id*, prompt* | Send follow-up prompt, creates new session linked to same context. |
| `ema_kill_session` | session_id* | Kill a running CLI session. |

### Tool Routing

The server dispatches tools based on name:

- Intent tools (`ema_get_intents`, `ema_create_intent`, `ema_get_intent_tree`, `ema_get_intent_context`) → `Tools.call/3`
- Tools prefixed with `ema_` (other than intents) → `SessionTools.call/3`
- All other tools → `Tools.call/3`

All tool calls are wrapped in `RecursionGuard.with_depth_check/2`.

## MCP Resources (11 total)

Source: `daemon/lib/ema/mcp/resources.ex`

All resources are read-only. They fetch from the daemon REST API internally.

| URI | Name | Description |
|-----|------|-------------|
| `ema://context/operator` | Operator Context | Canonical operator context package |
| `ema://context/project` | Project Context | Project context package. Requires `?id=<project_id_or_slug>` |
| `ema://projects/active` | Active Projects | All active projects with goals, tasks, activity |
| `ema://tasks/pending` | Pending Tasks | Tasks that are blocked or waiting, with project/goal context |
| `ema://proposals/recent` | Recent Proposals | Last 5 approved proposals |
| `ema://bootstrap/status` | Bootstrap Status | Onboarding, provider, CLI tool readiness |
| `ema://focus/current` | Current Focus | Current focus session and timer state |
| `ema://vault/search` | Vault Search | Semantic vault search. Requires `?q=your+query` |
| `ema://intents/active` | Active Intents | Active intents (status=active, limit 20) |
| `ema://intents/tree` | Intent Tree | Full intent hierarchy. Supports `?project_id=X` |

Resources return structured JSON wrapped in MCP content format:
```json
{"contents": [{"uri": "ema://...", "mimeType": "application/json", "text": "..."}]}
```

On failure, resources return degraded responses with `"degraded": true` rather than errors.

## External MCP Servers

These are separate MCP servers configured in `~/.claude/settings.json` for Claude Code:

| Server | Transport | Purpose |
|--------|-----------|---------|
| **EMA MCP** | stdio via `mix ema.mcp.stdio` | Primary — tools and resources above |
| **Filesystem MCP** | stdio via `@modelcontextprotocol/server-filesystem` | Direct file access to `~/Projects` and vault |
| **QMD** | stdio | Semantic search over 1,860 markdown documents |
| **CodeGraphContext** | stdio via `cgc mcp start` | Code graph indexing, FalkorDB backend |

## File Paths

| File | Purpose |
|------|---------|
| `daemon/lib/ema/mcp/server.ex` | Main GenServer — stdio port, JSON-RPC dispatch |
| `daemon/lib/ema/mcp/tools.ex` | 17 tool definitions and handlers |
| `daemon/lib/ema/mcp/session_tools.ex` | 6 session orchestration tools |
| `daemon/lib/ema/mcp/resources.ex` | 11 resource definitions and readers |
| `daemon/lib/ema/mcp/protocol.ex` | JSON-RPC wire format (send_result, send_error) |
| `daemon/lib/ema/mcp/recursion_guard.ex` | ETS-backed depth tracking |
| `daemon/lib/ema/mcp/stdio_runner.ex` | Standalone stdio runner |
| `daemon/lib/mix/tasks/ema/mcp/stdio.ex` | Mix task entry point |

## Related

- [[EMA-Overview]]
- [[Intent-System]]
- [[Execution-System]]
- [[Proposal-Pipeline]]

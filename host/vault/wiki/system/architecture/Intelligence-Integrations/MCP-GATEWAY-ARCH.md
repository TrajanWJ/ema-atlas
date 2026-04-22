---
title: MCP Gateway Architecture
created: '2026-04-03'
updated: '2026-04-03'
type: knowledge
status: active
confidence: 0.82
tags:
  - mcp
  - gateway
  - superman
  - ema
  - tools
  - architecture
  - week-7
summary: >-
  EMA as MCP server exposing tools to Superman/Claude agents. Schema, caching,
  versioning, discovery. Sequence diagrams for tool load flow.
author: Security Agent (intelligence-integrations task)
wiki_id: system/architecture/Intelligence-Integrations/MCP-GATEWAY-ARCH
imported_from: vault/Architecture/Intelligence-Integrations/MCP-GATEWAY-ARCH.md
imported_at: '2026-04-04T00:23:56.759Z'
---

# MCP Gateway Architecture

> **Scope:** EMA exposing tools to Superman/Claude agents via MCP (Model Context Protocol).  
> **Status:** Bonus deliverable — spec-complete, implementation is Phase 2+.

---

## 1. What Is the MCP Gateway?

The **MCP Gateway** is an HTTP/stdio server inside the EMA daemon that exposes EMA's tools (vault search, task CRUD, proposal creation, project context, execution triggers) to Claude agents via the MCP protocol. When Superman or a Bridge-dispatched Claude agent needs to query EMA, it calls these tools rather than making raw HTTP API calls.

**Why MCP instead of raw HTTP?**
- Claude natively understands MCP tools. No custom parsing needed.
- Tool schemas are self-describing — the agent discovers capabilities dynamically.
- MCP tools appear in Claude's `tools` array at session init — no separate auth/discovery step.
- EMA can add/remove tools without changing the agent's hardcoded API calls.
- Citadel-style plugins (fleet, architect) already use this pattern.

---

## 2. Architecture Overview

```
┌───────────────────────────────────────────────────────────────────┐
│  EMA Daemon (localhost:4488)                                       │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  MCP Gateway (Ema.Claude.McpServer)                         │  │
│  │                                                             │  │
│  │  Transport: HTTP (port 4489) or stdio pipe                  │  │
│  │  Protocol:  MCP 2024-11-05 (tool discovery + call)          │  │
│  │                                                             │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │  Tool Registry (ETS, GenServer)                      │   │  │
│  │  │  - Tool definitions (schema, handler, version)       │   │  │
│  │  │  - Capability metadata (requires_project, slow, etc) │   │  │
│  │  │  - Cache: last_schema_hash, last_built               │   │  │
│  │  └─────────────────────────────────────────────────────┘   │  │
│  │                                                             │  │
│  │  ┌───────────────────┐  ┌─────────────────────────────┐   │  │
│  │  │  Tool Handlers    │  │  Auth Middleware             │   │  │
│  │  │  - vault_search   │  │  - Token validation          │   │  │
│  │  │  - task_create    │  │  - Per-tool rate limiting     │   │  │
│  │  │  - task_list      │  │  - Audit logging             │   │  │
│  │  │  - proposal_create│  │                             │   │  │
│  │  │  - project_context│  └─────────────────────────────┘   │  │
│  │  │  - exec_dispatch  │                                     │  │
│  │  │  - superman_search│                                     │  │
│  │  └───────────────────┘                                     │  │
│  └─────────────────────────────────────────────────────────────┘  │
│           ▲                    ▲                                   │
│           │ MCP over HTTP      │ MCP over stdio                    │
└───────────┼────────────────────┼───────────────────────────────────┘
            │                    │
    ┌───────┴────────┐  ┌────────┴────────┐
    │ Bridge-spawned │  │ Citadel plugins │
    │ Claude agents  │  │ (fleet/architect│
    │ (HTTP MCP)     │  │ via stdio)      │
    └────────────────┘  └─────────────────┘
```

---

## 3. Tool Schema Format

Each tool in the MCP Gateway has a standard schema definition:

```elixir
# Ema.Claude.Mcp.ToolDef struct
%ToolDef{
  # Required MCP fields
  name: "ema_task_create",
  description: "Create a new task in EMA. Returns the created task with ID.",
  input_schema: %{
    type: "object",
    properties: %{
      title: %{type: "string", description: "Task title"},
      project_id: %{type: "string", description: "EMA project ID"},
      status: %{
        type: "string", 
        enum: ["pending", "in_progress", "done", "blocked"],
        default: "pending"
      },
      agent_role: %{type: "string", description: "Which agent should handle this"}
    },
    required: ["title", "project_id"]
  },
  
  # EMA-specific metadata (not sent to agent, used by registry)
  version: "1.0",
  requires_project: true,
  is_destructive: false,
  is_slow: false,           # affects client-side timeout
  rate_limit_per_min: 20,
  tags: [:write, :tasks],
  handler_module: Ema.Claude.Mcp.Handlers.Tasks,
  handler_fn: :create
}
```

### Tool Registry Schema (ETS)

```
Table: :ema_mcp_tools
Key: tool_name (string)
Value: %ToolDef{}

Table: :ema_mcp_cache  
Key: :tools_list_hash
Value: {schema_hash, [%ToolDef{}], cached_at}
```

---

## 4. Tool Catalogue (Initial Set)

| Tool Name | Description | Destructive | Slow | Rate Limit |
|---|---|---|---|---|
| `ema_vault_search` | Semantic search over vault + Superman index | No | Yes (~200ms) | 30/min |
| `ema_project_context` | Full project context (Superman output) | No | Yes (~100ms) | 20/min |
| `ema_task_create` | Create a task | No | No | 20/min |
| `ema_task_list` | List tasks for project (with filters) | No | No | 60/min |
| `ema_task_update` | Update task status/notes | No | No | 30/min |
| `ema_proposal_create` | Create a new proposal | No | No | 10/min |
| `ema_proposal_list` | List proposals for project | No | No | 30/min |
| `ema_brain_dump` | Add item to brain dump | No | No | 60/min |
| `ema_execution_dispatch` | Dispatch an agent execution | **Yes** | No | 5/min |
| `ema_superman_search` | Query Superman vector index directly | No | Yes | 30/min |

**Destructive tools** require an additional `confirm: true` field in the input schema. The MCP auth middleware rejects destructive calls without the confirm flag.

---

## 5. Caching Strategy

### Why Cache?

Claude requests the tool list at session initialization (`initialize` request). This list is re-requested for every new Bridge session. Assembling the full tool schema from all handler modules is ~50ms of DB + code inspection work. Cache it.

### Cache Design

```elixir
defmodule Ema.Claude.Mcp.ToolCache do
  @table :ema_mcp_cache
  @ttl_seconds 300  # 5 minutes
  
  def get_tools_list() do
    case :ets.lookup(@table, :tools_list) do
      [{:tools_list, {tools, hash, cached_at}}] ->
        if cache_valid?(cached_at) do
          {:cached, tools, hash}
        else
          {:stale, build_tools_list()}
        end
      [] ->
        {:miss, build_tools_list()}
    end
  end
  
  def invalidate() do
    :ets.delete(@table, :tools_list)
  end
  
  defp build_tools_list() do
    tools = Ema.Claude.Mcp.ToolRegistry.all_tools()
    hash = tools_hash(tools)
    cached_at = DateTime.utc_now()
    :ets.insert(@table, {:tools_list, {tools, hash, cached_at}})
    {tools, hash}
  end
  
  defp cache_valid?(cached_at) do
    DateTime.diff(DateTime.utc_now(), cached_at, :second) < @ttl_seconds
  end
  
  defp tools_hash(tools) do
    tools
    |> Jason.encode!()
    |> then(&:crypto.hash(:sha256, &1))
    |> Base.encode16(case: :lower)
    |> String.slice(0, 8)
  end
end
```

**Cache invalidation triggers:**
- New tool registered or removed (via `ToolRegistry.register/1`)
- EMA daemon restart (ETS is cleared)
- Manual: `Ema.Claude.Mcp.ToolCache.invalidate()`
- TTL expiry (5 minutes)

---

## 6. Versioning

### Tool Versioning

Each tool carries a `version` field in its definition. Version is a semver string (`"1.0"`, `"1.1"`, `"2.0"`).

**Major version bump:** Breaking change in input_schema (removed/renamed required fields).  
**Minor version bump:** Backward-compatible change (new optional field, description update).

Version is included in the tools list response metadata:

```json
{
  "tools": [
    {
      "name": "ema_task_create",
      "description": "Create a new task in EMA",
      "inputSchema": { ... },
      "_ema_version": "1.0",
      "_ema_tags": ["write", "tasks"]
    }
  ],
  "_ema_gateway_version": "1.0",
  "_ema_schema_hash": "a3f8b1c2"
}
```

**Clients should:**
- Cache the `_ema_schema_hash` from the previous session
- On reconnect: compare hash; if changed, re-read tool definitions before dispatching
- Avoid hardcoding tool input shapes — always use the schema from the `initialize` response

### Gateway Versioning

The Gateway itself versions via its `initialize` response:

```json
{
  "protocolVersion": "2024-11-05",
  "capabilities": {
    "tools": { "listChanged": true }
  },
  "serverInfo": {
    "name": "ema-mcp-gateway",
    "version": "1.0.0"
  }
}
```

---

## 7. Sequence Diagrams

### 7.1 Tool Discovery (Session Init)

```
Claude (Bridge)          EMA MCP Gateway          Tool Registry / Cache
      │                        │                          │
      │  initialize request    │                          │
      ├───────────────────────►│                          │
      │                        │  get_tools_list()        │
      │                        ├─────────────────────────►│
      │                        │  {cached, tools, hash}   │
      │                        │◄─────────────────────────┤
      │  initialize response   │                          │
      │  {capabilities,        │                          │
      │   serverInfo}          │                          │
      │◄───────────────────────┤                          │
      │                        │                          │
      │  tools/list request    │                          │
      ├───────────────────────►│                          │
      │  tools/list response   │                          │
      │  {tools: [...],        │                          │
      │   _ema_schema_hash}    │                          │
      │◄───────────────────────┤                          │
      │                        │                          │
      │  [agent now knows all  │                          │
      │   available EMA tools] │                          │
```

### 7.2 Tool Call — Fast Path (vault search)

```
Claude (Bridge)          EMA MCP Gateway          Ema.Claude.Mcp.Handlers
      │                        │                          │
      │  tools/call            │                          │
      │  {name: "ema_vault_search",                       │
      │   input: {query: "JWT auth approach"}}            │
      ├───────────────────────►│                          │
      │                        │  rate limit check        │
      │                        │  auth check              │
      │                        │  dispatch to handler     │
      │                        ├─────────────────────────►│
      │                        │                          │  Superman.search("JWT auth approach")
      │                        │                          │  → [{title, excerpt, similarity}]
      │                        │◄─────────────────────────┤
      │  tools/call response   │                          │
      │  {content: [{          │                          │
      │    type: "text",       │                          │
      │    text: "Found 3 notes: ..."                     │
      │  }]}                   │                          │
      │◄───────────────────────┤                          │
```

### 7.3 Tool Call — Destructive Path (execution dispatch)

```
Claude (Bridge)          EMA MCP Gateway          Ema.Claude.Mcp.Handlers
      │                        │                          │
      │  tools/call            │                          │
      │  {name: "ema_execution_dispatch",                 │
      │   input: {             │                          │
      │     proposal_id: "p88",│                          │
      │     confirm: false     │ ← missing confirm flag   │
      │   }}                   │                          │
      ├───────────────────────►│                          │
      │                        │  is_destructive? → true  │
      │                        │  confirm flag? → false   │
      │  tools/call response   │                          │
      │  {isError: true,       │                          │
      │   content: "Destructive│                          │
      │   tool requires        │                          │
      │   confirm: true"}      │                          │
      │◄───────────────────────┤                          │
      │                        │                          │
      │  tools/call            │                          │
      │  {name: "ema_execution_dispatch",                 │
      │   input: {             │                          │
      │     proposal_id: "p88",│                          │
      │     confirm: true      │ ← with confirm flag      │
      │   }}                   │                          │
      ├───────────────────────►│                          │
      │                        │  audit log entry         │
      │                        │  dispatch to handler     │
      │                        ├─────────────────────────►│
      │                        │                          │  Ema.Executions.dispatch(p88)
      │                        │◄─────────────────────────┤
      │  tools/call response   │                          │
      │  {content: "Dispatched │                          │
      │   execution exec_99"}  │                          │
      │◄───────────────────────┤                          │
```

### 7.4 Schema Change Detection (Reconnect)

```
Claude (Bridge)          EMA MCP Gateway
  (reconnected)                │
      │                        │
      │  tools/list request    │
      │  X-Schema-Hash: a3f8b1c2 (previous hash)
      ├───────────────────────►│
      │                        │  current hash: x9z2k4m7 ← different!
      │  tools/list response   │
      │  {tools: [...updated], │
      │   _ema_schema_hash:    │
      │   "x9z2k4m7",          │
      │   _ema_schema_changed: │
      │   true}                │
      │◄───────────────────────┤
      │  [agent re-reads all   │
      │   tool definitions     │
      │   before proceeding]   │
```

---

## 8. MCP Server Implementation

```elixir
defmodule Ema.Claude.McpServer do
  @moduledoc """
  HTTP MCP server exposing EMA tools to Claude agents.
  Implements MCP 2024-11-05 protocol.
  Runs on port 4489 (separate from main EMA API on 4488).
  """
  
  use Plug.Router
  
  plug :match
  plug Plug.Parsers, parsers: [:json], json_decoder: Jason
  plug :dispatch
  
  post "/mcp" do
    case conn.body_params do
      %{"method" => "initialize"} -> handle_initialize(conn)
      %{"method" => "tools/list"} -> handle_tools_list(conn)
      %{"method" => "tools/call", "params" => params} -> handle_tool_call(conn, params)
      _ -> send_error(conn, -32601, "Method not found")
    end
  end
  
  defp handle_initialize(conn) do
    send_json(conn, 200, %{
      jsonrpc: "2.0",
      id: conn.body_params["id"],
      result: %{
        protocolVersion: "2024-11-05",
        capabilities: %{tools: %{listChanged: true}},
        serverInfo: %{name: "ema-mcp-gateway", version: "1.0.0"}
      }
    })
  end
  
  defp handle_tools_list(conn) do
    {tools, hash} = case Ema.Claude.Mcp.ToolCache.get_tools_list() do
      {:cached, tools, hash} -> {tools, hash}
      {_, {tools, hash}} -> {tools, hash}
    end
    
    send_json(conn, 200, %{
      jsonrpc: "2.0",
      id: conn.body_params["id"],
      result: %{
        tools: Enum.map(tools, &to_mcp_format/1),
        _ema_schema_hash: hash,
        _ema_gateway_version: "1.0.0"
      }
    })
  end
  
  defp handle_tool_call(conn, %{"name" => tool_name, "arguments" => args}) do
    with {:ok, tool_def} <- Ema.Claude.Mcp.ToolRegistry.get(tool_name),
         :ok <- check_rate_limit(tool_name, conn),
         :ok <- check_destructive(tool_def, args),
         :ok <- audit_log(tool_name, args, conn) do
      
      result = apply(tool_def.handler_module, tool_def.handler_fn, [args])
      
      send_json(conn, 200, %{
        jsonrpc: "2.0",
        id: conn.body_params["id"],
        result: %{
          content: [%{type: "text", text: format_result(result)}],
          isError: false
        }
      })
    else
      {:error, :rate_limited} ->
        send_error(conn, -32000, "Rate limit exceeded for #{tool_name}")
      {:error, :destructive_no_confirm} ->
        send_error(conn, -32000, "Destructive tool requires confirm: true in arguments")
      {:error, :not_found} ->
        send_error(conn, -32601, "Unknown tool: #{tool_name}")
    end
  end
  
  defp check_destructive(%{is_destructive: true}, args) do
    if Map.get(args, "confirm") == true do
      :ok
    else
      {:error, :destructive_no_confirm}
    end
  end
  defp check_destructive(_, _), do: :ok
  
  defp to_mcp_format(%{name: name, description: desc, input_schema: schema, version: v, tags: tags}) do
    %{
      name: name,
      description: desc,
      inputSchema: schema,
      _ema_version: v,
      _ema_tags: tags
    }
  end
end
```

### MCP Config for Claude Bridge

```json
// ema-mcp-tools.json (referenced by --mcp-config flag in Bridge)
{
  "mcpServers": {
    "ema": {
      "url": "http://localhost:4489/mcp",
      "headers": {
        "Authorization": "Bearer ${EMA_MCP_TOKEN}"
      }
    }
  }
}
```

---

## 9. Integration with Superman

Superman is not a separate MCP server — it's exposed as EMA tools:

```elixir
# ema_vault_search tool → calls Superman.search/2
# ema_project_context tool → calls Superman.Context.for_project/2
# ema_superman_search tool → calls Superman.VectorStore.search/2 directly

# Superman doesn't need to "receive" callbacks — it's called as a library
# by the MCP tool handlers. No separate service interface needed.
```

---

## 10. Phase Roadmap

| Phase | Component | When |
|---|---|---|
| MVP | Tool Registry + Cache + 5 core tools | Week 7-8 (if Bridge needs tools) |
| Phase 2 | Full tool catalogue (10 tools) + auth | Week 9 |
| Phase 2 | Schema versioning + hash validation | Week 9 |
| Phase 3 | Dynamic tool loading (skills register tools at runtime) | Week 11+ |
| Phase 3 | Tool composition (agent chains tools together) | Week 12+ |

**Week 7 verdict:** If the async Bridge (Sketch A) doesn't need agents to call back into EMA, defer MCP Gateway to Week 9. The Bridge can receive context via prompt injection (Superman context block) without needing dynamic tool calls. MCP Gateway becomes necessary when agents need to *write back* to EMA mid-execution (e.g., create tasks, update proposals from inside a Claude session).

---

*Cross-references: `EMA-Claude-Bridge-Design.md`, `superman-architecture.md`, `BRIDGE-ASYNC-PATTERN.md`*

---
title: EMA + OpenClaw Node Integration — Full Spec
created: '2026-04-03'
updated: '2026-04-03'
type: research
confidence: 0.92
tags:
  - ema
  - openclaw
  - node
  - integration
  - mcp
  - dispatch
  - superman
  - marriage
  - spaces
summary: >-
  OpenClaw as EMA node: 3 API endpoints to enable, exact HTTP contract for task
  dispatch + streaming, Superman vault bridge, Colanode as spaces reference
  implementation. Build order: HTTP endpoints first (30min), then Elixir client,
  then Superman vault reader.
related:
  - '[[System/FINAL-PASSOVER-2026-04-03]]'
  - '[[Projects/EMA-Phase-2-Corrected-Roadmap-2026-04-03]]'
  - '[[Research/EMA-Deep-Context-Synthesis-2026-04-03]]'
wiki_id: research/EMA-OpenClaw-Node-Integration-Spec-2026-04-03
imported_from: vault/Research/EMA-OpenClaw-Node-Integration-Spec-2026-04-03.md
imported_at: '2026-04-04T00:23:57.021Z'
---

# EMA + OpenClaw Node Integration — Full Specification

*2026-04-03 22:50Z | Synthesized from: gateway docs, openclaw.json, OPENCLAW-EMA-SYSTEM-MARRIAGE-DESIGN.md, EMA Full Integration Roadmap, node API docs*

---

## The Core Insight

OpenClaw is not a peer of EMA. It's a **registered node**. The marriage design doc frames them as equals — they're not. EMA is the control plane. OpenClaw is the most capable node on the network: it has 29 specialist agents, a vault, Discord integration, a session store, and a streaming Claude execution engine.

EMA calls OpenClaw's HTTP API. OpenClaw does the work. Results flow back. That's the relationship.

---

## What OpenClaw Currently Exposes (Real API, Not Design)

From the live gateway docs:

### 1. `POST /v1/chat/completions` (OpenAI-compatible)
- Disabled by default. One config change to enable.
- Route to any agent: `model: "openclaw:researcher"` or `x-openclaw-agent-id: researcher`
- Supports streaming (SSE) and non-streaming
- Auth: `Authorization: Bearer <token>` (gateway.auth.token)
- Session persistence: pass `user` field in request body → stable session key derived

### 2. `POST /tools/invoke`
- Always enabled (gated by auth + tool policy)
- Invoke any OpenClaw tool directly: `sessions_list`, `sessions_spawn`, `web_search`, `exec`, etc.
- Returns `{ok: true, result}` or error
- Hard-denies: `sessions_spawn`, `sessions_send`, `gateway`, `whatsapp_login` (by default)

### 3. Gateway config (live values)
```json
{
  "port": 18789,
  "bind": "lan",
  "auth": { "mode": "token", "token_set": true },
  "http": {}  // endpoints not yet enabled
}
```

**Current state:** The OpenAI-compatible endpoint is NOT enabled. Tools invoke IS enabled. To enable chat completions:

```json
{
  "gateway": {
    "http": {
      "endpoints": {
        "chatCompletions": { "enabled": true }
      }
    }
  }
}
```

---

## Integration Architecture (Corrected)

```
EMA Desktop (Tauri/React)
    ↕ WebSocket + REST
EMA Daemon (Elixir/Phoenix, localhost:4488)
    ├─ Superman.context_for(project_id) → [vault + task + proposal context]
    ├─ Ema.OpenClaw.Client (HTTP client module)
    │    ├─ dispatch_task(agent_id, prompt, context) → POST /v1/chat/completions
    │    ├─ dispatch_streaming(agent_id, prompt) → SSE stream
    │    ├─ invoke_tool(tool, args) → POST /tools/invoke
    │    └─ read_sessions() → POST /tools/invoke {tool: "sessions_list"}
    └─ Ema.Pipes ← OpenClaw events (future: webhook or polling)
         ↓ HTTP (localhost:18789, Authorization: Bearer <token>)
OpenClaw Gateway (Node on EMA network)
    ├─ 29 specialist agents (researcher, coder, architect, etc.)
    ├─ Vault at ~/vault/ (QMD semantic search)
    ├─ Discord channel integration
    └─ Session store (~/.openclaw/agents/<id>/sessions/)
```

---

## Section 1: The 3 Things To Enable First

### Step 1: Enable Chat Completions Endpoint (5 minutes)

```bash
# On agent-vm
openclaw config set gateway.http.endpoints.chatCompletions.enabled true
openclaw gateway restart
```

Verify:
```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H "Authorization: Bearer $(cat ~/.openclaw/openclaw.json | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["gateway"]["auth"]["token"])')" \
  -H 'Content-Type: application/json' \
  -d '{"model": "openclaw:researcher", "messages": [{"role":"user","content":"ping"}]}'
```

### Step 2: Build `Ema.OpenClaw.Client` (2 hours)

```elixir
defmodule Ema.OpenClaw.Client do
  @moduledoc "HTTP client for OpenClaw gateway on agent-vm"
  
  @gateway_url "http://192.168.122.10:18789"  # agent-vm on LAN
  # Alternatively: localhost:18789 if EMA daemon runs on same machine
  
  defp auth_header do
    token = Application.get_env(:ema, :openclaw_gateway_token)
    [{"Authorization", "Bearer #{token}"}]
  end
  
  @doc "Dispatch a task to a specific OpenClaw agent. Returns full response."
  def dispatch_task(agent_id, prompt, context \\ %{}) do
    body = %{
      model: "openclaw:#{agent_id}",
      messages: [
        %{role: "system", content: build_context_block(context)},
        %{role: "user", content: prompt}
      ],
      user: "ema-dispatch-#{agent_id}"  # stable session key for this agent
    }
    
    case Req.post("#{@gateway_url}/v1/chat/completions",
      json: body,
      headers: auth_header(),
      receive_timeout: 120_000  # 2 min timeout for long tasks
    ) do
      {:ok, %{status: 200, body: resp}} ->
        content = get_in(resp, ["choices", Access.at(0), "message", "content"])
        {:ok, content}
      {:ok, %{status: status, body: body}} ->
        {:error, {status, body}}
      {:error, reason} ->
        {:error, reason}
    end
  end
  
  @doc "Stream a task to an agent. Yields chunks via callback."
  def dispatch_streaming(agent_id, prompt, on_chunk) do
    body = %{
      model: "openclaw:#{agent_id}",
      stream: true,
      messages: [%{role: "user", content: prompt}]
    }
    
    Req.post!("#{@gateway_url}/v1/chat/completions",
      json: body,
      headers: auth_header(),
      into: fn {:data, chunk}, acc ->
        # Parse SSE: "data: {...}\n\n" 
        chunk
        |> String.split("\n")
        |> Enum.each(fn line ->
          case line do
            "data: [DONE]" -> :done
            "data: " <> json ->
              case Jason.decode(json) do
                {:ok, event} ->
                  content = get_in(event, ["choices", Access.at(0), "delta", "content"])
                  if content, do: on_chunk.(content)
                _ -> :skip
              end
            _ -> :skip
          end
        end)
        {:cont, acc}
      end
    )
  end
  
  @doc "Invoke a single OpenClaw tool. Returns result directly."
  def invoke_tool(tool, args \\ %{}, session_key \\ nil) do
    body = %{
      tool: to_string(tool),
      args: args,
      sessionKey: session_key || "main"
    }
    
    case Req.post("#{@gateway_url}/tools/invoke",
      json: body,
      headers: auth_header()
    ) do
      {:ok, %{status: 200, body: %{"ok" => true, "result" => result}}} ->
        {:ok, result}
      {:ok, %{status: 404}} ->
        {:error, :tool_not_allowed}
      {:ok, %{status: status, body: body}} ->
        {:error, {status, body}}
      {:error, reason} ->
        {:error, reason}
    end
  end
  
  @doc "List all active OpenClaw sessions."
  def list_sessions do
    invoke_tool("sessions_list", %{})
  end
  
  @doc "Search the vault via OpenClaw's QMD semantic search."
  def vault_search(query, limit \\ 5) do
    # Use exec tool to run qmd search on agent-vm
    invoke_tool("exec", %{
      command: "qmd search #{inspect(query)} --limit #{limit} --format json",
      workdir: "/home/trajan/vault"
    })
  end
  
  defp build_context_block(%{} = context) when map_size(context) == 0, do: ""
  defp build_context_block(context) do
    """
    [EMA Context]
    Project: #{Map.get(context, :project_name, "Unknown")}
    Goal: #{Map.get(context, :project_goal, "Not specified")}
    
    Recent Tasks:
    #{format_list(Map.get(context, :recent_tasks, []))}
    
    Recent Proposals:
    #{format_list(Map.get(context, :recent_proposals, []))}
    """
  end
  
  defp format_list([]), do: "(none)"
  defp format_list(items), do: Enum.map_join(items, "\n", &"- #{&1}")
end
```

### Step 3: Wire Into Superman Context

```elixir
# In Superman.context_for/2 — add OpenClaw vault context
def context_for(project_id, opts \\ []) do
  project = Projects.get(project_id)
  
  # Local EMA data (fast, always available)
  local_context = %{
    recent_tasks: Tasks.recent(project_id, limit: 5),
    recent_proposals: Proposals.recent(project_id, limit: 3),
    last_execution: Executions.last(project_id)
  }
  
  # OpenClaw vault context (optional, async, ~200ms)
  vault_context = 
    if opts[:include_vault] do
      case OpenClaw.Client.vault_search(project.name) do
        {:ok, results} -> results
        _ -> []
      end
    else
      []
    end
  
  # Merge and format
  %Superman.Context{
    project: project,
    local: local_context,
    vault: vault_context
  }
end
```

---

## Section 2: Dispatch Flow (End to End)

```
User in EMA HQ clicks "Dispatch to Researcher"
    ↓
EMA.Tasks.dispatch(task_id, agent_id: "researcher")
    ↓
Ema.Executions.create(%{task_id, agent_id: "researcher", status: "pending"})
    ↓ (async Task.start)
Superman.context_for(project_id)
    ↓
Ema.OpenClaw.Client.dispatch_streaming("researcher", prompt_with_context, fn chunk ->
  Phoenix.PubSub.broadcast("executions:#{execution_id}", {:chunk, chunk})
end)
    ↓ (SSE stream while agent thinks)
HQ Dispatch Board shows live stream via Phoenix Channels
    ↓ (agent completes)
Ema.Executions.update(execution_id, %{status: "complete", result: full_text})
    ↓
Phoenix.PubSub.broadcast("executions:all", {:execution_updated, execution})
    ↓
HQ Dispatch Board shows ✅ Complete
```

**Key:** EMA doesn't wait. The streaming bridge means the user sees live output while the agent thinks — the same UX as watching Claude Code work in terminal, but inside the EMA HQ UI.

---

## Section 3: Agent Roster Mapping

The 29 OpenClaw agents map to EMA dispatch intents:

| Intent | OpenClaw Agent | Notes |
|---|---|---|
| Research | `researcher` | Web search + vault + synthesis |
| Build/Code | `coder` or `claude-code` | File edits, implementations |
| Architecture | `architect` | Design docs, trade-off analysis |
| Review/QA | `devils-advocate` | Critical review, challenge assumptions |
| Security | `security` | Audit, CVE check |
| Strategy | `strategist` | Goal decomposition, prioritization |
| Voice/UX | `jarvis` | Natural language, user-facing copy |
| Ops | `ops` | Infrastructure, deployment |
| Prompts | `prompt-engineer` | Prompt optimization |

**The `universal-orchestrator` agent is interesting** — it likely routes between the others. This could be the single dispatch endpoint for EMA: send all tasks to `universal-orchestrator` with intent metadata and let it route.

---

## Section 4: What Needs Research Still — The Non-AI Piece

Trajan's intent: **"lock in on the non-AI piece: self-host infrastructure, p2p network, spaces, everything else"**

From the vault and design docs, the spaces/p2p architecture is defined but not deeply researched. Here's what I found vs what I need to find:

### What's Designed

From `Trajan-Network-Architecture` and `Master System Overview`:
- **Spaces** — personal/org/shared/public with different trust levels
- **Mesh network** — WireGuard tunnels, Tailscale for connectivity
- **P2P sync** — CRDT-based, Loro for vault tree sync, any-sync for protocol
- **Pier** — local node daemon, runs on every device

### What's Missing From Research

**Colanode as reference implementation** — the channel messages confirm this is the key reference for Spaces. Let me extract the architecture.

**From the Colanode fetch:**
- Local-first: changes write to SQLite first, then sync to server
- **Yjs CRDTs** for real-time collaborative documents (not Loro — this is the divergence point)
- Client connects to multiple servers — one app, many workspaces
- Tech: self-hosted server (Node.js?) + desktop client (Electron/Tauri?)

**Decision needed:** Loro vs Yjs for the spaces sync layer.

| | Loro | Yjs |
|---|---|---|
| Language | Rust (WASM for JS) | JavaScript/TypeScript |
| Moveable Tree CRDT | ✅ First class | ❌ No native support |
| Adoption | Growing, newer | Battle-tested, Colanode uses it |
| Time travel | ✅ Built in | ❌ Limited |
| Performance | Better (Rust) | Good |
| Self-hosted example | No reference implementation | Colanode |

**Assessment:** For vault sync (directory trees with move/rename conflicts), **Loro wins** — Moveable Tree CRDT is the right primitive. For collaborative documents (Second Brain notes), **Yjs wins** by adoption and battle-testing. Use both: Loro for vault hierarchy, Yjs for document content.

---

## Section 5: Colanode Architecture — What to Steal

From the fetch: Colanode is open-source, local-first Slack + Notion alternative, self-hosted.

**Architecture pattern:**
- Client (web or desktop) + Server (self-hostable)
- **One app, multiple servers** — user connects to as many workspaces/servers as they want
- Local SQLite writes first, background sync to server
- Yjs for real-time collaborative content
- Apache 2.0 license — full freedom to study and borrow

**What EMA should steal:**
1. **Multi-server connection model** — EMA client connects to multiple EMA workspaces (personal + shared + org). Same pattern as Colanode.
2. **Local-write-first pattern** — Every EMA operation writes SQLite first, then syncs. This is the right default for a desktop app.
3. **Workspace isolation** — different trust levels (personal vs. org) are different servers, not different database schemas on the same server.
4. **The sync background process** — a GenServer that handles the sync loop: read pending local writes, push to server, pull remote changes, resolve conflicts.

**Colanode repo:** `github.com/colanode/colanode` — read their sync engine before designing EMA's.

---

## Section 6: The Full Spaces Architecture (First Pass)

Based on all sources: Master System Overview, Trajan-Network docs, any-sync, Colanode patterns.

### Spaces Model

```
Personal Space (Trajan's local EMA)
├─ Projects/
├─ Vault/ (Obsidian notes)
├─ Tasks/
└─ Executions/

Org Space (shared with collaborators — future)
├─ Shared Projects/
├─ Shared Channels/
└─ Shared Databases/

Agent Space (OpenClaw agents + EMA agents)
├─ active sessions
├─ dispatches in flight
└─ results
```

**Personal Space is local-first, single-device.** No sync needed right now. Tauri + SQLite. Already built.

**Agent Space is the first shared space.** EMA daemon ↔ OpenClaw gateway. Already designed above. This is Week 7.

**Org Space is Phase B.** Requires: server infrastructure, user auth, Yjs/Loro sync. This is Week 9+.

### Transport Layer

For local-to-gateway communication (EMA ↔ OpenClaw on agent-vm):
- **Current:** SSH tunnel or LAN (gateway bind=lan, EMA on same LAN)
- **Phase A:** WireGuard mesh (agent-vm already on same machine — this is trivial, localhost)
- **Phase B:** Tailscale or any-sync for multi-device, multi-user

Note: The OpenClaw gateway is already `bind: lan`, accessible at `192.168.122.10:18789` from FerrissesWheel. No WireGuard needed for Phase A — it's LAN.

### Pier (Local Node Daemon)

From the Master System Overview, Pier is the daemon that runs on every device in the network. In the current stack:
- **EMA daemon** = Pier for FerrissesWheel (the workstation)
- **OpenClaw gateway** = Pier for agent-vm
- **Future:** Pier on mobile (iOS/Android via OpenClaw companion), Pier on VPS

Pier responsibilities:
1. Local data store (SQLite for EMA, JSONL sessions for OpenClaw)
2. Sync engine (push/pull with peer Piers)
3. Tool execution (exec, web_search, etc. — whatever the device can do)
4. Routing table (knows other Piers, their capabilities, trust levels)

---

## Section 7: Cross-Pollination Table (New Additions)

| From | To EMA | What | Action |
|---|---|---|---|
| OpenClaw `/v1/chat/completions` (streaming) | EMA dispatch | Streaming task dispatch with live HQ feed | Enable endpoint + build `Ema.OpenClaw.Client` |
| OpenClaw `/tools/invoke` | Superman vault read | QMD search via `exec` tool call | Wire into `Superman.context_for/2` |
| Colanode multi-server model | EMA Spaces | One EMA client connects to multiple workspaces | Read their sync engine before designing |
| Colanode local-write-first | EMA operations | SQLite before network, always | Already EMA pattern — validate against Colanode's conflict resolution |
| Yjs (Colanode) | EMA Second Brain | Real-time collaborative document editing | Use Yjs for document content, Loro for tree hierarchy |
| Loro Moveable Tree | Vault sync Phase B | Directory move/rename CRDTs | Use for vault hierarchy, not document content |
| any-sync protocol | Pier mesh Phase B | P2P encrypted sync without central server | Read spec before designing Pier ↔ Pier protocol |
| Loomkin Living Plans | Campaign.Flow | Campaigns are mutable, agent-negotiated | Campaign plans mutate, all mutations go to decision graph |
| universal-orchestrator agent | EMA dispatch router | Single dispatch target, auto-routes | Test: send all EMA dispatches to universal-orchestrator |

---

## Section 8: Build Order — This Week vs. Later

### This Session / Today

1. **Enable chat completions** in OpenClaw gateway (5 min, one config change)
2. **Build `Ema.OpenClaw.Client`** (2-3 hours) — Req-based HTTP client, dispatch + streaming + tools invoke
3. **Wire into EMA daemon** — add to `Application.ex` children, config `OPENCLAW_GATEWAY_TOKEN` env
4. **Test the loop** — EMA dispatch → researcher agent → response back → execution log

### Week 7

5. **Superman vault bridge** — `OpenClaw.Client.vault_search/2` wired into `context_for/2`
6. **Streaming HQ** — Phoenix PubSub broadcasting chunks, HQ Dispatch Board receiving via WebSocket
7. **Campaign.Flow struct** — State machine for multi-step campaigns
8. **`/api/projects/:id/context` endpoint** — Phase 1 (SQLite-only)

### Week 8

9. **Honcho Docker up** — 4-service self-hosted stack (vault Docker Compose already written)
10. **EMA Claude Bridge** — Port subprocess + stream parser (replaces System.cmd)
11. **Loomkin 7-node decision graph** as Ecto schemas in Superman
12. **Colanode sync engine study** → design EMA workspace sync

### Week 9+ (Phase B)

13. **Org Spaces** — multi-user, server-side, Yjs for documents
14. **Loro vault hierarchy sync** — multi-device vault tree
15. **Pier daemon** — unified node abstraction
16. **any-sync protocol** for P2P mesh

---

## Sources

1. [T1] Local: `openclaw.json` — gateway live config (bind=lan, auth=token, port=18789)
2. [T1] Local: `/usr/lib/node_modules/openclaw/docs/gateway/openai-http-api.md` — exact API contract
3. [T1] Local: `/usr/lib/node_modules/openclaw/docs/gateway/tools-invoke-http-api.md` — tools invoke API
4. [T1] Local: `/usr/lib/node_modules/openclaw/docs/nodes/index.md` — node architecture
5. [T1] Local: `main/workspace/OPENCLAW-EMA-SYSTEM-MARRIAGE-DESIGN.md` — system marriage design
6. [T1] Local: `vault/Architecture/EMA Full Integration Roadmap.md` — 6-phase roadmap
7. [T1] Local: `vault/Architecture/Intelligence-Integrations/integration-framework.md` — provider behaviour
8. [T1] Local: `main/workspace/EMA-CLI-SPECIFICATION.md` — CLI spec with `ema sync` command group
9. [T2] GitHub: colanode/colanode — multi-server, local-first, Yjs CRDTs, self-hosted reference
10. [T1] Research: `EMA-Deep-Context-Synthesis-2026-04-03.md` — prior synthesis (Loomkin, Loro, etc.)

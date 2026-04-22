---
id: "63f5ca30-e2e6-4219-abc7-5cb61719ae9f"
title: "EMA MCP System Architecture"
space: projects
tags: ["ema"]
source: manual
---

# EMA + MCP System Architecture
## AI-Driven Development Platform

**Created:** 2026-04-03  
**Status:** Design Proposal  
**Author:** Right Hand (Architecture Subagent)

---

## 0. Executive Summary

EMA becomes the sovereign execution and tracking hub for all development work. MCP is the nervous system that connects three separate systems — OpenClaw (agent VM), EMA (desktop app/daemon on host), and the Obsidian vault — into one unified AI-driven development platform.

The key insight: **Claude Code is the intelligence layer, EMA is the accountability layer, and MCP is the protocol that makes them peers rather than a hierarchy.**

---

## 1. System Overview: The Three Nodes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TOPOLOGY OVERVIEW                                  │
│                                                                             │
│  ┌──────────────────────────┐         ┌──────────────────────────────────┐  │
│  │    AGENT VM (192.168.122.10)        │    HOST (FerrissesWheel)         │  │
│  │                          │         │                                  │  │
│  │  ┌─────────────────────┐ │         │  ┌──────────────────────────┐   │  │
│  │  │   OpenClaw Gateway  │ │  SSH    │  │      EMA Desktop App     │   │  │
│  │  │   (Node.js)         │◄├─────────┼─►│      (Tauri + React)     │   │  │
│  │  │   Port: 18789        │ │         │  │      Daemon: :4488        │   │  │
│  │  └────────┬────────────┘ │         │  └──────────┬───────────────┘   │  │
│  │           │               │         │             │                    │  │
│  │  ┌────────▼────────────┐ │  HTTP   │  ┌──────────▼───────────────┐   │  │
│  │  │  Vault MCP Server   │◄├─────────┼─►│   EMA Core MCP Server    │   │  │
│  │  │  (Node.js, :4491)   │ │         │  │   (Node.js, :4489)        │   │  │
│  │  │                     │ │         │  │   (also stdio mode)       │   │  │
│  │  │  Tools:             │ │         │  │                           │   │  │
│  │  │  • vault.search     │ │         │  │  Tools:                   │   │  │
│  │  │  • vault.read       │ │         │  │  • ema.project.*          │   │  │
│  │  │  • vault.write      │ │         │  │  • ema.task.*             │   │  │
│  │  │  • vault.backlinks  │ │         │  │  • ema.proposal.*         │   │  │
│  │  │  • vault.graph      │ │         │  │  • ema.quality_gate.run   │   │  │
│  │  └─────────────────────┘ │         │  │  • ema.brain_dump.capture │   │  │
│  │                          │         │  │  • ema.campaign.*         │   │  │
│  │  ┌─────────────────────┐ │         │  │  • ema.vault.*  (wiki)    │   │  │
│  │  │  OpenClaw MCP Server│ │         │  └──────────┬───────────────┘   │  │
│  │  │  (internal)         │ │         │             │                    │  │
│  │  │  Tools:             │ │         │  ┌──────────▼───────────────┐   │  │
│  │  │  • openclaw.discord │ │         │  │   Claude Code CLI        │   │  │
│  │  │  • openclaw.spawn   │ │         │  │   ~/.claude/settings.json│   │  │
│  │  │  • openclaw.memory  │ │         │  │                          │   │  │
│  │  └─────────────────────┘ │         │  │   MCP Clients:           │   │  │
│  │                          │         │  │   • ema-core  → :4489    │   │  │
│  │  /home/trajan/vault/     │         │  │   • ema-wiki  → :4489    │   │  │
│  │  qmd search              │         │  │   • vault     → :4491    │   │  │
│  └──────────────────────────┘         │  └──────────────────────────┘   │  │
│                                       │                                  │  │
│                                       │  ~/Desktop/Coding/Projects/      │  │
│                                       │  ~/.local/share/ema/ema.db       │  │
│                                       │  ~/.local/share/ema/vault/       │  │
│                                       └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. MCP Server Inventory

### 2.1 EMA Core MCP Server

**Location:** Host machine, `~/Projects/ema/daemon/priv/mcp/ema-core-mcp-server.js`  
**Transport:** HTTP (port 4489) + stdio (for Claude Code config)  
**Lifetime:** Long-lived — managed by EMA daemon process (started with `mix phx.server`, or via `launchd` / systemd-on-host)  
**Depends on:** EMA Phoenix daemon at `localhost:4488`

This is the **expansion** of the existing `wiki-mcp-server.js`. The wiki server becomes a subset of the core server, which exposes the full EMA domain model.

**MCP Resources (read-only, browseable):**

| Resource URI | Description |
|---|---|
| `ema://projects` | List of all EMA projects |
| `ema://projects/{id}` | Single project with linked tasks, campaigns, notes |
| `ema://tasks?project={id}&status={s}` | Task list with filtering |
| `ema://proposals?status={s}` | Proposals queue |
| `ema://proposals/{id}` | Single proposal with history |
| `ema://campaigns/{id}` | Campaign with sessions, discoveries |
| `ema://wiki/{path}` | Wiki note content |
| `ema://brain-dump/inbox` | Current unprocessed brain dump items |

**MCP Tools (actions):**

| Tool | Description | Parameters |
|---|---|---|
| `ema.project.create` | Create a new project | `name, description, path, context_doc?` |
| `ema.project.get_context` | Get full project context (tasks + proposals + campaigns + recent sessions) | `project_id` |
| `ema.task.create` | Create a task linked to a project | `project_id, title, description, priority?, agent?` |
| `ema.task.complete` | Mark task complete with outcome | `task_id, outcome, artifacts?` |
| `ema.task.update` | Update task status/details | `task_id, ...fields` |
| `ema.proposal.submit` | Submit a proposal for review | `project_id, title, content, proposal_type` |
| `ema.proposal.evaluate` | Run quality gate on a proposal | `proposal_id` |
| `ema.proposal.accept` | Accept a proposal, trigger next step | `proposal_id, notes?` |
| `ema.proposal.reject` | Reject with feedback | `proposal_id, reason, revise_prompt?` |
| `ema.quality_gate.run` | Run QG against any content | `content, gate_type, context?` |
| `ema.campaign.start` | Start a named campaign for a project | `project_id, slug, goal, context?` |
| `ema.campaign.record_discovery` | Add a learning to a campaign | `campaign_id, discovery_type, content` |
| `ema.brain_dump.capture` | Drop item into inbox | `content, source?, tags?` |
| `ema.wiki.search` | Search wiki/vault | `query, space?, limit?` |
| `ema.wiki.get` | Retrieve note by path | `path` |
| `ema.wiki.create` | Create a wiki note | `path, title, content, space?, tags?` |
| `ema.wiki.update` | Update a wiki note | `path, content` |
| `ema.session.link` | Link a Claude Code session to a project | `session_id, project_id` |
| `ema.session.get_recent` | Get recent sessions for a project | `project_id, limit?` |

---

### 2.2 Vault MCP Server (VM-side)

**Location:** VM, `~/bin/vault-mcp-server.js` (new — ~150 lines)  
**Transport:** HTTP (port 4491)  
**Lifetime:** Long-lived — systemd service `vault-mcp.service`  
**Depends on:** QMD index, `/home/trajan/vault/` filesystem

This server exposes the VM-side Obsidian vault with semantic search via `qmd`. It's separate from EMA's wiki because:
1. The Obsidian vault lives on the VM; EMA's wiki lives on the host
2. QMD provides activated/semantic search that EMA's sqlite FTS can't match
3. Cross-machine access requires HTTP, not subprocess

**MCP Tools:**

| Tool | Description | Parameters |
|---|---|---|
| `vault.search` | QMD semantic search with activation scoring | `query, limit?, zone?` |
| `vault.read` | Read a note by path | `path` |
| `vault.write` | Write/update a note | `path, content, create_if_missing?` |
| `vault.backlinks` | Find all notes linking to a note | `path` |
| `vault.graph_neighbors` | Get connected notes (1-2 hops) | `path, depth?` |
| `vault.daily_note` | Get or create today's daily note | `date?` |
| `vault.entity_search` | Search extracted entities (neo4j/ontology) | `entity_type, query` |

---

### 2.3 OpenClaw MCP Server (Internal)

**Location:** VM, built into OpenClaw Gateway  
**Transport:** stdio (for local Claude Code on VM via `/usr/bin/claude`)  
**Lifetime:** Same lifetime as OpenClaw Gateway

This server is not external — it's the MCP layer OpenClaw exposes for agents running inside it. It's the bridge between Claude Code sessions spawned on the VM and OpenClaw's capabilities.

**MCP Tools:**

| Tool | Description |
|---|---|
| `openclaw.discord.send` | Post message to Discord channel |
| `openclaw.discord.read` | Read recent messages from channel |
| `openclaw.spawn_agent` | Spawn a specialist agent (returns session_id) |
| `openclaw.memory.read` | Read from MEMORY.md, daily notes |
| `openclaw.memory.write` | Append to today's daily note |
| `openclaw.vault.search` | Proxies to Vault MCP Server |

---

## 3. Connection Diagram

### How Claude Code Connects to MCP Servers

**Host Claude Code** (`~/.claude/settings.json` on FerrissesWheel):

```json
{
  "mcpServers": {
    "ema-core": {
      "command": "node",
      "args": ["/home/trajan/Projects/ema/daemon/priv/mcp/ema-core-mcp-server.js"],
      "env": {
        "EMA_BASE_URL": "http://localhost:4488"
      }
    },
    "vault-vm": {
      "command": "ssh",
      "args": [
        "-T", "agent-vm",
        "node /home/trajan/bin/vault-mcp-server.js --stdio"
      ]
    }
  }
}
```

> **Note on transport:** Claude Code spawns MCP servers via stdio. For the vault server on the VM, we pipe stdio through SSH. Alternatively, Claude Code can connect to HTTP MCP servers if the server runs `--http` mode — then the config uses `"url": "http://agent-vm:4491"` instead. HTTP mode is simpler for the SSH-over-network topology.

**HTTP mode (cleaner for cross-machine):**

```json
{
  "mcpServers": {
    "ema-core": {
      "url": "http://localhost:4489",
      "transport": "streamable-http"
    },
    "vault-vm": {
      "url": "http://192.168.122.10:4491",
      "transport": "streamable-http"
    }
  }
}
```

The EMA wiki-mcp-server.js already supports `--http [port]` mode with `StreamableHTTPServerTransport`. The vault server will mirror this pattern.

### How EMA Daemon Accesses the Vault (VM)

EMA's Phoenix daemon calls the Vault MCP Server over HTTP when it needs vault context for proposals or quality gates:

```elixir
# In lib/ema/vault_bridge.ex
def search_vault(query, opts \\ []) do
  url = Application.get_env(:ema, :vault_mcp_url, "http://192.168.122.10:4491")
  body = %{
    jsonrpc: "2.0",
    method: "tools/call",
    params: %{
      name: "vault.search",
      arguments: %{query: query, limit: Keyword.get(opts, :limit, 5)}
    },
    id: :erlang.unique_integer([:positive])
  }
  HTTPoison.post!("#{url}/mcp", Jason.encode!(body), [{"Content-Type", "application/json"}])
end
```

### How OpenClaw VM Agent Accesses EMA

Right Hand and specialists running on the VM can call EMA via HTTP REST (already working) or via the EMA Core MCP Server's HTTP mode:

```bash
# Direct REST (already works)
curl http://host-machine:4488/api/proposals

# Via MCP HTTP (new, standardized)
curl -X POST http://host-machine:4489/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"ema.proposal.submit",...}}'
```

---

## 4. AI-Linked Development Loop (Protocol Design)

### 4.1 The Full Loop

```
Discord: "Refactor the auth module in Proslync"
  │
  ▼
[Right Hand on VM]
  ├─ Creates EMA project context (if not exists): ema.project.create
  ├─ Creates a proposal request: ema.proposal.submit
  │   type: "code_proposal", status: "pending_generation"
  └─ Dispatches to Coder specialist

[Coder on VM → host-claude.sh on Host]
  ├─ Claude Code runs in ~/Desktop/Coding/Projects/proslync
  ├─ Claude Code has MCP access to:
  │   • ema-core: reads project context, prior proposals, constraints
  │   • vault-vm: reads architecture decisions, coding conventions
  ├─ Generates proposal: code diff + rationale + risk analysis
  └─ Calls ema.proposal.submit with generated content

[EMA Quality Gate — AUTOMATED, no Claude recursion]
  ├─ Deterministic checks first (fast path):
  │   • Does the diff compile? (run tsc/mix compile)
  │   • Does it touch files not in project scope?
  │   • Token cost estimate within budget?
  │   • Passes governance audit (no forbidden patterns)?
  ├─ If deterministic checks pass → run LLM quality gate
  │   • Uses SEPARATE Claude invocation with NO MCP tools
  │   • Evaluates: correctness, completeness, risks
  │   • Returns: score (0-1), concerns, revise_prompt (if failed)
  └─ If score < threshold:
      → ema.proposal.reject with revise_prompt
      → Coder receives feedback, revises, resubmits (max 3 loops)

[Proposal Accepted]
  ├─ ema.campaign.start (if not exists) for this project
  ├─ Creates implementation tasks: ema.task.create (one per change area)
  └─ Dispatches implementation agent

[Implementation Agent on Host]
  ├─ Claude Code implements the proposal
  ├─ Runs tests, fixes failures
  ├─ Records discoveries: ema.campaign.record_discovery
  │   • "auth module uses bcrypt 3.x, incompatible with argon2"
  │   • "test suite requires DATABASE_URL env var"
  └─ Calls ema.task.complete with outcome + artifacts

[EMA Outcome Tracking]
  ├─ Updates task/campaign status
  ├─ Writes vault learning note: vault.write
  │   "vault/Sessions/2026-04-03-proslync-auth-refactor.md"
  └─ Broadcasts event via Phoenix PubSub

[Next Request Context]
  ├─ When next request arrives for Proslync:
  ├─ ema.project.get_context returns:
  │   • Active campaign discoveries
  │   • Recent session outcomes
  │   • Accepted/rejected proposal history
  └─ Claude Code prompt is enriched with this context automatically
```

### 4.2 Request/Response Protocol (MCP Tool Format)

Every interaction in the AI dev loop uses standard MCP JSON-RPC 2.0:

**Proposal Submission:**
```json
// Request
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "ema.proposal.submit",
    "arguments": {
      "project_id": "proj_proslync_123",
      "title": "Refactor auth module — replace bcrypt with argon2id",
      "content": "## Summary\n...\n\n## Diff\n```diff\n...\n```\n\n## Risks\n- Breaking change to password hashing...",
      "proposal_type": "code_refactor",
      "metadata": {
        "files_touched": ["src/auth/hasher.ts", "src/auth/middleware.ts"],
        "test_coverage": 0.87,
        "estimated_cost_usd": 0.12,
        "session_id": "sess_abc123"
      }
    }
  },
  "id": 1
}

// Response
{
  "jsonrpc": "2.0",
  "result": {
    "content": [{
      "type": "text",
      "text": "{\"proposal_id\": \"prop_456\", \"status\": \"pending_quality_gate\", \"gate_url\": \"http://localhost:4488/proposals/456\"}"
    }]
  },
  "id": 1
}
```

**Quality Gate Result:**
```json
// The quality gate is an EMA internal call, not MCP — but the schema matters:
{
  "proposal_id": "prop_456",
  "gate_type": "code_refactor",
  "score": 0.82,
  "passed": true,
  "concerns": [
    "No migration path for existing bcrypt password hashes",
    "Missing unit test for hash comparison fallback"
  ],
  "action": "accept_with_notes",
  "revise_prompt": null
}
```

**Campaign Discovery:**
```json
{
  "name": "ema.campaign.record_discovery",
  "arguments": {
    "campaign_id": "camp_proslync_2026_q2",
    "discovery_type": "constraint",
    "content": "Proslync uses bcrypt 3.x. argon2 migration requires dual-verification period of at least 30 days for existing users.",
    "source": "session_abc123",
    "tags": ["auth", "migration", "breaking-change"]
  }
}
```

---

## 5. MCP Recursion Prevention

**The Problem:** Claude → EMA quality gate → Claude (with EMA MCP tools) → EMA quality gate → ∞

### Prevention Strategy: Depth Headers + Tool Stripping

**Layer 1: Depth Tracking (in EMA)**

Every AI invocation from EMA injects a header/env variable:
```elixir
# In lib/ema/quality_gate.ex
def run_llm_gate(content, context) do
  depth = Map.get(context, :ai_depth, 0)
  
  if depth >= 2 do
    {:error, :recursion_depth_exceeded}
  else
    Bridge.run(prompt, %{
      # No MCP tools — quality gate Claude is read-only evaluator
      mcp_tools: [],
      env: %{"EMA_AI_DEPTH" => to_string(depth + 1)},
      system: quality_gate_system_prompt()
    })
  end
end
```

**Layer 2: Tool Stripping for Quality Gate Sessions**

Quality gate invocations get **zero MCP tools**. The evaluator Claude sees only the content to evaluate — it cannot call EMA, Vault, or anything external:
```elixir
# Quality gate prompt template — NO tools, NO MCP
defp quality_gate_system_prompt do
  """
  You are a code/proposal quality evaluator. You receive content and return a structured
  JSON evaluation. You have no external tools. Respond only with the evaluation JSON.
  
  IMPORTANT: Do not request any tools. Do not reference external systems.
  Just evaluate what you've been given.
  """
end
```

**Layer 3: EMA MCP Server Guards**

The EMA Core MCP server checks for recursion signals in request headers:
```javascript
// In ema-core-mcp-server.js
server.tool("ema.proposal.evaluate", async (args, context) => {
  const depth = parseInt(context.headers?.["x-ema-ai-depth"] || "0");
  if (depth > 1) {
    return { error: "Recursion guard: evaluation depth exceeded" };
  }
  // ...proceed
});
```

**Layer 4: Cost Circuit Breaker**

The existing `CircuitBreaker` in `lib/ema/claude/circuit_breaker.ex` already handles consecutive failures. Extend it with a per-request-tree cost accumulator:
- Per-session token budget: 50k tokens
- Per-proposal-pipeline budget: 30k tokens
- Budget exceeded → hard stop, return last state

---

## 6. Deployment: Long-Lived vs Spawned

### Decision: All MCP Servers Are Long-Lived

**Rationale:**
1. Claude Code spawns stdio MCP servers when a session starts and keeps them alive for the session duration. For stdio servers, startup happens once per Claude Code session (~seconds). For HTTP servers, they run independently and always accept connections.
2. EMA Core MCP depends on EMA daemon being up — it's a thin proxy. If EMA daemon is up, the MCP server is up.
3. Vault MCP server has QMD index loading overhead (~300ms first search). Long-lived eliminates that.

**Lifecycle Management:**

| Server | Host | Process Manager | Restart Policy |
|---|---|---|---|
| EMA Core MCP (HTTP :4489) | Host machine | Launched by EMA daemon | `rest_for_one` in OTP supervisor |
| EMA Wiki MCP (already exists) | Host machine | Merged into EMA Core | Same |
| Vault MCP (HTTP :4491) | Agent VM | `systemd vault-mcp.service` | Always, with 5s restart delay |
| OpenClaw MCP | Agent VM | Internal to OpenClaw Gateway | Same lifecycle as gateway |

**Systemd unit for Vault MCP:**
```ini
# /etc/systemd/system/vault-mcp.service
[Unit]
Description=Vault MCP Server
After=network.target

[Service]
User=trajan
ExecStart=/usr/bin/node /home/trajan/bin/vault-mcp-server.js --http 4491
Restart=always
RestartSec=5
Environment="VAULT_PATH=/home/trajan/vault"
Environment="QMD_BIN=/usr/local/bin/qmd"

[Install]
WantedBy=multi-user.target
```

**EMA Daemon starts MCP server (in Application.ex):**
```elixir
# Add to children list after EMA daemon is fully booted
{Ema.MCPServer, port: Application.get_env(:ema, :mcp_port, 4489)}
```

Or simpler — a `Port` that launches the Node.js MCP server as a managed subprocess within the Elixir supervision tree.

---

## 7. Risk Analysis

### 🔴 High: MCP Tool Recursion

**Scenario:** Quality gate Claude calls `ema.proposal.evaluate` → triggers another Claude → loops until cost cap.

**Mitigation:** Depth headers + tool stripping for all quality gate invocations. Zero-tool evaluation sessions. See §5.

**Residual risk:** If the depth header is missing (e.g., external caller), the guard is bypassed. Add a default depth=0 assumption — fail safe, not fail open.

---

### 🔴 High: Cost Explosion

**Scenario:** Feedback loop between Coder and quality gate runs 10 revisions before failing, burning $50 in Claude API costs.

**Mitigation:**
- Max 3 revision cycles (hard cap in `Ema.Proposals.Pipeline`)
- Per-proposal token budget: 30k tokens (~$0.90 at Claude Sonnet pricing)
- Daily cost cap: configurable in EMA Settings (start at $5/day)
- Circuit breaker: 5 consecutive quality gate failures → pause pipeline, alert

---

### 🟡 Medium: SSH-over-stdio Reliability

**Scenario:** Claude Code uses `ssh agent-vm node vault-mcp-server.js` as stdio transport. SSH connection drops mid-session.

**Mitigation:** Use HTTP transport instead. Vault MCP server runs permanently at `http://192.168.122.10:4491`. Claude Code config points to URL, not subprocess. No SSH stdio dependency.

---

### 🟡 Medium: EMA Daemon Downtime

**Scenario:** EMA daemon (`mix phx.server`) is not running. All EMA Core MCP tools fail.

**Mitigation:** EMA Core MCP server should return graceful errors rather than crash:
```javascript
catch (err) {
  if (err.message.includes("ECONNREFUSED")) {
    return { error: "EMA daemon is not running. Start with: cd ~/Projects/ema/daemon && mix phx.server" };
  }
}
```

---

### 🟡 Medium: Proposal Staleness

**Scenario:** Campaign discoveries accumulate stale constraints. A 6-month-old discovery says "argon2 incompatible" but EMA was upgraded since.

**Mitigation:**
- Discovery records have `valid_until` field (default: 90 days)
- Campaign context builder filters expired discoveries
- `ema.campaign.record_discovery` can include `invalidates` field to replace prior discoveries

---

### 🟢 Low: Claude Code ↔ MCP Version Drift

**Scenario:** Claude Code upgrades and breaks MCP protocol compatibility.

**Mitigation:** EMA Core MCP server uses `@modelcontextprotocol/sdk` — same library Claude Code uses. Pin version in `package.json`. The existing `wiki-mcp-server.js` already does this correctly.

---

### 🟢 Low: QMD Search Latency

**Scenario:** `vault.search` MCP tool takes 2-3s, slowing proposal generation.

**Mitigation:** Vault MCP server keeps QMD index warm (long-lived process). First call after cold start may be slow; subsequent calls are fast. Cache last 50 search results in-memory.

---

## 8. 30-Day Implementation Roadmap

### Week 1 (Days 1–7): Foundation + Protocol

**Goal:** Everything needed to start building exists and is documented.

**Day 1–2: This document + protocol finalization**
- [x] `ema-mcp-system-architecture.md` (this document)
- [ ] Create `~/Projects/ema/docs/mcp-protocol.md` — wire format, error codes, authentication plan
- [ ] Create `~/Projects/ema/docs/ai-dev-loop.md` — sequence diagrams for the full loop

**Day 3–4: EMA Core MCP server spec**
- [ ] Design `ema-core-mcp-server.js` API surface (tools + resources)
- [ ] Write test harness: `node ema-core-mcp-server.js --test` (mirrors existing wiki-mcp-server pattern)
- [ ] Document which EMA REST endpoints back each tool

**Day 5–7: Vault MCP server scaffold**
- [ ] Write `~/bin/vault-mcp-server.js` (Node.js, ~150 lines)
- [ ] Implement `vault.search` (wraps `qmd search`)
- [ ] Implement `vault.read` / `vault.write` (filesystem ops)
- [ ] Test: `node vault-mcp-server.js --test`
- [ ] Wire to systemd: `vault-mcp.service`

**Success criteria:** Both MCP servers pass `--test`. Docs exist for every tool.

---

### Week 2 (Days 8–14): EMA Core MCP Server

**Goal:** Claude Code on host can query and write to EMA via MCP.

**Day 8–10: Core tools (read path)**
- [ ] Scaffold `ema-core-mcp-server.js` — merge + extend `wiki-mcp-server.js`
- [ ] Implement: `ema.project.*` (list, get, get_context)
- [ ] Implement: `ema.task.*` (create, update, complete)
- [ ] Implement: `ema.wiki.*` (existing, just move)
- [ ] HTTP mode running on :4489 alongside wiki on :4489

**Day 11–12: Proposal pipeline tools**
- [ ] Implement: `ema.proposal.submit`
- [ ] Implement: `ema.proposal.evaluate` (calls `quality_gate.ex`)
- [ ] Implement: `ema.proposal.accept` / `ema.proposal.reject`
- [ ] Add recursion guard headers to quality gate invocations

**Day 13–14: Claude Code integration + test**
- [ ] Update `~/.claude/settings.json` (host) to point to EMA Core MCP
- [ ] Manual end-to-end test: ask Claude Code to create a proposal in EMA
- [ ] Verify proposal appears in EMA desktop app

**Success criteria:** Claude Code on host can submit proposals to EMA. Quality gate runs without recursion.

---

### Week 3 (Days 15–21): Vault MCP Server + Campaign System

**Goal:** Vault knowledge feeds into proposal generation. Learnings persist.

**Day 15–17: Vault MCP server completion**
- [ ] Implement: `vault.backlinks`, `vault.graph_neighbors`
- [ ] Implement: `vault.entity_search` (wraps neo4j / ontology output)
- [ ] Add to Claude Code host config: `vault-vm` → `http://192.168.122.10:4491`
- [ ] Test: Claude Code searches vault from host

**Day 18–19: EMA VaultBridge for server-side access**
- [ ] Write `lib/ema/vault_bridge.ex` (HTTP client → vault-mcp-server :4491)
- [ ] Wire into ContextManager.ex (proposal pipeline enrichment)
- [ ] Vault search results injected into generator/refiner prompts

**Day 20–21: Campaign system**
- [ ] Verify `campaigns` Ecto schema exists (from EMA Full Integration Roadmap Phase 2.2)
- [ ] Implement: `ema.campaign.start`, `ema.campaign.record_discovery`
- [ ] Add `discoveries` to `ema.project.get_context` response
- [ ] Wire: task completion → auto-record discovery

**Success criteria:** A Claude Code session on host can search the vault, create a proposal, and record a discovery. All persisted in EMA.

---

### Week 4 (Days 22–30): Full Dev Loop Integration

**Goal:** End-to-end AI dev loop working for a real feature.

**Day 22–24: Quality gate enhancement**
- [ ] Implement deterministic pre-checks (compile check, scope check, budget estimate)
- [ ] Implement LLM quality gate with tool-stripping and depth headers
- [ ] Implement feedback loop: reject → revise_prompt → resubmit (max 3)
- [ ] Cost tracking: log every AI invocation to `usage_records`

**Day 25–27: OpenClaw → EMA integration**
- [ ] Right Hand can call `ema.proposal.submit` from VM via HTTP
- [ ] Right Hand can query `ema.project.get_context` for project status
- [ ] Add EMA MCP HTTP URL to Right Hand's TOOLS.md section
- [ ] Update AGENTS.md routing: "development request" → Coder → EMA proposal flow

**Day 28–30: Example workflow + dogfood**
- [ ] Run the full loop on a real task: pick one open EMA task
  - Coder generates proposal via Claude Code with EMA + Vault MCP
  - Quality gate evaluates
  - Implementation runs
  - Discovery recorded
  - Next session picks up discovery as context
- [ ] Document what worked, what broke, update this doc
- [ ] Write vault note: `vault/Architecture/EMA-MCP-Sprint-1-Retrospective.md`

**Success criteria:** The AI dev loop runs end-to-end on one real development task without manual intervention after the initial request.

---

## 9. Example Workflows

### Example A: Feature Proposal (New)

```
User: "Add OAuth to Proslync"

1. Right Hand (VM):
   • ema.project.get_context("proslync") 
     → Returns: 3 tasks, 1 active campaign, 2 prior auth proposals

2. Right Hand dispatches Coder:
   • Task: "Generate OAuth implementation proposal for Proslync"
   • Context: EMA project context, vault architecture notes

3. Coder (host-claude in ~/Projects/proslync):
   • Claude Code reads codebase
   • Calls vault.search("OAuth implementation patterns") → vault results
   • Calls ema.wiki.search("authentication proslync") → prior decisions
   • Generates proposal: RFC-style doc + code outline
   • Calls ema.proposal.submit(content, type="feature_proposal")

4. EMA Quality Gate (automated):
   • Deterministic: proposal has required sections? yes
   • LLM gate (no tools): score=0.88, concern="Missing token refresh strategy"
   • Status: accepted_with_notes

5. Coder continues (or Right Hand creates tasks):
   • ema.task.create("Implement OAuth token exchange")
   • ema.task.create("Add token refresh middleware")
   • ema.campaign.start("proslync-oauth-2026-q2", goal="Full OAuth support")

6. Implementation agent runs:
   • Implements first task
   • Hits issue: "NextAuth 5 has breaking API vs docs"
   • ema.campaign.record_discovery(type="constraint", content="NextAuth 5 breaking API...")
   • ema.task.complete(outcome="partial", artifacts=["src/auth/oauth.ts"])

7. Next session inherits context:
   • ema.project.get_context("proslync") returns discovery automatically
   • Claude Code prompt injected: "Note: NextAuth 5 has breaking API..."
```

---

### Example B: Refactoring (Existing Codebase)

```
User: "Refactor the database layer in DispoHub"

1. Coder (host-claude in ~/Projects/dispohub):
   • Claude Code scans codebase: finds 12 raw SQL queries, inconsistent error handling
   • Calls vault.search("database refactoring patterns")
   • Calls ema.wiki.search("dispohub database architecture")
   • Generates refactoring plan as proposal
   • Calls ema.proposal.submit(type="refactor_proposal")

2. Quality Gate:
   • Deterministic: plan touches >5 files → flag for human review
   • LLM gate: score=0.79 → "Plan doesn't address transaction rollback"
   • Status: rejected, revise_prompt="Add transaction strategy section"

3. Feedback loop (revision 1):
   • Coder receives revise_prompt
   • Regenerates with transaction section
   • Resubmits → score=0.91 → accepted

4. Implementation (phased):
   • Task 1: Extract query builders → done in 45min
   • Task 2: Add error handling layer → done
   • Task 3: Add transaction wrapper → hits complication
   • Discovery: "Express 4 middleware doesn't support async transactions without express-async-errors"
   • task.complete(outcome="done_with_constraint")

5. Vault learning:
   • vault.write("vault/Sessions/2026-04-05-dispohub-db-refactor.md")
     Content: goal, approach, constraint discovered, resolution
   • Auto-linked to [[Codebases/DispoHub]] via wikilink
```

---

### Example C: Architectural Decision

```
User: "Should DispoHub use Prisma or Drizzle?"

1. Right Hand spawns Researcher:
   • vault.search("Prisma vs Drizzle tradeoffs")
   • vault.search("DispoHub stack constraints")
   • ema.wiki.search("database orm decisions")
   • Web research: recent Prisma/Drizzle release notes

2. Right Hand spawns Devil's Advocate:
   • Reviews Researcher's findings from 5 perspectives

3. Right Hand submits proposal to EMA:
   • ema.proposal.submit(type="architectural_decision")
   • Content: recommendation + tradeoffs + dissent

4. EMA Decision Record:
   • Proposal accepted → auto-creates wiki note in EMA
   • vault.write("vault/Architecture/DispoHub-ORM-Decision.md")
   • Tagged as architectural decision, linked to DispoHub

5. Future context:
   • All future DispoHub work: ema.project.get_context returns the ADR
   • "Note: DispoHub chose Drizzle over Prisma (see vault/Architecture/...)"
```

---

## 10. Implementation Notes for EMA Codebase

### Files to Create

| File | Purpose |
|---|---|
| `daemon/priv/mcp/ema-core-mcp-server.js` | Expanded MCP server (replaces + extends wiki-mcp-server.js) |
| `daemon/lib/ema/vault_bridge.ex` | HTTP client for Vault MCP Server |
| `daemon/lib/ema/mcp_server.ex` | Elixir supervisor for Node.js MCP process |
| `~/bin/vault-mcp-server.js` | VM-side vault MCP server |
| `docs/mcp-protocol.md` | Wire format + error codes |
| `docs/ai-dev-loop.md` | Sequence diagrams |

### Files to Modify

| File | Change |
|---|---|
| `daemon/lib/ema/application.ex` | Add MCP server to supervision tree |
| `daemon/lib/ema/claude/quality_gate.ex` | Add depth headers, tool-stripping |
| `daemon/lib/ema/claude/context_manager.ex` | Inject vault search + campaign discoveries |
| `daemon/lib/ema/proposals/pipeline.ex` | Add feedback loop (max 3 revisions) |
| `daemon/config/config.exs` | Add vault_mcp_url, mcp_port config keys |
| Host `~/.claude/settings.json` | Register ema-core and vault-vm MCP servers |

### Quality Gate Elixir Module Skeleton

```elixir
defmodule Ema.Claude.QualityGate do
  @moduledoc """
  Evaluates proposals and content against quality criteria.
  
  Two-stage: deterministic fast path, then optional LLM evaluation.
  LLM evaluation uses NO MCP tools to prevent recursion.
  """
  
  @max_ai_depth 2
  @budget_tokens 15_000
  
  def evaluate(content, gate_type, context \\ %{}) do
    depth = Map.get(context, :ai_depth, 0)
    
    with :ok <- check_depth(depth),
         :ok <- deterministic_checks(content, gate_type),
         {:ok, result} <- llm_evaluate(content, gate_type, depth) do
      {:ok, result}
    end
  end
  
  defp check_depth(depth) when depth >= @max_ai_depth,
    do: {:error, :recursion_depth_exceeded}
  defp check_depth(_), do: :ok
  
  defp llm_evaluate(content, gate_type, depth) do
    # No MCP tools — stripped evaluation session
    Bridge.run(
      build_gate_prompt(content, gate_type),
      %{
        mcp_tools: [],               # CRITICAL: no tools
        max_tokens: @budget_tokens,
        env: %{"EMA_AI_DEPTH" => to_string(depth + 1)},
        system: gate_system_prompt(gate_type)
      }
    )
  end
end
```

---

## 11. Priority Order

**Build in this order:**

1. **Vault MCP Server** (VM, Week 1) — smallest + highest leverage. Unlocks vault context for all subsequent work. Self-contained, no EMA dependency.

2. **EMA Core MCP Server** (Host, Week 2) — this is the main event. Start with read tools (project context), then write tools (proposals, tasks). The existing wiki-mcp-server.js is the skeleton.

3. **Quality Gate + Recursion Guards** (Week 3) — required before any automated loop. Can't deploy AI-driven proposals without this.

4. **Campaign + Discovery System** (Week 3) — the learning memory. Makes every iteration smarter.

5. **Full Loop Integration** (Week 4) — wire OpenClaw → EMA → Claude Code → EMA. Dogfood it on a real EMA task.

**Skip for now:**
- OpenClaw MCP Server (internal) — OpenClaw already has HTTP APIs. Build when you need in-process tools for VM-side agents.
- Multi-instance / federation — Phase 6 in the roadmap, not this sprint.

---

*This document is the connective tissue. It turns three separate systems into one AI-driven development platform. Build the Vault MCP server first — it's the smallest win with the most leverage.*

---
title: Trajan-Network Architecture
type: knowledge
status: active
created: '2026-04-03'
updated: '2026-04-03'
author: Right Hand
tags:
  - architecture
  - p2p
  - spaces
  - ema
  - openclawed
  - peers
  - pier
wiki_id: system/Trajan-Network-Architecture
imported_from: vault/System/Trajan-Network-Architecture.md
imported_at: '2026-04-04T00:23:57.269Z'
summary: ''
---

# Trajan-Network: Unified Architecture

## Vision

**One distributed system.** Multiple peers, one semantic core, shared knowledge graph.

```
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│   EMA Daemon     │        │   OpenClaw VM    │        │  Future: Host    │
│   (Elixir)       │◄──────►│   (Gateway +     │◄──────►│  Desktop Client  │
│   localhost:4488 │        │   CLI agents)    │        │  (P2P Pier)      │
│   SQLite         │        │   Port 18789     │        │                  │
└──────────────────┘        └──────────────────┘        └──────────────────┘
         ▲                            ▲                         ▲
         │                            │                         │
         └────────────────────────────┴─────────────────────────┘
                   Pier P2P Network (libp2p)
                   CRDT Sync (Automerge)
                   One "Trajan-network" Space
```

**Members:**
- **EMA VM** (localhost:4488) — Execution hub, proposals engine, task tracking
- **OpenClaw VM** (localhost:18789) — Agent dispatch, gateway, CLI access
- **Host Desktop (future)** — Claude Code, browser, local projects
- **Vault (shared)** — Knowledge layer, semantic memory, intent folders

---

## Spaces: The Tenancy Boundary

### Space 1: "Trajan-network" (Active)

**Type:** Personal + P2P
**Peers:** EMA daemon, OpenClaw gateway, Host (future)
**Data:** Everything. All projects, all tasks, all proposals, all agents.
**Sync:** Full mirror (every peer sees everything)
**Trust:** Local network only (libp2p with pubkey validation)

**Key files:**
```
Trajan-network/
├── config.toml         — network topology, peer list, sync policy
├── spaces/
│   └── trajan-network/
│       ├── projects/   — all projects
│       ├── tasks/      — all tasks
│       ├── proposals/  — all proposals
│       ├── executions/ — all executions (append-only)
│       └── vault/      — symlink to ~/vault (or indexed files)
└── peers/
    ├── ema-daemon.yaml
    ├── openclaw-vm.yaml
    └── host-desktop.yaml (future)
```

---

## Peer Types

### Peer 1: EMA Daemon

**Role:** Orchestration hub
**Runs on:** Agent VM (localhost:4488)
**Exposes:**
- REST API (`/api/tasks`, `/api/proposals`, etc.)
- MCP servers (EMA MCP, Vault MCP)
- WebSocket for real-time sync
- Phoenix PubSub for internal events

**Stores:**
- SQLite database (tasks, proposals, executions, projects, habits, journal, vault index)
- Executions as append-only narrative log (`execution-log.md` files)
- Intent folders (`.superman/intents/`)

**Owns:**
- Proposal orchestration (4-stage pipeline)
- Execution lifecycle management
- Quality gates and deliberation
- Outcome tracking and metrics
- Honcho integration (when deployed)

**Connects to:**
- OpenClaw (via REST + MCP client)
- Vault (reads/writes intent files, indexes)
- Host projects (via SSH or shared folder bridge)

---

### Peer 2: OpenClaw Gateway

**Role:** Agent dispatch, CLI access, message routing
**Runs on:** Agent VM (localhost:18789)
**Exposes:**
- Gateway API (18789)
- Discord/Telegram/Slack integrations
- CLI commands (openclaw agent, openclaw...)
- MCP clients (can invoke remote MCP services)

**Stores:**
- Session logs
- Message history
- Agent roster (AGENTS.md)
- Prompts (SOUL.md, agent CLAUDE.md files)

**Owns:**
- Agent spawning (Claude Code, Codex, etc.)
- Message routing (Discord, Telegram)
- Right Hand orchestration
- CLI interface for all operations

**Connects to:**
- EMA daemon (REST client, reads proposals/tasks to dispatch agents)
- Vault (reads AGENTS.md, SOUL.md, task context)
- Host (SSH for host-claude dispatch)

**Key feature:** Can **subscribe to EMA events** (via WebSocket or MCP) and auto-dispatch agents on proposal approval.

---

### Peer 3: Host Desktop (Future)

**Role:** Local development, Claude Code, browser
**Runs on:** Host machine (FerrissesWheel)
**Exposes:**
- Claude Code CLI
- Browser DevTools
- Project repos (Git)

**When added to Trajan-network:**
- Full sync of all EMA data (projects, tasks, proposals, vault index)
- Can read/write tasks, create proposals locally
- Claude Code can read task context, project intent files
- Push results back to EMA daemon

---

## Data Flow: The Core Loop

```
User (via EMA UI or OpenClaw Discord):
  "Research EMA architecture"
  
  ↓
  
EMA Daemon:
  1. Create BrainDump item
  2. Cluster with related items
  3. Promote to Proposal
  4. Run deliberation (4 stages)
  5. Emit "proposal_ready" event
  
  ↓ (MCP or WebSocket subscribe)
  
OpenClaw Gateway:
  1. Receive "proposal_ready" event
  2. Read Proposal from EMA
  3. Route to agent (via Right Hand logic)
  4. Spawn agent (Claude Code CLI)
  
  ↓
  
Claude Code (on VM or Host):
  1. Read task context (from EMA via MCP or SSH)
  2. Read project intent file (from Vault)
  3. Execute task
  4. Write results to Vault
  5. Emit "agent_done" event
  
  ↓
  
EMA Daemon:
  1. Receive "agent_done" event
  2. Read results from Vault
  3. Create Execution record
  4. Update Proposal status
  5. Update Task status
  6. Feed outcome to metrics
  7. Emit "execution_complete" event
  
  ↓ (Pipes)
  
Notifications:
  1. Post result to Discord channel
  2. Update Dashboard execution feed
  3. Mark related tasks as done
  4. Update project activity
  5. Feed to Honcho for learning
```

---

## Connectivity Matrix

| From | To | Via | Purpose |
|---|---|---|---|
| EMA | OpenClaw | REST + WebSocket | Event subscribe, agent dispatch |
| EMA | Vault | Filesystem | Read intent files, write results |
| OpenClaw | EMA | REST client | Read proposals, read task context |
| OpenClaw | Vault | SSH or MCP | Read SOUL.md, AGENTS.md |
| OpenClaw | Host (future) | SSH | host-claude dispatch |
| Claude Code | EMA | MCP client | Read context, write results |
| Claude Code | Vault | Filesystem | Read/write intent folders, research |
| Host (future) | EMA | Pier P2P | Full sync of all data |
| Host (future) | Vault | Sync folder | Bidirectional vault changes |
| EMA | Integrations | REST/OAuth | GitHub, Google Drive, Discord, Slack |

---

## Implementation Phases

### Phase A: Bootstrap (Week 7-8)

**Goals:**
- EMA frontend (5 core apps)
- OpenClaw <→ EMA REST connectivity
- Pier P2P foundation (topology, peer discovery)
- Manual Pier setup script for VM

**What happens:**
- EMA daemon listens at localhost:4488
- OpenClaw listens at localhost:18789
- Both can read from each other
- Execution loop works end-to-end
- Vault is source of truth for intent files

**Pier setup:**
```bash
ema system bootstrap \
  --peer-name "trajan-network-ema" \
  --peer-port 4488 \
  --peer-type "hub" \
  --space-name "trajan-network"

openclaw register-peer \
  --network-name "trajan-network" \
  --peer-addr "localhost:4488" \
  --peer-type "agent-gateway"
```

---

### Phase B: Full P2P (Week 9+)

**Goals:**
- Pier P2P full integration
- CRDT sync for all data types
- Host peer added to network
- Multi-device conflict resolution

**New:**
- libp2p discovery and connection
- Automerge for CRDT sync
- Peer bootstrap file (static peer list, then DNS+mDNS)
- Conflict resolution UI
- Offline support (queue operations, sync on reconnect)

---

## Pier Network Topology

### Peer Discovery

**Initial (Phase A):** Static config file listing all peers
```yaml
peers:
  - id: "ema-daemon"
    addr: "localhost:4488"
    pubkey: "..."
    role: "hub"
  - id: "openclaw-vm"
    addr: "localhost:18789"
    pubkey: "..."
    role: "gateway"
  - id: "host-desktop"
    addr: "192.168.1.100:19999"
    pubkey: "..."
    role: "client"
    discovered: true  # optional, set after mDNS finds it
```

**Future (Phase B):** mDNS + DNS SRV records
- Peers broadcast via mDNS (`_trajan-network._tcp.local`)
- DNS SRV records for static peers
- Fallback to static config if network fails

### Data Sync Policy

| Data Type | Storage | Sync Type | Conflict |
|---|---|---|---|
| **Tasks** | SQLite (EMA) + Automerge CRDT | Full mirror + CRDT | EMA canonical, Host sees versions |
| **Proposals** | SQLite (EMA) + append-only log | Append-only (no conflicts) | Order by timestamp |
| **Executions** | SQLite (EMA) + execution-log.md | Append-only | Order by timestamp |
| **Projects** | SQLite (EMA) + `.superman` files | Full mirror + file watch | EMA canonical, intent files are shared |
| **Vault** | Filesystem (git-backed) | Git sync + file watch | Merge-friendly (Markdown) |
| **Habits** | SQLite (EMA) | Full mirror | EMA canonical |
| **Settings/Config** | YAML (each peer) | Per-peer (no sync) | Each peer configures self |

---

## MCP Server Architecture

### MCP Server 1: EMA Core

**Runs at:** localhost:4489 (HTTP)
**Exposes:**
- `project.list` → all projects in space
- `project.get` → project detail + intent file
- `task.list` → filtered tasks
- `task.get` → task detail
- `proposal.list` → proposals by status
- `proposal.get` → proposal detail
- `execution.get` → execution detail + narrative
- `vault.search` → semantic search in vault

**Clients:**
- Claude Code (on VM or Host) reads context for task execution
- OpenClaw reads proposals to dispatch agents

---

### MCP Server 2: Vault

**Runs at:** localhost:4491 (HTTP)
**Exposes:**
- `vault.search` → full-text or semantic search
- `vault.get` → file content
- `vault.write` → create/update file
- `vault.watch` → file change events
- `vault.graph` → backlinks + knowledge graph

**Clients:**
- EMA daemon indexes vault changes
- Claude Code reads intent files
- OpenClaw reads system docs (AGENTS.md, SOUL.md)
- Honcho queries for context

---

### MCP Server 3: OpenClaw Bridge

**Runs at:** localhost:18789 (existing)
**Extends existing with:**
- `agent.dispatch` → trigger agent task
- `agent.status` → current agent state
- `agent.cancel` → stop running agent
- `session.list` → all active sessions
- `channel.send` → post to Discord/Telegram

**Clients:**
- EMA daemon calls to dispatch agents on proposal approval
- Web frontend calls to control agents from UI

---

## Integration with Existing Systems

### SOUL.md (Right Hand Prompt)

EMA reads SOUL.md on startup for:
- Right Hand identity/voice
- Dispatch protocol rules
- Agent roster
- Routing logic

When SOUL.md changes:
- OpenClaw hot-reloads (no restart needed)
- EMA updates routing rules
- Prompt Workshop UI surfaces current version

---

### AGENTS.md (Agent Roster)

On EMA startup:
1. Bootstrap import: `ema system bootstrap` reads AGENTS.md
2. Creates agent records in SQLite
3. Caches agent capabilities + fitness scores
4. OpenClaw can query agent list via MCP

When AGENTS.md changes:
- Vault watcher picks up change
- Emit `vault_change` event
- EMA re-imports (adds new agents, removes old)
- Agent Fleet UI updates

---

### Vault as Single Source of Truth

**Intent folders** are canonical:
- `.superman/intents/<project>/` contain goal, constraints, decisions
- Agents read on spawn
- Execution results append to `execution-log.md` in intent folder
- Vault watcher triggers EMA updates

**Project docs** are canonical:
- README, architecture docs, research notes
- Agents can read via MCP
- Humans update via Vault UI or external editors
- Changes sync to peers automatically

---

## Operational Example: "Bootstrap Trajan-Network"

**Time:** T+0 (now)

### Step 1: EMA Daemon Online

```bash
# On agent-vm
cd ~/Projects/ema
mix phx.server
# Listens at localhost:4488
```

**Status:**
- EMA SQLite database initialized
- REST API ready
- MCP server (EMA Core) ready at 4489
- Vault MCP server ready at 4491
- Pier networking not active yet

---

### Step 2: OpenClaw Connected

```bash
# On agent-vm (already running)
systemctl status openclaw-gateway
# Already listening at localhost:18789
```

**Status:**
- OpenClaw gateway live
- Discord/Telegram integrations active
- Ready to dispatch agents
- Can read from EMA via REST client

---

### Step 3: Bootstrap Trajan-Network Space

```bash
# From EMA CLI or via REST endpoint
POST http://localhost:4488/api/system/bootstrap
{
  "space_name": "trajan-network",
  "space_type": "personal+p2p",
  "import_from": {
    "agents_file": "/home/trajan/.openclaw/agents/main/workspace/AGENTS.md",
    "soul_file": "/home/trajan/.openclaw/agents/main/workspace/SOUL.md",
    "vault_path": "/home/trajan/vault"
  }
}
```

**What happens:**
- Creates `trajan-network` space in EMA
- Imports AGENTS.md → agent roster table
- Imports SOUL.md → prompt/routing table
- Indexes Vault files → knowledge graph
- Creates peer config file: `~/.ema/spaces/trajan-network/peers.yaml`

---

### Step 4: Register OpenClaw as Peer

```bash
# Via EMA UI (Settings → Integrations) or REST
POST http://localhost:4488/api/peers/register
{
  "peer_name": "openclaw-vm",
  "peer_addr": "localhost:18789",
  "peer_role": "gateway",
  "pubkey": "..."  # OpenClaw public key
}
```

**What happens:**
- OpenClaw peer added to peer list
- EMA begins listening for WebSocket subscriptions from OpenClaw
- OpenClaw can receive events: `proposal_ready`, `execution_complete`, etc.

---

### Step 5: Enable Pier Network (Manual for now)

```bash
# Manual step: add to EMA config
# ~/.ema/spaces/trajan-network/config.toml

[network]
enabled = true
topology = "static"  # will be "hybrid" (static + mDNS) in Phase B
sync_policy = "full_mirror"

[peers]
ema-daemon = { addr = "localhost:4488", role = "hub" }
openclaw-vm = { addr = "localhost:18789", role = "gateway" }
# host-desktop = { addr = "192.168.1.100:19999", role = "client" }  # commented out for now
```

Restart EMA:
```bash
systemctl restart ema-daemon
```

---

### Step 6: Test the Loop

**Manual test:**

1. Create a Proposal in EMA UI
2. Approve it
3. EMA emits `proposal_ready` event
4. OpenClaw receives event (WebSocket)
5. OpenClaw dispatches Claude Code agent
6. Claude Code executes, writes result to Vault
7. OpenClaw sends `agent_done` event
8. EMA receives, creates Execution, updates Proposal
9. Result visible in EMA UI (Proposals + Dashboard + Projects)

**Automated test:**

```bash
curl -X POST http://localhost:4488/api/test/run-loop \
  -H "Content-Type: application/json" \
  -d '{
    "proposal": "Research EMA P2P architecture",
    "agent": "researcher"
  }'
```

---

## Key Files & Directories

```
~/.ema/
├── spaces/
│   └── trajan-network/
│       ├── config.toml          — network, sync, peer config
│       ├── peers.yaml           — peer topology
│       ├── space.db             — SQLite (tasks, proposals, etc.)
│       ├── execution-logs/      — per-project narratives
│       └── vault-index/         — semantic search index
├── settings.toml                — global EMA settings
└── logs/                        — daemon logs

/home/trajan/vault/
├── System/
│   ├── Trajan-Network-Architecture.md  (this file)
│   ├── EMA-Unified-Spec-With-Integrations.md
│   └── MASTER-SYSTEM-OVERVIEW.md
├── Projects/
│   ├── EMA/
│   │   ├── .superman
│   │   ├── execution-log.md
│   │   └── research.md
│   └── Superman/
│       └── Knowledge-Graph-Design.md
└── Daily/
    └── 2026-04-03.md            — session notes
```

---

## Success Criteria (Week 7-8)

- [x] EMA daemon running at localhost:4488
- [x] OpenClaw running at localhost:18789
- [x] Trajan-network space created
- [x] AGENTS.md imported as agent roster
- [x] SOUL.md imported as routing rules
- [ ] Vault indexed (Superman indexing)
- [ ] OpenClaw subscribed to EMA events
- [ ] End-to-end proposal → dispatch → result → execution loop working
- [ ] Pier peer topology set up (manual for now)
- [ ] Real-time sync between EMA + OpenClaw (WebSocket)
- [ ] EMA frontend (5 core apps) running
- [ ] All 14 apps buildable (spec complete ✅)

---

## Future: Host as Third Peer

When Host is added (Phase B+):

```
Host Desktop
  ↓
  Claude Code (local projects)
  Obsidian (local vault)
  Browser (EMA UI at localhost:3000 via tunnel)
  
  ↓ (via Pier P2P or shared folder bridge)
  
Trajan-network Space
  ↓
  EMA Daemon (orchestration)
  OpenClaw Gateway (agent dispatch)
  Vault (shared knowledge)
```

Host would:
- Sync all tasks/proposals/executions (full mirror)
- Run local Claude Code for large-scope tasks
- Edit vault files locally, sync bidirectionally
- Can work offline, sync when reconnected

---

**This is the architecture. Build toward it. Test it step by step.** 🚀

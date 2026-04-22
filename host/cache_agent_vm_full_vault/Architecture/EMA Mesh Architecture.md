---
date: 2026-04-03
tags:
  - architecture
  - ema
  - p2p
  - distributed
  - active
---

# EMA Mesh — Full Architecture

> Your devices are the cloud. Your AI subscriptions are the compute. Your mesh is the network. EMA manages everything. You own everything.

---

## 1. Core Primitive: Spaces

A **Space** is the fundamental unit. Everything in EMA lives inside a Space — isolated data, isolated agents, isolated files, isolated AI context. Spaces are the organizational boundary for literally everything.

### Space Types

| Type | Visibility | Sync | Encryption | Example |
|---|---|---|---|---|
| **Personal** | Just you | All your devices | Device-local keys | "My Brain" |
| **Organization** | Invited members | Member devices | Org-rotated keys | "Proslync Team" |
| **Shared** | Anyone with link | On-demand | Link-derived keys | "Open Source Proj" |
| **Ghost** | Ephemeral | Temp devices only | Ephemeral keys, TTL | "Quick collab" (self-destructs) |
| **Public** | Anyone | Read-only mirror | Signed, not encrypted | "My Portfolio" |

### Space Contents (each Space gets all of these)

- **Files** — full file system, content-addressed, versioned
- **Tasks** — kanban, time tracking, dependencies
- **Projects** — grouping of tasks with milestones
- **Proposals** — AI-generated improvement suggestions scoped to this space
- **Journal** — daily entries, focus summaries, reflections
- **Vault** — knowledge base, markdown notes, wikilinks
- **Canvas** — freeform spatial workspace
- **Channels** — messaging (internal + bridged Discord/Telegram/etc.)
- **Agents** — AI agents with space-specific context and permissions
- **Habits** — tracking streaks and routines
- **Brain Dump** — inbox for raw thoughts, auto-classified into the above

### Space Selector UI

Top-left corner, always visible. Like Slack workspaces:

```
┌─────────────────────┐
│ 🧠 My Brain    ▼    │  ← current space
├─────────────────────┤
│ 🧠 My Brain         │
│ 🏢 Proslync Team    │
│ 🏢 Wilson Premier   │
│ 🔗 OSS Project      │
│ 👻 Quick Collab     │
│ ─────────────────── │
│ 🌐 All Spaces       │  ← unified cross-space view
│ ＋ Create Space     │
│ 📎 Join via Link    │
└─────────────────────┘
```

### "All Spaces" View

Unified feed across every space. Shows:
- All tasks (grouped by space, filterable)
- All notifications
- All proposals
- All unread channels
- All file activity

Space badges on every item. Click badge → jump to that space. Filter bar at top to include/exclude spaces.

### Joining a Space

1. Owner generates **invite link** (cryptographic, optional expiry, optional max-uses)
2. Recipient clicks link:
   - Has EMA → Space syncs immediately via P2P
   - No EMA → landing page with download + auto-join on first launch
3. New member's device joins the mesh **for that space only**
4. Their personal spaces remain completely isolated
5. Leaving a space = local data purged, keys revoked, device exits mesh for that space

---

## 2. P2P Mesh Network

No central server. Every EMA instance is a node. Nodes discover each other and sync directly.

### Transport Layer

Built on **libp2p** (battle-tested, used by IPFS/Filecoin/Polkadot):

- **mDNS** — instant discovery on LAN (same wifi/network)
- **Tailscale/WireGuard** — cross-network, authenticated tunnel
- **libp2p relay** — NAT traversal for devices behind firewalls
- **DHT (Kademlia)** — fully decentralized peer discovery (optional, for public spaces)
- **Bluetooth/USB** — offline device-to-device sync (phone ↔ laptop)

### Node Types

| Role | Description | Example |
|---|---|---|
| **Relay** | Always-on, forwards traffic, stores pinned data | VPS, Agent VM, Raspberry Pi |
| **Edge** | Intermittent, syncs when online | Laptop, phone, tablet |
| **Compute** | Beefy, runs AI jobs for the mesh | Workstation, GPU server |
| **Seed** | Stores full copies of spaces for availability | NAS, dedicated storage |
| **Bridge** | Connects to external services (Discord, Telegram, email) | Any node with API keys |

A single device can be multiple roles. Your Agent VM is Relay + Compute + Bridge.

### Sync Engine — CRDTs

All data structures are **CRDTs** (Conflict-free Replicated Data Types). No central authority needed for conflict resolution.

| Data Type | CRDT Strategy |
|---|---|
| Tasks, habits, settings | LWW Register (last-write-wins per field) |
| Journal entries, notes | Yjs/Automerge (operational transform for rich text) |
| Files | Content-addressed blocks, Merkle DAG (like IPFS) |
| Channels/messages | Causal broadcast with vector clocks |
| Agent state | LWW Map with tombstones |
| Proposals | Append-only log with votes as LWW |

**Offline-first guarantee:** Edit anything without internet. Changes queue locally. When devices reconnect, CRDTs auto-merge without conflicts. Zero data loss.

### Sync Policies (per space, per device)

| Policy | Behavior |
|---|---|
| **Full Mirror** | Everything synced locally. Fastest access. Most storage. |
| **On-Demand** | Metadata synced, file contents fetched on open. |
| **Pinned** | Only explicitly pinned items synced. Minimal storage. |
| **Relay-Only** | Don't store data, just forward it. For relay nodes. |

Configure per-space per-device. Phone might be "On-Demand" for work space, "Full Mirror" for personal.

---

## 3. File System — Kill Google Drive

### Architecture

Content-addressed storage. Every file is:
1. **Chunked** — split into blocks (default 1MB)
2. **Hashed** — SHA-256 per block
3. **Deduplicated** — identical blocks stored once across all spaces
4. **Encrypted** — each block encrypted with space key before storage/transit

```
file "contract.pdf" (5MB)
  → chunk_0 (1MB) → sha256:abc123 → encrypted → stored
  → chunk_1 (1MB) → sha256:def456 → encrypted → stored
  → chunk_2 (1MB) → sha256:abc123 → DEDUP (same as chunk_0!)
  → chunk_3 (1MB) → sha256:ghi789 → encrypted → stored
  → chunk_4 (1MB) → sha256:jkl012 → encrypted → stored
  
Manifest: [abc123, def456, abc123, ghi789, jkl012]
```

### Virtual File System Per Space

```
📁 Proslync Team/
├── 📁 Documents/
│   ├── 📄 Business Plan.docx
│   ├── 📄 Marketing Strategy.md
│   └── 📁 Contracts/
│       ├── 📄 Wilson Premier.pdf
│       └── 📄 Template.docx
├── 📁 Brand Assets/
│   ├── 🖼️ Logo.svg
│   └── 🖼️ Brand Guide.pdf
├── 📁 Code/
│   └── 📁 proslync-app/ (git repo, special handling)
└── 📁 AI Context/
    ├── 📄 Team CLAUDE.md
    └── 📄 Agent Instructions.md
```

### File Features

- **Version history** — every save creates a new version. Browse/restore any version. Git-like but invisible to users.
- **AI-indexed** — every file chunked and embedded for semantic search. Ask "find that NDA from March" and it finds it.
- **Live collaboration** — multiple users editing same file via CRDT. Cursor presence, selections, change attribution.
- **Preview everything** — PDFs, images, code (syntax highlighted), markdown (rendered), video, audio. No "download to view."
- **Drag between spaces** — move/copy files across spaces. Permissions travel with the file. Revoke access = file unreadable in that space.
- **Smart folders** — auto-populated based on rules (e.g., "All PDFs tagged 'contract'" across all spaces)
- **Conflict-free** — CRDTs handle concurrent edits. For binary files, keeps both versions with clear attribution.

### Sync Visualization

Each file shows sync status:
- 🟢 Synced on N devices
- 🟡 Syncing... (progress bar)
- 🔴 Only on this device (needs backup)
- ☁️ Available on mesh, not downloaded locally

---

## 4. Device Registry & Mesh Dashboard

### Device Advertisement

Every EMA node broadcasts (via libp2p gossipsub):

```json
{
  "device_id": "sha256:pubkey",
  "name": "Trajan's Macbook",
  "role": ["edge", "compute"],
  "capabilities": {
    "ai": {
      "claude_code": { "version": "1.2.0", "auth": "oauth", "models": ["opus", "sonnet"] },
      "codex": null,
      "ollama": { "models": ["llama3.2:8b", "qwen2.5-coder:7b"] },
      "openai_api": { "models": ["gpt-4o"] }
    },
    "compute": {
      "cpu_cores": 12,
      "ram_gb": 32,
      "gpu": "M3 Max",
      "gpu_vram_gb": 36
    },
    "storage": {
      "total_gb": 1000,
      "available_gb": 450,
      "sync_policy": "full_mirror"
    },
    "network": {
      "tailscale": true,
      "direct_lan": true,
      "relay_capable": false
    },
    "ssh": {
      "accessible": true,
      "user": "trajan",
      "key_fingerprint": "SHA256:abc..."
    }
  },
  "spaces": ["personal", "proslync-team", "wilson-premier"],
  "online_since": "2026-04-03T04:30:00Z",
  "last_heartbeat": "2026-04-03T04:45:00Z"
}
```

### Mesh Dashboard UI

```
╔══════════════════════════════════════════════════════════════╗
║  MESH NETWORK                              Total AI Power ■ ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       ║
║  │ 🖥️ Macbook  │───│ 🖥️ Agent VM │───│ 🍓 Pi Node  │       ║
║  │ 🟢 Online   │   │ 🟢 Online   │   │ 🟢 Online   │       ║
║  │ Claude ✓    │   │ Claude ✓    │   │ Ollama ✓    │       ║
║  │ M3 Max GPU  │   │ 6c/14GB     │   │ 4GB ARM     │       ║
║  │ 3 spaces    │   │ 2 spaces    │   │ relay only  │       ║
║  └──────┬──────┘   └──────┬──────┘   └─────────────┘       ║
║         │                  │                                 ║
║         │   ┌──────────────┘                                ║
║         │   │                                                ║
║  ┌──────┴───┴─────┐   ┌─────────────┐                      ║
║  │ ☁️ VPS         │   │ 📱 Phone    │                       ║
║  │ 🟢 Online      │   │ 🟡 Background│                      ║
║  │ Codex ✓        │   │ No AI       │                       ║
║  │ 8c/32GB        │   │ 1 space     │                       ║
║  │ relay + compute│   │ on-demand   │                       ║
║  └────────────────┘   └─────────────┘                       ║
║                                                              ║
║  ══ AGGREGATE ══════════════════════════════════════════════ ║
║  AI Models: Claude Opus/Sonnet, Codex, Llama 3.2, Qwen 2.5 ║
║  Total Compute: 36 cores, 90GB RAM, 1 GPU (36GB VRAM)       ║
║  Total Storage: 2.4TB (1.1TB available)                      ║
║  Active Jobs: 3 running, 2 queued                            ║
║  Spaces: 5 (3 synced, 2 partial)                             ║
╚══════════════════════════════════════════════════════════════╝
```

### Device Management Actions

From the dashboard, for any device:
- **SSH Terminal** — open a web terminal directly to the device
- **Deploy Agent** — push an AI agent config to run on that device
- **Update EMA** — push EMA update to that device
- **Adjust Sync** — change sync policy for spaces on that device
- **Reboot/Shutdown** — remote power management
- **View Logs** — stream logs from that device
- **Run Command** — execute arbitrary command (with approval flow for destructive ops)

---

## 5. Distributed AI Compute — The AI Mesh

This is the core differentiator. Your devices pool their AI capabilities into a unified compute layer.

### AI Capability Registry

Each device registers what it can do:

```elixir
%AICapability{
  provider: :claude_code,
  auth_method: :oauth,       # or :api_key, :cli_session
  models: [:opus, :sonnet],
  max_concurrent: 3,
  cost_per_1k_tokens: %{input: 0.015, output: 0.075},  # opus
  avg_latency_ms: 800,
  rate_limits: %{rpm: 50, tpm: 100_000},
  features: [:tool_use, :vision, :streaming, :mcp]
}
```

### Job Router

When any node needs AI work done, it hits the Job Router:

```
1. Classify job: quick_inference | long_generation | code_task | batch_analysis
2. Score available nodes:
   - Has required model? (hard filter)
   - Current load vs capacity (soft score)
   - Network latency to requestor (soft score)
   - Cost (prefer local/free over API)
   - Rate limit headroom (soft score)
3. Route to best node
4. If best node busy, queue with priority
5. If all nodes saturated, ask user: "wait or use paid API?"
```

### Routing Preferences (user-configurable)

| Strategy | Behavior |
|---|---|
| **Prefer Local** | Ollama/local models first, API only as fallback |
| **Prefer Cheap** | Smallest capable model, cheapest provider |
| **Prefer Fast** | Lowest latency node, best model for speed |
| **Prefer Quality** | Best model available (Opus > Sonnet > local) |
| **Balanced** | Weighted score of cost + speed + quality |

### Job Types & Routing

```
"Quick question about React hooks"
  Strategy: Prefer Local → Prefer Fast
  → Pi has Ollama llama3 → route there (free, 500ms)

"Refactor this 10-file codebase"
  Strategy: Prefer Quality
  → Agent VM has Claude Code + bypass perms → route there
  → Stream results back to requestor

"Analyze 200 contracts for risk clauses"
  Strategy: Balanced, parallelizable
  → Split into 40 batches of 5
  → Fan out: Macbook (Claude, 10 batches), VM (Claude, 10),
    VPS (Codex, 10), queue remaining 10
  → Each node processes independently
  → Aggregate results on requestor
  → Total time: 15min parallel vs 3hrs sequential

"Generate daily digest from RSS feeds"
  Strategy: Prefer Cheap, scheduled
  → Run on Pi (Ollama) overnight, zero cost
  → Results ready by morning

"Emergency: production bug, need fix NOW"
  Strategy: Prefer Fast + Prefer Quality, priority=critical
  → Pre-empt queued jobs on best node
  → Route to Macbook (M3 Max + Claude Opus)
  → Stream fix in real-time
```

### Cross-Node Claude Code Dispatch

**The big one.** EMA can dispatch Claude Code sessions across the mesh:

```elixir
# From any EMA node:
EMA.AI.dispatch(%{
  task: "Fix the TypeScript build errors in proslync-app",
  working_dir: "~/Desktop/proslync-app",  # on TARGET device
  target: :macbook,                         # or :auto for router
  model: :opus,
  permissions: :bypass,
  stream_to: :requestor,                    # stream output back
  timeout: 600_000,
  on_complete: :notify_all_spaces           # broadcast result
})
```

Under the hood:
1. EMA on requestor sends job to target node via P2P
2. Target node's EMA spawns: `claude --dangerously-skip-permissions --print "task"`
3. Stdout streams back to requestor via P2P channel
4. Result (files changed, commits made) synced via CRDT
5. Requestor's EMA shows: "✅ Build fixed on Macbook. 3 files changed. [View Diff]"

### Auto-SSH Bootstrap

**When a new device joins the mesh, EMA automatically:**

1. Generates ED25519 keypair for the new device
2. Exchanges public keys with all existing mesh devices via P2P (encrypted channel)
3. Each existing device adds the new key to `~/.ssh/authorized_keys`
4. Tests bidirectional SSH: `ssh new-device "echo ok"` and `ssh existing-device "echo ok"` from new device
5. Stores SSH config in mesh state:

```json
{
  "device_id": "macbook",
  "ssh": {
    "host": "192.168.122.1",        // LAN
    "tailscale_host": "100.x.x.x",  // Tailscale fallback
    "user": "trajan",
    "port": 22,
    "key_path": "~/.ema/mesh/keys/macbook_ed25519",
    "verified": true,
    "last_test": "2026-04-03T04:50:00Z"
  }
}
```

6. Periodically re-tests SSH connectivity (every heartbeat)
7. If SSH breaks, attempts repair: re-exchange keys, try alternate routes (LAN → Tailscale → relay)

**Claude Code availability check on each device:**

```bash
# EMA runs this on each device via SSH:
which claude && claude --version  # Claude Code CLI
which codex && codex --version    # Codex CLI
ollama list 2>/dev/null           # Local models
cat ~/.claude/auth.json 2>/dev/null | jq '.oauth_token != null'  # OAuth status
```

Results feed into the AI Capability Registry. Devices without any AI tools are still useful (storage, relay, file sync) but can't run AI jobs.

---

## 6. Organization Features

### Org Space Capabilities

Everything a personal space has, plus:

| Feature | Description |
|---|---|
| **Roles** | Owner → Admin → Member → Guest (read-only) |
| **Shared Agents** | Org-level AI agents with shared context across all members |
| **Team Dashboard** | Member activity, project status, AI usage per member |
| **Audit Log** | Immutable log of all actions — who did what, when |
| **Shared Proposals** | Team members submit proposals, vote, approve/reject |
| **Billing Split** | Track API spend per member, generate invoices |
| **Compliance Rules** | Per-org rules for what agents can/can't do |
| **Onboarding Flow** | New member gets guided setup, auto-syncs relevant data |

### Shared Agent Context

Org spaces can have agents that know about the org:

```
"Proslync AI" agent:
- Knows all contracts in the org space
- Knows team members and roles
- Knows project status and milestones
- Has access to org files (brand assets, docs)
- Can answer "what's the status of the Wilson Premier deal?"
- Scoped: can ONLY see org space data, never personal
```

### Invite & Onboarding Flow

```
Owner: "Share Proslync Team space with alex@email.com"

EMA generates:
  ema://join/proslync-team?token=abc123&expires=2026-04-10

Alex clicks link:
  ├── Has EMA → auto-joins, space syncs
  └── No EMA → landing page:
       "Trajan invited you to Proslync Team on EMA"
       [Download for Mac] [Download for Windows] [Download for Linux]
       [Download for iOS] [Download for Android]
       → After install, auto-joins from deep link
       
First sync:
  1. Org files (on-demand by default)
  2. Shared agent configs
  3. Task assignments for this member
  4. Channel history (last 30 days)
  5. Onboarding checklist from org admin
```

---

## 7. Security Model

### Encryption Layers

| Layer | Method | Purpose |
|---|---|---|
| **Transport** | TLS 1.3 / Noise Protocol (libp2p) | In-transit encryption |
| **Space** | AES-256-GCM with space-derived key | At-rest encryption per space |
| **File** | Per-chunk encryption before storage | File-level isolation |
| **Device** | Device-local keychain | Protects mesh keys |
| **Identity** | ED25519 keypair per device | Authentication |

### Key Management

- **Personal spaces:** Key derived from device keychain. Only your devices can decrypt.
- **Org spaces:** Key generated by owner, distributed to members via P2P key exchange. Owner can rotate keys (re-encrypts all data). Revoking a member = re-key the space, purge their device.
- **Shared spaces:** Key derived from invite link. Anyone with link can derive key.
- **Ghost spaces:** Ephemeral key, TTL-based. Key destroyed after TTL. Data becomes unrecoverable.

### Approval System (integrates with Defer-Resume)

Risky operations across the mesh require approval:

```
Agent on VM wants to: DELETE /Proslync Team/Contracts/old-nda.pdf
  → Approval request pushed to all org admins' devices
  → First admin to approve/deny wins
  → If no response in 5min → auto-deny

Agent on Macbook wants to: SSH into VPS and run "apt upgrade"
  → Approval request to device owner
  → Shows: command, target device, risk level
  → Approve with optional scope: "allow this command" vs "allow all apt commands"
```

---

## 8. Self-Managing AI Layer

EMA is the admin. Not you. Not anyone. The AI manages the infrastructure autonomously.

### What EMA Manages

| Domain | Actions |
|---|---|
| **Device Health** | Heartbeat monitoring, auto-restart failed services, alert on disk/RAM/CPU |
| **Storage Rebalancing** | Device low on space? Migrate cold files to devices with headroom |
| **AI Job Scheduling** | Rate limited on Claude? Switch to Codex. Codex down? Queue for Ollama. |
| **Security** | Key rotation on schedule, revoke compromised devices, detect anomalies |
| **Updates** | Push EMA updates across all mesh nodes, rolling restart |
| **Backup** | Ensure every space replicated on N devices (configurable redundancy) |
| **Network** | Detect best route between devices, failover LAN → Tailscale → relay |
| **Cost Optimization** | Track API spend, suggest model downgrades for cost, shift work to free local models |
| **Onboarding** | New device joins → auto-configure SSH, sync spaces, install AI tools |
| **Decommissioning** | Device leaving → migrate data, revoke keys, update mesh topology |

### Autonomous Operations (with human escalation)

```
Severity 1 (auto-fix, no notification):
  - Service crashed → restart
  - Temp files filling disk → cleanup
  - SSH key expired → rotate

Severity 2 (auto-fix, notify):
  - Device offline > 1 hour → alert, try wake-on-LAN
  - API rate limited → switch provider, notify
  - Storage < 10% → migrate cold data, notify

Severity 3 (propose fix, wait for approval):
  - Security anomaly detected → lock device, propose investigation
  - Major version upgrade → propose rollout plan
  - Device decommission → propose data migration plan

Severity 4 (alert only, human must act):
  - All AI providers down
  - Encryption key compromise suspected
  - Hardware failure detected
```

---

## 9. Integration Map — How Everything Connects

```
┌─────────────────────────────────────────────────────────────────┐
│                        EMA MESH                                  │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  SPACES  │  │  FILES   │  │  AGENTS  │  │ CHANNELS │       │
│  │          │──│          │──│          │──│          │       │
│  │ Personal │  │ VFS      │  │ Per-space│  │ Discord  │       │
│  │ Org      │  │ Chunked  │  │ Shared   │  │ Telegram │       │
│  │ Shared   │  │ Versioned│  │ Context  │  │ Internal │       │
│  │ Ghost    │  │ Encrypted│  │ MCP tools│  │ Email    │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │              │              │              │              │
│  ┌────┴──────────────┴──────────────┴──────────────┴────┐       │
│  │                    CRDT SYNC ENGINE                    │       │
│  │         Automerge / Yjs / Custom LWW Maps            │       │
│  └────┬──────────────┬──────────────┬───────────────────┘       │
│       │              │              │                            │
│  ┌────┴────┐   ┌─────┴────┐  ┌─────┴─────┐                    │
│  │  P2P    │   │  DEVICE  │  │  AI MESH  │                    │
│  │ NETWORK │   │ REGISTRY │  │  COMPUTE  │                    │
│  │         │   │          │  │           │                    │
│  │ libp2p  │   │ SSH mgmt │  │ Job Router│                    │
│  │ mDNS    │──│ Health   │──│ Claude CC │                    │
│  │ Tailscle│   │ Caps     │  │ Codex     │                    │
│  │ DHT     │   │ Roles    │  │ Ollama    │                    │
│  │ Relay   │   │ Updates  │  │ Fan-out   │                    │
│  └─────────┘   └──────────┘  └───────────┘                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                 SELF-MANAGING AI LAYER                │       │
│  │  Health │ Security │ Storage │ Cost │ Updates │ Backup│       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Cross-System Interactions

| When This Happens... | ...These Systems Interact |
|---|---|
| User creates a task in org space | Spaces → CRDT → P2P → syncs to all member devices |
| Agent needs to refactor code | Agents → AI Mesh → routes to best compute node → SSH → Claude Code → results stream back |
| New team member joins | Spaces → P2P → SSH bootstrap → Device Registry → sync org files |
| File uploaded to shared space | Files → chunked → encrypted → CRDT → replicated to N devices |
| Focus session starts on laptop | Focus → linked task → time tracking → habit auto-log → journal entry with AI summary |
| Device goes offline | Device Registry → detect → rebalance (ensure redundancy) → alert if critical |
| Rate limit hit on Claude | AI Mesh → reroute to Codex/Ollama → notify user of degraded quality |
| Proposal engine fires | Harvesters → seeds → Proposal Engine → AI scoring → inbox notification across spaces |

---

## 10. Claude Code Cross-Mesh Dispatch Protocol

The most detailed spec since this is the immediate high-value feature.

### Prerequisites Per Device

For a device to accept Claude Code dispatches:

1. **SSH accessible** from dispatching node (auto-bootstrapped by EMA)
2. **Claude Code CLI** installed (`which claude` succeeds)
3. **Auth configured** — one of:
   - OAuth token (via `claude auth login` or oauth-guardian)
   - API key in environment
   - Active session that can be resumed
4. **Registered in Device Registry** with `ai.claude_code` capability

### Dispatch Flow

```
Requestor Node                          Target Node
     │                                       │
     │  1. dispatch_request (via P2P)        │
     │──────────────────────────────────────►│
     │  {task, working_dir, model,           │
     │   permissions, timeout, stream}       │
     │                                       │
     │  2. Validate:                         │
     │     - SSH accessible? ✓               │
     │     - Claude available? ✓             │
     │     - Auth valid? ✓                   │
     │     - Working dir exists? ✓           │
     │                                       │
     │  3. accepted / rejected               │
     │◄──────────────────────────────────────│
     │                                       │
     │  4. SSH spawn:                        │
     │     ssh target "cd working_dir &&     │
     │     claude --print --dangerously-     │
     │     skip-permissions 'task'"          │
     │                                       │
     │  5. Stream stdout (real-time)         │
     │◄──────────────────────────────────────│
     │  token by token via P2P channel       │
     │                                       │
     │  6. Completion event                  │
     │◄──────────────────────────────────────│
     │  {exit_code, files_changed,           │
     │   git_diff, duration, cost}           │
     │                                       │
     │  7. File sync (CRDT)                  │
     │◄────────────────────────────────────►│
     │  Changed files replicate to           │
     │  relevant spaces                      │
```

### Dispatch Strategies

```elixir
# Simple: specific target
EMA.Claude.dispatch(:macbook, "fix build errors", "~/Projects/ema")

# Auto-routed: let the mesh decide
EMA.Claude.dispatch(:auto, "fix build errors", "~/Projects/ema",
  prefer: :quality,     # use best model
  timeout: 600_000
)

# Fan-out: same task, multiple codebases
EMA.Claude.fan_out([
  {:macbook, "update deps", "~/Projects/ema"},
  {:vps, "update deps", "~/Projects/proslync"},
  {:vm, "update deps", "~/Projects/wilson"},
], parallel: true, on_all_complete: :aggregate_report)

# Pipeline: sequential across devices
EMA.Claude.pipeline([
  {:macbook, "write the feature", "~/Projects/ema"},
  {:vm, "write tests for the new feature", "~/Projects/ema"},
  {:macbook, "fix any test failures", "~/Projects/ema"},
], stream_each: true)
```

### Session Resume Across Devices

If a Claude Code session on Device A gets interrupted (crash, reboot, rate limit):

1. EMA captures session state (conversation history, current task, files touched)
2. Routes to Device B with: "Resume this task. Previous session got to: [state]. Files changed so far: [list]. Continue from where it left off."
3. Device B picks up seamlessly
4. User sees: "⚠️ Session migrated from Macbook → VM (rate limit). Continuing..."

---

## 11. Implementation Phases

| Phase | Sprint | What | Depends On |
|---|---|---|---|
| **Foundation** | 1-2 | libp2p transport, mDNS discovery, basic CRDT sync, device advertisement | Nothing |
| **Spaces** | 2-3 | Space model, selector UI, space-level data isolation, space encryption | Foundation |
| **File System** | 3-4 | Content-addressed storage, chunking, versioning, file browser UI, sync policies | Foundation + Spaces |
| **SSH Bootstrap** | 3 | Auto key exchange, bidirectional SSH setup, connectivity testing | Foundation |
| **Device Registry** | 3-4 | Capability advertisement, mesh dashboard UI, health monitoring | Foundation + SSH |
| **AI Mesh** | 4-5 | Job router, capability matching, Claude Code dispatch, cross-node streaming | Device Registry + SSH |
| **Org Features** | 5-6 | Roles, invites, shared agents, audit log, billing | Spaces + Foundation |
| **Self-Managing** | 6-7 | Autonomous health, storage rebalancing, cost optimization, auto-updates | Everything above |
| **Polish** | 7-8 | Onboarding flow, invite links, mobile apps, security audit, docs | Everything above |

### Elixir Libraries Needed

| Library | Purpose |
|---|---|
| `libcluster` | Distributed Erlang node discovery |
| `horde` | Distributed supervisor / registry (CRDT-based!) |
| `delta_crdt` | CRDT primitives for Elixir |
| `yjs` (via NIF or port) | Rich text CRDT |
| `libp2p` (via Rust NIF) | P2P networking |
| `ex_crypto` | Encryption primitives |
| `nostrum` | Discord integration |
| `ex_gram` | Telegram integration |

**Key insight:** Elixir/OTP is *perfect* for this. Distributed Erlang already handles node clustering, message passing, supervision, and fault tolerance. EMA's mesh is essentially a specialized Erlang cluster with P2P transport instead of TCP direct.

---

## 12. The Vision Statement

**EMA Mesh is a personal infrastructure layer.**

It's not an app — it's the operating system for your digital life. Your devices form a private cloud. Your AI subscriptions become distributed compute. Every file, task, thought, and conversation lives in encrypted spaces you fully own.

Share a space with a link. Join someone's workspace by downloading the app. Your devices manage themselves. The AI handles the infrastructure. You just live your life.

No Google. No Notion. No Dropbox. No Slack. No AWS. Just your mesh.

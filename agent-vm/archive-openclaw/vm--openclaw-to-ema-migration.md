# OpenClaw → EMA Migration Plan

## Goal
Replace Discord as the primary interaction surface. EMA becomes the native desktop app that wraps the entire OpenClaw + Claude Code agent infrastructure.

## What Already Exists in EMA
- ✅ Claude Bridge (`bridge.ex`) — streaming Claude CLI via Port, stream-json, multi-turn
- ✅ Backend module — abstraction over Bridge with adapter pattern
- ✅ Adapters — claude_cli, codex_cli, ollama, openclaw, openrouter
- ✅ Smart Router — routes to cheapest/best provider
- ✅ Provider Registry — tracks health, capabilities
- ✅ Agent system — AgentWorker, AgentMemory, conversations, tools
- ✅ Channels UI — Discord-style layout (ServerList, ChannelTree, ChatView, MessageBubble, InputBar)
- ✅ Unified Inbox — cross-channel message aggregation
- ✅ Message Router — routes outbound to right channel
- ✅ Channel Health — monitors connections
- ✅ SecondBrain — vault watcher, graph builder, links
- ✅ Pipes — workflow automation engine
- ✅ Evolution — self-improvement system
- ✅ MetaMind — research/review pipeline
- ✅ Voice — TTS + command parsing

## What Needs Building (Discord → EMA Mapping)

### Sprint 1: Core Agent Chat (Replace Discord DM)
The primary interaction loop — you type, Right Hand responds.

1. **OpenClaw Agent Mapping** — Create EMA agents that mirror the OpenClaw roster:
   - `right-hand` (main) — default agent, always active
   - `researcher`, `coder`, `ops`, `security`, `vault-keeper`, `scout`, `prompt-engineer`, `concierge`, `devils-advocate`, `strategist`
   - Each gets a SOUL.md-equivalent personality in their agent settings
   - Use the `openclaw` adapter to talk to the actual OpenClaw gateway agents

2. **Direct Chat Mode** — When you open EMA and type in the main chat, it should:
   - Route to Right Hand agent via the OpenClaw adapter
   - Stream responses in real-time via Bridge → PubSub → Phoenix Channel → WebSocket → React
   - Show tool calls inline (ToolCallCard already exists)
   - Support multi-turn conversation (Bridge already has `send/2`)

3. **Agent Dispatch UI** — When Right Hand spawns specialists:
   - Show them as separate threads/conversations in the ChannelTree
   - Live status updates (working, done, blocked)
   - Collapsible specialist output that Right Hand synthesizes

### Sprint 2: Vault Integration (Replace Discord Forums/Channels)
Map the vault to EMA's SecondBrain.

1. **Vault Watcher Enhancement** — Already watches `~/vault/`, enhance to:
   - Index all vault notes with metadata (created, modified, tags, links)
   - Show in SecondBrain UI with graph visualization
   - Full-text search via vectors (Embedder already exists)

2. **Daily Notes** — Auto-create daily notes, show in journal view
3. **Memory Files** — Surface MEMORY.md, agent-performance.md, preferences in a dedicated panel

### Sprint 3: Task & Project Management (Replace Discord Threads)
1. **Task Sync** — TASKS.md ↔ EMA Tasks bidirectional sync
2. **Project Context** — Each project in EMA links to vault notes, git repos, Claude sessions
3. **Agent Performance Dashboard** — Visualize agent-performance.md data in Canvas

### Sprint 4: Notification & Command Surface
1. **System Tray Integration** — Desktop notifications for agent completions (replace Discord pings)
2. **Slash Commands** — Map OpenClaw slash commands to EMA InputBar commands
3. **Heartbeat Panel** — Show system health, auth status, disk space in a dashboard
4. **Quick Actions** — Brain dump → task → agent dispatch pipeline

### Sprint 5: Full Autonomy
1. **Cron Integration** — EMA's scheduler triggers OpenClaw heartbeats
2. **Evolution Runs** — EMA's Evolution system feeds back into OpenClaw SOUL.md/AGENTS.md
3. **Pipe Triggers** — "When agent finishes task → update vault → notify → archive"

## Architecture

```
┌─────────────────────────────────────────────┐
│  Tauri Shell (Desktop App)                  │
│  ├─ Main chat window (Right Hand)           │
│  ├─ Agent panels (specialists)              │
│  ├─ Vault/SecondBrain browser               │
│  ├─ Task board                              │
│  └─ System tray (notifications)             │
├─────────────────────────────────────────────┤
│  React Frontend                             │
│  ├─ Channels app (primary chat)             │
│  ├─ Agent store → REST + WebSocket          │
│  └─ Real-time streaming via Phoenix PubSub  │
├─────────────────────────────────────────────┤
│  Phoenix Daemon (localhost:4488)            │
│  ├─ OpenClaw Adapter → gateway:18789        │
│  ├─ Claude CLI Adapter → direct CLI         │
│  ├─ Smart Router (cost/capability routing)  │
│  └─ Agent system (spawn, track, synthesize) │
├─────────────────────────────────────────────┤
│  OpenClaw Gateway (localhost:18789)         │
│  ├─ Right Hand (main agent)                 │
│  ├─ Specialist agents (spawned on demand)   │
│  ├─ Skills, vault, tools                    │
│  └─ Discord/Telegram (kept as secondary)    │
└─────────────────────────────────────────────┘
```

## Key Decisions
- **OpenClaw stays running** — EMA talks TO it via the openclaw adapter, not replacing it
- **Discord becomes secondary** — still works, but EMA is primary
- **Dual-path routing** — EMA can use Claude CLI directly (fast, local) OR route through OpenClaw (for agent orchestration, skills, memory)
- **Claude Forge integration** — The hooks/skills/agents/commands from Claude Forge enhance the Claude CLI adapter's capabilities

## Sprint 1 Implementation Details

### Files to Create/Modify

**Daemon:**
- `lib/ema/agents/openclaw_sync.ex` — Syncs agent roster from OpenClaw, creates EMA agent records
- `lib/ema_web/channels/agent_chat_channel.ex` — WebSocket channel for real-time agent chat
- Modify `agent_worker.ex` — Add OpenClaw routing mode (use openclaw adapter for dispatches)
- Modify `bridge.ex` — Add session persistence, conversation history replay

**Frontend:**
- `app/src/components/channels/AgentChatView.tsx` — Primary chat with Right Hand
- `app/src/components/channels/AgentStatusPanel.tsx` — Shows specialist dispatch status
- Modify `channels-store.ts` — Add agent routing, streaming state, specialist tracking

**Config:**
- `config/runtime.exs` — OpenClaw gateway URL, agent mapping, default routing mode

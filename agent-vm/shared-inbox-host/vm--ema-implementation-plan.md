# EMA — Complete Remaining Implementation Plan

## What's Done (committed & compiling)

### Foundation ✅
- Full Tauri + React + Phoenix + SQLite stack running
- 13 frontend apps with glass morphism design system
- 15 Zustand stores + Phoenix WebSocket channels
- REST API + WebSocket for all domains
- OTP supervision trees for all subsystems
- Git history: 15+ commits, clean `mix compile`

### Domain Logic ✅
- ProposalEngine pipeline: Generator → Refiner → Debater → Tagger (via PubSub)
- Agents system: per-agent supervision, memory compression, webchat bridge
- Pipes system: 7 stock pipes, 22 triggers, Registry + Loader + Executor
- Second Brain: vault watcher, graph builder, system brain state files
- Responsibilities: scheduler generating tasks from cadences
- Canvas: data sources + element management
- Brain dump, habits, journal, settings, tasks, projects all wired

### Multi-Backend AI Bridge ✅ (Phase 0-1)
- 5 adapters: ClaudeCLI, CodexCLI, Ollama, OpenRouter, OpenClaw
- SmartRouter with 6 strategies (balanced/cheapest/fastest/best/round_robin/failover)
- ProviderRegistry, AccountManager, CircuitBreaker, CostTracker
- Bridge + Backend + StreamParser + QualityGate + Governance
- AI dispatch layer (ai.ex) routing Bridge vs Runner via config
- 4 migrations, supervisor wired into Application
- ProposalEngine stages updated to use AI.run/2

---

## What Needs Building — The Full Remaining Scope

### PHASE 2: Make the Bridge Actually Work (test + wire)
**Priority: HIGH — this makes AI actually flow through the new system**

#### 2A. Integration Tests for Bridge
```
daemon/test/ema/claude/
├── bridge_test.exs           # Bridge.run/2 with mock adapter
├── smart_router_test.exs     # Routing strategy tests
├── provider_registry_test.exs # Provider lifecycle tests
├── circuit_breaker_test.exs  # Trip/recovery tests
├── stream_parser_test.exs    # JSONL parsing tests
└── adapters/
    ├── claude_cli_test.exs   # Real CLI integration test (optional, needs claude installed)
    └── ollama_test.exs       # Real Ollama integration test (optional, needs ollama)
```

#### 2B. Wire Claude Transform in Pipes
The pipe executor has a stub: `apply_transform(%{transform_type: "claude"}, payload)` returns payload unchanged.
→ Replace with actual `AI.run/2` call that takes the pipe payload, sends it through Claude, returns the transformed result.

#### 2C. Wire Bridge into Agents
The agent system has `Ema.Agents.Runner` but it doesn't use the new Bridge yet.
→ Update agent chat to route through `AI.run/2` instead of direct `Runner.run/2`

#### 2D. Frontend: AI Provider Settings UI
Add a settings page to configure:
- Active providers + their credentials
- Routing strategy selection
- Cost budget limits
- Provider health status display

### PHASE 3: Session Management (multi-turn, streaming)
**Priority: HIGH — enables real conversational AI in EMA**

#### 3A. Session Manager GenServer
```elixir
# daemon/lib/ema/claude/session_manager.ex
defmodule Ema.Claude.SessionManager do
  # Track active sessions, support resume/fork
  # Store session metadata in SQLite
  # Integrate with claude --session-id and --resume flags
end
```

#### 3B. Streaming to Frontend
- Bridge already parses stream-json JSONL
- Need: Phoenix.Channel that broadcasts stream events to frontend
- Frontend: streaming text component that renders tokens as they arrive
- Wire into proposal generation (show Claude thinking in real-time)

#### 3C. Session UI
- List active/past sessions
- Resume interrupted sessions
- Fork sessions for exploration
- Per-session cost display

### PHASE 4: Proposal Engine v2 — Generator-Evaluator Loops
**Priority: MEDIUM — makes proposals actually good**

#### 4A. Quality Gate Implementation
```elixir
# The QualityGate module exists but needs real evaluation logic
# Check: completeness, actionability, risks identified, scope bounded
# If fails: feed back to refiner with specific failure context
# Max 3 iterations before accept-with-warnings
```

#### 4B. Multi-Model Pipeline
- Generator: use opus (best quality for initial generation)
- Refiner: use sonnet (fast iteration)
- Debater: use opus (needs deep reasoning)
- Tagger: use haiku (classification is cheap)
- Combiner: no AI needed (rule-based clustering)

#### 4C. Proposal Streaming UI
- Show each pipeline stage as it runs
- Real-time token streaming in the proposals app
- Stage-by-stage progress indicator
- Cost per stage and total cost display

### PHASE 5: Harvesters — Automated Data Collection
**Priority: MEDIUM — feeds the proposal engine with real context**

The CLAUDE.md says these are "designed but not implemented":

#### 5A. Git Harvester
```elixir
# Watches git repos, extracts: recent commits, branch activity, PR patterns
# Feeds into: proposal seeds, project health metrics
```

#### 5B. Session Harvester
```elixir
# Watches Claude Code sessions on the system
# Extracts: what was worked on, what patterns repeat, what broke
# Feeds into: proposal seeds, second brain knowledge
```

#### 5C. Vault Harvester
```elixir
# Scans vault for stale notes, orphaned links, topic clusters
# Feeds into: responsibility tasks ("update vault note X"), second brain graph
```

#### 5D. Usage Harvester
```elixir
# Tracks AI usage across providers (from CostTracker data)
# Feeds into: budget dashboards, routing optimization signals
```

#### 5E. BrainDump Harvester
```elixir
# Processes brain dump items, extracts actionable items
# Auto-creates tasks, proposal seeds, or vault notes from dump items
```

### PHASE 6: Focus System
**Priority: MEDIUM — schema exists, no logic**

#### 6A. Focus Timer GenServer
```elixir
# Pomodoro-style timer with configurable durations
# Integrates with: tasks (auto-log time), habits (track focus streaks)
# States: idle → focusing → break → idle
```

#### 6B. Focus Blocks
```elixir
# Schedule focus blocks on calendar
# During focus: suppress non-urgent notifications
# After focus: auto-summarize what was accomplished
```

#### 6C. Focus UI
- Timer component in frontend
- Focus history / analytics
- Integration with tasks app

### PHASE 7: Goals System
**Priority: MEDIUM — schema exists, no logic**

#### 7A. Goals Engine
```elixir
# SMART goal tracking: specific, measurable, achievable, relevant, time-bound
# Milestones with due dates
# Links to: tasks, projects, habits, responsibilities
# AI-powered: suggest next actions, identify blockers
```

#### 7B. Goals UI
- Goal creation with milestone planning
- Progress visualization
- Goal → task decomposition (AI-assisted)

### PHASE 8: Channel Adapters — Real Discord/Telegram Integration
**Priority: MEDIUM — currently stubs**

#### 8A. Discord Adapter
```elixir
# Replace stub with real Nostrum integration
# Agent → Discord channel bridging
# Receive messages from Discord, route to agent
# Send agent responses back to Discord
```

#### 8B. Telegram Adapter
```elixir
# Replace stub with real ExGram integration
# Same pattern as Discord
```

### PHASE 9: Agent Tool Execution
**Priority: HIGH — agents can only create brain dump items right now**

#### 9A. Expand Agent Tools
Currently only `brain_dump:create_item` works. Need:
```elixir
tools = [
  "task:create", "task:update", "task:complete",
  "project:list", "project:get",
  "proposal:create_seed", "proposal:approve", "proposal:reject",
  "vault:search", "vault:create_note", "vault:update_note",
  "habit:log", "habit:list",
  "journal:create_entry",
  "pipe:trigger",
  "responsibility:check_in",
  "focus:start", "focus:stop",
  "goal:update_progress",
  "canvas:create", "canvas:add_element",
  "settings:get", "settings:update"
]
```

#### 9B. Agent MCP Server
Expose EMA tools as an MCP server so Claude Code sessions can call back into EMA:
```elixir
# daemon/lib/ema/claude/mcp_server.ex
# HTTP or stdio MCP server
# Exposes all agent tools as MCP tools
# Claude sessions get --mcp-config pointing to this server
```

### PHASE 10: Hooks Integration (Citadel-style)
**Priority: LOW — nice-to-have**

#### 10A. Pre/PostToolUse Hooks
```elixir
# Intercept Claude tool calls:
# - Audit all Bash commands (governance)
# - Block dangerous operations (governance)
# - Inject context on compaction (context_manager)
# - Track subagent lifecycle
# - Auto-save progress on stop
```

#### 10B. Defer-and-Resume
```elixir
# For dangerous operations:
# 1. Hook returns "defer"
# 2. Claude pauses
# 3. EMA shows approval UI in Tauri frontend
# 4. User approves → EMA calls --resume
```

### PHASE 11: Module Consolidation
**Priority: LOW — tech debt cleanup**

- Merge VaultIndex + Notes into SecondBrain (they overlap)
- Ensure all channel controllers broadcast mutations via PubSub
- Wire global shortcuts (Super+Shift+C brain dump, Super+Shift+Space launcher)

### PHASE 12: Life OS (Future — large scope)
**Priority: FUTURE — this is the big vision**

- Spaces (Work/Personal/Health/Finance/Learning contexts)
- Space-qualified IDs and cross-space linking
- Shadow Notes for privacy boundaries
- P2P sync via CRDT + Tailscale
- Per-space AI agents with hard privacy boundaries

### PHASE 13: Distributed Architecture (Future)
**Priority: FUTURE — requires Phase 12**

- Erlang clustering via libcluster + Tailscale
- Horde process registry across nodes
- DeltaCrdt state sync
- Multi-node AI routing (route to node with cheapest/fastest provider)

---

## Recommended Build Order (what to dispatch NOW)

### Sprint 1: Make AI Real (Phases 2 + 9A)
1. Wire Claude transform in Pipes → `AI.run/2`
2. Expand agent tools beyond brain_dump
3. Integration tests for Bridge
4. Frontend AI settings page

### Sprint 2: Sessions + Streaming (Phase 3)
1. SessionManager GenServer
2. Phoenix.Channel for stream events
3. Frontend streaming text component
4. Session UI (list, resume, fork)

### Sprint 3: Proposal Engine v2 (Phase 4)
1. Real QualityGate evaluation logic
2. Multi-model pipeline configuration
3. Streaming proposal UI
4. Generator-evaluator iteration loop

### Sprint 4: Harvesters + Focus + Goals (Phases 5-7)
1. All 5 harvesters
2. Focus timer + UI
3. Goals engine + UI

### Sprint 5: Channels + MCP + Hooks (Phases 8-10)
1. Discord/Telegram adapters
2. MCP server for EMA tools
3. Hook system

### Sprint 6: Cleanup + Polish (Phase 11)
1. Module consolidation
2. E2E tests
3. Global shortcuts

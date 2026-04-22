---
title: EMA 8-Week Implementation Sprint
created: '2026-04-04'
updated: '2026-04-04'
type: project
status: active
confidence: 0.93
tags:
  - ema
  - roadmap
  - sprint
  - 8-week
  - voice
  - discord
  - campaigns
  - intelligence
  - autonomous-pipes
summary: >-
  Complete 8-week implementation plan for EMA — voice-Discord integration,
  persistent sessions, campaigns, autonomous pipes, knowledge synthesis, and
  specialized agents. Detailed week-by-week with deliverables.
related:
  - '[[Projects/EMA Master Knowledge Base]]'
  - '[[Projects/EMA Phase 2 Implementation Guide]]'
wiki_id: projects/EMA_8-Week_Implementation_Sprint
imported_from: vault/Projects/EMA 8-Week Implementation Sprint.md
imported_at: '2026-04-04T00:23:56.872Z'
---

# EMA 8-Week Implementation Sprint

> **Start:** Week 7 (2026-04-04)  
> **End:** Week 14 (2026-05-30)  
> **Theme:** Make EMA compound intelligence across every interaction
> **Phase 1 baseline:** 2,457 source files, 16 modules, all core features shipped

---

## Overview

| Week | Focus | Key Deliverable |
|------|-------|-----------------|
| 7 | Voice ↔ Discord Integration | EMA responds intelligently in #voice-log |
| 8 | Persistent Sessions + Daemon Fix | VoiceCore sessions survive restarts |
| 9 | Campaign System | Projects compound knowledge across sessions |
| 10 | 4 MVP Dispatch Affordances | Dispatch Board, Scope Advisor, Deliberation Gate, Reflexion |
| 11 | Autonomous Pipes | Event-triggered Claude actions (pipes run themselves) |
| 12 | Second Brain ↔ Claude | Knowledge graph auto-linked and searchable by Claude |
| 13 | Specialized Agents | Strategist, Coach, Archivist, Executor with distinct personas |
| 14 | Polish + Integration Test | End-to-end flow, stress test, audit trail UI |

---

## Week 7: Voice ↔ Discord Integration

> **Goal:** Discord #voice-log → EMA VoiceCore → Response back to Discord

### Architecture

VoiceCore already has `send_text/2` — bypasses Whisper, routes directly to CommandParser → Claude Bridge → TTS. Discord just becomes another input transport.

```
Discord #voice-log message
  ↓
OpenClaw (already bridges Discord → EMA daemon)
  ↓
EMA.Discord.Bridge (new module)
  ↓
VoiceCore.send_text(session_id, text)
  ↓
  ├─ CommandParser.parse(text)
  │  ├─ {:command, :create_task, "..."}   → Ema.Tasks.create_task()
  │  ├─ {:command, :brain_dump, "..."}    → Ema.BrainDump.create_item()
  │  ├─ {:command, :ask_claude, "..."}    → Claude Bridge
  │  └─ :conversation                     → Claude Bridge (Jarvis persona)
  ↓
Response (text)
  ↓
EMA.Discord.Bridge.post_reply(channel_id, response)
  ↓
Discord #voice-log ← response appears
```

### Modules to Build

**`Ema.Discord.Bridge`** (new, ~150 lines)
- GenServer that maintains a session_id per Discord channel
- `receive_message(channel_id, user_id, text)` → routes to VoiceCore
- `post_reply(channel_id, text)` → HTTP POST to Discord API (via OpenClaw gateway or direct)
- Session persistence: one VoiceCore session per Discord channel (not per message)
- Config: `DISCORD_BOT_TOKEN`, target channel IDs

**`EmaWeb.DiscordWebhookController`** (new, ~60 lines)
- POST `/api/discord/message` → receives messages from OpenClaw or Discord bot
- Calls `Discord.Bridge.receive_message/3`
- Returns 200 immediately (async processing)

**VoiceCore enhancements**
- Add `:discord` as a session type (currently only `:tauri_socket`)
- Discord sessions don't need TTS audio output — response is text-only
- Persist Discord sessions longer (10min → 30min idle timeout for Discord)

### Integration Point with OpenClaw

OpenClaw already receives Discord messages. We need it to:
1. Forward messages from #voice-log to EMA at `POST http://localhost:4488/api/discord/message`
2. EMA processes, sends reply back via Discord API

**OR** (simpler): Add an EMA-side Discord webhook handler that OpenClaw triggers via MCP/HTTP.

### Commands That Work Day 1 (From VoiceCore's existing CommandParser)

| User types in #voice-log | EMA does |
|---|---|
| `open tasks` | Broadcasts workspace:commands navigate |
| `create task Fix the login bug` | Creates task in EMA |
| `brain dump I need to rethink the auth flow` | Captures to BrainDump |
| `ask claude What's the best OAuth pattern for Elixir?` | Claude Bridge → response |
| `show me proposals` | Navigates to Proposals view |
| `status` | Lists active agents |
| `morning briefing` | Dashboard standup summary |
| `search JWT authentication` | Vault search |
| _(anything else)_ | Jarvis conversation mode |

### Deliverables
- [ ] `Ema.Discord.Bridge` GenServer
- [ ] `POST /api/discord/message` webhook endpoint
- [ ] VoiceCore: add discord session type (text-only, no TTS)
- [ ] OpenClaw routing: #voice-log messages → EMA daemon
- [ ] Smoke test: type "create task Test voice" in Discord, verify task appears in EMA
- [ ] Smoke test: type "ask claude What is OTP?" in Discord, verify Claude responds

---

## Week 8: Persistent Sessions + Daemon Auto-Start Fix

> **Goal:** Sessions survive daemon restarts, Tauri launches daemon correctly

### 8.1 Daemon Auto-Start Fix

**Current:** Tauri can't connect to daemon — "Connection error: Connection failed"

**Investigation steps:**
```bash
cd ~/Projects/ema/daemon && mix phx.server
curl http://localhost:4488/api/health
# If that works, problem is in Tauri
```

**Likely fix:** Update `app/tauri/src/main.rs` to:
1. Spawn `mix phx.server` in daemon/ directory
2. Wait for port 4488 to be available (poll up to 30s)
3. Only then load the frontend WebView

**Code pattern:**
```rust
fn wait_for_daemon(max_secs: u64) -> bool {
  for _ in 0..max_secs {
    if std::net::TcpStream::connect("127.0.0.1:4488").is_ok() {
      return true;
    }
    std::thread::sleep(Duration::from_secs(1));
  }
  false
}
```

### 8.2 Session Persistence in DB

**Schema migration** — `claude_sessions` table:
- `session_id` (unique)
- `context_type` ("proposal", "task", "campaign", "discord", "voice")
- `context_id` (UUID)
- `model` ("sonnet", "opus", "haiku")
- `status` ("active", "paused", "completed")
- `memory` (JSONB — accumulated context)
- `token_count` (integer)
- `created_at`, `completed_at`

**Bridge enhancement:**
- `start_session()` → persists to DB
- `send_message()` → updates session memory in DB
- `resume_session(session_id)` → reloads from DB if not in GenServer state
- `list_active()` → returns sessions from DB (survives restarts)

### 8.3 VoiceCore Session Persistence

Discord sessions specifically need to survive daemon restarts (conversations shouldn't reset on redeploy).

```elixir
def resume_or_create_discord_session(channel_id) do
  # Check DB for active session for this channel
  case Repo.get_by(ClaudeSession, context_id: channel_id, status: "active") do
    nil ->
      # New session
      start_fresh_session(channel_id)
    session ->
      # Restore conversation history from session.memory
      {session.session_id, Conversation.from_memory(session.memory)}
  end
end
```

### Deliverables
- [ ] Daemon auto-starts when Tauri launches (verified with `npx tauri dev`)
- [ ] Session persistence migration + schema
- [ ] Bridge: start/send/resume with DB persistence
- [ ] Discord sessions survive daemon restart (conversation history preserved)
- [ ] Tests: session_test.exs covers create, send, resume, complete lifecycle

---

## Week 9: Campaign System

> **Goal:** Projects compound knowledge across multiple Claude sessions

### 9.1 Campaign Schema

```elixir
schema "campaigns" do
  field :slug, :string         # "auth-refactor"
  field :name, :string         # "Refactor Auth System"
  field :goal, :string         # What we're trying to accomplish
  field :status, :string       # active, paused, completed, archived
  field :sessions, {:array, :string}  # session_ids in order
  field :discoveries, :map     # accumulated learnings from sessions
  field :cost_usd, :decimal    # total cost across all sessions
  
  belongs_to :project, Ema.Projects.Project
  timestamps()
end
```

### 9.2 Campaign Lifecycle

```
Campaign: "Rewrite auth system"
├─ Session 1: "Analyze current code" 
│  → Discovers: 3 security gaps, 2 deprecated libraries
│  → Records discoveries in campaign.discoveries["analysis"]
├─ Session 2: "Design JWT solution" (inherits Session 1 discoveries)
│  → Discovers: JWT + refresh tokens + Redis for blacklist
│  → Records discoveries in campaign.discoveries["design"]
└─ Session 3: "Write implementation plan" (inherits both)
   → Sees both analysis AND design as context
   → Final output: detailed task list
```

### 9.3 Discovery Accumulation

Each session automatically:
1. Ends with `Bridge.extract_discoveries(session_id)` → calls Claude with "What did you learn?"
2. Stores structured discoveries in `campaign.discoveries[session_n]`
3. Next session's context includes: campaign.goal + all prior discoveries
4. Frontend shows campaign timeline with discoveries at each stage

### 9.4 Frontend UI: Campaign View

```
┌─────────────────────────────────────────────────────┐
│ Campaign: Auth Refactor                             │
│ Goal: Migrate from OAuth 2.0 to JWT + refresh tokens│
│ Status: Active · 3 sessions · $0.47 spent           │
├─────────────────────────────────────────────────────┤
│ Session 1 — Apr 3                     Complete ✅    │
│ > Analyzed current auth implementation              │
│ > Found: 3 security gaps, legacy endpoints          │
│                                                     │
│ Session 2 — Apr 4                     Complete ✅    │
│ > Designed JWT flow with refresh tokens             │
│ > Found: Redis needed for blacklist, rate limiting  │
│                                                     │
│ Session 3 — Now                       Running 🔨    │
│ > Creating implementation task list...              │
│                                                     │
│ [+ Start New Session]  [Pause Campaign]  [Archive] │
└─────────────────────────────────────────────────────┘
```

### Deliverables
- [ ] Campaign schema + migration
- [ ] `Ema.Campaigns` context (create, add_session, record_discovery, complete)
- [ ] Campaign-aware Bridge sessions (inject prior discoveries as context)
- [ ] Discovery extraction after each session
- [ ] Campaign view in React frontend
- [ ] API: POST /api/campaigns, GET /api/campaigns/:id/sessions
- [ ] Tests: campaign lifecycle (create → session 1 → discover → session 2 → complete)

---

## Week 10: 4 MVP Dispatch Affordances

> **Goal:** Make agent dispatching visible, smart, and self-correcting

### Affordance 1: Dispatch Board

Real-time view of all in-flight agent dispatches.

```
┌─────────────────────────────────────────────────────┐
│ DISPATCH BOARD                    3 running · 1 done│
├──────────────────┬──────────┬──────────┬────────────┤
│ Agent            │ Task     │ Status   │ Elapsed    │
├──────────────────┼──────────┼──────────┼────────────┤
│ 🔬 Researcher   │ Auth UX  │ running  │ 8m 32s     │
│ 💻 Coder        │ JWT impl │ running  │ 12m 01s    │
│ 📚 Vault Keeper │ Link fix │ running  │ 4m 15s     │
│ ⚙️ Ops          │ Health   │ ✅ done  │ 1m 22s     │
└──────────────────┴──────────┴──────────┴────────────┘
```

### Affordance 2: Scope Advisor

Before dispatch, checks outcome history and warns if scope is risky.

> ⚠️ **Warning:** Vault Keeper has timed out on 3 of 4 similar tasks. Suggest scoping to <50 files.

### Affordance 3: Deliberation Gate

Structural tasks (restructure, migrate, delete, rename) auto-route through Proposals pipeline before implementation.

> 🔷 **Deliberation Required:** This task contains structural keywords ("migrate"). A proposal will be generated first. After review, the implementation task will be created automatically.

### Affordance 4: Reflexion Injection

Before spawning, injects summary of last 3 outcomes:

```
## Lessons from recent outcomes:
What worked: Scope to specific module, not entire codebase
What failed: Asking Vault Keeper to scan >100 files (timeout x3)
What failed: Vague prompts without success criteria
```

### Deliverables
- [ ] `dispatch_tasks` schema + migration
- [ ] `Ema.DispatchTasks` context (create, update_status, list_in_flight, list_recent)
- [ ] `Ema.OutcomeTracker` (record, analyze_failure_pattern, infer_scope_limit)
- [ ] `Ema.AgentMemory.inject_reflexion/3`
- [ ] Dispatch Board React component (2s polling or WebSocket)
- [ ] Scope Advisor hook in task creation API
- [ ] Deliberation Gate structural keyword detection
- [ ] Tests: all 4 affordances unit tested

---

## Week 11: Autonomous Pipes

> **Goal:** Events trigger Claude actions without human input

### Pipe Templates (Ship With These 5)

| Pipe | Trigger | Claude Action | Output |
|---|---|---|---|
| **Morning Briefing** | Cron: 7am | Summarize overnight + today's priorities | Journal entry |
| **End-of-Day Review** | Cron: 6pm | What got done, what slipped, journal prompt | Journal entry |
| **Commit Review** | project:commit_pushed | Review diff, identify issues | Tasks |
| **Proposal Accepted** | proposal:accepted | Generate implementation tasks | Tasks |
| **Brain Dump Processor** | brain_dump:captured | Process, categorize, route | Notes/tasks |

### Architecture

```elixir
defmodule Ema.Pipes.ClaudeAction do
  schema "pipe_claude_actions" do
    field :pipe_id, references(:pipes)
    field :prompt_template, :text   # Handlebars/EEx style
    field :model, :string            # "sonnet", "opus", "haiku"
    field :quality_gate, :string     # "proposal", "code_review", "general"
    field :output_target, :string    # "task", "note", "journal", "proposal"
    field :output_schema, :map       # What fields to extract from Claude response
    timestamps()
  end
end

# Pipe executor
defmodule Ema.Pipes.Executor do
  def execute_claude_action(pipe, action, event_data) do
    prompt = render_template(action.prompt_template, event_data)
    
    {:ok, result} = Ema.Claude.Bridge.run(prompt, 
      model: action.model, 
      timeout: 120_000)
    
    structured = extract_structure(result, action.output_schema)
    route_output(structured, action.output_target)
  end
end
```

### Deliverables
- [ ] `pipe_claude_actions` schema + migration
- [ ] `Ema.Pipes.Executor.execute_claude_action/3`
- [ ] Template rendering (EEx with event context)
- [ ] Output routing (task, note, journal, proposal targets)
- [ ] 5 built-in pipe templates pre-configured
- [ ] Cron scheduler for time-based pipes (Morning Briefing, EOD Review)
- [ ] Pipe activity log in frontend
- [ ] Tests: each pipe template fires correctly

---

## Week 12: Second Brain ↔ Claude Integration

> **Goal:** Knowledge graph auto-links, Claude can query and contribute to it

### 12.1 Auto-Linking

When Claude generates content (proposals, notes, task descriptions):
1. Extract entity mentions (project names, person names, concepts)
2. Search Second Brain for matching notes
3. Append `[[wikilink]]` references to generated content
4. Optionally: create a new note if concept doesn't exist yet

### 12.2 Knowledge Gap Detection

Weekly Claude audit:
1. Read Second Brain graph (nodes + edges)
2. Identify disconnected clusters (concepts mentioned but not linked)
3. Create bridging note suggestions
4. Surface to user as "Knowledge Gaps" in frontend

### 12.3 Semantic Search → Claude Follow-Up

```
User: "search authentication"
  ↓
Second Brain semantic search → 8 notes returned
  ↓
"Ask Claude about these" button
  ↓
Claude reads all 8 notes + synthesizes → one cohesive answer
  ↓
Answer offered as new note ("Save to Second Brain?")
```

### 12.4 Progressive Summarization

Each note gets auto-summarized at multiple levels:
- **Detail:** full content (what's in the file)
- **Executive:** 3-5 key points
- **Headline:** one sentence

Stored as separate fields in VaultEntry. UI shows appropriate level based on context.

### Deliverables
- [ ] Entity extraction module (leverages existing embedding pipeline)
- [ ] Auto-linker: Claude output → extract mentions → append wikilinks
- [ ] Weekly knowledge gap audit pipe
- [ ] "Ask Claude about these results" in Second Brain search
- [ ] Progressive summarization on note save/update
- [ ] Frontend: knowledge gap suggestions panel
- [ ] Tests: entity extraction accuracy, auto-link correctness

---

## Week 13: Specialized Agents

> **Goal:** Domain-specific agents with distinct capabilities and personas

### The 6 Specialists

| Agent | Persona | Tools | When Used |
|---|---|---|---|
| **Strategist** | Analytical, long-horizon | Goals, Projects, Proposals | Quarterly planning, major decisions |
| **Researcher** | Thorough, source-citing | Web search, Second Brain, Vault | Deep dives, feasibility, competitive analysis |
| **Executor** | Precise, completion-focused | Bridge (CLI mode), Git, filesystem | Code implementation, task execution |
| **Reviewer** | Critical, standards-driven | Bridge, QualityGate, Governance | Code review, proposal review, audit |
| **Archivist** | Organized, link-focused | Second Brain, VaultIndex | Knowledge maintenance, note cleanup |
| **Coach** | Warm, progress-aware | Habits, Journal, Goals, Focus | Habit nudges, journal prompts, reflection |

### Agent Specialization Implementation

```elixir
defmodule Ema.Agents.Specialist do
  # Each agent has: 
  # - system_prompt (persona + tools it can use)
  # - tool_access (which EMA modules it can call)
  # - quality_gate (how its output gets verified)
  # - trigger_conditions (when it gets auto-invoked)
  
  def strategist_prompt do
    """
    You are the Strategist — a long-horizon analytical agent. 
    You see across projects, connect goals to tactics, and
    challenge assumptions before committing to plans.
    You have access to: goals, projects, proposals, past decisions.
    Be direct. Identify contradictions. Suggest before endorsing.
    """
  end
end
```

### 13.2 Inter-Agent Communication Bus

Agents communicate through structured messages, not free text:

```elixir
defmodule Ema.Agents.Message do
  schema "agent_messages" do
    field :from_agent, :string
    field :to_agent, :string
    field :message_type, :string  # "request", "result", "feedback", "escalation"
    field :payload, :map
    field :status, :string        # "pending", "delivered", "processed"
    field :campaign_id, :binary_id
    timestamps()
  end
end
```

### 13.3 Dispatcher Enhanced for Specialists

```
Strategist: "We need research on JWT vs session tokens"
  ↓ Dispatcher detects: research intent
  ↓ Routes to Researcher automatically
  ↓ Researcher: web search + Second Brain query
  ↓ Researcher posts result back to Dispatcher
  ↓ Dispatcher: delivers to Strategist's context
  ↓ Strategist: incorporates, updates proposal
  ↓ Dispatcher: routes completed proposal to Reviewer
  ↓ Reviewer: quality gate check
  ↓ All artifacts stored in campaign discoveries
```

### Deliverables
- [ ] 6 specialist agent configs (system prompts, tool access, quality gates)
- [ ] `agent_messages` schema + inter-agent message bus
- [ ] Dispatcher enhanced to route between specialists
- [ ] Auto-trigger conditions for each specialist
- [ ] Frontend: Agent roster view with capabilities + status
- [ ] Tests: each specialist responds correctly to their domain

---

## Week 14: Polish + Integration Test

> **Goal:** Everything works end-to-end, audit trails are clean, demo-ready

### 14.1 End-to-End Flow Test

Run a full workflow and verify every step:

```
1. User types in Discord #voice-log: "Create campaign for auth refactor"
   → Discord.Bridge receives → VoiceCore.send_text() → CommandParser
   → Campaign created in EMA
   → VoiceCore responds: "Campaign started: Auth Refactor"
   
2. User: "Start research session on JWT authentication"
   → Campaign session started → Researcher agent dispatched
   → Dispatch Board shows Researcher: running
   → Researcher searches web + Second Brain
   → Discoveries saved to campaign
   → VoiceCore responds: "Research complete. 5 discoveries saved."

3. User: "What did we find?"
   → VoiceCore → Conversation mode → Claude reads campaign.discoveries
   → Responds with synthesis of discoveries

4. User: "Create implementation tasks from the research"
   → Executor agent dispatched
   → Structural keyword detected → Deliberation Gate triggers
   → Proposal generated from discoveries
   → User approves proposal (Discord or Tauri)
   → Tasks created automatically
   → Reflexion Injection: executor gets context from prior outcome data

5. "morning briefing"
   → Autonomous Pipe triggers
   → Dashboard standup summary pulled
   → Tasks, habits, active campaigns surfaced
   → Posted to Discord automatically at 7am
```

### 14.2 Audit Trail UI

Full audit dashboard showing:
- Every Claude call: model, tokens, cost, prompt summary, output
- Every agent dispatch: who, what, result, duration
- Every campaign: sessions, discoveries, cost
- Every pipe execution: trigger, action, output

### 14.3 Stress Tests

- 10 concurrent VoiceCore sessions (Discord + Tauri)
- Campaign with 20 sessions (discovery accumulation performance)
- Dispatch Board with 6 parallel agents
- Autonomous pipes firing simultaneously (morning briefing + commit pushed at same time)
- Second Brain search with 500 notes

### 14.4 Documentation Updates

- Update CLAUDE.md with new module map
- Update vault: EMA Master Knowledge Base
- Record all API endpoints in vault/References/
- Architecture diagrams up-to-date

### Deliverables
- [ ] End-to-end workflow passes without errors
- [ ] Audit trail UI shows all agent activity
- [ ] Stress tests pass (no crashes, no OOM, no timeout cascades)
- [ ] CLAUDE.md updated with full current module map
- [ ] All vault documentation current

---

## Running Principles for This Sprint

### 1. Ship Small, Test Fast
Every week ends with a working demo. No "we'll integrate at the end." Each feature is wired up the day it's built.

### 2. Discover Before Building
Before implementing any module, read the existing code that touches it. No blind writes. No assumptions.

### 3. Test the Happy Path + One Failure Mode
For every new feature: test it works, and test it fails gracefully (daemon down, Claude timeout, invalid input).

### 4. Compounding Context
The whole point of this sprint is making EMA smarter session by session. Every PR should make the system better at accumulating and using context.

### 5. Voice is the Primary Interface
Voice/Discord integration is Week 7 for a reason — it's the most used input path. Everything else should be accessible via voice commands by Week 10.

---

## Cost Estimates (Claude API)

| Phase | Sessions / day | Model | Est. cost/day |
|---|---|---|---|
| Week 7-8 (Discord voice) | 20 short | haiku | ~$0.10 |
| Week 9 (campaigns, 2-3 sessions) | 10 medium | sonnet | ~$0.80 |
| Week 10 (dispatch, reflexion) | 5 reflexion queries | haiku | ~$0.05 |
| Week 11 (autonomous pipes) | 5 pipe triggers | sonnet | ~$0.50 |
| Week 12 (Second Brain) | 3 deep queries | sonnet | ~$0.30 |
| Week 13 (6 agents) | 15 specialist calls | mix | ~$1.00 |
| **Total sprint estimate** | | | **~$60-80 total** |

---

## Files Created by Sprint End

```
daemon/lib/ema/
├── discord/
│   ├── bridge.ex              # Discord ↔ VoiceCore bridge (Week 7)
│   └── session_manager.ex     # Per-channel session tracking
├── claude/
│   ├── bridge.ex              # Enhanced: session persistence (Week 8)
│   └── session.ex             # New Ecto schema for sessions
├── campaigns.ex               # New context: campaign system (Week 9)
├── dispatch_tasks.ex          # New context: dispatch tracking (Week 10)
├── outcome_tracker.ex         # New: outcome history (Week 10)
├── agent_memory.ex            # New: reflexion injection (Week 10)
├── pipes/
│   ├── executor.ex            # Enhanced: Claude actions (Week 11)
│   └── templates.ex           # 5 built-in pipe templates
├── second_brain/
│   ├── auto_linker.ex         # New: entity → wikilink (Week 12)
│   └── knowledge_audit.ex     # New: gap detection (Week 12)
└── agents/
    ├── specialist.ex          # New: 6 specialist configs (Week 13)
    └── message.ex             # New: inter-agent messages

app/src/
├── components/
│   ├── dispatch/DispatchBoard.tsx   # Week 10
│   ├── campaigns/CampaignView.tsx   # Week 9
│   └── audit/AuditDashboard.tsx     # Week 14
└── stores/
    ├── campaign-store.ts            # Week 9
    └── dispatch-store.ts            # Week 10
```

---

## Status Tracking

Each week closes with:
- GitHub commit tagged `week-N-complete`
- Vault sprint status updated
- MEMORY.md updated with what shipped
- CLAUDE.md updated with new module map

**Current week:** Week 7 (2026-04-04)  
**Next checkpoint:** Week 7 complete (2026-04-11)

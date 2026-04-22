---
title: "EMA Core Loop Audit — S1-S8 Architecture"
type: audit
status: active
created: 2026-04-03T22:40Z
updated: 2026-04-03T23:30Z
author: Coder (subagent)
tags: [ema, audit, architecture, core-loop, week-7, blockers]
confidence: 0.88
---

# EMA Core Loop Audit

**Scope:** S1-S8 subsystems, 31 contexts, 346 modules  
**Sources:** vault/EMA/, vault/System/, vault/Projects/, vault/Architecture/, vault/Research/, shared EMA bridge files  
**Note:** EMA daemon source is on FerrissesWheel (host machine), not on agent-vm. Audit is based on design docs, the shared bridge files at `~/shared/inbox-host/vm--ema-bridge-files/`, and vault documentation. Source code confidence: ~75% for subsystems with shared files, ~60% for others based on docs.

---

## 1. AUDIT MATRIX — S1-S8 vs. Status

| Subsystem | Module | Status | Evidence |
|---|---|---|---|
| **S1: Router** | `Ema.Claude.SmartRouter` | ✅ **IMPLEMENTED** | `smart_router.ex` in shared bridge files — full routing logic, 6 strategies, task classification |
| **S1: Router** | `Ema.Router` (intent classification) | ❌ **STUB** | Vault: "Router — intent classification (declared, stub implementation)" |
| **S1: Router** | `Ema.CampaignManager` | ❌ **STUB** | Vault: "declared, stub" — no actual campaign management logic |
| **S1: Router** | `Ema.Campaigns.Flow` | ❌ **NOT WRITTEN** | Vault: "Struct designed. Not written." Multiple sources confirm 0 lines of code |
| **S2: Bridge** | `Ema.Claude.Bridge` | ✅ **IMPLEMENTED** (sync mode) | `bridge.ex` in shared files — full GenServer, multi-session, SmartRouter integration |
| **S2: Bridge** | Bridge async dispatch callback | ❌ **NOT IMPLEMENTED** | Current pattern is `GenServer.call` (blocking). Vault: "Bridge dispatch still synchronous/blocking" |
| **S3: Task Manager** | `Ema.Tasks` (CRUD + lifecycle) | ✅ **IMPLEMENTED** | "Tasks context owns task creation + status transitions" — backend exists |
| **S3: Task Manager** | Assignment routing (to agents) | ⚠️ **PARTIAL** | "Dispatch Board dispatcher live" but proposal approval doesn't auto-route to agents |
| **S4: Projects API** | `GET /api/projects` (list) | ✅ **IMPLEMENTED** | EMA-HQ-MASTER-SYNTHESIS: "GET /api/projects — list all projects with status" — exists |
| **S4: Projects API** | `GET /api/projects/:id/context` | ❌ **NOT BUILT** | Multiple sources: "doesn't exist", "Shell exists, needs real data" — **Task A of Week 7** |
| **S5: Vault Integration** | `VaultWatcher` | ✅ **IMPLEMENTED** | "VaultWatcher: running (watches filesystem for changes)" |
| **S5: Vault Integration** | `GraphBuilder` (wikilink graph) | ✅ **IMPLEMENTED** | "GraphBuilder: running (builds static graph from wikilinks)" |
| **S5: Vault Integration** | Semantic search / embeddings | ❌ **NOT RUNNING** | "Semantic indexing: NOT running (vault not indexed, no embeddings)" |
| **S5: Vault Integration** | `Superman.VectorStore` | ❌ **DESIGNED ONLY** | superman-architecture.md has full spec, 0 lines running |
| **S6: Superman Context Injection** | `.superman` file reader (runtime) | ❌ **NOT RUNNING** | "files exist as documentation only" — no runtime reader |
| **S6: Superman Context Injection** | `Superman.context_for/2` | ❌ **DESIGNED ONLY** | Spec exists in vault (architecture + research docs). 0 lines of engine code |
| **S6: Superman Context Injection** | `Superman.Indexer` GenServer | ❌ **DESIGNED ONLY** | Full design in superman-architecture.md, not running |
| **S7: Campaign Execution** | ProposalEngine (Generator → Tagger) | ✅ **IMPLEMENTED** | "Proposal engine live" — full pipeline wired, PubSub chain works |
| **S7: Campaign Execution** | Proposal auto-dispatch on approval | ❌ **NOT WIRED** | "Proposal dispatch not automated — can approve but doesn't route to agents" |
| **S7: Campaign Execution** | `ClaudeSessions.SessionWatcher` | ✅ **IMPLEMENTED** | "SessionWatcher: running" — polls `~/.claude/projects/*.jsonl` |
| **S8: Observability** | PubSub broadcasting (`executions:all`) | ✅ **IMPLEMENTED** | "WebSocket channel executions:all broadcasting" |
| **S8: Observability** | `Ema.Intelligence.*` (VmMonitor, TrustScorer, etc.) | ⚠️ **PARTIAL** | In OTP supervision tree (ARCHITECTURE.md) but depth of implementation unclear |
| **S8: Observability** | Dispatch Board (visual) | ❌ **NOT BUILT** | "Needs Campaign.Flow topology" — depends on S1 stub |
| **S8: Observability** | Honcho integration | ❌ **STUBBED** | "Honcho: stubbed, returns dummy data" |

---

## 2. ANSWERS TO CRITICAL QUESTIONS

### Q1: Is Campaign.Flow State Machine Implemented?

**Answer: NO**

**Evidence:**
- `vault/System/FINAL-PASSOVER-2026-04-03.md`: `| **Campaign.Flow** | Struct designed. Not written. |`
- `vault/System/EMA-HQ-MASTER-SYNTHESIS-2026-04-03.md`: "Agents — Dispatch board. Dispatcher live. Needs Campaign.Flow topology."
- `vault/Projects/EMA-Superman-HQ-NextSteps-2026-04-03.md`: "Campaign topology doesn't exist — `Ema.Campaigns.Flow` struct not written, dispatch board blocked"

**What exists:** A design spec in `FINAL-PASSOVER-2026-04-03.md` showing the intended struct:
```elixir
defmodule Ema.Campaigns.Flow do
  defstruct [:id, :name, :run_id, :campaign_id, steps: [], edges: []]
end

defmodule Ema.Campaigns.Step do
  defstruct [
    :id, :agent_id, :prompt_template,
    dependencies: [],
    status: :pending,   # :pending | :running | :done | :failed
    started_at: nil, completed_at: nil, elapsed_ms: nil, error: nil
  ]
end
```
States designed: `:forming → :ready → :running → :completed`

**What's missing:** The actual `lib/ema/campaigns/flow.ex` file — not written, confirmed by multiple independent sources.

---

### Q2: Does Bridge Have Async Dispatch Callback?

**Answer: NO — Bridge is synchronous/blocking**

**Evidence from `bridge.ex` source (shared file):**
```elixir
def run(prompt, opts \\ []) do
  timeout = Keyword.get(opts, :timeout, @default_timeout)
  # ...
  GenServer.call(__MODULE__, {:run, prompt, opts}, timeout)  # ← BLOCKING CALL
end

def send_message(session_id, message, opts \\ []) do
  timeout = Keyword.get(opts, :timeout, @default_timeout)
  GenServer.call(__MODULE__, {:send_message, session_id, message, opts}, timeout)  # ← BLOCKING CALL
end
```

**From vault docs:** 
- `EMA-Phase-2-Corrected-Roadmap`: "Current pattern (broken): `{:ok, result} = Bridge.send_message(session, prompt)` — **BLOCKS**"
- `EMA-SYSTEM-DISCOVERY-AUDIT.md`: "Bridge dispatch working → Sync/blocking (would freeze agents)"
- `START-HERE-EMA-SESSION-SUMMARY.md`: "OpenClaw VPS — Bridge dispatch still manual/synchronous"

**What's designed for Track D (Week 7):**
```elixir
# New pattern (not yet built):
{:ok, task_id} = Bridge.spawn_async(session, prompt, callback: &handle_result/1)
# Returns immediately, result comes back via callback/event
```

---

### Q3: Does `/api/projects/:id/context` Exist?

**Answer: NO — Not built**

**Evidence:**
- `EMA-Superman-HQ-NextSteps`: "HQ has no real data — everything renders mock data, `/api/projects/:id/context` doesn't exist"
- `START-HERE-EMA-SESSION-SUMMARY`: "Build the /api/projects/:id/context endpoint" listed as critical Week 7 task
- `EMA-HQ-MASTER-SYNTHESIS`: "Dashboard — Needs /api/projects/:id/context endpoint. Shell exists, needs real data."

**What's specified (from EMA-Phase-2-Corrected-Roadmap):**
```json
GET /api/projects/:id/context

Response:
{
  "project_id": "proj_123",
  "name": "StudioKamel",
  "description": "...",
  "last_commit": { "sha": "abc123", "message": "...", "timestamp": "..." },
  "active_tasks": [{ "id": "task_1", "status": "running", "agent": "coder" }],
  "recent_proposals": [{ "id": "prop_1", "title": "...", "status": "approved" }],
  "active_campaign": { "id": "camp_1", "goal": "...", "discoveries": [...] },
  "last_execution": { "id": "exec_1", "status": "success", "timestamp": "..." }
}
```

**Caveat:** Some fields (last_commit, render_deploy_status) require integrations not yet wired. MVP can return SQLite-only data (active_tasks, recent_proposals, last_execution are all available now).

---

### Q4: What Is Superman's `context_for()` Signature?

**Answer: DESIGNED (not implemented)**

**Designed spec from `vault/Architecture/Intelligence-Integrations/superman-architecture.md`:**
```elixir
def context_for(project_id, opts \\ []) do
  Superman.Context.for_project(project_id, opts)
end

# opts:
#   max_tokens: 4000  (default)
#   include: [:superman_file, :vault_notes, :tasks, :proposals, :executions, :brain_dump_clusters]
```

**Returns:**
```elixir
%Superman.Context{
  project_id: project_id,
  generated_at: DateTime,
  token_count: integer,
  identity: %{...},          # from .superman IDENTITY
  active_intents: [%{...}],  # from .superman INTENT entries
  constraints: [%{...}],     # from .superman CONSTRAINT entries
  related_vault_notes: [...], # semantically similar vault files
  active_tasks: [...],
  recent_proposals: [...],
  recent_executions: [...]
}
```

**Loomkin-inspired tiered variant (from `EMA-Deep-Context-Synthesis`):**
```elixir
def context_for(project_id, opts \\ []) do
  hot  = get_recent_items(project_id, hours: 2)        # Always include
  warm = get_accessed_items(project_id, hours: 48)      # Include if budget allows
  cold_headers = get_cold_headers(project_id)           # Headers only
  assemble(hot, warm, cold_headers, max_tokens: opts[:tokens] || 15_000)
end
```

**Current implementation status:** 0 lines of engine code. Superman has VaultWatcher + GraphBuilder (static wikilink graph) but NO embedding pipeline, NO vector store, NO `context_for` runtime. The spec is complete; the code doesn't exist.

---

### Q5: What Blocks Task Dispatch End-to-End?

**Answer: Chain of 5 blockers**

```
BLOCKER CHAIN (must resolve in order):

1. Tauri daemon auto-start failing
   → App launches but daemon doesn't start ("Connection failed")
   → Blocks: every demo, every UI interaction
   → Fix: code audit of daemon spawn path (2-3h)

2. Proposal dispatch NOT automated
   → Manual approval doesn't route to agents
   → Blocks: autonomous proposal → agent execution
   → Fix: wire Proposal.approved event → Agent.dispatch (2-4h)

3. Bridge is synchronous
   → `Bridge.send_message` blocks calling process
   → Blocks: safe async agent dispatch, concurrent task execution
   → Fix: implement `Bridge.spawn_async/3` with callback (3h, Track D)

4. Campaign.Flow struct not written
   → No state machine for multi-step campaigns
   → Blocks: Dispatch Board visualization, campaign tracking
   → Fix: write `lib/ema/campaigns/flow.ex` (2h, Task B)

5. /api/projects/:id/context not built
   → HQ renders mock data
   → Blocks: real-time project context in frontend
   → Fix: implement controller + context assembler (3-4h, Task A)
```

**Secondary blockers (don't block dispatch but block intelligence):**
- Honcho not running (returns dummy data) → no pre-dispatch context injection
- Superman indexing not running → no semantic search
- OpenClaw VPS services down (oauth-guardian + gateway) → agents can't be dispatched remotely

---

### Q6: What's the Critical Path for Week 7?

**Answer: A → B → (C‖D‖E) in dependency order**

```
Week 7 Critical Path:

Task A: /api/projects/:id/context endpoint (3-4h) [FIRST]
  ↓ (B requires context assembler foundation from A)
Task B: Campaigns.Flow state machine (2h) [SECOND]
  ↓ (C requires Flow struct; D is independent; E requires A)
  ↓
  ┌─────────────────────────────────────────┐
  ▼           ▼                             ▼
Track C:    Track D:                  Track E:
Dispatch    Bridge Async              Scope Advisor
Board       Callback                  (needs outcome
(4h)        (3h)                      data — Week 8)
  │           │
  └─────┬─────┘
        ▼
  Setup Tasks (parallel with everything):
  - Honcho Decision (30 min decision)
  - Prompts Table Schema (2h)
  - OpenClaw VPS restart (15 min)
```

**Dependency rationale:**
- A before B: Campaign context is part of the project context endpoint; B adds `active_campaign` field to A's response
- B before C: Dispatch Board needs `Ema.Campaigns.Flow` struct for topology visualization
- A before E: Scope Advisor reads outcome history, but early MVP can use static heuristics
- D is independent: Bridge async refactor doesn't depend on A or B

**Total Week 7 effort:** ~22h coding + 8h setup tasks = ~30h

---

### Q7: Which Subsystems Are Stubs vs. Implemented?

**STATUS MATRIX:**

| Subsystem | Component | Status | Confidence |
|---|---|---|---|
| **S1: Router** | `SmartRouter` (AI routing) | ✅ IMPLEMENTED | High (source seen) |
| **S1: Router** | `Ema.Router` (intent classifier) | ❌ STUB | High (multiple vault sources) |
| **S1: Router** | `CampaignManager` | ❌ STUB | High (vault: "declared, stub") |
| **S1: Router** | `Campaigns.Flow` | ❌ NOT WRITTEN | High (vault: "struct designed, not written") |
| **S2: Bridge** | `Claude.Bridge` (sync) | ✅ IMPLEMENTED | High (source seen) |
| **S2: Bridge** | `Bridge.spawn_async` (async+callback) | ❌ NOT BUILT | High (vault: "still sync") |
| **S3: Task Manager** | Tasks CRUD + lifecycle | ✅ IMPLEMENTED | High |
| **S3: Task Manager** | Auto-assignment to agents | ❌ NOT WIRED | High |
| **S4: Projects API** | `/api/projects` (list) | ✅ IMPLEMENTED | High |
| **S4: Projects API** | `/api/projects/:id/context` | ❌ NOT BUILT | Very High (definitive) |
| **S5: Vault Integration** | `VaultWatcher` | ✅ RUNNING | High |
| **S5: Vault Integration** | `GraphBuilder` | ✅ RUNNING | High |
| **S5: Vault Integration** | Semantic embedding pipeline | ❌ NOT RUNNING | Very High (definitive) |
| **S5: Vault Integration** | `VectorStore` (sqlite-vss) | ❌ NOT BUILT | Very High |
| **S6: Superman** | `.superman` file reader | ❌ NOT RUNNING | Very High |
| **S6: Superman** | `context_for/2` runtime | ❌ NOT BUILT | Very High |
| **S6: Superman** | Knowledge graph engine | ❌ ZERO LINES | Very High (definitive) |
| **S7: Campaign Exec** | ProposalEngine (full pipeline) | ✅ IMPLEMENTED | High |
| **S7: Campaign Exec** | Proposal auto-dispatch | ❌ NOT WIRED | High |
| **S7: Campaign Exec** | `SessionWatcher` | ✅ RUNNING | High |
| **S8: Observability** | PubSub + WebSocket broadcast | ✅ RUNNING | High |
| **S8: Observability** | Dispatch Board (visual) | ❌ NOT BUILT | High |
| **S8: Observability** | Honcho pre-dispatch context | ❌ STUBBED | Very High |

**Summary:**
- ✅ Implemented/Running: S2 (sync only), S3 (CRUD), S4 (list), S5 (file watcher), S7 (proposal pipeline + session watcher), S8 (pubsub)
- ❌ Stub/Not Built: S1 (Router, CampaignManager, Flow), S2 (async), S4 (context endpoint), S5 (semantic), S6 (all of Superman), S7 (auto-dispatch), S8 (visual board, Honcho)

---

### Q8: What's the Resource Bottleneck?

**Answer: Human time is the critical constraint. Code complexity is the secondary constraint.**

**Breakdown:**

| Resource | Bottleneck Level | Evidence |
|---|---|---|
| **Human time (Trajan)** | 🔴 CRITICAL | 30h/week for Week 7; 56h total for Phase 2; multiple decisions pending (Honcho, vault strategy) |
| **Compute** | 🟢 LOW | Local machine, local Ollama, local SQLite — no scale limits at personal use |
| **Memory** | 🟢 LOW | EMA is single-machine, SQLite is under 1GB, vault is file-based |
| **API calls** | 🟡 MEDIUM | Claude CLI usage has cost, but can route to Ollama for bulk tasks |
| **External dependencies** | 🟡 MEDIUM | Tauri auto-start (blocking demo), OpenClaw VPS down (blocking remote dispatch), Honcho not running |

**Specific human time gaps:**
- **Decision pending**: Honcho — managed v3 vs. self-hosted v2 vs. skip. Unblocks Week 8 Reflexion Injection.
- **Root cause unknown**: Tauri daemon auto-start failure. Needs manual debugging session on FerrissesWheel.
- **Integration priority**: Which 3 integrations (GitHub, Discord, Drive) first? Unblocks Week 8b.
- **Vault sync strategy**: Full semantic search or keyword fallback? Unblocks Superman phase.

**Code complexity bottlenecks:**
1. Superman indexing pipeline (requires Ollama setup, Ecto migration, indexer GenServer, vector search)
2. Bridge async refactor (breaking change — all callsites must be updated)
3. `/api/projects/:id/context` (requires context assembler + partial mock for missing integrations)

---

## 3. DEPENDENCY GRAPH

```
Which subsystems block which:

S4 (Projects API context endpoint)
  └─ blocks → S6 (Superman context injection — needs endpoint to serve results)
  └─ blocks → HQ frontend real-time data

S1: Campaigns.Flow
  └─ blocks → S8 (Dispatch Board — needs topology struct)
  └─ blocks → S7 (Campaign execution tracking)

S2: Bridge async callback
  └─ blocks → Safe concurrent agent dispatch
  └─ blocks → S7 auto-dispatch (proposals route through async bridge)

S5: Semantic embedding pipeline
  └─ blocks → S6 (Superman context_for — needs embeddings for semantic search)
  └─ blocks → S8 (Honcho integration — needs index data)

S6: Superman context_for
  └─ blocks → Pre-dispatch agent context injection (Week 8+)
  └─ blocks → /api/projects/:id/context full semantic section

S3: Auto-assignment (proposal → agent routing)
  └─ blocks → Autonomous execution loop (currently manual)

External blockers:
  Tauri daemon auto-start → blocks all UI interaction
  OpenClaw VPS down → blocks remote agent dispatch
  Honcho decision → blocks Week 8 Reflexion Injection
```

**Key insight:** S4 (context endpoint) and S1 (Campaign.Flow) are the two Week 7 enablers. Everything intelligent (S6 Superman, S8 Dispatch Board) waits on these two.

---

## 4. CRITICAL PATH DIAGRAM — WEEK 7

```
DAY 1-2: Unblock Foundation

  Tauri fix (host) ──────────────────────────────→ Demo possible
  OpenClaw VPS restart (15 min) ─────────────────→ Remote dispatch works
  
  Task A: /api/projects/:id/context (3-4h)
    ├── Read existing Projects schema
    ├── Build context assembler (tasks + proposals + executions from SQLite)
    ├── Add controller + route
    └── Return: project + tasks + proposals + last_execution
                ↓
DAY 2-3: State Machine

  Task B: Campaigns.Flow (2h)
    ├── Write lib/ema/campaigns/flow.ex
    ├── Add :forming → :ready → :running → :completed states
    ├── Add to OTP supervision tree
    └── Wire campaign_id to projects context (A's response gains active_campaign)
                ↓
DAY 3-5: Parallel Tracks

  Track C: Dispatch Board (4h)         Track D: Bridge Async (3h)
    ├── DispatchBoardChannel (WS)         ├── Bridge.spawn_async/3
    ├── React DispatchBoard.tsx           ├── Callback pattern
    ├── ExecutionNode + ExecutionEdge     ├── Update all callsites (6)
    └── Zustand dispatchBoardStore        └── Tests (sync → async breaking change)

DAY 5-7: Setup + Cleanup

  Honcho Decision (30 min) → Docker run if going managed
  Prompts Table Schema (2h)
  Fix 10 test failures (daemon)
  
WEEK 7 SUCCESS CRITERIA:
  ✓ curl /api/projects/:id/context returns 200 + real data
  ✓ Campaign status visible in context response
  ✓ Dispatch Board shows in-flight agents (basic)
  ✓ Bridge dispatch returns immediately (async)
```

---

## 5. DELIVERABLE SUMMARY

### Audit Matrix (S1-S8)

| S# | Subsystem | Implemented | Stubbed | Missing |
|----|-----------|-------------|---------|---------|
| S1 | Router | SmartRouter (AI routing) | Ema.Router (intent), CampaignManager | Campaigns.Flow state machine |
| S2 | Bridge | Bridge (sync), all adapters | — | Bridge.spawn_async (async callback) |
| S3 | Task Manager | Tasks CRUD, lifecycle | — | Auto-assignment to agents |
| S4 | Projects API | /api/projects (list) | — | /api/projects/:id/context |
| S5 | Vault Integration | VaultWatcher, GraphBuilder | — | Embedding pipeline, VectorStore |
| S6 | Superman | — | — | **ALL** (context_for, Indexer, KnowledgeGraph, runtime) |
| S7 | Campaign Execution | ProposalEngine, SessionWatcher | — | Proposal auto-dispatch |
| S8 | Observability | PubSub/WebSocket | Honcho | Dispatch Board (visual), full Honcho |

---

## 6. CONFIDENCE SCORES

| Finding | Confidence | Basis |
|---|---|---|
| Campaign.Flow not written | 0.97 | Multiple independent vault sources, all consistent |
| Bridge is synchronous | 0.95 | Source code seen directly in bridge.ex |
| /api/projects/:id/context missing | 0.97 | Multiple docs, explicit "doesn't exist" statement |
| Superman has 0 runtime code | 0.95 | "Zero lines" explicitly stated; VaultWatcher ≠ Superman engine |
| ProposalEngine is live | 0.85 | Vault: "Pipeline wired", execution loop working |
| Tauri daemon auto-start broken | 0.90 | Multiple sources, "Connection failed" error documented |
| SmartRouter implemented | 0.90 | Source file seen, full implementation visible |
| VaultWatcher/GraphBuilder running | 0.85 | Architecture doc + master synthesis both confirm |

---

## 7. RECOMMENDATIONS FOR WEEK 7

**Priority 1 (Do Today — No Code Required):**
1. SSH to FerrissesWheel → debug Tauri daemon auto-start (race condition or wrong RPC path)
2. SSH to OpenClaw VPS → `systemctl restart oauth-guardian openclaw-gateway`
3. Make Honcho decision: managed v3 (sign up) vs. self-hosted vs. skip

**Priority 2 (Week 7 Core — 30h):**
1. Implement `GET /api/projects/:id/context` (Task A — unblocks everything)
2. Write `Ema.Campaigns.Flow` (Task B — 2h, enables Dispatch Board)
3. Build basic Dispatch Board UI (Track C — enables visibility)
4. Refactor Bridge to async (Track D — enables safe concurrent dispatch)

**Priority 3 (Week 7 Setup — 8h):**
- Fix 10 daemon test failures
- Prompts table schema
- Bridge callsite updates (6 locations)

**Defer to Week 9:**
- Superman knowledge graph (full semantic pipeline)
- Vault embedding pipeline (Ollama + sqlite-vss)

---

## STATUS

**DONE_WITH_CONCERNS**

**Concerns:**
1. EMA daemon source is on FerrissesWheel, not accessible from agent-vm. Audit based on shared bridge files + vault docs (~75% confidence). Cannot verify exact module-level status for S3, S4, S7 internal state without direct source access.
2. Tauri daemon auto-start root cause is unknown — needs debugging session on host machine that was not possible from agent-vm.
3. The `/api/projects/:id/context` spec mentions `last_commit` and `render_deploy_status` fields that require GitHub/Render integrations not yet wired — MVP can return SQLite-only fields but needs explicit decision on whether to mock or omit integration fields.

**Files consulted:**
- `/home/trajan/shared/inbox-host/vm--ema-bridge-files/bridge.ex`
- `/home/trajan/shared/inbox-host/vm--ema-bridge-files/smart_router.ex`
- `/home/trajan/.openclaw/agents/main/workspace/OPENCLAW-EMA-SYSTEM-MARRIAGE-DESIGN.md`
- `/home/trajan/.openclaw/agents/main/workspace/EMA-SYSTEM-DISCOVERY-AND-CLARIFICATION.md`
- `/home/trajan/vault/System/EMA-SYSTEM-DISCOVERY-AUDIT.md`
- `/home/trajan/vault/System/EMA-HQ-MASTER-SYNTHESIS-2026-04-03.md`
- `/home/trajan/vault/System/FINAL-PASSOVER-2026-04-03.md`
- `/home/trajan/vault/System/START-HERE-EMA-SESSION-SUMMARY.md`
- `/home/trajan/vault/System/MASTER-SYSTEM-OVERVIEW.md`
- `/home/trajan/vault/Projects/EMA-Phase-2-Corrected-Roadmap-2026-04-03.md`
- `/home/trajan/vault/Projects/EMA-Superman-HQ-NextSteps-2026-04-03.md`
- `/home/trajan/vault/Research/EMA-Deep-Context-Synthesis-2026-04-03.md`
- `/home/trajan/vault/Architecture/Intelligence-Integrations/superman-architecture.md`
- `/home/trajan/Projects/ema/docs/ARCHITECTURE.md`
- `/home/trajan/Projects/ema/docs/API_CONTRACTS.md`
- `/home/trajan/Projects/ema/docs/PHASE2_EXECUTION_PLAN.md`

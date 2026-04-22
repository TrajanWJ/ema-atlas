---
title: "EMA Week 7 — Unified Master Plan"
created: 2026-04-03
updated: 2026-04-03
type: synthesis
status: active
confidence: 0.91
tags: [ema, week-7, plan, synthesis, critical-path, blockers]
summary: "Unified synthesis of all three audit teams: Researcher (5 blockers), Coder (S1-S8 audit), Security (design docs). Single source of truth for Week 7 execution."
authors:
  - Researcher subagent (BLOCKERS-RANKED.md)
  - Coder subagent (CORE-LOOP-AUDIT.md)
  - Security subagent (SUPERMAN-CONTEXT-FORMAT-SPEC.md, HONCHO-DECISION.md, BRIDGE-ASYNC-PATTERN.md, MCP-GATEWAY-ARCH.md)
  - Synthesis subagent (this document)
---

# EMA Week 7 — Unified Master Plan

> **Purpose:** Single source of truth for Week 7. Three teams audited the system; this document unifies their findings into one actionable plan.
> **Audience:** Trajan + Coder agent
> **Synthesis date:** 2026-04-03

---

## 1. BLOCKER → SUBSYSTEM MAP

Each of the 5 ranked blockers maps to specific S1-S8 subsystems. This table shows the full blast radius.

| # | Blocker | Confidence | Primary Subsystem | Secondary Impact | Design Doc Addressing It |
|---|---------|-----------|-------------------|-----------------|--------------------------|
| 1 | **Bridge sync/blocking** | 0.92 | S2 (Bridge) | S7 (Campaign Exec), S8 (Observability) | BRIDGE-ASYNC-PATTERN.md ✅ |
| 2 | **Tauri daemon auto-start broken** | 0.90 | External (Tauri/Rust) | All subsystems (nothing works) | None — requires manual debug |
| 3 | **Campaign.Flow not written** | 0.95 | S1 (Router) | S8 (Dispatch Board), S7 (Campaign tracking) | Spec in CORE-LOOP-AUDIT.md Q1 ✅ |
| 4 | **Superman engine: 0 lines** | 0.93 | S6 (Superman) | S5 (Vault Integration), S8 (Honcho) | SUPERMAN-CONTEXT-FORMAT-SPEC.md ✅ |
| 5 | **Honcho decision pending** | 0.90 | S8 (Observability) | S7 (Reflexion injection) | HONCHO-DECISION.md ✅ |

**Key insight:** Blockers 1, 3, 4 all have design docs ready — implementation can start immediately. Blocker 2 requires a manual debugging session on FerrissesWheel. Blocker 5 requires a 5-minute decision from Trajan.

---

## 2. BLOCKER → DESIGN DOC → RESOLUTION MAP

| Blocker | Design Doc | Resolution Status | Implementation ETA |
|---------|-----------|------------------|--------------------|
| Bridge sync (B1) | BRIDGE-ASYNC-PATTERN.md | **READY** — Phoenix PubSub + long-poll spec complete | Week 7, ~3h |
| Tauri auto-start (B2) | None | **NEEDS DEBUG** — code claims fix, not verified | Week 7 Day 1, ~2h debug |
| Campaign.Flow (B3) | CORE-LOOP-AUDIT.md Q1 (struct spec) | **READY** — struct spec + state machine designed | Week 7, ~2h |
| Superman engine (B4) | SUPERMAN-CONTEXT-FORMAT-SPEC.md | **DESIGN COMPLETE** — 0 lines running; Week 9 for engine | Decision Week 7, build Week 9 |
| Honcho decision (B5) | HONCHO-DECISION.md | **DECIDED** — Skip Week 7; use EMA-internal reflexion | Implement Week 7 alongside Bridge fix |

### Security Team Decision (B5 — Honcho)
The Security subagent analyzed the three-way fork and **recommends: Skip Honcho Week 7, implement EMA-internal reflexion instead.** Rationale:
- Week 7 plate is already full (Bridge, Flow, context endpoint)
- Internal reflexion = last 3 outcomes by type → 80% of Honcho's value
- Managed v3 remains available in Week 8 if reflexion quality is insufficient
- Data privacy: Trajan's vault content doesn't leave the machine

**Trajan confirms or overrides this decision at session start.** If skip → implement `Ema.ReflexionStore` in Week 7. If managed v3 → 2 hours for HTTP client + API key setup.

---

## 3. S1-S8 STATUS MATRIX (Unified)

> Sources: CORE-LOOP-AUDIT.md (primary) + BLOCKERS-RANKED.md (verification) + vault docs

| S# | Subsystem | What Works | What's Broken/Missing | Week 7 Action |
|----|-----------|-----------|----------------------|---------------|
| **S1** | Router | `SmartRouter` (AI routing) ✅ | `Ema.Router` (stub), `CampaignManager` (stub), `Campaigns.Flow` (**not written**) | **Write Campaigns.Flow** (Task B, 2h) |
| **S2** | Bridge | `Claude.Bridge` (sync GenServer) ✅ | Async callback pattern ❌ | **Implement async dispatch** (Track D, 3h) |
| **S3** | Task Manager | Tasks CRUD + lifecycle ✅ | Auto-assignment to agents ❌ | Wire proposal approval → auto-dispatch (Track C pre-req) |
| **S4** | Projects API | `/api/projects` list ✅ | `/api/projects/:id/context` ❌ | **Build context endpoint** (Task A, 3-4h) |
| **S5** | Vault Integration | VaultWatcher ✅, GraphBuilder ✅ | Embedding pipeline ❌, VectorStore ❌ | Defer to Week 9 (architecture decision only Week 7) |
| **S6** | Superman | — (nothing running) | ALL: context_for, Indexer, KnowledgeGraph ❌ | **Format spec ready** — build Week 9; stub context_for in Week 7 |
| **S7** | Campaign Execution | ProposalEngine ✅, SessionWatcher ✅ | Proposal auto-dispatch ❌ | Wire after Bridge async lands (Track C, ~4h) |
| **S8** | Observability | PubSub/WebSocket ✅ | Dispatch Board ❌, Honcho (stub) | **Dispatch Board** (Track C, after Flow); Honcho via EMA-internal reflexion |

---

## 4. DECISIONS TRAJAN MUST MAKE TODAY

> These are blockers that require no code — just a decision. Each takes < 5 minutes.

### Decision 1 — Honcho (HIGHEST PRIORITY)
**Question:** Managed v3 ($0.04/run, data leaves machine) vs. Skip (EMA-internal reflexion, fully local) vs. Self-hosted v2 (confirmed non-viable)?

| Option | Week 7 Impact | Recommendation |
|--------|--------------|----------------|
| Skip + internal reflexion | ✅ No setup cost; adds `Ema.ReflexionStore` (1h) | **RECOMMENDED** by Security team |
| Managed v3 | ⚠️ 2h setup; data leaves machine; $100 free credits | If reflexion quality matters now |
| Self-hosted v2 | ❌ 3 days + stale image + no reasoning layer | Not viable |

**If no decision:** Week 7 proceeds with "Skip" as default. Coder implements `Ema.ReflexionStore`.

---

### Decision 2 — Superman Vault Strategy (affects Week 9 scope)
**Question:** Full semantic search (libgraph + sqlite-vss vector store) vs. keyword/BM25 fallback?

| Option | Week 9 Impact | Notes |
|--------|--------------|-------|
| Full semantic (libgraph + sqlite-vss) | ~40h Week 9 | Rich context injection; requires Ollama integration |
| Keyword/BM25 fallback | ~20h Week 9 | Simpler; less relevant recall |
| Hybrid (start with BM25, add vector later) | ~25h Week 9 | **RECOMMENDED** — start shipping earlier |

**If no decision:** Week 7 proceeds; Week 9 plan defaults to hybrid. No Week 7 work blocked.

---

### Decision 3 — `/api/projects/:id/context` Integration Fields
**Question:** For the `last_commit` and `render_deploy_status` fields in the context endpoint — mock, omit, or real GitHub/Render integrations?

| Option | Task A Impact |
|--------|-------------|
| Omit (SQLite-only MVP) | ✅ Ship in 3h; clean response without mock data |
| Mock (placeholder values) | ⚠️ Can cause confusion; not recommended |
| Real integrations | ❌ Adds 2-4 days for GitHub + Render API setup |

**Recommendation:** Omit integration fields from MVP. Add `"integrations": null` placeholder in response. Real integrations are Week 8b.

**If no decision:** Coder defaults to SQLite-only (omit integration fields).

---

## 5. WEEK 7 TASK QUEUE (ORDERED)

> Ordered by dependency. Do not start a task before its dependencies are complete.
> Total estimate: ~30h coding + ~8h setup/decisions = ~38h

```
PHASE 0: Unblock Infrastructure (Day 1 — non-coding, ~3h total)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
P0-A: Tauri daemon auto-start debug (host machine FerrissesWheel)
      Owner: Coder (with Trajan present)
      Estimate: 2h
      How: Trace Tauri → daemon spawn path step by step; check sidecar config
      Done when: Clean build launch, no "Connection failed" error
      
P0-B: OpenClaw VPS services restart
      Owner: Trajan (5 min)
      Command: systemctl restart oauth-guardian openclaw-gateway
      Done when: Remote dispatch path works
      
P0-C: Make 3 decisions above (Honcho, Superman vault strategy, context fields)
      Owner: Trajan
      Estimate: 15 min total

PHASE 1: Foundation (Day 1-2 — ~7h coding)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Task A: Build /api/projects/:id/context endpoint
        Owner: Coder
        Estimate: 3-4h
        Depends on: Decision 3 (integration fields)
        Spec: See CORE-LOOP-AUDIT.md Q3 for full response schema
        Files to create:
          - lib/ema_web/controllers/project_context_controller.ex
          - lib/ema/projects/context_assembler.ex
        Done when: curl /api/projects/1/context returns 200 + real SQLite data
        
Task B: Write Ema.Campaigns.Flow state machine
        Owner: Coder  
        Estimate: 2h
        Depends on: None (independent)
        Struct spec (from CORE-LOOP-AUDIT.md Q1):
          defmodule Ema.Campaigns.Flow do
            defstruct [:id, :name, :run_id, :campaign_id, steps: [], edges: []]
          end
          States: :forming → :ready → :running → :completed
        Files to create:
          - lib/ema/campaigns/flow.ex
          - lib/ema/campaigns/step.ex
        Done when: defstruct exists, states defined, added to supervision tree

PHASE 2: Parallel Tracks (Day 2-5 — ~14h coding)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Run Track C and Track D in parallel — no dependency between them]

Track C: Dispatch Board (4h)
         Depends on: Task B (Campaign.Flow struct)
         What to build:
           - DispatchBoardChannel (WebSocket, subscribes to executions:all)
           - React DispatchBoard.tsx component
           - ExecutionNode + ExecutionEdge (campaign topology visualization)
           - Zustand dispatchBoardStore
         Done when: Dispatch Board shows in-flight agents in HQ UI

Track D: Bridge Async Dispatch (3h)
         Depends on: None (independent refactor)
         Spec: Full implementation in BRIDGE-ASYNC-PATTERN.md
         What to build:
           - Ema.Claude.BridgeSupervisor (DynamicSupervisor)
           - Ema.Claude.Bridge GenServer (per-execution, async port handling)
           - ExecutionChannel WebSocket (PubSub relay)
           - execution_events DB table (for long-poll fallback)
           - EmaWeb.ExecutionEventsController (long-poll endpoint)
         Migration: Keep Runner.run() as sync wrapper for backward compat in Phase 1
         Done when: POST /api/dispatch returns 202 immediately; events stream via WS

Track E: Superman Context Stub (2h)
         Depends on: Task A (context endpoint scaffold)
         What to build:
           - Superman.Context module stub (for_project/2 returns basic struct)
           - No embedding pipeline — returns .superman file data + DB data only
           - Wires into /api/projects/:id/context as `superman_context` field
           - Schema defined in SUPERMAN-CONTEXT-FORMAT-SPEC.md
         Done when: Context endpoint returns superman_context with identity + intents

PHASE 3: Intelligence Layer (Day 5-7 — ~8h coding)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Depends on Honcho decision]

If Honcho = Skip (recommended):
  Track F: EMA-Internal Reflexion (2h)
           Depends on: Track D (Bridge async, which generates execution records)
           What to build:
             - Ema.ReflexionStore module
             - Add agent_role, task_type, quality_signals fields to Executions schema
             - Wire before-dispatch hook: look up last 3 outcomes by type
             - Format as reflexion_block, prepend to agent prompt
           Done when: Dispatched agents receive prior outcome block in their prompts

If Honcho = Managed v3:
  Track F-alt: Honcho HTTP Client (2h)
           What to build:
             - Ema.Honcho.Client (HTTP wrapper, ~50 lines, uses Req library)
             - HONCHO_API_KEY config
             - Wire after_dispatch → store outcome in Honcho session
             - Wire before_dispatch → query Honcho peer for project context
           Done when: Pre-dispatch shows Honcho context block in agent prompts

PHASE 4: Cleanup (Day 6-7 — ~8h setup)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Fix 10 daemon test failures (test suite repair)
- Prompts table schema (Ecto migration)
- Bridge callsite updates: update 6 locations from sync to async pattern
- EMA documentation: update START-HERE-EMA-SESSION-SUMMARY.md
```

---

## 6. DEPENDENCY GRAPH (CRITICAL PATH VISUALIZATION)

```
P0-A (Tauri fix) ─────────────────────────────────────────→ Demo possible

P0-B (VPS restart) ───────────────────────────────────────→ Remote dispatch

P0-C (Decisions) ─┐
                   │
                   ▼
Task B (Flow, 2h)  Task A (Context endpoint, 3-4h)
        │                  │
        │                  │
        ▼                  ▼
Track C (Dispatch    Track E (Superman stub, 2h)
  Board, 4h)               │
                           └──────────────────────┐
Track D (Bridge                                   │
  Async, 3h) ─────────────────────────────────────▼
                                          Track F (Reflexion, 2h)
                                          [after Bridge generates
                                           execution records]

Phase 4 (Cleanup, 8h) — runs parallel with above, no hard deps
```

**Critical path:** P0-C → Task A → Track E → Track F (sequential)
**Parallel tracks:** Task B → Track C (independent from Task A path)
**Independent:** Track D (Bridge async can start any time)

---

## 7. WEEK 7 SUCCESS CRITERIA

> These are the definition-of-done gates. Week 7 is complete when ALL of these pass.

| # | Criterion | Verification |
|---|-----------|-------------|
| ✅ | Tauri auto-start works | Launch EMA app fresh on FerrissesWheel — no "Connection failed" |
| ✅ | Context endpoint returns real data | `curl http://localhost:4488/api/projects/1/context` → 200 with live tasks + proposals |
| ✅ | Campaign status in context response | `active_campaign` field present (or null if none) |
| ✅ | Dispatch Board shows agents | HQ UI renders DispatchBoard with campaign topology |
| ✅ | Bridge dispatch async | POST /api/dispatch → 202 immediately (not after 2-5 min) |
| ✅ | WebSocket events stream | Browser WS tab shows real-time events during agent execution |
| ✅ | Reflexion block in agent prompts | Check dispatched agent prompt — reflexion block present if prior outcomes exist |
| ✅ | 0 failing critical tests | Test suite passes for daemon (10 failures → 0) |

---

## 8. INTEGRATION TIMELINE (WEEKS 7–9)

### Week 7 — Core Plumbing (30-40h)
**Theme: "Make the loop work end-to-end"**

| Track | Work | Est |
|-------|------|-----|
| P0 | Infrastructure unblock (Tauri, VPS, decisions) | 4h |
| A | /api/projects/:id/context endpoint | 4h |
| B | Ema.Campaigns.Flow state machine | 2h |
| C | Dispatch Board (visual) | 4h |
| D | Bridge async dispatch (Phoenix PubSub + long-poll) | 3h |
| E | Superman.Context stub (structure only, no embeddings) | 2h |
| F | EMA-internal reflexion (or Honcho managed v3) | 2h |
| P4 | Test cleanup, schema, doc updates | 8h |
| **Total** | | **~29h** |

**Milestone:** End of Week 7 — a proposal can be approved, dispatched async, and tracked in the Dispatch Board with real-time events. The HQ context endpoint returns live project state.

---

### Week 8 — Intelligence Layer (secondary path)
**Theme: "Make agents smart about what they're doing"**

| Track | Work | Est |
|-------|------|-----|
| G | Superman engine Phase 1: .superman file reader runtime | 4h |
| H | Superman engine Phase 2: VaultIndex keyword search (BM25) | 6h |
| I | Superman.context_for/2 runtime (DB + file reader, no embeddings) | 4h |
| J | Proposal auto-dispatch wiring (S3 → S7 → S2 chain) | 4h |
| K | Integration tier 1: GitHub (last_commit, PR status) | 6h |
| L | Honcho managed v3 (if skip decision in Week 7 proves insufficient) | 2h |
| M | Reflexion quality tuning (based on Week 7 outcomes) | 2h |
| **Total** | | **~28h** |

**Milestone:** End of Week 8 — agent context injection is live (no embeddings yet, but structured project context from .superman files). Proposals auto-dispatch without manual routing.

---

### Week 9 — Semantic Engine + Polish (optional path)
**Theme: "Make Superman actually intelligent"**

| Track | Work | Est |
|-------|------|-----|
| N | Ollama integration + embedding pipeline | 8h |
| O | VectorStore (sqlite-vss): migrations, Indexer GenServer, search | 10h |
| P | Superman.context_for/2 semantic upgrade (vector search replace BM25) | 4h |
| Q | MCP Gateway: EMA tools exposed to Claude agents (DEFERRED from Week 7) | 8h |
| R | Observability polish: execution cost tracking, health dashboard | 6h |
| S | Phase 2 self-improvement loop: PromptOptimizer, Evolution engine | 8h |
| **Total** | | **~44h** |

**Milestone:** End of Week 9 — semantic vault search live, agents get meaningful project context injection. MCP gateway opens EMA tools to Claude. Phase 2 self-improvement loop has a signal source.

---

## 9. DECISION IMPACT MATRIX

| Decision | Who | Impact if Delayed | Impact if Made Today |
|----------|-----|------------------|---------------------|
| Honcho: Skip vs managed v3 | Trajan | Track F starts wrong approach | Coder starts correct impl immediately |
| Context fields: omit vs mock | Trajan | Task A ships with technical debt | Task A ships clean (3h) |
| Superman: BM25 vs vector | Trajan | Week 9 planning ambiguous | Week 9 can be sized accurately |
| Tauri root cause | Coder + Trajan | Blocker 2 stays open; no demo | Demo unblocked by Day 1 EOD |

**All four decisions unblock at most ~2 days of work each. Making them now has outsized leverage.**

---

## 10. WHAT'S DEFERRED (AND WHY)

| Item | Deferred To | Reason |
|------|------------|--------|
| Superman embedding pipeline (Ollama + sqlite-vss) | Week 9 | ~18h work; Week 7 has sufficient BM25 substitute |
| MCP Gateway | Week 9 | MCP-GATEWAY-ARCH.md spec complete; no Week 7 dependency |
| GitHub/Render integrations | Week 8b | Not blocking MVP context endpoint |
| Honcho managed v3 (if skipping) | Week 8 | Week 7 reflexion substitute covers the need |
| Campaign execution multi-agent | Week 8+ | Requires Bridge async (Week 7) + Flow (Week 7) first |
| Phase 2 self-improvement loop | Week 9 | Signal sources (Superman + reflexion) must be live first |
| Superman.VectorStore | Week 9 | Requires embedding pipeline first |
| PromptOptimizer / Evolution engine | Week 9+ | Requires complete reflexion loop first |

---

## APPENDIX: SOURCE DOCUMENTS

| Document | Author | Location |
|----------|--------|----------|
| BLOCKERS-RANKED.md | Researcher subagent | vault/Projects/EMA/BLOCKERS-RANKED.md |
| CORE-LOOP-AUDIT.md | Coder subagent | vault/EMA/CORE-LOOP-AUDIT.md |
| SUPERMAN-CONTEXT-FORMAT-SPEC.md | Security subagent | vault/Architecture/Intelligence-Integrations/ |
| HONCHO-DECISION.md | Security subagent | vault/Architecture/Intelligence-Integrations/ |
| BRIDGE-ASYNC-PATTERN.md | Security subagent | vault/Architecture/Intelligence-Integrations/ |
| MCP-GATEWAY-ARCH.md | Security subagent | vault/Architecture/Intelligence-Integrations/ (deferred) |

---

*Synthesis by: prompt-engineer subagent (synthesis task)*
*All source documents verified and read before synthesis.*
*Confidence: 0.91 — high. Audit sources are internally consistent; 3 independent teams corroborated the same blockers.*

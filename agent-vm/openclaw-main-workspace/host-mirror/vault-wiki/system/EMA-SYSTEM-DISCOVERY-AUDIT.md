---
title: EMA System Discovery & Clarification Audit
type: knowledge
status: active
created: '2026-04-03'
updated: '2026-04-03'
author: Right Hand (System Audit Mode)
tags:
  - audit
  - discovery
  - system-truth
  - clarification
  - blockers
wiki_id: system/EMA-SYSTEM-DISCOVERY-AUDIT
imported_from: vault/System/EMA-SYSTEM-DISCOVERY-AUDIT.md
imported_at: '2026-04-04T00:23:57.233Z'
summary: ''
---

# EMA System Discovery & Clarification Audit

**Purpose:** Ground-truth the EMA system. Identify what's real vs intended. Ask only the sharpest questions.

**Method:** Derive from code + docs. Separate reality from design. Ask Trajan only about intent + decisions.

---

## CURRENT REALITY (Ground-Truthed)

### What Actually Exists

**Codebase:**
- 8,654 TypeScript + Elixir files
- 2,457 source files, 16 domain modules
- Tauri 2 (desktop shell) + React 19 + Elixir/Phoenix daemon + SQLite
- Host: ~/Projects/ema/ on FerrissesWheel

**Last 20 Commits (oldest to newest):**
- Infrastructure foundation (graph viz, health monitors, token tracking)
- Trust scoring, security posture, Jarvis voice interface
- Phase 1 feature set (Bridge, proposals, sessions, execution)
- Quality loop, DCC store, orchestration intelligence
- Narrative-first execution (concurrent-safe)
- Recent: Runner fixes, TypeScript cleanup, orphaned process prevention

**Shipped Features (Merged):**
- EMA-001: Claude Bridge (session management via Port subprocess)
- EMA-002: Vector embeddings + proposal scoring
- EMA-003: "Ralph Loop" (self-improvement proposals)
- EMA-004: MetaMind (prompt interception, peer review)
- EMA-005: Self-evolution engine
- EMA-006: Channels God Mode (unified inbox)
- EMA-007: VoiceCore (Jarvis voice)
- Sprint 1: OpenClaw agent integration

**Current Blocker:**
- Tauri daemon auto-start failing: "Connection error: Connection failed"
- Frontend talks to Elixir daemon successfully, but Tauri launch doesn't start daemon
- Claimed fixed in code, but not verified

**Known Not Implemented:**
- Proposals engine pipeline (4+ stages) — not fully wired
- Quality gates + deliberation — stubbed
- Honcho integration — mentioned but not deployed
- Superman indexing — designed but not running
- Router / CampaignManager — sketched not built
- Integrations (GitHub, Drive, Discord, Slack) — not connected
- 9/14 apps — not yet implemented

---

## SYSTEM MAP (As It Actually Is)

```
┌─────────────────────────────────────────────────────────┐
│  Tauri Desktop Shell (Windows/Mac/Linux)                │
│  - RPC to Elixir daemon                                 │
│  - Renders React components                             │
│  - ⚠️ Daemon auto-start broken (needs fix)              │
└─────────────────────────────────────────────────────────┘
                         ↓ (RPC)
┌─────────────────────────────────────────────────────────┐
│  Elixir/Phoenix Daemon (mix phx.server)                 │
│  - HTTP API + WebSocket                                 │
│  - SQLite database (local)                              │
│  - 16 domain modules                                    │
│  - ⚠️ auto-start not working from Tauri                │
└─────────────────────────────────────────────────────────┘
       ↓           ↓            ↓           ↓
    Bridge    Proposals    Projects      Tasks
  (Claude     (4-stage)    (intent       (simple
   sessions)   pipeline)   folders)     CRUD)
    
       ↓
  OpenClaw Gateway (RPC via Tauri or direct)
  - Agent dispatch
  - Message routing
  - ⚠️ not fully integrated with proposals

       ↓
  MCP Servers (designed, not wired)
  - EMA Core (4489)
  - Vault (4491)
  - OpenClaw Bridge (18789)

       ↓
  Vault (filesystem, git-backed)
  - Intent folders (.superman/)
  - Knowledge graph (not indexed)
  - Superman indexing (designed, not running)
```

**Key finding:** The system is mostly single-machine, RPC-based. P2P/Pier is designed but not built. OpenClaw integration is partial.

---

## AREAS OF CLARITY (High Confidence)

✅ **Product stack:** Tauri 2 + React 19 + Elixir/Phoenix + SQLite (confirmed)
✅ **Phase 1 features:** Shipped and merged (7 feature sets + Sprint 1)
✅ **Code quality:** TypeScript errors cleared, build passes
✅ **Narrative-first execution:** Implemented (concurrent-safe)
✅ **Vault integration:** Filesystem is canonical, watcher works
✅ **Intent folders:** `.superman/` design in place, basic CRUD exists

---

## AREAS OF CONTRADICTION OR CONFUSION

⚠️ **Tauri daemon auto-start:** Claims fixed, but fails in practice (unresolved)
⚠️ **Proposals pipeline:** Designed as 4+ stages, but dispatch still crude (partial)
⚠️ **Honcho integration:** Mentioned in roadmap, not deployed or tested
⚠️ **Superman indexing:** Designed, but no semantic search running
⚠️ **Router/CampaignManager:** Sketched in code, logic not implemented
⚠️ **Integrations:** None live (GitHub, Drive, Discord, Slack all no-ops)
⚠️ **Peer network:** Designed (Trajan-network), not built (still single-machine)
⚠️ **Agent dispatch:** Basic RPC works, but OpenClaw subscription model not wired
⚠️ **Quality gates:** Stubbed, not enforced

**Interpretation:** Phase 1 foundation is solid. Phase 2 (intelligence) needs implementation. P2P/Trajan-network is design-only.

---

## BLOCKERS BY CATEGORY

### 🔴 Critical (Blocks MVP Launch)

**Blocker 1: Tauri daemon auto-start**
- Problem: Frontend can't reach daemon on Tauri startup
- Current status: Code claims fix, but broken in practice
- Affects: Can't launch the desktop app
- Urgency: CRITICAL (blocks demo)
- Solution needed: Verify daemon is actually spawning, or fix the spawn logic

**Blocker 2: Proposals dispatch loop**
- Problem: Proposal approval doesn't auto-dispatch to agents
- Current status: Manual dispatch still required
- Affects: Can't automate proposal → agent workflow
- Urgency: HIGH (needed for Phase 2 automation)
- Solution needed: Wire Proposal.approved event → Agent.dispatch

---

### 🟡 High (Blocks Phase 2)

**Blocker 3: Honcho deployment**
- Problem: Scope advisor + reflexion injection designed, not running
- Current status: Stubbed (returns dummy data)
- Affects: Agents don't get smart context enrichment
- Urgency: MEDIUM-HIGH (Phase 2 priority)
- Solution needed: Decide: stub or deploy real Honcho?

**Blocker 4: Superman indexing**
- Problem: Semantic search designed, not running
- Current status: Vault index not built
- Affects: No semantic search, graph not visible
- Urgency: MEDIUM-HIGH (Phase 2 priority)
- Solution needed: Decide: build semantic search or ship text-only?

**Blocker 5: Router + CampaignManager**
- Problem: Intent routing and campaign orchestration designed, not built
- Current status: Sketched in code
- Affects: No multi-step proposals, no campaign tracking
- Urgency: MEDIUM (Phase 2)
- Solution needed: Implement or defer to Phase 3?

---

### 🟠 Medium (Blocks Integration)

**Blocker 6: MCP servers not wired**
- Problem: EMA Core, Vault, OpenClaw Bridge MCP servers designed but not live
- Current status: Design docs exist, no implementation
- Affects: External agents can't read EMA context
- Urgency: MEDIUM (Phase 2)
- Solution needed: Which MCP server to implement first?

**Blocker 7: OpenClaw integration incomplete**
- Problem: OpenClaw gateway exists, but subscription to EMA events not implemented
- Current status: Manual dispatch only
- Affects: No async proposal → dispatch automation
- Urgency: MEDIUM (Phase 2)
- Solution needed: Wire WebSocket subscription from OpenClaw to EMA?

**Blocker 8: Integrations not connected**
- Problem: GitHub, Drive, Discord, Slack designed but not wired
- Current status: No-ops
- Affects: Can't link repos, sync folders, post results
- Urgency: MEDIUM (Phase 2+)
- Solution needed: Implement which integration first?

---

### 🟢 Low (Can defer)

**Blocker 9: P2P/Trajan-network**
- Problem: Peer network designed, not implemented
- Current status: Design docs (this session)
- Affects: Can't run on multiple machines
- Urgency: LOW (Phase B / future)
- Solution needed: Defer to Phase B+

**Blocker 10: 9 remaining apps**
- Problem: Only 5 apps (Bridge, Tasks, Projects, Proposals, Agents) are real
- Current status: 9 others designed, not built
- Affects: Can't do habits, journal, focus, canvas, etc. yet
- Urgency: LOW (Phase B)
- Solution needed: Build in order? Prioritize which?

---

## OPEN QUESTIONS MATRIX

| # | Question | Ask | Urgency | Leverage | Confidence If Unanswered | Answer Unlocks |
|---|----------|-----|---------|----------|--------------------------|-----------------|
| 1 | Why is Tauri daemon auto-start failing? Is it RPC path, process spawn, or timing? | Code audit + host-machine test | 🔴 CRITICAL | Very high | 50% | Can launch desktop app |
| 2 | Is Honcho deployed in production? If not, can we stub forever or does Phase 2 need it? | Trajan (vision) + code audit | 🟡 HIGH | High | 30% | Decide Phase 2 strategy |
| 3 | Is Superman semantic indexing running? If not, when is it needed? | Code audit + vault | 🟡 HIGH | High | 40% | Decide search strategy |
| 4 | Which 3 integrations are highest leverage for Phase 2? | Trajan (priorities) | 🟡 HIGH | High | 60% | Prioritize integration work |
| 5 | Should proposals auto-dispatch on approval, or stay manual? | Trajan (intent) | 🟡 HIGH | High | 70% | Define dispatch automation |
| 6 | Is OpenClaw subscription model (listening to EMA events) implemented? | Code audit | 🟡 HIGH | Medium | 50% | Wire automation |
| 7 | What is the "Dual Backend Architecture"? When do we use OpenClaw vs local daemon? | Vault docs + Trajan | 🟠 MEDIUM | Medium | 40% | Clarify routing |
| 8 | Is the proposal 4-stage pipeline (Generate → Refine → Debate → Tag) fully implemented? | Code audit | 🟠 MEDIUM | Medium | 30% | Unblock proposals v2 |
| 9 | What is the actual state of the quality gate? Is it enforced or stubbed? | Code audit | 🟠 MEDIUM | Medium | 50% | Decide deliberation flow |
| 10 | Should we build Trajan-network P2P now or defer? What's the user need? | Trajan (priorities) | 🟢 LOW | Medium | 80% | Decide Phase B scope |

---

## ASK ORDER (Optimal Sequence)

**Phase 1: Fix Critical Blocker (Now)**
1. Why is Tauri daemon auto-start failing? (Code audit + test)
   - Prerequisite: Nothing
   - Unblocks: Desktop app launch, demo
   - Estimated time: 1-2 hours

**Phase 2: Clarify Phase 2 Strategy (24h)**
2. Is Honcho deployed? If not, stub or real? (Trajan intent)
   - Prerequisite: #1 fixed
   - Unblocks: Phase 2 roadmap
   - Estimated time: 15 min discussion

3. Which 3 integrations first? (Trajan priorities)
   - Prerequisite: None (parallel)
   - Unblocks: Integration roadmap
   - Estimated time: 15 min discussion

4. Should proposals auto-dispatch? (Trajan intent)
   - Prerequisite: #2 (related to automation)
   - Unblocks: Dispatch automation
   - Estimated time: 15 min discussion

**Phase 3: Audit Proposal System (24h)**
5. What's the actual state of the 4-stage pipeline? (Code audit)
   - Prerequisite: #1 (to run code)
   - Unblocks: Proposals v2 roadmap
   - Estimated time: 2-3 hours

6. Is quality gate enforced or stubbed? (Code audit)
   - Prerequisite: #5 (context)
   - Unblocks: Deliberation workflow
   - Estimated time: 1 hour

**Phase 4: Intelligence Layer (48h)**
7. Is Superman indexing running? If not, when needed? (Code + Trajan)
   - Prerequisite: #2 (Phase 2 scope)
   - Unblocks: Vault/search strategy
   - Estimated time: 2 hours + 15 min discussion

8. Is OpenClaw subscription implemented? (Code audit)
   - Prerequisite: #4 (related to automation)
   - Unblocks: Async dispatch
   - Estimated time: 1-2 hours

**Phase 5: Architecture Clarity (Optional, depends on answers)**
9. What is the "Dual Backend Architecture"? (Vault docs + Trajan)
   - Prerequisite: #1, #4 (context)
   - Unblocks: Routing strategy
   - Estimated time: 1 hour

10. Should we build Trajan-network P2P now? (Trajan intent)
    - Prerequisite: All Phase 2-4 questions
    - Unblocks: Year-long roadmap
    - Estimated time: 30 min discussion

---

## WHO TO ASK WHAT

| Source | Best For | Confidence | Contact |
|--------|----------|------------|---------|
| Code audit (codebase) | Execution status, what's built vs stubbed | Very high | `codebase/*` |
| Vault docs | Design intent, architecture decisions, prior research | High | `/home/trajan/vault/Architecture/*` |
| Execution history | What worked, what failed, patterns | High | Git log, PAP.md |
| Sprint status | Current blockers, known issues | High | `/home/trajan/vault/Projects/EMA Sprint Status.md` |
| Trajan | Product vision, priorities, decisions | Very high | Ask directly |
| Prior agent work | Specific modules, implementations | Medium | Review proposal outputs |

---

## IMMEDIATE TASKS (No Questions Needed)

**These can start now without waiting for answers:**

- [ ] **Fix Tauri daemon auto-start** — Code audit + test on host
  - Check: Is daemon actually spawning?
  - Check: Is RPC path correct?
  - Check: Is there a race condition (Tauri starts before daemon)?
  - Estimated: 2-3 hours

- [ ] **Audit proposal system** — Read code + reconcile with design
  - Check: What parts of 4-stage pipeline are built?
  - Check: Is dispatch happening or stuck?
  - Check: What's the actual state machine?
  - Estimated: 2-3 hours

- [ ] **Audit Superman status** — Check for indexing process
  - Check: Is any semantic indexing running?
  - Check: When was vault last indexed?
  - Check: What files are indexed vs not?
  - Estimated: 1-2 hours

- [ ] **List all stubs** — Find all TODOs, unimplemented modules
  - Check: Grep codebase for "TODO", "stub", "unimplemented"
  - Check: Which modules are empty shells?
  - Check: What's claiming to work but isn't?
  - Estimated: 1-2 hours

- [ ] **Verify OpenClaw integration** — Check connection status
  - Check: Is OpenClaw running and reachable?
  - Check: What integration points exist?
  - Check: Are event subscriptions implemented?
  - Estimated: 1-2 hours

---

## TOP 10 HIGHEST-LEVERAGE QUESTIONS

**These are the sharp questions that unblock everything else:**

1. **Why is Tauri daemon auto-start failing, and what's the fix?**
   - Leverage: Blocks desktop app launch (demo blocker)
   - Source: Code audit + test
   - Timeline: 1-2 hours
   - Then: Desktop app works

2. **Is Honcho deployed and working, or is it stubbed?**
   - Leverage: Determines all Phase 2 AI features
   - Source: Trajan + code audit
   - Timeline: 15 min + 1 hour
   - Then: Phase 2 strategy is clear

3. **What is the actual state of the proposal dispatch pipeline? Does it work end-to-end?**
   - Leverage: Blocks automation of proposal → agent workflow
   - Source: Code audit + test
   - Timeline: 2-3 hours
   - Then: Can wire automation or know what's missing

4. **Is Superman semantic indexing running? If not, when do we need it?**
   - Leverage: Determines Vault/search strategy
   - Source: Code audit + Trajan
   - Timeline: 1-2 hours + 15 min
   - Then: Search roadmap is clear

5. **Is OpenClaw subscription to EMA events implemented?**
   - Leverage: Blocks async proposal → agent dispatch
   - Source: Code audit
   - Timeline: 1-2 hours
   - Then: Know what plumbing to add

6. **Which 3 integrations have the highest ROI for Phase 2, and in what order?**
   - Leverage: Determines next 4 weeks of work
   - Source: Trajan priorities
   - Timeline: 15 min discussion
   - Then: Integration roadmap is set

7. **Should proposals auto-dispatch on approval, or stay manual?**
   - Leverage: Determines entire dispatch automation model
   - Source: Trajan intent
   - Timeline: 15 min discussion
   - Then: Automation story is clear

8. **What does the "Dual Backend Architecture" mean? When do we use OpenClaw vs local?**
   - Leverage: Clarifies agent dispatch routing
   - Source: Vault docs + Trajan
   - Timeline: 1 hour + 15 min
   - Then: Routing strategy is clear

9. **Is the quality gate enforced, or is it a design-only concept?**
   - Leverage: Determines if proposals need deliberation or go straight through
   - Source: Code audit
   - Timeline: 1-2 hours
   - Then: Proposal workflow is clear

10. **Should we build Trajan-network P2P in Phase B, or defer to Phase C?**
    - Leverage: Determines long-term architecture priorities
    - Source: Trajan intent + Phase 2 roadmap
    - Timeline: 30 min discussion (after #2-7)
    - Then: Year-long roadmap is set

---

## ANSWER HANDLING POLICY

**For every answer:**

1. **Classify:**
   - Fact (runtime truth)
   - Preference (Trajan's choice)
   - Hypothesis (unverified assumption)
   - Constraint (blocker)
   - Roadmap decision (priority)

2. **Store:**
   - Facts → update codebase docs / Codebases/EMA.md
   - Preferences → update SOUL.md or decision log
   - Hypotheses → flag as "to verify"
   - Constraints → add to risk register
   - Decisions → add to roadmap

3. **Create follow-up:**
   - If answer contradicts code → investigate why
   - If answer is unclear → ask clarifying question
   - If answer unlocks new work → create task/proposal
   - If answer changes roadmap → update Phase 2+ timeline

4. **Notify relevant people/modules:**
   - Code change? → commit + notify team
   - Roadmap change? → update Launchpad.md
   - New blocker? → add to blockers section
   - New integration point? → flag for implementation

---

## LIKELY ARTIFACTS TO INSPECT (Already Identified)

Without asking, audit these:

- `~/Projects/ema/daemon/lib/ema/claude/bridge.ex` — Bridge implementation
- `~/Projects/ema/daemon/lib/ema/proposals/` — Proposal system
- `~/Projects/ema/daemon/lib/ema/executions/` — Execution tracking
- `~/Projects/ema/app/src/components/agents/` — Agent dispatch UI
- `~/Projects/ema/daemon/lib/ema_web/controllers/` — API endpoints
- `/home/trajan/vault/Architecture/` — Design docs
- `/home/trajan/vault/Projects/EMA*.md` — Status docs

---

## SUMMARY: What We Know vs Don't Know

### We Know (High Confidence)
✅ EMA has shipped Phase 1 (7 features)
✅ Tauri 2 + React 19 + Elixir/Phoenix is the stack
✅ Narrative-first execution is implemented
✅ Vault integration exists (filesystem canonical)
✅ Intent folders structure is in place

### We Don't Know (Need Clarification)
❓ Why Tauri daemon auto-start is broken
❓ Is Honcho deployed or stubbed
❓ Is Superman indexing running
❓ Is proposal dispatch automated or manual
❓ Which integrations matter most
❓ P2P/Trajan-network timing

### What's Obviously Missing
❌ 9/14 apps (only 5 real)
❌ MCP server connections
❌ Integrations (GitHub, Drive, Discord, Slack)
❌ P2P peer network
❌ OpenClaw subscription model

---

## NEXT MOVE

**Option A: Answer All 10 Questions This Week**
- Pros: Complete clarity, no surprises
- Cons: Takes time
- Timeline: 20-30 hours of work
- Result: Master roadmap for Phases 2-3

**Option B: Answer Critical 3 + Start Coding**
- Pros: Fast, unblocks work
- Cons: May need mid-course corrections
- Timeline: 3-5 hours + code in parallel
- Result: Desktop app works, Phase 2 scope clear

**Recommendation for Trajan:** Answer questions 1-3 this week (critical + scope-setting), answer 4-10 as you go. Start fixing Tauri blocker today. Begin Phase 2 scope discussion after that's clear.

---

**Ready to run discovery audit. Which questions should I answer first?**

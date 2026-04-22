# EMA System Blockers — Ranked
*Analysis date: 2026-04-03 | Analyst: Researcher subagent*
*Sources: SESSION_CONTRADICTIONS_AND_RESOLUTIONS.md (10 contradictions), EMA-SYSTEM-DISCOVERY-AND-CLARIFICATION.md (20 open questions), vault architecture docs*
*Status: DONE_WITH_CONCERNS*

---

## Ranking Methodology

Blockers ranked by: **Severity × Breadth × Urgency** — how many systems does it block, how hard is it to work around, and how immediately does it impede the next work sprint.

---

## BLOCKER 1 — Bridge Dispatch is Synchronous/Blocking
**Rank: #1 | Confidence: 0.92**

### Why It Blocks
`Bridge.send_message()` in `bridge.ex` uses a synchronous request-response pattern. When a proposal is dispatched, the calling process blocks until Claude CLI returns. This means:
- EMA daemon freezes during any Claude invocation
- OpenClaw integration can't call Bridge safely (would freeze the gateway process)
- Concurrent dispatch (required for campaign multi-agent execution) is impossible
- The entire execution loop stalls on any slow or hung Claude invocation

### Impact If Unresolved
- Phase 2 automation loop **cannot ship** — approved proposals can't auto-dispatch
- Multi-agent campaigns are structurally impossible
- A single stuck invocation brings down the whole daemon
- 120s timeout (current Claude.Runner setting) creates 2-minute freeze per failed dispatch

### Owner
Coder agent / Trajan

### ETA
Week 7 (identified as critical path in corrected roadmap)

### Cross-References
- `SESSION_CONTRADICTIONS_AND_RESOLUTIONS.md` — Item #6, lines 80–97: *"Bridge dispatch still synchronous/blocking... confirmed issue"*
- `SESSION_CONTRADICTIONS_AND_RESOLUTIONS.md` — Summary table, line ~130: *"Bridge dispatch broken → Confirmed sync/blocking → Week 7 fix"*
- `EMA-SYSTEM-DISCOVERY-AND-CLARIFICATION.md` — Q8 (line ~180): *"What is the current Bridge.send_message() contract, and is it sync or async?"*
- `EMA-SYSTEM-DISCOVERY-AUDIT.md` — Areas of contradiction: *"Agent dispatch: Basic RPC works, but OpenClaw subscription model not wired"*
- `EMA Dual Backend Architecture.md` — Mode comparison table: dual backends both rely on subprocess port, no async wrapper documented

### Resolution Required
Implement async callback pattern: spawn Elixir Task, fire-and-forget Bridge call, handle results via EMA event stream. Ref: SESSION_CONTRADICTIONS_AND_RESOLUTIONS.md resolution notes.

---

## BLOCKER 2 — Tauri Daemon Auto-Start Broken
**Rank: #2 | Confidence: 0.90**

### Why It Blocks
The Tauri desktop shell fails to auto-start the Elixir daemon on app launch. Users see "Connection failed" error. The frontend can talk to the daemon once it's running, but the daemon doesn't start when the app launches. Code claims a fix was committed, but the fix was **never verified in practice**.

### Impact If Unresolved
- EMA desktop app **cannot be demoed or used** without manual `mix phx.server` in a separate terminal
- Onboarding story is broken — "install and run" doesn't work
- Blocks any release candidate build
- CI/CD testing of the full stack is impossible
- Every developer or tester must know the manual workaround

### Owner
Coder agent (Tauri/Rust side)

### ETA
Must be verified/fixed before any demo — should be Week 7 day 1

### Cross-References
- `EMA-SYSTEM-DISCOVERY-AUDIT.md` — Blockers by Category, lines ~115–125: *"Blocker 1: Tauri daemon auto-start... Code claims fix, but broken in practice"*
- `EMA-SYSTEM-DISCOVERY-AUDIT.md` — Areas of contradiction: *"Tauri daemon auto-start: Claims fixed, but fails in practice (unresolved)"*
- `EMA-SYSTEM-DISCOVERY-AUDIT.md` — Current Blocker section: *"Tauri daemon auto-start failing: 'Connection error: Connection failed'"*
- `EMA-HQ-MASTER-SYNTHESIS-2026-04-03.md` — Broken and blocking section: *"Tauri daemon auto-start — fails on app launch"*
- `EMA-Phase-2-Corrected-Roadmap-2026-04-03.md` — Status table: *"Tests: 10 failures (daemon)"* (co-symptom)

### Resolution Required
Verify Tauri sidecar spawn logic is actually starting the Elixir daemon. If fix was committed, run a clean build and confirm "Connection failed" no longer occurs. If fix is partial, trace the Tauri → daemon spawn sequence step by step.

---

## BLOCKER 3 — Campaign.Flow State Machine Not Written
**Rank: #3 | Confidence: 0.95**

### Why It Blocks
`Ema.Campaigns.Flow` (the struct that tracks campaign state transitions) is **not written** — not stubbed, not partially implemented, entirely absent. This struct is a required dependency for:
- Dispatch Board rendering campaign progress
- `/api/projects/:id/context` endpoint (campaign context is part of the response schema)
- Multi-proposal campaign tracking (forming → ready → running → completed)
- Any Phase 2 automation that involves campaigns

### Impact If Unresolved
- Dispatch Board remains a static shell with no live state
- Campaign-based execution (the primary Phase 2 dispatch model) can't function
- The `/api/projects/:id/context` endpoint (Week 7 Task A) **depends on this** — Task B must complete before Task A can return complete data
- Week 7 roadmap has a hard sequential dependency: A requires B, B is the Flow struct
- Any UI showing campaign status renders nothing or crashes

### Owner
Coder agent

### ETA
Week 7 Task B (2 hours estimated, per corrected roadmap)

### Cross-References
- `SESSION_CONTRADICTIONS_AND_RESOLUTIONS.md` — Item #9, lines ~105–115: *"Campaigns.Flow struct not written, dispatch board blocked... Week 7 task: Write Campaigns.Flow (2h)"*
- `SESSION_CONTRADICTIONS_AND_RESOLUTIONS.md` — Summary table: *"Campaign.Flow optional → Required for Dispatch Board → Week 7 priority"*
- `EMA-SYSTEM-DISCOVERY-AND-CLARIFICATION.md` — Q2 (lines ~80–90): *"What data does Campaigns.Flow need to track, and what state transitions exist? Confidence if unanswered: 0.2"*
- `EMA-SYSTEM-DISCOVERY-AND-CLARIFICATION.md` — Top 10 Best Questions #3: *"Q2: Campaign.Flow state machine — Unlocks Dispatch Board"*
- `EMA-HQ-MASTER-SYNTHESIS-2026-04-03.md` — Ground truth: *"Campaign flow topology — schema designed, struct not written"*
- `EMA-Phase-2-Corrected-Roadmap-2026-04-03.md` — Week 7 Task B: full spec with states `forming → ready → running → completed`

### Resolution Required
Write `Ema.Campaigns.Flow` module with state machine, transitions, validation, and active proposal + discovery tracking. Reference corrected roadmap Task B spec.

---

## BLOCKER 4 — Superman Semantic Engine Has 0 Lines of Implementation
**Rank: #4 | Confidence: 0.93**

### Why It Blocks
Superman's knowledge graph and semantic indexing exist **only as architecture documents**. The runtime has:
- `VaultWatcher` — running (filesystem change events)
- `GraphBuilder` — running (static wikilink graph, hardcoded)
- Embedding pipeline — **not written**
- Semantic search — **not running**, vault not indexed
- Intent file reader (`.superman` files) — **not read at runtime**
- `Superman.context_for(project)` — **not implemented**

Agent spawn-time context injection (the mechanism that makes agents "smart" about the project they're working on) requires Superman. Without it, every dispatched agent starts with zero project context.

### Impact If Unresolved
- Agent dispatches are dumb — no project history, no prior outcomes, no semantic understanding of what's being worked on
- Honcho's Reflexion injection (pre-dispatch intelligence) has nothing to inject from — depends on Superman context
- Wiki app is a static file browser, not a knowledge interface
- Phase 2 self-improvement loop (`PromptOptimizer`, Evolution engine) has no signal source
- HQ context assembler (`/api/projects/:id/context`) can't include semantic context

### Owner
Coder agent (Week 9), but architectural decisions (libgraph vs vector store, context format) needed from Trajan before implementation

### ETA
Week 9 (architecture decision needed Week 7, implementation Week 9)

### Cross-References
- `SESSION_CONTRADICTIONS_AND_RESOLUTIONS.md` — Item #7, lines ~90–104: *"VaultWatcher + GraphBuilder exist (static, hardcoded). No runtime graph store. No semantic understanding."*
- `SESSION_CONTRADICTIONS_AND_RESOLUTIONS.md` — Summary table: *"Superman engine ready → Not started → Week 9 build"*
- `EMA-SYSTEM-DISCOVERY-AND-CLARIFICATION.md` — Q3, Q5, Q11 (lines ~85–200): *"VaultIndex: just a file index... .superman files not read at runtime... Superman.context_for format undefined"*
- `EMA-HQ-MASTER-SYNTHESIS-2026-04-03.md` — Superman current status: *"Semantic indexing: NOT running... Intent file reader: NOT running at runtime"*
- `EMA-HQ-MASTER-SYNTHESIS-2026-04-03.md` — What needs to be built: *"Embedding pipeline... Runtime intent file reader... Proactive analyzer... HQ context assembler"*
- `EMA-SYSTEM-DISCOVERY-AUDIT.md` — Blocker 4: *"Superman indexing: Semantic search designed, not running. Vault index not built."*

### Resolution Required
Two-stage: (1) Week 7 — answer architecture questions (Q11 context format, Q3 VaultIndex scope, Q5 .superman authority). (2) Week 9 — build: embedding pipeline using libgraph + ETS, runtime intent file reader, `Superman.context_for/1` function.

---

## BLOCKER 5 — Honcho Integration Requires Unresolved Product Decision
**Rank: #5 | Confidence: 0.90**

### Why It Blocks
Honcho (pre-dispatch scope advisor + reflexion injection) is **stubbed with dummy data** and its deployment path is a three-way fork with meaningfully different cost and complexity implications:

- **Option A — Managed v3** (app.honcho.dev): Easiest path, $0.04/run, $100 free credits, requires API key + HTTP integration. Cannot self-host.
- **Option B — Self-hosted v2**: Docker image is stale (v2 vs v3 feature gap), no current self-hosting docs, maintenance burden.
- **Option C — Skip Honcho**: Use local session data + VaultIndex for pre-dispatch context; accept dumber scope checking.

Until Trajan makes this decision, the Week 7 plan cannot include Honcho setup, and all downstream systems that depend on Honcho (Reflexion injection, Scope Advisor, Evolution feedback loop) remain stubs.

### Impact If Unresolved
- Scope Advisor never runs — agents can still receive over-scoped tasks (known timeout-with-total-loss failure mode)
- Reflexion injection never fires — agents start each dispatch cold, no memory of prior outcomes
- Evolution loop (Phase 2 self-improvement) has no feedback signal
- Week 7 timeline can't be finalized for the intelligence layer
- If Option A: $0.04/run compounds for high-frequency dispatch scenarios

### Owner
Trajan (product/cost decision) → Coder agent (implementation)

### ETA
Decision needed Week 7 Day 1; implementation 1-2 days after decision

### Cross-References
- `SESSION_CONTRADICTIONS_AND_RESOLUTIONS.md` — Item #1, lines ~10–30: *"Honcho v3 is managed-only service... Docker image is v2 (stale)... DECISION NEEDED"*
- `SESSION_CONTRADICTIONS_AND_RESOLUTIONS.md` — Summary table: *"Honcho: easy Docker setup → Managed v3 only, needs decision → Decide this week"*
- `EMA-SYSTEM-DISCOVERY-AND-CLARIFICATION.md` — Q12 (lines ~190–200): *"Should Honcho be managed v3... or self-hosted v2? Urgency: HIGH, Leverage: HIGH"*
- `EMA-SYSTEM-DISCOVERY-AND-CLARIFICATION.md` — Top 10 Best Questions #4: *"Q12: Honcho decision — Unlocks week 7 timeline"*
- `EMA-Phase-2-Corrected-Roadmap-2026-04-03.md` — Status table: *"Honcho: DECISION PENDING (managed v3 vs self-hosted v2 vs skip)"*
- `EMA-SYSTEM-DISCOVERY-AUDIT.md` — Blocker 3: *"Honcho deployment: Scope advisor + reflexion injection designed, not running"*

### Resolution Required
Trajan decides A/B/C. Recommended default: Option A (managed v3, $100 free tier covers significant volume, integrate via HTTP API with API key).

---

## Summary Table

| # | Blocker | Confidence | Owner | ETA | Status |
|---|---------|-----------|-------|-----|--------|
| 1 | Bridge dispatch sync/blocking | 0.92 | Coder | Week 7 | 🔴 Hard blocker — Phase 2 cannot ship |
| 2 | Tauri daemon auto-start broken | 0.90 | Coder | Week 7 Day 1 | 🔴 Demo-breaking, MVP-blocking |
| 3 | Campaign.Flow not written | 0.95 | Coder | Week 7 (2h) | 🔴 Blocks Dispatch Board + context endpoint |
| 4 | Superman engine: 0 lines | 0.93 | Coder + Trajan | Week 9 | 🟡 Phase 2 intelligence gap |
| 5 | Honcho decision pending | 0.90 | Trajan → Coder | Week 7 Day 1 | 🟡 Unblocks scope advisor + reflexion |

---

## What Would Change This Analysis

- If Campaign.Flow has been partially written since 2026-04-03: Blocker 3 drops to medium
- If the Tauri fix was verified in a clean build: Blocker 2 drops to low
- If Honcho decision is already made (check Trajan/Decisions.md): Blocker 5 may already have a path
- All 5 blockers are independently verifiable via codebase inspection in < 30 min each

---

## Notes for Right Hand

**Q12 (Honcho)** is the fastest to resolve — it's a 3-option product decision Trajan can make in under 5 minutes. Should be the first thing asked.

**Blocker 3 (Campaign.Flow)** is the easiest to fix — 2-hour implementation, well-specified in the corrected roadmap. Assign to Coder as immediate Week 7 Task B.

**Blocker 1 (Bridge dispatch)** is the most architecturally impactful — fixing it unlocks the entire Phase 2 automation loop. Should be Week 7 top priority alongside Blocker 3.

**Blockers 4 (Superman)** has a dependency on architectural questions (Q3, Q5, Q11) that must be answered before implementation can start. These questions should be routed to Trajan in the same session as Q12.

---

*Written by: Researcher subagent*
*Sources verified: SESSION_CONTRADICTIONS_AND_RESOLUTIONS.md, EMA-SYSTEM-DISCOVERY-AND-CLARIFICATION.md, EMA-SYSTEM-DISCOVERY-AUDIT.md, EMA-HQ-MASTER-SYNTHESIS-2026-04-03.md, EMA-Phase-2-Corrected-Roadmap-2026-04-03.md, EMA Dual Backend Architecture.md*
*Confidence methodology: Based on multi-source cross-reference. High confidence (0.90+) = same blocker identified in 3+ independent sources.*

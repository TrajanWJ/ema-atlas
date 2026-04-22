---
title: Trajan-Network Launchpad
type: knowledge
status: active
created: '2026-04-03'
updated: '2026-04-03'
author: Right Hand
tags:
  - launchpad
  - operations
  - bootstrap
  - checklist
wiki_id: system/Trajan-Network-Launchpad
imported_from: vault/System/Trajan-Network-Launchpad.md
imported_at: '2026-04-04T00:23:57.269Z'
summary: ''
---

# Trajan-Network Launchpad

**Status:** Ready to bootstrap  
**Current date:** 2026-04-03  
**Target launch:** Week of 2026-04-07  

---

## The System You're Building

**Three integrated systems. One unified space. Trajan-network.**

- **EMA** (Elixir daemon) → Orchestration, proposals, task execution
- **OpenClaw** (Gateway + agents) → Dispatch, message routing, CLI access
- **Vault** (Filesystem + Superman) → Knowledge, intent folders, semantic memory
- **Integrations** (GitHub, Drive, Discord, Slack, APIs) → External services
- **P2P Peer Network** (Pier) → Multi-device sync (Phase B)

---

## What's Ready Now (Completed in Last 6 Hours)

✅ **Architecture document** — 3-peer topology, MCP servers, sync policies, bootstrap procedure
✅ **Complete app specification** — 14 apps (Dashboard, BrainDump, Tasks, Projects, Proposals, Responsibilities, Habits, Journal, Vault, Canvas, Pipes, Focus, Agents, Channels) + 7 integrations
✅ **Multi-agent brainstorm framework** — 7 sessions scheduled with prompts ready
✅ **Trajan-network design** — Connected via REST, WebSocket, file watcher, MCP
✅ **Implementation roadmap skeleton** — Phase A (Week 7-8), Phase B (Week 9+)
✅ **Risk analysis framework** — Ready to populate during Session 5

---

## What You Need to Decide (Next 24h)

**Decision 1: Which session first?**
- Recommendation: **Session 2 (Implementation Sequencing)** — unblocks builders
- Alternative: Start with **Session 3 (Workflows)** if you want to map Discord → EMA first

**Decision 2: Build order for Week 7**
- Current recommendation: 5-app MVP (Dashboard, BrainDump, Tasks, Proposals, Agents)
- Alternative: Start with single-app (Dashboard only), add incrementally

**Decision 3: Honcho timing**
- Recommendation: Stub it (return dummy data) for Phase A
- Alternative: Build Honcho in parallel (adds complexity)

**Decision 4: P2P or Cloud Sync?**
- Current: Hub-and-spoke Phase A, P2P Phase B
- Alternative: Add P2P from day one (adds complexity, but more aligned with vision)

---

## Documents You Should Read First

**In order of priority:**

1. **Trajan-Network-Architecture.md** (16KB, 30 min read)
   - Understand: 3 peers, MCP servers, data flow, bootstrap steps
   - Why: This is the backbone of everything

2. **EMA-Unified-Spec-With-Integrations.md** (31KB, 45 min read)
   - Understand: Each of 14 apps, what they do, how they connect
   - Why: This is what you're building

3. **EMA-Multi-Agent-Brainstorm-Sessions.md** (16KB, 30 min read)
   - Understand: 7 sessions, agent roles, questions to answer
   - Why: This is how we design it together

4. **MASTER-SYSTEM-OVERVIEW.md** (24KB, 40 min read)
   - Understand: Overall vision, execution model, spaces
   - Why: Context for how it all fits

**Total: 2.5 hours to read everything thoroughly**

---

## Immediate Checklist (Do Today/Tomorrow)

- [ ] Read Trajan-Network-Architecture.md
- [ ] Create Discord channel: `📚-wiki-superman-knowledge`
- [ ] Decide: which session first?
- [ ] Decide: build order for Week 7?
- [ ] Reply here (or in Discord) with decisions

---

## Session 2 Prompt (Ready to Copy-Paste)

When you decide to start Session 2, use this prompt:

```
🧠 MULTI-AGENT BRAINSTORM: Implementation Sequencing

Your team:
- 💻 Coder — "Can we build frontend while backend is incomplete?"
- ⚙️ Ops — "What infrastructure must be up first?"
- 🧠 Strategist — "What dependencies block forward progress?"
- 📈 Product — "What workflows unlock with each phase?"
- 🔬 Researcher — "What are the parallel build tracks?"

Your goal: Figure out HOW to build Trajan-network in parallel tracks.

Context:
- Read: /home/trajan/vault/System/Trajan-Network-Architecture.md
- Read: /home/trajan/vault/System/EMA-Unified-Spec-With-Integrations.md

Key questions to debate:

1. CAN FRONTEND BUILD WHILE BACKEND IS INCOMPLETE?
   - Frontend can use mock API if contracts defined first
   - Need: OpenAPI spec before any coding
   - Trade-off: Parallel builds speed things up, but needs discipline

2. WHAT INTEGRATIONS UNLOCK VALUE FIRST?
   - Discord: already integrated with OpenClaw, fastest ROI
   - GitHub: links projects to real repos
   - Google Drive: enables shared docs
   - Which order? Recommend: Discord (fast) → GitHub → Drive

3. DOES HONCHO NEED READY BY WEEK 7?
   - Honcho = scope advisor + reflexion injection
   - Can we stub it out (return dummy data)?
   - Real Honcho integration = Phase 2 priority
   - Recommendation: Stub for Phase A

4. P2P NETWORK OR CLOUD SYNC FIRST?
   - Hub-and-spoke is simpler (Phase A)
   - P2P adds complexity but aligns with vision
   - Can we do manual sync (export/import) in Phase A, auto Pier in Phase B?

5. WHAT'S THE MINIMAL CRITICAL PATH?
   - What 3-5 features absolutely must work by end of Week 7?
   - Everything else is Phase 2+?
   - Example path: Dashboard + BrainDump + Tasks + Proposals + Agents

Brainstorm together. Debate. Disagree. Find best answers.

Output for each question:
1. Your perspective (with reasoning)
2. Where you disagree with other agents
3. Your recommendation for the team

Session time: 20 minutes. Focus on blocking risks and parallel tracks.

Report back to Trajan in Discord.
```

---

## Weekly Schedule (Recommendation)

### Week of 2026-04-03 (This Week)

**Monday (04-03)** ✅ DONE
- Architecture Synthesis
- Result: Trajan-Network-Architecture.md
- Action: You read it

**Tuesday (04-04)** 🔜 NEXT
- Session 2: Implementation Sequencing
- Goal: Define parallel build tracks
- Decision: Build order for Week 7

**Wednesday (04-05)**
- Session 3: Specialist Workflows
- Goal: Map Discord → EMA workflows
- Decision: Feature parity checklist

**Thursday (04-06)**
- Session 4: Frontend + Backend Contract
- Goal: Define API contracts
- Decision: Start coding with contracts

**Friday (04-07)**
- Session 5: Risk & Mitigation
- Goal: Identify all risks
- Decision: Rollback procedures

**Saturday (04-08)**
- Session 6: Honcho Deep-Dive
- Goal: Design Honcho integration
- Decision: Phase 2 timeline

**Sunday (04-09)**
- Session 7: Superman + Vault
- Goal: Design semantic indexing
- Decision: Indexing strategy

**Monday (04-10)**
- Synthesis & Handoff
- Consolidate all findings
- Create Master Roadmap
- Handoff to builders

---

### Week of 2026-04-07 (Phase A Starts)

**Goals for Week 7:**
- [ ] API contracts defined (no more spec ambiguity)
- [ ] Frontend starts: Dashboard, BrainDump, Tasks
- [ ] Backend starts: Core API, SQLite schema, Execution model
- [ ] Infrastructure: EMA daemon can start, OpenClaw connected
- [ ] Integration test: Mock proposal → agent dispatch → result

**By Friday 04-11:**
- [ ] Dashboard running (but with dummy data)
- [ ] BrainDump capture working (stores to SQLite)
- [ ] Tasks list showing (reads from SQLite)
- [ ] Proposals kanban showing (reads from SQLite)
- [ ] Agents dispatch board (shows mock agents)

**End of Week 7:**
- 5-app MVP running
- EMA ↔ OpenClaw REST connectivity working
- One end-to-end loop working (manual test)

---

### Week of 2026-04-14 (Phase A Continues)

**Goals for Week 8:**
- [ ] Real-time sync (WebSocket)
- [ ] Proposal → Agent dispatch automation (Pipes)
- [ ] Vault/Wiki app integrated
- [ ] Intent folders working (`.superman/intents/`)
- [ ] Execution-log.md appending narrative
- [ ] Dashboard showing real data (not mock)
- [ ] Superman indexing running
- [ ] Honcho stubs responding

**By Friday 04-18:**
- [ ] Capture → Propose → Dispatch → Result → Execute loop fully working
- [ ] All 5 core apps connected
- [ ] Real-time sync between peers
- [ ] Vault showing real project data
- [ ] Metrics basic (outcome tracking working)

**End of Week 8:**
- Phase A complete
- System is functional end-to-end
- Ready to add 9 more apps + integrations in Phase B

---

## Key Operational Decisions to Make

### 1. Frontend Framework
- Currently: React (app/src exists, uses Zustand stores)
- Tailwind CSS for styling
- TypeScript for type safety
- Tauri for desktop app shell

**Decision needed:** Stick with current stack or change?

### 2. Backend Language
- Currently: Elixir/Phoenix (daemon already running)
- SQLite for data storage
- Ecto for migrations
- Phoenix PubSub for events

**Decision needed:** Stick with Elixir or switch?

### 3. MCP Architecture
- EMA exposes 2 MCP servers (EMA Core at 4489, Vault at 4491)
- OpenClaw reads from them
- Claude Code reads from them

**Decision needed:** HTTP (easier) or stdio (more coupled)?

### 4. Vault Sync
- Vault files are canonical (git-backed)
- EMA indexes via file watcher
- Superman re-indexes on schedule

**Decision needed:** Real-time watcher or batch index (hourly/daily)?

### 5. Database Tenancy
- Multi-space support (one database, multiple spaces)
- Each space has its own task/proposal/execution tables
- Vault is shared (no space scoping)

**Decision needed:** One SQLite file per space or one file with space columns?

---

## Resource Allocation (Suggested)

### Frontend Team (Week 7)
- 1 senior React dev (or you using Claude Code)
- 1 TypeScript dev (or shared with backend)
- 1 UX/design consultant (maybe async)

### Backend Team (Week 7)
- 1 senior Elixir dev (or you using Claude Code)
- 1 Database architect (schema + migrations)
- 1 API designer (contracts + testing)

### Infrastructure (Week 7-8)
- 1 Ops engineer (MCP server setup, Pier bootstrapping)
- 1 QA engineer (integration tests, end-to-end)

**Total: 5-6 people, mostly parallel tracks**

---

## Success Metrics

### Week 7-8 (Phase A Complete)
- ✅ 5-app MVP running (Dashboard, BrainDump, Tasks, Proposals, Agents)
- ✅ One end-to-end loop functional (capture → dispatch → result)
- ✅ Real-time sync between EMA + OpenClaw
- ✅ Vault/Wiki integrated
- ✅ 50+ existing projects visible in EMA
- ✅ Can dispatch agents from Proposals UI
- ✅ Results appear in Dashboard + Projects
- ✅ All original Discord workflows have EMA equivalent

### Week 9 (Phase B Starts)
- ✅ Remaining 9 apps building (Habits, Journal, Canvas, Pipes, Focus, etc.)
- ✅ Integrations live (GitHub, Drive, Discord, Slack)
- ✅ Honcho integration (scope advisor, reflexion injection)
- ✅ Superman semantic indexing live
- ✅ P2P Pier network topology set up
- ✅ Host desktop as third peer (future)

---

## Known Risks & Mitigations

**Risk 1: Parallel builds conflict on API contracts**
- Mitigation: Strict OpenAPI spec before any coding
- Automated mock API from spec
- Integration tests on day 1

**Risk 2: Execution model too complex**
- Mitigation: Start with simple synchronous execution, add async later
- Keep narrative-first principle (append-only execution-log.md)
- Test with manual proposal → dispatch loop first

**Risk 3: Honcho missing/broken**
- Mitigation: Stub it (return dummy data) for Phase A
- Real Honcho integration in Phase 2
- Scope advisor fallback to simple heuristics

**Risk 4: Vault indexing slow/buggy**
- Mitigation: Start with simple full-text search, add semantic later
- Superman can re-index on schedule (not real-time)
- Manual "refresh Superman index" button in UI

**Risk 5: P2P sync causes data loss**
- Mitigation: Execution-log.md is append-only (no conflicts)
- Vault is git-backed (history available)
- CRDR for shared objects (Phase B)
- Conflict resolution UI for disputes

---

## The Bottom Line

**You have a complete blueprint. Everything is designed. You're ready to build.**

Next step: Read the architecture docs (2.5 hours), make 4 decisions, tell me which session to run first.

Then: Spawn agents, collect findings, build roadmap, execute.

**Timeline:**
- Week of 04-03: Design (this week) ← You are here
- Week of 04-07: Phase A MVP (5 core apps)
- Week of 04-14: Phase A complete (end-to-end working)
- Week of 04-21: Phase B starts (9 more apps + integrations)

By end of April, you'll have a functional EMA + Trajan-network system running locally, replacing Discord for agent dispatch, task tracking, and knowledge management.

---

**When you're ready to go: reply in Discord, and I'll spawn Session 2.** 🚀

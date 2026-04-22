---
title: EMA System — Multi-Agent Brainstorming & Build Sessions
type: knowledge
status: active
created: '2026-04-03'
updated: '2026-04-03'
author: Right Hand + Specialist Team
tags:
  - process
  - brainstorm
  - multi-agent
  - architecture
  - ema-bootstrap
wiki_id: system/EMA-Multi-Agent-Brainstorm-Sessions
imported_from: vault/System/EMA-Multi-Agent-Brainstorm-Sessions.md
imported_at: '2026-04-04T00:23:57.232Z'
summary: ''
---

# EMA Multi-Agent Brainstorm & Build Sessions

## Overall Structure

**Goal:** Design the complete Trajan-network system through structured multi-perspective analysis, then build it in parallel phases.

**Method:** Spawn 5-6 specialist agents, each with a focus. They brainstorm together, synthesize findings, identify gaps and dependencies.

**Output:** 
- Unified architecture (done: Trajan-Network-Architecture.md)
- Implementation roadmap (parallel tracks)
- Risk analysis
- Dependency graph
- Proof-of-concept checklist

---

## Session 1: Architecture Synthesis (COMPLETE ✅)

### Agents Involved
- 🏗️ Architect (AI perspective on system design)
- 🔬 Researcher (review existing patterns, research comparable systems)
- 🛡️ Security (threat model, data safety, peer trust)
- 📊 Systems Thinker (dependencies, bottlenecks, failure modes)
- 🎯 Product Manager (user workflows, feature prioritization)

### Questions Debated
1. **Should Trajan-network be P2P from day one?**
   - Architect: Start hub-and-spoke (EMA = hub), add P2P in Phase B
   - Product: Hub is simpler, users get value faster
   - Decision: ✅ Hub-and-spoke Phase A, P2P Phase B+

2. **Where should intent folders live?**
   - Architect: Vault filesystem is canonical, EMA indexes
   - Researcher: Obsidian works this way (git-backed)
   - Decision: ✅ Vault canonical, EMA syncs via file watcher

3. **How do we prevent data loss during early iterations?**
   - Security: Require git history for all vault files
   - Architect: Execution-log.md is append-only, never overwrite
   - Decision: ✅ Vault is git-backed, executions are append-only

4. **Should OpenClaw live inside Trajan-network or stay separate?**
   - Architect: Inside = tighter integration, can dispatch from EMA
   - Product: Outside = less coupling, easier to update OpenClaw
   - Decision: ✅ Inside but loosely coupled (REST + events)

### Output: Done
- Trajan-Network-Architecture.md (complete)
- Peer topology defined (EMA hub, OpenClaw gateway, Host future)
- MCP server architecture designed
- Bootstrap procedure documented

---

## Session 2: Implementation Sequencing (IN PROGRESS 🔨)

### Key Question
**In what order do we build the 14 apps, 7 integrations, and P2P layer?**

### Agents to Spawn
- 💻 **Coder** — Can the 5-app Week 7a MVP work without backend completion?
- ⚙️ **Ops** — What infrastructure needs to be up first?
- 🧠 **Strategist** — What dependencies block forward progress?
- 📈 **Product** — What user workflows unlock with each phase?
- 🔬 **Researcher** — What are parallel build tracks?

### Sequencing Questions

1. **Can EMA frontend build in parallel with daemon?**
   - Frontend can use mock API while daemon is being built
   - Parallel works if we define API contracts first
   - Need OpenAPI/GraphQL spec before frontend coding starts

2. **What integrations unlock the most value early?**
   - GitHub: links projects to real repos
   - Google Drive: enables shared docs workflow
   - Discord: already integrated with OpenClaw, just wire to EMA
   - Recommendation: Discord first (value immediate), then GitHub, then Drive

3. **Does Honcho need to be ready for Phase A?**
   - Honcho is "scope advisor" + "reflexion injection" (Phase 2 priority)
   - Can stub it out: return dummy scopes for now
   - Real Honcho integration in Phase 2

4. **P2P or Cloud Sync first?**
   - Cloud would be simpler (centralized database)
   - But Trajan wants P2P from start
   - Compromise: Phase A manual sync (db export/import), Phase B automatic Pier P2P

### Brainstorm Output (To Create)
- [ ] Dependency graph (which features block others)
- [ ] Parallel build tracks (can we do 3 features at once?)
- [ ] API contract spec (before any frontend coding)
- [ ] Database schema (before backend coding)
- [ ] Risk register (what could go wrong, mitigation)

---

## Session 3: Specialist Workflows Analysis (IN PROGRESS 🔨)

### Goal
Map current Discord + OpenClaw workflows onto EMA apps. Identify gaps.

### Agents to Spawn
- 🔬 **Researcher** — Deep-dive into current workflows (read all Discord channels, AGENTS.md, MEMORY.md)
- 💼 **Product** — What does each workflow look like in EMA?
- 🛡️ **Security** — Permission model for shared spaces (Trajan + team in future)
- 📊 **Analyst** — What metrics prove the system is working?

### Workflows to Analyze

**Workflow 1: Dispatch Loop (Daily)**
```
Discord #dispatch
  → Type: "Research X"
  → Right Hand reads request
  → Routes to specialist (via AGENTS.md)
  → Agent spawns (OpenClaw)
  → Agent outputs in thread
  → Result in #agent-feed + vault
```

**In EMA, becomes:**
```
Bridge app
  → Type: "Research X"
  → Router (Honcho + routes) classifies
  → Creates Proposal
  → Approves (auto or manual)
  → Dispatch Board shows task running
  → Result in Dashboard feed + Project narrative
  → Vault updated
```

**Questions:**
- Should Bridge input be simple text or structured form?
- Who approves proposals (auto for simple, manual for structural)?
- Real-time stream output in Dispatch Board or just status?
- How does Researcher know what to research (context injection)?

**Workflow 2: Task Tracking (Weekly)**
```
Discord #desk (forum)
  → Post task as thread
  → Tag with project + priority
  → Right Hand assigns to agent
  → Agent works
  → Right Hand updates status
```

**In EMA, becomes:**
```
Tasks app
  → Create task (title + project + priority)
  → Assign to agent (or leave unassigned)
  → View in Kanban board
  → Real-time progress (if agent working)
  → Mark done when complete
```

**Questions:**
- Should we auto-create tasks from BrainDump clusters?
- Can tasks have sub-tasks (yes, spec says so)
- Should task creation check Structural Detector?
- How do completed tasks flow back to Project execution narrative?

**Workflow 3: Knowledge Management (Ongoing)**
```
Obsidian vault (on host)
  → Trajan reads + updates
  → Git sync pulls changes
  → EMA dashboard shows recent files
```

**In EMA, becomes:**
```
Vault app (Wiki)
  → Search files
  → Edit inline (or open in VS Code)
  → Graph shows relationships
  → Superman indexes for semantic search
```

**Questions:**
- Should Vault app embed actual files or show rich preview?
- Can we sync Obsidian vault with EMA in real-time?
- Should graph be force-directed or hierarchical?
- How often does Superman re-index (every save, every hour)?

**Workflow 4: Proposal Deliberation (Structural Tasks)**
```
Current: None (BrainDump → Task directly)
```

**In EMA, becomes:**
```
Tasks with structural keywords → Proposals pipeline
  1. Generate (Claude writes detailed proposal)
  2. Refine (improve clarity, add constraints)
  3. Debate (for/against arguments)
  4. Tag (auto-tag with project, domain, complexity)
  5. Ready (score 0-100, needs approval to execute)
```

**Questions:**
- What triggers "structural"? (keywords like "migrate", "refactor", "rebuild")
- Should Debate stage be auto or require human input?
- How long can a proposal take (hours? days)?
- Can proposals be scheduled for future execution?

### Brainstorm Output (To Create)
- [ ] End-to-end workflow diagrams (current → EMA)
- [ ] Gap analysis (what Discord does that EMA doesn't yet)
- [ ] Feature parity checklist
- [ ] Permission model for spaces (who can do what)
- [ ] Metrics dashboard (success signals for each workflow)

---

## Session 4: Frontend + Backend Contract (TO START)

### Goal
Define API contracts so frontend and backend can be built in parallel.

### Agents to Spawn
- 💻 **Coder** — Can build frontend against mock API
- ⚙️ **Backend Architect** — Database schema, endpoint design
- 🧪 **QA** — Test plans for each endpoint
- 📊 **API Designer** — REST or GraphQL? Pagination? Caching?

### What Needs Definition
1. **REST API contract** for each app (5 core + 9 others)
   - Example: Tasks app
     - GET /api/spaces/:space_id/tasks (list, with filters)
     - POST /api/spaces/:space_id/tasks (create)
     - GET /api/spaces/:space_id/tasks/:id (detail)
     - PATCH /api/spaces/:space_id/tasks/:id (update)
     - DELETE /api/spaces/:space_id/tasks/:id (delete)
     - POST /api/spaces/:space_id/tasks/:id/assign (assign to agent)

2. **WebSocket events** for real-time sync
   - Example: when task status changes, emit `task:status_changed`
   - Frontend subscribes, UI updates immediately

3. **MCP resource specs** (what Claude Code can access)
   - Example: `task:list`, `task:get`, `project:get`, `vault:search`

4. **Database schema** (Ecto migrations)
   - Shared across all apps
   - Track by space (multi-tenancy)

### Brainstorm Output (To Create)
- [ ] OpenAPI spec (or GraphQL schema)
- [ ] Database schema document
- [ ] WebSocket event taxonomy
- [ ] MCP resource list
- [ ] Frontend mock data (for development without backend)
- [ ] Integration test suite (backend + frontend)

---

## Session 5: Risk & Mitigation Analysis (TO START)

### Goal
Identify what could go wrong, plan mitigation.

### Agents to Spawn
- 🛡️ **Security** — Auth, data safety, peer trust
- ⚙️ **Ops** — Infrastructure failures, backups, disaster recovery
- 🧠 **Strategist** — Scope creep, dependency hell, timeline risks
- 💯 **Quality** — Testing strategy, rollback procedures

### Risks to Analyze

**Risk 1: Parallel builds conflict**
- Frontend assumes API endpoint X exists
- Backend implements X differently than spec
- Mitigation: Strict API contracts, automated mock API from spec, integration tests

**Risk 2: P2P sync creates conflicts**
- EMA and OpenClaw write to same task simultaneously
- Who wins? (Spec says: EMA canonical, OpenClaw is client)
- Mitigation: CRDT for shared data, last-write-wins fallback, conflict resolution UI

**Risk 3: Agent dispatch fails silently**
- OpenClaw doesn't receive proposal_ready event
- Proposal sits in "Approved" forever
- Mitigation: Timeout, retry queue, Dashboard alerts for stale proposals

**Risk 4: Vault gets out of sync with EMA**
- File edited in VS Code, but EMA doesn't reload
- Superman indexes stale data
- Mitigation: File watcher with debounce, manual sync button, refresh signal

**Risk 5: Honcho model is wrong**
- Scope advisor says "reduce scope" but should say "increase"
- Agent times out more often than expected
- Mitigation: Start simple (no Honcho), add learning incrementally, track outcomes

### Brainstorm Output (To Create)
- [ ] Risk register (probability × impact matrix)
- [ ] Mitigation plan for each risk
- [ ] Rollback procedures (if Phase A fails, what's the fallback?)
- [ ] Monitoring dashboard (key health metrics)
- [ ] Incident response runbook

---

## Session 6: Honcho Deep-Dive (TO START)

### Goal
Design Honcho integration with Trajan-network.

### Agents to Spawn
- 🔬 **Researcher** — Read Honcho research, understand capabilities
- 🏗️ **Architect** — How does Honcho fit into EMA?
- 💻 **Coder** — Implementation plan (MCP? HTTP? Embedded?)
- 🧠 **Strategist** — Scope Advisor + Reflexion Injection design

### Questions

1. **Where does Honcho run?** (Docker container on VM?)
2. **What data does Honcho read?** (task history, execution outcomes, proposals)
3. **What signals does Honcho emit?** (scope warnings, quality suggestions)
4. **How do we avoid token explosion?** (Honcho is expensive per token)
5. **A/B testing:** How do we test "with Honcho" vs "without Honcho"?

### Brainstorm Output (To Create)
- [ ] Honcho architecture in Trajan-network
- [ ] MCP spec for Honcho queries
- [ ] Scope Advisor decision tree
- [ ] Reflexion injection logic
- [ ] Cost modeling (tokens, API calls, timing)
- [ ] Phase 2 milestone (when Honcho goes live)

---

## Session 7: Vault Indexing & Superman (TO START)

### Goal
Design Superman integration for semantic search + intent folders.

### Agents to Spawn
- 🔬 **Researcher** — Superman architecture, existing implementation
- 🏗️ **Architect** — How Superman fits with Vault app
- 🧠 **AI Specialist** — Embeddings, similarity search, reranking
- 📊 **Data** — Indexing strategy, update frequency, storage

### Questions

1. **Superman indexing:** Full re-index every day? On-demand? Incremental?
2. **Intent folders:** What files should be indexed (`.md`, `.superman`, `execution-log.md`)?
3. **Semantic search UI:** How does user interact (simple query, advanced filters)?
4. **Knowledge graph:** Force-directed layout, hierarchical, or custom?
5. **Backlinks:** Can we auto-generate backlinks from semantic search?

### Brainstorm Output (To Create)
- [ ] Superman integration plan
- [ ] Indexing pipeline (what triggers reindex)
- [ ] Embedding model selection
- [ ] Query language design
- [ ] Performance targets (search latency, index size)
- [ ] Week 8 milestone (when Superman goes live)

---

## Session Schedule

### This Week (2026-04-03 to 04-10)

**Monday (04-03)** — Architecture Synthesis ✅ (done in this session)

**Tuesday (04-04)** — Implementation Sequencing
- Spawn agents (Coder, Ops, Strategist, Product, Researcher)
- Define parallel build tracks
- Create dependency graph

**Wednesday (04-05)** — Specialist Workflows
- Map Discord → EMA workflows
- Identify gaps
- Create end-to-end flow diagrams

**Thursday (04-06)** — Frontend + Backend Contract
- Define API contracts
- Design database schema
- Create mock API

**Friday (04-07)** — Risk Analysis
- Identify risks
- Design mitigation
- Create monitoring strategy

**Saturday (04-08)** — Honcho Deep-Dive
- Research Honcho
- Design integration
- Plan Phase 2 timeline

**Sunday (04-09)** — Superman + Vault
- Research Superman
- Design semantic indexing
- Plan indexing pipeline

**Buffer (04-10)** — Synthesis & Handoff
- Consolidate all findings
- Create master roadmap
- Handoff to builders

---

## Session Output Artifacts

### Per Session
- Brainstorm transcript (who said what, key quotes)
- Decision log (what was decided, why)
- Questions that need followup
- Risks identified
- Next steps

### Synthesis (Final)
- **Master Roadmap** (Week 7-12 with parallel tracks)
- **Dependency Graph** (which features block others)
- **Risk Register** (all risks, mitigation)
- **API Contracts** (REST spec)
- **Database Schema** (Ecto migrations)
- **Testing Strategy** (unit, integration, e2e)
- **Metrics Dashboard Design** (how we measure success)

---

## How to Run a Session

**Setup:**
1. Create a new Discord thread in #agent-os-frontend
2. Post session prompt (below) as first message
3. Spawn agents with `sessions_spawn` (max 5 agents per session)
4. Wait 15-20 minutes for agents to discuss
5. Review results, post summary to channel

**Session Prompt Template:**

```
🧠 MULTI-AGENT BRAINSTORM: [Session Name]

You are [Agent Name]. You specialize in [specialty].

Your goal: Help design [what we're designing] for the Trajan-network system.

Context files to read:
- /home/trajan/vault/System/Trajan-Network-Architecture.md
- /home/trajan/vault/System/EMA-Unified-Spec-With-Integrations.md
- /home/trajan/vault/System/MASTER-SYSTEM-OVERVIEW.md
- /home/trajan/.openclaw/agents/main/workspace/AGENTS.md
- /home/trajan/.openclaw/agents/main/workspace/SOUL.md

Key question to discuss:
[Question 1]
[Question 2]
[Question 3]

Brainstorm with other agents. Debate. Disagree. Converge on best ideas.

Output format:
1. Your perspective on each question
2. Why you think that (evidence, reasoning)
3. Where you disagree with others
4. Synthesis: what the team should do
5. Risks your specialty is concerned about

Session time limit: 20 minutes. Go deep on the most important questions.
```

---

## Success Criteria

By end of Session Week (04-10):

- [x] Architecture documented (Trajan-Network-Architecture.md)
- [ ] Implementation sequencing clear (parallel tracks identified)
- [ ] Workflows mapped (Discord → EMA)
- [ ] API contracts defined (spec complete)
- [ ] Database schema designed (Ecto migrations)
- [ ] Risks identified + mitigated (risk register)
- [ ] Honcho plan documented (Phase 2 milestone)
- [ ] Superman plan documented (Week 8 milestone)
- [ ] Master Roadmap created (Week 7-12)
- [ ] Build team ready to execute (no blocking questions)

---

**Session Framework: Ready to spawn agents.** 🚀

*When Trajan says "go", spawn Session 2 (Implementation Sequencing) with 5 agents.*

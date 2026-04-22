---
title: "Master System Overview — Complete Architecture"
date: 2026-04-03
updated: 2026-04-03T20:55Z
author: Right Hand
tags: [architecture, master, complete, systems, proposals, wiki, p2p, mesh, organizations]
type: master
status: living-document
---

# 🎯 Master System Overview — Complete Architecture

This is the **single source of truth** for everything you've built. All systems, all subsystems, all components, all relationships. For revision and iteration.

Generated from: System Overview + Architecture docs + Active projects + EMA research

---

## I. THE CORE VISION

**Own everything. Control everything. No central server. No vendor lock-in. Everything is distributed.**

Three layers:
1. **Execution** — Task dispatch, agent routing, proposal generation
2. **Organization** — Spaces (personal/org/shared/public), mesh networks, multi-device sync
3. **Intelligence** — Knowledge graphs, memory systems, recommendation engines

No layer depends on a third party. Everything runs on your devices, your VM, your infrastructure.

---

## II. EXECUTION LAYER — Task Dispatch & Agent Routing

### Current State (as of 2026-04-03)

**EMA (Elixir-based) running on agent-vm, fully concurrent-safe**

| Component | Status | Notes |
|---|---|---|
| **Execution System** | ✅ Correct | Narrative-first, phase-aware status, concurrent-safe |
| **Task Model** | ✅ Complete | task.json with project/domain/scope/complexity |
| **Proposal Engine** | ✅ Phase 1 | Generator + evaluator, iterative refinement |
| **Dispatch Logic** | ✅ Core | Intent-based routing, Superman codebase indices |
| **Session Store** | ✅ Bridge Built | Elixir<→Claude Code via HTTP API |
| **Agent Bridge** | ✅ Phase 1 | spawns agents, monitors health, collects outcomes |

### Execution Flow (Narrative-First)

```
Task Creation
   ↓ [structural task?]
   ├→ Deliberation Gate (requires proposal) ✨ NEW
   └→ Direct Dispatch
      ↓
   Intent Classification (Router) ✨ PHASE 2
   ↓ [what kind of task is this?]
   ├→ Research intent → Researcher agent
   ├→ Build intent → Coder agent
   ├→ Organize intent → Vault Keeper
   └→ Review intent → Devil's Advocate
      ↓
   Agent Spawn
   ├→ Fresh git worktree (prevent main-branch failures)
   ├→ Claude Code with session context
   └→ Monitor health (tokens, output, errors)
      ↓
   Execution Log (append-only)
   ├→ execution-log.md (immutable record)
   └→ Executions table (DB source of truth)
      ↓
   Status Computation
   ├→ Modes executed: {research→completed, implement→failed, review→pending}
   ├→ Status: "review_blocked" (semantic, phase-aware)
   └→ Frontend visibility: FULL (modes_executed map)
      ↓
   Outcome Tracking
   ├→ Agent fitness score
   ├→ Task success/failure
   └→ Pattern learning (for workflow crystallization)
```

### Three Core Signals (Simplicity)

**Signal A: Active Execution**
- Any task running → status = "in_progress"
- Clear intent, frontend shows live progress

**Signal B: Implementation Success**
- implement mode succeeded → status = "completed"
- Semantically accurate (impl is done, not necessarily workflow)
- Could have review failures (shown in modes_executed)

**Signal C: Terminal States**
- research only → "researched"
- outline only → "outlined"
- review failed → "review_blocked"
- impl failed → "implementation_blocked"
- idle/nothing done → "idle"

**Key innovation:** Status tells what actually happened. modes_executed shows all phases including failures. Frontend can render: "Implemented ✅ but review needs revision ❌"

### Database Schema

**Executions Table:**
```
id (UUID)
project_slug
intent_slug
mode (research|outline|implement|review|harvest|refactor)
status (created|running|completed|failed|cancelled)
session_id (Claude Code session)
model (claude-opus-4-6, etc.)
input_tokens / output_tokens / cost_usd
started_at / completed_at
result_path (where output landed)
error (if failed)
inserted_at / updated_at
```

**Intent Folder Structure:**
```
projects/PROJECT_SLUG/intents/INTENT_SLUG/
  ├── intent.md (original definition, immutable)
  ├── execution-log.md (append-only, all executions)
  ├── proposals/ (generated proposals, versioned)
  └── .superman/ (Superman indices for this intent)
```

### Proposals Engine

**Generator Loop:**
```
Task Description
  ↓
Generate N proposals (temperature=0.7, diverse prompts)
  ↓
Store all proposals (proposals/v1_*.json)
  ↓
Evaluator reviews (quality gate)
  ├→ Score each proposal (0-10)
  ├→ Flag architectural concerns
  └→ Reject or accept
  ↓
User chooses (or auto-pick best)
  ↓
Dispatch agent with chosen proposal
```

**Feedback Loop:**
- Agent reads proposal before starting
- Execution follows proposal (or diverges with explanation)
- Outcome tagged with which proposal was used
- System learns what proposals lead to good outcomes

### Port Orphan Fix (TODAY'S FIX)

**Problem:** BEAM restarts → Claude processes don't die → silent token burn

**Solution:** `claude-wrapper.sh` kills child when stdin closes

```bash
#!/usr/bin/env bash
exec "$@" &
pid1=$!
exec >/dev/null 2>&1
exec 0<&0 $(
  while read; do :; done
  kill -KILL $pid1
) &
pid2=$!
wait $pid1; ret=$?
kill -KILL $pid2; exit $ret
```

Bridge.ex spawns wrapper instead of claude directly. When BEAM dies, wrapper kills claude. Zero orphans.

---

## III. ORGANIZATION LAYER — Spaces & P2P Mesh

### Spaces: The Core Primitive

Everything lives in a Space. Everything.

**Space Types:**

| Type | Visibility | Sync | Encryption | Use Case |
|---|---|---|---|---|
| **Personal** | Just you | All devices | Device-local keys | Your brain, private thoughts |
| **Organization** | Team members | Member devices | Org-rotated keys | Proslync team, Wilson Premier |
| **Shared** | Anyone with link | On-demand | Link-derived keys | OSS project, collaborations |
| **Ghost** | Ephemeral | Temp devices | TTL keys | Quick collab, auto-deletes |
| **Public** | World | Read-only mirror | Signed, not encrypted | Your portfolio, published work |

### Space Contents

Each space gets ALL of these. Completely decoupled:

| Component | What It Does |
|---|---|
| **Files** | Content-addressed, versioned, deduplicated storage |
| **Tasks** | Kanban, time tracking, dependencies, assignments |
| **Projects** | Grouping of tasks, milestones, planning |
| **Proposals** | AI-generated improvement suggestions for this space |
| **Journal** | Daily entries, focus summaries, reflections |
| **Vault** | Knowledge base, markdown notes, wikilinks, graph |
| **Canvas** | Freeform spatial workspace, sketches, wireframes |
| **Channels** | Messaging internal + bridged to Discord/Telegram/email |
| **Agents** | Space-specific AI agents with this space as context |
| **Habits** | Streaks, routines, accountability |
| **Brain Dump** | Inbox for raw thoughts, auto-classified upward |

### Space Selector UI (Like Slack)

```
Top-left, always visible:
┌──────────────────────┐
│ 🧠 My Brain    ▼     │ ← current space badge
├──────────────────────┤
│ 🧠 My Brain          │ ← personal
│ 🏢 Proslync Team     │ ← organization
│ 🏢 Wilson Premier    │ ← organization
│ 🔗 OSS Project       │ ← shared
│ 👻 Quick Collab      │ ← ghost
│ ─────────────────────│
│ 🌐 All Spaces        │ ← cross-space unified view
│ + Create Space       │
│ 📎 Join via Link     │
└──────────────────────┘
```

### All Spaces View (Dashboard)

Unified feed across every space. Shows:
- All tasks (grouped by space, filterable, sorted by priority)
- All notifications (alerts, mentions, deadlines)
- All proposals (across all spaces, actionable)
- All unread channels (badge count, space badge)
- All file activity (recent edits, who changed what)
- All agent status (health, current execution, outcomes)

Each item has space badge. Click badge → jump to that space.

### P2P Mesh Network

**No central server. Every EMA instance is a node.**

#### Transport Layer (Built on libp2p)

| Protocol | Range | Use Case |
|---|---|---|
| **mDNS** | Local LAN | Instant discovery (same wifi) |
| **Tailscale/WireGuard** | VPN tunnel | Cross-network, authenticated |
| **libp2p relay** | NAT traversal | Behind firewall, peer relay |
| **DHT (Kademlia)** | Global | Fully decentralized discovery |
| **Bluetooth/USB** | 10m / 0m | Offline phone↔laptop sync |

#### Node Types

| Role | Always-On | Storage | Example |
|---|---|---|---|
| **Relay** | ✅ | Yes | VPS, Agent VM, Raspberry Pi |
| **Edge** | ❌ | Local | Laptop, phone, tablet |
| **Compute** | ✅ | No | Workstation, GPU server |
| **Seed** | ✅ | Yes | NAS, dedicated storage |
| **Bridge** | ✅ | No | API gateway for Discord/email/etc |

One device can be multiple roles. Your agent-vm = Relay + Compute + Bridge.

#### CRDT Sync Engine (Offline-First)

All data is **conflict-free replicated** (CRDTs). No central authority needed.

| Data | CRDT Type | Conflict Resolution |
|---|---|---|
| Tasks, settings, votes | LWW Register | Last-write-wins per field |
| Journal, notes, rich text | Yjs/Automerge | Operational transform |
| Files | Content-addressed + Merkle DAG | Hash-based, immutable blocks |
| Messages, channels | Causal broadcast | Vector clocks, order preserved |
| Agent state | LWW Map | Last-write-wins with tombstones |

**Offline-First Guarantee:** Edit anything without internet. Changes queue locally. Devices reconnect → CRDTs auto-merge. Zero data loss.

#### Sync Policies (Per-Space, Per-Device)

| Policy | Behavior | Storage |
|---|---|---|
| **Full Mirror** | Everything synced locally | High |
| **On-Demand** | Metadata synced, files fetched on access | Medium |
| **Pinned** | Only starred items synced | Low |
| **Relay-Only** | Forward only, no storage | Minimal |

Example: Phone = "On-Demand" for work space, "Full Mirror" for personal.

---

## IV. KNOWLEDGE LAYER — Wiki, Vault, Graph

### Vault (Obsidian-Based)

Your knowledge base. Markdown notes, wikilinks, bidirectional graph.

**Structure:**
```
vault/
  ├── Trajan/ (personal context)
  │   ├── Preferences.md (what you like/dislike)
  │   ├── Decisions.md (big choices made)
  │   ├── Goals/ (yearly/monthly/weekly)
  │   └── Contacts/ (people, relationships)
  ├── Architecture/ (system designs, decisions)
  │   ├── System Overview.md
  │   ├── EMA Mesh Architecture.md
  │   ├── Agent Architecture.md
  │   └── [100+ design docs]
  ├── Projects/ (active & archive)
  ├── Research/ (deep dives, analysis)
  ├── System/ (ops, intelligence notes)
  ├── Tools/ (CLI reference, APIs)
  ├── Reference/ (system prompts, patterns)
  └── Daily Notes/ (2026-04-03.md, etc)
```

**Tools:**
- **QMD (every 30min):** Semantic search, semantic embedding, rerank top results
- **Ontology Sync (every 3h):** Entity extraction, wikilink suggestions, graph updates
- **Vault Refresh (on-demand):** Auto-generate truth-from-source docs (Agent Roster, Skills, System State)
- **Staleness Detection:** Flag old notes, suggest reviews

### Knowledge Graph

**Nodes:**
- Concepts (Architecture, Dispatch, Agents, etc)
- Entities (People: Trajan, Craig Wilson; Systems: EMA, OpenClaw)
- Decisions (Policy, design choices)
- Projects (Proslync, EMA, Agent OS)

**Edges:**
- References (A references B)
- Implements (Design X implements principle Y)
- Depends-on (Feature A depends on infrastructure B)
- Caused-by (Bug X was caused by decision Y)
- Related-to (Concept A is related to concept B)

**Query Examples:**
```
"What decisions led to the current dispatch system?"
"Which projects depend on the vault architecture?"
"Show all systems referencing 'proposal generation'"
"What are the failure modes in the mesh network?"
```

### Wiki System (Proposed for Phase 2)

**Not** a separate tool. It's a **view of the Vault**.

Any markdown note can become a "wiki entry" by adding frontmatter:
```yaml
---
type: wiki
slug: dispatch-system
public: true
version: 3
last-reviewed: 2026-04-03
---
```

Export wiki pages as:
- Web pages (rendered HTML)
- Static site (with navigation)
- PDF (for distribution)
- Embedded (iframe in proposals, docs)

**Multi-version support:** Keep versions 1, 2, 3 of the same wiki page. Track evolution. Link to specific version in proposals.

---

## V. MULTI-AGENT SYSTEM

### Agent Roster

**Persistent:**
- **Right Hand** (main) — User-facing, Discord identity bar, orchestrates specialists

**Specialists (spawned as Claude Code):**

| Agent | Skills | Triggers | When to Use |
|---|---|---|---|
| **Researcher** | deep-research, web scraping, agent-tester | "look into", research questions | Unknown topics, evaluations, discovery |
| **Coder** | code, agent-factory, devloop | "build", code files, errors | Building features, debugging, full dev lifecycle |
| **Ops** | system health, crons, performance | "check health", "deploy" | System administration, monitoring, evolution |
| **Security** | scanning, hardening, agent-testing | "audit", "secure" | Threat modeling, vulnerability scanning |
| **Vault Keeper** | knowledge org, memory hygiene | "organize vault", "clean notes" | Knowledge architecture, vault maintenance |
| **Scout** | web research, scraping, monitoring | "scrape", "monitor" | Web research, feed watching |
| **Prompt Engineer** | SOUL.md optimization, metaprompting | "improve prompt", "optimize SOUL" | Agent personality tuning |
| **Devil's Advocate** | review, challenge, 5-stakeholder analysis | "review this", "challenge" | Pre-ship review, decision analysis |
| **Strategist** | mental models, decision frameworks | "analyze decision", "strategy" | Multi-perspective analysis |

**Orchestrator (silent, background):**
- Universal multi-agent coordinator
- Used for 3+ agent workflows
- No identity bar, no Discord presence
- Spawns agents, monitors, coordinates handoffs

### Agent Dispatch Protocol

**Intelligent Delegation Framework**

1. **Decompose** — Break task into subtasks by domain
2. **Score** — Complexity, criticality, reversibility
3. **Assign** — Map to agents based on fitness + performance history
4. **Dispatch** — Spawn agents, optionally parallel
5. **Track** — Log to TASKS.md, record expected completion time
6. **Collect** — Wait for responses (timeout = 2x expected for that agent)
7. **Verify (Two-Stage)**
   - **Spec Compliance** — Matches what was asked?
   - **Quality** — Is work well-done?
   - Iterate max 3 loops if issues
8. **Log** — Update agent-performance.md, feed outcome tracker
9. **Chain** — If more work, dispatch next round immediately
10. **Present** — Post synthesis to Discord with identity bar
11. **Capture** — Session note to vault/Sessions/ (what worked, what failed, lessons)

### Concurrency Limits

- Max 6 parallel agents (VM resource limits)
- If >6 subtasks: Batch into groups of 6
- Each batch sequential, but tasks within batch parallel
- Count subtasks before dispatching

### Agent Fitness Tracking

**Per agent, per domain:**
```json
{
  "agent_id": "coder",
  "domain": "feature-build",
  "fitness": 0.87,
  "total_tasks": 47,
  "successful": 41,
  "failed": 6,
  "timeout": 3,
  "avg_tokens": 18520,
  "avg_time_min": 12.4
}
```

Used to pick best agent for future tasks, detect trending failures, adjust timeouts.

---

## VI. PROPOSALS ENGINE

### Generation Loop

**Step 1: Parse Task**
```
Input: "Build a dashboard that shows agent execution status in real-time"
  ↓
Extract:
  - Scope: "dashboard"
  - Domain: "frontend"
  - Complexity: "medium"
  - Dependencies: "execution API, WebSocket stream"
```

**Step 2: Generate Proposals**
```
Temperature=0.7 (diverse)
N=5 proposals with different angles:

Proposal 1: "Simple React grid + polling"
Proposal 2: "WebSocket real-time + canvas"
Proposal 3: "Streaming JSON + Svelte reactivity"
Proposal 4: "Vue 3 composition + state machine"
Proposal 5: "Static HTML + auto-refresh" (fallback)
```

**Step 3: Evaluate**
```
For each proposal:
  - Score quality (0-10)
  - Flag architecture concerns
  - Estimate effort (1-5 days)
  - Identify risks
  - Check dependencies

Best proposal moves to user choice
Others stored for reference
```

**Step 4: User Chooses**
```
Click "Use Proposal 2: WebSocket real-time"
  ↓
Dispatch Coder with full proposal context
  ↓
Coder builds following proposal
```

**Step 5: Feedback Loop**
```
Execution done
  ↓
Tag outcome: "matched_proposal_2"
  ↓
Learn: "WebSocket proposals have 89% success rate for dashboards"
  ↓
Future tasks: prefer WebSocket proposals for real-time needs
```

### Deliberation Gate (NEW)

**Structural tasks require proposals:**
- Restructure
- Migrate
- Delete
- Rename
- Globally replace
- Vault redesign
- Infrastructure changes

**UI Prompt:** "This looks structural. Generate a proposal first?" 
- Yes → Proposals pipeline
- No → Direct dispatch
- Checkbox: "Don't ask again"

This prevents rework by forcing thinking before action.

---

## VII. ACTIVE PROJECTS & SYSTEMS

### EMA (Elixir-Based Execution)

**Phase 1 (Complete, shipped):**
- ✅ F1: Bridge (Claude Code integration)
- ✅ F2: Proposals (generator + evaluator)
- ✅ F3: Session store (DCC persistence)
- ✅ F4: Quality loop (execution monitoring)
- ✅ F5: Orchestration (agent coordination)

**Phase 2 (Week 7 Sprint):**
1. **Dispatch Board** (Campaign.Flow topology + visual rendering)
2. **Reflexion Injection** (Honcho pre-dispatch context)
3. **Scope Advisor** (Honcho task warnings)
4. **Deliberation Gate** (StructuralDetector + UI)

**Phase 3 (Week 8+):**
- HQ frontend (against executions:all WebSocket)
- Outcome learning (proposals that lead to success)
- Automated routing (Router + CampaignManager)

### Honcho Integration (Highest Leverage)

**What it does:** Self-hosted memory server with background dreaming process

**Metrics:** 27.8% recall improvement (62.6% → 90.4%)

**3 Use Cases:**
1. **Pre-dispatch injection** — `Honcho.query_user("What are preferences for #{task_type}?")` → injected into agent prompt
2. **Scope advisor** — `Honcho.query_user("What scope limits exist?")` → warning banner on task creation
3. **Proposal quality gate** — `Honcho.query_user("What makes a good proposal?")` → evaluator criteria

**Implementation:** HTTP calls from Elixir via Req. Docker one-liner. Apache 2.0, self-hosted.

**Why highest leverage:** Compounds exponentially. Every task after Honcho makes next task smarter. Early integration = exponential gains.

### OpenClaw (Infrastructure)

**Current:**
- Gateway daemon on port 18789
- 29 configured agents
- OAuth Guardian v4 for token management
- Discord + Telegram channels
- Session persistence

**Status:** Stable, powering dispatch system

### Claude Code Bot v2

**Discord bot (ID: 1482938994022158430)**

Spawns Claude Code sessions directly from Discord messages. Can:
- Run code snippets
- Execute complex tasks
- Return results inline or as files
- Stream output to Discord

Service name: `claude-code-bot`. Active, monitored.

### Superman (Codebase Intelligence)

**Multimodal codebase indexing:**
- Git AST parsing (functions, classes, types)
- Call graphs
- Dependency analysis
- File structure
- Commit history

Lives in `daemon/.superman/` as JSON indices. Updated on demand by agents.

Used to:
- Understand code structure before refactoring
- Find where to add new features
- Detect circular dependencies
- Route intent to right subsystem

---

## VIII. VAULT ECOSYSTEM

### Structure

```
vault/
  ├── Trajan/
  │   ├── Preferences.md ← READ on startup
  │   ├── Decisions.md
  │   └── Goals/
  ├── Architecture/ (100+ docs)
  ├── Projects/ (active work)
  ├── Research/ (deep dives)
  ├── System/ (ops, intelligence notes)
  ├── Daily Notes/ (2026-04-03.md, etc)
  └── Templates/ (session capture, system note)
```

### Daily Ritual

**Every heartbeat (20min intervals):**
1. Rotate through 8 checks (auth, gateway, disk, load, vault, sessions, refresh, freshness)
2. One per heartbeat = comprehensive coverage without token waste
3. Flag issues immediately

**Weekly:**
- Update MEMORY.md with session learnings
- Prune resolved projects
- Archive stale intelligence notes

**Monthly:**
- Review vault structure
- Update stalest high-importance files
- Analyze patterns in sessions

### Intelligence Notes System

**File**: `/vault/System/Intelligence Notes/`

Microlearnings captured during sessions. ~300 notes tracking:
- Tool failures (discord webhook 10015 unknown-error)
- Performance observations (token consumption bugs)
- Pattern discoveries (CRDT conflicts under load)
- Configuration gotchas (mise activation breaks heredoc)
- Code patterns (best practices, anti-patterns)

**AI Agent learning:** Agents can read these before dispatch for faster solutions.

---

## IX. DISCORD & MESSAGING

### Channel Architecture

| Channel | Purpose | Frequency |
|---|---|---|
| **#dispatch** | Task commands, agent results | All day |
| **#research** | Research queries, findings | All day |
| **#projects** | Project updates, milestones | Daily |
| **#chat** | Casual conversation | All day |
| **#desk** | Desk sessions, work-in-progress | Daily |
| **#system-buildout** | Architecture work | Weekly |
| **#ops** | System health, crons | Hourly |

### Right Hand Identity

- Accent color: #E8A838 (warm gold)
- Emoji: 🤝
- Voice: Trusted partner, casual but sharp, no sycophancy
- Posts: Only Right Hand posts to Discord (specialists' results shown under her name)

---

## X. EXECUTION METRICS & LEARNING

### Outcome Tracker

**File**: `memory/outcome-tracker.json`

Every task that completes:
```json
{
  "task_id": "...",
  "intent": "description",
  "proposal_used": "proposal_2",
  "agent": "coder",
  "domain": "feature-build",
  "status": "success",
  "tokens_used": 18520,
  "time_minutes": 12,
  "quality_score": 8.5,
  "learned": ["WebSocket good for real-time", "Split tests into units"],
  "timestamp": "2026-04-03T20:55Z"
}
```

Used for:
- Agent fitness scoring
- Proposal success rate tracking
- Domain difficulty estimation
- Resource planning (tokens, time)

### Workflow Pattern Crystallization

**File**: `memory/workflow-patterns.json`

Recurring successful sequences:
```json
{
  "pattern": "research→proposal→dispatch→outcome",
  "success_count": 12,
  "failure_count": 2,
  "success_rate": 0.86,
  "avg_time_min": 45,
  "crystallization_candidate": true
}
```

When 5+ successes + 70%+ success rate → candidate for hardening as skill or script.

---

## XI. WHAT'S READY. WHAT'S NOT.

### ✅ BUILT & SHIPPED

- Execution system (concurrent-safe, semantically correct)
- Task/proposal model
- Agent dispatch + monitoring
- Bridge (Claude Code integration)
- Session store (DCC)
- Discord integration
- Vault + QMD search
- Knowledge graph (partial)
- OpenClaw gateway

### 🏗️ IN PROGRESS (Week 7)

- Dispatch Board (Campaign.Flow topology)
- Reflexion Injection (Honcho context)
- Scope Advisor (Honcho warnings)
- Deliberation Gate (StructuralDetector)

### 📋 PHASE 2 READY (Needs Assignment)

- HQ frontend (WebSocket wiring)
- Router (event classification)
- CampaignManager (persistent agent clusters)
- Honcho Docker setup

### ❌ NOT STARTED (Phase 3+)

- Full P2P mesh (libp2p)
- Multi-device sync (CRDT)
- Spaces (personal/org/shared/ghost)
- File system (content-addressed)
- "All Spaces" unified view
- Public wiki export

---

## XII. REVISION & ITERATION CHECKLIST

Use this to iterate on this document:

- [ ] **Execution Layer** — Still accurate? New subsystems? Schema changes?
- [ ] **Proposals Engine** — Feedback loop working? Quality metrics?
- [ ] **Spaces & Mesh** — Are we building this? Timeline?
- [ ] **Vault** — Freshness? Missing major sections?
- [ ] **Agents** — Roster still accurate? New specialists?
- [ ] **Infrastructure** — Still true? New services?
- [ ] **Metrics** — Are we tracking what matters?
- [ ] **Cross-Links** — All references valid?

---

## XIII. HOW TO USE THIS DOCUMENT

**This is LIVING.** Update it whenever:
- New system is built
- Major architecture decision is made
- Subsystem changes fundamentally
- You discover something was wrong

**Format:**
- Markdown, wikilinks, cross-references
- Tables for comparisons
- Code blocks for schemas/examples
- Checklists for procedures
- Status badges (✅/🏗️/📋/❌)

**Store in:** `/home/trajan/vault/System/MASTER-SYSTEM-OVERVIEW.md`

**Sync to:** Discord #system-buildout when major revisions happen

---

Last updated: 2026-04-03 21:33 UTC
Next review: 2026-04-04 (daily until Phase 2 starts)
Checksum: regenerate after major changes via `vault-refresh.sh`

---

## REFORMED PLAN (2026-04-03 Post-Overview)

### What Changed Since Master Overview

**Context:** Master overview created 20:55 UTC. Scanning session history shows:
- No new context/blockers between 20:55–21:33 UTC
- All 4 commits merged successfully
- Frontend builds cleanly
- Execution system verified correct

### Immediate Actions (Next 48h)

**1. Honcho Docker Setup** ⭐ CRITICAL PATH
- Impact: Unlocks Phase 2 leverage (27.8% recall improvement)
- Effort: 2 hours (Docker one-liner, HTTP client setup)
- Blocks: Reflexion Injection, Scope Advisor features
- Status: **NOT STARTED**
- Owner: (TBD)
- Timeline: Should start TODAY to unblock Week 7

**2. Verify System Health**
- [ ] Run `openclaw status` — gateway health?
- [ ] Check `/var/log/oauth-guardian.log` — auth healthy?
- [ ] Disk usage: `df -h /` — still <85%?
- [ ] All 4 commits in EMA main? `git log --oneline | head -5`
- Owner: Right Hand (heartbeat protocol)

**3. Create Honcho HTTP Client** (in bridge.ex)
- [ ] Req library call to Honcho API
- [ ] Parse response, inject into prompt
- [ ] Cache responses (avoid hammering Honcho)
- Owner: Coder agent
- Effort: 1 hour

### Week 7 Sprint (Parallel, Starting Mon)

**Feature 1: Dispatch Board** (Frontend + Elixir)
- Components: Campaign.Flow struct + PhoenixLiveView + React rendering
- Dependencies: None (independent)
- Effort: 3 days
- Owner: Coder agent
- Success: Board displays live execution topology, click-to-detail works

**Feature 2: Deliberation Gate** (Elixir + Frontend prompt)
- Components: StructuralDetector keyword matcher + UI prompt
- Dependencies: None (independent)
- Effort: 2 days
- Owner: Coder agent
- Success: Structural tasks require proposal before dispatch

**Feature 3: Reflexion Injection** (Elixir bridge)
- Components: Honcho HTTP call + context injection into agent prompt
- Dependencies: Honcho Docker setup (blocker!)
- Effort: 1 day (after Honcho is ready)
- Owner: Coder agent
- Success: Agents read user preferences before running

**Feature 4: Scope Advisor** (Elixir + Frontend banner)
- Components: Honcho scope query + warning UI
- Dependencies: Honcho Docker setup (blocker!)
- Effort: 1 day (after Honcho is ready)
- Owner: Coder agent
- Success: Users warned when task scope exceeds typical limits

### Week 7 Blockers & Unblocking Strategy

**Blocker: Honcho Docker not started**

If Honcho takes >4 hours to setup:
- Build Features 1+2 (Dispatch Board + Deliberation Gate) in parallel
- Features 3+4 (Honcho-dependent) queue for next sprint
- Zero delay on progress (Features 1+2 = 5 days solid)

If Honcho is ready by Mon EOD:
- All 4 features parallel from Tue onward
- Completion target: Fri EOD

**Contingency:** If Honcho has integration issues:
- Skip Honcho for Week 7
- Hardcode Scope Advisor thresholds (default safe values)
- Re-integrate Honcho in Week 8 post-mortem

### Week 8: HQ Frontend

**Integration:** Wire HQ frontend against `executions:all` WebSocket
- Displays live agents running
- Shows dispatch board embedded
- Real-time status updates
- Owner: Coder agent
- Effort: 2 days
- Success: HQ dashboard shows full system state

### Metrics & Learning (Ongoing)

**Start tracking immediately:**

✅ **outcome-tracker.json** — Log every task completion
```json
{
  "task_id": "uuid",
  "intent": "string",
  "proposal_used": "string|null",
  "agent": "string",
  "domain": "string",
  "status": "success|failed|timeout",
  "tokens_used": 0,
  "time_minutes": 0,
  "quality_score": 8.5,
  "learned": ["list", "of", "insights"],
  "timestamp": "ISO"
}
```

✅ **workflow-patterns.json** — Track recurring patterns
```json
{
  "pattern": "string (e.g., research→proposal→dispatch)",
  "success_count": 0,
  "failure_count": 0,
  "success_rate": 0.86,
  "avg_time_min": 45,
  "crystallization_candidate": false
}
```

**Learning loop:**
- Every task completion → log to outcome-tracker
- Every 5 tasks → analyze patterns in workflow-patterns
- Every week → surface crystallization candidates (5+ successes, 70%+ rate)

### Critical Path Summary

```
TODAY (2026-04-03):
  ├─ Honcho Docker setup [2h] ← CRITICAL
  └─ System health check [15min]

WEEK 7 (2026-04-07–04-11):
  ├─ Dispatch Board [3d, independent] ✅
  ├─ Deliberation Gate [2d, independent] ✅
  ├─ Reflexion Injection [1d, blocked on Honcho] ⏸
  └─ Scope Advisor [1d, blocked on Honcho] ⏸

FALLBACK (if Honcho delayed):
  ├─ Build Features 1+2 fully (5d of work)
  ├─ Queue Features 3+4 for next sprint
  └─ Zero project delay (still ship Board+Gate on time)

WEEK 8 (2026-04-14–04-18):
  └─ HQ frontend WebSocket integration [2d]
```

### Decision Checkpoints

**By Mon 2026-04-07 EOD:**
- [ ] Honcho Docker setup: ✅ Done or ❌ Blocked?
- [ ] If blocked: Are we falling back to Features 1+2 only?
- [ ] Who owns Honcho? (Coder agent or assign to specialist?)

**By Fri 2026-04-11 EOD:**
- [ ] Which features shipped? (minimum: Dispatch Board + Deliberation Gate)
- [ ] What % of tokens burned vs budget?
- [ ] Any regressions in execution system?

**By Fri 2026-04-18 EOD:**
- [ ] HQ frontend WebSocket wired?
- [ ] Phase 2 MVP complete?
- [ ] Ready to start Phase 3 (Router + CampaignManager)?

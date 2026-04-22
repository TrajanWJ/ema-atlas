---
title: "EMA Self-Building Bootstrap Strategy"
date: 2026-04-03
updated: 2026-04-03T21:50Z
author: Right Hand
tags: [ema, bootstrap, self-building, execution, architecture, products]
type: project
status: active
---

# 🤖 EMA Self-Building Bootstrap Strategy

**The goal:** EMA becomes its own first customer. Use EMA's dispatch system to build EMA itself. Close the loop.

Generated: 2026-04-03 21:50 UTC

---

## I. THE BOOTSTRAP PROBLEM & SOLUTION

### The Problem

Right now:
- EMA is a task dispatch system
- But it has no first project
- No real intents running
- No outcomes being tracked
- System is theoretically sound but untested under load

### The Solution

**Turn EMA itself into the first project.**

EMA's task: Build Phase 2 features (Dispatch Board, Deliberation Gate, Honcho integration, Scope Advisor).

- **Project:** "EMA Phase 2 Build"
- **Space:** Personal (Trajan's workspace)
- **Intents:** 4 major features + 10+ sub-intents
- **Agents:** Dispatch via EMA's own system
- **Pipeline:** Full execution → outcome tracking → learning loop

**Why this works:**
1. Real work happens (features actually ship)
2. Real data flows through the system (executions, outcomes, metrics)
3. Real problems are discovered (blockers, regressions, UX issues)
4. Learning loop fires immediately (outcome tracker sees first data)
5. Next sprint is smarter because Week 7 data exists

---

## II. BOOTSTRAPPING SEQUENCE

### Phase 0: Setup (TODAY, 1h)

**1. Create EMA Project in EMA**
```
POST /api/projects
{
  "slug": "ema-phase2",
  "name": "EMA Phase 2 Build",
  "space_id": "personal",
  "description": "Build Phase 2 features using EMA itself"
}
```

**2. Create 4 Root Intents**
```
POST /api/projects/ema-phase2/intents
[
  {
    "slug": "dispatch-board",
    "title": "Build Dispatch Board with Campaign.Flow topology",
    "description": "Create Phoenix/React component showing live agent execution as interactive graph",
    "domain": "feature-build",
    "complexity": "medium",
    "scope": "3 days"
  },
  {
    "slug": "deliberation-gate",
    "title": "Implement Deliberation Gate for structural tasks",
    "description": "StructuralDetector + UI prompt requiring proposal before dispatch",
    "domain": "feature-build",
    "complexity": "medium",
    "scope": "2 days"
  },
  {
    "slug": "honcho-integration",
    "title": "Honcho Docker + Reflexion Injection",
    "description": "Setup Honcho, build HTTP client, inject pre-dispatch context",
    "domain": "feature-build",
    "complexity": "high",
    "scope": "3 days"
  },
  {
    "slug": "scope-advisor",
    "title": "Scope Advisor with Honcho queries",
    "description": "Warning banner on task creation for scope violations",
    "domain": "feature-build",
    "complexity": "low",
    "scope": "1 day"
  }
]
```

**3. Dispatch via EMA**
- Right Hand creates intent via HQ UI
- EMA router classifies: "feature-build" → assign to Coder agent
- Coder agent spawned with full intent context
- Execution logged to Executions table
- Output stored in `intents/*/results/`

### Phase 1: Week 7 Execution (Mon–Fri)

**Dispatch Board + Deliberation Gate (Independent)**
```
Intent: dispatch-board
→ Coder agent spawned
→ Reads proposal (from proposals/ folder)
→ Builds feature over 3 days
→ Commits to main
→ Execution logged
→ Outcome tracked
```

Same for Deliberation Gate.

**Honcho Integration + Scope Advisor (Blocked)**
```
Intent: honcho-integration
→ Blocked: "Honcho Docker not started"
→ Waits for external resolution
→ Once resolved: dispatches Coder agent
→ Proceeds as above
```

Same for Scope Advisor.

**Metrics collection starts:**
```json
{
  "task_id": "dispatch-board-w7",
  "intent": "Build Dispatch Board",
  "agent": "coder",
  "domain": "feature-build",
  "status": "success|failed",
  "tokens_used": 45000,
  "time_minutes": 1440,
  "quality_score": 8.7,
  "learned": ["React Flow good for topology", "Real-time updates need WebSocket", "..."],
  "timestamp": "2026-04-12T18:00:00Z"
}
```

### Phase 2: Week 8+ (HQ Frontend + Iteration)

**New intent: HQ Frontend WebSocket**
```
Intent: hq-frontend-websocket
→ Coder agent spawned
→ Builds against real Dispatch Board (now exists)
→ Uses real execution data from Week 7
→ Feature ships with higher quality (data-driven)
```

**Feedback loop fires:**
- Week 7 outcomes analyzed
- Patterns extracted (workflow-patterns.json)
- Crystallization candidates identified
- Next sprint informed by actual data

---

## III. BRAINSTORM: NEW APPS & INTERFACES

### Category A: EMA Command Line

**Concept:** Rich CLI for managing tasks, viewing dispatch, querying outcomes

**Features:**
```
ema task create "build feature X" --domain feature-build --scope 2d
ema task list --status in_progress
ema agent ps (show running agents)
ema outcome show dispatch-board-w7 (show full execution outcome)
ema metrics dashboard (token burn, success rates, agent fitness)
```

**Why build it:**
- Keyboard-driven interface for power users
- Works on slow networks (no WebSocket required)
- Can be scripted for automation
- Complements HQ dashboard

**Owner:** Coder agent (Week 8, 1 day)

---

### Category B: Agent Dashboard (Enhanced HQ)

**Current HQ:** Executions WebSocket, dispatch board, status indicators

**New ideas:**
1. **Agent Workbench** — Live editor for agent prompts, test with sample task
2. **Outcome Deep Dive** — Click task → see execution log, tokens, time, quality score
3. **Workflow Replay** — Pause/resume/redo failed intents with modified params
4. **Proposal Viewer** — See all proposals for a task, compare architectures side-by-side
5. **Learning Graph** — Visualize patterns + crystallization candidates
6. **Budget Forecast** — Based on Week 7 burn rate, predict Week 8 spend

**Why build these:**
- Real data now exists (Week 7 outcomes)
- Feedback loop needs visibility
- Decision-making requires dashboard access
- Agent self-improvement needs reflection interface

**Owner:** Coder agent (Week 8+, 2-3 days)

---

### Category C: Proposal Visualization

**Concept:** Interactive UI for exploring proposals before dispatch

**Features:**
- Show all 5 proposals for a task (if generated)
- Architecture diagrams (text-based or SVG)
- Effort estimate, risk flags, dependencies
- Historical success rate (if previous similar tasks exist)
- One-click "Use this proposal" → dispatch agent
- Post-execution: show which proposal was used + how it performed

**Why build it:**
- Proposals exist but are invisible (JSON files)
- Users need to understand tradeoffs
- Feedback loop requires proposal↔outcome linking
- Enables learning: "WebSocket proposals have 89% success rate for dashboards"

**Owner:** Coder agent (Week 9, 2 days)

---

### Category D: Knowledge Graph Browser

**Concept:** Visual navigator for vault + decisions + architecture

**Features:**
- Nodes: Concepts, projects, decisions, architectures
- Edges: References, implements, depends-on, caused-by
- Search: "Show all systems that depend on dispatch system"
- Time travel: "What was decided in March?" (date range queries)
- Suggestion engine: "Docs that reference X but not Y" (gap detection)

**Why build it:**
- Vault is now 100+ documents
- Knowledge graph is semi-built (partial in current system)
- Need visual way to understand system complexity
- Helps onboard new agents

**Owner:** Researcher agent (Week 9, 2-3 days)

---

### Category E: Multi-Space UI

**Concept:** Space selector (Slack-style) + unified cross-space view

**Features:**
- Space selector in top-left (Personal, Proslync Team, Wilson Premier, etc)
- "All Spaces" view: unified feed of tasks, proposals, channel notifications
- Per-space context switching (vault, agents, projects isolated per space)
- Space-scoped permissions (who can see what)

**Why build it:**
- Spaces architecture is defined (in MASTER-SYSTEM-OVERVIEW)
- Only Personal space exists now
- Phase 3 needs this for org/shared/ghost spaces
- Current UI assumes single space

**Owner:** Coder agent (Week 10+, 3 days)

---

### Category F: Agent Personality Tuning

**Concept:** SOUL.md editor + real-time agent testing

**Features:**
- Edit agent SOUL.md in-app
- Test against sample task (live preview)
- A/B compare two personalities on same task
- See which personality style performs better (from outcome data)
- Auto-suggest personality tweaks based on user feedback

**Why build it:**
- Agents are now real and running
- Feedback exists (outcome tracker)
- SOUL.md is powerful but hard to tweak
- Self-improvement loop needs personality testing

**Owner:** Prompt Engineer agent (Week 10, 2 days)

---

### Category G: Vault Auto-Sync

**Concept:** Real-time wikilink + bi-directional reference updates

**Features:**
- File X references file Y → automatically add backlink in Y
- New decision created → auto-add to Decisions.md TOC
- Architecture note created → auto-add to Architecture/ index
- Orphaned notes detected (no links in or out)
- Staleness detector: flag notes that haven't been reviewed in 30+ days

**Why build it:**
- Vault is semi-manual (backlinks not always bidirectional)
- QMD runs every 30min (slow for real-time work)
- Onboarding needs quick vault navigation
- Intelligence notes need automatic classification

**Owner:** Vault Keeper agent (Week 10, 2 days)

---

### Category H: Outcome Learning Dashboard

**Concept:** Real-time metrics + pattern crystallization UI

**Features:**
- Token burn graph (real-time, vs budget)
- Agent fitness scores (per domain, over time)
- Proposal success rates (WebSocket: 89%, React Grid: 72%)
- Workflow pattern candidates (5+ successes, 70%+ rate)
- Crystallization workflow: propose skill → review → implement → test

**Why build it:**
- outcome-tracker.json will have real data after Week 7
- workflow-patterns.json will have patterns
- Management needs visibility
- Self-improvement loop needs metrics

**Owner:** Ops agent (Week 10, 2-3 days)

---

## IV. COMPONENT EXPANSION IDEAS

### A. Proposals Engine Enhancements

**Current state:** Generator + evaluator, basic quality gate

**New ideas:**
1. **Proposal Versioning** — Keep all versions of proposals for same task (track evolution)
2. **Proposal Reasoning** — Add "why we chose this approach" to each proposal
3. **Alternative Comparison** — Side-by-side diff of proposal approaches
4. **Risk Scoring** — Built-in risk assessment for each proposal
5. **Dependency Mapping** — Show what each proposal depends on (libraries, services, APIs)
6. **Historical Outcomes** — Link proposal to past executions (learn which approaches succeed)

**Impact:** Proposals become first-class, visible, learnable

---

### B. Dispatch System Enhancements

**Current state:** Intent → Agent spawn → Outcome

**New ideas:**
1. **Sub-Intent Dispatch** — Intent can spawn child intents (hierarchical decomposition)
2. **Agent Handoff Protocol** — Agent A finishes → automatically passes to Agent B
3. **Conditional Dispatch** — "If research succeeds, dispatch coder; if fails, research again"
4. **Parallel Intents** — Multiple agents work on same intent (diverge/parallax mode)
5. **Intent Bundling** — Group related intents into campaigns (launch as cluster)
6. **Intent Priority Queue** — Sort by importance + token budget + estimated time

**Impact:** Dispatch becomes workflow engine, not just task runner

---

### C. Execution Transparency

**Current state:** execution-log.md (append-only), Executions table (DB)

**New ideas:**
1. **Live Streaming** — See agent output in real-time (not just final result)
2. **Execution Breakpoints** — Pause mid-execution, inspect state, resume
3. **Rollback Protocol** — Failed execution → auto-rollback git changes
4. **Execution Diff** — See exact code changes made by agent (not just log)
5. **Execution Audit Trail** — Who initiated? When? With what params? Full trace.
6. **Error Analysis** — When execution fails, auto-classify error (timeout, OOM, user error, etc)

**Impact:** Full debugging + transparency into agent actions

---

### D. Agent Evolution

**Current state:** Agent fitness tracking, basic retry logic

**New ideas:**
1. **Agent Reflection** — After execution, agent reads outcome + self-evaluates
2. **Agent Prompt Evolution** — SOUL.md auto-tweaks based on poor outcomes
3. **Agent Specialization** — Agents develop expertise in domains (coder becomes "feature-build specialist")
4. **Agent Delegation** — Agents can spawn sub-agents for sub-tasks
5. **Agent Learning Loop** — Agent reads past outcomes, improves prompts, re-tests
6. **Agent Red-Teaming** — Devil's Advocate auto-challenges agent's work

**Impact:** Agents improve over time without manual intervention

---

### E. Context & Memory

**Current state:** Vault, QMD search, daily notes

**New ideas:**
1. **Session Capture** — Auto-save execution context (what agents learned)
2. **Active Memory** — Keep last 10 outcomes in agent context (temporal recency)
3. **Semantic Clustering** — Group similar past outcomes (when is "WebSocket proposal" relevant?)
4. **Decision Archaeology** — Why was this decision made? Trace back to original reasoning
5. **Preference Injection** — Honcho-style memory, but deeper (long-term preference learning)
6. **Context Compression** — Summarize old outcomes, keep compressed versions

**Impact:** Agents and humans reason better with richer context

---

## V. TWO-AGENT BOOTSTRAP DISPATCH

### Setup (NOW)

**Dispatch 1: ARCHITECT AGENT** (Parallel)
- **Mission:** Design Phase 2 implementation roadmap with full integration plan
- **Scope:** 
  - How should EMA dispatch intents about itself?
  - What's the data flow when Coder agent builds Dispatch Board?
  - How should outcome data feed back into system?
  - What sub-intents should be created?
  - Which agents should own what?
- **Output:** 
  - `/home/trajan/Projects/ema/PHASE2_EXECUTION_PLAN.md` (detailed roadmap)
  - `daemon/lib/ema/intents/` schema updates needed
  - Dispatch protocol updates (if any)
- **Success:** Clear step-by-step for launching self-building loop

**Dispatch 2: IDEATION AGENT** (Parallel)
- **Mission:** Brainstorm + spec new apps, interfaces, and feature expansions
- **Scope:**
  - Deep dive on each Category A-H idea above (CLI, Dashboard, Proposals UI, etc)
  - Spec out which ones are Phase 2 vs Phase 3 vs later
  - Estimate effort for each (in EMA dispatch units: hours, days, weeks)
  - Prioritize by: impact × leverageability × implementability
  - Identify hidden dependencies (X blocks Y blocks Z)
- **Output:**
  - `/home/trajan/Projects/ema/NEW_FEATURES_SPEC.md` (detailed specs)
  - `/home/trajan/Projects/ema/FEATURE_PRIORITY_MATRIX.md` (prioritized list with effort)
  - Suggested order for Phase 2, 3, 4 roadmap
- **Success:** Clear path for next 8 weeks of building

---

### Why Two Agents, Parallel?

**Architect (Top-Down):** "How do we make self-building work?"
- Understands system architecture
- Designs the meta-workflow
- Ensures coherence across dispatch system

**Ideation (Bottom-Up):** "What should we build next?"
- Generates ideas + specs
- Prioritizes by impact + feasibility
- Feeds architecture with feature requirements

**They converge:** Architect says "self-building needs X," Ideation says "new features should include X," both inform final roadmap.

---

## VI. FIRST INTENT: DISPATCH BOARD

### Why Start Here?

1. **Independent** — Zero dependencies on Honcho
2. **Visual** — Result is immediately visible + useful (motivation)
3. **High impact** — Shows dispatch status in real-time (needed for everything else)
4. **Realistic scope** — 3 days of work, fits Week 7
5. **Proves dispatch system** — Real intent → real agent → real output → real outcome

### The Intent

```yaml
slug: dispatch-board
title: "Build Dispatch Board with Campaign.Flow topology"
description: |
  Create a live, interactive component showing active agent executions as a graph.
  Nodes = agents/campaigns. Edges = dependencies. Live status updates via WebSocket.
  Click node to drill into execution detail (tokens, time, log).

domain: feature-build
complexity: medium
scope: 3 days
  
depends_on: []  # No blockers

acceptance_criteria:
  - Board displays live topology of running executions
  - Click node → see execution detail page
  - Real-time updates via WebSocket
  - Compiles + tests pass
  - Merged to main

deliverables:
  - daemon/lib/ema/campaigns/flow.ex (Campaign.Flow schema)
  - daemon/lib/ema_web/live/dispatch_board_live.ex (Phoenix LiveView)
  - app/src/components/DispatchBoard.tsx (React component)
  - Full test suite
```

### Execution Flow (via EMA)

```
1. Right Hand creates intent in HQ UI
   POST /api/projects/ema-phase2/intents/dispatch-board

2. EMA Router classifies:
   domain: "feature-build" → agent: "coder"

3. Coder agent spawned:
   - Receives full intent context (description, deliverables, acceptance criteria)
   - Receives proposal (from proposals/v1_dispatch_board.json)
   - Receives Superman indices (codebase structure)
   - Receives Vault context (relevant architecture docs)

4. Coder builds feature:
   - Creates PR on fresh worktree
   - Commits to feature/dispatch-board
   - Tests pass
   - Sends results back to EMA

5. Outcome tracked:
   {
     "task_id": "dispatch-board-w7",
     "intent": "Build Dispatch Board...",
     "agent": "coder",
     "status": "success",
     "tokens_used": 45000,
     "time_minutes": 1440,
     "quality_score": 8.7
   }

6. Learning loop fires:
   - "Coder successfully built board in 3 days"
   - "Used 45K tokens for feature-build task"
   - "Quality score: 8.7 (high)"
   - "Pattern: feature-build intents = 3 days, ~45K tokens"
```

---

## VII. CRITICAL SUCCESS FACTORS

1. **Proposal exists before dispatch** — Coder needs proposal to follow
2. **Superman indices fresh** — Codebase structure available to agent
3. **Result storage works** — Output stored in intents/*/results/
4. **Outcome tracking fires** — No data loss
5. **No regressions in execution system** — Concurrent-safety holds
6. **Metrics start capturing** — outcome-tracker.json populated

---

## VIII. NEXT STEPS

**TODAY (2026-04-03):**
1. Dispatch Architect agent (roadmap + protocol)
2. Dispatch Ideation agent (specs + prioritization)
3. Review outputs, decide Week 7 launch date

**MON (2026-04-07):**
1. Create EMA Phase 2 project + 4 root intents in HQ
2. Generate proposals for Dispatch Board + Deliberation Gate
3. Dispatch Coder agent for Dispatch Board (Intent 1)

**FRI (2026-04-11):**
- Dispatch Board feature shipped (if independent)
- Deliberation Gate feature shipped (if independent)
- Week 7 outcome data exists
- Learning loop fires for Week 8

---

**Status:** Ready to bootstrap. Awaiting architect + ideation outputs.

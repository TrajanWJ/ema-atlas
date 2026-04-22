---
title: "EMA Phase 2+ Feature Specs"
date: 2026-04-03
author: Right Hand
tags: [ema, features, roadmap, phase2, phase3]
status: active
---

# EMA New Features — Top 10 Specs

Generated: 2026-04-03 22:10 UTC (authored by Right Hand after Ideation agent timeout)

---

## Feature 1: Outcome Learning Dashboard
**Impact: 10 | Effort: 2d | Phase: 2.5 | Week: W8**

### Overview
Real-time metrics dashboard showing agent fitness, token burn, success rates, and pattern crystallization candidates. This is the feedback loop made visible.

### Problem It Solves
Right now outcomes fire into outcome-tracker.json and stop. Nobody sees them. The learning loop has no display. We can't improve what we can't see.

### Key Features
- Token burn graph (real-time vs budget)
- Agent fitness scores per domain (coder/feature-build: 8.2, researcher/analysis: 7.9)
- Proposal success rates by type (WebSocket: 89%, React Grid: 72%)
- Pattern crystallization candidates (5+ successes, 70%+ rate) with promote button
- Week-over-week comparison (W7 vs W8 token efficiency)

### Example Usage
```
Week 7 sprint finishes.
Trajan opens Dashboard → sees:
- Dispatch Board built in 3 days, 42K tokens, quality 8.7
- Deliberation Gate blocked once (structural task slipped through)
- Coder agent: 78% success rate on feature-build
- Pattern candidate: "feature-build intent → coder agent = 3 day, 40K tokens"
  [Crystallize as workflow template?] → [YES]
```

### Dependencies
- Phase 2 ships (real outcomes exist)
- outcome-tracker.json populated (W7 data)

### Architecture
- New: `DashboardLive` Phoenix LiveView
- New: `Ema.Metrics` context (aggregate queries)
- No new schemas — reads existing Executions + outcome-tracker.json

---

## Feature 2: EMA CLI
**Impact: 9 | Effort: 3d | Phase: 2.5 | Week: W8**

### Overview
Keyboard-driven CLI for creating tasks, viewing dispatch, querying outcomes. Works without browser, scriptable, power-user friendly.

### Problem It Solves
Every interaction requires the HQ browser UI. No scripting, no piping, no keyboard shortcuts. Can't integrate EMA into other workflows.

### Key Features
```
ema task create "build X" --domain feature-build --scope 2d
ema task list --status in_progress
ema agent ps                              # show running agents
ema intent status dispatch-board          # check specific intent
ema outcome show dispatch-board-w7        # full execution trace
ema metrics dashboard                     # ascii metrics table
ema project create ema-phase2             # bootstrap new project
```

### Dependencies
- None — can start alongside Phase 2

### Architecture
- New Elixir CLI app (`cli/`) calling EMA HTTP API
- No schema changes
- JSON output mode for scripting (`--json`)

---

## Feature 3: Execution Live Streaming
**Impact: 9 | Effort: 2d | Phase: 2.5 | Week: W8**

### Overview
See agent output in real-time in HQ as it runs — not just the final result.

### Problem It Solves
Agent spawned → nothing visible for 3 hours → result appears. No visibility into what's happening. Can't catch bad execution early.

### Key Features
- WebSocket stream of agent stdout as it runs
- Progress indicators (files edited, tests run, errors seen)
- Interrupt button ("Stop this execution")
- Automatic error detection (surfaces errors inline, not at end)

### Dependencies
- Requires Claude-wrapper.sh (the Port orphan fix from Architect report) to pipe stdout
- HQ frontend already has WebSocket infrastructure

### Architecture
- Modify `bridge.ex` port handler to stream stdout
- New: `ExecutionStreamChannel` (Phoenix channel)
- Frontend: live log panel in IntentDetail view

---

## Feature 4: Deliberation Gate UI (full)
**Impact: 8 | Effort: 1d | Phase: 2 | Week: W7**

### Overview
Intercept structural tasks in the HQ create-task form with a modal prompt: "This looks structural. Generate a proposal first?"

### Problem It Solves
Structural tasks (migrate, delete, rename, globally replace) skip proposal review and go straight to dispatch. Causes rework when agents misunderstand scope.

### Key Features
- StructuralDetector keyword match on task creation
- Modal: "Structural task detected. Generate proposal before dispatching?"
- Auto-generate proposal if approved
- Skip option (with warning banner) for intentional bypasses
- Audit log of all bypasses

### Dependencies
- None (can ship Week 7)

### Architecture
- Backend: `Ema.Tasks.StructuralDetector` module (keyword list)
- Frontend: Modal component in TaskCreate form
- No new schemas

---

## Feature 5: Proposal Comparison Viewer
**Impact: 8 | Effort: 2d | Phase: 3 | Week: W9**

### Overview
Interactive UI to browse all proposals for a task side-by-side, see historical success rates, and choose which to dispatch.

### Problem It Solves
Proposals are JSON files in folders. Invisible. Users dispatch without seeing alternatives. No way to learn which proposal types work.

### Key Features
- Side-by-side view of 3-5 proposals for a task
- Effort estimates, risk flags, dependency maps per proposal
- Historical success rate (if similar tasks have run)
- One-click "Use this" → dispatches agent with chosen proposal
- Post-execution: "Proposal X was used, quality score 8.7"

### Dependencies
- Phase 2 ships (real proposals exist from Dispatch Board build)
- outcome-tracker.json with quality scores

### Architecture
- New: `ProposalController` + `ProposalViewLive`
- New: `proposals` field on Intent schema
- API: `GET /intents/{project}/{intent}/proposals`

---

## Feature 6: Agent Workbench (Prompt Tuning)
**Impact: 8 | Effort: 3d | Phase: 3 | Week: W9**

### Overview
In-app editor for agent SOUL.md + real-time test runner. A/B compare personalities on same task.

### Problem It Solves
SOUL.md editing is blind. Change prompt → wait 3 days → see if agent improved. No fast feedback loop for agent quality.

### Key Features
- SOUL.md editor in-app with syntax highlighting
- Test runner: paste sample task → see agent response live
- A/B mode: run task against two personalities → compare output
- Performance impact: "Version A: 8.1 avg quality. Version B: 8.7. Use B?"
- Rollback: revert to previous SOUL.md version

### Dependencies
- outcome-tracker.json with quality scores (W7+)

### Architecture
- New: `AgentWorkbenchLive` LiveView
- New: `AgentVersion` schema (SOUL.md versions + quality scores)
- API: `POST /agents/{id}/test`

---

## Feature 7: Honcho Memory + Reflexion Injection
**Impact: 9 | Effort: 3d | Phase: 2 | Week: W7 (blocked: Docker setup)**

### Overview
Self-hosted memory server that actively reasons over past interactions, injecting pre-dispatch context and scope warnings into every agent spawn.

### Problem It Solves
Agents spawn with no memory of past tasks. Same mistakes get made repeatedly. Scope violations aren't caught. 62.6% → 90.4% recall improvement.

### Key Features
- Pre-dispatch: `Honcho.query_user("preferences for #{task_type}?")` → injected into prompt
- Scope advisor: `Honcho.query_user("scope limits for Vault Keeper?")` → warning banner
- Proposal gate: Honcho quality criteria in evaluator loop
- Preference learning: every outcome improves future queries

### Dependencies
- Docker running (`docker pull gethoncho/honcho`)
- Req HTTP client in bridge.ex

### Architecture
- New: `Ema.Honcho.Client` module
- New: `HonchoController` for admin
- Modify: `AgentBridge.spawn_agent/2` to pre-query Honcho

---

## Feature 8: Execution Diff & Audit Trail
**Impact: 7 | Effort: 2d | Phase: 3 | Week: W10**

### Overview
See exact git diff of code changes made by agent execution. Full audit trail: who initiated, when, with what params.

### Problem It Solves
Agent finishes → "files changed: 12". Which files? What exactly changed? Can't review without SSH + git log.

### Key Features
- Execution detail page: diff viewer (unified or side-by-side)
- File-tree view of changed files
- Audit: initiated by, timestamp, params, model, tokens
- Clickable file → opens diff for that file
- GitHub-style "Files changed" tab on every execution

### Dependencies
- Git worktrees per execution (from Architect plan)
- Execution result paths established (W7+)

### Architecture
- New: `ExecutionDiffController`
- New API: `GET /executions/{id}/diff`
- Frontend: DiffViewer component (monaco-editor or custom)

---

## Feature 9: Campaign Manager (Persistent Agent Clusters)
**Impact: 7 | Effort: 5d | Phase: 3 | Week: W10**

### Overview
Group multiple intents into campaigns. Define which agents run in parallel, which depend on others. Visual topology editor.

### Problem It Solves
Right now intents are independent. No way to say "Research first → then Build → then Review." No coordinated multi-agent workflows.

### Key Features
- Campaign schema (Flow topology with steps + edges)
- `@start()` / `@after()` step declarations
- Campaign run_id (template vs instance)
- Visual campaign editor in HQ
- Run campaign → all agents spawn according to topology
- Campaign history: all run instances with outcomes

### Dependencies
- Dispatch Board ships (visual context)
- Phase 2.5 outcomes exist (data for smarter campaigns)

### Architecture
- New: `Ema.Campaigns.Flow` schema
- New: `CampaignLive` LiveView with topology editor
- Modify: `Dispatcher` to understand campaign topology

---

## Feature 10: Knowledge Graph Browser
**Impact: 7 | Effort: 5d | Phase: 4 | Week: W11**

### Overview
Visual navigator for vault + decisions + architecture docs. Click any concept, see what connects to it.

### Problem It Solves
Vault is 100+ documents. Finding relationships is `qmd search` + grep. Hard to understand system complexity visually. Hard to onboard agents to new domains.

### Key Features
- Interactive graph (nodes = concepts, files, decisions, projects)
- Edges = references, depends-on, implements, caused-by
- Search: "show all systems depending on dispatch"
- Time filter: "what was decided in March?"
- Gap detection: "docs referencing X but not Y"

### Dependencies
- Vault has critical mass (W8+)
- Superman indices (for codebase graph)

### Architecture
- New: `Ema.VaultGraph` context
- New: `KnowledgeGraphLive` with D3/Cytoscape
- Ingest: backlink parser runs on vault write

---

## Quick Wins (High Impact, Low Effort)
1. **Outcome Dashboard** — 2d, immediate value, Phase 2 data exists
2. **Execution Live Stream** — 2d, eliminates visibility blackhole
3. **Deliberation Gate UI** — 1d, prevents rework today
4. **Execution Diff** — 2d, makes every build reviewable

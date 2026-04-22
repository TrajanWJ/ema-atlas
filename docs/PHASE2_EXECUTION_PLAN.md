# PHASE2_EXECUTION_PLAN.md
# EMA Phase 2 — Self-Build Protocol

> **Version:** 1.0  
> **Author:** Architect Agent (subagent)  
> **Date:** 2026-04-03  
> **Status:** Draft — ready for Coder agent consumption  
> **Purpose:** Complete protocol for EMA to dispatch itself to build Phase 2 features using its own task dispatch system.

---

## EXECUTIVE SUMMARY

EMA Phase 2 consists of 4 features: Dispatch Board, Deliberation Gate, Honcho Integration, and Scope Advisor. This document specifies the exact protocol for EMA to manage its own construction — creating intents, dispatching Coder agents, handling results, and tracking outcomes for the learning loop.

The core contract: **EMA treats itself as just another project.** The same proposal→intent→dispatch→outcome flow used for any user task applies here. No special-casing. This validates the system end-to-end.

---

## PART A: PROJECT SETUP

### A.1 Project Identity

```
Project slug:    ema-phase2-build
Project name:    EMA Phase 2 Build
Status:          active
Linked path:     ~/Projects/ema
Color:           #3B82F6 (blue — distinguishes from user projects)
Icon:            🏗️
```

### A.2 Project Creation Steps

**Via CLI (for Coder agent to run):**
```bash
# Create the project record in EMA's own DB
curl -X POST http://localhost:4488/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "id": "pro_emap2001",
    "slug": "ema-phase2-build",
    "name": "EMA Phase 2 Build",
    "description": "EMA building itself. 4 features: Dispatch Board, Deliberation Gate, Honcho Integration, Scope Advisor.",
    "status": "active",
    "linked_path": "~/Projects/ema",
    "icon": "🏗️",
    "color": "#3B82F6"
  }'
```

**Filesystem layout to create:**
```
~/Projects/ema/projects/ema-phase2-build/
  ├── project.json                  ← Project metadata (mirrors DB record)
  ├── intents/
  │   ├── dispatch-board/
  │   │   ├── intent.md             ← Immutable definition
  │   │   ├── execution-log.md      ← Append-only log
  │   │   ├── proposals/            ← Pre-generated proposals
  │   │   └── results/              ← Agent output lands here
  │   ├── deliberation-gate/
  │   ├── honcho-integration/
  │   └── scope-advisor/
  └── outcomes/
      └── outcome-tracker.json      ← Phase 2 specific outcomes
```

### A.3 Intent Hierarchy

**One root intent per feature (4 total). No deeper hierarchy in Phase 2.**

Rationale: Each feature is independently deliverable. Sub-intents add coordination overhead without benefit at this scale. If a feature needs staged work, the Coder agent manages internal stages — EMA's dispatch layer stays flat.

```
ema-phase2-build (project)
├── dispatch-board          (root intent, level=2 "action")
├── deliberation-gate       (root intent, level=2 "action")
├── honcho-integration      (root intent, level=2 "action")
└── scope-advisor           (root intent, level=2 "action")
```

### A.4 Intent Naming Convention

Format: `{feature-kebab-case}`

- `dispatch-board`
- `deliberation-gate`
- `honcho-integration`
- `scope-advisor`

File paths follow: `projects/ema-phase2-build/intents/{intent-slug}/`

Execution records use: `project_slug="ema-phase2-build"` + `intent_slug="{intent-slug}"`

---

## PART B: INTENT DESIGN

### B.1 Intent Template Structure

Every intent MUST contain:

```markdown
# Intent: {Feature Name}

## Description
[What this feature does, why it matters, user-facing impact]

## Acceptance Criteria
- [ ] [Specific, testable, binary]
- [ ] [Each criterion maps to a test or observable behavior]

## Deliverables
- [Specific files, modules, or API endpoints to create]
- [Tests to write]
- [Docs to update]

## Scope
- IN SCOPE: [explicit list]
- OUT OF SCOPE: [explicit list — prevents scope creep]

## Technical Context
[Links to relevant source files, existing modules to extend]

## Proposals
[Which proposal is selected, or "generate on dispatch"]

## Superman Index
[Codebase index files to preload into agent context]
```

---

### B.2 Feature 1: Dispatch Board

**File:** `projects/ema-phase2-build/intents/dispatch-board/intent.md`

```markdown
# Intent: Dispatch Board

## Description
Real-time visual graph of live agent executions. Shows which agents are running, what they're working on, topology of execution (parent→child→sibling), and execution health. Built on Campaign.Flow topology structs rendered via Phoenix LiveView + React.

This is the "control room" view — Trajan sees what's happening at a glance without polling logs.

## Acceptance Criteria
- [ ] Dispatch Board renders in HQ frontend at /dispatch-board route
- [ ] Shows each active execution as a node (project, intent, mode, status)
- [ ] Edges connect related executions (parent-child, sequential dependencies)
- [ ] Node colors encode status: blue=running, green=completed, red=failed, grey=idle
- [ ] Click on node → execution detail drawer (logs, tokens, duration)
- [ ] WebSocket-driven: updates in <2s of execution status change
- [ ] Empty state renders cleanly (no agents running)
- [ ] Works without Campaign.Flow (degrades to flat list if topology unavailable)

## Deliverables
- `daemon/lib/ema/campaign/flow.ex` — Campaign.Flow struct (topology source of truth)
- `daemon/lib/ema_web/channels/dispatch_board_channel.ex` — WS channel for board
- `daemon/lib/ema_web/live/dispatch_board_live.ex` — LiveView backing (optional, if not pure React)
- `app/src/features/DispatchBoard/` — React component tree
  - `DispatchBoard.tsx` — Main container
  - `ExecutionNode.tsx` — Individual node
  - `ExecutionEdge.tsx` — Connection line
  - `ExecutionDetail.tsx` — Click-to-expand drawer
- `app/src/stores/dispatchBoardStore.ts` — Zustand store for board state
- Tests: `daemon/test/ema/campaign/flow_test.exs`, `daemon/test/ema_web/channels/dispatch_board_channel_test.exs`
- `docs/DISPATCH_BOARD.md` — Usage + WS protocol documentation

## Scope
IN SCOPE:
- Live execution graph (nodes + edges)
- Real-time WS updates
- Click-to-detail
- Status color encoding
- Empty state

OUT OF SCOPE:
- Historical playback (Phase 3)
- Execution control (kill, pause) from board (Phase 3)
- 3D graph rendering
- Export/screenshot

## Technical Context
- Executions table: `daemon/lib/ema/` (see DATA_MODELS.md for schema)
- Existing WS infrastructure: `app/src/ws.ts`, Phoenix.Socket
- Existing Zustand pattern: any of the 15 stores in `app/src/stores/`
- SmartRouter + Bridge spawn agents → generate execution records → this board reads them
- Key PubSub topic to subscribe: `executions:all`

## Proposals
Pre-generate 3 proposals before dispatch (see Section C for proposal structure).
Select best via Scorer. Inject winning proposal into Coder context.

## Superman Index
Preload: `daemon/.superman/modules.json`, `daemon/.superman/call_graph.json`
Key files to index: `daemon/lib/ema/claude/bridge.ex`, `daemon/lib/ema_web/channels/`
```

---

### B.3 Feature 2: Deliberation Gate

**File:** `projects/ema-phase2-build/intents/deliberation-gate/intent.md`

```markdown
# Intent: Deliberation Gate

## Description
Structural task gate that intercepts task creation for high-risk operations and requires a proposal before dispatch. Prevents rework by forcing thinking before action on: restructures, migrations, deletions, global renames, vault redesigns, infrastructure changes.

Two components:
1. `StructuralDetector` — Elixir GenServer that classifies task descriptions for structural risk
2. UI prompt — React modal that surfaces when structural task detected: "This looks structural. Generate a proposal first?"

## Acceptance Criteria
- [ ] StructuralDetector correctly classifies structural vs non-structural tasks (>90% precision on test set)
- [ ] Structural keywords include: restructure, migrate, delete, rename, globally replace, redesign, refactor, archive, remove, overhaul
- [ ] Deliberation Gate modal appears when structural task created in HQ
- [ ] Modal options: "Generate Proposal" → triggers proposal pipeline | "Proceed Anyway" → logs override | "Cancel"
- [ ] "Don't ask again" checkbox stores preference per user session
- [ ] Override decisions logged to audit trail (who bypassed, when, what task)
- [ ] Non-structural tasks pass through with zero latency
- [ ] Gate can be fully disabled via config flag (escape hatch for power users)

## Deliverables
- `daemon/lib/ema/tasks/structural_detector.ex` — Classification GenServer
- `daemon/lib/ema/tasks/structural_detector_test.exs` — Test suite with 20+ classification cases
- REST endpoint: `POST /api/tasks/classify` → `{structural: bool, confidence: float, keywords: [...]}`
- `app/src/features/DeliberationGate/` — React component
  - `DeliberationGate.tsx` — Modal component
  - `useDeliberationGate.ts` — Hook that intercepts task creation
- Settings: `daemon/lib/ema/settings.ex` → `deliberation_gate_enabled: true`
- Tests: unit + integration

## Scope
IN SCOPE:
- Task creation flow interception
- Keyword-based classification (no ML in Phase 2)
- Modal UI
- Audit logging of overrides
- Config flag to disable

OUT OF SCOPE:
- ML-based classification (Phase 3)
- Classification of existing tasks (backfill)
- Blocking task *editing* (only creation)
- Proposal auto-generation on gate trigger (manual trigger only)

## Technical Context
- Task creation: `daemon/lib/ema/tasks/` + `POST /api/tasks`
- Proposal pipeline entry: `Ema.ProposalEngine.Scheduler.dispatch_seed/1`
- Settings pattern: see existing settings in `daemon/lib/ema/`
- Audit: can reuse or extend `audit_logs` table (already in migration order #21)

## Proposals
Pre-generate 2 proposals. This feature is simpler — keyword matching is well-understood.
Focus proposals on: architecture of StructuralDetector (GenServer vs pure function), classification threshold tuning approach.
```

---

### B.4 Feature 3: Honcho Integration

**File:** `projects/ema-phase2-build/intents/honcho-integration/intent.md`

```markdown
# Intent: Honcho Integration

## Description
Integrate Honcho (self-hosted memory server) for pre-dispatch context injection. Honcho provides a 27.8% recall improvement (62.6% → 90.4%) by maintaining user preferences and historical context that agents can query before starting work.

3 use cases:
1. **Pre-dispatch injection**: Before spawning Coder, query Honcho for user preferences relevant to task type → inject into agent prompt
2. **Scope advisor** (shared with F4): Query scope limits relevant to task
3. **Proposal quality gate**: Query "what makes a good proposal" → evaluator criteria

**BLOCKER:** Honcho Docker must be running before this intent can complete. See setup instructions in Deliverables.

## Acceptance Criteria
- [ ] Honcho Docker container running on localhost:7778
- [ ] `Ema.Honcho.Client` module makes HTTP calls to Honcho API
- [ ] Pre-dispatch injection: Coder agent prompts include Honcho-derived user context
- [ ] Context injection adds <500ms to dispatch latency (Honcho responses cached 5min)
- [ ] Honcho unavailable → graceful fallback (dispatch proceeds without context, no crash)
- [ ] Honcho client errors logged but not propagated
- [ ] 3-field context injected: user_preferences, scope_limits, quality_criteria
- [ ] Integration test: mock Honcho server + verify context appears in agent prompt

## Deliverables
**Infrastructure:**
- `daemon/docker-compose.yml` (or `scripts/start-honcho.sh`) — Honcho Docker setup
- Documentation: which Honcho API endpoints used, what queries are made

**Elixir:**
- `daemon/lib/ema/honcho/client.ex` — HTTP client via `Req` library
  - `query_preferences(task_type)` → string context
  - `query_scope_limits(project_slug)` → map of limits
  - `query_quality_criteria(domain)` → string criteria
  - `health_check()` → {:ok, :healthy} | {:error, reason}
- `daemon/lib/ema/honcho/cache.ex` — ETS-backed 5min TTL cache
- `daemon/lib/ema/honcho/supervisor.ex` — Supervises client + cache
- Integration point in `daemon/lib/ema/claude/bridge.ex`: inject Honcho context before spawning Claude

**Tests:**
- `daemon/test/ema/honcho/client_test.exs` — with Bypass mock server
- `daemon/test/ema/honcho/cache_test.exs`

## Scope
IN SCOPE:
- Honcho Docker setup (one-liner)
- 3 query types (preferences, scope, quality)
- ETS cache
- Context injection into agent prompts
- Graceful degradation when Honcho offline

OUT OF SCOPE:
- Writing TO Honcho (read-only integration in Phase 2)
- Honcho "dreaming" process configuration
- Custom Honcho schema/app setup
- Training Honcho on EMA-specific data (Phase 3)

## Technical Context
- Honcho OSS: Apache 2.0, self-hosted
- API: HTTP REST, localhost:7778 (or configured port)
- Req library: already in EMA's mix.exs dependencies? Verify. If not, add.
- Bridge.ex: `daemon/lib/ema/claude/bridge.ex` — modify `build_prompt/2` or equivalent
- Circuit breaker pattern: see `daemon/lib/ema/claude/circuit_breaker.ex` for reference

## BLOCKER RESOLUTION
If Honcho Docker setup takes >4h, proceed as follows:
1. Stub `Ema.Honcho.Client` with hardcoded returns
2. Cache module still works (caches the stubs)
3. Full integration deferred to Week 8
4. Scope Advisor (F4) uses hardcoded thresholds instead of Honcho queries
```

---

### B.5 Feature 4: Scope Advisor

**File:** `projects/ema-phase2-build/intents/scope-advisor/intent.md`

```markdown
# Intent: Scope Advisor

## Description
Warning system that surfaces scope limit violations before task dispatch. When a user creates a task, Scope Advisor checks: is this task's scope within normal bounds? If not, show a warning banner: "This task may exceed typical scope. Consider breaking it down."

Primary signal source: Honcho queries for known scope limits. Secondary: hardcoded heuristics (effort="xl", multiple systems mentioned, >3 deliverables in description).

## Acceptance Criteria
- [ ] Scope Advisor runs on task creation (not blocking — warning only)
- [ ] Warning shown in HQ task creation form when scope exceeded
- [ ] Warning disappears on dismiss (not shown again for same task)
- [ ] Heuristics catch: effort=xl, >500 word description, 3+ system names in description
- [ ] Honcho-backed limits (when Honcho available): configurable per project
- [ ] Scope advisor adds <100ms to task creation UX (async check)
- [ ] Advisor can be disabled per task ("I know what I'm doing" toggle)

## Deliverables
- `daemon/lib/ema/tasks/scope_advisor.ex` — Scope analysis module
  - `analyze(task_params, project_slug)` → `{:warning, reasons}` | `{:ok}`
  - `heuristic_check(task_params)` → list of triggered heuristics
  - `honcho_check(task_params, project_slug)` → list of Honcho-derived warnings
- REST endpoint: `POST /api/tasks/scope-check` → `{warnings: [...], severity: "info|warn|block"}`
- `app/src/features/ScopeAdvisor/` — React component
  - `ScopeWarningBanner.tsx` — Warning display
  - `useScopeAdvisor.ts` — Hook that calls scope-check endpoint
- Tests: scope_advisor_test.exs with fixture tasks

## Scope
IN SCOPE:
- Task creation scope check
- Heuristic rules (effort, description length, system count)
- Honcho-backed limits (graceful fallback if Honcho unavailable)
- Warning banner in UI
- Per-task dismiss

OUT OF SCOPE:
- Blocking task creation (warning only, never block)
- Scope tracking over time (Phase 3)
- Automatic task splitting (Phase 3)
- Scope checking on existing tasks

## Technical Context
- Depends on: Honcho Client (`ema-honcho-integration` intent)
- If Honcho unavailable: heuristic-only mode is valid fallback
- Task schema: `daemon/lib/ema/tasks/` — effort field, description, metadata
- No new DB tables needed — scope warnings are ephemeral

## Dependency
This intent DEPENDS ON `honcho-integration` for full capability.
Can be dispatched in parallel — hardcoded thresholds used until Honcho is live.
```

---

## PART C: DISPATCH FLOW

### C.1 Step-by-Step Dispatch Protocol

```
STEP 1: User/orchestrator creates intent
  ↓
  Action: Write intent.md to filesystem
  Action: Create intent_node record in EMA DB (level=2, project_id="pro_emap2001")
  Action: Set status="planned"

STEP 2: Proposal generation (pre-dispatch)
  ↓
  Trigger: Scheduler.dispatch_seed/1 with intent context
  Engine: Generator → Refiner → Debater → Scorer
  Output: 3-5 proposals in projects/ema-phase2-build/intents/{slug}/proposals/
  Wait: Until Scorer publishes :scored event
  Select: Winning proposal (highest idea_score)
  Store: proposals/ folder, proposals table in DB

STEP 3: Router classifies intent
  ↓
  SmartRouter.classify(intent_slug, intent_body)
  Classification: domain="feature-build", complexity="medium" (3 of 4) or "high" (Dispatch Board)
  Agent selection: "coder" (all 4 features)
  Model selection: "claude-opus-4-6" for Dispatch Board (complexity=high), "claude-sonnet-4-6" for others

STEP 4: Context assembly
  ↓
  Bundle includes:
    - intent.md (full)
    - winning proposal (full JSON)
    - CLAUDE.md for ~/Projects/ema
    - ARCHITECTURE.md
    - DATA_MODELS.md
    - API_CONTRACTS.md
    - Superman index files (modules.json, call_graph.json for relevant subtree)
    - Honcho context (if available): user preferences for coding tasks
    - Recent execution outcomes for similar tasks (from outcome-tracker.json)
  Stored as: intents/{slug}/.context_bundle.json

STEP 5: Execution record created
  ↓
  INSERT into executions:
    project_slug="ema-phase2-build"
    intent_slug="{slug}"
    mode="implement"
    status="created"
    model="{selected model}"
    result_path="projects/ema-phase2-build/intents/{slug}/results/"

STEP 6: Agent spawned
  ↓
  Git worktree created: ~/Projects/ema/.worktrees/p2-{slug}-{timestamp}
  Claude Code spawned: claude --permission-mode bypassPermissions --print "{prompt}"
  Prompt built from: AGENT PROMPT TEMPLATE (see C.2)
  Session recorded in ai_sessions table

STEP 7: Agent executes
  ↓
  Agent reads: intent.md, proposal, architecture docs
  Agent works in: git worktree (never touches main)
  Agent writes: code files, tests, docs
  Agent commits: git commit on worktree branch
  Agent writes results: intents/{slug}/results/results.json

STEP 8: Agent signals completion
  ↓
  HTTP POST to: http://localhost:4488/api/executions/{execution_id}/complete
  Body: results.json contents (see D.1)

STEP 9: EMA processes outcome
  ↓
  Execution record: status → "completed" or "failed"
  Result files: stored durably in intents/{slug}/results/
  PR creation: github pr create from worktree branch (if configured)
  outcome-tracker.json: entry appended
  workflow-patterns.json: pattern updated
  Intent status: updated to "complete" (if all ACs met) or "partial"

STEP 10: Learning loop
  ↓
  Analyze: token usage, time taken, quality score, which proposal worked
  Update: agent-performance.md fitness scores
  Flag: crystallization candidates if pattern hit 5+ successes
  Next sprint: outcomes inform which agent/model/proposal type to prefer
```

### C.2 Agent Prompt Template

```
You are a Coder agent building a feature for the EMA task dispatch system.

## YOUR MISSION
Build: {feature_name}
Intent: {intent_slug}
Project: ~/Projects/ema

## INTENT SPECIFICATION
{full content of intent.md}

## WINNING PROPOSAL
{full content of winning proposal JSON, pretty-printed}

## TECHNICAL CONTEXT
Working directory: ~/Projects/ema
Git worktree: ~/Projects/ema/.worktrees/{branch_name}
All code changes go in the worktree. Never push to main.

## WHAT TO DO
1. Read the intent specification carefully
2. Read the relevant source files (listed in intent.md Technical Context)
3. Implement ALL deliverables listed in the intent
4. Write tests for everything you build
5. Commit your work with descriptive commit messages
6. When done, write results to: projects/ema-phase2-build/intents/{intent_slug}/results/results.json
7. POST results to: http://localhost:4488/api/executions/{execution_id}/complete

## RESULTS FORMAT
{see D.1 for full results.json schema}

## IMPORTANT CONSTRAINTS
- Work ONLY in the git worktree, not main
- Do not break existing tests
- Run `mix test` before considering done
- Do not modify the Executions table schema (non-breaking additions only)
- If you encounter a blocker, write it to results.json blocked_by field and exit gracefully

## YOUR STATUS
Report status as one of:
- DONE: All ACs met, tests pass
- DONE_WITH_CONCERNS: Completed with caveats (describe in results.json)
- BLOCKED: Cannot complete (reason in results.json)
- NEEDS_CONTEXT: Missing information (specify what)

It is ALWAYS OK to say you're blocked. Bad code is worse than no code.
```

### C.3 Router Classification Logic

For Phase 2 intents, the Router makes these decisions:

| Intent | Domain | Complexity | Agent | Model |
|--------|--------|------------|-------|-------|
| dispatch-board | feature-build | high | coder | claude-opus-4-6 |
| deliberation-gate | feature-build | medium | coder | claude-sonnet-4-6 |
| honcho-integration | integration | medium | coder | claude-sonnet-4-6 |
| scope-advisor | feature-build | low | coder | claude-sonnet-4-6 |

**Dispatch order:** deliberation-gate and honcho-integration first (unblocked). dispatch-board second (independent, high value). scope-advisor last (depends on honcho).

**Parallelism:** dispatch-board + deliberation-gate can run in parallel. honcho-integration must complete before scope-advisor gets Honcho-backed checks (scope-advisor runs in parallel using hardcoded fallback).

### C.4 Proposal Pre-Generation Protocol

Before dispatching any intent, generate proposals:

```bash
# Via EMA CLI
ema proposal create \
  --project-id="pro_emap2001" \
  --seed-source="intent:{intent_slug}" \
  --title="Approach for {feature_name}"

# Wait for pipeline: draft→refined→debated→scored→queued
# Auto-select highest idea_score proposal
```

Proposals stored at: `projects/ema-phase2-build/intents/{slug}/proposals/`

Format: `v{N}_{timestamp}_{idea_score}.json`

---

## PART D: RESULT HANDLING

### D.1 results.json Schema

```json
{
  "execution_id": "exe_a1b2c3d4",
  "intent_slug": "dispatch-board",
  "project_slug": "ema-phase2-build",
  "status": "completed",
  "agent_id": "coder",
  "model": "claude-opus-4-6",

  "summary": "Built Dispatch Board with Campaign.Flow topology and React real-time graph",

  "files_created": [
    "daemon/lib/ema/campaign/flow.ex",
    "app/src/features/DispatchBoard/DispatchBoard.tsx",
    "app/src/features/DispatchBoard/ExecutionNode.tsx",
    "app/src/stores/dispatchBoardStore.ts"
  ],
  "files_modified": [
    "daemon/lib/ema_web/channels/",
    "daemon/lib/ema/application.ex"
  ],
  "files_deleted": [],

  "tests_written": 12,
  "tests_passing": 12,
  "tests_failing": 0,
  "test_command_run": "mix test daemon/test/ema/campaign/",
  "test_output_path": "projects/ema-phase2-build/intents/dispatch-board/results/test_output.txt",

  "commits": [
    {
      "hash": "a1b2c3d4",
      "message": "feat: Add Campaign.Flow topology struct",
      "branch": "p2-dispatch-board-20260403",
      "files_changed": 3
    }
  ],

  "proposal_used": "prp_8a9b2c3d",
  "proposal_followed": true,
  "proposal_deviations": [],

  "quality_score": 8,
  "quality_notes": "All ACs met. Tests pass. WS latency measured at 1.2s.",

  "acceptance_criteria": {
    "dispatch-board-renders": true,
    "shows-active-executions": true,
    "edges-connect-related": true,
    "node-color-encoding": true,
    "click-detail-drawer": true,
    "websocket-driven": true,
    "empty-state": true,
    "degrades-without-flow": true
  },

  "blocked_by": null,
  "concerns": [],

  "token_summary": {
    "input": 18520,
    "output": 6840,
    "cost_usd": 0.79
  },

  "time_minutes": 23,
  "started_at": "2026-04-07T09:00:00Z",
  "completed_at": "2026-04-07T09:23:00Z"
}
```

### D.2 Result Storage

```
projects/ema-phase2-build/intents/{slug}/results/
  ├── results.json          ← Canonical outcome record (D.1 schema)
  ├── test_output.txt       ← Full mix test output
  ├── execution-log.txt     ← Agent stdout (for debugging)
  └── git_diff.patch        ← Full diff from worktree (for review)
```

Results are **immutable after write**. New executions of the same intent create new result sets with timestamp suffixes.

### D.3 Agent→EMA Communication

**Primary:** HTTP POST to EMA daemon:
```
POST http://localhost:4488/api/executions/{execution_id}/complete
Content-Type: application/json
Body: {results.json contents}
```

**Fallback (if daemon unreachable):** Write results.json to disk. EMA daemon polls `results/` directories every 60s and picks up any unprocessed results.json files.

**Failure signal:** If agent exits without POSTing results, execution record times out after `timeout_minutes` (configurable per intent complexity). Timeout triggers failure protocol (see G).

### D.4 New API Endpoints Required

These endpoints don't exist yet. Add them as part of EMA self-build:

```
POST /api/executions/{id}/complete
  → Accepts results.json, updates execution record, fires outcome flow

GET  /api/executions?project_slug=X&intent_slug=Y&status=Z
  → Filter executions by project/intent/status

GET  /api/intents/{project_slug}/{intent_slug}/status
  → Returns: {intent, latest_execution, acceptance_criteria_met, status}

POST /api/intents/{project_slug}/{intent_slug}/dispatch
  → Triggers proposal generation + agent dispatch for a given intent
```

---

## PART E: OUTCOME FLOW

### E.1 Execution Completion Sequence

```
Agent POSTs to /api/executions/{id}/complete
    ↓
Ema.Executions.complete(execution_id, results_json)
    ↓
1. Update execution record:
   status = "completed" (or "failed")
   completed_at = now()
   result_path = "projects/ema-phase2-build/intents/{slug}/results/"
    ↓
2. Write outcome to outcome-tracker.json
   (by: Ema.Outcomes.Tracker.record/1)
    ↓
3. Update intent_node status:
   all ACs met → "complete"
   partial → "partial"
    ↓
4. Broadcast PubSub: "executions:all" with updated execution
   (triggers Dispatch Board update in real-time)
    ↓
5. Fire learning loop analysis
   (Ema.Outcomes.LearningLoop.analyze/1)
    ↓
6. Update agent-performance.md fitness scores
    ↓
7. Check workflow-patterns.json for crystallization candidates
```

### E.2 outcome-tracker.json Entry Format

Appended to: `memory/outcome-tracker.json` (main workspace) AND `projects/ema-phase2-build/outcomes/outcome-tracker.json` (project-specific)

```json
{
  "task_id": "exe_a1b2c3d4",
  "intent": "dispatch-board",
  "project": "ema-phase2-build",
  "proposal_used": "prp_8a9b2c3d",
  "agent": "coder",
  "domain": "feature-build",
  "status": "success",
  "tokens_used": 25360,
  "time_minutes": 23,
  "quality_score": 8,
  "acceptance_criteria_met": 8,
  "acceptance_criteria_total": 8,
  "learned": [
    "Campaign.Flow topology struct is the right abstraction — don't skip it",
    "WebSocket dispatch board updates work at 1.2s latency",
    "phoenix-channels pattern straightforward for real-time board"
  ],
  "model": "claude-opus-4-6",
  "worktree_branch": "p2-dispatch-board-20260403",
  "timestamp": "2026-04-07T09:23:00Z"
}
```

### E.3 Learning Loop Behavior

Triggered after every execution completion. Runs as `Ema.Outcomes.LearningLoop`:

```elixir
def analyze(execution_id) do
  # 1. Read outcome from tracker
  outcome = OutcomeTracker.get(execution_id)

  # 2. Update agent fitness score
  AgentPerformance.record(outcome.agent, outcome.domain, outcome.status, outcome)

  # 3. Update proposal success rate for proposal type used
  ProposalEngine.Scorer.record_outcome(outcome.proposal_used, outcome.status, outcome.quality_score)

  # 4. Update workflow patterns
  pattern = "intent→proposal→dispatch→implement→outcome"
  WorkflowPatterns.record(pattern, outcome.status == :success)

  # 5. Check crystallization candidates
  WorkflowPatterns.check_crystallization_candidates()
    |> Enum.each(&EvolutionSignals.flag/1)

  :ok
end
```

### E.4 workflow-patterns.json Update

After each execution, update or create pattern entry:

```json
{
  "pattern": "intent-based-self-dispatch",
  "description": "EMA dispatches Coder to build EMA features via intent system",
  "success_count": 3,
  "failure_count": 0,
  "success_rate": 1.0,
  "avg_time_min": 21.3,
  "avg_tokens": 22400,
  "avg_quality_score": 8.1,
  "crystallization_candidate": false,
  "last_updated": "2026-04-07T10:00:00Z"
}
```

---

## PART F: SCHEMA UPDATES

### F.1 Executions Table — Non-Breaking Additions

The current Executions schema (from MASTER-SYSTEM-OVERVIEW.md) already covers most needs. Add these fields via additive migration:

```elixir
# Migration: add_phase2_fields_to_executions
alter table(:executions) do
  add :proposals_used,    {:array, :string}, default: []   # proposal IDs used for this execution
  add :proposal_selected, :string                          # winning proposal ID
  add :worktree_path,     :string                          # git worktree for this execution
  add :worktree_branch,   :string                          # branch name
  add :quality_score,     :integer                         # 1-10, set from results.json
  add :acceptance_criteria_met,   :integer                 # count of ACs passing
  add :acceptance_criteria_total, :integer                 # total ACs defined
  add :files_created,     {:array, :string}, default: []   # from results.json
  add :files_modified,    {:array, :string}, default: []   # from results.json
  add :commits_made,      :integer, default: 0             # commit count in worktree
  add :tests_passing,     :integer                         # test pass count
  add :tests_total,       :integer                         # total tests run
end
```

**All fields nullable** — backward compatible. Existing execution records unaffected.

### F.2 New Tables (If Needed)

No new tables required for Phase 2 bootstrap. Use:
- `control_plane_intents` for **Day 1 runtime intent records**
- `intent_nodes` only as the older intent-map / semantic hierarchy model until explicitly unified
- `proposals` (existing) for proposal storage
- `executions` (existing + above additions) for execution tracking
- `ai_sessions` (existing) for session tracking
- `usage_records` (existing) for cost tracking
- JSON files for outcome-tracker.json and workflow-patterns.json (file-based, not DB — consistent with current pattern)

### F.3 New API Endpoints (Full Spec)

```
POST /api/executions/:id/complete
  Request: results.json schema (D.1)
  Response: { execution: {...updated}, intent_status: "complete|partial" }
  Side effects: outcome-tracker entry, workflow-patterns update, PubSub broadcast

GET /api/executions
  Query: project_slug, intent_slug, status, mode, limit, offset
  Response: { executions: [...], total: N }

GET /api/intents/:project_slug/:intent_slug/status
  Response: {
    intent: {...intent_node},
    latest_execution: {...execution},
    all_executions: [...],
    acceptance_criteria: { met: N, total: M, details: {...} },
    status: "planned|in_progress|complete|partial|blocked"
  }

POST /api/intents/:project_slug/:intent_slug/dispatch
  Request: { mode: "implement", model: "claude-sonnet-4-6", force_reproposal: false }
  Response: { execution_id: "...", dispatch_started: true }
  Side effects: creates execution record, spawns agent
```

---

## PART G: ROLLBACK / FAILURE PROTOCOL

### G.1 Agent Fails Mid-Execution

```
Detection: agent exits non-zero OR no POST to /complete within timeout
    ↓
EMA action:
  1. Mark execution: status="failed", error="agent_exit"
  2. Preserve worktree (don't delete — for debugging)
  3. Write to outcome-tracker.json: status="failed"
  4. Increment agent fitness failure count
  5. Log to execution-log.md: "FAILED at {timestamp}: {error}"
    ↓
Recovery options (in priority order):
  A. Auto-retry: if failure count for this intent < 2 → re-dispatch same agent
  B. Model upgrade: if claude-sonnet failed → retry with claude-opus-4-6
  C. Human review: if 2 failures → surface in HQ with error detail + worktree path
  D. Manual: Trajan inspects worktree, fixes, commits manually
```

### G.2 Execution Timeout

Timeout values by complexity:
| Complexity | Timeout |
|------------|---------|
| low | 30 min |
| medium | 60 min |
| high | 120 min |

```
Timeout fires:
    ↓
1. Send SIGTERM to Claude Code process (bridge.ex sends kill signal)
2. Check worktree: any partial work? → preserve it
3. Mark execution: status="failed", error="timeout"
4. Write results.json stub: { status: "timeout", files_created: [...partial...] }
5. Outcome tracker: status="timeout"
    ↓
Recovery: same as agent failure (retry → escalate)
```

### G.3 EMA Daemon Restart During Execution

```
Problem: BEAM restarts → in-flight execution orphaned
    ↓
Prevention (already built):
  - claude-wrapper.sh kills Claude process when BEAM dies
  - Execution record stays in DB with status="running"
    ↓
On daemon restart:
  1. Ema.Executions.Supervisor starts
  2. Scans for status="running" executions older than 5 min
  3. Marks them: status="failed", error="daemon_restart"
  4. Checks worktrees: is there a results.json? → process it retroactively
  5. Logs to execution-log.md
    ↓
Recovery: human reviews HQ → manually re-dispatch if needed
```

### G.4 Manual Intervention Path

When all automation fails:

```bash
# 1. Check what went wrong
ema task list --project-id=pro_emap2001 --status=failed
ema task {id} get

# 2. Find the worktree
ls ~/Projects/ema/.worktrees/

# 3. Inspect partial work
cd ~/Projects/ema/.worktrees/p2-dispatch-board-TIMESTAMP
git log --oneline
git diff main

# 4. Option A: Fix and commit manually
# ... edit files ...
git commit -am "fix: complete dispatch board after agent failure"

# 5. Write results.json manually
cat > projects/ema-phase2-build/intents/dispatch-board/results/results.json << 'EOF'
{ "status": "completed", "agent": "human", ... }
EOF

# 6. POST to complete
curl -X POST http://localhost:4488/api/executions/{id}/complete \
  -d @results.json

# 7. Or: re-dispatch
ema EMA dispatch \
  --agent-id=coder \
  --task="Resume dispatch-board build. Prior worktree at .worktrees/p2-dispatch-board-TIMESTAMP. Prior work done: ..."
```

### G.5 No Data Loss Guarantee

```
Invariants maintained even on failure:
  1. Intent definition (intent.md) is immutable — never modified by agents
  2. Execution records are append-only inserts — never deleted
  3. Results files are append-only per execution — never overwritten
  4. Worktrees are preserved on failure — no auto-delete
  5. outcome-tracker.json is append-only — failures logged, not deleted
  6. PubSub broadcasts don't guarantee delivery — DB is source of truth
```

---

## PART H: METRICS & FEEDBACK

### H.1 Data to Collect About Phase 2 Self-Build

For each of the 4 feature builds, EMA collects:

**Per-intent:**
- Total time from intent creation → first execution completion
- Token spend (input + output, by model)
- Number of executions required (1 = clean, 2+ = retry)
- Quality score from results.json
- Acceptance criteria pass rate (ACs met / ACs total)
- Proposal adherence (did agent follow the proposal?)
- Which proposal was selected (idea_score, proposal type)

**Cross-intent:**
- Total Phase 2 build time
- Total token cost
- Agent failure rate
- Proposal selection accuracy (did high-scored proposals predict success?)
- Learning loop accuracy (did Week 7 outcomes predict Week 8 choices?)

### H.2 Week 7 Data → Week 8 Improvements

After all Phase 2 features ship (or at end of Week 7):

```
RETROSPECTIVE QUERY:
  "Which intents had clean single-execution completions?"
  "Which required retry? Why?"
  "Which proposal types (idea_score, type) led to best outcomes?"
  "Was opus worth the premium vs sonnet for dispatch-board?"
  "Was Honcho context injection actually useful? (test: compare quality scores with/without)"
```

These questions feed directly into:
- Agent model selection defaults (update SmartRouter quality_tiers)
- Proposal template quality (update Generator prompts)
- Intent template improvements (what fields were underspecified?)
- Timeout calibration (were timeouts correct? too short?)

The Week 7 → Week 8 transfer mechanism:
1. Append lessons to `outcome-tracker.json` `learned` field
2. Update `agent-performance.md` fitness scores
3. Write a Week 7 retrospective to `vault/Sessions/2026-04-11-phase2-retro.md`
4. Update SmartRouter quality_tiers via `Ema.Claude.SmartRouter.update_quality_score/3`

### H.3 Metrics Collection Cadence

| Cadence | Action |
|---------|--------|
| **Per execution** | Write to outcome-tracker.json, update execution record |
| **Per feature shipped** | Write feature-level retrospective note |
| **End of Week 7** | Full retrospective, fitness score updates, SmartRouter reweigh |
| **Start of Week 8** | Read Week 7 outcomes, update dispatch defaults for Week 8 work |
| **End of Week 8** | Phase 2 complete retrospective, crystallization check |

---

## PART I: DATA FLOW DIAGRAMS

### I.1 Primary Happy Path

```
┌──────────────────────────────────────────────────────────────┐
│ USER / ORCHESTRATOR                                          │
│                                                              │
│  "Build dispatch-board feature for EMA Phase 2"             │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│ INTENT CREATION                                              │
│                                                              │
│  1. Write intent.md → projects/ema-phase2-build/intents/    │
│     dispatch-board/intent.md                                 │
│  2. Insert intent_node to DB (level=2, status=planned)       │
│  3. Create intents/{slug}/ directory structure               │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│ PROPOSAL GENERATION                                          │
│                                                              │
│  ProposalEngine.Scheduler.dispatch_seed(intent context)      │
│         │                                                    │
│         ▼                                                    │
│  Generator → generates 3-5 proposals (temp=0.7)             │
│         │                                                    │
│         ▼                                                    │
│  Refiner → critiques each proposal                          │
│         │                                                    │
│         ▼                                                    │
│  Debater → argues for/against, sets confidence              │
│         │                                                    │
│         ▼                                                    │
│  Scorer → idea_score (1-10), intent_aligned check           │
│         │                                                    │
│         ▼                                                    │
│  Tagger → status=queued, proposals/ folder written           │
│                                                              │
│  AUTO-SELECT: highest idea_score proposal                    │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│ ROUTER CLASSIFICATION                                        │
│                                                              │
│  SmartRouter.classify(intent_slug="dispatch-board")          │
│    → domain: "feature-build"                                 │
│    → complexity: "high"                                      │
│    → agent: "coder"                                          │
│    → model: "claude-opus-4-6"                                │
│    → strategy: "balanced"                                    │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│ CONTEXT ASSEMBLY                                             │
│                                                              │
│  Bundle = {                                                  │
│    intent: intent.md,                                        │
│    proposal: winning_proposal.json,                          │
│    docs: [CLAUDE.md, ARCHITECTURE.md, DATA_MODELS.md],      │
│    superman: [modules.json, call_graph.json],                │
│    honcho: {preferences, scope_limits},  ← if available     │
│    recent_outcomes: last 5 similar tasks                     │
│  }                                                           │
│  → Written to: intents/dispatch-board/.context_bundle.json   │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│ EXECUTION RECORD CREATED                                     │
│                                                              │
│  INSERT executions:                                          │
│    id: "exe_a1b2c3d4"                                        │
│    project_slug: "ema-phase2-build"                          │
│    intent_slug: "dispatch-board"                             │
│    mode: "implement"                                         │
│    status: "created"                                         │
│    model: "claude-opus-4-6"                                  │
│    result_path: "projects/.../dispatch-board/results/"       │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│ GIT WORKTREE + AGENT SPAWN                                   │
│                                                              │
│  git worktree add .worktrees/p2-dispatch-board-20260407      │
│    -b p2-dispatch-board-20260407                             │
│                                                              │
│  claude --permission-mode bypassPermissions --print          │
│    "{agent prompt with full context bundle}"                 │
│                                                              │
│  Execution status: "created" → "running"                     │
│  PubSub broadcast: executions:all                            │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│ AGENT EXECUTES (~20-60 min)                                  │
│                                                              │
│  1. Reads intent.md + proposal                               │
│  2. Reads architecture docs                                  │
│  3. Implements deliverables in worktree                      │
│  4. Writes tests → runs mix test                             │
│  5. Commits to worktree branch                               │
│  6. Writes results.json                                      │
│  7. POSTs to /api/executions/{id}/complete                   │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│ RESULT PROCESSING                                            │
│                                                              │
│  Ema.Executions.complete(execution_id, results)              │
│    → Update execution: status=completed, quality_score=8     │
│    → Update intent_node: status=complete                     │
│    → Write outcome-tracker.json entry                        │
│    → Broadcast PubSub executions:all (Dispatch Board updates)│
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│ LEARNING LOOP                                                │
│                                                              │
│  Ema.Outcomes.LearningLoop.analyze(execution_id)             │
│    → agent-performance.md: coder fitness += 0.1              │
│    → proposal success: record prp_8a9b outcome               │
│    → workflow-patterns.json: intent-dispatch pattern +1      │
│    → crystallization check: 5 successes? → flag              │
└──────────────────────────────────────────────────────────────┘
```

### I.2 Failure Path

```
AGENT EXITS WITHOUT POSTING
          │
          ▼
   Timeout (60 min for medium complexity)
          │
          ▼
   ┌──────────────────────────────┐
   │ FAILURE HANDLER              │
   │                              │
   │ 1. Status → "failed"         │
   │ 2. Error logged              │
   │ 3. Worktree preserved        │
   │ 4. outcome-tracker: failed   │
   └──────────┬───────────────────┘
              │
         ┌────┴────────────────┐
         │                     │
         ▼                     ▼
   Retry count < 2?      Retry count >= 2?
         │                     │
         ▼                     ▼
   RE-DISPATCH            SURFACE TO HQ
   (same or upgraded      (human review)
    model)                (manual path)
```

### I.3 Parallel Feature Dispatch

```
Week 7 Day 1:
                    ┌─────────────────────────────────────────┐
                    │ EMA Phase 2 Build: ema-phase2-build      │
                    └──────────────────┬──────────────────────┘
                                       │
            ┌──────────────────────────┼───────────────────────┐
            │                          │                       │
            ▼                          ▼                       ▼
  dispatch-board             deliberation-gate         honcho-integration
  (opus, 3 days)             (sonnet, 2 days)          (sonnet, 2 days)
  [independent]              [independent]             [independent]
            │                          │                       │
            │                          │                       ▼
            │                          │              COMPLETE
            │                          │                       │
            │                          │               ┌───────▼───────┐
            │                          │               │ scope-advisor │
            │                          │               │ (sonnet, 1d)  │
            │                          │               │ [depends on   │
            │                          │               │  honcho]      │
            ▼                          ▼               └───────────────┘
          COMPLETE                  COMPLETE
```

---

## PART J: INTEGRATION CHECKLIST

Pre-dispatch verification (run before dispatching Coder for any intent):

```
[ ] Project created in EMA DB (pro_emap2001)
[ ] Project filesystem structure exists (projects/ema-phase2-build/)
[ ] Intent .md written and immutable
[ ] Intent node in DB (level=2, status=planned)
[ ] At least 1 proposal generated and scored
[ ] Winning proposal selected (idea_score >= 7)
[ ] Context bundle assembled (.context_bundle.json)
[ ] Superman index up to date (daemon/.superman/ freshness < 24h)
[ ] Honcho health check run (graceful if unavailable)
[ ] Execution record created (status=created)
[ ] Git worktree created on clean branch
[ ] Timeout configured (30/60/120 min by complexity)

Agent execution checklist (agent verifies before starting work):
[ ] Agent can read intent.md
[ ] Agent can read proposal JSON
[ ] Agent can read ARCHITECTURE.md and DATA_MODELS.md
[ ] Agent can git commit in worktree
[ ] Agent can reach EMA daemon (curl http://localhost:4488/api/health)
[ ] Agent can write to results/ directory

Post-execution checklist (EMA verifies after completion):
[ ] results.json written and valid JSON
[ ] All acceptance criteria fields present in results.json
[ ] Tests ran and passing (tests_failing == 0 or documented exceptions)
[ ] Commits present in worktree (commits array non-empty)
[ ] outcome-tracker.json appended
[ ] workflow-patterns.json updated
[ ] Execution record status=completed
[ ] Intent node status updated
[ ] PubSub broadcast fired (Dispatch Board shows complete)
[ ] Learning loop ran (fitness scores updated)
```

---

## PART K: QUICK-START COMMAND SEQUENCE

For a Coder agent to bootstrap Phase 2 from scratch:

```bash
# Step 1: Create project
curl -X POST http://localhost:4488/api/projects \
  -H "Content-Type: application/json" \
  -d '{"id":"pro_emap2001","slug":"ema-phase2-build","name":"EMA Phase 2 Build","status":"active","linked_path":"~/Projects/ema"}'

# Step 2: Create filesystem structure
mkdir -p ~/Projects/ema/projects/ema-phase2-build/{outcomes,intents/{dispatch-board,deliberation-gate,honcho-integration,scope-advisor}/{proposals,results}}

# Step 3: Write intent.md files (from this document, Part B)
# ... write each intent.md ...

# Step 4: Create intent nodes in DB
for SLUG in dispatch-board deliberation-gate honcho-integration scope-advisor; do
  curl -X POST http://localhost:4488/api/intent \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"$SLUG\",\"level\":2,\"project_id\":\"pro_emap2001\",\"status\":\"planned\"}"
done

# Step 5: Generate proposals for each intent
ema proposal create --project-id=pro_emap2001 --seed-source=intent:dispatch-board
ema proposal create --project-id=pro_emap2001 --seed-source=intent:deliberation-gate
# ... etc

# Step 6: Wait for pipeline (proposals reach "queued" status)
ema proposal list --project-id=pro_emap2001 --status=queued --format=table

# Step 7: Select winning proposals (highest idea_score per intent)
# Record proposal IDs for dispatch context

# Step 8: Dispatch Coder agents (deliberation-gate and honcho-integration first)
ema EMA dispatch \
  --agent-id=coder \
  --task="Build deliberation-gate per intent spec at ~/Projects/ema/projects/ema-phase2-build/intents/deliberation-gate/intent.md. Use proposal {ID}. Execution ID: {exe_id}."

# Step 9: Monitor
ema task list --project-id=pro_emap2001 --format=table
```

---

## APPENDIX: DECISION LOG

| Decision | Rationale |
|----------|-----------|
| File-based results.json + HTTP POST | Dual-path guarantees no data loss. HTTP is primary, file poll is fallback. |
| Flat intent hierarchy (no sub-intents) | 4 features are independently shippable. Hierarchy adds coordination overhead without benefit. |
| JSON files for outcome-tracker + workflow-patterns | Consistent with existing pattern in workspace. DB would be cleaner but unnecessary complexity. |
| Git worktrees (not branches on main) | Prevents main-branch pollution. Agents can work in isolation. Partial work preserved on failure. |
| No breaking Executions schema changes | Constraint from task spec. All additions are nullable. Old records work. |
| Opus for Dispatch Board, Sonnet for others | Dispatch Board has highest complexity (graph topology + WS + React). Cost/quality tradeoff favors Sonnet for simpler features. |
| Scope Advisor runs with hardcoded fallback | Dependency on Honcho shouldn't block scope-advisor. Hardcoded thresholds provide immediate value. |
| Auto-select winning proposal by idea_score | Avoids manual selection bottleneck. Human can override if needed via HQ. |
| Timeout = 2x expected by complexity tier | Generous to avoid false failures. Agents running long is better than premature timeout. |

---

*End of PHASE2_EXECUTION_PLAN.md*  
*This document is the ground truth for Phase 2 self-build. Update it as decisions change.*

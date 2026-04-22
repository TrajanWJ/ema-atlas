# Proposal Engine v2 — Design Spec

**Version:** 2.0  
**Status:** Draft  
**Author:** coder agent  
**Date:** 2026-03-20  
**Replaces:** `~/bin/proposal-engine-v2.sh`

---

## Problem Statement

The current `proposal-engine-v2.sh` generates proposals that are:

- **Single-task and shallow** — "Enrich vault note", "Disk cleanup", "Analyze 6 corrections"
- **Reactive** — triggered by system state thresholds (disk%, failure count)
- **Low strategic value** — maintenance busywork rather than meaningful system evolution
- **Disconnected from goals** — no link between what the system proposes and what Trajan actually wants to build

The result is a queue of P3/P4 housekeeping tasks that agents execute but don't move the needle on anything important.

**Goal:** Replace with a system that generates multi-task work packages tied to real goals, architectural gaps, and strategic priorities — proposals ambitious enough to require multiple agent sessions.

---

## Design Principles

1. **Proposals should matter** — if completing a proposal doesn't measurably improve the system or advance a goal, don't generate it
2. **Multi-task by default** — minimum 3 coordinated tasks per proposal, maximum 10
3. **Source traceability** — every proposal knows exactly where it came from and why it's relevant now
4. **Ambitious but scoped** — each proposal has clear boundaries; not "improve the system" but "implement the missing /agents API endpoints as defined in Agent-OS-Bridge-API.md"
5. **Autonomy with safety** — non-destructive work runs automatically; anything touching production, data deletion, or external systems waits for human approval

---

## Proposal Format v2

The current JSON schema is extended with new required fields:

```json
{
  "id": "prop-{timestamp}-{random}",
  "type": "dispatch | research | build | idea | pipeline",
  "title": "Short imperative statement (≤80 chars)",
  "body": "Context and rationale",
  
  "scope": {
    "task_count": 5,
    "estimated_sessions": 2,
    "parallelizable": true
  },
  
  "source": {
    "engine": "audit-gap | goal-alignment | pattern-recognition | codebase-analysis | self-improvement | vault-integration",
    "context": "Specific file/gap/pattern that triggered this",
    "evidence": "Quote or metric from source that justifies generation"
  },
  
  "tasks": [
    {
      "id": 1,
      "title": "Task title",
      "agent": "suggested-agent",
      "depends_on": [],
      "destructive": false
    }
  ],
  
  "success_criteria": [
    "Concrete, verifiable outcome 1",
    "Concrete, verifiable outcome 2"
  ],
  
  "impact": {
    "category": "capability | reliability | velocity | knowledge | security",
    "description": "One sentence on why this matters",
    "effort_vs_value": "high|medium|low"
  },
  
  "autonomy": "auto | review_required",
  "autonomy_reason": "Why this was classified as auto or review_required",
  
  "priority": "P0 | P1 | P2 | P3 | P4",
  "status": "pending | approved | dismissed | expired",
  "created_at": "ISO8601",
  "discord_message_id": null
}
```

**Migration:** The `tasks[]` and `scope` fields are new. Existing proposals without them remain valid but are treated as single-task proposals.

---

## Idea Sources (Six Engines)

### Source 1: Audit Gap Analysis

**What it does:** Maintains a living gap list from architecture audits. Each audit result in `dispatch/results/pipeline-*-assessment.md` contains identified gaps. This source tracks which gaps have been addressed and which haven't, then proposes remediation work packages.

**Implementation:**
```
1. Scan dispatch/results/ for pipeline assessment files
2. Parse "gap" and "missing" sections from each assessment
3. Cross-reference against dispatch/done/ to see which gaps were already remediated
4. Rank open gaps by recency of assessment + impact signals
5. Generate proposals for the top 2-3 unaddressed gaps
```

**Gap state file:** `dispatch/gap-registry.json`
```json
{
  "gaps": [
    {
      "id": "gap-{hash}",
      "description": "Gap description from assessment",
      "source_file": "pipeline-agent_architecture-20260320-assessment.md",
      "discovered": "ISO8601",
      "category": "api | integration | testing | documentation | security",
      "remediated": false,
      "remediation_task_id": null
    }
  ]
}
```

**Example proposal output:**
```
Title: "Implement 4 missing Bridge API endpoints from Agent Architecture gap"
Scope: 4 tasks, 1 session
Source: audit-gap (pipeline-agent_architecture-20260320-assessment.md)
Tasks:
  1. [architect] Read Agent-OS-Bridge-API.md, list all specified endpoints
  2. [coder] Implement /api/agents endpoint with live status
  3. [coder] Implement /api/queue/summary endpoint  
  4. [eval-specialist] Write integration tests and verify endpoints respond correctly
Success criteria:
  - All endpoints in spec return 200 with valid JSON
  - Integration tests pass
Impact: capability / Closes architectural gap between spec and implementation
```

**Trigger condition:** ≥1 unaddressed gap older than 48 hours

---

### Source 2: Goal Alignment

**What it does:** Pulls from vault goals and mission, identifies stalled or blocked work, and proposes concrete unblocking steps.

**Implementation:**
```
1. Read vault/Trajan/Goals & Aspirations.md and vault/Projects/*.md
2. Parse active goals and their current status
3. Check dispatch/done/ and dispatch/results/ for recent progress on each goal
4. Identify goals with no recent activity (>7 days) or explicit blockers
5. Generate proposals to unblock or advance stalled goals
```

**Goal state tracking:** Read from vault goal files; track in `dispatch/goal-progress.json`
```json
{
  "goals": [
    {
      "goal": "Goal title from vault",
      "last_dispatch_activity": "ISO8601",
      "last_vault_update": "ISO8601",
      "stalled": true,
      "proposal_generated": false
    }
  ]
}
```

**Example proposal output:**
```
Title: "Advance Wilson Properties client work — 3 concrete deliverables"
Scope: 3 tasks, 1 session
Source: goal-alignment (Goals & Aspirations.md — only client, 7 days idle)
Tasks:
  1. [analyst] Audit current deliverables for Wilson Properties, identify what's owed
  2. [coder] Build or improve the specific tool/report they need
  3. [analyst] Draft status update and next steps for client communication
Success criteria:
  - Clear deliverable exists or is in progress
  - Client relationship advanced
Impact: velocity / Only active revenue source — keeping momentum matters
```

**Trigger condition:** Any active goal with no dispatch activity for >7 days

---

### Source 3: Pattern Recognition

**What it does:** Analyzes `dispatch/feed.jsonl` history for failure patterns, recurring manual work, and repetitive agent behaviors, then proposes automation or systemic fixes.

**Implementation:**
```
1. Parse last 500 entries of feed.jsonl
2. Cluster events by type and content patterns
3. Identify: recurring error types, agents that keep being dispatched for same task,
   tasks that frequently timeout or fail, manual interventions in the feed
4. Calculate frequency and recurrence score for each pattern
5. Generate automation proposals for patterns scoring above threshold
```

**Pattern types to detect:**
- **Retry storms:** Same task re-dispatched >3 times in 24h → propose fix
- **Agent timeout patterns:** Agent X consistently times out on task type Y → propose prompt adjustment or task decomposition
- **Manual override patterns:** Human approvals of same proposal type >2 times → propose auto-approval rule
- **Recurring maintenance:** Same maintenance task >weekly → propose automation script

**Pattern state file:** `dispatch/pattern-registry.json`

**Example proposal output:**
```
Title: "Automate vault-curator link enrichment — runs manually 8x per week"
Scope: 5 tasks, 2 sessions
Source: pattern-recognition (feed.jsonl: vault-curator dispatched for link enrichment 8 times this week)
Tasks:
  1. [analyst] Audit the 8 vault enrichment tasks — what triggered each, what was done
  2. [coder] Write vault-auto-enrich.sh that identifies new notes needing links
  3. [coder] Add cron entry to run vault-auto-enrich.sh on new vault writes
  4. [eval-specialist] Test the script on 3 recent notes, verify correctness
  5. [vault-curator] Update vault/Architecture/Auto-Knowledge Architecture.md with new flow
Success criteria:
  - No manual vault enrichment proposals for 7 days
  - New notes automatically get backlinks within 1h of creation
Impact: velocity / Eliminates recurring manual work, frees agent cycles
```

**Trigger condition:** Any pattern with frequency ≥3 occurrences in 7 days

---

### Source 4: Codebase Analysis

**What it does:** Scans active projects (~/Projects/, ~/bin/, ~/.openclaw/) for TODOs, dead code, missing tests, incomplete features, and tech debt markers.

**Implementation:**
```
1. Walk project directories from a configurable list
2. Grep for: TODO, FIXME, HACK, STUB, PLACEHOLDER, "not implemented", "coming soon"
3. Detect dead code: functions defined but never called (where static analysis applies)
4. Identify untested modules: source files without corresponding test files
5. Find incomplete features: stub functions, empty catch blocks, hardcoded placeholders
6. Group findings by project and severity
7. Generate proposals for the highest-density clusters
```

**Scan targets** (configurable):
- `~/bin/*.sh` — operational scripts
- `~/.openclaw/agents/*/` — agent definitions
- `~/Projects/*/src/` — project source code
- `~/dispatch/*.sh` — dispatch infrastructure

**Example proposal output:**
```
Title: "Close 12 TODO/STUB markers in dispatch infrastructure scripts"
Scope: 4 tasks, 1 session
Source: codebase-analysis (12 TODO markers found in ~/bin/ dispatch scripts)
Tasks:
  1. [analyst] Triage 12 TODOs — categorize as: implement now / defer / delete
  2. [coder] Implement the 5 high-value TODOs (implement now category)
  3. [coder] Delete or document the deferred ones
  4. [eval-specialist] Verify nothing broke after changes
Success criteria:
  - Zero TODO markers in dispatch infrastructure scripts
  - Any deferred items tracked in vault/Architecture/
Impact: reliability / TODOs are deferred bugs; closing them reduces future failures
```

**Trigger condition:** ≥5 TODO/STUB markers found in a single project or directory

---

### Source 5: Self-Improvement (Agent OS)

**What it does:** Specifically targets Agent OS improving itself — missing API endpoints, broken integrations, unimplemented specs from shared-agent-config/, and gaps between architectural documentation and actual implementation.

**Implementation:**
```
1. Read vault/Architecture/Agent-OS-Bridge-API.md — extract all documented endpoints
2. Query the bridge API to discover which endpoints actually exist
3. Cross-reference: documented but unimplemented = gap
4. Read ~/.openclaw/agents/main/workspace/shared-agent-config/ for any unimplemented specs
5. Check vault/Architecture/Aspirational System Design.md for near-term items
6. Identify integration points that are documented but broken or missing
```

**Integration checks:**
- Bridge API completeness (spec vs. reality)
- Agent roster (AGENTS.md vs. what dispatch actually knows about)
- Skill inventory (skills/ vs. what's actually callable)
- MCP server integrations (documented vs. responding)
- Discord bot handlers (events documented vs. implemented)

**Example proposal output:**
```
Title: "Implement Agent OS self-healing: 3 broken integrations from Agent-OS-Bridge-API.md"
Scope: 6 tasks, 2 sessions  
Source: self-improvement (Agent-OS-Bridge-API.md documents /api/knowledge endpoints, none implemented)
Tasks:
  1. [architect] Read Agent-OS-Bridge-API.md sections on /api/knowledge/*
  2. [coder] Implement /api/knowledge/query endpoint
  3. [coder] Implement /api/knowledge/graph endpoint
  4. [coder] Wire endpoints to existing antfly-search.sh backend
  5. [eval-specialist] Test all 3 endpoints with real queries
  6. [vault-curator] Update bridge API health doc with new endpoints
Success criteria:
  - All 3 knowledge endpoints return valid responses
  - Bridge API spec percentage complete increases from X% to Y%
Impact: capability / Closes gap between what's documented and what works
```

**Trigger condition:** ≥1 documented spec item with no corresponding implementation

---

### Source 6: Vault Integration

**What it does:** Scans vault for research notes that should become implementations, stale knowledge that needs updating, and notes that explicitly reference unbuilt features or planned work.

**Implementation:**
```
1. Scan vault/Research/ for notes with status: "actionable" or type: "finding"
2. Check if those findings have been acted on (cross-ref dispatch/done/)
3. Scan vault/Architecture/ for notes referencing features with "TODO" or "planned"
4. Find vault notes with confidence < 0.5 and age > 30 days (stale knowledge)
5. Identify notes that reference external systems or tools needing verification
6. Generate proposals to implement research findings or update stale knowledge
```

**Vault signals:**
- Frontmatter: `status: actionable`, `status: draft`, `confidence: < 0.5`
- Body patterns: "should be implemented", "future work", "unbuilt", "TODO"
- Cross-reference gap: note references a tool/script/endpoint that doesn't exist

**Example proposal output:**
```
Title: "Implement findings from 4 actionable research notes into system"
Scope: 5 tasks, 2 sessions
Source: vault-integration (vault/Research/context-management-best-practices.md — status:actionable, 6 days old, no dispatch followup)
Tasks:
  1. [analyst] Read the 4 actionable research notes, summarize key implementation items
  2. [coder] Implement context compression improvement from context-management research
  3. [coder] Implement session handoff format from agent-handoff research
  4. [vault-curator] Update research notes with status:implemented and link to dispatch tasks
  5. [eval-specialist] Verify changes work in practice
Success criteria:
  - All 4 research notes updated to status:implemented
  - At least 2 concrete system changes shipped
Impact: knowledge / Research that never becomes action is waste
```

**Trigger condition:** ≥1 actionable research note with no dispatch followup for >3 days

---

## Autonomy Classification

### Auto-approve (non-destructive)

Proposals are auto-approved and dispatched without human review when ALL of the following are true:

| Condition | Requirement |
|-----------|-------------|
| Priority | P3 or P4 only |
| Operations | No deletions of user content |
| Data | Read-only or vault writes only |
| Services | No production service restarts or config changes |
| External | No emails, messages, or public posts |
| Spending | No new API keys, no budget changes |
| Architecture | No structural changes to core dispatch/agent systems |

**Safe operation types:**
- Vault note creation, enrichment, linking
- Research and analysis (web search, code reading)
- Cron job creation for new automation (not modifying existing)
- New script creation in ~/bin/ (not modifying existing operational scripts)
- Read-only audits and scans

### Queue for human review

Proposals require explicit human approval when ANY of the following:

| Trigger | Reason |
|---------|--------|
| Priority P1 or P2 | High stakes |
| Modifies production service config | Irreversible impact |
| Deletes files or data | Data loss risk |
| External actions (email, Discord DM, post) | Public/visible impact |
| Modifies existing operational scripts | System stability risk |
| Changes agent routing or dispatch logic | Behavioral change |
| Architecture redesign | Long-term consequence |
| Keyword: "migrate", "drop", "remove", "force", "override" | Destructive intent |

### Implementation

Auto-approval logic lives in an upgraded `proposal-triage-v2.sh` that replaces the current pattern-matching with structured field evaluation:

```bash
# proposal-triage-v2.sh — uses scope.tasks[].destructive field
# if any task has destructive:true → escalate
# if priority P1/P2 → escalate  
# if all tasks have destructive:false AND priority P3/P4 → auto_execute
```

---

## Output Schema — Task Breakdown Format

Each proposal generates a **task package** rather than a single dispatch task. The package is stored alongside the proposal JSON and referenced at approval time.

**Task package file:** `dispatch/proposals/{proposal-id}-tasks.json`

```json
{
  "proposal_id": "prop-{id}",
  "tasks": [
    {
      "sequence": 1,
      "title": "Read Agent-OS-Bridge-API.md, extract endpoint list",
      "agent": "architect",
      "description": "Full task description with context",
      "depends_on": [],
      "destructive": false,
      "estimated_tokens": 15000
    },
    {
      "sequence": 2,
      "title": "Implement /api/agents endpoint",
      "agent": "coder",
      "description": "Implement based on spec from task 1 output",
      "depends_on": [1],
      "destructive": false,
      "estimated_tokens": 30000
    }
  ],
  "dispatch_strategy": "sequential | parallel | pipeline",
  "pipeline_id": null
}
```

**Dispatch strategy:**
- `sequential` — tasks run one after another, each reading prior output
- `parallel` — independent tasks dispatched simultaneously
- `pipeline` — use existing pipeline infrastructure (assess → research → implement → verify)

---

## Gap Registry

New persistent file at `dispatch/gap-registry.json` tracks discovered gaps across all sources:

```json
{
  "version": 1,
  "updated": "ISO8601",
  "gaps": [
    {
      "id": "gap-{hash}",
      "source_engine": "audit-gap | codebase-analysis | self-improvement | vault-integration",
      "source_file": "relative/path/to/source",
      "description": "Gap description",
      "severity": "critical | high | medium | low",
      "discovered": "ISO8601",
      "remediated": false,
      "remediation_proposal_id": null,
      "remediation_task_id": null,
      "remediated_at": null
    }
  ]
}
```

This registry is the single source of truth for what the system knows it's missing. Proposals are generated from the registry, not re-discovered every run. This prevents:
- Duplicate proposals for the same gap
- Gaps that fall through the cracks
- Loss of context when audits are old

---

## Deduplication Strategy

Current dedup is title+source within 1 hour. V2 extends this:

1. **Gap registry dedup:** If a gap has `remediation_proposal_id` set, don't generate a new proposal for it
2. **Goal dedup:** If a goal has a pending/active proposal, don't generate another
3. **Pattern dedup:** Pattern registry tracks which patterns have active proposals
4. **Cross-source dedup:** If two sources generate proposals for the same underlying issue, merge into one proposal with combined task breakdown

---

## Scheduling and Cron

The engine runs as a cron job. V2 recommended schedule:

```cron
# Proposal Engine v2 — run every 30 minutes, but each source has its own cadence
*/30 * * * * ~/bin/proposal-engine-v3.sh 2>>/tmp/proposal-engine-v3.log

# Gap registry maintenance — daily rebuild
0 6 * * * ~/bin/gap-registry-sync.sh 2>>/tmp/gap-registry.log
```

**Per-source cadence** (checked within each run):
| Source | Frequency | Rationale |
|--------|-----------|-----------|
| Audit gap | Every run | Gaps don't expire; check always |
| Goal alignment | Every 6h | Goals don't change rapidly |
| Pattern recognition | Every 2h | Feed needs batch of events to be meaningful |
| Codebase analysis | Daily | Code changes slowly |
| Self-improvement | Every 4h | Spec/reality gap can grow after any deploy |
| Vault integration | Every 4h | Research notes age, need regular pickup |

State tracking for per-source cadence lives in `dispatch/proposal-engine-state.json`.

---

## Scoring and Prioritization

Before generating a proposal, V2 scores the opportunity to decide if it's worth generating:

```
opportunity_score = (
  impact_weight * impact_score
  + age_weight * age_score
  + frequency_weight * frequency_score
  - effort_weight * effort_estimate
)
```

Proposals only generated if `opportunity_score > 0.5`.

| Signal | Weight | How measured |
|--------|--------|--------------|
| Impact (capability/reliability) | 0.4 | Category classification |
| Age of gap/stall | 0.2 | Days since discovered |
| Frequency of occurrence | 0.2 | Count in last 7 days |
| Effort estimate | -0.2 | Task count × complexity |

This prevents low-value proposals from being generated even when thresholds are met.

---

## Success Criteria Format

Each proposal includes verifiable success criteria. The eval-specialist agent checks these at the end of the task package:

```
success_criteria: [
  "Bridge API /api/agents endpoint returns 200 with agent list",
  "Integration test passes: curl localhost:PORT/api/agents | jq '.agents | length > 0'",
  "vault/Architecture/Agent-OS-Bridge-API.md updated with implementation status"
]
```

Criteria must be:
- **Binary** — pass/fail, not "improved" or "better"
- **Verifiable** — either a command that can be run, or a file that can be inspected
- **Specific** — references exact files, endpoints, or behaviors

---

## Impact Assessment Categories

| Category | Description | Examples |
|----------|-------------|---------|
| `capability` | New functionality added to the system | New API endpoints, new agent ability |
| `reliability` | Fewer failures, better error handling | Fix recurring failure pattern, add health check |
| `velocity` | Work gets done faster or more automatically | Automate recurring manual task |
| `knowledge` | System or vault better represents reality | Research → implementation, update stale docs |
| `security` | Reduced attack surface or exposure | Fix exposed port, rotate keys |

Every proposal gets exactly one primary category plus optional secondary.

---

## Implementation Plan

### Phase 1: Schema and Gap Registry (1 session)
- [ ] Define and implement `gap-registry.json` schema
- [ ] Write `gap-registry-sync.sh` — populates registry from audit results
- [ ] Extend `proposal.sh` to support v2 schema fields (backwards compatible)
- [ ] Update `proposal-triage-v2.sh` to use `scope.tasks[].destructive` field

### Phase 2: Source Engines (2-3 sessions)
- [ ] Source 1: Audit gap reader (parses assessment files, feeds gap registry)
- [ ] Source 2: Goal alignment scanner (reads vault goals, tracks activity)
- [ ] Source 3: Pattern recognition engine (feed.jsonl clustering)
- [ ] Source 4: Codebase TODO scanner (configurable target dirs)
- [ ] Source 5: Self-improvement spec checker (Bridge API, AGENTS.md diff)
- [ ] Source 6: Vault integration scanner (actionable notes, confidence decay)

### Phase 3: Proposal Generator (1 session)
- [ ] Central scoring and dedup logic
- [ ] Proposal format v2 generation with task breakdowns
- [ ] Dispatch strategy selection (sequential/parallel/pipeline)
- [ ] Write main `proposal-engine-v3.sh` orchestrating all sources

### Phase 4: Task Dispatch (1 session)
- [ ] On approval: parse task package and dispatch tasks in order
- [ ] Track task completion and advance sequential chains
- [ ] Report success criteria evaluation back to proposal
- [ ] Update gap registry on remediation

---

## Migration from Current Engine

The current `proposal-engine-v2.sh` generates 8 sources of small proposals. Migration path:

1. **Deploy V3 alongside V2** for first 7 days — run both, compare proposal quality
2. **Disable V2 sources 1-7** once V3 sources 1-6 are generating equivalent or better signals
3. **Keep V2 Source 8 (strategic rotating)** — useful as a daily synthesis trigger, can remain
4. **Rename** `proposal-engine-v2.sh` → `proposal-engine-v2.sh.deprecated`
5. **Update cron** to point to `proposal-engine-v3.sh`

---

## Files Created / Modified by This System

| File | Purpose |
|------|---------|
| `~/bin/proposal-engine-v3.sh` | Main engine (replaces v2) |
| `~/bin/gap-registry-sync.sh` | Rebuilds gap registry from assessments |
| `~/bin/proposal-triage-v2.sh` | Updated triage with structured destructive field |
| `~/dispatch/gap-registry.json` | Living gap list, persisted across runs |
| `~/dispatch/goal-progress.json` | Goal activity tracking |
| `~/dispatch/pattern-registry.json` | Pattern clusters from feed analysis |
| `~/dispatch/proposal-engine-state.json` | Per-source cadence state |
| `~/dispatch/proposals/{id}-tasks.json` | Task packages per proposal |
| `~/dispatch/specs/proposal-engine-v2-spec.md` | This document |

---

## Open Questions

1. **Pipeline vs. sequential dispatch:** Should multi-task proposals use the existing pipeline infrastructure (assess → research → implement → verify) or a new sequential chain? Pipeline adds overhead but provides self-feed learning. Recommendation: use pipeline for >4 task proposals, sequential for ≤4.

2. **Human review UX:** Currently proposals escalate to Discord. For review-required proposals with a full task breakdown, the Discord message should show the full task list. Update `proposal-discord-mirror.sh` to render v2 schema.

3. **Gap registry freshness:** Gaps discovered from stale assessment files may no longer be valid. Add `invalidated` field and a freshness check: gaps from assessments >30 days old need re-validation before generating proposals.

4. **Proposal scoring tuning:** Initial weights are estimates. After 2 weeks, analyze which proposals were actually completed vs. dismissed. Use this to recalibrate weights.


# Plan: Babysitter + Orchestrator Continuous Progress Restart

**Generated**: 2026-04-13 UTC  
**Estimated Complexity**: High

## Overview

This plan restarts the babysitter/orchestrator engine as a deliberate control-plane system rather than a loose collection of channels and agent activity. The target state is a resilient loop that:

- keeps execution moving continuously
- reconciles host reality with EMA context memory
- uses the Karger context model as the compression and prioritization layer
- detects stalls, deadlocks, and cold channels early
- escalates blockers instead of silently drifting

The practical approach is:
1. re-establish a single control-plane contract
2. define the state model and lane ownership
3. attach Karger-style context compression to every active lane
4. implement continuous-progress heuristics and escalation rules
5. validate with a controlled restart and observable telemetry

## Assumptions

- “EMA” is the durable operational memory / attachment layer.
- “host” is the source of truth for actual execution state.
- “babysitter” is the supervisory loop.
- “orchestrators” are workers/coordinators driving scoped execution lanes.
- Discord channels act as human-visible overlays, not the only source of truth.
- The goal is not chatter; it is sustained forward motion with useful summaries.

## Success Criteria

The restart is successful when:

- there is a clearly identified babysitter authority
- each active lane has an owner, status, and next action
- Karger context summaries exist for all active lanes
- stalls are surfaced within a bounded time window
- EMA and host can be reconciled on demand without ambiguity
- at least one full work cycle completes end-to-end without human rescue

## Non-Goals

- building a perfect autonomous system before resuming work
- replacing host truth with Discord/chat logs
- maximizing message volume or synthetic activity
- allowing multiple competing babysitter authorities

## Operating Model

### Core Roles

#### 1. Babysitter
Supervisory authority for system continuity.

Responsibilities:
- monitor lane liveness
- detect stalls, deadlocks, and orphan work
- request or trigger recovery actions
- maintain the current objective stack
- escalate unresolved blockers
- enforce heartbeat/update discipline without spam

#### 2. Orchestrators
Lane-scoped executors/coordinators.

Responsibilities:
- own a bounded workstream
- emit intent, action, blocker, and result transitions
- maintain lane-local state
- request escalation when blocked beyond policy

#### 3. Host
Execution ground truth.

Responsibilities:
- reflect process/task/session reality
- expose current running work, failures, and resource constraints
- anchor recovery and reconciliation

#### 4. EMA
Operational memory and attachment layer.

Responsibilities:
- store compressed context
- preserve objective continuity across restarts
- maintain summaries, decisions, blocker history, and lane snapshots
- support low-token rehydration into active supervision

### Karger Context Model Attachment

Use the Karger context model as the lane compression and prioritization framework.

Each active lane should maintain a compact context object with:
- **Objective**: what outcome this lane is trying to achieve
- **Current frontier**: the exact next meaningful step
- **Dependency graph**: upstream/downstream tasks, agents, or resources
- **Min-cut / bottleneck view**: the smallest set of blockers preventing progress
- **Recovery path**: what to do if the lane stalls or loses context
- **Escalation target**: who/what gets pinged when the lane cannot self-recover

This model should reduce drift by making every lane answer:
- what am I doing?
- what is blocking me?
- what is the cheapest cut to restore progress?
- what state must be preserved if I disappear?

## State Model

Every lane should exist in one of these states:

- **queued**: accepted but not yet running
- **active**: currently making progress
- **waiting-dependency**: blocked on an external requirement
- **waiting-human**: blocked on human decision/input
- **degraded**: partially functioning but unreliable
- **stalled**: no meaningful progress signal within policy window
- **recovery**: babysitter or orchestrator is attempting repair
- **complete**: done and validated
- **abandoned**: intentionally dropped with reason recorded

### Required Fields Per Lane

- lane id
- owner/orchestrator id
- status
- objective
- current step
- last meaningful progress timestamp
- blockers
- dependencies
- recovery playbook pointer
- escalation target
- EMA summary pointer
- host evidence pointer

## Channel / Surface Mapping

Use channels as overlays for the right kind of information, not as primary state stores.

### Recommended Mapping

- **#babysitter-sprint**
  - control tower
  - human directives
  - repair decisions
  - rollout checkpoints
  - bounded summaries only

- **system heartbeat / heartbeat lane**
  - liveness snapshots
  - stalled/degraded lane notices
  - recovery outcomes

- **agent thoughts / reasoning lane**
  - only compressed rationale when needed
  - no raw token stream dumping

- **intent stream**
  - declared next actions and lane transitions

- **pipeline flow**
  - execution graph movement, handoffs, completions

- **memory writes**
  - EMA summary updates and durable context checkpoints

- **intelligence layer**
  - cross-lane synthesis, bottleneck clustering, priority recalc

## Sprint 1: Re-establish Control Plane Authority
**Goal**: restore a single coherent supervisory model and define the active execution lanes.  
**Demo/Validation**:
- one babysitter authority is named
- active lanes are enumerated
- each lane has owner, objective, and status
- no duplicate authority loops are running

### Task 1.1: Name the canonical babysitter authority
- **Location**: control-plane spec / runtime config / ops notes
- **Description**: identify the single authority responsible for supervision and escalation.
- **Dependencies**: none
- **Acceptance Criteria**:
  - one babysitter authority is documented
  - duplicate supervisory loops are either disabled or marked secondary
- **Validation**:
  - operator can answer “who is in charge?” with one clear identifier

### Task 1.2: Enumerate current orchestrators and lanes
- **Location**: lane registry
- **Description**: list all currently intended orchestrators, their scope, and whether they are active, stale, or dead.
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - each orchestrator is mapped to one or more lanes
  - stale/duplicate lanes are identified
- **Validation**:
  - a table or structured document exists for the current lane registry

### Task 1.3: Define lane ownership rules
- **Location**: control-plane spec
- **Description**: establish that each lane has exactly one owner at a time, with explicit handoff semantics.
- **Dependencies**: Task 1.2
- **Acceptance Criteria**:
  - no lane permits ambiguous ownership
  - handoff conditions are documented
- **Validation**:
  - sample lane handoff can be walked through cleanly

## Sprint 2: Build the Shared State Contract
**Goal**: ensure host, EMA, babysitter, and orchestrators use the same language for work state.  
**Demo/Validation**:
- per-lane state schema exists
- state transitions are defined
- host and EMA pointers exist for each lane

### Task 2.1: Define canonical lane schema
- **Location**: schema/spec file
- **Description**: define the required fields for every lane record.
- **Dependencies**: Sprint 1 complete
- **Acceptance Criteria**:
  - schema includes status, objective, next action, blocker, timestamps, and pointers
- **Validation**:
  - sample lane records validate against the schema

### Task 2.2: Define allowed transitions
- **Location**: state-transition section in spec
- **Description**: define which status transitions are valid and which require babysitter intervention.
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - invalid transitions are identified
  - recovery entry points are clear
- **Validation**:
  - transition walkthrough covers active → stalled → recovery → active/abandoned

### Task 2.3: Attach host evidence + EMA summary contract
- **Location**: reconciliation section in spec
- **Description**: require each lane to maintain both a host evidence pointer and an EMA compressed summary.
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - every active lane points to both execution truth and memory summary
- **Validation**:
  - random lane audit can answer “what is happening now?” and “what matters about it?”

## Sprint 3: Attach Karger Context Compression
**Goal**: prevent context drift and force bottleneck-aware prioritization.  
**Demo/Validation**:
- each active lane has a Karger context object
- blockers are represented as cuts/bottlenecks
- recovery path exists for each active lane

### Task 3.1: Define Karger lane context template
- **Location**: context template/spec
- **Description**: create a structured template with objective, frontier, dependencies, bottleneck set, recovery path, and escalation target.
- **Dependencies**: Sprint 2 complete
- **Acceptance Criteria**:
  - template is small enough to be reused constantly
  - template is rich enough to restore work after interruption
- **Validation**:
  - one lane can be rehydrated from template alone

### Task 3.2: Populate context objects for active lanes
- **Location**: EMA summaries / lane records
- **Description**: create a Karger context object for every currently active lane.
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - all active lanes have current context objects
  - missing/ambiguous objectives are surfaced immediately
- **Validation**:
  - operator review of 3 sample lanes shows clear next-step logic

### Task 3.3: Add cut-based prioritization rule
- **Location**: babysitter decision policy
- **Description**: prioritize the smallest blocker sets whose removal unlocks the greatest total progress.
- **Dependencies**: Task 3.2
- **Acceptance Criteria**:
  - prioritization policy is stated in plain language
  - babysitter can rank blockers by leverage
- **Validation**:
  - synthetic scenario shows useful ranking of interventions

## Sprint 4: Implement Continuous Progress Heuristics
**Goal**: create a loop that notices when work is no longer moving and intervenes proportionally.  
**Demo/Validation**:
- stalled lanes are detected within policy windows
- cold channels do not remain unnoticed
- orphan work is surfaced automatically

### Task 4.1: Define “meaningful progress” signals
- **Location**: heuristics section
- **Description**: distinguish meaningful progress from noise, chatter, and repeated status echoes.
- **Dependencies**: Sprint 3 complete
- **Acceptance Criteria**:
  - progress signals are explicit
  - anti-noise rules are explicit
- **Validation**:
  - examples classify real updates as meaningful vs noise

### Task 4.2: Define stall windows by lane type
- **Location**: heuristics/policy file
- **Description**: specify how long each lane type may remain without progress before moving to stalled.
- **Dependencies**: Task 4.1
- **Acceptance Criteria**:
  - different workloads can have different stall windows
  - policy avoids both overreacting and silent failure
- **Validation**:
  - time-window simulation produces reasonable alerts

### Task 4.3: Define recovery ladder
- **Location**: recovery policy
- **Description**: create a tiered response: nudge, inspect, rehydrate, reroute, escalate, abandon.
- **Dependencies**: Task 4.2
- **Acceptance Criteria**:
  - every stalled lane has a next recovery action
  - babysitter never loops endlessly without escalation
- **Validation**:
  - stalled lane example can be walked through to a bounded resolution

### Task 4.4: Detect cold-channel decay
- **Location**: channel-health policy
- **Description**: if a lane or channel meant to reflect active work goes cold while work is supposedly active, flag it for reconciliation.
- **Dependencies**: Task 4.2
- **Acceptance Criteria**:
  - “active but silent” is treated as suspicious, not healthy
- **Validation**:
  - synthetic example produces a channel-cold alert

## Sprint 5: Reconcile EMA and Host
**Goal**: ensure summaries and actual execution state stay aligned.  
**Demo/Validation**:
- host and EMA divergence can be detected and corrected
- reconciliations are cheap and repeatable
- restart after interruption can recover from EMA + host alone

### Task 5.1: Define reconciliation queries
- **Location**: reconciliation playbook
- **Description**: define the minimum set of questions to compare EMA summary vs host truth.
- **Dependencies**: Sprint 4 complete
- **Acceptance Criteria**:
  - questions identify stale summaries, zombie work, and missing host evidence
- **Validation**:
  - sample divergence is correctly classified

### Task 5.2: Define conflict resolution policy
- **Location**: reconciliation policy
- **Description**: establish what wins when EMA and host disagree, and when human review is required.
- **Dependencies**: Task 5.1
- **Acceptance Criteria**:
  - host is default execution truth
  - EMA is corrected or refreshed after resolution
- **Validation**:
  - contradictory-lane case resolves deterministically

### Task 5.3: Add periodic checkpointing
- **Location**: EMA write policy / babysitter cadence
- **Description**: checkpoint only on meaningful transitions, recovery events, and priority changes.
- **Dependencies**: Task 5.2
- **Acceptance Criteria**:
  - checkpointing preserves continuity without flooding the system
- **Validation**:
  - one work cycle generates bounded, useful checkpoints

## Sprint 6: Controlled Restart + Observation
**Goal**: restart the engine, observe behavior, and tune thresholds before full rollout.  
**Demo/Validation**:
- one supervised restart completes
- at least one lane reaches completion
- at least one stalled lane is successfully recovered or escalated

### Task 6.1: Start with a limited set of lanes
- **Location**: rollout checklist
- **Description**: restart with a small, representative slice rather than everything at once.
- **Dependencies**: Sprint 5 complete
- **Acceptance Criteria**:
  - pilot lanes cover at least one normal flow and one likely-problem flow
- **Validation**:
  - pilot can be monitored end-to-end

### Task 6.2: Observe babysitter interventions
- **Location**: ops log / telemetry summary
- **Description**: record what the babysitter notices, how it reacts, and whether those reactions help.
- **Dependencies**: Task 6.1
- **Acceptance Criteria**:
  - interventions are not purely cosmetic
  - false positives/negatives are logged
- **Validation**:
  - post-run review identifies threshold adjustments

### Task 6.3: Expand to full lane set
- **Location**: rollout plan
- **Description**: after pilot success, progressively attach remaining orchestrators and channels.
- **Dependencies**: Task 6.2
- **Acceptance Criteria**:
  - expansion order is documented
  - high-risk lanes are attached last or with guardrails
- **Validation**:
  - no uncontrolled spike in noise, stalls, or duplicate ownership

## Continuous Progress Contract

Every active orchestrator update should include, at minimum:
- **intent**: what it is trying to do now
- **action**: what changed since last update
- **blocker**: what is preventing forward movement, if anything
- **next step**: the immediate continuation step
- **escalation target**: where the issue goes if it cannot proceed

Every babysitter review should be able to answer:
- which lanes are moving?
- which lanes only look busy?
- what is stalled?
- what is the cheapest intervention with the biggest unlock?
- where does the human need to decide?

## Metrics

Track a small set of useful metrics:
- active lane count
- stalled lane count
- median time since last meaningful progress
- recovery success rate
- human escalation count
- EMA/host divergence count
- noisy-update ratio
- completion throughput per period

## Testing Strategy

- simulate at least one healthy lane, one dependency-blocked lane, one orphan lane, and one zombie lane
- test active → stalled → recovery transitions
- test disagreement between EMA and host
- test cold-channel detection
- test handoff between orchestrators
- verify that summaries remain compact and rehydratable

## Potential Risks & Gotchas

- **Duplicate authority**: two babysitters make contradictory decisions.
  - Mitigation: explicit authority election / canonical owner marker.

- **Progress theater**: lots of updates with no real work completed.
  - Mitigation: strict “meaningful progress” definition.

- **EMA drift**: summaries become stale and misleading.
  - Mitigation: host-backed reconciliation and bounded checkpoint rules.

- **Over-escalation**: babysitter becomes noisy and distracting.
  - Mitigation: tiered recovery ladder and lane-type-specific stall windows.

- **Under-escalation**: dead lanes remain quietly dead.
  - Mitigation: cold-lane/cold-channel detection and max silence thresholds.

- **Context bloat**: Karger model becomes too verbose to be useful.
  - Mitigation: enforce compact lane context template.

- **Human trust erosion**: system appears active but needs constant rescue.
  - Mitigation: pilot restart, visible metrics, and honest degraded-state signaling.

## Rollback Plan

If the restart produces too much noise or unstable supervision:
- reduce to a minimal set of pilot lanes
- disable secondary/experimental orchestrators
- retain host truth collection
- continue EMA checkpointing only for critical lanes
- route all unresolved decisions back to human control tower
- revise thresholds before re-expansion

## Immediate Next Actions

1. Confirm canonical babysitter authority.
2. Enumerate current intended orchestrators and lane set.
3. Decide the exact EMA attachment mechanism and schema location.
4. Draft the lane schema + Karger context template.
5. Pilot restart on a narrow lane subset.

## Open Questions

1. What exactly is the current implementation of EMA in this stack: file-backed summaries, channel-backed memory, service/API, or hybrid?
2. What are the named orchestrators/lane categories we are resuming right now?
3. Do you want this next turned into an executable artifact set (schemas, templates, cadence rules, and a rollout checklist), or kept at the control-spec level first?

# Plan: EMA Host-Reality Realignment

**Generated**: 2026-04-06 UTC
**Estimated Complexity**: High

## Overview

Re-anchor EMA and the surrounding orchestration stack to the **actual host machine state** instead of the speculative architecture. The goal is to stop operational bleeding, establish one trustworthy execution path, reduce reality drift between docs/code/runtime, and only then resume higher-order orchestration work.

This plan is based on current host evidence:
- `openclaw status` shows the gateway service is running but local probe auth/reachability is still awkward, stale plugin config exists, and the security posture is intentionally very open/risky in group contexts.
- Dispatch is active and clearly real (`~/dispatch/*`, `dispatch.db`, queue/done/results churn).
- A live bug is causing repeated empty failed files for `vault-improve-*` tasks in `~/dispatch/failed/` while the same queue family remains present.
- EMA is live-ish but dirty: uncommitted tracked changes, many generated/untracked artifacts, local DBs, FTS DBs, crash dump, new docs, and a likely split between canonical runtime state and design intent.
- A Next.js surface is up on `:3200`; EMA daemon-related ports expected in docs were not visibly listening in this snapshot.

## Planning Assumptions

- We should optimize for **operational truth**, not elegance.
- We should not add major new product surfaces until the base loop is reliable.
- Existing live systems (`~/dispatch`, OpenClaw main session, EMA repo state, vault loops) are the primary evidence.
- Security hardening matters, but only after stabilizing the control loop enough that changes are safe and understandable.

## Prerequisites

- Access to:
  - `~/dispatch`
  - `~/Projects/ema`
  - OpenClaw config/status/logs
- Ability to run local diagnostics and edit repo/docs/config
- Agreement that this phase is **stabilization and truth-reconciliation**, not net-new feature expansion

---

## Sprint 1: Stop the bleeding and capture operational truth
**Goal**: Eliminate active pathological loops and create a trustworthy, evidence-based map of what is running.

**Demo/Validation**:
- No repeated empty `vault-improve-*` failure churn for at least 2 dispatch cycles
- One short ops note exists describing current live services, queues, and known failure modes
- Can answer: “what is actually running?” in one place

### Task 1.1: Freeze and classify the dispatch failure loop
- **Location**: `~/dispatch/queue`, `~/dispatch/failed`, `~/dispatch/results`, dispatch engine scripts/log sources
- **Description**: Inspect the exact `vault-improve-20260406-040006-*` flow and determine where valid queued tasks become empty failed JSON files.
- **Dependencies**: None
- **Acceptance Criteria**:
  - Exact failing transition is identified
  - Root cause is classified as one of: malformed write, move/copy bug, truncation, concurrent writer, cleanup bug, worker crash path
  - One short incident note is written with timestamps and artifact paths
- **Validation**:
  - Reproduce on a single failing task or prove from logs/artifacts

### Task 1.2: Patch dispatch handling for malformed/empty task files
- **Location**: dispatch engine script(s) and any helper scripts touching queue/failed transitions
- **Description**: Add defensive handling so empty/invalid task JSONs do not get endlessly reprocessed. Quarantine them with explicit reason and stop retry storms.
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - Empty task files are moved into an explicit quarantine/failure state once
  - Dispatcher logs include the reason and source path
  - Repeated minute-by-minute churn stops
- **Validation**:
  - Run at least 2 dispatch cycles after patching
  - Confirm file count and timestamps stop changing for the same bad task

### Task 1.3: Produce a host-reality inventory
- **Location**: likely `~/Projects/ema/docs/` or an ops note in vault/workspace
- **Description**: Create a concise inventory of live components: OpenClaw gateway, active bot/processes, dispatch loop, Next.js surface on `:3200`, EMA daemon state if any, DB artifacts, and active queues.
- **Dependencies**: None
- **Acceptance Criteria**:
  - Inventory distinguishes “running”, “installed but inactive”, and “spec-only / expected but not observed”
  - Inventory includes ports, processes, and canonical paths
- **Validation**:
  - Another person could use the note to understand the current machine state in <5 minutes

### Task 1.4: Verify end-to-end research/agent execution health
- **Location**: OpenClaw status/logs, dispatch logs, researcher task outputs
- **Description**: Re-test one representative research/automation task from queue -> execution -> result -> done/fail path.
- **Dependencies**: Task 1.2
- **Acceptance Criteria**:
  - One real task completes cleanly end-to-end
  - If it fails, failure point is precisely identified (auth, tool, posting, runner, env)
- **Validation**:
  - Save logs/result artifact and summarize outcome

---

## Sprint 2: Choose canonical truths
**Goal**: End split-brain behavior in execution state and knowledge retrieval.

**Demo/Validation**:
- A written decision record exists for operational state and retrieval/search source of truth
- At least one duplicate/ambiguous path is explicitly deprecated or marked secondary

### Task 2.1: Decide the canonical execution state store
- **Location**: EMA docs + relevant runtime/config paths
- **Description**: Compare `~/dispatch/dispatch.db`, EMA daemon DB(s), and any other task/execution stores. Decide which one is currently authoritative.
- **Dependencies**: Sprint 1 inventory
- **Acceptance Criteria**:
  - Decision recorded as “primary / derived / deprecated” per store
  - Short migration posture defined: stabilize-now vs migrate-later
- **Validation**:
  - Can answer “where should a task’s true status be read from right now?” with one sentence

### Task 2.2: Decide the canonical knowledge + retrieval path
- **Location**: EMA docs, second-brain FTS paths, wiki engine docs, vault indexing paths
- **Description**: Reconcile vault content, second-brain FTS, wiki-engine, QMD-style retrieval, and MCP surfaces into one primary content source and one primary retrieval/index source.
- **Dependencies**: Sprint 1 inventory
- **Acceptance Criteria**:
  - Canonical content source is named
  - Canonical retrieval/index path is named
  - Secondary/legacy systems are tagged as derived, experimental, or deprecated
- **Validation**:
  - New work can reference a single recommended read path and a single recommended search path

### Task 2.3: Write a “what is real” architecture note
- **Location**: `~/Projects/ema/docs/ARCHITECTURE.md` or adjacent note
- **Description**: Update documentation so the first thing a future reader sees is the as-built runtime truth, not the aspirational roadmap.
- **Dependencies**: Tasks 2.1–2.2
- **Acceptance Criteria**:
  - The note clearly separates: live now / partially live / roadmap/spec
  - Contradictory claims are removed or clearly labeled
- **Validation**:
  - Cross-check 3 current runtime facts against the updated note

---

## Sprint 3: Reduce repo and runtime ambiguity
**Goal**: Clean the EMA workspace enough that changes, failures, and runtime effects are legible again.

**Demo/Validation**:
- EMA repo has a clear ignore policy and artifact policy
- Runtime/generated files are separated from source intent
- Current branch state is understandable at a glance

### Task 3.1: Classify EMA repo dirtiness
- **Location**: `~/Projects/ema/.gitignore`, repo root, `daemon/priv`, docs, generated dirs
- **Description**: Sort current untracked/modified files into: source changes, generated artifacts, local databases, crash outputs, experimental subprojects, and docs.
- **Dependencies**: None
- **Acceptance Criteria**:
  - Each major untracked cluster has a category and disposition
  - A cleanup policy is proposed before destructive cleanup happens
- **Validation**:
  - `git status` becomes interpretable, even if not yet clean

### Task 3.2: Add or fix ignore/exclusion boundaries
- **Location**: `~/Projects/ema/.gitignore` and possibly repo-local tooling configs
- **Description**: Ensure DBs, WAL/SHM files, crash dumps, dependency trees, and other local-only artifacts stop obscuring actual code changes.
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - Generated/runtime artifacts no longer dominate `git status`
  - Important local-only files remain preserved on disk but stop appearing as source drift
- **Validation**:
  - Re-run `git status` and confirm reduced noise

### Task 3.3: Quarantine experimental subtrees that are not in the critical path
- **Location**: e.g. `claudeforge/`, `wiki-engine/`, `.expert/`, `.serena/` as applicable
- **Description**: Mark which trees are active dependencies vs side experiments. Don’t delete; label and isolate.
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - Every major subtree has one of: core / supporting / experimental / archived-candidate
- **Validation**:
  - A future implementer can tell what not to touch during stabilization

---

## Sprint 4: Rebuild the orchestration plan around live host context
**Goal**: Refigure the orchestration/babysitter/session plan from the machine that exists, not the machine imagined in roadmap docs.

**Demo/Validation**:
- A revised orchestration design exists that starts from current OpenClaw + dispatch + EMA + vault reality
- The plan explicitly names what will *not* be built yet

### Task 4.1: Define the minimum viable control loop
- **Location**: orchestration design note / plan doc
- **Description**: Specify the narrow core loop that must be reliable first: ingest -> classify -> execute -> observe -> surface result.
- **Dependencies**: Sprints 1–3
- **Acceptance Criteria**:
  - Inputs, outputs, failure states, and ownership of each stage are defined
  - Only existing or near-existing components are used
- **Validation**:
  - Can simulate a representative task through the loop on paper without handwaving

### Task 4.2: Re-scope babysitter responsibilities
- **Location**: EMA/OpenClaw orchestration docs
- **Description**: Constrain babysitter to signal, anomaly detection, and escalation instead of sprawling into too many execution-path responsibilities.
- **Dependencies**: Task 4.1
- **Acceptance Criteria**:
  - Babysitter responsibilities and non-responsibilities are explicit
  - Escalation triggers are listed
- **Validation**:
  - At least 3 real failure classes map cleanly to babysitter behaviors

### Task 4.3: Re-scope orchestration from host evidence
- **Location**: orchestration design note
- **Description**: Rework the system plan so it begins from the current reality: OpenClaw group sessions, dispatch queue, EMA repo, vault loops, and live surfaces.
- **Dependencies**: Tasks 4.1–4.2
- **Acceptance Criteria**:
  - The plan no longer assumes unverified daemon capabilities as if they are done
  - Dependencies are grounded in observed services and repos
- **Validation**:
  - Every major component in the plan is either observed live or clearly labeled as future work

---

## Sprint 5: Session boundaries and context hygiene
**Goal**: Fix one of the deepest leverage points: context contamination and unclear session roles.

**Demo/Validation**:
- Session classes and allowed context sources are explicitly defined
- There is a pruning/summarization policy that can be applied consistently

### Task 5.1: Define session classes
- **Location**: session/orchestration docs
- **Description**: Separate main-chat, group-chat, operator, daemon-generated, research, coding, and babysitter sessions by purpose and allowed memory/context.
- **Dependencies**: Sprint 4
- **Acceptance Criteria**:
  - Each class has: purpose, allowed tools, allowed memory sources, escalation path, expected tone/output style
- **Validation**:
  - 5 real recent sessions can be classified unambiguously

### Task 5.2: Define context injection and pruning policy
- **Location**: session/orchestration docs, possibly prompt/runtime config
- **Description**: Set explicit rules for what gets injected, summarized, dropped, cached, or linked by reference.
- **Dependencies**: Task 5.1
- **Acceptance Criteria**:
  - Policy includes max context heuristics, summarization triggers, and vault/session inclusion rules
  - Group contexts are explicitly stricter than direct contexts
- **Validation**:
  - One noisy real thread can be mapped to the new pruning policy

### Task 5.3: Add continuity artifacts where needed
- **Location**: repo/workspace docs such as `CONTINUE.md`, runbooks, per-system notes
- **Description**: Ensure critical systems use lightweight continuity artifacts so work can resume without relying on long conversational state.
- **Dependencies**: Task 5.2
- **Acceptance Criteria**:
  - Critical execution paths have a known handoff/resume artifact
- **Validation**:
  - A resumed session can pick up from disk notes rather than transcript archaeology

---

## Sprint 6: Resume forward product work, selectively
**Goal**: Only after stabilization, resume the highest-value feature work with reduced risk.

**Demo/Validation**:
- One forward feature is chosen because it reinforces the stabilized core loop
- Lower-priority speculative features stay deferred

### Task 6.1: Re-rank pending EMA features by dependence on stable truth
- **Location**: roadmap / sprint planning docs
- **Description**: Re-rank Dispatch Board, Deliberation Gate, Scope Advisor, Honcho integration, surface governor work, etc. based on whether they depend on stable execution state and clean session boundaries.
- **Dependencies**: Sprints 1–5
- **Acceptance Criteria**:
  - One ordered list exists: do now / do next / defer
- **Validation**:
  - Each priority call references a stabilized dependency or lack thereof

### Task 6.2: Select one next implementation target
- **Location**: roadmap / implementation backlog
- **Description**: Pick the single best next build target after stabilization—likely one that improves reliability/guardrails rather than adding flashy new surfaces.
- **Dependencies**: Task 6.1
- **Acceptance Criteria**:
  - Chosen target has clear justification and readiness checklist
- **Validation**:
  - The target can be started without reopening split-brain questions from prior sprints

---

## Testing Strategy

- **Ops validation**: observe multiple dispatch cycles; confirm no churn storms
- **Truth validation**: reconcile docs against actual running processes/ports/files
- **Repo validation**: re-run `git status` and ensure source drift is legible
- **Loop validation**: run a representative task through queue -> execution -> result -> final state
- **Session validation**: classify recent real conversations under the new session model

## Potential Risks & Gotchas

- The dispatch bug may be a concurrency issue, not a simple empty-file bug
- EMA docs may contain recent high-quality thinking that still outruns implementation reality; correcting them may feel like “losing progress” even when it’s actually reducing hallucinated certainty
- The true operational state may be split across OpenClaw, `~/dispatch`, and EMA local DBs in ways that are politically inconvenient but technically real
- Security cleanup is needed, but doing it too early could break already-fragile operator workflows
- Some noisy untracked EMA files may actually be important local state; cleanup must start with classification, not deletion
- The revised plan depends on accepting that some roadmap work should pause

## Rollback Plan

- For dispatch fixes: keep pre-change copies of scripts/config; be able to restore prior dispatcher behavior if new handling blocks valid tasks
- For docs/architecture changes: preserve prior drafts in git history or adjacent archival notes
- For repo cleanup: only ignore/quarantine first; avoid deletion during the stabilization phase
- For session/context policy: apply as documentation and operator practice before hard enforcement

## Immediate Recommended Execution Order

1. Investigate and patch the `vault-improve-*` dispatch failure loop
2. Write the host-reality inventory note
3. Validate one clean end-to-end task execution
4. Decide canonical execution state store
5. Decide canonical knowledge/retrieval path
6. Update EMA architecture docs to reflect as-built truth
7. Reduce repo artifact noise with ignore/quarantine boundaries
8. Re-cut the orchestration/babysitter design from the live host reality
9. Define session classes and pruning policy
10. Only then choose the next implementation target

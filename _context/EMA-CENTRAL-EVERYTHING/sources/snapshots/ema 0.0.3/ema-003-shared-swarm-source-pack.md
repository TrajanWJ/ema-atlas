# EMA 0.0.3 Shared Swarm Source Pack

Related docs:
- [EMA 0.0.3 Workboard](/Users/tawj/Desktop/ema 0.0.3/ema-003-workboard.md)
- [EMA 0.0.3 Shared Agent Swarm Workspace](/Users/tawj/Desktop/ema 0.0.3/ema-003-shared-agent-swarm-workspace.md)
- [EMA 0.0.3 GitHub Cross-Pollination Map](/Users/tawj/Desktop/ema 0.0.3/ema-003-github-cross-pollination-map.md)
- [Transfer Pack System Graph](</Users/tawj/Desktop/ema 0.0.3/ema-transfer-pack-20260422-060938/SYSTEM_GRAPH.md>)

## 1. Purpose

This file is the evidence pack for the shared swarm workspace pass. It is where reusable swarm patterns, EMA workspace evidence, and planner/calendar donor concepts should be consolidated before they are promoted into canonical EMA objects.

## 2. Source Clusters

### Cluster A — Swarm Routine Discipline

Inputs:
- `proslync-swarm-dispatch` skill

Looking for:
- lane registry patterns
- claim/hold lifecycle
- handoff structure
- planner/control-tower duties
- drift-audit concepts

### Cluster B — EMA Workspace / Orchestration Evidence

Inputs:
- `SYSTEM_GRAPH.md`
- `graph/edges/workspace.md`
- `graph/edges/orchestration.md`
- `04-agent-orchestration-and-shared-workspace-briefing.md`
- `05-fresh-context-project-app-model.md`

Looking for:
- confirmed shared artifact types
- control-plane vs workspace relationship
- task/proposal/execution linkage
- support for queues/roles/checkups/calendar

### Cluster C — Planner / Calendar / Executive Donors

Inputs:
- fresh context on agent virtual environment app
- `codebase-executive`
- `codebase-multi-agent-expirements`

Looking for:
- responsibilities objects
- time-block / focus semantics
- weekly phases
- self-paced calendar behaviors
- review/checkup loops

## 3. Promotion Targets

Candidate canonical EMA objects:
- `lane`
- `lane_claim`
- `handoff`
- `queue_item`
- `responsibility`
- `calendar_block`
- `cadence_policy`
- `weekly_phase`
- `checkup`

## 4. Notes

- Keep raw source patterns separate from promoted EMA semantics.
- Prefer object names that fit the existing `project -> space -> workstream -> task/execution` model.
- Avoid importing process rituals that should become actual shared workspace state.

## 5. Confirmed Evidence Already In Hand

### 5.1 From swarm routine discipline

- Explicit lane registry patterns exist.
- Explicit claim/hold lifecycle exists.
- Explicit handoff structure exists.
- Planner/control-tower upkeep is treated as a real operating responsibility.
- Backlog, calendar, readiness, and follow-up are separated instead of collapsed into one list.
- Drift audits are explicit, repeatable checks rather than informal cleanup.

### 5.2 From EMA transfer evidence

- Shared workspace artifacts are meant to be repo-/space-owned, addressable, and linkable to control-plane records.
- Orchestration is supposed to happen through control-plane records + shared workspace artifacts + normalized event streams, not chat scrollback.
- Fresh context explicitly includes:
  - self-dictated schedule
  - weekly phases
  - meetings/checkups
  - project management tools
  - todos
  - notes
  - queues
  - roles
- Existing EMA synthesis already treats schedules/queues/notes as part of durable shared workspace state.

## 6. Strongly Supported Candidate Object Families

- `lane`
- `lane_claim`
- `handoff`
- `queue_item`
- `responsibility`
- `calendar_block`
- `cadence_policy`
- `weekly_phase`
- `checkup`

These are not yet all equally `Confirmed`, but the combined evidence strongly supports them as the right extraction targets for the coordination workspace.

## 7. Adaptation Rules

- Preserve explicit swarm coordination.
- Adapt repo/folder-specific rituals into project/space/workstream-scoped EMA objects.
- Drop any pattern that creates a second authority system outside EMA.

## 8. Open Gaps To Keep Separate

- Exact distinction between `task` and `lane`
- Exact distinction between fixed calendar events and self-paced blocks
- Exact relationship between `responsibility`, `queue_item`, and recurring `checkup`
- Whether planner/control-tower is one app or one view family

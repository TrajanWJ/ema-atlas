# EMA 0.0.3 Implementation Slices

Related docs:
- [EMA 0.0.3 Lineage Architecture Synthesis](/Users/tawj/Desktop/ema 0.0.3/ema-003-lineage-architecture-synthesis.md)
- [EMA 0.0.3 Gleam/BEAM Bounded Contexts](/Users/tawj/Desktop/ema 0.0.3/ema-003-gleam-beam-bounded-contexts.md)
- [EMA 0.0.3 Recovery And Implementation Plan](/Users/tawj/Desktop/ema 0.0.3/ema-003-recovery-and-implementation-plan.md)
- [EMA 0.0.3 Shared Agent Swarm Workspace](/Users/tawj/Desktop/ema 0.0.3/ema-003-shared-agent-swarm-workspace.md)

## 1. Working Priority Order

- First: `ema_identity` and `ema_projects`
- Second: `ema_workstreams`, `ema_coordination`, `ema_threads`, and `ema_knowledge`
- Third: `ema_exec_control` and `ema_harness`
- Hold until later: `ema_shell` and `ema_replication`

## 2. Why This Order

- Project/org/space/dataset membership is the hard authority boundary.
- Shared workspace continuity must exist before surfaces become trustworthy.
- Execution needs EMA-owned records before Hermes-native dispatch becomes canonical.
- Shells should render authoritative state, not define it.
- Replication should wait until single-node semantics are crisp.

## 3. First Schema Families

### Identity And Scope

- `organizations`
- `projects`
- `spaces`
- `datasets`
- `users`
- `actors`
- `devices`
- `memberships`
- `role_assignments`

### Shared Workspace And Coordination

- `workstreams`
- `tasks`
- `lanes`
- `lane_claims`
- `handoffs`
- `queue_items`
- `responsibilities`
- `calendar_blocks`
- `cadence_policies`
- `weekly_phases`
- `checkups`

### Collaboration

- `threads`
- `messages`
- `message_events`
- `wiki_nodes`
- `wiki_revisions`
- `comments`
- `reference_edges`
- `blueprint_nodes`

### Execution

- `proposals`
- `executions`
- `execution_events`
- `outcomes`
- `approvals`
- `session_bindings`
- `engine_targets`
- `executor_bindings`

## 4. First Durable Event Streams

- `thread_events`
- `wiki_events`
- `execution_events`

Candidate event names for discussion:

- `ProjectCreated`
- `MembershipGranted`
- `WorkstreamOpened`
- `TaskCreated`
- `LaneClaimed`
- `HandoffIssued`
- `ThreadCreated`
- `MessageAppended`
- `WikiNodeCreated`
- `WikiRevisionAppended`
- `ExecutionRecordCreated`
- `ExecutionDispatched`
- `ExecutionEventObserved`
- `ExecutionCompleted`

## 5. Best Donor Sources To Mine Next

- `codebase-ema`
  - daemon core
  - control plane
  - sessions
  - Hermes surface seam
  - workspace/shared artifacts
- `lineage-original-elixir-ema`
  - predecessor control-plane and session patterns
- `docs-clis-mcps-integrations`
  - driver registry and provider abstraction donor
- `codebase-claudeforge`
  - surface to Hermes seam and session continuity donor
- `lineage-openclaw-agent-workspaces`
  - durable shared workspace artifact shapes
- `design-review-fresh-context`
  - current product framing
- `docs-ema-next-steps`
  - current planning/spec pressure
- `docs-vault-wiki`
  - knowledge/wiki donor pack

## 6. Highest-Risk Open Questions

- Are agents first-class org/project/space members?
- Does collaboration state live inside one event log or beside it?
- What is the exact project-to-space cardinality?
- Where does personal AI execution actually run?
- How should runtime/tool permissions map across users, agents, and drivers?
- Which IDs must remain separate across workstream, thread, session, and execution?

## 7. Practical Next Build Slice

- implement identity/project/space membership first
- attach workstreams as continuity objects
- add thread + wiki + handoff persistence
- add execution record creation and Hermes dispatch binding after the record exists

## 8. Guardrails

- Do not let shell/UI work outrun authority semantics.
- Do not merge coordination state into generic tasks.
- Do not let execution truth collapse into chat history.
- Do not settle replication before local authority and collaboration semantics are stable.

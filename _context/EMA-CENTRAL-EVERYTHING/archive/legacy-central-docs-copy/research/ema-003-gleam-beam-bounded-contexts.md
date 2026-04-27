# EMA 0.0.3 Gleam/BEAM Bounded Contexts

Related docs:
- [EMA 0.0.3 Knowledge Graph Hub](/Users/tawj/Desktop/ema 0.0.3/ema-003-knowledge-graph-hub.md)
- [EMA 0.0.3 Lineage Architecture Synthesis](/Users/tawj/Desktop/ema 0.0.3/ema-003-lineage-architecture-synthesis.md)
- [EMA 0.0.3 Recovery And Implementation Plan](/Users/tawj/Desktop/ema 0.0.3/ema-003-recovery-and-implementation-plan.md)
- [EMA 0.0.3 GitHub Cross-Pollination Map](/Users/tawj/Desktop/ema 0.0.3/ema-003-github-cross-pollination-map.md)
- [EMA 0.0.3 Shared Agent Swarm Workspace](/Users/tawj/Desktop/ema 0.0.3/ema-003-shared-agent-swarm-workspace.md)
- [Transfer Pack Root](</Users/tawj/Desktop/ema 0.0.3/ema-transfer-pack-20260422-060938/README.md>)

Semantic anchors:
- `bounded_context`
- `otp_app`
- `ema_identity`
- `ema_projects`
- `ema_workstreams`
- `ema_threads`
- `ema_knowledge`
- `ema_exec_control`
- `ema_harness`
- `ema_shell`
- `ema_replication`
- `virtual_desktop`

## 1. Core Direction

- `Confirmed`: EMA owns truth.
- `Confirmed`: Hermes owns execution.
- `Confirmed`: surfaces do not own state.
- `Confirmed`: every EMA instance lives inside a `Project`.
- `Confirmed`: projects can be personal or belong to an `Organization`.
- `Confirmed`: projects contain `Spaces` and `Datasets`.
- `Confirmed`: personal AI can access all projects/spaces the user belongs to.
- `Confirmed`: the virtual desktop is a first-class shell, available either:
  - in the browser like `place.org`
  - or as a native desktop window that preserves the same shell semantics
- `Inferred`: the right 0.0.3 implementation stance is **Gleam on the BEAM first, one canonical daemon, thin surfaces**.

## 2. Runtime Stance

- `Inferred`: EMA 0.0.3 should be a BEAM system made of small OTP applications, not one large mixed-responsibility service.
- `Inferred`: Gleam should own the canonical domain modules and service boundaries.
- `Inferred`: Phoenix can still be used as a surface transport if wanted, but the domain must stay framework-independent.
- `Inferred`: the browser desktop and the native desktop window should both bind to the same shell APIs, workspace APIs, and event streams.
- `Inferred`: P2P should begin as peer-aware replication and execution placement, not equal-authority orchestration.

## 3. Suggested OTP App Layout

- `ema_identity`
  - users, actors, devices, memberships, auth context
- `ema_projects`
  - organizations, projects, spaces, datasets, app instances
- `ema_workstreams`
  - workstreams, tasks, thread bindings, activity continuity
- `ema_coordination`
  - lanes, handoffs, queue items, planner state, cadence, calendar blocks, checkups
- `ema_threads`
  - threads, messages, reactions, bridge metadata, visibility
- `ema_knowledge`
  - wiki nodes, comments, references, blueprint nodes, semantic metadata
- `ema_files`
  - file manifests, blob refs, virtual/host boundary metadata
- `ema_exec_control`
  - proposals, executions, outcomes, approvals, event ledger
- `ema_harness`
  - Hermes bridge, driver registry, session bindings, runtime adapters
- `ema_shell`
  - launchpad registry, HQ cards, desktop window state, app layouts
- `ema_replication`
  - peers, replica policy, sync cursors, delta exchange
- `ema_api`
  - HTTP, websocket, RPC, auth/session edge
- `ema_web`
  - browser shell and app surfaces

## 4. Canonical Bounded Contexts

### 4.1 Identity Context

Owns:
- `user`
- `actor`
- `personal_ai_binding`
- `device`
- `membership`
- `role_assignment`

Rules:
- `Inferred`: `Actor` is the canonical principal abstraction for human, agent, personal AI, and service identities.
- `Inferred`: personal AI is not a magical global root user; it is an actor bound to a human principal plus membership-derived grants.
- `Inferred`: writes outside the active project/space require explicit target selection and policy checks.

### 4.2 Projects Context

Owns:
- `organization`
- `project`
- `space`
- `dataset`
- `app_instance`

Rules:
- `Confirmed`: project is the hard authority boundary for an EMA instance.
- `Inferred`: space is the default collaboration and replication boundary inside a project.
- `Inferred`: datasets belong to projects and may be exposed to spaces by policy.

### 4.3 Workstreams Context

Owns:
- `workstream`
- `task`
- `focus_state`
- `assignment`
- `chronicle_entry`

Rules:
- `Inferred`: workstream is the continuity object across threads, chat, wiki, files, blueprint, and executions.
- `Inferred`: tasks are not runs; they are intent/coordination objects that may produce executions.

### 4.4 Threads Context

Owns:
- `thread`
- `message`
- `reaction`
- `message_edit`
- `bridge_binding`

Rules:
- `Inferred`: threads are first-class collaboration objects, not just provider chat exhaust.
- `Inferred`: messages should be append-oriented with explicit edit/delete/reaction events.
- `Inferred`: Discord bridge state belongs here as migration metadata, not as the canonical conversation model.

### 4.5 Coordination Context

Owns:
- `lane`
- `lane_claim`
- `handoff`
- `queue_item`
- `cadence_policy`
- `calendar_block`
- `checkup`
- `weekly_phase`
- `responsibility`

Rules:
- `Inferred`: EMA should preserve the useful swarm discipline from Autharis/Proslync without importing multiple competing authorities.
- `Inferred`: lanes, handoffs, and planner/control-tower state are shared workspace objects, not just chat conventions.
- `Inferred`: self-paced virtual calendar logic should support cadence windows, weekly phases, and checkups, not only fixed external events.
- `Inferred`: one actor should own a lane claim at a time; cross-project or cross-space work should route through explicit handoff objects.

### 4.6 Knowledge Context

Owns:
- `wiki_node`
- `wiki_revision`
- `comment`
- `reference_edge`
- `blueprint_node`
- `semantic_tag`

Rules:
- `Inferred`: wiki is the semantic layer for the shared human-agent workspace.
- `Inferred`: blueprint builder should be a structured planning layer on top of wiki objects, not a separate authority island.
- `Inferred`: canvas can later live here or beside it as collaborative object-graph state.

### 4.7 Files Context

Owns:
- `file_object`
- `file_manifest`
- `blob_ref`
- `filesystem_boundary`
- `host_mount_binding`

Rules:
- `Inferred`: file truth is manifest/version/content-address metadata, not raw browser-local blobs.
- `Inferred`: host filesystem and EMA virtual filesystem must remain explicitly separated and bind through declared mounts.

### 4.8 Execution Control Context

Owns:
- `proposal`
- `execution`
- `execution_event`
- `outcome`
- `approval`

Rules:
- `Confirmed`: EMA creates and owns canonical execution records.
- `Inferred`: execution state should be event-sourced enough to replay lineage and drive UI state.
- `Inferred`: outcomes and approvals stay in EMA even when live execution is happening elsewhere.

### 4.9 Harness Context

Owns:
- `engine_target`
- `engine_run_request`
- `session_binding`
- `driver`
- `executor_binding`

Rules:
- `Confirmed`: Hermes owns live execution, tool invocation, runtime integration, and normalized runtime events.
- `Inferred`: EMA should dispatch into Hermes through a stable harness contract.
- `Inferred`: provider session, Hermes session, surface session, and execution ID must stay distinct.

### 4.10 Shell Context

Owns:
- `shell_profile`
- `launchpad_entry`
- `hq_card`
- `desktop_layout`
- `window_state`
- `surface_binding`

Rules:
- `Confirmed`: Launchpad, HQ, and Virtual Desktop are shell surfaces.
- `Inferred`: browser desktop and native desktop window are two renderings of the same shell model.
- `Inferred`: app/window layout state may be user-scoped and partly ephemeral, but app identity and bindings remain EMA-owned.

### 4.11 Replication Context

Owns:
- `peer`
- `replica_policy`
- `sync_cursor`
- `delta_batch`
- `authority_lease`

Rules:
- `Inferred`: early replication should be space-scoped and lease-based.
- `Inferred`: peers are execution and replica locations, not co-equal truth authorities by default.

## 5. First Schema Concepts

### 5.1 Identity and Scope

- `organizations`
- `projects`
- `spaces`
- `datasets`
- `users`
- `actors`
- `devices`
- `memberships`
- `role_assignments`

Recommended keys:
- `organization_id`
- `project_id`
- `space_id`
- `dataset_id`
- `user_id`
- `actor_id`
- `device_id`
- `membership_id`

### 5.2 Collaboration and Continuity

- `workstreams`
- `tasks`
- `lanes`
- `lane_claims`
- `handoffs`
- `queue_items`
- `cadence_policies`
- `calendar_blocks`
- `checkups`
- `weekly_phases`
- `responsibilities`
- `threads`
- `messages`
- `message_events`
- `wiki_nodes`
- `wiki_revisions`
- `comments`
- `blueprint_nodes`
- `reference_edges`
- `file_objects`
- `file_manifests`

Recommended invariants:
- every `thread`, `wiki_node`, `task`, `execution`, and `file_object` belongs to a `project`
- most collaborative objects should also optionally bind to a `space`
- `workstream_id` should be attachable to all major object families

### 5.3 Execution and Harness

- `proposals`
- `executions`
- `execution_events`
- `outcomes`
- `approvals`
- `session_bindings`
- `engine_targets`
- `executor_bindings`

Recommended execution invariants:
- `execution` is born in EMA before runtime launch
- `session_binding` links:
  - `execution_id`
  - `workstream_id`
  - `thread_id`
  - `provider_session_id`
  - `hermes_session_id`
  - `host_session_id`
  - `peer_id`

### 5.4 Shell and Surfaces

- `app_instances`
- `launchpad_entries`
- `shell_profiles`
- `desktop_layouts`
- `window_states`
- `surface_bindings`

Recommended shell invariant:
- shells do not own canonical task/thread/wiki/execution state; they render and mutate it through EMA IDs.

### 5.5 Replication

- `peers`
- `authority_leases`
- `replica_policies`
- `sync_cursors`
- `delta_batches`

## 6. Suggested Event Streams

- `project_events`
- `membership_events`
- `workstream_events`
- `thread_events`
- `wiki_events`
- `file_events`
- `execution_events`
- `coordination_events`
- `replication_events`
- `shell_events`

`Inferred`: for 0.0.3, the most important durable streams are:
- `thread_events`
- `wiki_events`
- `execution_events`

## 7. Virtual Desktop Model

- `Confirmed`: the Virtual Desktop is a main interface, not a side experiment.
- `Inferred`: it should be implemented as a shell surface over:
  - app registry
  - launch APIs
  - workstream APIs
  - presence/activity feeds
  - layout/window state
- `Inferred`: the browser desktop should work like `place.org` in spirit and topology.
- `Inferred`: the native desktop window should preserve the same app model, command model, and workspace semantics.
- `Inferred`: if there is a native companion, it should add host capabilities, not fork the shell model.

## 8. First 3 Subsystems To Implement

### 8.1 Project Kernel

Build first:
- organization
- project
- space
- dataset
- actor
- membership
- workstream

### 8.2 Coordination + Threads + Wiki

Build second:
- lanes, handoffs, queue items, cadence policy, one calendar block type
- threads/messages/event feed
- one wiki node type with inline comments and references
- provenance on all edits

### 8.3 Hermes-Native Execution Slice

Build third:
- execution
- session_binding
- Hermes run dispatch
- normalized runtime events
- workstream/thread attachment

## 9. Suggested 0.0.3 Module Order

1. `ema_identity`
2. `ema_projects`
3. `ema_workstreams`
4. `ema_coordination`
5. `ema_threads`
6. `ema_knowledge`
7. `ema_exec_control`
8. `ema_harness`
9. `ema_shell`
10. `ema_replication`
11. `ema_web`

## 10. Immediate Architectural Decisions To Lock

1. `Confirmed`: `Project` is the hard app/data boundary.
2. `Inferred`: `Space` is inside `Project` for v1.
3. `Confirmed`: `Execution` is not the same thing as a chat session.
4. `Confirmed`: browser desktop and native desktop are two shells over one model.
5. `Inferred`: Discord is migration/bridge only, not authority.
6. `Inferred`: P2P begins as replication/execution placement, not equal control-plane authorship.

# Lane 3 - Proposed Domain Model and System Design for EMA / Hermes

**Inputs used:** owner constraints plus the transfer pack at `https://github.com/TrajanWJ/ema-transfer-pack-20260422-060938`

## 1. Core doctrine

- **Confirmed:** EMA owns truth. Hermes owns execution. Surfaces do not own state.
- **Confirmed:** Every EMA instance exists within a project.
- **Confirmed:** Projects may be personal or organization-owned.
- **Confirmed:** Projects contain spaces and datasets.
- **Confirmed:** Personal AI can access every project and space the user belongs to.
- **Confirmed:** Shared human-agent workspace is a core product property.
- **Confirmed:** P2P / mesh is strategic.
- **Inferred:** The rewrite should separate three state classes from day one:
  1. control-plane state owned by EMA
  2. collaboration/workspace state owned by EMA
  3. execution/runtime state owned by Hermes and referenced by EMA
- **Inferred:** The safest v1 is a logically centralized control plane per project with explicit peer-aware placement and replication seams, rather than full multi-writer mesh consensus from the start.

## 2. Proposed top-level model

- **Inferred:** The primary containment hierarchy should be:

```text
Global
  User
  Actor
  Personal AI
  Harness registry
  Peer identity
  App manifest registry

Organization (optional owner)
  Projects
  Org policy
  Org membership

Project (required EMA instance boundary)
  Spaces
  Datasets
  Project workspace
  Project actors/memberships
  Executors
  Filesystem mounts
  App installations

Space (collaboration boundary)
  Channels / threads / DMs
  Wiki docs
  Canvases
  Tasks
  Shared workspace objects
  Presence
```

- **Inferred:** A project is the main authority boundary for state, execution policy, filesystem policy, datasets, and app installation.
- **Inferred:** A space is the main collaboration boundary for shared objects, presence, conversation, and agent/human co-work.
- **Speculative:** Over time, some organizations may need cross-project search and policy overlays, but those should compose over project truth rather than replace it.

## 3. Entity proposals

### Organization

- **Confirmed:** Projects can belong to organizations.
- **Inferred:** `organization` is an administrative, billing, and policy boundary, not the primary execution boundary.
- **Inferred:** Core fields:
  - `id`
  - `slug`
  - `name`
  - `status`
  - `default_policy_id`
  - `home_peer_id` for org-level services if needed
  - timestamps
- **Inferred:** Owns:
  - org memberships
  - org roles
  - org policy bundles
  - org-owned projects
  - org-level app entitlements
- **Inferred:** Does not directly own live execution sessions; those are always attached to a project.

### Project

- **Confirmed:** Every EMA instance is within a project.
- **Confirmed:** Projects can be personal or organization-owned.
- **Confirmed:** Projects contain spaces and datasets.
- **Inferred:** `project` is the canonical unit of EMA truth.
- **Inferred:** Core fields:
  - `id`
  - `owner_type` = `personal | organization`
  - `owner_id`
  - `slug`
  - `name`
  - `description`
  - `home_peer_id`
  - `default_space_id`
  - `workspace_root_id`
  - `default_dataset_policy_id`
  - `status`
  - timestamps
- **Inferred:** Owns:
  - spaces
  - datasets
  - project members
  - project-level actors
  - workspaces and shared objects
  - tasks and runs
  - executors and filesystem boundaries
  - app installations
- **Inferred:** Every write to canonical state should be attributable to a project.

### Space

- **Confirmed:** Projects contain spaces.
- **Inferred:** `space` is the default collaboration and visibility boundary inside a project.
- **Inferred:** Core fields:
  - `id`
  - `project_id`
  - `slug`
  - `name`
  - `kind` = `general | team | private | system | dm-hub`
  - `workspace_root_id`
  - `visibility`
  - `archived_at`
  - timestamps
- **Inferred:** Owns:
  - channels
  - threads
  - space-scoped DMs
  - wiki docs
  - canvases
  - tasks
  - presence state
  - local workspace folders/views
- **Inferred:** If an object is "project-wide" but collaboration-facing, store it in a project system space instead of inventing a second object topology.

### Dataset

- **Confirmed:** Projects contain datasets.
- **Inferred:** `dataset` is a governed, addressable project data resource that can be mounted into spaces, runs, docs, or apps.
- **Inferred:** Core fields:
  - `id`
  - `project_id`
  - `name`
  - `kind` = `files | table | embedding | graph | external | replica`
  - `storage_driver`
  - `root_locator`
  - `schema_ref`
  - `policy_id`
  - `sync_mode`
  - timestamps
- **Inferred:** Datasets are project-scoped by default. Spaces get access grants, not ownership.
- **Speculative:** Later, a dataset may support peer replication or local materialization, but its canonical metadata should still live under the project.

### User

- **Inferred:** `user` is the durable human identity across all projects and orgs.
- **Inferred:** Core fields:
  - `id`
  - `handle`
  - `display_name`
  - `primary_email`
  - `status`
  - `personal_project_id`
  - timestamps
- **Inferred:** A user never acts directly in execution or collaboration tables; actions should resolve through an actor identity.

### Actor

- **Inferred:** `actor` is the unified principal abstraction for anything that can appear in workspace or control-plane lineage.
- **Inferred:** Actor types:
  - `human`
  - `agent`
  - `personal_ai`
  - `system`
  - `peer_proxy`
- **Inferred:** Core fields:
  - `id`
  - `type`
  - `user_id` nullable
  - `agent_id` nullable
  - `personal_ai_id` nullable
  - `display_name`
  - `avatar_ref`
  - `status`
  - timestamps
- **Inferred:** Permissions should attach to actor memberships, not directly to users or agents.
- **Inferred:** This keeps humans and agents parallel in channels, docs, tasks, comments, and approvals.

### Agent

- **Confirmed:** The lineage treats agents as session-capable execution participants, not just model calls.
- **Inferred:** `agent` is a non-human actor definition with role, policy, and harness defaults.
- **Inferred:** Core fields:
  - `id`
  - `project_id`
  - `name`
  - `role`
  - `instruction_profile`
  - `default_harness_id`
  - `default_executor_policy_id`
  - `review_policy_id`
  - `status`
  - timestamps
- **Inferred:** Agents should be project-scoped instances because execution rights, datasets, and filesystem access are project-local concerns.
- **Speculative:** Later, org-wide agent blueprints can generate project-scoped agents without making execution rights org-global.

### Personal AI

- **Confirmed:** Personal AI can access all projects and spaces the user belongs to.
- **Inferred:** `personal_ai` is a special actor owned by a single user and projected into every project where that user has membership.
- **Inferred:** Core fields:
  - `id`
  - `owner_user_id`
  - `actor_id`
  - `profile`
  - `memory_policy_id`
  - `default_harness_policy_id`
  - timestamps
- **Inferred:** Personal AI can:
  - read metadata and workspace objects in any project/space where the owner has access
  - search across those memberships
  - propose, summarize, and coordinate across projects
  - create tasks or drafts in a target project/space under its actor identity
- **Inferred:** Personal AI cannot:
  - bypass project or space permissions
  - read datasets or filesystem mounts the owner cannot read
  - execute in a target project unless the target project grants that actor execution rights
  - create hidden cross-project shared state that the target project cannot audit
- **Inferred:** Cross-project memory should be private to the personal AI and owner unless explicitly published back into project state.

### Workspace

- **Confirmed:** Shared human-agent workspace is core.
- **Inferred:** `workspace` is the durable collaboration layer for humans and agents.
- **Inferred:** There should be two levels:
  - project workspace
  - space workspace
- **Inferred:** Workspace contains:
  - tasks
  - plans
  - handoffs
  - notes
  - docs/wiki/canvas links
  - execution references
  - shared workspace views or saved layouts
  - app state objects that are meant to be shared
- **Inferred:** Workspace state is not execution state. It is the durable shared working set.
- **Inferred:** Shared workspace views should be explicit, attributable objects used for saved layouts, handoff-ready work contexts, or team presets, not implicit snapshots of every local desktop state.

### Wiki document

- **Confirmed:** Wiki is a first-class interface concept.
- **Inferred:** `wiki_document` should be a space-scoped collaborative semantic document with block structure and backlinks.
- **Inferred:** Core fields:
  - `id`
  - `space_id`
  - `title`
  - `slug`
  - `workspace_object_id`
  - `head_version_id`
  - `semantic_tags`
  - timestamps
- **Inferred:** Canonical content should be stored as operation log plus snapshots, not plain files.
- **Inferred:** File exports to Markdown should be projections for portability and git compatibility.
- **Inferred:** The semantic layer contract should include:
  - block-level structure with stable IDs
  - backlinks and outbound references as first-class graph edges
  - typed semantic annotations for entities, tasks, decisions, datasets, and intents
  - retrieval metadata that supports search, navigation, and agent grounding without treating chat history as the durable source
- **Inferred:** Inline wiki actions should support three distinct behaviors without collapsing them:
  - `comment` for collaborative discussion anchored to blocks or ranges
  - `edit` for canonical document changes through the op log
  - `prompt` for agent/model interaction that may suggest edits or generate derived artifacts but does not silently overwrite canonical content
- **Inferred:** Blueprint-builder and intent-capture outputs should attach to wiki documents as typed workspace references or embedded semantic blocks, not as a separate hidden truth system.
- **Inferred:** Retrieval and navigation should be able to traverse:
  - document links
  - semantic tags
  - block references
  - attached workspace objects such as tasks, canvases, and runs
- **Confirmed:** Markdown or file views are exports and projections of the semantic wiki state, not the canonical collaboration model.

### Canvas

- **Confirmed:** Canvas collaboration is a core design input.
- **Inferred:** `canvas` should be a space-scoped graph object with nodes, edges, embeds, comments, and selections.
- **Inferred:** Core fields:
  - `id`
  - `space_id`
  - `name`
  - `workspace_object_id`
  - `head_version_id`
  - `view_state`
  - timestamps
- **Inferred:** Canonical state should be evented object operations, not a monolithic JSON blob.

### Thread / channel / DM

- **Confirmed:** EMA should provide EMA-native Discord-like thread/server behavior and mirror Discord during migration.
- **Inferred:** Use one conversation model with `channel` as the base type.
- **Inferred:** Channel kinds:
  - `room`
  - `thread`
  - `dm`
  - `announcement`
  - `system`
- **Inferred:** Core `channel` fields:
  - `id`
  - `project_id`
  - `space_id`
  - `parent_channel_id` nullable
  - `kind`
  - `visibility`
  - `title`
  - `topic`
  - timestamps
- **Inferred:** A thread is a child channel. A DM is a private channel with explicit participant membership. This avoids separate transport semantics.
- **Inferred:** Message objects should reference actor identity, workspace object refs, and run refs, but chat history is never the only durable state.

### Run / task / session

- **Inferred:** These must be distinct.
- **Inferred:** `task`
  - durable work intent in the workspace
  - scoped to a project and usually a space
  - can outlive any execution attempt
- **Inferred:** `run`
  - a control-plane execution attempt against a task or ad hoc request
  - owned by EMA
  - has placement, harness, executor, policy, status, outputs
- **Inferred:** `session`
  - the runtime continuity container used by Hermes or a harness
  - owned operationally by Hermes, referenced canonically by EMA
- **Inferred:** `approval`
  - a durable gate, review, or authorization step attached to a run, task, or policy-controlled action
  - owned by EMA as part of canonical execution lineage, even when humans or agents satisfy it through different surfaces
- **Inferred:** Example fields:
  - `task`: `id`, `project_id`, `space_id`, `title`, `body`, `state`, `assignee_actor_id`
  - `run`: `id`, `task_id`, `project_id`, `space_id`, `initiator_actor_id`, `executor_id`, `harness_id`, `status`, `started_at`, `ended_at`
  - `session`: `id`, `run_id`, `runtime_session_key`, `provider_session_key`, `status`, `last_heartbeat_at`
  - `approval`: `id`, `project_id`, `space_id`, `run_id`, `status`, `required_role`, `resolved_by_actor_id`, `resolved_at`
- **Confirmed:** Identity layers must stay separate.

### Harness

- **Confirmed:** Harness engineering is essential and must be distinct from raw providers.
- **Inferred:** `harness` is the execution adapter contract selected by EMA and executed through Hermes.
- **Inferred:** Examples:
  - `hermes_native`
  - `claude_cli`
  - `codex_cli`
  - `openai_api`
  - `peer_remote`
  - `simulated`
- **Inferred:** Harness registry should be globally defined, with project-level policy overlays.
- **Inferred:** Hermes should implement harness drivers; EMA should select harnesses by policy and capability.

### Executor

- **Inferred:** `executor` is a concrete placement-capable execution endpoint.
- **Inferred:** Executor kinds:
  - `local_daemon`
  - `remote_daemon`
  - `peer_executor`
  - `sandbox_worker`
  - `external_runtime`
- **Inferred:** Core fields:
  - `id`
  - `project_id`
  - `peer_id` nullable
  - `kind`
  - `capability_profile`
  - `auth_profile`
  - `filesystem_boundary_id`
  - `availability`
  - timestamps
- **Inferred:** EMA chooses executor. Hermes executes on it.

### Peer / replica

- **Confirmed:** P2P/mesh is strategic.
- **Inferred:** `peer` is a remote EMA-capable node with stable identity, transport, and capability metadata.
- **Inferred:** `replica` is not a peer. It is a replicated copy of some project or space data on a peer.
- **Inferred:** Core `peer` fields:
  - `id`
  - `node_public_key`
  - `label`
  - `transport_endpoints`
  - `capability_profile`
  - `trust_state`
  - timestamps
- **Inferred:** Core `replica` fields:
  - `id`
  - `project_id`
  - `space_id` nullable
  - `peer_id`
  - `replication_mode`
  - `last_applied_op`
  - timestamps
- **Inferred:** In v1, projects should have a single `home_peer_id` for canonical writes. Replicas follow.
- **Speculative:** Later, some collaboration objects may move to multi-writer replicated modes, but only after per-object conflict semantics are proven.

### Filesystem boundary

- **Confirmed:** Capability locality is real. Shared files app and project-vs-host filesystem switching are product inputs.
- **Inferred:** `filesystem_boundary` is a project-scoped policy object describing what a run or actor can mount and where.
- **Inferred:** Core fields:
  - `id`
  - `project_id`
  - `name`
  - `root_type` = `project | host | dataset | replica`
  - `root_locator`
  - `access_mode`
  - `policy_id`
  - timestamps
- **Inferred:** Canonical workspace objects are not files first. Filesystem projections and mounts are a controlled interface.
- **Inferred:** Every run should receive explicit filesystem grants, never ambient host access by default.

## 4. Scope model

### Globally scoped

- **Inferred:** Global scope should include:
  - users
  - actor identities
  - personal AI identities
  - harness registry
  - peer identities
  - app manifest registry
  - provider definitions and credential references

### Org scoped

- **Inferred:** Org scope should include:
  - org membership
  - org roles and policy bundles
  - org-owned projects
  - org-level app entitlements
  - org audit/reporting views

### Project scoped

- **Confirmed:** Project is the required EMA instance boundary.
- **Inferred:** Project scope should include:
  - spaces
  - datasets
  - project actor memberships
  - workspace roots
  - tasks and runs
  - executors
  - filesystem boundaries
  - app installations
  - mirror configurations

### Space scoped

- **Inferred:** Space scope should include:
  - channels, threads, DMs
  - wiki docs
  - canvases
  - shared tasks and plans
  - presence
  - comments, mentions, notifications
  - collaboration permissions finer than project default

## 5. Personal AI cross-boundary behavior

- **Confirmed:** Personal AI can access every project and space the user belongs to.
- **Inferred:** Treat personal AI as a roaming actor with per-project projected membership.
- **Inferred:** Personal AI read behavior:
  - can index and search all member-accessible projects and spaces
  - can maintain private cross-project memory for the owner
  - can build cross-project summaries and planning views
- **Inferred:** Personal AI write behavior:
  - may write only into a selected project/space context
  - must attribute writes to its actor identity plus owner linkage
  - should require explicit publish/sync steps when moving insight from private memory into shared project truth
- **Inferred:** Personal AI execution behavior:
  - may request runs across accessible projects
  - actual execution must be checked against project policy, dataset grants, and filesystem grants
  - runs remain project-owned even when initiated by personal AI

## 6. Shared workspace state vs execution state

- **Confirmed:** Shared human-agent workspace is core.
- **Confirmed:** EMA owns truth. Hermes owns execution.
- **Inferred:** Shared workspace state is:
  - durable
  - collaborative
  - human-readable
  - agent-readable
  - attributable
  - versioned around meaning and co-work
- **Inferred:** Execution state is:
  - operational
  - harness-specific
  - session-specific
  - stream-oriented
  - frequently ephemeral
- **Inferred:** The rule should be:
  - EMA stores task/run lineage and promoted outputs
  - Hermes stores live session/process/tool continuity
  - workspace stores plans, notes, docs, canvases, and human/agent shared artifacts
  - surfaces render all three but own none
- **Inferred:** A run may emit outputs into workspace objects, but the workspace object is never the run itself.

## 7. Docs/wiki/canvas synchronization

- **Confirmed:** Synchronous docs/wiki/canvas collaboration is core.
- **Inferred:** V1 sync model should be:
  - daemon-authoritative operation log per object
  - snapshotting for fast reads
  - optimistic client editing with operation acknowledgements
  - actor-attributed changes
  - explicit version heads
- **Inferred:** Each object type gets a typed op stream:
  - wiki doc block/text ops
  - canvas node/edge/layout ops
  - comments/mentions/resolution ops
- **Inferred:** Agents edit through the same op API as users. No direct canonical writes through filesystem or Discord adapters.
- **Inferred:** For migration and portability, export derived Markdown/JSON snapshots into project files if needed, but those exports are projections.
- **Speculative:** Once single-node op semantics are solid, peer replication can ship object ops or merged snapshots using CRDT-compatible metadata.

## 8. Discord mirroring during migration

- **Confirmed:** Discord mirroring is transitional, not end-state canonical behavior.
- **Inferred:** EMA-native channels/threads/DMs should be canonical immediately.
- **Inferred:** Introduce a `surface_mirror` adapter with:
  - `surface = discord`
  - `project_id`
  - `space_id`
  - `channel_id`
  - mapping metadata to Discord channel/thread IDs
- **Inferred:** Outbound flow:
  1. EMA records canonical message/event
  2. mirror adapter transforms it
  3. Discord receives mirrored content
- **Inferred:** Inbound flow:
  1. Discord webhook/bot receives message
  2. adapter maps it to an EMA channel/thread
  3. EMA writes a canonical message with `source_surface = discord`
  4. any task/run side effects happen in EMA, not in Discord
- **Inferred:** Reactions, typing, and transient presence can stay best-effort and non-canonical.
- **Inferred:** DMs should not mirror by default unless explicitly configured.
- **Inferred:** During migration, history import should create EMA-native canonical records with Discord IDs stored as foreign refs.

### Threads / Server migration deliverables

- **Confirmed:** Threads / Server is the EMA-native migration path for Discord-like collaboration, not a thin Discord skin.
- **Inferred:** The minimum source-to-target mapping should be:
  - Discord guild/server -> EMA project plus one or more system spaces
  - Discord category -> EMA channel grouping or space-local navigation metadata, not a new authority object
  - Discord text channel -> EMA `channel(kind = room)`
  - Discord thread -> EMA `channel(kind = thread, parent_channel_id = ...)`
  - Discord DM/group DM -> EMA private DM channels only when explicitly imported or mirrored
  - Discord roles/permissions -> project membership, space membership, and channel visibility policies
- **Inferred:** Migration import should cover:
  - channel and thread topology
  - membership and role references needed for visibility reconstruction
  - message history and timestamps
  - attachments and foreign IDs
  - webhook/bot identity mappings where they affect attribution
- **Inferred:** Mirror/runtime behavior should cover:
  - inbound deduplication by external message/event ID
  - outbound idempotent replay protection
  - explicit `source_surface`, `external_id`, and `mirror_state` metadata on mirrored records
  - separation of canonical EMA authorship from mirrored Discord-origin events
- **Inferred:** Transitional features may remain best-effort:
  - typing presence
  - reactions
  - read-state parity
  - cosmetic category ordering
- **Inferred:** Migration is "done enough" when:
  - EMA-native channels and threads can operate without Discord as the primary source of history
  - inbound Discord events are adapters into EMA truth rather than hidden alternate writes
  - imported history is searchable and attributable inside EMA
  - project/space/channel permissions are enforced by EMA even when Discord is still mirrored
  - turning off mirroring does not destroy the canonical thread/server record

## 9. Where P2P / mesh enters the architecture

- **Confirmed:** P2P/mesh is strategic.
- **Inferred:** It should enter in this order:
  1. peer identity and trust
  2. peer executor placement
  3. replica transport for selected project/space data
  4. collaboration op replication
  5. optional multi-writer object modes
- **Inferred:** The first mesh use case should be execution placement, not multi-writer truth.
- **Inferred:** The second mesh use case should be read replicas and offline-capable collaboration views for spaces.
- **Speculative:** Full peer-elected project authority can come later if needed, but it should not block the daemon rewrite.

## 10. What the daemon owns vs what clients own

### Daemon owns

- **Inferred:** The EMA daemon should own:
  - canonical IDs
  - org/project/space topology
  - actor memberships and policies
  - workspace object metadata and op logs
  - task/run lineage
  - executor and harness selection policy
  - filesystem boundary grants
  - mirror mappings
  - peer trust and replica metadata
  - audit history

### Hermes owns

- **Inferred:** Hermes should own:
  - live execution sessions
  - harness driver implementations
  - tool invocation runtime
  - process supervision for runs
  - runtime heartbeats and intermediate outputs

### Clients and surfaces own

- **Inferred:** Clients and surfaces should own only:
  - presentation state
  - local UI preferences
  - temporary drafts until committed
  - local caches
  - viewport/layout/presence hints
- **Confirmed:** Surfaces do not own durable state.

## 11. App ecosystem model inside EMA

- **Confirmed:** The product is explicitly multi-app.
- **Inferred:** Apps should be extensions over canonical EMA objects, not private silos.
- **Inferred:** Add:
  - `app_manifest` as a global registry object
  - `app_installation` as a project-scoped enablement object
  - `app_capability_grant` for project/space access
- **Inferred:** Apps should be able to:
  - register views over tasks/docs/canvas/channels/datasets
  - define project or space object types
  - request harness execution through EMA
  - store project-scoped shared workspace state
- **Inferred:** Apps should not:
  - bypass actor permissions
  - own their own hidden task/run truth
  - write directly around the daemon into canonical stores
- **Inferred:** The minimum app activation model should be:
  - `app_manifest` defines what the app is, what object families it can project, and what capabilities it may request
  - `app_installation` enables the app inside a specific project
  - `app_capability_grant` scopes actual access to project-wide or space-scoped capabilities
- **Inferred:** Installation and grant flow should stay explicit:
  1. an app is selected from the manifest registry
  2. a project installs it through `app_installation`
  3. required capabilities are granted at project or space scope
  4. actors use the app only through those resolved permissions
- **Inferred:** Minimum fields should look like:
  - `app_installation`: `id`, `project_id`, `app_manifest_id`, `status`, `default_entry_space_id`, `installed_by_actor_id`, timestamps
  - `app_capability_grant`: `id`, `app_installation_id`, `scope_type`, `scope_id`, `capability`, `policy_ref`, `granted_by_actor_id`, timestamps
- **Inferred:** Capability grants should cover concrete needs such as:
  - reading or writing specific workspace object families
  - launching harness-backed actions
  - accessing named datasets or filesystem boundaries
  - publishing views into Launchpad, HQ, or Virtual Desktop
- **Inferred:** If an app needs broader access than its current grants allow, EMA should require a visible grant expansion rather than silently widening scope.
- **Confirmed:** This preserves the multi-app model while keeping projects and spaces as the hard boundary.

## 12. Surface projections for HQ / Launchpad / Virtual Desktop

- **Confirmed:** `HQ`, `Launchpad`, and `Virtual Desktop` are top-level EMA surfaces, not decorative wrappers around the same generic dashboard.
- **Confirmed:** These surfaces must serve the same world-model whether rendered in browser or native shell.
- **Inferred:** The safest rule is:
  - surfaces project canonical EMA objects
  - surfaces may store view preferences and continuity hints
  - surfaces may not become hidden owners of task, run, thread, wiki, or dataset truth

### Launchpad

- **Confirmed:** Launchpad is the entry point into work, not another dashboard.
- **Inferred:** Launchpad should project:
  - project selection
  - space selection
  - app installations
  - recent threads/docs/tasks
  - resumable runs and workspace queues
- **Inferred:** Launchpad state should be mostly derived from project memberships, app installations, and workspace recency signals.
- **Inferred:** If Launchpad stores anything durable, it should be limited to actor-scoped preferences such as pins, favorites, and default entry targets.
- **Inferred:** Launchpad should never become the canonical owner of inbox state, task state, or agent execution state.
- **Inferred:** The minimum Launchpad card contract should include:
  - `card_type` such as `project`, `space`, `app`, `recent_object`, or `resumable_run`
  - one canonical target reference
  - one primary action: `open`, `resume`, or `create`
  - recency metadata
  - actor-scoped pin/favorite metadata
  - availability state such as `ready`, `stale`, `missing`, or `permission_blocked`
- **Inferred:** Ordering should be deterministic:
  - pinned items first
  - then explicit defaults
  - then resumable runs/work items by freshest valid activity
  - then recent objects by recency and membership relevance
  - then creation shortcuts
- **Inferred:** Recency should be computed from canonical EMA activity such as last opened workspace object, latest run/session heartbeat, recent task movement, or recent thread/doc activity, then lightly shaped by actor preferences rather than replaced by them.
- **Inferred:** Launchpad actions should stay explicit:
  - `open` enters the target project/space/app/object
  - `resume` returns to an existing run, session, or saved workspace context
  - `create` starts a new task, chat, doc, canvas, or app flow in a chosen project/space
- **Inferred:** Edge handling should be visible rather than magical:
  - stale resumable items should offer reopen-or-discard, not silent resume
  - missing or moved targets should degrade to the nearest valid project/space context
  - permission-blocked cards should remain visible only when useful for orientation, with no hidden bypass
  - sparse or first-launch states should bias toward project choice, app entry points, and create actions instead of empty chrome

### HQ

- **Confirmed:** HQ is the control and coordination layer.
- **Confirmed:** HQ exists both per project and per user.
- **Inferred:** There should be two clear projections:
  - `project HQ` for project-scoped truth such as runs, tasks, approvals, mirrors, repo links, and operational status
  - `personal HQ` for cross-project read views available to the user's memberships and personal AI
- **Inferred:** Personal HQ may aggregate across projects, but any action it takes must resolve back into a target project or space before writing.
- **Inferred:** HQ should be the main place where users regain orientation: what is active, what is blocked, what needs review, and where to return next.
- **Inferred:** HQ should not own separate coordination truth; it should read from canonical workspace, run lineage, and project topology objects.
- **Inferred:** The minimum HQ routing rule should be:
  - `project HQ` may read and act only within its project boundary
  - `personal HQ` may aggregate across memberships but must require a concrete target project/space before any state-changing action
  - cross-project views are orientation surfaces, not hidden cross-project write scopes
- **Inferred:** HQ action types should stay explicit:
  - `inspect` reads runs, tasks, docs, threads, mirrors, and operational signals
  - `route` opens the user into a project, space, thread, task, or app surface
  - `act` creates or updates a canonical object only after target resolution
  - `escalate` creates a handoff, review, or approval request in a specific project context
- **Inferred:** Personal HQ should support cross-project summaries such as:
  - active runs by project
  - blocked items needing owner attention
  - recent agent or teammate movement
  - pending approvals, reviews, or mirrors needing intervention
- **Inferred:** If a cross-project action is ambiguous, HQ should choose the least-drifting move:
  - ask for target selection
  - open a draft scoped to a chosen project
  - or remain read-only
- **Confirmed:** This keeps HQ useful as an operating environment without turning it into a shadow control plane above project truth.

### Virtual Desktop

- **Confirmed:** The virtual desktop is the main working surface.
- **Confirmed:** It can exist in browser and native shell, but it must serve the same world-model.
- **Inferred:** Virtual Desktop should host open apps, threads, docs, canvases, terminals, and agent sessions inside a selected project/space context.
- **Inferred:** Its durable role is continuity of work, not authority over work.
- **Inferred:** The default split should be:
  - canonical/shared state stays in project, space, workspace, task, run, wiki, and channel objects
  - ephemeral layout state stays client-local
  - intentionally shared layouts or saved workspaces publish back into EMA as explicit workspace objects
- **Inferred:** A browser desktop and native desktop should be interchangeable shells over the same EMA objects and Hermes-backed sessions, not separate product modes.
- **Inferred:** The minimum continuity rule should be:
  - open apps, tabs, panes, and window geometry remain local unless explicitly saved
  - active task, thread, doc, canvas, and run references may be restored from canonical EMA objects
  - shared workspace presets or handoff layouts must be published as explicit workspace objects with actor attribution
- **Inferred:** Virtual Desktop restore behavior should prefer:
  - reconnecting to canonical objects and live runs that still exist
  - gracefully degrading when a local pane/session is gone
  - showing the nearest valid project/space context rather than fabricating continuity
- **Inferred:** Native-shell-only capabilities such as local terminals or host tools may exist, but they should attach to the same project/space/run lineage and not create a second desktop truth.
- **Confirmed:** This keeps Virtual Desktop feeling continuous without letting client layout state become a hidden collaboration model.

### Surface operating rule

- **Inferred:** The product loop should stay legible across these surfaces:
  1. Launchpad starts work.
  2. HQ restores orientation and coordination.
  3. Virtual Desktop carries active work and execution continuity.
  4. Wiki, chat, threads, tasks, and runs remain the underlying truth-bearing objects.
- **Confirmed:** This preserves the rule that surfaces do not own state while still letting `HQ`, `Launchpad`, and `Virtual Desktop` feel like first-class EMA experiences.

## 13. Chat surface and harness interaction model

- **Confirmed:** Chat is a first-class EMA surface for live model interaction.
- **Confirmed:** Chat is not the truth layer.
- **Confirmed:** Harness engineering is essential, and EMA may wrap foreign model interfaces rather than pretending every provider is native.
- **Inferred:** The narrow rule should be:
  - chat is the live interaction surface
  - runs are the canonical execution attempts
  - sessions are Hermes/runtime continuity
  - channels, threads, tasks, wiki docs, and workspace objects hold the durable shared context and promoted outputs

### What Chat is projecting

- **Inferred:** A chat surface should project a selected project/space context plus:
  - visible conversation history from an EMA channel, DM, or thread when collaboration is shared
  - the current draft prompt and attachments
  - the active run/session state for the current interaction
  - the selected harness or provider route, including when EMA is wrapping a foreign app adapter
  - referenced workspace objects such as tasks, docs, canvases, datasets, or files
- **Inferred:** A "private" chat should still live inside a project boundary, typically a personal project or private space, rather than bypassing the project model.

### Submit flow

- **Inferred:** The clean submit path is:
  1. the user or actor composes a prompt in Chat
  2. EMA resolves the target project/space/thread context
  3. EMA creates or appends the canonical message/context record
  4. EMA creates a `run` that references the initiating actor, target context, selected harness, and execution policy
  5. Hermes attaches or resumes a `session` and executes through the selected harness
  6. streamed output appears in Chat as live surface state
  7. committed outputs are written back as canonical message content, run events, or promoted workspace artifacts

### Ad hoc chat vs task-backed chat

- **Inferred:** Chat interactions should support two modes without inventing separate truth models:
  - `ad hoc chat`, where the run is initiated from a channel/DM/thread without a pre-existing task
  - `task-backed chat`, where the run is attached to a durable task and the chat surface is one working view over that task
- **Inferred:** Either mode may create a task later, but the task should be explicitly created rather than implied by any long conversation.

### Harness-facing rule

- **Confirmed:** EMA's role versus Hermes layering must stay explicit.
- **Inferred:** The rule should be:
  - EMA selects the harness, policy, target context, grants, and attribution lineage
  - Hermes runs the live session, tool loop, and provider-specific continuity
  - Chat renders the interaction but does not choose truth or own execution semantics
- **Inferred:** Wrapping foreign apps or CLIs into EMA should happen through harness/session adapters, not by letting those surfaces become parallel sources of record.
- **Inferred:** Browser Chat and native-shell Chat should expose the same harness choice, run state, and promotion model even if shell-specific tools differ underneath.

### What becomes durable

- **Inferred:** Durable by default:
  - committed messages
  - run lineage and status
  - explicit attachments and references
  - promoted artifacts written into tasks, wiki docs, canvases, or files
- **Inferred:** Ephemeral by default:
  - draft prompts
  - token streaming buffers
  - temporary tool traces that are not promoted
  - local viewport and panel state
- **Confirmed:** This preserves the split between live interaction and shared truth.

## 14. Suggested bounded contexts

1. **Identity and Membership**
   - users, actors, org membership, project membership, space permissions, personal AI projection
2. **Project Topology**
   - organizations, projects, spaces, app installations, app capability grants, system spaces
3. **Workspace and Collaboration**
   - tasks, plans, notes, docs, semantic edges, canvases, channels, comments, presence, shared objects, workspace views
4. **Execution Control Plane**
   - runs, approvals, policies, outputs, audit lineage
5. **Harness and Placement**
   - harness registry, executors, capability profiles, placement policy, Hermes bridge
6. **Data and Filesystem Access**
   - datasets, mounts, filesystem boundaries, grants, projections
7. **Surface Adapters**
   - Discord mirroring, web clients, mobile clients, import/export adapters, and shell/native surface bindings
8. **Peer Replication**
   - peer identity, trust, replicas, sync transport, replication policies

## 15. Suggested first database / control-plane schema concepts

- **Inferred:** Start with these tables or aggregates:
  - `users`
  - `organizations`
  - `projects`
  - `spaces`
  - `actors`
  - `project_memberships`
  - `space_memberships`
  - `agents`
  - `personal_ais`
  - `datasets`
  - `workspaces`
  - `workspace_objects`
  - `channels`
  - `messages`
  - `wiki_documents`
  - `wiki_semantic_edges`
  - `wiki_document_ops`
  - `canvases`
  - `canvas_ops`
  - `tasks`
  - `runs`
  - `approvals`
  - `run_events`
  - `sessions`
  - `harnesses`
  - `executors`
  - `filesystem_boundaries`
  - `filesystem_grants`
  - `peers`
  - `replicas`
  - `surface_mirrors`
  - `app_manifests`
  - `app_installations`
  - `app_capability_grants`
  - `workspace_views`
- **Inferred:** A practical Elixir shape is:
  - one Ecto schema per aggregate root
  - append-only event tables for run events and collaboration ops
  - snapshot tables or materialized projections for fast reads

## 16. Suggested first 3 subsystems to implement

1. **Identity + Project/Space topology kernel**
   - users, actors, orgs, projects, spaces, memberships, personal AI projection
   - this pins the authority model before execution sprawl
2. **Workspace object service**
   - channels, tasks, wiki docs, semantic edges, canvas metadata, op logs, comments, presence, workspace views
   - this prevents chat surfaces from becoming the de facto workspace again
3. **Run orchestration + Chat/harness control surface**
   - runs, approvals, sessions, Hermes bridge, harness selection, executor placement, filesystem grants, Chat prompt entry, and output promotion
   - this keeps the user-facing live interaction surface aligned with EMA-owned run lineage instead of letting chat become a separate truth path

## 17. Final position

- **Confirmed:** The rewrite should keep EMA as canonical truth and Hermes as the execution substrate.
- **Inferred:** The cleanest v1 is a project-authoritative daemon with space-scoped collaboration, typed workspace objects, explicit run lineage, and peer-aware executors.
- **Inferred:** Personal AI should be modeled as a roaming actor with membership-projected access, not as a permission bypass.
- **Inferred:** Docs/wiki/canvas should be first-class collaborative objects with daemon-owned op logs and filesystem exports as projections.
- **Inferred:** Launchpad, HQ, and Virtual Desktop should be first-class operating surfaces that project canonical EMA objects without owning durable state.
- **Inferred:** Chat should be treated as the live harness-facing interaction surface, with EMA owning run lineage and Hermes owning session execution.
- **Inferred:** Discord should become a surface adapter during migration, never the authority layer.
- **Speculative:** Once the local model is stable, selected collaboration and execution flows can replicate across peers without changing the core authority doctrine.

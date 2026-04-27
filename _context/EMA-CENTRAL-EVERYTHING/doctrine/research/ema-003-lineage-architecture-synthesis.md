# EMA 0.0.3 Lineage Architecture Synthesis

Related docs:
- [EMA 0.0.3 Knowledge Graph Hub](/Users/tawj/Desktop/ema 0.0.3/ema-003-knowledge-graph-hub.md)
- [EMA 0.0.3 Gleam/BEAM Bounded Contexts](/Users/tawj/Desktop/ema 0.0.3/ema-003-gleam-beam-bounded-contexts.md)
- [EMA 0.0.3 Shared Agent Swarm Workspace](/Users/tawj/Desktop/ema 0.0.3/ema-003-shared-agent-swarm-workspace.md)
- [EMA 0.0.3 Recovery And Implementation Plan](/Users/tawj/Desktop/ema 0.0.3/ema-003-recovery-and-implementation-plan.md)
- [EMA 0.0.3 GitHub Cross-Pollination Map](/Users/tawj/Desktop/ema 0.0.3/ema-003-github-cross-pollination-map.md)
- [EMA 0.0.3 GitHub Branch Resource Inventory](/Users/tawj/Desktop/ema 0.0.3/ema-003-github-branch-resource-inventory.md)
- [Transfer Pack Root](</Users/tawj/Desktop/ema 0.0.3/ema-transfer-pack-20260422-060938/README.md>)

Semantic anchors:
- `ema`
- `hermes`
- `project`
- `space`
- `workstream`
- `thread`
- `wiki_node`
- `execution`
- `session_binding`
- `launchpad`
- `hq`
- `virtual_desktop`
- `semantic_layer`
- `shared_workspace`

## 1. Executive Synthesis

- `Confirmed`: The durable doctrine across the lineage is: **EMA owns truth. Hermes owns execution. Surfaces do not own state.**
- `Confirmed`: The strongest surviving product shape is not "one app" but a **project-scoped collaborative operating substrate** with multiple apps and shells.
- `Confirmed`: `place.org` contributes the spatial shell and virtual desktop metaphor.
- `Confirmed`: `OpenClaw` contributes multi-agent operating doctrine, role semantics, handoffs, and shared workspace habits.
- `Confirmed`: `ClaudeForge` contributes chat/session/provider surface lineage and Discord-mirroring patterns.
- `Confirmed`: the original Elixir EMA lineage contributes the most durable control-plane primitives: proposals, executions, outcomes, events, host-truth, surfaces, and canonical records.
- `Inferred`: the clean reconstruction is **Org -> Project -> Space -> Workstream -> Objects**, where:
  - `Project` is the hard authority, app-instance, and data boundary.
  - `Space` is the default collaboration and replication boundary inside a project.
  - `Workstream` is the continuity object binding chat, threads, wiki, files, blueprint, and runs.
- `Inferred`: the system should start **daemon-authoritative and peer-aware**, not "fully egalitarian mesh" on day one.

## 2. Concise Lineage Map

- `Confirmed`: `lineage-original-elixir-ema` is the best source for **control-plane truth**.
  - Preserve: proposals, executions, outcomes, events, surface bindings, host-truth, daemon-owned IDs.
  - Do not preserve: temporary host/runtime implementation assumptions as doctrine.
- `Confirmed`: `codebase-ema` is the most relevant **active EMA recovery snapshot**.
  - Preserve: Hermes integration docs, workspace/shared contracts, ClaudeForge bridge, execution/event ledger direction.
  - Do not preserve: accidental drift where sessions or surfaces start standing in for canonical executions.
- `Confirmed`: `docs-clis-mcps-integrations` contains the strongest **Hermes execution lineage** and practical runtime substrate.
  - Preserve: harness drivers, gateway/platform adapters, session continuity, runtime plumbing, cron/delivery patterns.
  - Do not preserve: provider/runtime details as top-level product ontology.
- `Confirmed`: `codebase-claudeforge` is the best source for **chat/session/provider UI lineage** and Discord mirror patterns.
  - Preserve: provider-neutral chat surface, normalized events, session continuity, bridge mechanics.
  - Do not preserve: Discord-first assumptions or treating chat sessions as truth.
- `Confirmed`: `codebase-place-org` and `codebase-place-companion` are the best sources for **Desktop / shell / virtual files** lineage.
  - Preserve: desktop shell, windowing, dock, launch model, native companion bridge, spatial UX.
  - Do not preserve: single-user assumptions or old branding as architecture.
- `Confirmed`: `lineage-openclaw-agent-workspaces` is the best source for **multi-agent operating doctrine**.
  - Preserve: role semantics, handoffs, schedules, queueing, automation/heartbeat concepts, shared-workspace discipline.
  - Do not preserve: Discord lane sprawl or ad hoc filesystem truth.
- `Confirmed`: `docs-host-system-launchpad-hq` and `docs-vault-wiki` are the clearest sources for **HQ, Launchpad, semantic wiki, and system-shell doctrine**.

## 3. Recommended Source-of-Truth Architecture

### 3.1 Authority Model

- `Confirmed`: EMA is the canonical authority layer.
- `Inferred`: EMA should own four major planes:
  - `Identity plane`: orgs, projects, spaces, datasets, actors, memberships, devices, peers.
  - `Control plane`: proposals, tasks, executions, outcomes, approvals, incidents, policies, dispatch.
  - `Collaboration plane`: threads, messages, wiki nodes, blueprint nodes, files, comments, canvas objects, notes.
  - `Binding plane`: surface bindings, session bindings, provider bindings, webhook bridges, foreign-app adapters.
- `Confirmed`: clients, CLIs, Discord, native shells, and web apps are bindings or surfaces, not truth containers.

### 3.2 Project, Space, Dataset

- `Confirmed`: every EMA app instance lives within a `Project`.
- `Confirmed`: projects can be personal or belong to an `Organization`.
- `Confirmed`: projects have `Datasets`.
- `Inferred`: `Space` is inside a project by default and is the main collaboration/presence/sync boundary.
- `Inferred`: future cross-project spaces may exist, but should not be the default v1 assumption.

### 3.3 Personal AI

- `Confirmed`: personal AI can access all projects/spaces the user belongs to.
- `Inferred`: personal AI should be modeled as an `Actor` bound to a human principal.
- `Inferred`: personal AI may read across memberships, but writes should require an explicit target project/space/workstream.
- `Inferred`: "all projects" access should be query federation, not one merged global memory bucket.

## 4. Proposed Domain Model

### 4.1 Core Entities

- `Organization`
  - `Confirmed`: top-level shared trust and membership domain.
  - `Inferred`: owns policies, billing/trust/compliance, project membership defaults, and shared integrations.
- `Project`
  - `Confirmed`: required EMA authority boundary and home of each app instance.
  - `Inferred`: owns spaces, datasets, files, app instances, workstreams, threads, wiki objects, and executions.
- `Space`
  - `Inferred`: scoped collaboration region within a project.
  - `Inferred`: default sync/replication and presence boundary.
- `Dataset`
  - `Confirmed`: project-owned data collection.
  - `Inferred`: may be project-wide or attached to spaces; referenced by wiki, chat, agents, and blueprint.
- `Actor`
  - `Inferred`: shared principal abstraction over humans, agents, personal AI, and service identities.
- `Membership`
  - `Inferred`: binds actors to org/project/space scopes with roles and policy.
- `Workstream`
  - `Inferred`: continuity object that ties together thread history, tasks, runs, artifacts, and UI focus.
- `Thread`
  - `Inferred`: shared communication object replacing Discord-first categories/channels/threads.
- `WikiNode`
  - `Inferred`: first-class semantic knowledge object with inline comments, prompting, links, and structured metadata.
- `BlueprintNode`
  - `Inferred`: planning/intent object layered on top of wiki/files/threads, not a separate truth island.
- `FileObject`
  - `Inferred`: content-addressed or versioned object with manifests and host/virtual boundary metadata.
- `Task`
  - `Inferred`: durable intent-to-execute object, distinct from a run.
- `Execution`
  - `Confirmed`: canonical record of a launched run under EMA authority.
- `SessionBinding`
  - `Inferred`: maps execution/workstream/surface/provider/hermes sessions together without conflating them.
- `Harness`
  - `Inferred`: adapter boundary between EMA and runtime drivers.
- `Executor`
  - `Inferred`: concrete live runtime implementation, typically Hermes-backed.
- `Peer`
  - `Inferred`: execution location and replica participant, not co-equal truth authority by default.

### 4.2 Scope Rules

- `Global scope`
  - `Inferred`: identity roots, device identities, peer identities, shared provider catalogs, maybe user preferences.
- `Org scope`
  - `Inferred`: membership policy, shared integrations, trust/compliance settings, org dashboards.
- `Project scope`
  - `Confirmed`: apps, files, datasets, workstreams, threads, wiki, execution records.
- `Space scope`
  - `Inferred`: collaboration visibility, presence, replication policy, default thread/wiki/file segmentation.

## 5. EMA / Hermes Boundary

### 5.1 What EMA Owns

- `Confirmed`: lineage, policy, target selection, canonical execution records, durable IDs, provenance, approvals.
- `Inferred`: workstreams, tasks, proposals, artifact links, shared-object identity, binding metadata, audit history.

### 5.2 What Hermes Owns

- `Confirmed`: live session execution, tool invocation, runtime integration, continuation, normalized runtime events.
- `Inferred`: driver registry, adapter fabric, local/remote execution backends, agent runtime services.

### 5.3 Correct Execution Path

- `Confirmed`: EMA should create the execution record first.
- `Confirmed`: EMA dispatches an `EngineRunRequest` to Hermes.
- `Confirmed`: Hermes returns a handle and streams normalized events.
- `Inferred`: EMA persists the run ledger and binds the run into workstream/thread/UI context.
- `Inferred`: Hermes must never be the only place where a run "exists."

### 5.4 Critical Non-Conflations

- `Inferred`: provider != harness != agent
- `Inferred`: chat session != execution
- `Inferred`: surface thread != canonical workstream
- `Inferred`: peer != co-equal authority

## 6. Shared Workspace and Collaboration Model

### 6.1 Shared Workspace State

- `Confirmed`: shared human-agent workspace is a core invariant.
- `Inferred`: the workspace should be expressed through first-class shared objects, not scattered scratch folders.
- `Inferred`: the durable shared workspace object family is:
  - threads/messages
  - wiki nodes
  - blueprint/intention nodes
  - files/manifests
  - tasks/proposals
  - execution records
  - schedules/queues/notes

### 6.2 Docs / Wiki / Canvas

- `Inferred`: `Wiki` is the semantic layer and should feel like shared docs + Discord context + Obsidian + Wikipedia.
- `Inferred`: wiki pages need inline comments, inline prompting, edit history, references, graphability, and agent provenance.
- `Inferred`: `Canvas` should be treated like a collaborative object graph, not a blob.
- `Inferred`: `Blueprint builder` should be a structured planner/compiler surface built on top of wiki/files/threads.

### 6.3 Sync Model

- `Confirmed`: not all state should be synchronized the same way.
- `Inferred`: use a hybrid model:
  - `Append-only event log`: tasks, executions, outcomes, thread messages, approvals, handoffs.
  - `CRDT-like`: wiki rich text, comments, canvas object edits, collaborative notes.
  - `Manifest/versioned`: files and large objects.
  - `Ephemeral`: presence, typing, cursors, live token streams, temporary layout state.
- `Inferred`: replicate canonical logs and collaboration deltas; re-derive indexes, dashboards, search, and embeddings locally.

## 7. P2P / Mesh Position

- `Confirmed`: P2P/mesh is strategic, not accidental.
- `Inferred`: v1 should be **peer-aware, not mesh-maximal**.
- `Inferred`: the correct early model is `space-scoped canonical authority + replicas`.
- `Inferred`: one trusted daemon/node should hold the active write lease for a given collaboration shard, with replication to peers.
- `Speculative`: later versions may expand to leader failover or quorum for some state classes.
- `Confirmed`: do not begin with fully equal peer dispatch authority.

## 8. App Topology

### 8.1 Shells

- `Confirmed`: `Launchpad`, `HQ`, and `Desktop` are top-level shells, not just more apps.
- `Inferred`: `Launchpad` is the launcher, command surface, and context switcher.
- `Inferred`: `HQ` is the operational home surface at both project and personal scope.
- `Inferred`: `Desktop` is the spatial/windowed shell for native and web, powered by the same underlying app model.

### 8.2 First-Class Apps

- `Inferred`: the core v1 apps should be:
  - `Threads`
  - `Chat`
  - `Wiki`
  - `Files`
  - `Blueprint`
  - `Agents` or `Planner/Executive`

### 8.3 App Relationships

- `Inferred`: `Threads` is the canonical shared communication substrate.
- `Inferred`: `Chat` is a focused AI interaction view over the same underlying workstream/session/task model, not a silo.
- `Inferred`: `Wiki` is the semantic knowledge layer.
- `Inferred`: `Files` is the shared asset/document/media substrate.
- `Inferred`: `Blueprint` is the structured intent/planning/compiler surface above wiki/files/threads.
- `Inferred`: the agent virtual environment should begin as `Planner/Executive` capabilities inside HQ plus specialized views, not as a separate shell.

## 9. Preserve vs Redesign

### Preserve

- `Confirmed`: EMA control-plane primitives
- `Confirmed`: Hermes as shared execution backbone
- `Confirmed`: place.org virtual desktop, launcher, dock, and spatial work metaphor
- `Confirmed`: OpenClaw role/handoff/heartbeat/shared-workspace discipline
- `Confirmed`: ClaudeForge provider-neutral chat/session patterns
- `Confirmed`: Discord mirror/bridge ideas as migration tools
- `Confirmed`: wiki/graph/semantic-layer ambition

### Redesign

- `Confirmed`: Discord as a primary state container
- `Confirmed`: surfaces owning truth
- `Inferred`: chat sessions acting as the canonical execution object
- `Inferred`: a flat "all apps are equal" information architecture
- `Inferred`: scattered VM/vault/runtime folders as durable shared workspace
- `Inferred`: equal-authority peer orchestration in v1
- `Inferred`: treating personal AI as unrestricted global memory across all contexts

## 10. Most Important Unresolved Questions

1. `Confirmed`: Is `Space` always contained by one `Project`, or can it later span projects?
2. `Confirmed`: How much autonomous write authority should `Personal AI` have outside the active project context?
3. `Inferred`: Is `Chat` a distinct durable object family, or a specialized view over thread/workstream/session bindings?
4. `Inferred`: What exact sync substrate should power wiki/canvas: CRDT, op-log, or mixed?
5. `Inferred`: How should datasets be permissioned relative to project and space boundaries?
6. `Inferred`: How far should v1 Discord bridging go: ingest-only, bidirectional mirror, or selective bridge?
7. `Inferred`: What is the plugin contract for foreign apps: embed-only, adapter-backed, or full object-sync?

## 11. Practical Recommendation: What To Build Next

### 11.1 First Build Target

- `Inferred`: Build the **EMA Project Kernel** first, not the whole shell and not the full mesh.

### 11.2 Kernel Scope

- `Inferred`: implement these canonical objects first:
  - organization
  - project
  - space
  - dataset
  - actor
  - membership
  - workstream
  - thread
  - task
  - execution
  - session_binding
  - file_object
  - wiki_node

### 11.3 First Vertical Slice

- `Inferred`: the best first vertical slice is:
  - `space + membership + threads + one wiki page + Hermes-native execution`
- `Why`:
  - threads prove ordered event-log collaboration
  - wiki proves collaborative knowledge objects
  - Hermes-native execution proves the control-plane/harness boundary
  - all of it together proves workstream binding and shared human-agent state

### 11.4 First Surfaces

- `Inferred`: expose that slice through only three thin surfaces first:
  - `Project HQ`
  - `Threads`
  - `Chat`

### 11.5 Explicit Sequence

1. `Inferred`: create the daemon-owned schema for org/project/space/actor/membership/workstream.
2. `Inferred`: add thread and wiki object models with provenance.
3. `Inferred`: implement `Execution + SessionBinding + EngineEvent` for Hermes-native only.
4. `Inferred`: attach Chat as a workstream/thread view, not as the execution record itself.
5. `Inferred`: add HQ cards for live project state, run state, thread activity, and wiki activity.
6. `Inferred`: only then add Discord mirroring and peer replication.

## 12. Recovery Spine To Mine Next

- `Confirmed`: start recovery from this branch/codebase spine:
  - `lineage-original-elixir-ema`
  - `codebase-ema`
  - `docs-clis-mcps-integrations`
  - `codebase-claudeforge`
  - `docs-host-system-launchpad-hq`
  - `codebase-place-org`
  - `codebase-place-companion`
  - `lineage-openclaw-agent-workspaces`

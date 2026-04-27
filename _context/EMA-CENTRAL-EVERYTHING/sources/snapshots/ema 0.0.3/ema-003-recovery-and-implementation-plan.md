# EMA 0.0.3 Recovery And Implementation Plan

Related docs:
- [EMA 0.0.3 Knowledge Graph Hub](/Users/tawj/Desktop/ema 0.0.3/ema-003-knowledge-graph-hub.md)
- [EMA 0.0.3 Lineage Architecture Synthesis](/Users/tawj/Desktop/ema 0.0.3/ema-003-lineage-architecture-synthesis.md)
- [EMA 0.0.3 Gleam/BEAM Bounded Contexts](/Users/tawj/Desktop/ema 0.0.3/ema-003-gleam-beam-bounded-contexts.md)
- [EMA 0.0.3 Shared Agent Swarm Workspace](/Users/tawj/Desktop/ema 0.0.3/ema-003-shared-agent-swarm-workspace.md)
- [EMA 0.0.3 GitHub Cross-Pollination Map](/Users/tawj/Desktop/ema 0.0.3/ema-003-github-cross-pollination-map.md)
- [EMA 0.0.3 GitHub Branch Resource Inventory](/Users/tawj/Desktop/ema 0.0.3/ema-003-github-branch-resource-inventory.md)

Semantic anchors:
- `recovery_lane`
- `harvest_order`
- `primary_recovery_source`
- `secondary_donor`
- `implementation_phase`
- `kernel`
- `hermes_native`
- `desktop_shell`

## 1. Goal

- `Inferred`: recover the strongest architecture and implementation DNA from the lineage archive without dragging legacy drift into the new Gleam/BEAM rewrite.
- `Confirmed`: EMA 0.0.3 is now Gleam/BEAM first.
- `Confirmed`: the Virtual Desktop is first-class in both browser and native-window forms.

## 2. Recovery Spine

Mine these first and treat them as the highest-value recovery stack:

1. `lineage-original-elixir-ema`
2. `codebase-ema`
3. `docs-clis-mcps-integrations`
4. `codebase-claudeforge`
5. `docs-host-system-launchpad-hq`
6. `codebase-place-org`
7. `codebase-place-companion`
8. `lineage-openclaw-agent-workspaces`

## 3. Recovery Lanes

### Lane A: Control Plane Recovery

Primary sources:
- `lineage-original-elixir-ema`
- `codebase-ema`

Recover:
- canonical execution model
- proposal/outcome/event vocabulary
- host-truth and surface-binding ideas
- workspace/shared contract patterns

Do not inherit:
- runtime-era confusion about whether current TypeScript host reality equals final doctrine
- any place where sessions drift into truth ownership

Deliverables:
- Gleam domain modules for project/workstream/execution/task
- migration sketch for core tables
- event vocabulary for execution and collaboration

### Lane B: Hermes And Harness Recovery

Primary sources:
- `docs-clis-mcps-integrations`
- `codebase-ema` Hermes docs

Recover:
- Hermes as runtime substrate
- driver registry shape
- session continuity
- local execution and runtime event normalization
- cron/automation/runtime delivery ideas where still useful

Do not inherit:
- provider-specific product assumptions
- runtime details leaking upward into authority model

Deliverables:
- `ema_harness` contract
- `SessionBinding` model
- first `hermes-native` driver plan

### Lane C: Shared Workspace Recovery

Primary sources:
- `codebase-ema/workspace/shared`
- `lineage-openclaw-agent-workspaces`
- `recovery-old-agent-vm-vault-system`

Recover:
- inbox/handoff/task/session/schedule object families
- role and handoff semantics
- swarm/shared context conventions

Do not inherit:
- ad hoc filesystem truth
- Discord-lane sprawl
- secret-bearing host mirrors

Deliverables:
- shared workspace object map
- workstream/task/handoff design
- actor and assignment conventions

### Lane C2: Coordination / Planner / Virtual Calendar Recovery

Primary sources:
- `lineage-openclaw-agent-workspaces`
- `design-review-fresh-context`
- `codebase-executive`
- `codebase-multi-agent-expirements`

External donor:
- Proslync/Autharis swarm routine as captured in `proslync-swarm-dispatch`

Recover:
- lane registry patterns
- planner/control-tower upkeep
- handoff contracts
- queue vs task vs schedule separation
- self-paced calendar and weekly-phase concepts

Do not inherit:
- multiple competing authorities
- coordination hidden only in repo procedures

Deliverables:
- `ema_coordination` object map
- lane/handoff/cadence/checkup schema
- planner and calendar surface model

### Lane D: Threads And Chat Recovery

Primary sources:
- `codebase-claudeforge`
- `lineage-original-elixir-ema/docs/discord/*`

Recover:
- provider-neutral chat shell patterns
- normalized message/runtime evidence rendering
- Discord thread/session mirror mechanics
- bridge metadata patterns

Do not inherit:
- Discord as source of truth
- chat session == execution assumptions

Deliverables:
- `thread` and `message` domain sketch
- chat-over-workstream model
- Discord bridge adapter plan

### Lane E: Knowledge / Wiki / Blueprint Recovery

Primary sources:
- `docs-clis-mcps-integrations/agent-vm/ema/wiki-engine`
- `docs-vault-wiki`
- `docs-host-system-launchpad-hq`
- blueprint docs in `lineage-openclaw-agent-workspaces`

Recover:
- semantic wiki/page model
- prompt-inline-edit flows
- graph/reference model
- blueprint/intention structure

Do not inherit:
- vault-files-only dogma as the whole collaboration model
- archived import junk as canonical information architecture

Deliverables:
- `wiki_node` and `blueprint_node` schema
- first collaborative edit model
- reference and provenance conventions

### Lane F: Shell / Desktop Recovery

Primary sources:
- `docs-host-system-launchpad-hq`
- `codebase-place-org`
- `codebase-place-companion`

Recover:
- Launchpad as launcher/command surface
- HQ as operational home shell
- Virtual Desktop as spatial/window shell
- native companion ideas only where they preserve shared shell semantics

Do not inherit:
- place.org branding as architecture
- shell-specific truth storage

Deliverables:
- shell object model
- app registry model
- desktop layout/window state model
- browser/native parity principles

## 4. Recommended Build Order

### Phase 1: Kernel

Implement in Gleam/BEAM:
- organizations
- projects
- spaces
- datasets
- actors
- memberships
- workstreams

Outcome:
- hard authority boundary exists
- project-scoped instances are real
- personal vs org project scoping is explicit

### Phase 2: Shared Collaboration Objects

Implement:
- lanes
- handoffs
- queue items
- cadence policy
- calendar blocks
- threads
- messages
- wiki nodes
- comments
- references

Outcome:
- EMA can represent shared conversation and shared knowledge without Discord or ad hoc files being authority

### Phase 3: Hermes-Native Execution

Implement:
- execution
- execution_events
- session_binding
- Hermes driver integration

Outcome:
- EMA owns run truth
- Hermes owns live execution
- Chat can bind to real executions correctly

### Phase 4: Shell Surfaces

Implement:
- Project HQ
- Threads
- Chat
- minimal Wiki
- Launchpad

Outcome:
- the core workspace is usable through thin surfaces

### Phase 5: Desktop

Implement:
- browser Virtual Desktop shell
- native window shell using the same app model and APIs

Outcome:
- place.org-style experience returns without reintroducing shell-owned truth

### Phase 6: Bridge And Replication

Implement:
- Discord bridge
- peer registry
- authority lease
- basic replica policy

Outcome:
- migration and peer-aware operation become possible after local semantics are stable

## 5. Practical Source Mapping

### Best Source For Control Plane

- `lineage-original-elixir-ema`
- `codebase-ema`

Mine for:
- `control_plane/schema`
- execution event ledger
- sessions registry
- workspace contracts

### Best Source For Hermes Runtime

- `docs-clis-mcps-integrations/agent-vm/hermes-agent`
- `codebase-ema/docs/HERMES_*`

Mine for:
- run request/handle/event shapes
- driver registry
- provider/session continuity

### Best Source For Threads / Chat

- `codebase-claudeforge`

Mine for:
- chat view shape
- provider abstraction
- Discord/webhook mirroring

### Best Source For HQ / Launchpad

- `docs-host-system-launchpad-hq`

Mine for:
- HQ shell intent
- launchpad registry
- command palette and shell buildout

### Best Source For Virtual Desktop

- `codebase-place-org`
- `codebase-place-companion`

Mine for:
- desktop shell
- dock/window manager
- native/browser bridge patterns
- virtual filesystem concepts

### Best Source For Shared Workspace Doctrine

- `lineage-openclaw-agent-workspaces`
- `codebase-ema/workspace/shared`

Mine for:
- role semantics
- handoffs
- automation/scheduling concepts
- shared object discipline

## 6. First Concrete 0.0.3 Deliverables

### Deliverable 1: Domain Package Skeleton

Create Gleam packages or OTP app modules for:
- identity
- projects
- workstreams
- coordination
- threads
- knowledge
- exec_control
- harness
- shell

### Deliverable 2: First Migration Set

Create first migrations for:
- organizations
- projects
- spaces
- datasets
- actors
- memberships
- workstreams
- threads
- messages
- wiki_nodes
- executions
- execution_events
- session_bindings

### Deliverable 3: Hermes Vertical Slice

Build:
- start execution
- stream normalized events
- persist ledger
- attach to workstream/thread

### Deliverable 4: Thin Surface Set

Build:
- HQ
- Threads
- Chat

### Deliverable 5: Desktop Shell Spike

Build:
- browser desktop shell like `place.org`
- native window shell using same APIs and same app registry

## 7. Decisions To Preserve While Rebuilding

- `Confirmed`: keep EMA as authority
- `Confirmed`: keep Hermes as execution backbone
- `Confirmed`: keep Virtual Desktop as a real shell
- `Confirmed`: keep shared human-agent workspace as the center
- `Inferred`: keep Chat and Threads on one underlying workstream model
- `Inferred`: keep Wiki and Blueprint tightly integrated

## 8. Things To Intentionally Drop

- `Confirmed`: Discord as core truth
- `Inferred`: sessions as the primary system object
- `Inferred`: shell-specific or app-specific truth stores
- `Inferred`: equal-authority peer orchestration in v1
- `Inferred`: unrestricted personal AI writes across all contexts by default

## 9. Immediate Next Step

- `Inferred`: start `ema 0.0.3` with the kernel and Hermes slice, then put a very thin HQ/Threads/Chat shell over it.
- `Inferred`: do not start by rebuilding the full desktop, the full wiki, and the full mesh all at once.
- `Inferred`: the first proof should be:
  - create project
  - create space
  - open thread
  - attach wiki node
  - launch Hermes-backed execution
  - watch the thread and HQ reflect canonical state

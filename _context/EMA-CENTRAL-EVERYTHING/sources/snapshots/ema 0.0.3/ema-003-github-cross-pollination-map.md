# EMA 0.0.3 GitHub Cross-Pollination Map

Related docs:
- [EMA 0.0.3 Knowledge Graph Hub](/Users/tawj/Desktop/ema 0.0.3/ema-003-knowledge-graph-hub.md)
- [EMA 0.0.3 Lineage Architecture Synthesis](/Users/tawj/Desktop/ema 0.0.3/ema-003-lineage-architecture-synthesis.md)
- [EMA 0.0.3 Gleam/BEAM Bounded Contexts](/Users/tawj/Desktop/ema 0.0.3/ema-003-gleam-beam-bounded-contexts.md)
- [EMA 0.0.3 Shared Agent Swarm Workspace](/Users/tawj/Desktop/ema 0.0.3/ema-003-shared-agent-swarm-workspace.md)
- [EMA 0.0.3 Recovery And Implementation Plan](/Users/tawj/Desktop/ema 0.0.3/ema-003-recovery-and-implementation-plan.md)
- [EMA 0.0.3 GitHub Branch Resource Inventory](/Users/tawj/Desktop/ema 0.0.3/ema-003-github-branch-resource-inventory.md)
- [Transfer Pack Branch Map](</Users/tawj/Desktop/ema 0.0.3/ema-transfer-pack-20260422-060938/BRANCH_MAP.md>)

Semantic anchors:
- `cross_pollination`
- `source_family`
- `primary_recovery_source`
- `secondary_donor`
- `adjacent_inspiration`
- `archive_reference`
- `semantic_layer`
- `knowledge_graph`

## 1. Purpose

- `Confirmed`: the transfer repo is not a normal codebase; it is a lineage archive.
- `Confirmed`: the rewrite should not inherit from only one branch.
- `Inferred`: the right move is to treat every branch as one of:
  - `primary recovery source`
  - `secondary donor`
  - `adjacent inspiration`
  - `archive/reference only`
- `Inferred`: "cross-pollination" for EMA 0.0.3 means every branch should either:
  - feed a bounded context directly
  - feed a shell/app surface directly
  - feed doctrine/intent only
  - or be explicitly parked as non-authoritative adjacent context

## 2. Source Families

### 2.1 Map / Meta Branches

These orient the archive and should stay visible while rebuilding:

- `main`
- `lineage-index`
- `design-review-fresh-context`
- `git-history-extracts`
- `github-legacy-repos`

### 2.2 Core Recovery Branches

These should directly shape EMA 0.0.3:

- `lineage-original-elixir-ema`
- `codebase-ema`
- `docs-clis-mcps-integrations`
- `codebase-claudeforge`
- `docs-host-system-launchpad-hq`
- `codebase-place-org`
- `codebase-place-companion`
- `lineage-openclaw-agent-workspaces`
- `docs-vault-wiki`

### 2.3 Secondary Donor Branches

These likely contribute useful fragments, not the main authority model:

- `docs-ema-next-steps`
- `docs-host-vault-context`
- `docs-host-obsidian-vault`
- `docs-place-org-era-research`
- `docs-host-vault-agent-modules-routing`
- `docs-frontend-interface-inspirations`
- `lineage-openclaw`
- `recovery-old-agent-vm-vault-system`
- `codebase-agent-os-v8`
- `codebase-agent-os-bridge`
- `codebase-agent-os-demo-pages`
- `codebase-mission-control-claude`
- `codebase-frontend-layer`
- `codebase-place-org-openclaw`

### 2.4 Adjacent / Archive Branches

These are still worth keeping in the context field, but should not quietly anchor architecture:

- `codebase-agent-os-demo`
- `codebase-agentgpt`
- `codebase-execudeck`
- `codebase-executive`
- `codebase-multi-agent-expirements`
- `codebase-superman`
- `codebase-t3code-fork`
- `lineage-openclaw-archive-subprojects`

## 3. Bounded Context Feed Map

### 3.1 `ema_identity`

Primary feeds:
- `lineage-original-elixir-ema`
- `codebase-ema`
- `design-review-fresh-context`

Secondary feeds:
- `docs-host-system-launchpad-hq`
- `docs-vault-wiki`
- `codebase-mission-control-claude`

What to absorb:
- actors
- memberships
- org/project/space framing
- personal AI as a scoped principal

What not to absorb:
- implicit global memory
- surface-local identity hacks

### 3.2 `ema_projects`

Primary feeds:
- `design-review-fresh-context`
- `lineage-original-elixir-ema`
- `codebase-ema`

Secondary feeds:
- `docs-host-system-launchpad-hq`
- `docs-vault-wiki`
- `codebase-mission-control-claude`

What to absorb:
- org/project/space/dataset hierarchy
- project-scoped app instances
- shared scope boundaries

### 3.3 `ema_workstreams`

Primary feeds:
- `codebase-ema`
- `lineage-openclaw-agent-workspaces`
- `design-review-fresh-context`

Secondary feeds:
- `docs-ema-next-steps`
- `docs-host-vault-context`

What to absorb:
- continuity across chat, threads, wiki, files, and runs
- task/handoff/assignment patterns
- shared workspace coordination objects

### 3.4 `ema_threads`

Primary feeds:
- `codebase-claudeforge`
- `lineage-original-elixir-ema`
- `design-review-fresh-context`

Secondary feeds:
- `lineage-openclaw-agent-workspaces`
- `docs-host-system-launchpad-hq`

What to absorb:
- thread/channel mapping
- normalized message/runtime evidence
- Discord bridge metadata

What not to absorb:
- Discord as authority
- session-as-truth drift

### 3.5 `ema_coordination`

Primary feeds:
- `lineage-openclaw-agent-workspaces`
- `codebase-ema`
- `design-review-fresh-context`

Secondary feeds:
- `codebase-executive`
- `codebase-multi-agent-expirements`
- `docs-host-vault-context`

External donor patterns:
- `proslync-swarm-dispatch` skill

What to absorb:
- lane registry discipline
- explicit handoffs
- planner/control-tower upkeep
- backlog vs schedule vs waiting separation
- self-paced schedule and weekly-phase logic

What not to absorb:
- multiple competing truth authorities
- hidden coordination that lives only in side markdown

### 3.6 `ema_knowledge`

Primary feeds:
- `docs-vault-wiki`
- `docs-clis-mcps-integrations`
- `docs-host-system-launchpad-hq`

Secondary feeds:
- `lineage-openclaw-agent-workspaces`
- `docs-host-vault-context`
- `codebase-agent-os-v8`
- `codebase-agent-os-bridge`

What to absorb:
- wiki as semantic layer
- prompt-inline-edit flows
- graph/reference semantics
- blueprint/intention structure

### 3.7 `ema_files`

Primary feeds:
- `codebase-place-org`
- `codebase-place-companion`
- `design-review-fresh-context`

Secondary feeds:
- `docs-place-org-era-research`
- `docs-vault-wiki`

What to absorb:
- virtual filesystem ideas
- host vs EMA file boundary
- shared file app direction

What not to absorb:
- browser-local blobs as canonical truth

### 3.8 `ema_exec_control`

Primary feeds:
- `lineage-original-elixir-ema`
- `codebase-ema`

Secondary feeds:
- `lineage-openclaw-agent-workspaces`
- `docs-ema-next-steps`

What to absorb:
- proposal/execution/outcome/event vocabulary
- approvals
- canonical execution ledger
- daemon-owned lineage

### 3.9 `ema_harness`

Primary feeds:
- `docs-clis-mcps-integrations`
- `codebase-ema`

Secondary feeds:
- `codebase-claudeforge`
- `lineage-openclaw`

What to absorb:
- Hermes-native runtime substrate
- driver registry
- session continuity
- run request/handle/event shape

What not to absorb:
- provider == harness == agent conflation

### 3.10 `ema_shell`

Primary feeds:
- `docs-host-system-launchpad-hq`
- `codebase-place-org`
- `codebase-place-companion`
- `design-review-fresh-context`

Secondary feeds:
- `docs-frontend-interface-inspirations`
- `codebase-frontend-layer`
- `codebase-place-org-openclaw`

What to absorb:
- Launchpad as command/launch shell
- HQ as operational home shell
- Virtual Desktop as spatial shell in browser and native window

### 3.11 `ema_replication`

Primary feeds:
- `docs-vault-wiki`
- `lineage-original-elixir-ema`
- `design-review-fresh-context`

Secondary feeds:
- `docs-ema-next-steps`
- `recovery-old-agent-vm-vault-system`

What to absorb:
- peer-aware mesh direction
- authority lease thinking
- collaboration vs execution replication boundaries

## 4. Branch-By-Branch Integration Verdicts

### 4.1 Meta / Orientation

- `main`
  - Verdict: `primary orientation branch`
  - Use for: doctrine, transfer framing, prompt packs, branch map
  - Do not use for: implementation details
- `lineage-index`
  - Verdict: `primary orientation branch`
  - Use for: source inventories and archive structure
  - Do not use for: canonical product modeling by itself
- `design-review-fresh-context`
  - Verdict: `primary product-model branch`
  - Use for: current app/project/org/personal-AI framing
  - Do not use for: low-level implementation patterns
- `git-history-extracts`
  - Verdict: `secondary forensic branch`
  - Use for: chronology, ancestry hints, missing branch context
- `github-legacy-repos`
  - Verdict: `secondary inventory branch`
  - Use for: repo universe and adjacent lineage awareness

### 4.2 Control Plane / Execution Core

- `lineage-original-elixir-ema`
  - Verdict: `primary authority source`
  - Feeds: `ema_exec_control`, `ema_projects`, `ema_identity`, `ema_replication`
- `codebase-ema`
  - Verdict: `primary authority recovery source`
  - Feeds: `ema_exec_control`, `ema_workstreams`, `ema_harness`, shared workspace
- `docs-clis-mcps-integrations`
  - Verdict: `primary execution source`
  - Feeds: `ema_harness`, `ema_knowledge`, runtime bridges, wiki engine patterns
- `codebase-claudeforge`
  - Verdict: `primary surface source`
  - Feeds: `ema_threads`, `ema_harness`, `ema_shell`

### 4.3 Shell / Desktop / UI

- `docs-host-system-launchpad-hq`
  - Verdict: `primary shell doctrine source`
  - Feeds: `ema_shell`, HQ, Launchpad, shell routing
- `codebase-place-org`
  - Verdict: `primary browser desktop source`
  - Feeds: `ema_shell`, `ema_files`, desktop/window semantics
- `codebase-place-companion`
  - Verdict: `primary native desktop donor`
  - Feeds: native window shell, host integration, virtual desktop parity
- `docs-frontend-interface-inspirations`
  - Verdict: `secondary inspiration source`
  - Feeds: surface design language only
- `codebase-frontend-layer`
  - Verdict: `secondary UI donor`
  - Feeds: component patterns and dashboard ancestry
- `codebase-place-org-openclaw`
  - Verdict: `secondary fusion donor`
  - Feeds: migration ideas where place and OpenClaw were already being blended

### 4.4 Knowledge / Wiki / Blueprint

- `docs-vault-wiki`
  - Verdict: `primary knowledge doctrine source`
  - Feeds: wiki semantics, mesh docs, architecture notes
- `docs-ema-next-steps`
  - Verdict: `secondary planning source`
  - Feeds: object model, future direction, transition notes
- `docs-host-vault-context`
  - Verdict: `secondary recovered-memory source`
  - Feeds: contextual intent, older rationale, notes
- `docs-host-obsidian-vault`
  - Verdict: `secondary archive source`
  - Feeds: knowledge/workspace intent fragments
- `lineage-openclaw-agent-workspaces`
  - Verdict: `primary doctrine donor`
  - Feeds: blueprint, role, scheduling, swarm/shared workspace patterns
- `lineage-openclaw`
  - Verdict: `secondary doctrine donor`
  - Feeds: runtime/operator mindset and general OpenClaw lineage

### 4.5 Shared Workspace / Routing / Recovery

- `docs-host-vault-agent-modules-routing`
  - Verdict: `secondary routing donor`
  - Feeds: module boundary and routing thoughts
- `recovery-old-agent-vm-vault-system`
  - Verdict: `secondary recovery donor`
  - Feeds: old system residue, context salvage, cautionary history
- `docs-place-org-era-research`
  - Verdict: `secondary product-lineage donor`
  - Feeds: place-era intent and UX/system thinking

### 4.6 Adjacent Experimental Codebases

- `codebase-agent-os-v8`
  - Verdict: `secondary conceptual donor`
  - Feeds: agent-system UI, semantic/wiki and dashboard patterns
- `codebase-agent-os-bridge`
  - Verdict: `secondary bridge donor`
  - Feeds: server/bridge patterns and agent OS integration ideas
- `codebase-agent-os-demo-pages`
  - Verdict: `secondary UI donor`
  - Feeds: early app-shell or page-shell concepts
- `codebase-agent-os-demo`
  - Verdict: `adjacent inspiration`
  - Feeds: broader AI-native OS imagery and conceptual framing
- `codebase-mission-control-claude`
  - Verdict: `secondary scope donor`
  - Feeds: project/tenant APIs and dashboard concepts
- `codebase-execudeck`
  - Verdict: `adjacent inspiration`
  - Feeds: execution deck ideas if relevant
- `codebase-executive`
  - Verdict: `adjacent inspiration`
  - Feeds: executive/personal productivity ideas
- `codebase-multi-agent-expirements`
  - Verdict: `adjacent inspiration`
  - Feeds: multi-agent experiments only
- `codebase-superman`
  - Verdict: `adjacent inspiration`
  - Feeds: uncertain without targeted mining; park unless needed
- `codebase-t3code-fork`
  - Verdict: `secondary UI donor`
  - Feeds: chat/code surface ergonomics only
- `codebase-agentgpt`
  - Verdict: `archive/reference only`
  - Feeds: broad public agent UI lineage, not EMA doctrine
- `lineage-openclaw-archive-subprojects`
  - Verdict: `archive/reference only`
  - Feeds: old subproject fragments if specific missing context appears

## 5. Recommended Harvest Order

1. `lineage-original-elixir-ema`
2. `codebase-ema`
3. `docs-clis-mcps-integrations`
4. `codebase-claudeforge`
5. `docs-host-system-launchpad-hq`
6. `docs-vault-wiki`
7. `design-review-fresh-context`
8. `codebase-place-org`
9. `codebase-place-companion`
10. `lineage-openclaw-agent-workspaces`
11. secondary donor branches
12. adjacent/archive branches only as needed

## 6. Immediate Cross-Pollination Rules For EMA 0.0.3

- `Confirmed`: no single branch becomes the rewrite.
- `Confirmed`: EMA control-plane truth comes first from `lineage-original-elixir-ema` and `codebase-ema`.
- `Confirmed`: Hermes execution truth comes first from `docs-clis-mcps-integrations` plus EMA harness docs.
- `Confirmed`: Threads/Chat surface truth comes first from `codebase-claudeforge`, but not its authority model.
- `Confirmed`: Virtual Desktop truth comes first from `codebase-place-org` and `codebase-place-companion`, but not their old tenancy assumptions.
- `Confirmed`: current product framing for apps/projects/personal AI comes first from `design-review-fresh-context`.
- `Inferred`: any branch that conflicts with these should be treated as a donor, not a governor.

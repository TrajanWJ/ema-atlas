# Repo Integration Map

This file is the routing contract for the swarm docs pack. It explains where
the swarm source pack should connect inside the atlas, which graph and
vocabulary files it should reinforce, and which local EMA 0.0.3 docs should
carry the same intent forward.

## 1. Role Of This Map

- This is not the evidence pack itself.
- This is the integration layer that keeps the evidence pack from floating
  off as a one-off side document.
- The goal is to make the swarm docs pack behave like a real atlas input:
  searchable, cross-linked, and renderable on the right surfaces.

## 2. Primary Local Anchors

These are the local EMA 0.0.3 docs the swarm pack should treat as its nearest
neighbors:

- [EMA 0.0.3 Knowledge Graph Hub](</Users/tawj/Desktop/ema 0.0.3/ema-003-knowledge-graph-hub.md>)
- [EMA 0.0.3 Workboard](</Users/tawj/Desktop/ema 0.0.3/ema-003-workboard.md>)
- [EMA 0.0.3 Shared Swarm Source Pack](</Users/tawj/Desktop/ema 0.0.3/ema-003-shared-swarm-source-pack.md>)
- [EMA 0.0.3 Shared Agent Swarm Workspace](</Users/tawj/Desktop/ema 0.0.3/ema-003-shared-agent-swarm-workspace.md>)
- [EMA 0.0.3 Atlas Expansion Backlog](</Users/tawj/Desktop/ema 0.0.3/ema-003-atlas-expansion-backlog.md>)
- [EMA 0.0.3 Deliverables Program](</Users/tawj/Desktop/ema 0.0.3/ema-003-deliverables-program.md>)
- [EMA 0.0.3 GitHub Cross-Pollination Map](</Users/tawj/Desktop/ema 0.0.3/ema-003-github-cross-pollination-map.md>)
- [EMA 0.0.3 Recovery And Implementation Plan](</Users/tawj/Desktop/ema 0.0.3/ema-003-recovery-and-implementation-plan.md>)
- [EMA 0.0.3 Implementation Slices](</Users/tawj/Desktop/ema 0.0.3/ema-003-implementation-slices.md>)
- [EMA 0.0.3 Surface Lineage Pack](</Users/tawj/Desktop/ema 0.0.3/ema-003-surface-lineage-pack.md>)
- [EMA 0.0.3 GitHub Branch Resource Inventory](</Users/tawj/Desktop/ema 0.0.3/ema-003-github-branch-resource-inventory.md>)

## 3. Atlas Route Connections

### `/docs`

- Best fit for the swarm pack's index and evidence summaries.
- The docs route should surface this map as a navigation card or doc tile.
- The current `EMA Docs` page already acts like a live registry of working
  markdown assets, so this map belongs there as a first-class entry.

### `/graph`

- Best fit for cross-links into the semantic layer and the dependency map.
- The graph route should eventually render a swarm subgraph with the pack as
  a node or cluster anchor.
- This is where the integration map should point to graph edges and graph
  nodes, not merely list them.

### `/questions`

- Best fit for unresolved swarm-related design questions.
- Any decision surfaced by the swarm pack that still affects authority,
  collaboration, or placement should point into the open question ledger.
- This route should render the pressure points the swarm pack is exposing.

### `/program`

- Best fit for coordination pressure, current lanes, and ownership.
- The swarm docs pack should feed the program view whenever a pattern moves
  from evidence into active work.
- This is the right surface for "what should happen next" rather than "what
  did we learn."

### `/timeline`

- Best fit for lineage and sequencing.
- Use this route when the swarm pack needs to show how the coordination
  model evolved across phases.
- Good home for "before / after / now" views of the swarm workspace story.

### `/showroom`

- Best fit for higher-level presentation or gallery treatment.
- The swarm pack should eventually render here when it becomes a polished
  demo object instead of only a working doc set.

### `/parts`

- Best fit for future derivations once swarm coordination becomes a named
  part or brief.
- The swarm pack should not live only as a part, but parts can consume its
  outputs.

## 4. Graph Doc Connections

The swarm pack should connect directly to these graph edges:

- [graph/edges/workspace.md](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/graph/edges/workspace.md>)
  - shared durable artifacts, lane tracking, handoffs, queue items
- [graph/edges/orchestration.md](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/graph/edges/orchestration.md>)
  - multi-agent coordination, watchdogs, planner/control-tower behavior
- [graph/edges/collab.md](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/graph/edges/collab.md>)
  - docs/wiki/canvas/thread sync and collaboration object boundaries
- [graph/edges/authority.md](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/graph/edges/authority.md>)
  - control-plane ownership, record authority, replayable truth
- [graph/edges/identity.md](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/graph/edges/identity.md>)
  - org/space/project/member scoping and agent identity questions
- [graph/edges/transport.md](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/graph/edges/transport.md>)
  - placement, peer routing, capability locality

Recommended node cross-links:

- [graph/nodes/main.qmd](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/graph/nodes/main.qmd>)
- [graph/nodes/docs-ema-next-steps.qmd](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/graph/nodes/docs-ema-next-steps.qmd>)
- [graph/nodes/docs-vault-wiki.qmd](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/graph/nodes/docs-vault-wiki.qmd>)
- [graph/nodes/docs-host-vault-context.qmd](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/graph/nodes/docs-host-vault-context.qmd>)
- [graph/nodes/docs-host-vault-agent-modules-routing.qmd](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/graph/nodes/docs-host-vault-agent-modules-routing.qmd>)
- [graph/nodes/docs-clis-mcps-integrations.qmd](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/graph/nodes/docs-clis-mcps-integrations.qmd>)

What this map wants those graph files to say:

- swarm work is part of workspace and orchestration, not a detached notebook
- route-level docs should reflect authority boundaries, not duplicate them
- graph nodes should identify the swarm pack as evidence, not canon

## 5. Glossary Connections

The swarm docs pack should reuse and reinforce these glossary terms:

- `shared_workspace`
- `workspace`
- `lane`
- `handoff`
- `queue_item`
- `weekly_phase`
- `checkup`
- `planner_control_tower`
- `collaboration object`
- `control-plane record`
- `execution lineage`
- `project`
- `space`
- `member`
- `organization`
- `thread`
- `blueprint`
- `launchpad`
- `hq`
- `virtual desktop`

If the swarm pack introduces a new coordination noun, it should either:

- map cleanly onto one of the terms above, or
- become a glossary promotion candidate before it spreads.

## 6. Open Questions It Should Point At

The swarm pack should back-reference open questions whenever it depends on an
unresolved choice. The main ones are:

- [OPEN_QUESTIONS.md Q1](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/OPEN_QUESTIONS.md>)
  - agent identities as first-class members
- [OPEN_QUESTIONS.md Q2](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/OPEN_QUESTIONS.md>)
  - collaboration state in event_log or adjacent
- [OPEN_QUESTIONS.md Q5](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/OPEN_QUESTIONS.md>)
  - harness / driver contract surface
- [OPEN_QUESTIONS.md Q6](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/OPEN_QUESTIONS.md>)
  - Discord mirror direction
- [OPEN_QUESTIONS.md Q7](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/OPEN_QUESTIONS.md>)
  - surface stack for Launchpad/HQ
- [OPEN_QUESTIONS.md Q8](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/OPEN_QUESTIONS.md>)
  - sync model for docs/wiki/canvas
- [OPEN_QUESTIONS.md Q10](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/OPEN_QUESTIONS.md>)
  - permission mapping between org/space and runtime/tool access

Recommended rule:

- if the swarm pack cannot be explained without choosing one of these
  answers, it should cite the question instead of silently assuming the
  answer.

## 7. How-To Docs It Should Support

The swarm docs pack should point contributors to these playbooks:

- [How-To Playbooks](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/howto/README.md>)
- [load-context-for-a-task.md](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/howto/load-context-for-a-task.md>)
- [add-an-edge-topic.md](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/howto/add-an-edge-topic.md>)
- [resolve-an-open-question.md](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/howto/resolve-an-open-question.md>)
- [add-a-deliverable.md](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/howto/add-a-deliverable.md>)
- [add-a-driver.md](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/howto/add-a-driver.md>)
- [add-a-vapp.md](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/howto/add-a-vapp.md>)
- [promote-vault-term.md](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/howto/promote-vault-term.md>)
- [add-a-branch.md](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/howto/add-a-branch.md>)

Practical use:

- `load-context-for-a-task` should be the entry recipe for any fresh swarm
  agent reading this map.
- `add-an-edge-topic` should be used when swarm coordination becomes a new
  cross-cutting concept.
- `resolve-an-open-question` should be used when a swarm dependency finally
  becomes canonical.
- `promote-vault-term` is the right move if the swarm pack discovers a term
  that belongs in the controlled vocabulary.

## 8. Recommended Backlinks

These docs should eventually link back to this map so the swarm pack has a
clear home inside the atlas:

- [EMA 0.0.3 Knowledge Graph Hub](</Users/tawj/Desktop/ema 0.0.3/ema-003-knowledge-graph-hub.md>)
- [EMA 0.0.3 Workboard](</Users/tawj/Desktop/ema 0.0.3/ema-003-workboard.md>)
- [EMA 0.0.3 Shared Swarm Source Pack](</Users/tawj/Desktop/ema 0.0.3/ema-003-shared-swarm-source-pack.md>)
- [EMA 0.0.3 Shared Agent Swarm Workspace](</Users/tawj/Desktop/ema 0.0.3/ema-003-shared-agent-swarm-workspace.md>)
- [EMA 0.0.3 Atlas Expansion Backlog](</Users/tawj/Desktop/ema 0.0.3/ema-003-atlas-expansion-backlog.md>)
- [EMA 0.0.3 Deliverables Program](</Users/tawj/Desktop/ema 0.0.3/ema-003-deliverables-program.md>)
- [EMA Atlas README](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/README.md>)
- `/docs`
- `/graph`
- `/questions`
- [How-To Playbooks](</Users/tawj/Desktop/ema 0.0.3/ema-atlas/howto/README.md>)

If those backlinks get added, the swarm docs pack will be reachable from:

- the atlas document registry
- the semantic graph
- the open-question tracker
- the operational playbook index
- the local EMA 0.0.3 knowledge hub

## 9. Surfaces That Should Eventually Render This Material

Priority order:

1. `/docs`
   - canonical document registry and entrypoint for the swarm pack
2. `/graph`
   - semantic and relational view of how the swarm pack connects
3. `/questions`
   - unresolved coordination and ownership questions
4. `/program`
   - active coordination pressure, lanes, and work sequencing
5. `/timeline`
   - lineage evolution and phase history
6. `/showroom`
   - gallery / presentation layer once the pack is polished
7. `/parts`
   - downstream briefs derived from the swarm evidence

Secondary rendering surfaces:

- a future dedicated swarm route
- a future knowledge-layer index
- a future workboard view for swarm lanes and handoffs

## 10. Integration Rule

The swarm docs pack should always answer these three questions:

1. What existing atlas surface does this belong on?
2. What graph edge or glossary term does this depend on?
3. What open question keeps it provisional?

If a new swarm note cannot answer those three, it should stay in the source
pack until the map is updated.

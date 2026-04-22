# EMA v1.1 Import Decisions

Updated: 2026-04-13 UTC

## Decision legend
- **STEAL NOW** — direct import candidate for v1.1 surface/flow/model
- **ADAPT SOON** — strong inspiration, but needs EMA-specific reshaping
- **REFERENCE** — useful framing or primitives, not a direct import target

## Shell / HQ / Launchpad

### AGOR
- Decision: **STEAL NOW**
- Import:
  - operator surface for parallel workstreams
  - visible branch/session/work topology
  - mission-control feel over active agent work

### Plane
- Decision: **STEAL NOW**
- Import:
  - multi-view coherence over same underlying objects
  - docs/context adjacent to operations
  - stage/approval visibility

### Mission Control / Autensa lineage
- Decision: **ADAPT SOON**
- Import:
  - single operational shell
  - panelized mission control
  - replay/logs/tasks/status as peer surfaces

### Dagster
- Decision: **STEAL NOW**
- Import:
  - lineage / impact / freshness / ownership mental model

### Temporal
- Decision: **STEAL NOW**
- Import:
  - durable execution truth
  - wait states / replay / resume / branch semantics

### Zellij
- Decision: **ADAPT SOON**
- Import:
  - layouts/workspace persistence
  - pinned/floating panes
  - session resurrection

### Cockpit
- Decision: **STEAL NOW**
- Import:
  - host honesty
  - terminal embedded in system control surfaces
  - logs/metrics/actions co-located

## Agent Work / Coordination

### Overstory
- Decision: **STEAL NOW**
- Import:
  - multi-agent orchestration topology
  - supervision / delegation patterns

### OpenASE
- Decision: **STEAL NOW**
- Import:
  - delegated execution on real machines
  - traceability and human oversight

### MCP Agent Mail
- Decision: **STEAL NOW**
- Import:
  - coordination fabric
  - inbox/outbox/thread model for async delegation

### claude-view
- Decision: **STEAL NOW**
- Import:
  - mission-control visibility
  - subagent tree / approvals-needed / tool-call visibility

### AgentOS
- Decision: **ADAPT SOON**
- Import:
  - idea-rich human operating layer
  - topology/planning/inspection concepts

### LangSmith Studio
- Decision: **STEAL NOW**
- Import:
  - thread identity
  - graph/chat/timeline tri-view

### AutoGen Studio
- Decision: **ADAPT SOON**
- Import:
  - team builder / control graph / steerable runs

### Liveblocks
- Decision: **STEAL NOW**
- Import:
  - shared scratchpad / co-editing semantics

### LiveKit Agents
- Decision: **ADAPT SOON**
- Import:
  - agents as room/channel participants
  - live comms model

## Host Reality / Infra / Notifications

### sshx
- Decision: **STEAL NOW**
- Import:
  - shared terminal primitive
  - operator sees what agent sees

### ntfy
- Decision: **STEAL NOW**
- Import:
  - attention / escalation primitive
  - lightweight action routing

### ShellHub
- Decision: **STEAL NOW**
- Import:
  - web SSH gateway patterns
  - session recording and access control framing

### Fleet
- Decision: **ADAPT SOON**
- Import:
  - live machine truth / fleet ops posture

### Portainer
- Decision: **REFERENCE**
- Import:
  - service/fleet control UX patterns

### Teleport
- Decision: **STEAL NOW**
- Import:
  - JIT access requests / approval / TTL elevation

### Grafana IRM / Better Stack
- Decision: **STEAL NOW**
- Import:
  - notifications as action router
  - incident-linked operator inbox

### Tela
- Decision: **REFERENCE**
- Import:
  - transport/reachability ideas for bad network boundaries

## Chronicle / Review / Recall

### coding_agent_session_search
- Decision: **STEAL NOW**
- Import:
  - session indexing as first-class subsystem
  - cross-provider history and recall

### Langfuse
- Decision: **STEAL NOW**
- Import:
  - trace/session/observation schema

### Phoenix
- Decision: **ADAPT SOON**
- Import:
  - OTEL/openinference-friendly trace model

### HoneyHive
- Decision: **STEAL NOW**
- Import:
  - operator review UI
  - replay + annotations + queues

### Weave
- Decision: **ADAPT SOON**
- Import:
  - scoring/evals/versioned reviewer artifacts

### Mem0
- Decision: **STEAL NOW**
- Import:
  - curated timestamped/versioned memory objects

### Letta
- Decision: **ADAPT SOON**
- Import:
  - explicit persistent memory surface

## Knowledge / Blueprint / Intentions / Feeds

### Tana
- Decision: **STEAL NOW**
- Import:
  - object/context graph
  - work inside the knowledge surface
  - meeting-to-work transformation

### Capacities
- Decision: **STEAL NOW**
- Import:
  - object-centric notes
  - human graph UX

### Graphiti
- Decision: **STEAL NOW**
- Import:
  - temporal provenance / validity windows / evolving facts

### ResearchRabbit
- Decision: **ADAPT SOON**
- Import:
  - curiosity expansion / related discovery exploration

### AFFiNE
- Decision: **ADAPT SOON**
- Import:
  - docs + whiteboard + database convergence

### React Flow
- Decision: **STEAL NOW**
- Import:
  - structured node/planner surfaces

### tldraw
- Decision: **STEAL NOW**
- Import:
  - schematic / loose canvas layer

### Neo4j Bloom
- Decision: **STEAL NOW**
- Import:
  - search-to-graph interaction model

## Productivity / Tiny Utility vApps

### Lunatask
- Decision: **STEAL NOW**
- Import:
  - Must/Should/Want
  - humane prioritization
  - responsibilities/focus crossover

### Sunsama
- Decision: **STEAL NOW**
- Import:
  - today planning / shutdown ritual / realistic workload

### Akiflow
- Decision: **ADAPT SOON**
- Import:
  - universal inbox + shortcut-first planning

### Routine
- Decision: **STEAL NOW**
- Import:
  - quick capture + meeting-to-work extraction

### Morgen
- Decision: **ADAPT SOON**
- Import:
  - capacity-aware calendar planning

### Reflect
- Decision: **REFERENCE**
- Import:
  - encrypted notes + calendar convergence ideas

### Braintoss
- Decision: **STEAL NOW**
- Import:
  - zero-ceremony capture

### Twos
- Decision: **ADAPT SOON**
- Import:
  - tiny frictionless capture/inbox framing

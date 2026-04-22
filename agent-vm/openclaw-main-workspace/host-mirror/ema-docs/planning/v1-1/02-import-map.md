# EMA v1.1 — Cross-Pollination Import Map

Date: 2026-04-13
Plane: planning
Scope: STEAL NOW + ADAPT SOON sources from the v1.1 program brief, mapped to EMA subsystems and concrete entry points

## How to read this map

- **Steal now** = lift pattern directly into v1.1 slice
- **Adapt soon** = pattern blocked on earlier deliverable; schedule for the wave after
- **Reference** = philosophy/shape only, no code lift
- **Entry point** = the EMA file where the pattern first lands

## Track A — Shell / Launchpad / HQ

| Source | Pattern to steal | EMA entry point |
|---|---|---|
| **AGOR** | Workspace rail + dock multi-panel operator shell | `apps/renderer/src/components/launchpad/LaunchpadApp.tsx` (new) |
| **Plane** | Multi-project nav + command palette | `apps/renderer/src/components/layout/CommandPalette.tsx` (new) |
| **Dagster** | Asset catalog + lineage grid as HQ layout | `apps/renderer/src/components/hq/HQ*.tsx` (extend) |
| **Temporal UI** | Workflow list + timeline detail view for executions | `apps/renderer/src/components/executions/ExecutionsApp.tsx` |
| **Cockpit** | Multi-host operator grid (host reality in shell) | `apps/renderer/src/components/machines/MachinesApp.tsx` (new) |

## Track B — Control plane / Chronicle / Review / Trace

| Source | Pattern to steal | EMA entry point |
|---|---|---|
| **Langfuse** | Trace tree + span detail view | `apps/renderer/src/components/traces/TraceDetail.tsx` (new) |
| **HoneyHive** | Eval-style review queue with diffs | `apps/renderer/src/components/review/ReviewApp.tsx` (new) |
| **Temporal** | Durable workflow lifecycle (intent→proposal→execution→harvest) | `services/core/loop/orchestrator.ts` (extend, HTTP expose) |
| **Mem0** | Memory write/read/promote policy | `services/core/memory/` (schema + promote verb) |
| **coding_agent_session_search** | Chronicle search across sessions | `services/core/traces/search.ts` (new) |

## Track C — Agent Hub / Live View / Comms

| Source | Pattern to steal | EMA entry point |
|---|---|---|
| **Overstory** | Multi-agent dispatch console | `apps/renderer/src/components/agents/AgentsApp.tsx` (extend) |
| **OpenASE** | Agent Session Environment with trace panel | `apps/renderer/src/components/agent-live/AgentLiveView.tsx` (new) |
| **MCP Agent Mail** | Durable agent-to-agent inbox | `services/core/comms/` (new) |
| **claude-view** | Live stream of Claude Code session into BrowserWindow | `apps/renderer/src/components/agent-live/LiveStream.tsx` (new) |
| **LangSmith Studio** | Studio-style editable run view | `apps/renderer/src/components/executions/ExecutionDetail.tsx` |
| **Liveblocks** | Presence + shared cursors across agents + human | deferred to post-v1.1 collaboration wave |

## Track D — Host reality / Terminal / Machines / Services / Notifications

| Source | Pattern to steal | EMA entry point |
|---|---|---|
| **sshx** | Web-embedded SSH session with shareable read-only links | `services/core/machines/ssh-bridge.ts` (new, thin wrapper) |
| **ntfy** | Simple push-notification server protocol | `services/core/notifications/` (new) |
| **ShellHub** | Device catalog + remote shell routing | `services/core/machines/registry.ts` (new) |
| **Teleport** | Cert-based access to machines | reference only; v1.1 is local + known-key |
| **Grafana IRM / Better Stack** | On-call/incident surfacing into notifications | reference only; later wave |
| **Zellij** | Pane multiplexing model for Terminal vApp | `apps/renderer/src/components/terminal/TerminalApp.tsx` (extend) |

## Track E — Knowledge / Blueprint / Intentions / Graph / Research / Feeds

| Source | Pattern to steal | EMA entry point |
|---|---|---|
| **Tana** | Supertag-based typed nodes | `shared/schemas/planning-node.ts` (new) + Blueprint vApp |
| **Capacities** | Object-type-driven knowledge surfaces | `apps/renderer/src/components/wiki/WikiApp.tsx` (replace stub) |
| **Graphiti** | Bi-temporal knowledge graph | `services/core/memory/graph.ts` (adapter over FalkorDB) |
| **React Flow** | Intent + planning graph renderer | `apps/renderer/src/components/graph/GraphVisualizerApp.tsx` (new) |
| **tldraw** | Blueprint canvas | `apps/renderer/src/components/canvas/CanvasApp.tsx` (extend) |
| **Neo4j Bloom** | Graph exploration UI reference | reference only |
| **ResearchRabbit** | Citation-graph research exploration | `apps/renderer/src/components/research/ResearchViewerApp.tsx` (new) |
| **AFFiNE** | Blocks + whiteboard hybrid | reference for Wiki+Canvas convergence, later |

## Track F — Productivity

| Source | Pattern to steal | EMA entry point |
|---|---|---|
| **Lunatask** | Today + capture humane prioritization | `apps/renderer/src/components/hq/Today.tsx` (extend) |
| **Sunsama** | Daily planning ritual + timebox | `apps/renderer/src/components/calendar/CalendarApp.tsx` (new) |
| **Routine** | Habit-to-calendar integration | reference for habit vApp |
| **Braintoss** | One-tap capture to inbox | `apps/renderer/src/components/brain-dump/BrainDumpApp.tsx` (extend quick-capture) |
| **Akiflow / Morgen / Twos** | Daily unified inbox patterns | reference |

## Adapt-soon (wave after first slice)

Mission Control / Autensa, AgentOS, AutoGen Studio, LiveKit Agents, Fleet, Phoenix, Weave, Letta — all require either the orchestrator HTTP layer or the proposal pipeline to exist before adaptation makes sense.

## Deferred past v1.1

Any multi-operator collaboration (Liveblocks, Yjs CRDTs), federation (Teleport, full P2P), and self-modification (evolution engine — see DEC-006). These belong to v1.2+.

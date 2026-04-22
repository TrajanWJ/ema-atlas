# Track C — Agent Hub / Live View / Plans / Comms

Date: 2026-04-13
Plane: planning
Owning canon: `canon/specs/AGENT-RUNTIME`, `canon/specs/agents/_MOC`

## Scope

Operator visibility and control of running agents. Live tmux read-through. Cross-agent comms via durable inbox. Each agent's plan and status linked to shared entities.

## Entity implications

- **New**: `comms-message` (agent↔operator, agent↔agent), `agent-plan` (read model over `execution` + `intent`)
- **Extend**: `runtime-session` with `workstream_id`, `agent-plan` JSON
- **Reuse**: `runtime-fabric.{tool,session,event}` schemas (already wired)

## Current reality

- `services/core/runtime-fabric/` — tmux control plane, session detection, prompt dispatch, screen capture, WS events. Real.
- `services/core/actors/` — actor classifier, router, MCP export
- `apps/renderer/src/components/agents/AgentsApp.tsx` — 154 LOC, reads `/api/agents/status`
- `apps/renderer/src/components/terminal/TerminalApp.tsx` — 1301 LOC, wires into `runtime-fabric` store
- No Agent Live View vApp
- No agent-to-operator inbox

## Implementation sequence

1. **Extend `runtime-session` schema** — add optional `workstream_id` and `plan_id`. Migration: add columns to `runtime_sessions` with default null.
2. **Agent Hub extension** (`apps/renderer/src/components/agents/AgentsApp.tsx`) — add workstream column, spawn/resume/kill buttons wired to orchestrator HTTP (Track B step 6).
3. **Agent Live View vApp** — new `apps/renderer/src/components/agent-live/AgentLiveViewApp.tsx`:
   - Left rail: session list
   - Center: xterm.js read-through of the selected session's captured output
   - Right: trace step stream for the session's active execution
   - Uses existing `runtime-fabric` WS channel + new `/api/traces/by-session/:id`
4. **Comms service** — new `services/core/comms/`:
   - Tables: `comms_messages` (id, workstream_id, from_id, to_id, body, kind, created_at)
   - Routes: `GET /api/comms/messages`, `POST /api/comms/messages`, `GET /api/comms/inbox`
   - MCP tools: `comms_send`, `comms_inbox`
5. **AgentCommsApp vApp** — new `apps/renderer/src/components/comms/AgentCommsApp.tsx` — inbox + thread view, scoped by workstream.
6. **Agent plan read model** — server-side read model joining `execution.progress` + linked intent tree + next step. Exposed at `GET /api/agents/:id/plan`. Used by Agent Hub plan column.

## Dependencies

- Track B workstream schema + routes.
- Track B orchestrator HTTP — needed for spawn/resume/kill buttons.
- Runtime-fabric already exists; no new upstream dependencies.

## Steal-now imports

- Overstory multi-agent dispatch console → Agent Hub extension
- OpenASE Agent Session Environment → Agent Live View layout (three-pane)
- MCP Agent Mail → `services/core/comms/` durable inbox pattern
- claude-view live session stream → runtime-fabric WS bridge into `AgentLiveView`
- LangSmith Studio → execution detail drawer linked from Agent Hub

## Risk areas

- **Tmux capture drift**: long sessions produce large scroll-back. Cap at 10k lines per session in v1.1, paginate below.
- **Spawn auth**: orchestrator spawn from UI must not let the renderer start arbitrary shell commands. Gate through orchestrator HTTP which already runs in daemon process; UI never shells out directly.
- **Comms abuse**: agent-to-agent messages can loop. v1.1 = no auto-forwarding. Messages are inert unless a human or explicit pipe acts on them.

## Minimum real MVP

- Agent Hub shows at least one running runtime-fabric session with live status
- Agent Live View renders the tmux scroll-back of a selected session
- Operator can send a comms message to an agent, agent's next run sees the message via context bundle (through orchestrator context endpoint)
- Every running session has a `workstream_id` and appears in HQ workstream strip

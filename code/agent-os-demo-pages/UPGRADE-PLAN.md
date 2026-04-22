# Agent OS v8 — OpenClaw Architecture Steal Plan

## What We're Taking from OpenClaw

### 1. Backend: WebSocket Protocol (bridge server)
- **Current:** Raw JSON `{type, data}` messages, no request/response correlation
- **Steal:** OpenClaw's framed protocol: `{type:"req", id, method, params}` → `{type:"res", id, ok, payload}`
- **Steal:** Sequence-numbered server push events with gap detection
- **Steal:** Reconnect with backoff + device auth challenge-response
- **Add:** SSE feed stream endpoint (already half-done)

### 2. Backend: Missing API Endpoints
- **Sessions API** — list/manage agent sessions (proxy OpenClaw gateway)
- **Usage/Cost API** — token usage tracking per agent/session
- **Config API** — schema-driven config management
- **Skills API** — list/toggle/install skills
- **Exec Approvals API** — manage exec allowlists
- **Health API** — structured health checks
- **Models API** — list available models

### 3. Frontend: State Management Layer
- **Current:** Global variables everywhere (`feedEvents`, `queueCards`, `currentChannel`)
- **Steal:** Centralized state store with change notification
- **Pattern:** `AppState` object + `subscribe(path, callback)` + `setState(path, value)`

### 4. Frontend: Gateway Client
- **Current:** `Bridge` object with raw fetch + manual WS
- **Steal:** OpenClaw's `GatewayBrowserClient` pattern
- **Features:** Request/response correlation, pending request tracking, auto-reconnect, challenge auth

### 5. Frontend: Missing Pages & Components

#### New Pages:
- **Sessions** — Live session list with token counts, model info, actions (reset/delete)
- **Usage Analytics** — Token usage charts, cost breakdown, per-agent metrics
- **Config Editor** — Schema-driven form + raw JSON editor (from OpenClaw config.ts)
- **Exec Approvals** — Review and manage command allowlists
- **Logs Viewer** — Full log viewer with level filters, search, auto-follow (from OpenClaw logs.ts)
- **Debug Panel** — Raw RPC calls, status/health/models snapshots

#### Enhanced Pages:
- **System (Pulse)** — Add service restart buttons, process kill, disk cleanup
- **Mind** — Add note editor with live preview, frontmatter editor
- **Tasks** — Add Gantt-style timeline, dependency visualization
- **Workbench** — Add live tool call streaming cards (from OpenClaw tool-cards.ts)

#### New Components:
- **Resizable sidebar** — Drag to resize panels (from OpenClaw resizable-divider.ts)
- **Schema form renderer** — Auto-generate forms from JSON Schema
- **Toast notifications** — Improved with progress bars, actions
- **Markdown renderer** — Full markdown with syntax highlighting, mermaid
- **Split pane** — Tool output sidebar like OpenClaw chat
- **Loading skeletons** — Proper loading states
- **Data tables** — Sortable, filterable, paginated (from OpenClaw sessions view)

### 6. Frontend: Chat Improvements (Talk page)
- **Steal:** Tool call cards with collapsible output
- **Steal:** Streaming text with live updates
- **Steal:** Message grouping with timestamps
- **Steal:** Copy as markdown
- **Steal:** Chat export
- **Steal:** Attachment support (image upload)
- **Steal:** Session switching in chat

### 7. Styling Improvements
- **Steal:** CSS custom property system from OpenClaw (base.css)
- **Steal:** Config form styles
- **Steal:** Tool card styles
- **Keep:** Catppuccin Mocha theme (it's good)
- **Add:** Light theme option

## Implementation Order

### Phase 1: Backend Protocol + State Layer (foundation)
1. Upgrade bridge WS to framed protocol
2. Add state management layer to frontend
3. Upgrade Bridge client to use framed protocol

### Phase 2: Missing Backend APIs
4. Sessions proxy API
5. Usage/cost tracking API  
6. Config API (read/write openclaw.json)
7. Health/models/skills APIs

### Phase 3: New Frontend Pages
8. Sessions page
9. Usage analytics page
10. Config editor page
11. Enhanced logs viewer
12. Debug panel

### Phase 4: Component Upgrades
13. Tool call cards in Talk view
14. Schema form renderer
15. Data table component
16. Split pane / resizable divider
17. Markdown renderer upgrade

### Phase 5: Polish
18. Loading skeletons everywhere
19. Light theme
20. Keyboard shortcuts improvement
21. Mobile responsive pass

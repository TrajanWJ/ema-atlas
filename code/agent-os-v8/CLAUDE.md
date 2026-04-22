# Agent OS v8 — Full Rewrite

## What This Is
Agent OS is a web dashboard for managing an AI agent system. It talks to a bridge server (Express + WS) that proxies Discord, manages dispatch queues, vault search, and system monitoring.

## Architecture (Stolen from OpenClaw Control UI)
- **Framework:** Lit Web Components (no React/Vue)
- **Build:** Vite + TypeScript  
- **Styling:** Plain CSS with custom properties (Catppuccin Mocha theme)
- **State:** Centralized reactive store in root component
- **WS Protocol:** Framed JSON req/res with correlation IDs
- **No shadow DOM** — global CSS, `createRenderRoot() { return this; }`

## Source References
- OpenClaw UI source: `~/openclaw-control-ui-source/` (Lit + Vite + TS, ~40K lines)
- Old Agent OS v7: `~/Projects/agent-os-demo-pages/` (vanilla JS, ~44K lines)
- Bridge server: `~/Projects/agent-os-bridge/server.js` (Express + WS, ~2500 lines)

## Design Patterns (from OpenClaw)

### Root Component Pattern
Single `<agent-os-app>` LitElement holds all `@state()` reactive properties.
Views are pure render functions that take state and return `html` templates.
Controllers are stateless functions that mutate host state.

```
src/
├── main.ts              # Entry: imports styles + app component
├── styles/              # Global CSS files
│   ├── base.css         # Custom properties, resets, theme
│   ├── layout.css       # Shell, sidebar, topbar
│   ├── components.css   # Buttons, cards, forms, tables
│   └── pages/           # Per-page styles
├── app.ts               # Root <agent-os-app> component, all @state
├── app-render.ts        # Main render() dispatching to views
├── gateway.ts           # WS client with framed protocol
├── controllers/         # Stateless state mutation functions
├── views/               # Pure render functions per page
├── types.ts             # Shared TypeScript types
└── utils.ts             # Helpers
```

### WS Protocol
```
Client → Server: { type: "req", id: "<uuid>", method: "chat.send", params: {...} }
Server → Client: { type: "res", id: "<uuid>", ok: true, payload: {...} }
Server → Client: { type: "event", event: "feed", payload: {...}, seq: 42 }
```

### Controller Pattern
```typescript
// controllers/feed.ts
export async function loadFeed(state: AppState) {
  state.feedLoading = true;
  try {
    const res = await state.client.request("feed.list", { limit: 50 });
    state.feedEvents = res.events;
  } catch (err) {
    state.feedError = String(err);
  } finally {
    state.feedLoading = false;
  }
}
```

### View Pattern  
```typescript
// views/feed.ts
export function renderFeed(state: AppViewState): TemplateResult {
  if (state.feedLoading) return html`<div class="loading-skeleton">...</div>`;
  return html`
    <div class="feed-list">
      ${state.feedEvents.map(e => html`<div class="feed-card">${e.content}</div>`)}
    </div>
  `;
}
```

## Pages to Build

### From v7 (port these):
1. **Stream/Feed** — Activity feed with filter chips, agent status bar, quick stats
2. **Talk** — Discord-style chat with channels, threads, reactions, typing indicators
3. **Inbox** — Triaged items with keyboard shortcuts, bulk actions, 3-panel layout
4. **Proposals** — Pipeline viz, approval workflow, auto-triage confidence
5. **Tasks** — Task list with quick-add, 3-panel detail, priority management
6. **Projects** — Project cards with task/mission/vault cross-refs
7. **Missions** — Goal tracking with progress, milestones, velocity
8. **Pipelines** — Visual workflow stages
9. **Mind** — Vault browser with search, graph viz, tags, note reader/editor
10. **System/Pulse** — Service status, agent status, cron, cost, logs, processes
11. **Plans** — Kanban boards with drag-and-drop
12. **Workbench** — Live agent monitoring with task details
13. **Rooms** — Multi-agent chat rooms
14. **Briefing** — Daily briefing document
15. **Roles** — Agent configuration and autonomy levels

### New pages (from OpenClaw):
16. **Sessions** — Live session list with token counts, model, actions
17. **Usage** — Token usage analytics with charts
18. **Config** — Schema-driven config form + raw JSON editor
19. **Skills** — Skill grid with toggle, install, API keys
20. **Debug** — Raw RPC, status dumps, model catalog

### Key Components:
- Command palette (⌘K) with fuzzy search
- Toast notifications with progress
- Data tables (sortable, filterable, paginated)
- Loading skeletons
- Resizable split panes
- Markdown renderer with syntax highlighting
- Tool call cards (from OpenClaw)
- Emoji picker
- Agent drawer/detail panel

## Theme
Catppuccin Mocha with CSS custom properties:
```css
:root {
  --base: #1e1e2e;
  --mantle: #181825;
  --crust: #11111b;
  --surface0: #313244;
  --surface1: #45475a;
  --surface2: #585b70;
  --text: #cdd6f4;
  --subtext0: #a6adc8;
  --subtext1: #bac2de;
  --accent: #D4A574;
  --blue: #89b4fa;
  --green: #a6e3a1;
  --red: #f38ba8;
  --yellow: #f9e2af;
  --mauve: #cba6f7;
}
```

## Bridge Server URL
The bridge runs at `http://192.168.122.10:18790` (same VM).
WebSocket at `ws://192.168.122.10:18790`.

## Build & Run
```bash
npm install
npm run dev    # Vite dev server on :5173
npm run build  # Build to dist/
```

## Rules
1. NO shadow DOM — use `createRenderRoot() { return this; }`
2. Views are pure functions, not components
3. Controllers are stateless — they take state object and mutate it
4. All state lives in the root `<agent-os-app>` component
5. CSS custom properties for theming
6. Lazy-load non-essential views
7. Keep the warm gold accent (#D4A574) throughout
8. Mobile-responsive with bottom nav bar
9. Real data from bridge server, graceful fallback to demo data

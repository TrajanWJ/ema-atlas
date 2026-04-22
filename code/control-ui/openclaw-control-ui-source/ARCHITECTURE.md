# OpenClaw Control UI — Full Architecture Map

## Source Location
Copied from `https://github.com/openclaw/openclaw.git` to `~/openclaw-control-ui-source/`

## Stats
- **UI frontend:** ~40K lines TypeScript + ~10K lines CSS (228 files)
- **Gateway backend:** ~50K lines TypeScript (229 files)
- **Total:** ~100K lines of production source

---

## 1. Frontend Architecture (Vite + Lit)

### Stack
- **Framework:** Lit (Web Components) — no React/Vue/Angular
- **Build:** Vite (`ui/vite.config.ts`)
- **Styling:** Plain CSS (no Tailwind/SCSS) — `ui/src/styles/`
- **i18n:** Custom system (`ui/src/i18n/`) — en, de, es, pt-BR, zh-CN, zh-TW
- **Entry:** `ui/src/main.ts` → imports `styles.css` + `ui/app.ts`

### App Structure (`ui/src/ui/`)

```
app.ts                    — Root `<openclaw-app>` LitElement (730 lines)
                            All reactive state lives here as @state() properties
                            ~120 @state() fields covering every panel
app-render.ts             — Main render function (1950 lines)
                            Lazy-loads views, routes by tab, wires callbacks
app-gateway.ts            — Gateway WebSocket connection + event routing
app-lifecycle.ts          — connectedCallback/disconnectedCallback/updated hooks
app-chat.ts               — Chat send/abort/queue logic
app-settings.ts           — Settings persistence, tab switching, theme
app-scroll.ts             — Auto-scroll chat + logs
app-tool-stream.ts        — Live tool call streaming state
app-view-state.ts         — AppViewState type (union of all state)
app-render.helpers.ts     — Shared render helpers (tabs, controls, session select)
app-render-usage-tab.ts   — Usage analytics tab render
```

### Gateway Client (`ui/src/ui/gateway.ts`)
- Raw WebSocket client (492 lines)
- Protocol: JSON frames over WS
  - `{ type: "req", id, method, params }` → `{ type: "res", id, ok, payload }`
  - `{ type: "event", event, payload, seq }` (server push)
- Challenge-response auth with device identity (WebCrypto)
- Device token caching, auto-reconnect with backoff
- Nonce-based connect handshake

### Controllers (`ui/src/ui/controllers/`)
Each controller is a stateless module that takes the app state object and mutates it:

| Controller | Purpose |
|---|---|
| `chat.ts` | Load history, send messages, handle chat events |
| `config.ts` | Load/save/apply config, schema-driven form |
| `cron.ts` | CRUD cron jobs, form validation, filters |
| `agents.ts` | List agents, save agent config |
| `sessions.ts` | List/patch/delete sessions |
| `channels.ts` | Channel status, WhatsApp QR login |
| `skills.ts` | Skill enable/disable, API key management |
| `nodes.ts` | Node listing |
| `devices.ts` | Device pairing approve/reject/rotate/revoke |
| `exec-approvals.ts` | Exec allowlist management |
| `logs.ts` | Live log tail |
| `debug.ts` | Status/health/models + raw RPC |
| `presence.ts` | Connected instances |
| `usage.ts` | Token/cost usage analytics |
| `agent-files.ts` | Read/write agent workspace files |
| `agent-identity.ts` | Agent avatar/name resolution |
| `agent-skills.ts` | Per-agent skill status |
| `assistant-identity.ts` | Chat assistant identity |
| `health.ts` | Gateway health summary |
| `models.ts` | Model catalog |

### Views (`ui/src/ui/views/`)
Pure render functions — take props, return Lit `html` templates:

| View | Lines | What it renders |
|---|---|---|
| `chat.ts` | 1489 | Full chat UI with messages, streaming, markdown, tool cards, sidebar |
| `config.ts` | 1118 | Schema-driven config form + raw JSON editor |
| `cron.ts` | ~800 | Cron job list/edit/runs |
| `agents.ts` | ~600 | Agent list, overview, files, tools, skills panels |
| `overview.ts` | 410 | Dashboard overview cards |
| `channels.ts` | ~500 | Channel status + WhatsApp/Telegram/Discord setup |
| `sessions.ts` | ~400 | Session list with sort/filter/pagination |
| `nodes.ts` | ~300 | Node list + device pairing + exec approvals |
| `skills.ts` | ~300 | Skill grid with toggle/API key |
| `usage.ts` | ~800 | Usage analytics with charts |
| `logs.ts` | ~200 | Live log viewer |
| `debug.ts` | ~300 | Debug panel with raw RPC |
| `login-gate.ts` | ~100 | Auth gate (token/password input) |

### Chat Subsystem (`ui/src/ui/chat/`)

| Module | Purpose |
|---|---|
| `tool-cards.ts` | Render tool call cards with collapsible output |
| `tool-helpers.ts` | Tool name/arg formatting |
| `grouped-render.ts` | Group consecutive messages by role |
| `message-extract.ts` | Extract text from various message formats |
| `message-normalizer.ts` | Normalize message structures |
| `slash-commands.ts` | Client-side slash command parsing |
| `slash-command-executor.ts` | Execute local slash commands |
| `input-history.ts` | Input history (up/down arrow) |
| `search-match.ts` | Message search |
| `export.ts` | Export chat as markdown |
| `copy-as-markdown.ts` | Copy message as markdown |
| `speech.ts` | Text-to-speech |
| `session-cache.ts` | Per-session state caching |
| `attachment-support.ts` | Image attachment handling |
| `pinned-messages.ts` | Pinned messages |
| `deleted-messages.ts` | Deleted message handling |
| `constants.ts` | Chat constants |

### Styling (`ui/src/styles/`)

| File | Lines | Scope |
|---|---|---|
| `components.css` | 3945 | All UI components (buttons, cards, pills, forms, tables, modals) |
| `config.css` | 1834 | Config form, schema tree, raw editor |
| `layout.css` | 1051 | Shell, sidebar, topbar, content grid |
| `layout.mobile.css` | 653 | Mobile responsive overrides |
| `base.css` | 562 | CSS custom properties, resets, theme variables |
| `chat/layout.css` | 1016 | Chat container, message bubbles, input area |
| `chat/tool-cards.css` | 511 | Tool call cards |
| `chat/grouped.css` | 498 | Grouped message rendering |
| `chat/text.css` | 176 | Chat text formatting |
| `chat/sidebar.css` | 129 | Tool output sidebar |

### Key Design Patterns

1. **No shadow DOM** — `createRenderRoot() { return this; }` — styles are global CSS
2. **Functional views** — Views are pure functions, not components
3. **Lazy loading** — Non-chat views lazy-import on first navigation
4. **State centralization** — All state in the root `OpenClawApp` element
5. **Controller pattern** — Stateless functions that mutate the host state
6. **Theme system** — CSS custom properties with named themes (`claw`, etc.)

---

## 2. Backend Architecture (Gateway WebSocket Server)

### Core Files (`src/gateway/`)

| File | Lines | Purpose |
|---|---|---|
| `server.impl.ts` | 1354 | Main gateway server implementation |
| `server-http.ts` | 1013 | HTTP server (static files, API endpoints) |
| `server-chat.ts` | 837 | Chat message processing pipeline |
| `server-channels.ts` | 585 | Channel management (WA/Telegram/Discord) |
| `server-cron.ts` | 512 | Cron job scheduler |
| `server-node-events.ts` | 631 | Node event handling |
| `client.ts` | 831 | Gateway client (for CLI/TUI) |
| `call.ts` | 954 | Agent call orchestration |
| `auth.ts` | 494 | Authentication |
| `net.ts` | 481 | Network utilities |
| `control-ui.ts` | 481 | Control UI static file serving |
| `protocol/index.ts` | 707 | WebSocket protocol definition |

### Server Methods (`src/gateway/server-methods/`)

| Method file | Lines | RPC methods |
|---|---|---|
| `chat.ts` | 1601 | `chat.send`, `chat.history`, `chat.abort`, `chat.inject` |
| `nodes.ts` | 1179 | `node.list`, `node.command`, `node.invoke` |
| `sessions.ts` | 1146 | `sessions.list`, `sessions.patch`, `sessions.reset`, `sessions.delete` |
| `agent.ts` | 858 | `agent.run`, agent lifecycle |
| `usage.ts` | 869 | `sessions.usage`, usage analytics |
| `agents.ts` | 774 | `agents.list`, `agents.config` |
| `config.ts` | 551 | `config.get`, `config.set`, `config.apply`, `config.schema` |
| `send.ts` | 484 | `send` (outbound message delivery) |

### WebSocket Protocol

```
Client → Gateway:
  { type: "req", id: "<uuid>", method: "<rpc-method>", params: {...} }

Gateway → Client:
  { type: "res", id: "<uuid>", ok: true, payload: {...} }
  { type: "res", id: "<uuid>", ok: false, error: { code, message, details } }

Gateway → Client (push):
  { type: "event", event: "<event-name>", payload: {...}, seq: <number> }
```

### Key Events (server → client)
- `chat` — Chat message deltas/finals/aborts
- `agent.tool` — Live tool call events
- `connect.challenge` — Auth nonce
- `sessions.changed` — Session list updates
- `update-available` — New version available
- `exec.approval.requested` — Exec approval needed
- `exec.approval.resolved` — Exec approval result

### Auth Flow
1. Client opens WebSocket
2. Server sends `connect.challenge` with nonce
3. Client signs nonce with device private key (WebCrypto ECDSA P-256)
4. Client sends `connect` request with:
   - Device identity (id, publicKey, signature)
   - Auth token or password
   - Client info (name, version, mode)
   - Requested role + scopes
5. Server validates → returns `hello-ok` with device token

### Session Architecture
- Sessions scoped by `agent:<agentId>:<sessionKey>`
- Per-sender (each client gets own sessions) or global scope
- Session state: transcript, thinking level, model overrides
- Persistence: filesystem (`~/.openclaw/sessions/`)

---

## 3. How to Steal/Reuse It

### Option A: Run the Control UI standalone
```bash
cd ~/openclaw-control-ui-source
# Install deps
pnpm install
# Dev server pointing at your gateway
VITE_GATEWAY_URL=ws://127.0.0.1:18789 pnpm dev
```

### Option B: Extract specific subsystems

**Chat UI only:** Copy `ui/src/ui/views/chat.ts`, `ui/src/ui/controllers/chat.ts`, `ui/src/ui/chat/`, and `ui/src/styles/chat/`

**Gateway client:** Copy `ui/src/ui/gateway.ts` — standalone WS client with auth

**Config form:** Copy `ui/src/ui/views/config.ts`, `ui/src/ui/controllers/config.ts`, `ui/src/styles/config.css` — schema-driven form renderer

**Theme system:** Copy `ui/src/styles/base.css` (CSS custom properties) + `ui/src/ui/theme.ts`

### Option C: Fork the whole thing
The full source is at `~/openclaw-control-ui-source/` — 628 TypeScript files. Build with `pnpm ui:build`.

---

## 4. Files Index

```
~/openclaw-control-ui-source/
├── src/                          # Frontend source
│   ├── main.ts                   # Entry point
│   ├── styles.css                # CSS imports
│   ├── styles/                   # All CSS (10K lines)
│   ├── i18n/                     # Internationalization
│   ├── ui/
│   │   ├── app.ts                # Root component (all state)
│   │   ├── app-render.ts         # Main render tree
│   │   ├── gateway.ts            # WebSocket client
│   │   ├── controllers/          # State mutation functions
│   │   ├── views/                # Pure render functions
│   │   ├── chat/                 # Chat subsystem
│   │   ├── components/           # Reusable components
│   │   └── ...                   # Helpers, types, etc.
│   └── local-storage.ts          # Storage utilities
├── gateway-backend/              # Server-side gateway source
│   ├── server.impl.ts            # Main server
│   ├── server-methods/           # RPC method implementations
│   ├── server-http.ts            # HTTP server
│   ├── server-chat.ts            # Chat pipeline
│   ├── protocol/                 # WS protocol types
│   ├── auth.ts                   # Authentication
│   └── ...                       # 200+ more files
├── shared/                       # Shared types & routing
├── vite.config.ts                # Build config
├── index.html                    # HTML shell
└── ARCHITECTURE.md               # This file
```

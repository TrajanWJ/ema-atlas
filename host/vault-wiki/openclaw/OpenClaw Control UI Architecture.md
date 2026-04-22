---
title: "OpenClaw Control UI Architecture"
type: reference
created: 2026-04-06
tags: [openclaw, archived, ui, architecture, frontend, backend]
summary: "Full architecture map of the OpenClaw Control UI - 100K lines TypeScript, Lit frontend, Express gateway backend"
---

# OpenClaw Control UI Architecture

## Stats
- **Frontend:** ~40K lines TypeScript + ~10K lines CSS (228 files)
- **Gateway backend:** ~50K lines TypeScript (229 files)
- **Total:** ~100K lines of production source

Source: `https://github.com/openclaw/openclaw.git`

---

## Frontend (Vite + Lit)

### Stack
- **Framework:** Lit (Web Components) -- no React/Vue/Angular
- **Build:** Vite
- **Styling:** Plain CSS (no Tailwind/SCSS)
- **i18n:** Custom system (en, de, es, pt-BR, zh-CN, zh-TW)

### App Structure

Root `<openclaw-app>` LitElement (730 lines) with ~120 `@state()` reactive properties covering every panel.

**Key files:**
- `app.ts` -- Root component, all state
- `app-render.ts` -- Main render function (1950 lines), lazy-loads views
- `gateway.ts` -- Raw WebSocket client (492 lines) with challenge-response auth

### Controllers (Stateless state mutation functions)
chat, config, cron, agents, sessions, channels, skills, nodes, devices, exec-approvals, logs, debug, presence, usage, agent-files, agent-identity, agent-skills, assistant-identity, health, models

### Views (Pure render functions)
| View | Lines | Purpose |
|------|-------|---------|
| chat.ts | 1489 | Full chat UI with streaming, markdown, tool cards |
| config.ts | 1118 | Schema-driven config form + raw JSON editor |
| cron.ts | ~800 | Cron job management |
| agents.ts | ~600 | Agent list, overview, files, tools, skills |
| overview.ts | 410 | Dashboard cards |
| usage.ts | ~800 | Analytics with charts |

### Chat Subsystem
16 modules: tool-cards, grouped-render, message-extract, slash-commands, input-history, search-match, export, copy-as-markdown, speech, session-cache, attachment-support, pinned-messages, and more.

### Design Patterns
1. No shadow DOM -- global CSS
2. Functional views (pure functions, not components)
3. Lazy loading for non-chat views
4. All state centralized in root element
5. Controller pattern for state mutations
6. CSS custom properties theme system

---

## Backend (Gateway WebSocket Server)

### Core Files
| File | Lines | Purpose |
|------|-------|---------|
| server.impl.ts | 1354 | Main gateway server |
| server-http.ts | 1013 | HTTP server, static files |
| server-chat.ts | 837 | Chat processing pipeline |
| server-channels.ts | 585 | Channel management (WA/Telegram/Discord) |
| server-cron.ts | 512 | Cron scheduler |
| server-node-events.ts | 631 | Node event handling |
| client.ts | 831 | Gateway client (CLI/TUI) |
| call.ts | 954 | Agent call orchestration |

### WebSocket Protocol
```
Client -> Gateway: { type: "req", id, method, params }
Gateway -> Client: { type: "res", id, ok, payload }
Gateway -> Client: { type: "event", event, payload, seq } (push)
```

### Auth Flow
1. Client opens WebSocket
2. Server sends `connect.challenge` with nonce
3. Client signs nonce with device private key (WebCrypto ECDSA P-256)
4. Client sends `connect` with device identity, auth token, client info, role + scopes
5. Server validates, returns `hello-ok` with device token

### Key Events
- `chat` -- message deltas/finals/aborts
- `agent.tool` -- live tool call events
- `sessions.changed` -- session list updates
- `exec.approval.requested/resolved` -- execution approval flow

### Session Architecture
- Scoped by `agent:<agentId>:<sessionKey>`
- Per-sender or global scope
- State: transcript, thinking level, model overrides
- Persistence: filesystem (`~/.openclaw/sessions/`)

## Related

- [[OpenClaw System Overview]]
- [[OpenClaw MCP Server]]

# ClaudeForge Architecture

## Overview

ClaudeForge is a monorepo that turns a machine into a remote AI coding IDE accessible via Discord and a web browser. Directories become Discord categories, sessions become channels, and a web UI mirrors everything in real time.

Three access surfaces, one source of truth:
1. **Discord** — Mobile-first chat interface
2. **Web UI** — Desktop dashboard with chat, tasks, and system monitoring
3. **Terminal** — `tmux attach -t <session>` for raw access

## Package Structure

```
claude-remote-discord/
├── packages/
│   ├── shared/       # Types, constants, event definitions
│   │   └── src/
│   │       ├── types.ts       # Core data models (Session, Message, Task, Project)
│   │       ├── events.ts      # ProviderEvent, ServerEvent, ClientCommand, WS_EVENTS
│   │       ├── constants.ts   # Ports, colors, design tokens, tool icons
│   │       └── index.ts       # Re-exports
│   │
│   ├── server/       # REST API + WebSocket + Provider management + SQLite
│   │   └── src/
│   │       ├── start.ts              # Entry point
│   │       ├── index.ts              # Express + WS setup, health monitor
│   │       ├── session-manager.ts    # Session lifecycle (create/send/stop/resume)
│   │       ├── project-manager.ts    # Project CRUD + directory binding
│   │       ├── persistence.ts        # SQLite interface (better-sqlite3)
│   │       ├── rest-api.ts           # 40+ Express routes
│   │       ├── websocket-server.ts   # Real-time event broadcasting
│   │       ├── interpreter.ts        # Intent classification + safety gate
│   │       ├── context-engine.ts     # Builds [CONTEXT] blocks for Claude
│   │       ├── shell-safety.ts       # Command validation/blocklist
│   │       ├── session-queue.ts      # Concurrency control (max 8)
│   │       ├── session-metrics.ts    # Token/cost tracking
│   │       ├── providers/
│   │       │   ├── types.ts          # AgentProvider interface
│   │       │   ├── index.ts          # ProviderRegistry
│   │       │   ├── claude-provider.ts # Claude Code CLI spawner
│   │       │   └── codex-provider.ts  # Codex stub
│   │       └── db/
│   │           ├── schema.sql        # 5 tables: projects, sessions, messages, tasks, events
│   │           └── migrations/       # Schema evolution
│   │
│   ├── bot/          # Discord bot + intent routing + output formatting
│   │   └── src/
│   │       ├── bot.ts                # discord.js client setup
│   │       ├── commands.ts           # 18 slash command definitions
│   │       ├── command-handlers.ts   # Command execution logic
│   │       ├── intent-router.ts      # Smart message routing
│   │       ├── message-handler.ts    # Entry point for Discord messages
│   │       ├── output-handler.ts     # ProviderEvent → Discord embeds
│   │       ├── session-sync.ts       # Directory discovery → Discord categories
│   │       ├── session-channel-sync.ts # Channel ↔ session mapping
│   │       ├── dashboard.ts          # Auto-updating pinned embed
│   │       ├── personas.ts           # 6 agent personas
│   │       └── concierge.ts          # Answers system queries without LLM
│   │
│   └── web/          # Next.js 15 web UI
│       └── src/
│           ├── app/                  # 6 pages (dashboard, tasks, agents, analytics, system, settings)
│           ├── components/           # Layout, sessions, UI primitives
│           ├── stores/               # Zustand (session-store, system-store)
│           ├── hooks/                # useWebSocket (reconnect), useTheme
│           └── lib/                  # REST client
│
├── scripts/          # Testing and bridge scripts
├── deploy/           # Deployment configs (systemd)
└── docs/             # Documentation
```

## Data Flow

### User sends message via Discord

```
Discord message
    → bot/message-handler.ts (receive)
    → bot/intent-router.ts (classify: session/system/concierge/shell/meta)
    → server/interpreter.ts (classify: chat/shell/tool/meta + safety gate)
    → server/context-engine.ts (build [CONTEXT] block)
    → server/session-manager.ts (sendMessage)
    → server/providers/claude-provider.ts (spawn `claude --print --resume`)
    → Stream ProviderEvents back:
        → bot/output-handler.ts → Discord channel (embeds + text)
        → server/websocket-server.ts → Web UI (real-time)
        → server/persistence.ts → SQLite (messages + events)
```

### User sends message via Web UI

```
Browser
    → WebSocket: { type: "session.message", sessionId, content }
    → server/websocket-server.ts (command handler)
    → server/session-manager.ts (sendMessage)
    → server/providers/claude-provider.ts (spawn `claude --print --resume`)
    → Stream ProviderEvents back:
        → server/websocket-server.ts → Browser (session.output events)
        → server/persistence.ts → SQLite
        → If session has channelId: bot forwards to Discord
```

### Session Lifecycle

```
Created (session.create)
    → tmux session created (lazy, no Claude spawn)
    → Status: "active"
    ↓
First message (session.message)
    → Claude CLI spawned: `claude --print --output-format stream-json`
    → providerSessionId captured from result event
    → Status: "active" (processing)
    ↓
Turn complete (done event)
    → Status: "idle" (waiting for input)
    ↓
Next message
    → Claude CLI spawned with `--resume <providerSessionId>`
    → Multi-turn conversation continues
    ↓
Stop (session.stop)
    → SIGTERM to Claude process
    → Status: "stopped"
    → tmux session preserved for `tmux attach`
    ↓
Resume (session.resume)
    → Status: "active"
    → Next message uses `--resume` again
```

### Stale Resume Recovery

```
Message sent with --resume <id>
    → Claude responds with is_error: true + "No conversation found"
    → Provider detects stale resume
    → Retries WITHOUT --resume (fresh session)
    → New providerSessionId captured
    → Conversation continues from fresh context
```

## Key Design Decisions

### tmux as Session Substrate

Each Claude/Codex session runs in a named tmux session (`claudeforge-<name>-<id>`). This provides:
- **Persistence across server restarts** — tmux sessions survive
- **Terminal access** — `tmux attach -t <name>` for debugging
- **Process isolation** — each session in its own shell

### EventEmitter Architecture

All components communicate via events:
- `SessionManager` emits session/message events
- `WebSocketServer` listens and broadcasts to web clients
- `OutputHandler` (bot) listens and sends Discord embeds
- **Loose coupling** — adding a new consumer doesn't change the producer

### SQLite for Persistence

- **WAL mode** for concurrent reads + single writer
- **Foreign keys enabled** for referential integrity
- **Zero config** — single file at `~/.claudeforge/claudeforge.db`
- **Migration system** — versioned SQL in `db/migrations/`
- Tables: `projects`, `sessions`, `messages`, `tasks`, `events`

### Provider Abstraction

```typescript
interface AgentProvider {
  readonly name: string;
  startSession(options: StartSessionOptions): AsyncGenerator<ProviderEvent>;
  sendMessage(sessionId: string, message: string, dbRecord?: any, context?: string): AsyncGenerator<ProviderEvent>;
  stopSession(sessionId: string): Promise<void>;
  isSessionActive(sessionId: string): boolean;
}
```

Claude and Codex share a common interface. Adding a new provider means implementing this interface and registering it.

### Stream-JSON Output

Claude Code is invoked as:
```bash
claude --print --verbose --output-format stream-json --resume <id> --permission-mode bypassPermissions
```

This produces structured JSON events per line (text, tool_use, tool_result, thinking, done, error) instead of raw text, enabling precise UI rendering.

### Intent Classification (3 Layers)

```
Layer 1: Interpreter (what KIND of work)
    chat | shell | tool | meta | confirm

Layer 2: Intent Router (WHERE to route)
    session | system | concierge | shell | meta

Layer 3: Executor (WHO handles it)
    SessionManager | Concierge | ShellExec | MetaHandler
```

### Context Engine

Before sending a message to Claude, the context engine builds a `[CONTEXT]...[/CONTEXT]` block:
1. Reads project docs: `CLAUDE.md` → `AGENTS.md` → `.cursorrules` → `README.md` (priority order)
2. Extracts git branch, dirty files
3. Detects tech stack from `package.json`
4. Includes referenced file paths from the user's message
5. Truncates at ~2000 chars to avoid context bloat

### Safety Gate

Two levels of command safety:
- **Block** (never execute): `rm -rf /`, `mkfs`, `dd of=/dev/`, fork bombs, pipe-to-shell
- **Warn** (require confirmation): `sudo`, `rm -rf`, `git push --force`, `DROP TABLE`, `npm publish`

## Database Schema

```sql
projects (id, name, directory, category_id, log_channel_id, personality, config, is_archived, created_at, updated_at)
sessions (id, name, project_id, project_name, directory, channel_id, provider, provider_session_id, tmux_name, model, mode, agent_persona, status, verbose, created_at, last_activity, message_count, total_tokens, total_cost)
messages (id, session_id, role, content, tool_call, created_at)
tasks    (id, title, description, status, priority, agent, session_id, project_name, output, created_at, started_at, completed_at, updated_at)
events   (id, type, source, data, timestamp)
```

Indexes on: `sessions.project_id`, `sessions.channel_id`, `sessions.status`, `messages.session_id`, `messages.created_at`, `tasks.status`, `events.type`, `events.timestamp`.

## Component Communication

```
                    ┌─────────────────┐
                    │  SessionManager  │ ← Source of truth
                    │   (EventEmitter) │
                    └────┬────────┬───┘
                         │        │
            emit events  │        │  emit events
                         │        │
              ┌──────────▼─┐   ┌──▼──────────┐
              │ WebSocket   │   │ Bot Output  │
              │ Server      │   │ Handler     │
              └──────┬──────┘   └──────┬──────┘
                     │                  │
              ┌──────▼──────┐   ┌──────▼──────┐
              │  Web UI     │   │  Discord    │
              │  (Browser)  │   │  (Channels) │
              └─────────────┘   └─────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22 (native TypeScript via tsx) |
| Chat interface | discord.js v14 |
| HTTP API | Express 5 |
| Real-time | Raw WebSocket (no socket.io) |
| Database | SQLite 3 (better-sqlite3, WAL mode) |
| Session persistence | tmux |
| Web framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| State management | Zustand |
| Icons | Lucide React |
| Markdown | react-markdown + remark-gfm |
| Monorepo | Turborepo + npm workspaces |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server HTTP/WS port |
| `DISCORD_TOKEN` | — | Discord bot token (required) |
| `DISCORD_GUILD_ID` | — | Discord server ID (required) |
| `DEFAULT_DIRECTORY` | `~` | Default working directory |
| `CLAUDE_MODEL` | — | Default Claude model |
| `CLAUDE_MAX_TOKENS` | — | Max tokens per request |
| `CLAUDE_PERMISSION_MODE` | `bypassPermissions` | Claude permission mode |
| `CODEX_MODEL` | — | Default Codex model |
| `CODEX_APPROVAL_MODE` | — | Codex approval mode |
| `TEST_API_TOKEN` | `dev-test-token` | Bearer token for test endpoints |

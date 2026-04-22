# CLAUDE.md — ClaudeForge

## What Is This

> **Read STATUS.md first** — it tracks what is implemented, what is not, and known issues. Update it after every change session.

ClaudeForge is a Discord server + web app that turns a machine into a remote Claude Code IDE. Directories become Discord categories, sessions become channels, and a web UI mirrors everything.

## Architecture

Monorepo with 4 packages (~6000 lines, 32+ source files):

| Package | Role | Files |
|---------|------|-------|
| `packages/shared/` | Types, events, constants (used by all) | 4 files, ~220 lines |
| `packages/server/` | Express REST + WebSocket + SQLite + providers | 14 files, ~1650 lines |
| `packages/bot/` | Discord.js bot with routing + rendering | 13 files, ~3200 lines |
| `packages/web/` | Next.js 15 web UI with Zustand | 20+ files, ~1000 lines |

## Key Files

- `SPEC.md` — **THE** spec. Architecture, data model, commands, UI wireframes, implementation plan.
- `STATUS.md` — Current implementation status. Update after every change session.
- `CHANGELOG.md` — Version history organized by phase.
- `docs/api.md` — Complete REST API reference (40+ endpoints).
- `docs/websocket.md` — WebSocket protocol documentation.
- `docs/architecture.md` — System architecture and design decisions.
- `docs/contributing.md` — Development setup and how-to guides.
- `reference/` — Reference projects (agentcord, gluon-agent, teleforge, aemi, claude-obsidian-server).

## Quick Start

```bash
npm install
npx turbo run build
# Start everything: node --import tsx packages/server/src/start.ts
# Or: systemctl --user start claudeforge
```

## Build Commands

```bash
npm install          # Install all packages
npm run dev          # Start all in dev mode
npm run build        # Build all (turbo)
npm run dev:server   # Server only
npm run dev:bot      # Bot only
npm run dev:web      # Web UI only
```

## Tech Stack

- Node.js 22 (native TypeScript)
- discord.js v14
- Express 5 + raw WebSocket (no socket.io)
- SQLite (better-sqlite3) with migration system
- Next.js 15 (App Router)
- Tailwind CSS v4
- Zustand (state management)
- tmux (session persistence)
- Turborepo (monorepo)

## REST API Endpoints (Summary)

Full documentation: `docs/api.md`

| Category | Endpoints |
|----------|-----------|
| Projects | `GET /api/projects`, `POST /api/projects/open`, `POST /api/projects/:id/close`, `GET /api/projects/:id/metadata`, `GET /api/projects/:id/stats` |
| Sessions | `GET /api/sessions`, `GET /api/sessions/active`, `GET/POST /api/sessions/:id`, `POST /:id/message`, `POST /:id/stop`, `POST /:id/resume`, `POST /:id/abort`, `POST /:id/shell`, `PATCH /:id/config`, `GET /:id/messages`, `GET /:id/files`, `GET /:id/file`, `GET /:id/metrics`, `GET /:id/export` |
| Tasks | `GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id`, `POST /api/tasks/:id/assign` |
| Templates | `GET/POST /api/templates`, `GET/PUT/DELETE /api/templates/:id` |
| Analytics | `GET /api/analytics/sessions`, `GET /api/analytics/costs` |
| System | `GET /health`, `GET /api/system/health`, `GET /api/system/status`, `GET /api/ws/clients`, `GET /api/queue/status` |
| Events | `GET /api/events`, `GET /api/events/stream` (SSE) |
| Admin | `POST /api/admin/vacuum`, `POST /api/admin/cleanup`, `GET /api/admin/audit` |
| Test | `POST /api/test/session`, `POST /api/test/send`, `GET /api/test/session/:id/messages`, `DELETE /api/test/session/:id` |
| Providers | `GET /api/providers` |

## Slash Commands (18)

| Command | Description |
|---------|-------------|
| `/open <path>` | Register directory as project, create Discord category |
| `/close` | Archive current location's category |
| `/locations` | List all open projects |
| `/navigate <path>` | Jump to directory (auto-open if needed) |
| `/session new/list/end/resume/info/attach` | Session lifecycle management |
| `/stop` | Abort current generation |
| `/continue` | Resume generation |
| `/model <id>` | Change model for session |
| `/mode <auto\|plan\|normal>` | Set permission level |
| `/shell <command>` | Run command in session directory |
| `/task new/list` | Task management |
| `/persona use/list/clear` | Switch agent personas (6 available) |
| `/config personality/info` | Project configuration |
| `/status` | System overview |
| `/run <dir> <prompt>` | One-shot Claude with streaming |
| `/commit` | Generate conventional commit |
| `/pr-review` | Review PR changes |
| `/code-review` | Review file or diff |

## Key Patterns

### Claude Provider
- Uses `claude --print --verbose --output-format stream-json --resume <id>`
- Sessions are lazy: tmux created on start, Claude spawned on first message
- 5-minute hard timeout on spawned processes
- Stale `--resume` detection: `is_error: true` + "No conversation found" triggers fresh retry
- Lazy-reconstruct sessions from DB after server restart

### Session Routing
```
Discord message → IntentRouter → Interpreter → ContextEngine → SessionManager → ClaudeProvider → tmux
Output streams back → Discord (embeds) + WebSocket (events) + SQLite (persistence)
```

### Context Engine
- Reads: CLAUDE.md → AGENTS.md → .cursorrules → README.md (priority order)
- Extracts: git branch, dirty files, referenced file paths, tech stack
- Builds `[CONTEXT]...[/CONTEXT]` blocks, truncates at ~2000 chars
- Built-in commands: `/help`, `/files`, `/git`, `/cost`, `/context` (no AI round-trip)

### Intent Classification (3 layers)
1. **Interpreter**: what KIND (chat/shell/tool/meta/confirm)
2. **Intent Router**: WHERE to route (session/system/concierge/shell/meta)
3. **Executor**: WHO handles it (SessionManager/Concierge/ShellExec)

### Security
- Shell command sanitization blocks destructive patterns (`rm -rf /`, `mkfs`, fork bombs, etc.)
- Warning for dangerous-but-not-blocked commands (`sudo`, `git push --force`, `DROP TABLE`)
- Rate limiting on REST API (60 req/min)
- Input validation on message sending
- File path traversal prevention
- Bearer token auth on test endpoints

### Database
- SQLite with WAL mode, foreign keys enabled
- 5 tables: projects, sessions, messages, tasks, events
- Migration system in `packages/server/db/migrations/`
- Performance indexes on all key columns

### WebSocket Protocol
Full documentation: `docs/websocket.md`
- Connection: `ws://localhost:3001/ws`
- Client commands: subscribe, unsubscribe, session.message, session.create, session.stop, session.resume, shell.run, task.create, task.update
- Server events: session.output, session.status, session.created/updated/closed, message.created, project.created/updated, task.created/updated, system.health (15s), system.status (60s), system.error
- Subscription filtering by session ID

## Design System

**Obsidian x Discord Dark** theme:
- Background: `#0F0F14` (Void — warm, not pure black)
- Surface: `#1A1A2E` (cards, panels)
- Primary: `#7B61FF` (Iris Purple)
- Text: `#E8E8F0` (Frost — never `#FFFFFF`)
- Font: Inter (variable) + JetBrains Mono (code/data)
- Icons: Lucide React ONLY — `strokeWidth={1.5}`, sizes 16/20/24/32px
- Status: Green `#4ADE80` / Amber `#FCD34D` / Rose `#FB7185` / Blue `#38BDF8`

### Icon Rules
```tsx
import { Terminal, FileCode, Pencil, Search, CheckCircle, XCircle } from 'lucide-react';
// Always use Lucide. Never emoji in UI chrome. Never FontAwesome/Heroicons.
// strokeWidth={1.5} default. Color inherits from text.
```

### Component Rules
- Cards: `bg-[#1A1A2E] border border-[#2E2E4A] rounded-lg`
- Hover: `hover:border-[#7B61FF40]` (subtle purple glow)
- Tool call cards: colored left border (blue=read, amber=edit, green=bash, rose=error)
- Status dots: `w-2 h-2 rounded-full` + `animate-pulse` when active
- Animations: 150ms hover, 250ms panels. No bounce. No spring physics.

## Known Issues

1. Web UI shows "Disconnected" when accessed from VM (localhost:3001 unreachable from 192.168.122.10)
2. Port 3000 occupied by Wilson Premier site on host — web uses 3002
3. Codex provider stub exists but is not functional
4. Session idle timeout defined (30min) but not enforced
5. Cost tracking fields exist but not reliably populated from Claude events
6. Button interaction handler for Continue/Stop/Copy may not be fully wired
7. No authentication for web UI or main API (only test endpoints require Bearer token)

## Adapting Reference Code

When adapting from reference projects:
1. Read the source file in `reference/`
2. Understand the pattern, don't copy blindly
3. Adapt to our type system (`packages/shared/`)
4. Add WebSocket emission alongside Discord output
5. Use SQLite instead of JSON file persistence

## Don't

- Don't use socket.io (raw WebSocket is fine)
- Don't add Docker (runs directly on host)
- Don't over-abstract (this is v1 — ship working code)
- Don't skip tmux integration (it's how terminal access works)
- Don't forget WebSocket emission when writing Discord output (web UI needs it too)
- Don't use emoji in UI chrome — Lucide icons only (emoji OK in chat content/agent names)
- Don't use pure white (`#FFFFFF`) or pure black (`#000000`) — always warm-tinted
- Don't add animations that don't communicate state changes
- Don't use bold (700 weight) for body text — only KPI hero numbers
- Don't use ALL CAPS except for 11px tracked-out labels

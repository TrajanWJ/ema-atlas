# ClaudeForge — Implementation Status

> Last updated: 2026-03-20 (comprehensive documentation + CLAUDE.md update)
> **UPDATE THIS FILE AFTER EVERY CHANGE SESSION.**

## Build & Runtime

- **Build:** `npx turbo run build --force` — 4/4 packages pass
- **Service:** `systemctl --user restart claudeforge` (host)
- **Web dev:** `tmux new-session -d -s cfweb 'cd packages/web && npx next dev --port 3002'`
- **DB:** `~/.claudeforge/claudeforge.db` (SQLite, rm to reset)
- **Port 3000:** OCCUPIED by Wilson Premier site — web uses 3002
- **Git:** 14 commits across 7 phases

## Package Stats

| Package | Lines | Source Files |
|---------|-------|-------------|
| shared  | ~220  | 4 (constants, events, types, index) |
| server  | ~1650 | 14 (session-mgr, project-mgr, persistence, claude-provider, codex-provider, rest-api, ws-server, interpreter, context-engine, shell-safety, session-queue, session-metrics, start, index) |
| bot     | ~3200 | 13 (bot, commands, command-handlers, message-handler, output-handler, personas, session-sync, session-channel-sync, session-warmup, dashboard, notifications, intent-router, concierge) |
| web     | ~1000 | 20+ (hooks, lib, stores, 6 pages, 15+ components) |
| **Total** | **~6070** | **51+ files** |

## Documentation

| Document | Path | Description |
|----------|------|-------------|
| SPEC.md | `/SPEC.md` | Full architecture spec, data model, implementation plan |
| STATUS.md | `/STATUS.md` | This file — implementation status |
| CLAUDE.md | `/CLAUDE.md` | Project instructions for AI agents |
| CHANGELOG.md | `/CHANGELOG.md` | Version history by phase |
| API Reference | `/docs/api.md` | 40+ REST endpoints documented |
| WebSocket Protocol | `/docs/websocket.md` | Full WS message types + examples |
| Architecture | `/docs/architecture.md` | System design + data flow |
| Contributing | `/docs/contributing.md` | Dev setup + how-to guides |

## Implemented Features

### Server (14 source files)
- Session manager: create/resume/stop/abort, DB persistence
- Project manager: open/close/bind locations
- Claude provider: `claude --print --output-format stream-json` in tmux
- Claude provider: thinking block + tool_result event mapping
- Provider session resilience: lazy-reconstruct from DB after restart
- Stale `--resume` detection: `is_error: true` + "No conversation found" -> retry fresh
- Multi-turn via `--resume <UUID>` (providerSessionId captured from result event)
- REST API: 40+ endpoints — projects, sessions, messages, tasks, templates, analytics, admin, test, system
- REST API: `/api/sessions/:id/shell` endpoint for web UI shell access
- REST API: enhanced `/api/system/health` with disk usage, node version, session counts
- REST API: input validation on message sending
- REST API: rate limiting (60 req/min per IP)
- WebSocket server: broadcasts session/message/task/health events
- WebSocket: `session.create` properly creates project + session + broadcasts
- WebSocket: `shell.run` executes commands in session directory
- WebSocket: `task.create` and `task.update` with DB persistence + broadcast
- Interpreter: classify (chat/shell/tool/meta), safety gate, context builder, prompt enhancement
- Interpreter: /help, /files, /git, /cost, /context built-in commands (no AI round-trip)
- Context engine: reads CLAUDE.md, AGENTS.md, .cursorrules, README.md (priority order, truncation)
- Context engine: extracts referenced file paths from messages, includes file contents
- Context engine: git dirty files list, system prompt injection, user preferences
- Multi-model: per-session model override via PATCH /api/sessions/:id/config
- Multi-model: env var defaults (CLAUDE_MODEL, CLAUDE_MAX_TOKENS, CODEX_MODEL, CODEX_APPROVAL_MODE)
- Session templates: CRUD via /api/templates (name, provider, model, systemPrompt, contextFiles)
- System prompts: per-session customizable, stored in DB, injected into context
- Session queue: concurrency control (max 8 concurrent)
- Session metrics: token/cost tracking
- Analytics: session overview + cost breakdown endpoints
- Admin: vacuum, cleanup, audit log
- Shell safety: blocks destructive patterns, warns on dangerous commands
- Task CRUD: create/list/update/delete/assign
- Codex provider stub (interface only)

### Bot (18 slash commands, 13 source files)
- /open, /close, /locations, /navigate (location management)
- /session new/list/end/resume/info/attach (session management)
- /stop, /continue, /model, /mode (agent interaction)
- /shell (shell access in session directory)
- /task new/list (task management — cancel removed)
- /persona use/list/clear (6 personas: architect, reviewer, debugger, security, performance, devops)
- /config personality/info (project configuration)
- /status (system overview)
- /run (one-shot Claude with streaming + thread-per-task)
- /commit, /pr-review, /code-review (git integration)

### Bot Intelligence
- Intent Router: smart routing layer (session/system/concierge/shell/meta)
- Concierge: system queries answered from state (no LLM needed)
- Fuzzy session matching: bigram Dice coefficient with substring/prefix bonuses
- Path detection: suggest /open when directory paths mentioned
- Auto-create: sessions created automatically in project channels
- Auto-bootstrap: categories with path-like names auto-register as projects in DB on startup + on first message
- End-to-end message routing: type in a project channel -> project bootstrapped -> session created -> message routed -> response streamed

### Bot Output
- Thinking indicator (ephemeral, deleted when text flows)
- Tool call collapsing (3+ consecutive -> summary line)
- Diff previews for edit/write results
- Interactive buttons on turn-complete (Continue/Stop/Copy)
- Edit-in-place for streaming text
- Tool call embeds with colored styling

### Bot Infrastructure
- Session sync: discovers ~/.claude/projects/ -> Discord categories + registers projects in DB
- Category bootstrap on startup: scans all existing Discord categories, registers path-like ones as projects
- ~ expansion: `~/foo` -> `/home/trajan/foo`, relative paths try DEFAULT_DIRECTORY then HOME
- Dashboard: auto-updating pinned embed (30s refresh)
- Message handler: classify -> safety gate -> route -> execute (with fallback project bootstrap)
- Comprehensive [message]/[router] logging

### Web UI (6 pages, 20+ components)
- Obsidian x Discord dark theme (Iris Purple #7B61FF, void #0F0F14)
- Inter + JetBrains Mono fonts
- Sidebar with location/session tree
- Top nav: Sessions, Tasks, Agents, Analytics, System, Settings pages
- Chat view with markdown rendering (react-markdown + remark-gfm)
- Animated streaming indicator (three-dot bounce)
- Collapsible tool call output (>15 lines)
- Open Location dialog with provider selector
- WebSocket with exponential backoff + jitter reconnection
- Optimistic message sending
- Zustand state management wired to WS events
- System store: removeTask, events list, full task/error/health state
- Toast notifications, skeleton loading, error boundary
- Tool call cards with colored left borders
- Session header, session metrics, file tree, terminal components
- Input bar, message search, multi-session view

## Not Yet Implemented

### Server
- Codex provider (stub exists, not functional)
- MCP server registration per project
- Session idle timeout (30min defined, not enforced)
- Cost tracking from Claude result events (field exists, not populated reliably)

### Bot
- Button interaction handler for Continue/Stop/Copy (buttons rendered but handler may not be wired)
- Dashboard channel auto-detection (needs a #dashboard channel convention)
- Message content intent enabled in Discord developer portal
- Per-project personality injection into sessions

### Web UI
- Chat input bar fully connected to REST API
- Task Kanban board with drag-and-drop
- Agent gallery page content
- System health page with real-time charts (REST endpoint ready, UI needs charts)
- File tree sidebar in session view (component exists, not wired)
- Terminal embed (xterm.js or similar) — shell REST endpoint ready
- Mobile responsive layout

### Infrastructure
- GitHub repo (currently local only)
- CI/CD pipeline
- Environment variable documentation
- Discord bot invite link / setup guide
- Authentication for web UI
- Automated testing

## Key Technical Decisions

1. `claude --print --resume` for multi-turn (not SDK, not tmux send-keys)
2. stream-json output for structured event parsing
3. Lazy session reconstruction from DB after restart (provider in-memory map rebuilt on demand)
4. Stale resume retry via is_error detection in result event (exit code 0 but is_error:true)
5. IntentRouter classifies before routing (channel != intent)
6. Concierge answers system queries from state (no LLM round-trip)
7. Port 3002 for web dev (3000 occupied)
8. tmux for session persistence and terminal access
9. No socket.io — raw WebSocket
10. Context engine priority: CLAUDE.md > AGENTS.md > .cursorrules > README.md
11. Safety gate: block (never run) vs warn (confirm first) vs safe (run immediately)

## Known Issues

1. Web UI shows "Disconnected" when accessed from VM (localhost:3001 unreachable from 192.168.122.10)
2. Port 3000 occupied by Wilson Premier site on host
3. Codex provider stub not functional
4. Session idle timeout not enforced
5. Cost tracking not reliably populated
6. Button handlers may not be fully wired
7. No auth for web UI / main API

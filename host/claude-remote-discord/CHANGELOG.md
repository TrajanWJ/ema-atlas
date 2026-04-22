# Changelog

All notable changes to ClaudeForge are documented in this file.

## [Unreleased]

### Phase 7 — Context Engine + Multi-Model + Interpreter Commands
- Context engine: reads CLAUDE.md, AGENTS.md, .cursorrules, README.md (priority order with truncation)
- Context engine: extracts referenced file paths from messages, includes file contents
- Context engine: git dirty files list, system prompt injection, user preferences
- Context engine: `/context` command shows what context gets sent
- Multi-model: per-session model override via `PATCH /api/sessions/:id/config`
- Multi-model: env var defaults (`CLAUDE_MODEL`, `CLAUDE_MAX_TOKENS`, `CODEX_MODEL`, `CODEX_APPROVAL_MODE`)
- Session templates: CRUD via `/api/templates` (name, provider, model, systemPrompt, contextFiles)
- System prompts: per-session customizable, stored in DB, injected into context
- Interpreter: `/help`, `/files`, `/git`, `/cost`, `/context` built-in commands (no AI round-trip)

### Phase 6 — Performance + Monitoring + Analytics
- Session queue with concurrency control (max 8 concurrent sessions)
- Session metrics tracking (tokens, cost per session)
- Analytics endpoints: `/api/analytics/sessions`, `/api/analytics/costs`
- Admin endpoints: `/api/admin/vacuum`, `/api/admin/cleanup`, `/api/admin/audit`
- Enhanced system health with disk usage, node version, session counts
- Request logging for slow requests (>1s) and errors (status >= 400)

### OpenClaw Testing Bridge
- Test endpoints: create session, send+wait, get messages, delete session
- Bearer token authentication for test API
- Session channel mirroring between Discord and server

### Phase 5b — Discord Bot Enhancement
- `/commit`, `/pr-review`, `/code-review` git integration commands
- `/run` one-shot Claude with streaming + thread-per-task
- Persona system: 6 personas (architect, reviewer, debugger, security, performance, devops)
- `/config personality/info` project configuration
- Dashboard auto-updating pinned embed (30s refresh)

### Phase 5a — Web UI Integration Fixes
- Fixed WebSocket `session.create` to properly create project + session + broadcast
- Fixed `shell.run` to execute commands in session directory
- Added `task.create` and `task.update` with DB persistence + broadcast
- System store: `removeTask`, events list, full task/error/health state

### Phase 4 — Advanced UI + Codex Provider + Analytics
- Codex provider stub (interface implemented, not functional)
- Analytics page in web UI
- System page with logs and performance
- Settings page for project configuration
- Session metrics component
- File tree sidebar component
- Terminal component (shell access)
- Multi-session view
- Message search

### Phase 3 — Web UI Polish + Server Hardening
- Toast notifications system
- Skeleton loading states
- Error boundary component
- Breadcrumb navigation
- Input bar for chat messages
- Tool call card component with colored borders
- Session header with controls
- Open location dialog with provider selector

### Phase 2 — Web UI Functional + Server Features
- Obsidian x Discord dark theme implementation
- Inter + JetBrains Mono font stack
- Sidebar with location/session tree
- Top nav: Sessions, Tasks, Agents, System pages
- Chat view with markdown rendering (react-markdown + remark-gfm)
- Animated streaming indicator (three-dot bounce)
- Collapsible tool call output (>15 lines)
- WebSocket with exponential backoff + jitter reconnection
- Optimistic message sending
- Zustand state management wired to WS events

### Phase 1 — Server + Bot Reliability
- Fixed token extraction from stream events
- Provider session resilience: lazy-reconstruct from DB after restart
- Stale `--resume` detection: `is_error: true` + "No conversation found" → retry fresh
- Multi-turn via `--resume <UUID>` (providerSessionId captured from result event)
- Graceful shutdown with tmux cleanup
- Input validation on message sending
- Rate limiting on REST API (60 req/min)

### Context Engine + Smart Session Layer
- Interpreter: classify (chat/shell/tool/meta), safety gate, context builder, prompt enhancement
- Shell safety: blocks destructive patterns (rm -rf /, mkfs, fork bombs)
- Context building: git branch, recent files, tech stack detection

### Intent Router + Concierge
- Intent Router: smart routing layer (session/system/concierge/shell/meta)
- Concierge: system queries answered from state (no LLM needed)
- Fuzzy session matching: bigram Dice coefficient with substring/prefix bonuses
- Path detection: suggest `/open` when directory paths mentioned
- Auto-create: sessions created automatically in project channels
- Auto-bootstrap: categories with path-like names auto-register as projects

### v0.2 — Full Discord Bot + Web UI
- 18 slash commands across 7 categories
- Session manager: create/resume/stop/abort, DB persistence
- Project manager: open/close/bind locations
- Claude provider: `claude --print --output-format stream-json` in tmux
- REST API: projects, sessions, messages, tasks CRUD, system health
- WebSocket server: broadcasts session/message/task/health events
- Discord bot with message routing and output rendering
- Next.js web UI with Zustand state management
- SQLite persistence with migration system

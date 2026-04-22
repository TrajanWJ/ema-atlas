# ClaudeForge

Remote Claude Code IDE — Discord + Web UI. Directories become categories, sessions become channels, everything syncs 1:1.

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Discord Bot │◄──►│   Server     │◄──►│  Web UI     │
│  (bot)       │    │  REST + WS   │    │  (Next.js)  │
└──────┬───────┘    └──────┬───────┘    └─────────────┘
       │                   │
       │            ┌──────┴───────┐
       │            │  Providers   │
       │            │ Claude Codex │
       │            └──────┬───────┘
       │                   │
       ▼                   ▼
   Discord API        tmux sessions
```

**Monorepo packages:**

| Package | Description |
|---------|-------------|
| `packages/shared/` | Types, events, constants (used by all packages) |
| `packages/server/` | Express 5 REST API + WebSocket + SQLite + Claude provider |
| `packages/bot/` | Discord.js bot with intent routing + output rendering |
| `packages/web/` | Next.js 15 web UI with Zustand state management |

## Features

- **18 Discord slash commands** — session management, shell access, task tracking, personas, git integration
- **Web UI** — real-time dashboard with WebSocket updates, chat view, task management
- **Session management** — create, resume, stop sessions backed by tmux + SQLite
- **Multi-turn chat** — Claude CLI with `--resume` for conversation continuity
- **Intent router** — smart routing (session/system/concierge/shell/meta) with fuzzy matching
- **Context engine** — builds context blocks from project docs, git history, session history
- **Multi-model support** — per-session model override, env var defaults
- **Session templates** — reusable provider/model/system prompt configurations
- **Task queue** — CRUD task management with assignment to sessions
- **Shell access** — execute commands in session directories with safety checks
- **Health monitoring** — CPU, memory, disk usage broadcast via WebSocket

## Prerequisites

- Node.js 22+
- npm 10+
- tmux
- Claude CLI installed and authenticated (`claude` available in PATH)
- Discord bot token with Message Content Intent enabled

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp deploy/.env.example .env
# Edit .env with your Discord token, guild ID, etc.

# Build all packages
npm run build

# Start everything (dev mode)
npm run dev
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DISCORD_TOKEN` | Yes | — | Discord bot token |
| `DISCORD_CLIENT_ID` | Yes | — | Discord application client ID |
| `DISCORD_GUILD_ID` | Yes | — | Discord server (guild) ID |
| `ALLOWED_USERS` | Yes | — | Comma-separated Discord user IDs |
| `PORT` / `SERVER_PORT` | No | `3001` | REST API + WebSocket port |
| `DATA_DIR` | No | `~/.claudeforge` | Database and data directory |
| `DB_PATH` | No | `./data/claudeforge.db` | SQLite database path |
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:3001` | Web UI API endpoint |
| `NEXT_PUBLIC_WS_URL` | No | `ws://localhost:3001/ws` | Web UI WebSocket endpoint |
| `ALLOWED_PATHS` | No | (all) | Comma-separated allowed base paths |
| `DEFAULT_DIRECTORY` | No | `$HOME` | Default project directory |
| `CLAUDE_MODEL` | No | — | Default Claude model |
| `CLAUDE_MAX_TOKENS` | No | `8192` | Max tokens per response |
| `CLAUDE_PERMISSION_MODE` | No | — | Claude CLI permission mode |
| `MAX_CONCURRENT_SESSIONS` | No | `5` | Concurrent session limit |

## Development

```bash
npm run dev          # Start all in dev mode (turbo)
npm run dev:server   # API + WebSocket on :3001
npm run dev:bot      # Discord bot
npm run dev:web      # Next.js UI on :3002
npm run build        # Build all packages
npm run lint         # Lint all packages
```

## Deployment

### Systemd (recommended)

```bash
# Create env file
sudo mkdir -p /home/trajan/.config/claudeforge
cp deploy/.env.example /home/trajan/.config/claudeforge/.env
# Edit .env with production values

# Deploy (builds + installs services + starts + health checks)
npm run deploy

# Or manually:
bash deploy/deploy.sh
```

Individual service management:

```bash
systemctl --user start claudeforge-server
systemctl --user start claudeforge-bot
systemctl --user start claudeforge-web

# Logs
journalctl --user -u claudeforge-server -f
journalctl --user -u claudeforge-bot -f
journalctl --user -u claudeforge-web -f
```

### Nginx (optional reverse proxy)

```bash
sudo cp deploy/claudeforge.nginx.conf /etc/nginx/sites-available/claudeforge
sudo ln -s /etc/nginx/sites-available/claudeforge /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
# Accessible at http://localhost:8080
```

### Docker

```bash
cp deploy/.env.example .env
# Edit .env

docker compose up -d        # Start all services
docker compose logs -f       # View logs
docker compose down          # Stop
```

## Discord Commands

| Command | Description |
|---------|-------------|
| `/open <path>` | Open a directory — creates category + session |
| `/close` | Close current location |
| `/locations` | List open locations |
| `/navigate` | Switch between locations |
| `/session new\|list\|end\|resume\|info\|attach` | Session management |
| `/stop` | Abort current generation |
| `/continue` | Resume generation |
| `/model <name>` | Switch Claude model |
| `/mode <mode>` | Switch agent mode |
| `/shell <cmd>` | Run shell command in session directory |
| `/task new\|list\|cancel` | Task management |
| `/persona use\|list\|clear` | Switch agent personas |
| `/config personality\|info` | Project configuration |
| `/status` | System overview |
| `/run <prompt>` | One-shot Claude with streaming |
| `/commit` | Git commit helper |
| `/pr-review` | PR review |
| `/code-review` | Code review |

## API Endpoints

### Projects
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects/open` | Open a directory as project |
| POST | `/api/projects/:id/close` | Close a project |
| GET | `/api/projects/:id/metadata` | Project metadata |
| GET | `/api/projects/:id/stats` | Project statistics |

### Sessions
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/sessions` | List sessions (filter by projectId) |
| GET | `/api/sessions/active` | List active sessions |
| GET | `/api/sessions/:id` | Get session details |
| POST | `/api/sessions` | Create new session |
| POST | `/api/sessions/:id/message` | Send message to session |
| POST | `/api/sessions/:id/stop` | Stop session |
| POST | `/api/sessions/:id/resume` | Resume session |
| POST | `/api/sessions/:id/abort` | Abort session |
| POST | `/api/sessions/:id/shell` | Execute shell command |
| PATCH | `/api/sessions/:id/config` | Update session config (model, etc.) |
| GET | `/api/sessions/:id/messages` | Get session messages |
| GET | `/api/sessions/:id/files` | List files in session directory |
| GET | `/api/sessions/:id/file` | Read file content |
| GET | `/api/sessions/:id/export` | Export session data |
| GET | `/api/sessions/:id/metrics` | Session performance metrics |

### Templates
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/templates` | List templates |
| GET | `/api/templates/:id` | Get template |
| POST | `/api/templates` | Create template |
| PUT | `/api/templates/:id` | Update template |
| DELETE | `/api/templates/:id` | Delete template |

### Tasks
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tasks` | List tasks (filter by sessionId) |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:id/assign` | Assign task to session |

### System
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/system/health` | Detailed health (CPU, memory, disk) |
| GET | `/api/system/status` | System status overview |
| GET | `/api/providers` | List available providers |
| GET | `/api/events` | Recent events |
| GET | `/api/events/stream` | SSE event stream |
| GET | `/api/ws/clients` | WebSocket client count |
| GET | `/api/queue/status` | Session queue status |

### Analytics
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/analytics/sessions` | Session analytics |
| GET | `/api/analytics/costs` | Cost analytics |

### Admin
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/vacuum` | Vacuum database |
| POST | `/api/admin/cleanup` | Cleanup stale sessions |
| GET | `/api/admin/audit` | Audit log |

### WebSocket

Connect to `ws://localhost:3001/ws` for real-time events:

- `session.created`, `session.updated`, `session.stopped`
- `message.created`, `message.chunk` (streaming)
- `task.created`, `task.updated`
- `health.status` (every 15s)
- `shell.run` (execute commands)

## Tech Stack

Node.js 22 · TypeScript · Express 5 · discord.js v14 · Next.js 15 · Tailwind CSS v4 · SQLite · WebSocket · Zustand · tmux · Turborepo

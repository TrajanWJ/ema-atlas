# ClaudeForge

Remote Claude Code IDE — Discord + Web UI. Directories become categories, sessions become channels, everything syncs 1:1.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and configure
cp .env.example .env
# Edit .env with your Discord bot token, client ID, and guild ID

# 3. Start everything (server + bot + web)
npm run dev

# Or start individually:
npm run dev:server   # API + WebSocket on :3001
npm run dev:bot      # Discord bot
npm run dev:web      # Next.js UI on :3000
```

## Architecture

```
packages/
├── shared/    ← Types, events, constants (used by all packages)
├── server/    ← Core daemon: sessions, projects, tasks, REST API, WebSocket
├── bot/       ← Discord bot: slash commands, message routing, output rendering
└── web/       ← Next.js 15: sessions chat, tasks kanban, agents, system health
```

## Discord Commands

| Command | Description |
|---------|-------------|
| `/open <path>` | Open a directory — creates category + session |
| `/close` | Close current location |
| `/locations` | List open locations |
| `/session new <name>` | New session in current location |
| `/session info` | Session details |
| `/session end` | End session |
| `/session attach` | Get tmux attach command |
| `/stop` | Abort generation |
| `/shell <cmd>` | Run shell command |
| `/status` | System status |

## Tech Stack

Node.js 22 · TypeScript · discord.js v14 · Next.js 15 · Tailwind CSS v4 · SQLite · WebSocket · tmux

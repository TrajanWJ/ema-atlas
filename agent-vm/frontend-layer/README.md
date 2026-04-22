# OpenClaw Observer

A read-only system observer for the OpenClaw agent platform. Dark, cinematic UI that shows live agent conversations, activity, and vault contents.

## Quick Start

```bash
cd /home/trajan/projects/frontend-layer
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

### 💬 Conversations Tab
Live message feed from the OpenClaw gateway WebSocket (`ws://localhost:18789`). Messages are styled with each agent's accent color as a left border, rendered as markdown, and auto-scroll to the latest.

### 🔄 Agent Activity Tab
Real-time feed of agent spawns, completions, and errors. Shows active agents with pulsing indicators, event cards with duration and status badges.

### 📚 Vault Browser Tab
Browse the Obsidian vault at `/home/trajan/vault/`. File tree on the left, markdown preview on the right. Full-text search via grep.

### Pulse Bar
Top bar showing: connection status (green/yellow/red), active agent count, gateway version, uptime, and branding.

### Sidebar
Collapsible right panel showing: agent roster with activity indicators, recent message digest, and session stats.

## API Routes

| Route | Description |
|---|---|
| `GET /api/vault/tree` | Vault directory tree as JSON |
| `GET /api/vault/file?path=...` | File content with metadata |
| `GET /api/vault/search?q=...` | Full-text search across vault |
| `GET /api/system/status` | Gateway status (parsed `openclaw status`) |
| `GET /api/system/agents` | Active agent/session list |

## Design

- **Background:** #0A0A0A (near-black)
- **Accent:** #E8A838 (warm gold)
- **Agent colors:** Researcher teal, Coder green, Ops slate, Security red, Vault Keeper purple, Scout orange
- **Effects:** Frosted glass panels, fade-in animations, pulsing active indicators

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- pnpm

# CLAUDE.md — ClaudeForge

## What Is This

ClaudeForge is a Discord server + web app that turns a machine into a remote Claude Code IDE. Directories become Discord categories, sessions become channels, and a web UI mirrors everything.

## Key Files

- `SPEC.md` — **THE** spec. Read it before doing anything. It has architecture, data model, commands, UI wireframes, and implementation plan.
- `reference/agentcord/` — Primary reference project. Session manager, provider system, Discord bot. 6354 lines of TypeScript.
- `reference/gluon-agent/` — Web UI reference. Kanban board, task queue, WebSocket API.
- `reference/teleforge/` — MCP bridge pattern reference.
- `reference/aemi/` — Multi-agent routing reference.
- `reference/claude-obsidian-server/` — Thread-based session reference.

## Architecture

Turborepo monorepo with three packages:
- `packages/server/` — Core daemon. Session management, task queue, WebSocket, REST API, providers.
- `packages/bot/` — Discord bot. discord.js v14. Slash commands. Message routing.
- `packages/web/` — Next.js 15 web UI. Discord-inspired dark theme.

Shared types in `packages/shared/`.

## Tech Stack

- Node.js 22 (native TypeScript)
- discord.js v14
- @anthropic-ai/claude-agent-sdk
- @openai/codex-sdk
- SQLite (better-sqlite3)
- Next.js 15 (App Router)
- Tailwind CSS v4
- Zustand (state management)
- tmux (session persistence)
- Turborepo (monorepo)

## Build Commands

```bash
npm install          # Install all packages
npm run dev          # Start all in dev mode
npm run build        # Build all
npm run dev:server   # Server only
npm run dev:bot      # Bot only
npm run dev:web      # Web UI only
```

## Implementation Priority

Follow SPEC.md Phase 1 → 2 → 3 → 4 → 5. Don't skip phases.

## Adapting Reference Code

When adapting from reference projects:
1. Read the source file in `reference/`
2. Understand the pattern, don't copy blindly
3. Adapt to our type system (`packages/shared/`)
4. Add WebSocket emission alongside Discord output
5. Use SQLite instead of JSON file persistence

## Key Patterns

### Session Routing
```
Discord message → channelToSession map → Claude Code SDK → stream response → Discord + WebSocket
```

### Path → Category
```
/open ~/Desktop/Coding/myapp
  → Create Discord category "~/Desktop/Coding/myapp"
  → Create #main channel in it
  → Start Claude Code session with cwd=~/Desktop/Coding/myapp
  → Register in SQLite
```

### Provider Interface
All agents implement `AgentProvider` (see SPEC.md). Claude and Codex are built-in. Others can be added.

## Design System

See SPEC.md § Design System. **Obsidian × Discord Dark** theme — Codex approach from vault (structured, navigable, info-dense, beautiful):

- **Background:** `#0F0F14` (Void — warm, not pure black)
- **Surface:** `#1A1A2E` (cards, panels)
- **Primary:** `#7B61FF` (Iris Purple — Obsidian-inspired accent)
- **Text:** `#E8E8F0` (Frost — warm white, never `#FFFFFF`)
- **Font:** Inter (variable) + JetBrains Mono (code/data)
- **Icons:** Lucide React ONLY — `strokeWidth={1.5}`, sizes 16/20/24/32px
- **Status:** Green `#4ADE80` / Amber `#FCD34D` / Rose `#FB7185` / Blue `#38BDF8`

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

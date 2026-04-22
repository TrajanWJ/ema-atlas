---
title: "ClaudeForge"
type: reference
created: 2026-03-19
updated: 2026-04-06
tags: [project, discord-bot, web-ui, claude-code, remote-dev, typescript]
summary: "Remote Claude Code IDE via Discord + Web UI — channels as sessions"
---

# ClaudeForge

Remote Claude Code IDE via Discord + Web UI.

## Location
- **Host:** `~/Desktop/Coding/Projects/claude-remote-discord`
- **State file:** `STATUS.md` (read this first — tracks what's done/not done)
- **Spec:** `SPEC.md`
- **Agent instructions:** `CLAUDE.md`

## Architecture
Turborepo monorepo, 4 packages (~6000 lines TypeScript):
- `packages/shared` — types, constants, design tokens
- `packages/server` — daemon (port 3001), sessions, REST API, WebSocket, SQLite
- `packages/bot` — Discord bot (18 slash commands), intent router, concierge
- `packages/web` — Next.js 15 (port 3002), Obsidian × Discord dark theme

## Runtime
- Service: `systemctl --user restart claudeforge`
- DB: `~/.claudeforge/claudeforge.db`
- Port 3000 occupied by Wilson Premier — web dev uses 3002

## Key Decisions
- `claude --print --resume <UUID>` for multi-turn
- Lazy session reconstruction from DB after restart
- IntentRouter + Concierge pattern (no raw errors to users)
- No socket.io — raw WebSocket
- tmux for session persistence

## Phase Status (OpenClaw Data, Apr 2026)

- Phase 1 built and operational
- Global dispatcher routing commands across sessions
- Streaming indicator for real-time feedback
- Token count tracking per session
- Session name displayed in footer

## Cross-References
- [[Agent-OS-Demo]] — earlier frontend experiment
- [[Dashboard Designs v2]] — design system source
- [[EMA]] — primary AI assistant project
- [[Dispatch-System]] — complementary task dispatch engine
- [[ExecuDeck]] — alternative command environment with canvas-based UI

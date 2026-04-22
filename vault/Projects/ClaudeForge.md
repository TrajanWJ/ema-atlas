---
type: project
status: active
created: 2026-03-19
updated: 2026-04-17
confidence: 0.70
confidence_updated: 2026-04-17
tags: [project, discord-bot, web-ui, claude-code, remote-dev]
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

## Status Review (2026-04-17 staleness check)

- **Repo:** Confirmed exists at `~/Desktop/Coding/Projects/claude-remote-discord/` with packages, SPEC.md, CLAUDE.md
- **DB:** `~/.claudeforge/claudeforge.db` confirmed exists
- **Service:** `claudeforge` systemd user service could not be verified (D-Bus not available in this session). Needs manual check: `systemctl --user status claudeforge`
- **Confidence lowered to 0.70** — Architecture and key decisions likely still accurate, but runtime status needs fresh verification.

## Cross-References
- [[Agent OS Demo]] — earlier frontend experiment
- [[Dashboard Designs v2]] — design system source

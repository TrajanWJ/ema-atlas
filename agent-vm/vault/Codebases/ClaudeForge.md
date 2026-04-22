---
title: "ClaudeForge"
created: 2026-04-01
type: codebase
status: active
stack: [node.js, discord.js, next.js-15, sqlite, typescript, express, websocket]
host: host-machine
path: ~/Desktop/Coding/Projects/claude-remote-discord
repo_branch: master
category: dev-tools
tags: [codebase, claude-code, discord-bot, remote-ide, monorepo]
summary: "Discord server + web app that turns a machine into a remote Claude Code IDE. Directories become categories, sessions become channels."
related: [Claude Code Bot, ExecuDeck, OpenClaw Agent System]
---

# ClaudeForge

Discord server + web app that turns a machine into a remote Claude Code IDE. Directories become Discord categories, sessions become channels, and a web UI mirrors everything.

## Architecture

Monorepo with 4 packages (~6000 lines, 32+ source files):

| Package | Role |
|---|---|
| `packages/shared/` | Types, events, constants (used by all) |
| `packages/server/` | Express REST + WebSocket + SQLite + providers |
| `packages/bot/` | Discord.js bot with routing + rendering |
| `packages/web/` | Next.js 15 web UI with Zustand |

## Status

- **Git:** master, 61 dirty files (last commit: 2026-03-20)
- **Deployment:** Host machine
- **Active development:** Yes

## Related

- [[ExecuDeck]] — Similar concept, different surface (terminal + canvas vs Discord)
- [[Claude Code Bot]] — VM-side Claude Code execution bot
- [[OpenClaw Agent System]] — Agent orchestration layer

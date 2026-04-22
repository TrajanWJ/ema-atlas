---
name: Primary Claude Code Instance
description: This is THE Claude Code instance on trajan's machine - all dispatch, session management, and project coordination goes through here
type: project
last_used: 2026-03-20
---

This is the primary Claude Code instance running on trajan's local machine (hostname: trajan's workstation, user: trajan, home: /home/trajan).

**Why:** All Claude Code sessions, agent dispatches, and project work should route through this instance. It is the canonical environment for all development, agent orchestration, and vault operations.

**How to apply:** When dispatching agents, coordinating sessions, or referencing project locations — this is the instance to target. All project directories, MCP servers, skills, and vault integrations live here.

## Project Locations by Category

### Core / Home
- `/home/trajan` — Home directory (project: `-home-trajan`) — primary dispatch point
- `/home/trajan/bin` — User scripts and tools

### OpenClaw Ecosystem
- `/home/trajan/.openclaw` or mapped as `-home-trajan--openclaw` — OpenClaw core
- `/home/trajan/.openclaw-agents` — OpenClaw agents root
- `/home/trajan/.openclaw-agents/coder-workspace` — Coder agent workspace
- `/home/trajan/.openclaw-agents/concierge-workspace` — Concierge agent workspace
- `/home/trajan/.openclaw-agents/main-workspace` — Main agent workspace
- `/home/trajan/.openclaw-agents/ops-workspace` — Ops agent workspace
- `/home/trajan/.openclaw-agents/researcher-workspace` — Researcher agent workspace
- `/home/trajan/.openclaw-agents/vault-keeper-workspace` — Vault keeper agent workspace
- `/usr/lib/node_modules/openclaw` — OpenClaw global npm install

### Application Projects
- `/home/trajan/Desktop/Coding-Projects/claude-remote-discord` — Claude Remote Discord bot
- `/home/trajan/Desktop/Coding-Projects/execudeck` — ExecuDeck project
- `/home/trajan/Desktop/JarvisAI` — JarvisAI project
- `/home/trajan/Desktop/Proslync-documentation` — Proslync documentation
- `/home/trajan/Projects/agent-os-demo` — Agent OS demo

### Infrastructure / DevOps
- `/home/trajan/projects/discord-restructure` — Discord restructure project
- `/home/trajan/projects/ingestor` — Ingestor service

### Skills Development
- `/home/trajan/skills/agent-tester` — Agent tester skill
- `/home/trajan/skills/auto-knowledge` — Auto-knowledge skill
- `/home/trajan/skills/openclaw-claude-code-skill` — OpenClaw Claude Code skill

### Serena / Code Intelligence
- `/home/trajan/serena` — Serena code intelligence

### Temporary / Agent Workspaces
- `/tmp/agent-coder` — Temp coder agent workspace
- `/tmp/agent-os-deploy` — Temp OS deploy workspace
- `/tmp/agent-research` — Temp research workspace
- `/tmp/agent-security` — Temp security workspace
- `/tmp/research-competitive-*` — Temp competitive research
- `/tmp/research-frontend-*` — Temp frontend research

### Vault / Knowledge
- `/home/trajan/vault/` — Obsidian vault root
- `/home/trajan/vault/Claude-Code-Memory/` — Claude Code persistent memory (symlinked from `.claude/projects/-home-trajan/memory`)

## Session Storage
- Sessions stored at: `/home/trajan/.claude/sessions/`
- Project-scoped sessions at: `/home/trajan/.claude/projects/<project-slug>/` as `.jsonl` files

## Key Integration Points
- MCP config: `/home/trajan/.claude/mcp.json`
- Global instructions: `/home/trajan/.claude/CLAUDE.md`
- Skills: `/home/trajan/.claude/skills/`
- Hooks: `/home/trajan/.claude/hooks.json`
- Agents: `/home/trajan/.claude/agents/`

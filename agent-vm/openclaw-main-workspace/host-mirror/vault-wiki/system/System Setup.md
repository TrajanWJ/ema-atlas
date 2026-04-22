---
type: knowledge
wiki_id: system/System_Setup
imported_from: vault/System/System Setup.md
imported_at: '2026-04-04T00:23:57.267Z'
tags: []
summary: ''
---
# System Setup

> How Trajan's AI system is wired together — every component, config file, and data flow.
> Last verified: 2026-04-01

---

## The Big Picture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TRAJAN'S AI SYSTEM                              │
│                                                                         │
│  ┌──────────────────────┐         ┌──────────────────────────────────┐  │
│  │  OBSIDIAN VAULT       │  MCP    │  CLAUDE CODE CLI                 │  │
│  │  ~/vault/             │ :22360  │  ~/.claude/                      │  │
│  │                       │◄──────►│                                  │  │
│  │                       │        │  CLAUDE.md (global instructions) │  │
│  │                       │        │  mcp.json (server configs)       │  │
│  │  Claudian (sidebar)   │        │  settings.json (permissions)     │  │
│  │  claude-code-mcp      │        │                                  │  │
│  │  kepano skills        │        │  Plugins:                        │  │
│  └───────┬───────────────┘        │   Superpowers v5.0.1             │  │
│          │                        │   Context7                       │  │
│          │ QMD indexes             │   Frontend Design                │  │
│          │ every 30 min            │                                  │  │
│          ▼                        │  MCP Servers:                    │  │
│  ┌───────────────┐                │   QMD (semantic search)          │  │
│  │  QMD           │──── MCP ─────►│   CodeGraphContext (FalkorDB)    │  │
│  │  BM25 + vector │                │   Figma, Gmail, Vercel (cloud)  │  │
│  │  SQLite + ONNX │                └──────────────────────────────────┘  │
│  └───────────────┘                                                      │
│                                                                         │
│                                    ┌──────────────────────────────────┐  │
│                                    │  PROJECTS                        │  │
│                                    │  ~/Desktop/Coding/Projects/      │  │
│                                    │                                  │  │
│                                    │  Each has CLAUDE.md at root      │  │
│                                    │  + project note in vault          │  │
│                                    └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components

- [[System Machine]] — OS, hardware, node, paths
- [[System Claude Code]] — CLI config, plugins, MCP servers, settings, permissions
- [[System Obsidian]] — Plugins, vault config, MCP bridge
- [[System Services]] — QMD cron, systemd units
- [[System Vault Structure]] — How the vault is organized and why
- [[System Data Flow]] — The feedback loop: how context flows between sessions

---

## Quick Diagnostics

Run these to verify everything is working:

```bash
# 1. QMD cron job exists?
crontab -l | grep qmd

# 2. QMD search working? (should return results)
/home/trajan/.nvm/versions/node/v22.22.1/bin/qmd search "vault structure"

# 3. MCP servers configured?
cat ~/.claude/mcp.json | head -5

# 4. Obsidian running?
pgrep -a obsidian | head -1

# 5. MCP bridge port open? (only when Obsidian is running)
ss -tlnp | grep 22360
```

All green means the full feedback loop is operational: Claude Code can search the vault (QMD), read/write via filesystem, and communicate through the MCP bridge when Obsidian is open.

#system #setup #meta

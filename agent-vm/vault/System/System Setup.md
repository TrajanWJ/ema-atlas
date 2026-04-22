---
title: "System Setup"
created: 2026-03-16
updated: 2026-04-06
type: system
status: active
confidence: 0.85
confidence_updated: 2026-04-06
source: system
tags: [system, setup, infrastructure, meta]
summary: "Master wiring diagram — how Claude Code, Obsidian, QMD, MCP servers, and project repos connect into a unified AI-augmented development system."
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

Each component has its own dedicated reference page:

- [[System Machine]] — OS, hardware, Node.js, paths, and environment
- [[System Claude Code]] — CLI config, plugins, MCP servers, settings, permissions
- [[System Obsidian]] — Plugins, vault config, MCP bridge (Claudian/claude-code-mcp)
- [[System Services]] — QMD cron, systemd units, background daemons
- [[System Vault Structure]] — How the vault is organized and why
- [[System Data Flow]] — The feedback loop: how context flows between sessions

See also: [[System Overview]] for the broader infrastructure (VM, networking, all services).

---

## Key Configuration Files

| File | Purpose | Notes |
|------|---------|-------|
| `~/.claude/CLAUDE.md` | Global instructions for all Claude Code sessions | Constitution, anti-sycophancy, safety gates |
| `~/.claude/mcp.json` | MCP server definitions | QMD, CodeGraphContext, cloud services |
| `~/.claude/settings.json` | Tool permissions (allow/deny) | Auto-approve patterns |
| `~/.claude/rules/*.md` | Supplemental instruction files | `no-rm.md`, `research.md`, `vault-ops.md` |
| `~/vault/.obsidian/` | Obsidian app configuration | Plugins, themes, hotkeys |
| Project `CLAUDE.md` | Per-project instructions | Override/extend global config |

### How Config Layers Stack

Claude Code loads configuration in priority order:

1. **User's explicit instructions** (CLAUDE.md, direct requests) — highest priority
2. **Superpowers skills** — override defaults where they conflict
3. **Default system prompt** — lowest priority

Within CLAUDE.md, the Constitution section (never delete prod data, never commit secrets, never force push main, never swallow errors) is marked highest priority and cannot be overridden by project-level configs.

---

## MCP Server Topology

MCP (Model Context Protocol) servers give Claude Code access to external tools and data sources. The current topology:

**Local servers** (run on agent-vm):
- **QMD** — BM25 + vector search over vault notes. SQLite + ONNX runtime. Indexed every 30 minutes via cron.
- **CodeGraphContext** — FalkorDB-backed code knowledge graph. Indexes function call graphs, dependencies, and architecture patterns.
- **Ori Mnemos** — Session rhythm and vault memory bridge. Provides `ori_orient`, `ori_query_ranked`, and other vault lifecycle tools.

**Cloud/remote servers:**
- **Figma** — Design file access for frontend work
- **Gmail** — Email integration
- **Vercel** — Deployment management

MCP config lives in `~/.claude/mcp.json`. Each server entry specifies the command, args, and environment variables needed to start the server process.

---

## The Feedback Loop

The system creates a continuous context loop across sessions:

```
Session N                          Between Sessions              Session N+1
─────────                          ────────────────              ───────────
Claude Code works                  QMD re-indexes vault          Claude Code reads
  ↓                                  (cron, every 30min)           vault via QMD
Writes to vault                                                    ↓
  (notes, SOPs, dead ends)         Overnight digest runs         Recalls past work
  ↓                                  (summarizes recent notes)     ↓
Memory files updated                                             Applies lessons
  (~/.claude/projects/memory/)                                     (SOPs, dead ends)
```

This loop means Claude Code in session N+1 can recall what happened in session N — what worked, what failed, what patterns emerged — without the user having to re-explain context. The [[System Data Flow]] page details each step.

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

## Troubleshooting Common Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| QMD returns no results | Index stale or corrupted | `flock -n /tmp/qmd.lock qmd update && qmd embed` |
| MCP server won't start | Missing env vars or port conflict | Check `~/.claude/mcp.json`, verify no port collisions |
| Obsidian bridge unreachable | Obsidian not running or plugin disabled | Start Obsidian, enable claude-code-mcp community plugin |
| Claude Code ignores CLAUDE.md | File not in expected path | Must be at `~/.claude/CLAUDE.md` (global) or project root |
| Memory not persisting | Memory directory missing | Check `~/.claude/projects/*/memory/` exists |

---

## Setup From Scratch

If rebuilding the system on a new machine, the order matters:

1. **Base OS** — Ubuntu with standard dev tooling (see [[System Machine]])
2. **Node.js** — Install via nvm (currently v22.22.1)
3. **Claude Code CLI** — `npm install -g @anthropic-ai/claude-code`
4. **CLAUDE.md + rules** — Copy `~/.claude/` config directory
5. **MCP servers** — Install QMD, CodeGraphContext, configure `mcp.json`
6. **Obsidian** — Install, restore vault from backup, enable plugins
7. **Cron jobs** — QMD indexing every 30 minutes (see [[System Services]])
8. **Verify** — Run diagnostics above

#system #setup #meta

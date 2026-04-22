---
title: My Stack Decisions
created: '2026-03-14'
updated: '2026-03-16'
type: knowledge
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: reference
tags:
  - decisions
  - my-stack
summary: 'See [[Self-Hosted AI Agent Platforms 2026]] for full comparison.'
wiki_id: reference/My_Stack_Decisions
imported_from: vault/Reference/My Stack Decisions.md
imported_at: '2026-04-04T00:23:56.926Z'
---
# My Stack Decisions

> Chosen tools and architecture decisions, dated for reference.
>
> **Legend:** ==INSTALLED== means verified on disk. **CHOSEN** means decided but not yet installed.

---

## Last verified: 2026-03-16

### Obsidian Plugins (installed to `.obsidian/plugins/`)

| Tool | Status | Why |
|---|---|---|
| Claudian v1.3.68 | ==INSTALLED== | Claude Code inside Obsidian sidebar |
| obsidian-claude-code-mcp v1.1.8 | ==INSTALLED== | MCP bridge exposing vault to Claude Code CLI (port 22360) |

### Obsidian CLI

| Tool | Status | Why |
|---|---|---|
| Obsidian CLI (built-in v2.1.2+) | ==INSTALLED== | 100+ commands, `obsidian --no-sandbox` on this system |

### Claude Code Plugins (from `~/.claude/settings.json`)

| Tool | Status | Scope | Why |
|---|---|---|---|
| Superpowers v5.0.1 | ==INSTALLED== | Global | 14 dev workflow skills (TDD, debugging, planning, etc.) |
| Context7 | ==INSTALLED== | Global | Up-to-date API docs for coding agents |
| Frontend Dev | ==INSTALLED== | Global (custom at `~/.claude/plugins/frontend-dev/`) | 8 agents, Playwright visual testing |
| Frontend Design | ==INSTALLED== | Local (Truks project only) | Production-grade UI design |

### MCP Servers (from `~/.claude/mcp.json`)

| Server | Status | Why |
|---|---|---|
| CodeGraphContext | ==INSTALLED== | Code graph analysis via FalkorDB |
| QMD v2.0.1 | ==INSTALLED== | Hybrid BM25 + vector search, cron reindex every 30m. Fixed: now uses stdio transport |
| Task Master AI | ==INSTALLED== | PRD-to-tasks pipeline, core tools only (~5k tokens) |

### Cloud MCP Servers (platform-provided)

| Server | Notes |
|---|---|
| Context7 (cloud) | API docs (duplicate of plugin) |
| Figma | Design-to-code |
| Gmail | Email access |
| Vercel | Deployment management |

### Safety & Quality Hooks

| Tool | Status | Type | Why |
|---|---|---|---|
| Dippy | ==INSTALLED== | PreToolUse (Bash) | Auto-approve safe commands, block destructive. At `~/Dippy/` |
| Lasso claude-hooks | ==INSTALLED== | PostToolUse (Read, WebFetch, Bash, Grep, Task) | Prompt injection scanner, 50+ patterns. At `~/.claude/hooks/prompt-injection-defender/` |

### Vault-Level Skills (33 skills in `.claude/skills/`)

| Category | Skills |
|---|---|
| **Obsidian** (5) | obsidian-cli, obsidian-markdown, obsidian-bases, json-canvas, defuddle |
| **PKM Workflow** (13) | daily, weekly, monthly, review, project, goal-tracking, adopt, onboard, push, search, check-links, upgrade, obsidian-vault-ops |
| **Dev Patterns** (7) | api-design, backend-patterns, postgres-patterns, database-migrations, deployment-patterns, blueprint, agentic-engineering |
| **Security** (2) | security-scan, security-review |
| **Productivity** (3) | search-first, strategic-compact, content-engine |
| **Agent Ops** (1) | autonomous-loops |
| **Memory** (2) | sync-claude-sessions, recall |

### Vault-Level Agents (10 agents in `.claude/agents/`)

| Category | Agents |
|---|---|
| **PKM** (4) | goal-aligner, inbox-processor, note-organizer, weekly-reviewer |
| **Dev** (6) | architect, database-reviewer, security-reviewer, doc-updater, build-error-resolver, refactor-cleaner |

### Vault-Level Commands (7 in `.claude/commands/`)

| Command | Purpose |
|---|---|
| /orchestrate | Sequential agent workflow dispatcher with handoffs |
| /quality-gate | On-demand formatter/lint/type/test pipeline |
| /checkpoint | Git-backed workflow checkpoints |
| /sessions | List/load/alias session files |
| /resume-session | Load recent session with structured briefing |
| /save-session | Capture full session state to file |
| /learn | Extract reusable patterns as skills |

### Vault Structure (PKM cascade)

| Layer | Folder | Skill |
|---|---|---|
| Vision | `Goals/0. Three Year Goals.md` | /goal-tracking |
| Annual | `Goals/1. Yearly Goals.md` | /goal-tracking |
| Monthly | `Goals/2. Monthly Goals.md` | /monthly |
| Weekly | `Goals/3. Weekly Review.md` | /weekly |
| Daily | `Daily Notes/YYYY-MM-DD.md` | /daily |
| Projects | `Trajan's Projects/` | /project |

### Memory System (vault-native, replaces claude-mem)

| Component | What it does |
|---|---|
| Session Log/ | Session summaries persisted to vault |
| [[QMD semantic search]] | Context injection from past sessions |
| recall skill | Load context from previous sessions |
| sync-claude-sessions skill | Export conversations to Obsidian markdown |
| Claude Code auto-memory | File-based memory at `~/.claude/projects/` |

---

## Agent VM Stack

| Tool | Status | Why |
|---|---|---|
| [[Agents/OpenClaw|OpenClaw]] 2026.3.12 | ==INSTALLED== | AI gateway — native systemd service on agent-vm, Discord + Telegram |
| OAuth Guardian v4 | ==INSTALLED== | Auto-refresh Claude auth tokens |
| Bridge Sync | ==INSTALLED== | VM ↔ Host file exchange via rsync |
| [[Laminar]] | ==INSTALLED== | Observability stack (Docker compose) |
| **IronClaw** (NEAR AI) | **WATCHING** | Rust + WASM sandbox — best security model. Worth evaluating when more mature |

See [[Self-Hosted AI Agent Platforms 2026]] for full comparison.

## Rejected / Deferred

| Tool | Status | Reason |
|---|---|---|
| claude-mem | **REJECTED** | Replaced by vault-native memory (QMD + recall + session logs) |
| CloudCLI | **REPLACED** | Replaced by [[OpenClaw]] in agent-vm VM |
| n8n | **REJECTED** | Too much overhead |
| LibreChat | **DEFERRED** | Phase 2 |
| CopilotKit | **DEFERRED** | Phase 2 |

---

## Architecture (verified 2026-03-11)

```
┌──────────────────────────────────────────────────────────────────┐
│                     TRAJAN'S AI STACK                             │
│                                                                   │
│  Obsidian Vault ──── Claudian v1.3.68 (sidebar chat)             │
│       │               Obsidian CLI (100+ commands)                │
│       │                                                           │
│       ├── obsidian-claude-code-mcp v1.1.8 (port 22360)           │
│       ├── 33 vault skills (PKM + dev + security + memory)        │
│       ├── 10 vault agents (PKM + dev)                            │
│       ├── 7 vault commands (orchestrate, checkpoint, etc.)        │
│       ├── Goals cascade (3-year → daily)                          │
│       └── Rules + hooks (markdown-standards, auto-commit, etc.)   │
│                                                                   │
│  Claude Code CLI ─── Superpowers v5.0.1 (14 skills)              │
│       │               Context7 (API docs)                         │
│       │               Frontend Dev (8 agents)                     │
│       │               Frontend Design (Truks only)                │
│       │                                                           │
│       ├── MCP Servers:                                            │
│       │    CodeGraphContext (FalkorDB)                             │
│       │    QMD v2.0.1 (semantic search, stdio)                    │
│       │    Task Master AI (PRD-to-tasks, core tools)              │
│       │                                                           │
│       ├── Safety Hooks:                                           │
│       │    Dippy (PreToolUse — auto-approve safe Bash)            │
│       │    Lasso (PostToolUse — prompt injection scanner)          │
│       │                                                           │
│       └── Memory:                                                 │
│            ~/.claude/projects/ (auto-memory)                      │
│            Session Log/ + QMD + recall (vault-native)             │
│                                                                   │
│  Cloud MCPs ──── Context7 │ Figma │ Gmail │ Vercel               │
└──────────────────────────────────────────────────────────────────┘
```

#decisions #my-stack

## Related

- [[Capsule]]
- [[Ghost OS]]
- [[Serena MCP]]

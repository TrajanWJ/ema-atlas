---
title: "My Stack Decisions"
created: 2026-03-14
updated: 2026-04-17
type: reference
status: active
confidence: 0.85
confidence_updated: 2026-04-17
source: reference
tags: [decisions, my-stack]
summary: "See [[Self-Hosted AI Agent Platforms 2026]] for full comparison."
---
# My Stack Decisions

> Chosen tools and architecture decisions, dated for reference.
>
> **Legend:** ==INSTALLED== means verified on disk. **CHOSEN** means decided but not yet installed.

---

## Last verified: 2026-04-17

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
| Superpowers | ==INSTALLED== | Global (marketplace) | Dev workflow skills (TDD, debugging, planning, etc.) |
| Context7 | ==INSTALLED== | Global (marketplace) | Up-to-date API docs for coding agents |
| claude-hud | ==INSTALLED== | Global (custom marketplace) | Status line HUD display |

### MCP Servers (from `~/.claude/settings.json` + `~/.claude/mcp.json`)

**Global (settings.json):**

| Server | Status | Why |
|---|---|---|
| need | ==INSTALLED== | Dependency management |
| agent-fs | ==INSTALLED== | Agent filesystem operations |
| apitap | ==INSTALLED== | API interception/monitoring |
| wiki-mcp | ==INSTALLED== | Wiki server (python3, ~/wiki/mcp/server.py) |
| filesystem | ==INSTALLED== | MCP filesystem (Projects + vault) |

**Project-level (mcp.json):**

| Server | Status | Why |
|---|---|---|
| ema | ==INSTALLED== | EMA MCP server (node, connects to http://192.168.122.1:4488/api) |
| QMD | ==INSTALLED== | Hybrid BM25 + vector search, cron reindex every 30m (stdio) |
| filesystem (x2) | ==INSTALLED== | Projects + vault access |
| sequential-thinking | ==INSTALLED== | Chain-of-thought reasoning |
| memory | ==INSTALLED== | MCP memory server |
| context7 | ==INSTALLED== | API docs (npm) |
| git | ==INSTALLED== | Git operations (uvx) |
| fetch | ==INSTALLED== | URL fetching (uvx) |
| playwright | ==INSTALLED== | Browser automation |
| codebase-memory-mcp | ==INSTALLED== | Code graph analysis |

**Removed since last check:**
- ~~CodeGraphContext (FalkorDB)~~ → replaced by codebase-memory-mcp
- ~~Task Master AI~~ → removed

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
| chop | ==INSTALLED== | PreToolUse (Bash) | Command safety gating. At `~/bin/chop` |
| safety-check.sh | ==INSTALLED== | PreToolUse (Bash) | Additional safety validation. At `~/.claude/hooks/safety-check.sh` |
| vault-post-write.sh | ==INSTALLED== | PostToolUse (Write) | Auto-process vault writes. At `~/.claude/hooks/vault-post-write.sh` |
| ori/capture.mjs | ==INSTALLED== | Stop | Session capture on stop. At `~/.claude/hooks/ori/capture.mjs` |

**Removed since last check:**
- ~~Dippy~~ → replaced by chop + safety-check.sh
- ~~Lasso claude-hooks~~ → replaced by vault-post-write.sh + ori capture

### Vault-Level Skills (46 skills in `.claude/skills/`)

| Category | Skills |
|---|---|
| **Obsidian** (5) | obsidian-cli, obsidian-markdown, obsidian-bases, json-canvas, defuddle |
| **PKM Workflow** (13+) | daily, weekly, monthly, review, project, goal-tracking, adopt, onboard, search, check-links, upgrade, obsidian-vault-ops, recall, vault-save, vault-search |
| **Dev Patterns** (7+) | api-design, backend-patterns, postgres-patterns, database-migrations, deployment-patterns, blueprint, agentic-engineering |
| **Security** (2) | security-scan, security-review |
| **Productivity** (3+) | search-first, strategic-compact, content-engine, context7, claude-api |
| **Agent Ops** (3+) | autonomous-loops, parallel-task, llm-council |
| **Memory/Sessions** (5+) | sync-claude-sessions, recall, save-session, resume-session, sessions |
| **Other** | planner, plan-harder, loop, keybindings-help, simplify, read-github, qmd, codebase-memory-*, vault-save |

### Vault-Level Agents (15 agents in `.claude/agents/`)

| Category | Agents |
|---|---|
| **PKM** (4+) | goal-aligner, inbox-processor, note-organizer, weekly-reviewer |
| **Dev** (6+) | architect, database-reviewer, security-reviewer, doc-updater, build-error-resolver, refactor-cleaner |
| **Ops** (5+) | system-ops, cron-ops, orchestrator, researcher, knowledge-engineer |

### Vault-Level Commands (9 in `.claude/commands/`)

| Command | Purpose |
|---|---|
| /orchestrate | Sequential agent workflow dispatcher with handoffs |
| /quality-gate | On-demand formatter/lint/type/test pipeline |
| /checkpoint | Git-backed workflow checkpoints |
| /sessions | List/load/alias session files |
| /resume-session | Load recent session with structured briefing |
| /save-session | Capture full session state to file |
| /learn | Extract reusable patterns as skills |
| /vault-save | Save conversation context to vault |
| /vault-search | Run vault search via antfly + qmd |

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

## Architecture (verified 2026-04-17)

```
┌──────────────────────────────────────────────────────────────────┐
│                     TRAJAN'S AI STACK                             │
│                                                                   │
│  Obsidian Vault ──── Claudian v1.3.68 (sidebar chat)             │
│       │               Obsidian CLI (100+ commands)                │
│       │                                                           │
│       ├── obsidian-claude-code-mcp v1.1.8 (port 22360)           │
│       ├── 46 vault skills (PKM + dev + security + memory + ops)  │
│       ├── 15 vault agents (PKM + dev + ops)                      │
│       ├── 9 vault commands (orchestrate, checkpoint, etc.)        │
│       ├── Goals cascade (3-year → daily)                          │
│       └── Rules + hooks (markdown-standards, auto-commit, etc.)   │
│                                                                   │
│  Claude Code CLI ─── Superpowers (dev workflows)                  │
│       │               Context7 (API docs)                         │
│       │               claude-hud (status line)                    │
│       │                                                           │
│       ├── MCP Servers (15+):                                      │
│       │    QMD (semantic search, stdio)                            │
│       │    codebase-memory-mcp (code graph)                       │
│       │    ema (EMA v5, task dispatch)                             │
│       │    need, agent-fs, apitap, wiki-mcp                       │
│       │    filesystem, git, fetch, playwright                      │
│       │    sequential-thinking, memory, context7                   │
│       │                                                           │
│       ├── Safety Hooks:                                           │
│       │    chop (PreToolUse — command safety gating)               │
│       │    safety-check.sh (PreToolUse — additional validation)    │
│       │    vault-post-write.sh (PostToolUse — vault processing)    │
│       │    ori/capture.mjs (Stop — session capture)                │
│       │                                                           │
│       └── Memory:                                                 │
│            ~/.claude/projects/ (auto-memory)                      │
│            Session Log/ + QMD + recall (vault-native)             │
│            ori (Mnemos session bridge)                             │
│                                                                   │
│  Cloud MCPs ──── Context7 │ Figma │ Gmail │ Vercel               │
└──────────────────────────────────────────────────────────────────┘
```

#decisions #my-stack

## Related

- [[Capsule]]
- [[Ghost OS]]
- [[Serena MCP]]

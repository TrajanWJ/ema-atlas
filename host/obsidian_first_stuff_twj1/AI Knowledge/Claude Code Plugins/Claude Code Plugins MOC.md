# Claude Code Plugins & Skills

> Supercharging Claude Code CLI with skills, memory, task management, and more.

---

## Configuration (Start Here)

| Note | What It Covers |
|---|---|
| [[Claude Code Configuration]] | CLAUDE.md, settings.json, .claudeignore, hooks, subagents, worktrees |

## Chosen Plugins — Install Priority Order

Install in this order. Each row depends on the ones above it.

| # | Tool | What It Does | Status | Install |
|---|---|---|---|---|
| 1 | [[QMD]] | Local hybrid search, 60-95% token reduction | **CHOSEN** | `pip install qmd` |
| 2 | [[sync-claude-sessions]] | Export sessions to searchable markdown | **CHOSEN** | `npm i -g sync-claude-sessions` |
| 3 | [[claude-mem]] | Persistent memory across sessions | **CHOSEN** | `pip install claude-mem` |
| 4 | [[everything-claude-code]] | 65+ skills, 13 agents, 40+ commands | **CHOSEN** | Git clone to `.claude/skills/` |
| 5 | [[Claude Task Master]] | PRD-to-tasks pipeline via MCP | **CHOSEN** | `npm i -g claude-task-master` |

> **Why this order**: QMD + sync-claude-sessions form the memory backbone (sessions are exported then indexed). claude-mem adds cross-session observations on top. everything-claude-code adds workflow skills that benefit from memory being in place. Task Master is project-specific and can wait.

## Safety Hooks

| Tool | What It Does | Status | Install |
|---|---|---|---|
| [[Dippy]] | Auto-approve safe commands, block destructive ones | **CHOSEN** | `npm i -g dippy` |
| [[Lasso claude-hooks]] | Scan for prompt injection in tool outputs (50+ patterns) | **CHOSEN** | Git clone |

> Install safety hooks **before** giving Claude broad tool access.

## Already Installed

| Tool | What It Does | Status |
|---|---|---|
| Superpowers v5.0.1 | 14 battle-tested dev workflow skills | Active |
| Context7 | API docs for coding agents | Active |
| Frontend Dev | Custom plugin, 8 agents, 10 test categories | Active |
| Frontend Design | Production-grade UI design | Active |
| CodeGraphContext MCP | Code graph analysis (FalkorDB) | Active |

## Install Status Legend

| Symbol | Meaning |
|---|---|
| Active | Installed and working |
| **CHOSEN** | Selected, not yet installed |
| Evaluating | Under consideration |
| Deferred | Decided to install later |
| Rejected | Evaluated and rejected (see ADR) |

#claude-code #plugins #skills

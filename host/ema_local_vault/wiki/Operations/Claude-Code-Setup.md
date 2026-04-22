---
title: "Claude Code Setup"
space: wiki
tags: ["ops","claude-code","config"]
source: manual
---

# Claude Code Setup

Configuration as of 2026-04-06. Config lives at `~/.claude/settings.json`.

## MCP Servers (3 active)

| Server | Command | Purpose |
|--------|---------|---------|
| **ema** | `mix ema.mcp.stdio` (native Elixir) | EMA daemon API via MCP (tools + resources) |
| **filesystem** | `npx @modelcontextprotocol/server-filesystem` | Direct file access to `~/Projects` and `~/vault` |
| **qmd** | `/usr/bin/qmd mcp` | Semantic search over 168 markdown documents |

### EMA MCP Server

Connects to daemon at `http://localhost:4488/api` (set via `EMA_URL` env var).

**Tools (23 — 17 core + 6 session):**

| Tool | Purpose |
|------|---------|
| `create_proposal` | Trigger proposal pipeline (Generator -> Refiner -> Debater -> Tagger) |
| `create_task` | Create task with project/goal/priority |
| `update_task` | Transition task status (pending/active/done/blocked) |
| `query_vault` | Semantic search over knowledge vault |
| `log_outcome` | Record task outcome for pattern detection |
| `context_operator` | Fetch operator context package |
| `context_project` | Fetch project context package by ID/slug |
| `bootstrap_status` | Check onboarding/readiness status |
| `run_bootstrap` | Run bootstrap sweep (detect tools, catalog imports) |
| `ema_get_intents` | List intents with filters (level, status, kind, project) |
| `ema_create_intent` | Create intent at any hierarchy level (L0-L5) |
| `ema_get_intent_tree` | Full intent hierarchy as nested tree |
| `ema_get_intent_context` | Intent with links, lineage events, parent chain |

**Resources (10):**

| URI | Purpose |
|-----|---------|
| `ema://context/operator` | Canonical operator context package |
| `ema://context/project?id=X` | Project context package |
| `ema://projects/active` | Active projects with goals, tasks, activity |
| `ema://tasks/pending` | Blocked/waiting tasks with context |
| `ema://proposals/recent` | Last 5 approved proposals |
| `ema://bootstrap/status` | Onboarding readiness |
| `ema://focus/current` | Current focus session/timer state |
| `ema://vault/search?q=X` | Semantic vault search |
| `ema://intents/active` | Active intents from Intent Engine |
| `ema://intents/tree?project_id=X` | Full intent hierarchy tree |

## Plugins (3)

| Plugin | Purpose |
|--------|---------|
| context7 | Real-time library documentation |
| superpowers | Enhanced agent skills (brainstorming, plans, worktrees, TDD, etc.) |
| rust-analyzer-lsp | Rust language support |

## Hooks

None active.

## Config Files

| File | Purpose |
|------|---------|
| `~/.claude/settings.json` | MCP servers, plugins, permissions |
| `~/.claude/CLAUDE.md` | Session protocol, coding conventions |
| `~/.claude/statusline-command.sh` | Custom status line |
| `~/Projects/ema/CLAUDE.md` | Project-specific instructions |

## Permissions

Auto-allowed commands:
- `WebFetch(domain:github.com)`
- `Bash(test:*)`, `Bash(git clone:*)`, `Bash(npm run build:*)`
- Various pip/python commands for CodeGraphContext

`skipDangerousModePermissionPrompt: true`

## What Was Removed (2026-04-05)

- 5 broken prompt-injection-defender hooks (file missing, errored every call)
- 5 SUPERSET notification hooks (no-op)
- Dippy pre-tool hook
- Session log/export stop hooks
- 6 redundant MCP servers (context7 MCP, memory, exa, github, fetch, jina-reader)
- taskmaster-ai (disabled)
- CodeGraphContext MCP (removed, was breaking)

## Related

- [[MCP-Tools-Reference]]
- [[MCP-Resources-Reference]]
- [[Quick Reference]]
- [[Infrastructure]]

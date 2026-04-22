---
title: "System Claude Code"
type: reference
created: 2026-03-13
updated: 2026-04-13
confidence: verified
source: direct system inspection
tags: [system, claude-code, config, mcp, plugins, hooks]
summary: "Complete Claude Code CLI configuration reference — config files, instruction architecture, plugins, MCP servers, hooks, and permissions."
---

# System Claude Code

> Claude Code CLI configuration — every config file, plugin, MCP server, and permission.
> Last verified: 2026-04-13

---

## Overview

Claude Code is Anthropic's CLI-based AI coding assistant that operates directly in the terminal. It reads layered instruction files (CLAUDE.md), connects to external tools via MCP servers, extends functionality through plugins, and enforces safety through hooks and permission gates. This note documents the full configuration as deployed on Trajan's system.

See also: [[Agent Capabilities Matrix]], [[Agent Orchestration Patterns]], [[Cron Jobs Ecosystem]]

---

## Version

Claude Code 2.1.76

## Config Files

| File | Purpose |
|---|---|
| `~/.claude/CLAUDE.md` | Global instructions — vault access, auto-growth rules, per-project notes |
| `~/.claude/settings.json` | Permissions, plugins, status line config |
| `~/.claude/settings.local.json` | Local permission overrides (mirrors settings.json permissions) |
| `~/.claude/mcp.json` | MCP server definitions (QMD + CodeGraphContext) |
| `~/.claude/statusline-command.sh` | Custom status line — shows `user@host:cwd` like bash PS1 |
| `~/.claude/projects/` | Per-project memory (auto-memory MEMORY.md files) |

## Instruction Architecture (Revised 2026-03-13)

Three layers ensure Claude follows vault rules regardless of which project it's working in:

| Layer | File | Lines | Scope |
|-------|------|-------|-------|
| **Global** | `~/.claude/CLAUDE.md` | ~80 | Every session, every project |
| **Per-project** | `~/.claude/projects/{project}/CLAUDE.md` | ~17 | When working in that project dir |
| **Vault-specific** | `vault/CLAUDE.md` | ~55 | When working inside the vault |

### Global CLAUDE.md (~80 lines)
- Session protocol (start → during → end)
- Inlined coding conventions (TypeScript, React, Next.js key rules)
- Agent Context reference table (when to read which deep-dive file)
- Vault write rules and project note requirements

### Per-Project CLAUDE.md (~17 lines, deployed to 17 projects)
- Vault path and integration instructions
- "Read project note at start, write session log at end"
- Agent Context reference list for deep dives

### Hooks (verified 2026-04-13 from settings.json)

| Event | Hook | Purpose |
|-------|------|---------|
| **PreToolUse** (Bash) | `~/bin/chop hook` | Command safety/monitoring |
| **PreToolUse** (Bash) | `~/.claude/hooks/safety-check.sh` | Block dangerous commands |
| **PostToolUse** (Write) | `~/.claude/hooks/vault-post-write.sh` | Post-write vault ops (qmd update) |
| **Stop** | `~/.claude/hooks/ori/capture.mjs` | Ori session capture |

**Note:** Letta subconscious hooks (SessionStart, UserPromptSubmit, Stop sync-transcript) and ori/validate.mjs are no longer present in settings.json as of 2026-04-13. They may have been removed or moved. SessionStart inject via MCP instructions (ori_orient) instead of a hook.

Full content: read `~/.claude/CLAUDE.md` directly.

## Plugins (Installed)

| Plugin | Source | Enabled | What It Does |
|---|---|---|---|
| **Superpowers** | claude-plugins-official | Yes | Dev workflow skills (brainstorming, TDD, debugging, plans, reviews, git worktrees) |
| **Context7** | claude-plugins-official | Yes | Up-to-date API docs for any library via `/resolve-library-id` and `/query-docs` |
| **Claude HUD** | claude-hud (jarrodwatts/claude-hud) | Yes | Status line HUD showing session context |
| **Frontend Design** | claude-plugins-official | No (cached only) | Production-grade UI design — available but not enabled in settings.json |

**Enabled in `settings.json`:** `context7@claude-plugins-official`, `superpowers@claude-plugins-official`, `claude-hud@claude-hud`

Plugin cache structure:
```
~/.claude/plugins/cache/claude-plugins-official/
├── context7/
├── frontend-design/
└── superpowers/
```

## MCP Servers

Configured in `~/.claude/mcp.json` (and some in `~/.claude/settings.json`):

### Active (enabled) MCP Servers

| Server | Command | Notes |
|--------|---------|-------|
| **qmd** | `/usr/bin/qmd mcp` | Vault semantic search via BM25 + embeddings |
| **antfly** | `http://localhost:8080/mcp/v1/` | Vault search HTTP service |
| **graph-memory** | `http://localhost:3100/mcp/vault` | Knowledge graph memory |
| **engram** | `engram mcp` | Memory system |
| **vault-filesystem** | `@modelcontextprotocol/server-filesystem ~/vault` | Direct vault filesystem access |
| **markitdown** | `markitdown-mcp` | Markdown conversion |
| **perplexity** | `npx perplexity-web-api-mcp` | Web search |
| **rlm** | `mcp-rlm-server` | — |
| **mcp-tool-search** | `npx mcp-tool-search` | Tool catalog search |
| **trend-pulse** | `trend-pulse-server` | — |
| **need** | `need mcp` | — |
| **agent-fs** | `agent-fs mcp` | Agent filesystem |
| **apitap** | `apitap-mcp` | API inspection |
| **wiki-mcp** | `python3 ~/wiki/mcp/server.py` | Local wiki MCP server |

### Disabled MCP Servers

CodeGraphContext (cgc), taskmaster-ai, serena, lightpanda, chrome-devtools, GitGuardian, nmap-mcp, gitnexus, krometrail, arkana, codebase-memory-mcp, sqlite-memory, iris-eval

### CodeGraphContext (disabled as of 2026-04-02)
Was: `~/.local/bin/cgc mcp start`, FalkorDB at `~/.codegraphcontext/falkordb.db`
16 always-allowed tools (find_code, analyze_code_relationships, find_dead_code, execute_cypher_query, etc.)

### Cloud MCP (via Claude.ai)
- **Figma** — design-to-code, screenshots, design system rules
- **Gmail** — email search, read, draft
- **Vercel** — deployment management, logs, domain management
- **Context7** — library documentation (also available as local plugin)

## Permissions (`settings.json`)

```json
{
  "permissions": {
    "allow": [
      "WebFetch(domain:github.com)",
      "Bash(test:*)",
      "Bash(git clone:*)",
      "Bash(pnpm standalone:build:*)",
      "Bash(npm run build:*)"
    ],
    "defaultMode": "default"
  },
  "skipDangerousModePermissionPrompt": true
}
```
*(Verified 2026-04-13 — codegraphcontext pip/python entries removed after CGC was disabled)*

The `settings.local.json` mirrors the same permission allow list. Dangerous mode prompt is skipped globally.

## Per-Project Settings

Projects can have their own `.claude/settings.json`:

| Project | Location | Notes |
|---|---|---|
| **letmescale** | `~/Desktop/Coding/Projects/letmescale/.claude/settings.json` | Empty allow/deny (default permissions) |

## Per-Project CLAUDE.md Pattern

Each project directory can have its own `CLAUDE.md` that:
1. Describes project-specific conventions and stack
2. References the vault for broader context
3. Claude loads both global + project CLAUDE.md on every session

## Key Behaviors and Design Decisions

### Instruction Layering
The three-layer instruction architecture (global → per-project → vault) ensures Claude Code always has access to vault rules and coding conventions regardless of which project directory it's invoked from. This was formalized on 2026-03-13 after earlier iterations where per-project instructions were inconsistent.

### Hook Pipeline
Hooks execute at defined lifecycle events (SessionStart, PreToolUse, PostToolUse, Stop, UserPromptSubmit). The current hook pipeline integrates three systems:
- **Chop** — command safety monitoring and auditing
- **Ori** — vault note validation, session briefing, and session capture
- **Letta** — subconscious memory init, context whisper, and transcript sync

Hooks run synchronously and can block tool execution (e.g., the safety-check hook blocks dangerous Bash commands).

### MCP Server Strategy
MCP servers provide Claude Code with external tool access beyond its built-in capabilities. The current configuration favors local-first tools (qmd, antfly, vault-filesystem) with selective cloud services (perplexity for web search). Several servers have been disabled after evaluation (CodeGraphContext, taskmaster-ai, serena) — they may be re-enabled as they mature.

### Plugin Architecture
Plugins extend Claude Code with skill-based workflows. The [[Agent Capabilities Matrix|Superpowers plugin]] provides structured development workflows (TDD, debugging, brainstorming, code review) while Context7 provides live library documentation. Plugins are cached locally under `~/.claude/plugins/cache/` and enabled/disabled in `settings.json`.

### Permission Model
Permissions default to interactive confirmation mode. Specific safe operations (test commands, git clone, build commands) are pre-approved in the allow list. The `skipDangerousModePermissionPrompt` flag allows switching to dangerous mode without confirmation — this is a power-user setting that trades safety prompts for speed.

## Related Notes

- [[Agent Capabilities Matrix]] — full agent/tool capability mapping
- [[Agent Orchestration Patterns]] — multi-agent coordination patterns
- [[Cron Jobs Ecosystem]] — scheduled automation that interacts with Claude Code
- [[Code Patterns]] — coding conventions enforced via CLAUDE.md

#system #claude-code #config

---
type: knowledge
wiki_id: system/System_Claude_Code
imported_from: vault/System/System Claude Code.md
imported_at: '2026-04-04T00:23:57.266Z'
tags: []
summary: ''
---
# System Claude Code

> Claude Code CLI configuration — every config file, plugin, MCP server, and permission.
> Last verified: 2026-04-02

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

### Hooks (as of 2026-04-02)

| Event | Hook | Purpose |
|-------|------|---------|
| **PreToolUse** (Bash) | `~/bin/chop hook` | Command safety/monitoring |
| **PreToolUse** (Bash) | `~/.claude/hooks/safety-check.sh` | Block dangerous commands |
| **PostToolUse** (Write) | `~/.claude/hooks/ori/validate.mjs` | Ori vault note validation |
| **PostToolUse** (Write) | `~/.claude/hooks/vault-post-write.sh` | Post-write vault ops (qmd update) |
| **SessionStart** | `~/.claude/hooks/ori/orient.mjs` | Ori session briefing |
| **SessionStart** | `~/.claude/hooks/letta-subconscious/session-start.mjs` | Letta subconscious init |
| **UserPromptSubmit** | `~/.claude/hooks/letta-subconscious/whisper.mjs` | Letta context whisper |
| **Stop** | `~/.claude/hooks/ori/capture.mjs` | Ori session capture |
| **Stop** | `~/.claude/hooks/letta-subconscious/sync-transcript.mjs` | Sync transcript to Letta |

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
      "Bash(/home/trajan/.local/share/pipx/venvs/codegraphcontext/bin/pip show:*)",
      "Bash(/home/trajan/.local/share/pipx/venvs/codegraphcontext/bin/python:*)",
      "Bash(npm run build:*)"
    ],
    "defaultMode": "default"
  },
  "skipDangerousModePermissionPrompt": true
}
```

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

#system #claude-code #config

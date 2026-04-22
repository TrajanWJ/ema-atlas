# System Claude Code

> Claude Code CLI configuration — every config file, plugin, MCP server, and permission.
> Last verified: 2026-03-11

---

## Version

Claude Code 2.1.74

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

### Stop Hook (enforcement)
`~/.claude/hooks/session-log-reminder/check-session-log.sh` fires at session end and warns if no session log was written today.

Full content: read `~/.claude/CLAUDE.md` directly.

## Plugins (Installed)

| Plugin | Source | Enabled | What It Does |
|---|---|---|---|
| **Superpowers** | claude-plugins-official | Yes | 14 dev workflow skills (brainstorming, TDD, debugging, plans, reviews) |
| **Context7** | claude-plugins-official | Yes | Up-to-date API docs for any library via `/resolve-library-id` and `/query-docs` |
| **Frontend Design** | claude-plugins-official | No (cached only) | Production-grade UI design — available but not enabled in settings.json |

**Note:** `settings.json` only enables `context7` and `superpowers`. Frontend Design is cached at `~/.claude/plugins/cache/claude-plugins-official/frontend-design/` but not listed in `enabledPlugins`. Enable it by adding `"frontend-design@claude-plugins-official": true` to the `enabledPlugins` object.

Plugin cache structure:
```
~/.claude/plugins/cache/claude-plugins-official/
├── context7/
├── frontend-design/
└── superpowers/
```

## MCP Servers

Configured in `~/.claude/mcp.json`:

### QMD (Semantic Search — daemon mode since 2026-03-13)
```json
{
  "command": "/home/trajan/.nvm/versions/node/v22.22.1/bin/qmd",
  "args": ["mcp", "--http", "--daemon"]
}
```
Tools: `query`, `get`, `multi_get` — searches the Obsidian vault via BM25 + vector embeddings.

### CodeGraphContext (Code Graph)
```json
{
  "command": "/home/trajan/.local/bin/cgc",
  "args": ["mcp", "start"]
}
```
Database: FalkorDB at `~/.codegraphcontext/falkordb.db`
Socket: `~/.codegraphcontext/falkordb.sock`
Logs: `~/.codegraphcontext/logs/cgc.log`

All 16 tools are always-allowed: `add_code_to_graph`, `add_package_to_graph`, `check_job_status`, `list_jobs`, `find_code`, `analyze_code_relationships`, `watch_directory`, `find_dead_code`, `execute_cypher_query`, `calculate_cyclomatic_complexity`, `find_most_complex_functions`, `list_indexed_repositories`, `delete_repository`, `list_watched_paths`, `unwatch_directory`, `visualize_graph_query`.

Key env vars: `PARALLEL_WORKERS=4`, `MAX_FILE_SIZE_MB=10`, `ALLOW_DB_DELETION=false`, `IGNORE_TEST_FILES=false`.

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

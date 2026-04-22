# claude-mem

> **Status: REJECTED** — Replaced by vault-native memory (QMD + recall + session logs). See [[My Stack Decisions]].
>
> Persistent memory across Claude Code sessions — Claude remembers your projects.

## Quick Info

| Field | Value |
|---|---|
| **GitHub** | [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) |
| **Stars** | 34,200+ |
| **Version** | v10.5.5 (Mar 2026) |
| **License** | AGPL-3.0 (`ragtime/` dir uses PolyForm Noncommercial 1.0.0) |
| **Website** | [claude-mem.ai](https://claude-mem.ai/) |
| **Docs** | [docs.claude-mem.ai](https://docs.claude-mem.ai/installation) |

## How It Works

1. **Captures** everything Claude does during sessions via 6 lifecycle hooks
2. **Compresses** observations with AI (using Claude's Agent SDK)
3. **Injects** relevant context into future sessions automatically

## Hooks Used

`SessionStart`, `UserPromptSubmit`, `PostToolUse`, `Stop`, `SessionEnd` (6 hook scripts total)

## Install

```bash
# In Claude Code CLI (NOT npm install -g):
/plugin marketplace add thedotmack/claude-mem
/plugin install claude-mem
```

For OpenClaw gateways:
```bash
curl -fsSL https://install.cmem.ai/openclaw.sh | bash
```

NPM install only gets the SDK library without plugin hooks.

Plugin auto-configures hooks and starts worker service. Settings at `~/.claude-mem/settings.json`.

## Architecture

| Component | Details |
|---|---|
| **Worker service** | HTTP API on port 37777 with web UI, managed by Bun |
| **Primary storage** | SQLite 3 + FTS5 — sessions, observations, summaries |
| **Semantic search** | ChromaDB (vector DB) — embedding-based similarity |
| **Data location** | `~/.claude-mem/claude-mem.db` (all local) |
| **Smart install** | Cached dependency checker |
| **mem-search skill** | Natural language memory queries |

## 3-Layer Progressive Disclosure (MCP Tools)

1. **`search`** — Compact index with observation IDs (~50-100 tokens/result)
2. **`timeline`** — Chronological context around observations
3. **`get_observations`** — Full details by ID (~500-1,000 tokens/result)

Result: ~10x token savings vs dumping all context.

## Key Features

- **Web Viewer UI** — real-time memory at `http://localhost:37777`
- **Privacy Control** — `<private>` tags to exclude sensitive data
- **Citations** — reference past observations with IDs
- **Claude Desktop integration** — search memory from conversations
- **Endless Mode** — experimental beta feature

## vs. Claude Code Built-in Memory

| Feature | Built-in | claude-mem |
|---|---|---|
| Storage | Flat markdown (`~/.claude/projects/*/memory/`) | SQLite + ChromaDB |
| Retrieval | Manual CLAUDE.md reading | 3-layer semantic search |
| Compression | None | AI-powered via Agent SDK |
| Cross-session | Limited | Automatic |
| Privacy | None | `<private>` tags to exclude |

## Requirements

- Node.js 18.0.0+
- Claude Code (latest with plugin support)
- Bun (auto-installed if missing)
- uv Python package manager (auto-installed if missing)

## Gotchas

- **115 open issues** as of Mar 2026 — active development
- **AGPL license** — if you modify and deploy on a network server, you must make your source code available
- **Bug reports** — run `cd ~/.claude/plugins/marketplaces/thedotmack && npm run bug-report`
- **Port 37777** — worker service binds this; check for conflicts

## Obsidian Integration

claude-mem does **not** natively support Obsidian as storage. Use [[Claudesidian MCP (Nexus)]] for vault-native memory, or run claude-mem alongside an MCP bridge as independent systems.

## See Also

- [[QMD]] — alternative search approach (hybrid BM25 + vector)
- [[sync-claude-sessions]] — session export to markdown
- [[Obsidian-Claude Connectivity]] — central integration reference

#claude-code #memory #persistence #essential

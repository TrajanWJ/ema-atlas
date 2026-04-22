---
type: research
wiki_id: research/AI-Knowledge/Obsidian_Integration/Obsidian_CLI
imported_from: vault/Research/AI-Knowledge/Obsidian Integration/Obsidian CLI.md
imported_at: '2026-04-04T00:23:56.977Z'
tags: []
summary: ''
---
# Obsidian CLI

> Native command-line interface for Obsidian (v1.12+) — 100+ commands, 54x faster than grep, 70,000x cheaper in tokens.

## Quick Info

| Field | Value |
|---|---|
| **Requires** | Obsidian Desktop v1.12.4+ (Feb 27, 2026) |
| **Cost** | Free (no Catalyst license needed) |
| **Constraint** | Obsidian must be running (IPC-based) |
| **Docs** | [help.obsidian.md/cli](https://help.obsidian.md/cli) |

## Why It Matters

The CLI taps into Obsidian's pre-built search index instead of scanning files from scratch:

| Benchmark (4,663 files) | grep | CLI | Speedup |
|---|---|---|---|
| Orphan detection | 15.6s | 0.26s | **54x** |
| Vault search | 1.95s | 0.32s | **6x** |
| Token cost (orphans) | ~7M tokens | ~100 tokens | **70,000x** |

## Command Categories

| Category | Key Commands |
|---|---|
| **Files** | `files`, `folders`, `read`, `create`, `append`, `prepend`, `move`, `delete` |
| **Search** | `search query="..."`, `search:open query="..."` (full-text, tag, property filters) |
| **Daily Notes** | `daily`, `daily:read`, `daily:append`, `daily:prepend`, `daily:open`, `daily:path` |
| **Properties** | `properties file=`, `properties:set file=`, `properties:remove file=` |
| **Tags & Links** | `tags`, `tags sort=count`, `tag tagname=`, `tags:rename old= new=`, `links`, `backlinks`, `unresolved`, `orphans` |
| **Tasks** | `tasks`, `task:create`, `task:complete` |
| **Plugins & Themes** | `plugins`, `plugin:enable id=`, `plugin:disable id=`, `plugin:reload id=`, `themes`, `theme:set name=`, `snippets`, `snippet:enable name=` |
| **Sync/Publish** | `sync:status`, `sync:history file=`, `sync:restore file=`, `publish:list`, `publish:add file=`, `publish:remove file=` |
| **History** | `history file=`, `history:read file=`, `history:restore file=` |
| **Developer** | `eval code="..."`, `dev:screenshot path=`, `dev:console`, `dev:errors`, `dev:css selector=`, `dev:dom selector=` |

**Output formats:** `json`, `csv`, `md`, `paths`, `yaml`, `tree`, `tsv`

**Syntax:** `obsidian command param=value` (no dashes). Boolean flags: `--silent`, `--overwrite`.

Source: [Frank Anaya's complete guide](https://frankanaya.com/obsidian-cli/), [Obsidian 1.12.4 changelog](https://obsidian.md/changelog/2026-02-27-desktop-v1.12.4/)

## Setup

1. Obsidian > Settings > General > Command line interface > Register CLI > toggle on
2. Add to PATH:
   - **Linux:** `sudo ln -s /opt/obsidian/obsidian /usr/local/bin/obsidian`
   - **macOS:** add `/Applications/Obsidian.app/Contents/MacOS` to `~/.zshrc`
3. Open new terminal (old sessions cache old PATH)

## Claude Code Integration

Three paths:

1. **kepano/obsidian-skills** — includes `obsidian-cli` skill teaching Claude the CLI syntax
2. **pablo-mano/Obsidian-CLI-skill** — standalone skill file for any agent
3. **Direct Bash** — Claude runs `obsidian` commands via Bash tool

## TUI Mode

Running `obsidian` with no arguments launches an interactive terminal UI for browsing and managing the vault.

## Coverage

| Access Method | Vault Knowledge Coverage |
|---|---|
| Filesystem (grep/cat) | ~40% |
| REST API plugin | ~55% |
| **Obsidian CLI** | **~85%** |
| Only missing: visual elements (canvas rendering, graph animation) | |

## See Also

- [[obsidian-skills (kepano)]] — includes CLI skill
- [[obsidian-claude-code-mcp]] — MCP alternative
- [[Obsidian-Claude Connectivity]] — central integration reference

#obsidian #cli #performance #essential

---
title: "System Obsidian"
type: reference
created: 2026-03-15
updated: 2026-04-16
confidence: verified
source: direct system inspection
tags: [system, obsidian, plugins, mcp, vault, skills]
summary: "Obsidian app configuration — version, installed plugins, MCP bridge, kepano skills, and vault integration details."
---

# System Obsidian

> Obsidian app configuration — installed plugins, MCP bridge, skills.
> Last verified: 2026-04-16

---

## Overview

Obsidian is the knowledge management application at the center of Trajan's personal infrastructure. It serves as the primary interface for browsing, editing, and organizing the vault — a ~3,000-file markdown knowledge base stored at `~/vault/`. Obsidian was chosen for its local-first architecture (all data stays on disk as plain markdown), extensible plugin system, and strong community ecosystem. The vault doubles as the persistence layer for [[System Claude Code]] — Claude Code reads and writes vault files directly, while the MCP bridge plugin enables real-time integration when Obsidian is running.

The current setup is deliberately minimal: only two community plugins are installed (Claudian and claude-code-mcp), both focused on Claude Code integration. Core Obsidian features (backlinks, graph view, search, templates) handle everything else. This keeps the configuration simple and reduces plugin conflicts.

See also: [[System Vault Structure]], [[System Machine]], [[System Claude Code]]

---

## Vault

| Field | Value |
|---|---|
| **Location** | `~/vault/` |
| **Vault name** | vault |
| **Obsidian version** | 1.12.4 (AppImage at `~/Downloads/Obsidian-1.12.4.AppImage`) |
| **Vault size** | ~243 MB (3,000+ markdown files) |
| **Config dir** | `~/vault/.obsidian/` |

Obsidian is installed as an AppImage rather than via a package manager, which allows manual version control and avoids auto-update surprises. The `.obsidian/` directory contains all configuration: `app.json` (core settings), `appearance.json` (theme), `community-plugins.json` (enabled plugin list), and the `plugins/` subdirectory with plugin code and data.

---

## Installed Obsidian Plugins

Located in `.obsidian/plugins/` — enabled via `.obsidian/community-plugins.json`:

| Plugin | Version | What It Does |
|---|---|---|
| **Claudian** | v1.3.68 | Claude Code embedded in Obsidian sidebar. Full agentic capabilities — can read, write, and search vault files directly within the Obsidian UI. |
| **claude-code-mcp** | v1.1.8 | MCP bridge exposing vault to Claude Code CLI on port 22360. Provides tools for viewing, creating, editing, and inserting vault content over WebSocket. |

Both plugins are enabled in `community-plugins.json`. No other community plugins are installed — the vault relies on Obsidian core features plus these two integrations. This is intentional: fewer plugins means fewer breaking changes on Obsidian updates and less configuration to maintain.

### Plugin Architecture

The two plugins serve complementary roles:

- **Claudian** embeds Claude Code inside Obsidian's UI as a sidebar panel. It is useful when Trajan is working in Obsidian and wants to invoke Claude without switching to a terminal. Claudian has full agentic capabilities — it can read files, run tools, and modify vault content.

- **claude-code-mcp** goes the other direction: it exposes Obsidian's vault to external Claude Code CLI sessions. When Claude Code runs in a terminal (outside Obsidian), it can discover and connect to the MCP bridge to access vault files with Obsidian-aware operations (respecting open files, workspace state, etc.).

Together, they ensure Claude Code can interact with the vault regardless of whether the user initiated the session from inside Obsidian or from the terminal.

---

## kepano Skills

Located in `.claude/skills/` at vault root (5 skill packs):

| Skill | Purpose |
|---|---|
| **obsidian-markdown** | Teaches Claude Obsidian-flavored markdown (wikilinks, callouts, embeds, properties) |
| **obsidian-bases** | Database-like views with functions reference |
| **json-canvas** | Obsidian canvas format with examples |
| **obsidian-cli** | 130+ CLI commands for vault operations |
| **defuddle** | Content extraction from web pages |

Source: [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills)

These skills are loaded automatically when Claude Code operates with the vault as its working directory. They teach Claude how to write proper Obsidian-flavored markdown — including `[[wikilinks]]`, callouts (`> [!note]`), embeds (`![[file]]`), and YAML frontmatter properties. Without these skills, Claude tends to produce generic markdown that doesn't leverage Obsidian-specific features.

The skills are maintained by Steph Ango (kepano), the CEO of Obsidian, and are updated alongside Obsidian releases to stay current with new syntax and features.

---

## MCP Bridge Details

The `claude-code-mcp` plugin exposes the vault over WebSocket:

| Field | Value |
|---|---|
| **Port** | 22360 |
| **Protocol** | WebSocket + SSE |
| **Auto-discovery** | Yes — Claude Code finds it automatically |
| **Tools** | `view`, `create`, `edit`, `insert`, `get_workspace_files`, diagnostics |

Claude Code can use this when Obsidian is running, or fall back to direct filesystem access when it's not. The MCP bridge is preferred when available because it respects Obsidian's workspace state and can trigger UI updates (e.g., refreshing the file explorer after a new note is created).

**Check if bridge is active:**
```bash
ss -tlnp | grep 22360
```

**Fallback behavior:** When the bridge is not available (Obsidian closed), Claude Code reads and writes vault files directly via the filesystem. This works for all operations but won't trigger Obsidian UI updates until the app is reopened and re-indexes.

---

## Core Obsidian Features in Use

While only two community plugins are installed, several core Obsidian features are actively used:

- **Backlinks panel** — surfaces incoming `[[wikilinks]]` to each note, critical for navigating the vault's interconnected structure
- **Graph view** — visual exploration of note connections, useful for finding orphan notes and clusters
- **Quick switcher** (Ctrl+O) — fast note navigation by title
- **Search** — full-text search across all vault files
- **Templates** — used for daily notes and project creation (stored in `Templates/`)
- **Properties/frontmatter** — YAML frontmatter is used extensively for metadata (title, type, tags, confidence, source, summary)

---

## Not Yet Fully Verified

See [[Installation Playbook]] for remaining items:
- [ ] Obsidian CLI runtime verification — binary appears present/registered, but headless agent-shell verification is incomplete due to Linux sandboxing
- [ ] obsidian-claude-pkm — goal cascading via BRAT
- [ ] Additional community plugins (Tasks, Dataview, Templater)

---

## Maintenance Notes

- **Obsidian updates**: Manual — download new AppImage from obsidian.md, replace the file in `~/Downloads/`, and restart
- **Plugin updates**: Manual via Obsidian's settings → Community Plugins → Check for Updates
- **Vault backups**: Handled by system-level backup infrastructure (see [[Cron Jobs Ecosystem]])
- **Config reset**: If `.obsidian/` gets corrupted, delete it and re-enable plugins from scratch. All vault content is plain markdown and survives config resets.

#system #obsidian #plugins

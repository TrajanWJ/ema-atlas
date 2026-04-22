# System Obsidian

> Obsidian app configuration — installed plugins, MCP bridge, skills.
> Last verified: 2026-04-01

---

## Vault

| Field | Value |
|---|---|
| **Location** | `~/vault/` |
| **Vault name** | vault |
| **Obsidian version** | 1.12.4 (AppImage at `~/Downloads/Obsidian-1.12.4.AppImage`) |
| **Vault size** | 243 MB (2917+ markdown files) |

## Installed Obsidian Plugins

Located in `.obsidian/plugins/` — enabled via `.obsidian/community-plugins.json`:

| Plugin | Version | What It Does |
|---|---|---|
| **Claudian** | v1.3.68 | Claude Code embedded in Obsidian sidebar. Full agentic capabilities. |
| **claude-code-mcp** | v1.1.8 | MCP bridge exposing vault to Claude Code CLI on port 22360 |

Both plugins are enabled in community-plugins.json. No other community plugins are installed — the vault relies on Obsidian core features plus these two integrations.

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

These skills are loaded automatically when Claude Code operates with the vault as its working directory. They teach Claude how to write proper Obsidian-flavored markdown.

## MCP Bridge Details

The `claude-code-mcp` plugin exposes the vault over WebSocket:

| Field | Value |
|---|---|
| **Port** | 22360 |
| **Protocol** | WebSocket + SSE |
| **Auto-discovery** | Yes — Claude Code finds it automatically |
| **Tools** | `view`, `create`, `edit`, `insert`, `get_workspace_files`, diagnostics |

Claude Code can use this when Obsidian is running, or fall back to direct filesystem access when it's not.

**Check if bridge is active:**
```bash
ss -tlnp | grep 22360
```

## Not Yet Fully Verified

See [[Installation Playbook]] for remaining items:
- [ ] Obsidian CLI runtime verification — binary appears present/registered, but headless agent-shell verification is incomplete due to Linux sandboxing
- [ ] obsidian-claude-pkm — goal cascading via BRAT
- [ ] Additional community plugins (Tasks, Dataview, Templater)

#system #obsidian #plugins

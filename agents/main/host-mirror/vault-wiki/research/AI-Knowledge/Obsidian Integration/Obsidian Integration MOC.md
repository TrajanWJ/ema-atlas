---
type: research
wiki_id: research/AI-Knowledge/Obsidian_Integration/Obsidian_Integration_MOC
imported_from: vault/Research/AI-Knowledge/Obsidian Integration/Obsidian Integration MOC.md
imported_at: '2026-04-04T00:23:56.977Z'
tags: []
summary: ''
---
# Obsidian Integration

> Bridging Obsidian and Claude Code.

---

## Connection Diagram

```
+------------------+          +-------------------+
|   Obsidian App   |          |   Claude Code     |
|                  |          |   (Terminal)       |
|  +-----------+   |   MCP    |                   |
|  | obsidian-  |---|---------|-> Read/write vault |
|  | claude-    |   | :22360  |   files via MCP    |
|  | code-mcp   |   |         |                   |
|  +-----------+   |          |   +-----------+   |
|                  |          |   | Superpowers|   |
|  +-----------+   |          |   | Context7   |   |
|  | Claudian   |--|-- runs --|-> | CodeGraph  |   |
|  | (sidebar)  |   | Claude  |   +-----------+   |
|  +-----------+   |  in-app  |                   |
|                  |          +-------------------+
|  +-----------+   |                   |
|  | obsidian-  |   |                   |
|  | skills     |---|--- SKILL.md ----->|
|  | (kepano)   |   |   format rules    |
|  +-----------+   |                   |
|                  |          +-------------------+
|  +-----------+   |          |   QMD + claude-mem|
|  | obsidian-  |   |          |   (Background)    |
|  | claude-pkm |---|-- vault--|-> Index & search  |
|  | (goals)    |   |  files   |   vault content   |
|  +-----------+   |          +-------------------+
|                  |
|  +-----------+   |          +-------------------+
|  | Obsidian   |   |          |   Shell scripts   |
|  | CLI v1.12+ |---|-- pipe---|-> Batch operations |
|  | (built-in) |   |  cmds    |   on vault files  |
|  +-----------+   |          +-------------------+
+------------------+
```

## How They Connect

| From | To | Via | Purpose |
|------|-----|-----|---------|
| [[obsidian-claude-code-mcp]] | Claude Code | MCP (port 22360) | Vault read/write from terminal |
| [[Claudian]] | Claude Code | Embedded process | Claude in Obsidian sidebar |
| [[obsidian-skills (kepano)]] | Claude Code | SKILL.md files | Teaches Claude Obsidian format rules |
| [[obsidian-claude-pkm]] | Vault files | Direct file access | Goal cascading (daily/weekly/monthly) |
| [[Obsidian CLI]] | Shell/scripts | CLI commands | 130+ commands, 54x faster than grep |
| [[QMD]] | Vault files | File indexing | Hybrid search over vault content |
| [[sync-claude-sessions]] | Session exports | File output | Session transcripts into vault |

## Core Plugins

| Plugin | What It Does | Install |
|---|---|---|
| [[Claudian]] | Claude Code in Obsidian sidebar | BRAT: `YishenTu/claudian` |
| [[obsidian-claude-code-mcp]] | MCP bridge — vault exposed to Claude Code | Community Plugins |
| [[obsidian-skills (kepano)]] | Teaches Claude proper Obsidian formats | Skills directory |
| [[obsidian-claude-pkm]] | Goal cascading (daily/weekly/monthly) | Git clone |
| [[Obsidian CLI]] | Native CLI, 130+ commands, 54x faster than grep | Built-in v1.12+ |

## The Pattern

1. **Obsidian Vault** — plain markdown files you own
2. **Claude Code** — reads, creates, manipulates those files via MCP
3. **End of session** — create SOPs/skills from what you accomplished

## Data Flow Summary

```
Session in Terminal
    → Claude Code reads vault via MCP (:22360)
    → Claude Code writes session logs to vault
    → sync-claude-sessions exports full transcript
    → QMD re-indexes vault (BM25 + vectors)
    → Next session: /recall pulls relevant context
```

#obsidian #mcp #plugins

---
title: Serena MCP
created: '2026-03-14'
updated: '2026-03-16'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: research
tags:
  - code
  - github
  - mcp
  - openclaw
  - research
  - skills
summary: >-
  Serena is a **semantic code retrieval and editing toolkit** that turns any LLM
  into a fully-featured coding agent. Unlike grep-and-replace approaches,
wiki_id: research/Serena_MCP
imported_from: vault/Research/Serena MCP.md
imported_at: '2026-04-04T00:23:57.111Z'
---
# 🔥 Serena MCP — VERY COOL

**Status:** ⭐ VERY COOL — Must-have for coding workflows
**Repo:** https://github.com/oraios/serena (21.5k+ stars)
**Category:** Coding Agent Toolkit / MCP Server
**Installed:** 2026-03-14

## What It Is

Serena is a **semantic code retrieval and editing toolkit** that turns any LLM into a fully-featured coding agent. Unlike grep-and-replace approaches, it provides **IDE-like capabilities** at the symbol level — finding symbols, references, and making precise edits using code structure rather than text patterns.

## Why It's VERY COOL

- **Symbol-level navigation** — `find_symbol`, `find_referencing_symbols`, `insert_after_symbol` instead of reading entire files
- **30+ language support** via LSP (Language Server Protocol) — Python, TypeScript, Rust, Go, Java, C++, etc.
- **Massive token savings** — agent doesn't need to read entire files to find what it needs
- **Quality improvement** — precise edits mean fewer broken changes in large codebases
- **Works with everything** — Claude Code, Codex, Gemini CLI, Cursor, VSCode, Claude Desktop, OpenWebUI
- **Free & open-source** — no license costs, just uses LSPs you already have
- **JetBrains plugin** available for even deeper IDE integration
- **Microsoft/GitHub sponsored** — VSCode team officially sponsors the project

## Integration Points

### Claude Code (Installed ✅)
Added to `~/.claude/mcp.json` with `--project-from-cwd` flag for auto-detection.

### OpenClaw Potential
Could be added as an MCP server for [[OpenClaw]]'s coding workflows via the `openclaw-mcp-plugin` skill. Would give Right Hand IDE-like code understanding when delegating to Claude Code or working on codebases directly.

## Key Tools Provided

| Tool | Purpose |
|---|---|
| `find_symbol` | Find code symbols (functions, classes, variables) by name |
| `find_referencing_symbols` | Find all references to a symbol |
| `insert_after_symbol` | Insert code after a specific symbol |
| `replace_symbol_body` | Replace the body of a function/class |
| `get_symbol_details` | Get full details of a symbol |
| `list_directory_symbols` | List all symbols in a directory |

## Installation

```bash
# Via uvx (recommended)
uvx --from git+https://github.com/oraios/serena serena start-mcp-server --project-from-cwd

# Claude Code MCP config
# Already in ~/.claude/mcp.json
```

## References

- [[OpenClaw Extensions]]
- [[My Stack Decisions]]

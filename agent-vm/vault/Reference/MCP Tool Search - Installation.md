---
title: MCP Tool Search
type: tool
status: active
confidence: 0.60
confidence_updated: 2026-03-18
date_installed: 2026-03-18
repo: https://github.com/KGT24k/mcp-tool-search
npm: mcp-tool-search
version: 1.3.0
tags: [mcp, tools, proxy, optimization, token-savings]
summary: "MCP proxy server that replaces all MCP tool schemas with 4 lightweight proxy tools:"
source: reference
updated: 2026-03-18
created: 2026-03-18
---

# MCP Tool Search

## What It Does

MCP proxy server that replaces all MCP tool schemas with 4 lightweight proxy tools:
- `search_tools` — fuzzy search across all backend tools
- `get_tool_schema` — get full schema for a specific tool
- `call_tool` — execute a tool through the proxy
- `list_servers` — list available servers + status

**Token savings:** 394 tool schemas → 4 proxy tools = ~97% context reduction.

## Installation

Installed globally via `sudo npm install -g mcp-tool-search`.

Binaries:
- `/usr/bin/mcp-tool-search` — proxy server
- `/usr/bin/mcp-build-catalog` — catalog builder

## Configuration

### Catalog Location
`/home/trajan/.claude/catalog.json` — snapshot of 11 servers, 394 tools.

Also at `/usr/lib/node_modules/mcp-tool-search/catalog.json` (default).

### MCP Config Entry (`~/.claude/mcp.json`)
```json
"mcp-tool-search": {
  "command": "npx",
  "args": ["-y", "mcp-tool-search"],
  "env": {
    "MCP_TOOL_SEARCH_CATALOG": "/home/trajan/.claude/catalog.json"
  },
  "disabled": false
}
```

### How to Use

For Claude Code sessions, you can either:
1. **Use alongside existing servers** — leave other servers enabled, add mcp-tool-search for discovery
2. **Replace other servers** — disable backend servers in `.mcp.json`, use only mcp-tool-search as the single entry point (maximum token savings)

Option 2 is the "game-changer" mode — the proxy lazily spawns backend servers only when needed.

## Catalog Rebuild

When MCP servers change, rebuild the catalog:
```bash
cd ~ && mcp-build-catalog
```

The catalog builder reads from `~/.mcp.json` (note: needs dot-prefixed file in CWD or home). A symlink exists: `~/.mcp.json → ~/.claude/mcp.json`.

### Cataloged Servers (as of 2026-03-18)
| Server | Tools |
|--------|-------|
| serena | 27 |
| [[Engram]] | 14 |
| lightpanda | 7 |
| chrome-devtools | 29 |
| [[MarkItDown]] | 1 |
| perplexity | 2 |
| nmap-mcp | 9 |
| krometrail | 29 |
| arkana | 212 |
| codebase-memory-mcp | 14 |
| sqlite-memory | 50 |
| **Total** | **394** |

### Failed Servers (not in catalog)
- CodeGraphContext — `cgc` binary not found
- qmd — binary path issue
- taskmaster-ai — connection timeout
- GitGuardianDeveloper — needs auth header
- gitnexus — connection closed
- iris-eval — module not found error

## Balanced Configuration (2026-03-18)

**Direct (always loaded, low overhead):**
| Server | Tools | Why Direct |
|--------|-------|------------|
| qmd | ~5 | Vault search — used constantly |
| [[Engram]] | 14 | Memory — core workflow |
| perplexity | 2 | Web search — tiny footprint |
| [[MarkItDown]] | 1 | File conversion — 1 tool |
| mcp-tool-search | 4 | The proxy itself |

**Proxied (available on-demand through search):**
| Server | Tools | Why Proxied |
|--------|-------|-------------|
| arkana | 212 | Huge footprint, occasional use |
| sqlite-memory | 50 | Large, overlaps with [[Engram]] |
| chrome-devtools | 29 | Browser automation, occasional |
| krometrail | 29 | Browser, occasional |
| serena | 27 | Code analysis, on-demand |
| codebase-memory-mcp | 14 | Code memory, on-demand |
| nmap-mcp | 9 | Security scans, rare |
| lightpanda | 7 | Headless browser, rare |

**Disabled (broken):** CodeGraphContext, taskmaster-ai, GitGuardianDeveloper, gitnexus, iris-eval

**Net result:** 5 direct servers (~25 tools, ~1,250 tokens) + proxy (377 tools on-demand) = ~18,850 tokens saved per session.

## How It Works

1. **Catalog Builder** pre-scans all MCP servers and snapshots tool definitions to `catalog.json`
2. **Proxy Server** exposes only 4 tools — model searches, inspects, and calls tools through proxy
3. **Lazy Connections** — backend servers spawned on first use, kept alive 5 min, max 20 concurrent

## Tradeoffs

- Extra LLM turn for tool discovery (search → schema → call vs direct call)
- First call to a server has connection startup overhead
- Best for 5+ servers / 20+ tools (we have 11/394 — ideal use case)

## Also Found: MCP Launchpad

Alternative approach by `kenneth-liao/mcp-launchpad` (Python, 203 stars):
- CLI-based tool discovery (`mcpl search`, `mcpl call`)
- Works via bash commands rather than MCP proxy
- Requires `uv` (Python package manager)
- Different philosophy: CLI tool vs MCP proxy

MCP Tool Search is the better fit for our use case (MCP-native, npm, proxy pattern).

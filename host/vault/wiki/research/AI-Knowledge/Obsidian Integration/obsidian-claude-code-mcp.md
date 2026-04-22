---
type: research
wiki_id: research/AI-Knowledge/Obsidian_Integration/obsidian-claude-code-mcp
imported_from: vault/Research/AI-Knowledge/Obsidian Integration/obsidian-claude-code-mcp.md
imported_at: '2026-04-04T00:23:56.977Z'
tags: []
summary: ''
---
# obsidian-claude-code-mcp

> MCP bridge that exposes your Obsidian vault to Claude Code.

## Quick Info

| Field | Value |
|---|---|
| **GitHub** | [iansinnott/obsidian-claude-code-mcp](https://github.com/iansinnott/obsidian-claude-code-mcp) |
| **Stars** | 175 |
| **License** | 0BSD |
| **Port** | 22360 (configurable) |
| **Transport** | WebSocket (Claude Code) + HTTP/SSE (Claude Desktop) |

## What It Does

Exposes your vault to any MCP-compatible agent. Claude Code can read, write, and search your entire vault from the terminal — without needing the vault as the working directory.

## Setup

1. Obsidian > Settings > Community Plugins > Browse > "Claude Code"
2. Install and enable
3. **That's it** — Claude Code auto-discovers via WebSocket on port 22360

Use `/ide` command in Claude Code to select vault.

### For Claude Desktop
```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:22360/sse"]
    }
  }
}
```

### Other MCP Clients
Direct HTTP/SSE: `"url": "http://localhost:22360/sse"`

### Multiple Vaults
Assign unique ports per vault in plugin settings.

## Tools Exposed

### Shared Tools (WebSocket + HTTP/SSE)

| Tool | Purpose |
|---|---|
| `view` | Read file contents |
| `str_replace` | Find-and-replace edits |
| `create` | Create new files/notes |
| `insert` | Insert content at position |
| `get_current_file` | Get focused note |
| `get_workspace_files` | List vault files |
| `obsidian_api` | Direct Obsidian API access |

### IDE-Specific (Claude Code WebSocket only)

| Tool | Purpose |
|---|---|
| `getDiagnostics` | System and vault diagnostics |
| `openDiff` | Diff view operations |
| `close_tab` | Tab management |
| `closeAllDiffTabs` | Bulk tab operations |

## Limitations

- **Not in community plugin directory** — manual install from GitHub releases or BRAT
- **Obsidian must be running** — MCP server only exists while plugin is active
- **No semantic search** — use [[Claudesidian MCP (Nexus)]] or [[QMD]] for that
- **Large vaults (4000+ notes)** — token size constraints degrade quality
- **Legacy transport** — intentionally uses older MCP spec (2024-11-05) because newer "Streamable HTTP" protocol lacks current client support
- **Troubleshooting** — port conflicts, firewall blocking, missing `.lock` files in Claude config directories can prevent connections

## Difference from Claudian

- **Claudian** = Claude Code **inside** Obsidian (sidebar chat)
- **obsidian-claude-code-mcp** = Obsidian exposed **to** Claude Code (running elsewhere)

Use both together for maximum integration.

Source: [README](https://github.com/iansinnott/obsidian-claude-code-mcp)

#obsidian #mcp #bridge #zero-config

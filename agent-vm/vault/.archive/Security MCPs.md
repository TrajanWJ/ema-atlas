# Security MCP Servers

## ShellGuard
**Status:** ❌ Not Found

### Search Results
- ClawHub: No results for "shellguard"
- npm: No results for "shellguard mcp"

This tool doesn't appear to exist in either registry. May be a concept/proposal or private project.

---

## Nmap MCP
**Status:** ✅ Installed via npm
**Package:** `@ebowwa/mcp-nmap` v1.0.2
**Install:** `sudo npm install -g @ebowwa/mcp-nmap`

### What It Does
MCP server that wraps Nmap network scanner, providing 18 security tools for network scanning and reconnaissance via the Model Context Protocol.

### Features
- Network scanning and host discovery
- Vulnerability scanning
- Port enumeration
- Reconnaissance automation
- All accessible via MCP protocol from Claude Code or other MCP clients

### Configuration
To use with Claude Code, add to `~/.claude/mcp.json`:
```json
{
  "mcpServers": {
    "nmap-mcp": {
      "command": "npx",
      "args": ["@ebowwa/mcp-nmap"]
    }
  }
}
```

**Note:** Requires `nmap` to be installed on the system (`sudo apt install nmap`).

### Evaluation
**Usefulness: 7/10** — Having Nmap accessible via MCP is genuinely useful for security audits from within Claude Code. The 18-tool interface covers the major scan types.

**Maturity: 5/10** — Small community package (single maintainer @ebowwa). Last published 2026-02-24. Should work but may have rough edges.

**Relevance:** Good fit for the Security agent. Could be configured as an MCP server for security-focused sessions.

---

## Alternative Found: arc-security-mcp
ClawHub search surfaced `arc-security-mcp` — may be worth investigating as a broader security MCP server.

---
*Evaluated: 2026-03-16*

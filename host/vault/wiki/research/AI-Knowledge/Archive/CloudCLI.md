---
type: research
wiki_id: research/AI-Knowledge/Archive/CloudCLI
imported_from: vault/Research/AI-Knowledge/Archive/CloudCLI.md
imported_at: '2026-04-04T00:23:56.972Z'
tags: []
summary: ''
---
# CloudCLI (Claude Code UI)

> My current web UI for Claude Code. Self-hosted, running 24/7.

## Quick Info

| Field | Value |
|---|---|
| **GitHub** | [siteboon/claudecodeui](https://github.com/siteboon/claudecodeui) |
| **Stars** | 8,270+ |
| **Version** | v1.25.2 (Mar 2026) |
| **License** | GPL v3 |
| **Port** | 3001 |
| **Requires** | Node.js v22+ |

## My Setup

- **Location:** `/home/trajan/claudecodeui`
- **Service:** `systemctl --user status cloudcli`
- **Auto-update:** Every 6 hours via systemd timer
- **Access:** `http://localhost:3001` or `http://172.31.255.217:3001` from phone
- **Linger:** Enabled (survives logout)
- **Desktop shortcut:** CloudCLI app in KDE launcher

## Features

- Responsive web UI (desktop, tablet, mobile)
- Interactive chat interface
- Integrated shell terminal
- File explorer with syntax highlighting and live editing
- Git explorer (view changes, stage, commit, branch switch)
- Session auto-discovery and resumption from `~/.claude`
- Plugin system for custom tabs and integrations
- TaskMaster AI integration
- MCP server config via UI (synced with `~/.claude` config)
- Model compatibility: Claude, GPT, and Gemini families

## Install

```bash
# Quick start:
npx @siteboon/claude-code-ui

# Global install:
npm install -g @siteboon/claude-code-ui
cloudcli
```

Access via `http://localhost:3001`

## Pricing

- **Self-Hosted:** Free, open source (GPL v3)
- **CloudCLI Cloud:** Starts at $7/month (managed cloud environment)

## Gotchas

- **All Claude Code tools are disabled by default** — must manually enable through Settings gear icon to prevent harmful automatic operations
- **135 open issues** as of Mar 2026 — active development
- Requires your own AI subscription (Claude, Cursor, Codex, or Gemini)

Source: [README](https://github.com/siteboon/claudecodeui)

## Management Commands

```bash
systemctl --user status cloudcli          # Check status
systemctl --user restart cloudcli         # Restart
journalctl --user -u cloudcli -f          # View logs
~/claudecodeui/update-cloudcli.sh         # Manual update
cat ~/.cloudcli-update.log                # Update log
systemctl --user list-timers              # Timer status
```

## See Also

- [[builderz-labs Mission Control]] — potential upgrade/replacement
- [[CUI]] — alternative web UI

#my-setup #web-ui #self-hosted #current

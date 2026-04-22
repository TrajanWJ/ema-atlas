---
title: Installed External Tools
created: '2026-03-14'
updated: '2026-03-18'
type: knowledge
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: external-research
tags:
  - external
  - installed
  - tools
summary: 'External tools, plugins, and projects installed on the agent VM'
wiki_id: reference/tools/Installed_External_Tools
imported_from: vault/Reference/tools/Installed External Tools.md
imported_at: '2026-04-04T00:23:56.966Z'
---
# Installed External Tools

> External tools, plugins, and projects installed on the agent VM beyond ClawHub skills.

## Installed

### ClawMetry — Agent Observability Dashboard
- **Location:** `~/.local/bin/clawmetry`
- **Run:** `clawmetry` (port 8900)
- **What:** Zero-config dashboard with live flow viz, token tracking, session monitoring
- **Source:** https://github.com/vivekchand/clawmetry

### ClawVault — Structured Markdown Memory
- **Location:** global npm (`clawvault`)
- **What:** Local-first memory system, 8 memory types, BM25+vector search, Obsidian-compatible
- **Source:** https://github.com/Versatly/clawvault

### OpenClaw Foundry — Self-Writing Meta-Extension
- **Location:** `/home/trajan/openclaw-foundry/`
- **What:** Observes workflows, auto-crystallizes patterns into tools after 5+ repetitions
- **Source:** https://github.com/lekt9/openclaw-foundry

### OpenClaw MCP Server — Gateway-to-MCP Bridge
- **Location:** `/home/trajan/openclaw-mcp-server/`
- **What:** Expose [[OpenClaw]] tools as MCP server for Claude Code/Cursor
- **Source:** https://github.com/Helms-AI/openclaw-mcp-server

### MemOS Cloud Plugin
- **Location:** `~/.openclaw/extensions/memos-cloud-openclaw-plugin/`
- **What:** Long-term memory with token savings, multi-agent shared memory pool
- **Requires:** `MEMOS_API_KEY` environment variable
- **Source:** https://github.com/MemTensor/MemOS-Cloud-OpenClaw-Plugin

### Composio Plugin — 500+ App Integrations
- **Location:** `~/.openclaw/extensions/composio/`
- **What:** Gmail, Slack, GitHub, Notion, Google Workspace, Linear, Jira via MCP
- **Requires:** `COMPOSIO_CONSUMER_KEY` from dashboard.composio.dev
- **Source:** https://composio.dev/toolkits/composio/framework/openclaw

## System Dependencies Installed
- `tesseract-ocr` — OCR engine for [[tesseract-ocr]] skill
- `imagemagick` — Image manipulation for imagemagick skill
- `ffmpeg` — Audio/video processing (already installed)
- `yt-dlp` — Video/transcript downloading (check: `which yt-dlp`)

## Not Yet Configured (Need API Keys)
- MemOS Cloud — needs `MEMOS_API_KEY`
- Composio — needs `COMPOSIO_CONSUMER_KEY`

#tools #installed #external

## Related

- [[ClawHub Skill Audit]]
- [[security-audit-2026-03-16]]
- [[README]]

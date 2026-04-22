---
title: BrowserWing
created: '2026-03-14'
updated: '2026-03-14'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: external-research
tags:
  - claude
  - code
  - github
  - mcp
  - research
  - skills
summary: >-
  Native browser automation platform that turns browser actions into MCP
  commands or Claude Skills. Pre-scripts browser automations so agents call
  inten
wiki_id: research/Tools/BrowserWing
imported_from: vault/Research/Tools/BrowserWing.md
imported_at: '2026-04-04T00:23:57.126Z'
---
# BrowserWing

**Source:** https://github.com/browserwing/browserwing
**Category:** Browser Automation Platform with AI Integration
**Date:** 2026-03-14
**Status:** Evaluated

## What It Does

Native browser automation platform that turns browser actions into MCP commands or Claude Skills. Pre-scripts browser automations so agents call intent, not DOM — reducing token usage for repetitive browser tasks.

### Core Features
- **26+ HTTP API endpoints** for full browser control
- **Built-in AI Agent** for conversational browser automation
- **Visual Script Recording** — record browser actions, edit visually, replay
- **Export to MCP/Skills** — convert recorded scripts to MCP commands or SKILL.md files
- **LLM-powered data extraction** — supports OpenAI, Claude, DeepSeek
- **Session management** — robust cookie and storage handling

### Installation
```bash
npm install -g browserwing
browserwing --port 8080
```

### MCP Integration
```json
{
  "mcpServers": {
    "browserwing": {
      "type": "http",
      "url": "http://localhost:8080/api/v1/mcp/message"
    }
  }
}
```

### Stack
- Go 1.21+ backend
- React 18 + TypeScript + Vite frontend
- Requires Google Chrome or Chromium

## Relevance

**MEDIUM — Different philosophy from our browser tool but complementary.**

Current browser automation: our `browser` tool sends raw actions (click, type, navigate). BrowserWing pre-scripts sequences so the agent calls "login to GitHub" instead of individual DOM operations.

### Use Cases
- Repetitive browser workflows (checking dashboards, filling forms)
- Recording browser scripts for reuse as skills
- Reducing token usage for browser-heavy tasks (record once, replay via MCP)

### Comparison
| Feature | Our browser tool | BrowserWing |
|---|---|---|
| Approach | Raw actions | Pre-scripted intents |
| Token usage | High (every DOM action) | Low (call script name) |
| Flexibility | Maximum | Limited to recorded scripts |
| Recording | None | Visual recorder + editor |
| MCP support | No | Yes (native) |
| Skill export | No | Yes (generates SKILL.md) |

## Notes

- The "record → export as skill" workflow is the killer feature
- Could be useful alongside our existing browser tool, not as a replacement
- Go backend means small binary, fast startup
- Multi-language README (EN, CN, JA, ES, PT) suggests global ambition

## Related

- [[reddit-deep-dive-agent-ecosystem]]
- [[Lightpanda Installation]]
- [[overnight-summary-2026-03-14]]
- [[Overnight]]
- [[Summary]]
- [[2026-03-14]]
- [[Reddit]]
- [[Deep]]
- [[Dive]]
- [[-]]
- [[Agent]]
- [[Ecosystem]]

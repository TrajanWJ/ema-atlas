---
title: opentabs-browser-api
created: '2026-03-19'
updated: '2026-03-19'
type: research
status: active
source: unknown
tags: []
wiki_id: research/opentabs-browser-api
imported_from: vault/Research/opentabs-browser-api.md
imported_at: '2026-04-04T00:23:57.167Z'
summary: ''
---
# OpenTabs — Browser Session as MCP API

**URL**: https://github.com/opentabs-dev/opentabs  
**NPM**: `@opentabs-dev/cli`  
**Install**: `npm install -g @opentabs-dev/cli && opentabs start`  
**Tools**: ~2,000 across 100+ plugins  
**Requires**: Node.js 22+, Chrome

## Core Concept

Browsers are already logged into everything. Every web app's frontend calls internal APIs. OpenTabs intercepts those same APIs and exposes them as MCP tools — your AI calls the backend directly through your existing session.

**Not** a Playwright wrapper. **Not** screenshot/DOM scraping. Direct API calls using your session cookies.

## Architecture

```
AI Tool Call → MCP Server → Chrome Extension → Open Tab → Internal API → JSON Response
```

- MCP server: runs locally on your machine
- Chrome extension: bridges to open tabs, uses your existing auth session
- Plugins: each plugin reverse-engineers one app's internal API

## Plugin Coverage (100+ apps, ~2,000 tools)

Slack, Discord, GitHub, Jira, Notion, Figma, AWS, Stripe, Robinhood, DoorDash, Airbnb, and more.

Plus built-in browser tools (no plugin needed): screenshots, clicking, typing, network capture, DOM inspection — works on any tab.

## Security Model (Thoughtful Defaults)

- **Everything off by default** — not "confirm", actually disabled. Even bundled plugins.
- **AI-assisted code review** before enabling any plugin (checks for exfiltration, credential access, persistence)
- **Version-aware** — permissions reset on plugin update
- **Three permission levels**: Off | Ask (confirm each call) | Auto (run immediately)
- **Full audit log** — every tool call logged
- **Local only** — no cloud, no telemetry, everything in `~/.opentabs/`

## Self-Improving Plugin System

When AI builds a new plugin:
1. AI analyzes the page, discovers APIs, scaffolds code
2. Plugin registers and writes to `.claude/skills/build-plugin`
3. **Writes learnings back**: new auth patterns, API quirks, edge cases
4. Every plugin built makes the system better at building the next one

## Install

```bash
npm install -g @opentabs-dev/cli
opentabs start
# First run: creates ~/.opentabs/, generates auth secret, prints MCP config

# Load Chrome extension:
# chrome://extensions/ → Developer mode → Load unpacked → ~/.opentabs/extension

# Install a plugin:
opentabs plugin install discord
opentabs plugin install github
opentabs plugin install slack
```

## Wire to Claude Code

First run of `opentabs start` prints MCP config blocks to paste directly into Claude Code settings.

## Comparison to ApiTap

| | ApiTap | OpenTabs |
|---|---|---|
| **Auth** | Captures tokens during browse session | Uses your live Chrome session continuously |
| **Coverage** | Any site (discovery mode) | 100+ specific apps (plugin model) |
| **Maintenance** | Skill file cached; may break on API changes | Plugin model, community-maintained |
| **Plugin quality** | Auto-generated from CDPcapture | Curated + AI-reviewed |
| **Use case** | One-time data extraction | Ongoing authenticated operations |

**Best together**: Use ApiTap for read-only discovery/extraction, OpenTabs for ongoing authenticated interactions with specific platforms.

## Application to OpenClaw

### Immediate value:
- **GitHub plugin** → Researcher/Coder agents can read PRs, issues, code without auth headaches
- **Discord plugin** → Agents can interact with Discord directly through OpenTabs instead of the Bot API
- **Slack plugin** → If Trajan has Slack, agents get full access

### Self-improving skill integration:
The `.claude/skills/build-plugin` skill is exactly our pattern — agents teaching agents via accumulated learnings. This should be studied for our dispatch-reflect.sh learning system.

## Status
- Installing (`npm install -g @opentabs-dev/cli`)
- Requires Chrome extension load after install
- Medium priority: very powerful but requires Chrome session on same machine

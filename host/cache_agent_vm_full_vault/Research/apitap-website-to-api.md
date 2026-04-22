---
title: "apitap-website-to-api"
created: 2026-03-19
updated: 2026-03-19
type: research
status: active
source: unknown
tags: []
---
# ApiTap — Website-to-API MCP Server

**URL**: https://github.com/n1byn1kt/apitap  
**NPM**: `@apitap/core`  
**Install**: `npm install -g @apitap/core`  
**Claude Code wiring**: `claude mcp add -s user apitap -- apitap-mcp`  
**MCP tools**: 12  
**Requires**: Node.js 20+

## Core Concept

Turns any website into a callable API — no docs, no SDK, no browser per-call.

**The problem**: AI agents browsing the web via Playwright/browser automation costs 50–200K tokens/page (DOM rendering, HTML parsing). ApiTap **captures the internal API once**, generates a reusable "skill file", and from then on the agent calls the API directly via `fetch()` at 1–5K tokens. 20–100x token reduction.

**The flow**:
1. **Capture**: Launch browser via Playwright/CDP, visit site normally. ApiTap intercepts all network traffic.
2. **Filter**: Scoring engine removes analytics, tracking, framework internals. Only real API endpoints survive.
3. **Generate**: Endpoints grouped by domain, URLs parameterized (`/users/123 → /users/:id`), saved as `~/.apitap/skills/<domain>.json`
4. **Replay**: Agent reads skill file, calls API directly with `fetch()`. Zero browser needed.

## Key Commands

```bash
# Discover + browse in one shot
apitap browse https://techcrunch.com
# → WordPress detected, GET /wp-json/wp/v2/posts → 200

# Read content (no browser, uses built-in decoders)
apitap read https://en.wikipedia.org/wiki/Node.js
# → ~127 tokens vs ~4,900 raw HTML

# Attach to your already-running Chrome (captures auth sessions!)
apitap attach --port 9222

# List captured skills
apitap list

# Replay a captured endpoint
apitap replay gamma-api.polymarket.com get-events limit=5
```

## Built-in Decoders (No Browser)

| Site | Decoder | Tokens | vs Raw HTML |
|---|---|---|---|
| Reddit | reddit | ~627 | 93% smaller |
| YouTube | youtube | ~36 | 99% smaller |
| Wikipedia | wikipedia | ~127 | 97% smaller |
| Hacker News | hackernews | ~200 | 90% smaller |
| Twitter/X | twitter | ~80 | 95% smaller |
| Any site | generic | varies | ~74% avg |

Average 74% token savings across 83 tested domains.

## Endpoint Tiers

| Tier | Meaning | Replay |
|---|---|---|
| 🟢 Green | Public, permissive CORS | Works with `fetch()` |
| 🟡 Yellow | Needs auth, no anti-bot | Works with stored credentials |
| 🟠 Orange | CSRF tokens, session binding | Fragile |
| 🔴 Red | Request signing, Cloudflare | Needs full browser |

78% replay success rate across tested sites. Green tier: 100%.

## MCP Tools (12)

For Claude Code / any MCP client:
- `apitap_browse` — Full capture + skill generation
- `apitap_capture` — CDP capture session  
- `apitap_attach` — Attach to existing Chrome
- `apitap_replay` — Call captured endpoint
- `apitap_read` — Read URL content (no browser)
- `apitap_peek` — Triage URL (HEAD request, zero cost)
- `apitap_show` — List endpoints for a domain
- `apitap_list` — All captured skills
- `apitap_search` — Search across skill files
- `apitap_discover` — Detect site framework
- `apitap_filter` — Filter captured traffic
- `apitap_export` — Export skill as OpenAPI

## Application to OpenClaw

### Scout agent integration
Scout currently uses `web_fetch` (lightweight) and `browser` tool (heavy). ApiTap is the middle layer:
- `apitap_peek` before any fetch — zero cost triage
- `apitap_read` for content extraction — 74% token savings vs raw
- `apitap_browse` → `apitap_replay` for repeat data sources (Reddit, HN, etc.)

### Key sites to capture for the agent system
- **Reddit** (agent feeds): capture once → replay forever
- **HN** (tech intel): Algolia API already captured
- **GitHub** (research): capture for auth'd access to private data

### Install status
- `npm install -g @apitap/core` (installing)
- Wire MCP: `claude mcp add -s user apitap -- apitap-mcp`
- After install: run `apitap read https://reddit.com/r/LocalLLaMA` to test

## Why This Matters for Agent Economics

Every Scout session that reads 5 Reddit threads saves:
- Current: ~25,000 tokens (browser DOM)
- With ApiTap: ~3,000 tokens
- Savings: 22,000 tokens / session × $0.003/1K = **~$0.066/session**
- At 10 sessions/day: **~$0.66/day** → ~$240/year saved on web browsing alone

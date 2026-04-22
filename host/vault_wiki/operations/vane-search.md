---
title: Vane (formerly Perplexica) — Self-Hosted AI Search Engine
created: '2026-03-18'
updated: '2026-03-18'
type: playbook
status: active
source: unknown
wiki_id: operations/vane-search
imported_from: vault/Operations/vane-search.md
imported_at: '2026-04-04T00:23:56.861Z'
tags: []
summary: ''
---

# Vane (formerly Perplexica) — Self-Hosted AI Search Engine

**Source:** [ItzCrazyKns/Vane](https://github.com/ItzCrazyKns/Vane) (redirects from ItzCrazyKns/Perplexica)
**Docker:** `itzcrazykns1337/vane:latest`
**Local URL:** http://localhost:3001 (mapped from container 3000)
**Status:** Container deployed · March 2026

## What It Is

Privacy-focused AI answering engine. Uses SearxNG for web search + your choice of LLM (Ollama/OpenAI/Claude/Groq) to synthesize cited answers. Self-hosted Perplexity alternative.

## Features

- **Three search modes:** Speed / Balanced / Quality (deep research)
- **Source types:** Web, discussions, academic papers
- **Widgets:** Weather, calculations, stock prices
- **File uploads:** Ask questions about PDFs, text, images
- **Domain-specific search:** Limit to specific websites
- **Smart suggestions:** Intelligent query completion
- **Search history:** All searches saved locally
- **Discover mode:** Browse trending content

## Why Better Than Brave API

| Feature | Brave API | Vane |
|---------|-----------|------|
| Results type | Raw search results (titles + snippets) | Synthesized answers with cited sources |
| Search modes | One mode | Speed / Balanced / Quality |
| Sources | Web only | Web + academic + discussions |
| Processing | None (raw results) | LLM-synthesized answers |
| Cost | API key required, rate limited | Self-hosted, unlimited |
| Privacy | Brave sees queries | Everything local |
| File analysis | No | Yes (PDFs, images, text) |

## Deployment

```bash
# One-command Docker deployment (includes SearxNG)
docker run -d -p 3001:3000 -v vane-data:/home/vane/data --name vane itzcrazykns1337/vane:latest

# Slim version (if you already have SearxNG)
docker run -d -p 3001:3000 -e SEARXNG_API_URL=http://your-searxng:8080 -v vane-data:/home/vane/data --name vane itzcrazykns1337/vane:slim-latest
```

## Agent Integration

### HTTP API
Vane exposes a REST API that agents can call programmatically:
- Search endpoint with query + mode parameters
- Returns structured results with citations

### Wrapper Script
`~/bin/vane-search.sh` — wrapper for agent use:
```bash
#!/bin/bash
# Usage: vane-search.sh "query" [mode]
# Modes: speed, balanced, quality
```

### OpenClaw Integration Path
1. Configure Vane with Anthropic API key for answer synthesis
2. Create wrapper script agents can call via exec
3. Consider MCP bridge for direct tool access

## Configuration

Access http://localhost:3001 to configure:
- AI provider (OpenAI/Anthropic/Ollama/Groq)
- API keys
- Default search mode
- SearxNG settings

## Related
- [[Harbor LLM Stack]] — Alternative that includes SearxNG
- [[Tool Integration March 2026]] — Integration tracker

---
title: "Security and Research MCPs Installation"
created: 2026-03-16
updated: 2026-03-16
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: external-research
tags: [code, github, mcp, openclaw, research, security]
summary: "⚠️ **Requires a GitGuardian account** for most features. The scanning API needs authentication. Without a token:"
---
# Security and Research MCPs Installation

**Date:** 2026-03-16
**Status:** ✅ Installed & Configured

## GitGuardian MCP (ggmcp)

### What It Does
- Secret scanning (500+ detectors) — scan code for leaked credentials, API keys, tokens
- Incident management — view/remediate security incidents
- Honeytoken creation — detect unauthorized access
- Authentication/token management

### Installation
- **Method:** `uvx` (Python/uv package manager)
- **Source:** `git+https://github.com/GitGuardian/ggmcp.git`
- **Entry point:** `developer-mcp-server`

### Authentication
- **OAuth (default):** Opens browser for GitGuardian login, stores token in `~/.gitguardian/`
- **PAT:** Set `GITGUARDIAN_PERSONAL_ACCESS_TOKEN` env var
- **Current config:** OAuth disabled (`ENABLE_LOCAL_OAUTH=false`), needs PAT or re-enable OAuth for full use

### API Key Requirement
⚠️ **Requires a GitGuardian account** for most features. The scanning API needs authentication. Without a token:
- The server starts but API calls will fail
- To use: Create a free GitGuardian account → generate a Personal Access Token → add as env var

### Config Added
```json
"GitGuardianDeveloper": {
  "command": "/home/trajan/.local/bin/uvx",
  "args": ["--from", "git+https://github.com/GitGuardian/ggmcp.git", "developer-mcp-server"],
  "env": { "ENABLE_LOCAL_OAUTH": "false" },
  "disabled": false
}
```

### To Activate with API Key
Add to env in `~/.claude/mcp.json`:
```json
"GITGUARDIAN_PERSONAL_ACCESS_TOKEN": "your-pat-here"
```
Or set `ENABLE_LOCAL_OAUTH` to `"true"` to use browser-based OAuth flow.

---

## Perplexity Web API MCP

### What It Does
- `perplexity_search` — quick web search, returns links/snippets only
- `perplexity_ask` — comprehensive answers with source citations
- `perplexity_research` — deep research (requires session tokens)
- `perplexity_reason` — advanced reasoning (requires session tokens)

### Installation
- **Method:** `npx` (npm package)
- **Package:** `perplexity-web-api-mcp`
- **NOT Rust** — published as npm package despite the GitHub repo having Rust source (pre-compiled binaries distributed via npm)

### Authentication
- **Tokenless mode (current):** Works without any tokens — `perplexity_search` and `perplexity_ask` available with `turbo` model
- **Full mode:** Requires browser cookies from perplexity.ai:
  - `PERPLEXITY_SESSION_TOKEN` — from `__Secure-next-auth.session-token` cookie
  - `PERPLEXITY_CSRF_TOKEN` — from `next-auth.csrf-token` cookie

### Config Added
```json
"perplexity": {
  "command": "npx",
  "args": ["-y", "perplexity-web-api-mcp"],
  "disabled": false
}
```

### To Enable Full Features
Extract cookies from browser and add to env in `~/.claude/mcp.json`:
```json
"env": {
  "PERPLEXITY_SESSION_TOKEN": "your-session-token",
  "PERPLEXITY_CSRF_TOKEN": "your-csrf-token"
}
```

---

## Configuration File
Both servers added to `~/.claude/mcp.json` (Claude Code global MCP config).

## Test Results
- ✅ GitGuardian MCP server starts and runs on stdio transport
- ✅ Perplexity MCP server starts in tokenless mode (search + ask available)
- Both servers installed via their respective package managers (no manual build needed)

## Related

- [[Snyk Agent Scan]]
- [[OpenClaw Ecosystem]]
- [[github-intel-favorites]]

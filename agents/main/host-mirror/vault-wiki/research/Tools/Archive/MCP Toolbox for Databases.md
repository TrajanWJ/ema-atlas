---
title: MCP Toolbox for Databases
created: '2026-03-16'
updated: '2026-03-16'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: external-research
tags:
  - ai-tools
  - database
  - google
  - mcp
summary: >-
  Open-source MCP server by Google that connects AI agents directly to
  databases. Handles connection pooling, authentication, observability
  (OpenTelemet
wiki_id: research/Tools/Archive/MCP_Toolbox_for_Databases
imported_from: vault/Research/Tools/Archive/MCP Toolbox for Databases.md
imported_at: '2026-04-04T00:23:57.124Z'
---
# MCP Toolbox for Databases

**Source:** https://github.com/googleapis/genai-toolbox
**Category:** MCP Server / Database Tools
**Date:** 2026-03-14
**Status:** Discovered
**Stars:** ~13,400

## What It Does
Open-source MCP server by Google that connects AI agents directly to databases. Handles connection pooling, authentication, observability (OpenTelemetry), and tool management via a YAML config. Supports multiple database backends and frameworks (LangChain, LlamaIndex, native Python/JS SDKs).

Key features:
- Query databases in natural language from your IDE/agent
- Connection pooling and auth handled automatically
- Define tools as SQL queries in YAML, share across agents
- Dynamic config reloading without restart
- Built-in OpenTelemetry metrics and tracing
- Available as binary, systemd container, npm package, or Homebrew

## Relevance
Trajan already uses MCP servers with Claude Code (CodeGraphContext/FalkorDB, QMD, Task Master). This adds a general-purpose database MCP server that could connect Claude Code to any SQL/NoSQL database — useful for projects that need data access, schema exploration, or query generation.

## Pros
- Google-backed, actively maintained (v0.29.0, updated daily)
- 13.4k stars — strong community adoption
- Works as standard MCP server — drop-in for Claude Code's `mcp.json`
- Multiple install methods: binary, systemd, npm (`npx @toolbox-sdk/server`), Homebrew
- YAML-based tool definitions — easy to version control
- Built-in observability with OpenTelemetry

## Cons
- Still in beta (pre-v1.0) — breaking changes possible
- Primarily Google Cloud-oriented (though works with any DB)
- Adds another service to manage (runs as a separate server)

## Install
```bash
# Binary (Linux AMD64)
export VERSION=0.29.0
curl -L -o toolbox https://storage.googleapis.com/genai-toolbox/v$VERSION/linux/amd64/toolbox
chmod +x toolbox
sudo mv toolbox /usr/local/bin/

# Or via npm
npx @toolbox-sdk/server --tools-file tools.yaml

# Or Homebrew
brew install mcp-toolbox
```

## Related
- [[Khoj]] — another MCP-capable tool for vault and knowledge integration
- [[Agent-Architecture-Synthesis-2026-03]] — agent architecture covering MCP integration patterns
- [[Multi-Agent Coordination Patterns]] — patterns for agent-database coordination

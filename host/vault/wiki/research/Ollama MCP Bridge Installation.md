---
title: Ollama MCP Bridge Installation
created: '2026-03-16'
updated: '2026-03-16'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: research
tags:
  - code
  - github
  - mcp
  - ops
  - research
summary: >-
  API proxy that gives local Ollama LLMs access to MCP tools. Exposes an
  Ollama-compatible REST API but routes tool calls through configured MCP
  servers
wiki_id: research/Ollama_MCP_Bridge_Installation
imported_from: vault/Research/Ollama MCP Bridge Installation.md
imported_at: '2026-04-04T00:23:57.097Z'
---
# Ollama MCP Bridge Installation

**Date:** 2026-03-16
**Status:** ✅ Installed & Working

## What It Is
API proxy that gives local Ollama LLMs access to MCP tools. Exposes an Ollama-compatible REST API but routes tool calls through configured MCP servers.

## Installation
- **Ollama:** v0.18.0 at `/usr/local/bin/ollama` (systemd service, active)
- **Bridge:** v0.11.0 at `~/.local/bin/ollama-mcp-bridge` (installed via uv)
- **Config:** `~/.config/ollama-mcp-bridge/mcp-config.json`
- **Model:** qwen3:0.6b (522MB) — lightweight test model

## How to Run
```bash
# Start bridge (Ollama must be running)
ollama-mcp-bridge --config ~/.config/ollama-mcp-bridge/mcp-config.json --port 8000

# Direct Ollama chat
curl http://localhost:11434/api/chat -d '{"model":"qwen3:0.6b","messages":[{"role":"user","content":"hello"}],"stream":false}'

# Through bridge (same API, but with MCP tools)
curl http://localhost:8000/api/chat -d '{"model":"qwen3:0.6b","messages":[{"role":"user","content":"list files in /tmp"}],"stream":false}'
```

## MCP Config
Currently configured with filesystem MCP server (read-only, delete excluded).

## Notes
- Bridge acts as Ollama-compatible proxy — any Ollama client works with it
- Add more MCP servers to the config for expanded tool access
- qwen3:0.6b is tiny but functional for testing — pull larger models as needed
- No GPU on VM, so inference is CPU-only (slow for large models)

## Related

- [[github-intel-favorites]]
- [[briefing-2026-03-16]]

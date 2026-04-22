---
title: "Harbor — Self-Hosted LLM Stack Orchestrator"
created: 2026-03-18
updated: 2026-03-18
type: research
status: active
source: unknown
---

# Harbor — Self-Hosted LLM Stack Orchestrator

**Source:** [av/harbor](https://github.com/av/harbor) · MIT License
**Note:** Original reference was "oSealtic/harbor" — that repo doesn't exist. The correct repo is `av/harbor`.

## What It Is

CLI + companion app that spins up a complete local LLM stack with one command. Handles Docker Compose orchestration, configuration, and cross-service connectivity.

```bash
harbor up                      # Starts Open WebUI + Ollama
harbor up searxng speaches     # + web search + voice chat
```

## Key Services

- **Backends:** Ollama, llama.cpp, vLLM
- **Frontends:** Open WebUI
- **Search:** SearXNG (web search for RAG)
- **Voice:** Speaches (TTS/STT)
- **Image:** ComfyUI
- **Hundreds of pre-wired services**

## Relevance to Our System

Harbor could provide:
1. **Local LLM fallback** when API keys are rate-limited
2. **SearXNG instance** for agent web search (richer than Brave API)
3. **Voice interface** via Speaches
4. **Self-hosted alternative** to cloud APIs

## Installation

```bash
# Install Harbor CLI
npm install -g @avcodes/harbor
# OR
pip install llm-harbor

# Start services
harbor up
harbor up searxng  # Add web search
```

## Status

**Not installed.** Documented for potential deployment. Consider for:
- Local web search backend (SearXNG)
- Ollama + Open WebUI for local model experimentation
- Voice chat capabilities

## Related
- [[Vane Search]] — Another web search option
- [[Tool Integration March 2026]] — Integration status tracker

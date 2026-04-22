---
title: AstrBot
created: '2026-03-14'
updated: '2026-03-16'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: external-research
tags:
  - ai-agent
  - chatbot-platform
  - competitor-analysis
  - discord
  - mcp
  - multi-platform
  - open-source
  - telegram
summary: >-
  AstrBot is an open-source agentic chatbot platform that connects LLMs to
  instant messaging apps. It supports an impressive array of IM platforms (Disc
wiki_id: research/Tools/AstrBot
imported_from: vault/Research/Tools/AstrBot.md
imported_at: '2026-04-04T00:23:57.125Z'
---
# AstrBot

**Source:** https://github.com/AstrBotDevs/AstrBot
**Stars:** 24.1k
**Category:** AI Agent / IM Chatbot Platform
**Date:** 2026-03-14
**Status:** Discovered

## What It Does

AstrBot is an open-source agentic chatbot platform that connects LLMs to instant messaging apps. It supports an impressive array of IM platforms (Discord, Telegram, Slack, WeChat, DingTalk, Feishu, LINE, QQ, and more) and LLM providers (OpenAI, Anthropic, Gemini, DeepSeek, Ollama, etc.). The project includes MCP support, an agent sandbox for safe code execution, a plugin ecosystem with 1000+ community plugins, WebUI management, persona settings, knowledge base integration, and auto context compression.

It explicitly positions itself as an [[OpenClaw]] alternative, targeting the same multi-platform AI assistant space but with a Python-based architecture and a strong focus on the Chinese developer community (QQ, WeChat, Feishu integrations).

## Relevance to Stack

Direct competitor to [[OpenClaw]] — worth monitoring for feature parity and ideas. Key differentiators:
- **AstrBot advantages:** 1000+ plugins, broader Asian IM platform support (QQ, WeChat, DingTalk), built-in agent sandbox, desktop app, one-click cloud deploy
- **[[OpenClaw]] advantages:** Node.js ecosystem, Claude Code integration, ClawHub skill marketplace, deeper Claude/Anthropic integration, more mature coding agent delegation
- The agent sandbox feature is interesting — isolated execution of code and shell commands per session with resource reuse

Install is simple: `uv tool install astrbot` or systemd.

## Quick Start

```bash
uv tool install astrbot
astrbot init    # first time only
astrbot
```

Or via systemd — see official docs at https://astrbot.app

## Tags

#ai-agent #chatbot-platform #discord #telegram #multi-platform #mcp #open-source #competitor-analysis

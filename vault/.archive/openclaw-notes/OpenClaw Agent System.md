---
title: "OpenClaw Agent System"
created: 2026-04-01
type: codebase
status: active
stack: [openclaw, bash, python, node.js, sqlite, discord.js]
host: agent-vm
path: ~/.openclaw/
category: agent-infra
tags: [codebase, agents, orchestration, discord, telegram, vm-system]
summary: "Core agent infrastructure on agent-vm. OpenClaw gateway + 28 agents + dispatch system + intelligence layer + vault + cron automation."
related: [Claude Code Bot, Intelligence Layer, Dispatch System, MCP Server, EMA]
---

# OpenClaw Agent System

The agent infrastructure running on agent-vm. OpenClaw gateway managing 28 configured agents, Discord/Telegram channels, dispatch pipeline, vault knowledge system, and automated cron jobs.

## Architecture

| Component | Description |
|---|---|
| OpenClaw Gateway | systemd service, port 18789 |
| Agent: Right Hand | Primary agent, all user interaction |
| Specialists | Researcher, Coder, Ops, Security, Vault Keeper, Scout, Prompt Engineer, Concierge, Devil's Advocate, Strategist |
| Dispatch | Task routing, peer-review pipeline, inter-agent mailbox |
| Vault | 2400+ markdown files, QMD semantic search, ontology sync |
| Channels | Discord (full access), Telegram |

## Key Paths

- `~/.openclaw/` — Config, sessions, state
- `~/.openclaw/agents/main/workspace/` — Right Hand workspace
- `~/vault/` — Knowledge vault (now wiki)
- `~/bin/` — Custom scripts (40+)
- `~/dispatch/` — Task queue, results, inter-agent comms
- `~/skills/` — 48+ installed ClawHub skills

## Services (systemd)

- `openclaw-gateway.service` — Main gateway
- `oauth-guardian.service` — Token refresh + sync
- `bridge-sync.timer` — Host↔VM file sync every 60s
- `mcp-server.service` — MCP endpoint for external tools
- `claude-code-bot.service` — Standalone Discord bot

## Related

- [[Claude Code Bot]] — Standalone code execution bot
- [[Intelligence Layer]] — Pre-spawn enrichment pipeline
- [[Dispatch System]] — Task routing
- [[MCP Server]] — External tool endpoint

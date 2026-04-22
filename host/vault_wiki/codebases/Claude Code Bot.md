---
title: Claude Code Bot
created: '2026-04-01'
type: codebase
status: shipped
stack:
  - node.js
  - discord-api
host: agent-vm
path: ~/claude-code-bot/
category: dev-tools
tags:
  - codebase
  - discord-bot
  - claude-code
  - code-execution
summary: >-
  Standalone Discord bot (claudecode_seedofarsonVM) for code execution tasks.
  Bot ID: 1482938994022158430. Accepts dispatches from Right Hand.
related:
  - ClaudeForge
  - OpenClaw Agent System
wiki_id: codebases/Claude_Code_Bot
imported_from: vault/Codebases/Claude Code Bot.md
imported_at: '2026-04-04T00:23:56.821Z'
---

# Claude Code Bot

Standalone Discord bot for code execution. Runs on agent-vm as a systemd service.

## Identity

- **Bot name:** claudecode_seedofarsonVM
- **Bot ID:** 1482938994022158430
- **Service:** `claude-code-bot.service`

## How It Works

1. Right Hand dispatches coding tasks via Discord
2. Bot picks up the task, spawns Claude Code process
3. Returns results to the requesting channel/thread

## Status

✅ Shipped and operational

## Related

- [[ClaudeForge]] — Full remote IDE (more featured)
- [[OpenClaw Agent System]] — Agent orchestration layer

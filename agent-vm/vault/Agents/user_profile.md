---
name: user-profile
description: Trajan's role, tools, and working style — power user running self-hosted AI agent stack on dedicated VM
type: user
status: active
summary: "Agent context file for user_profile"
tags: [agent-context]
confidence: 0.80
confidence_updated: 2026-04-17
source: manual
updated: 2026-04-17
created: 2026-03-14
title: "user_profile"
---

- Power user running a self-hosted AI agent stack on a dedicated KVM VM (agent-vm, 192.168.122.10)
- Uses Obsidian vault at `/home/trajan/vault/` as knowledge base / single source of truth
- Runs [[OpenClaw]] natively (systemd service) with Discord + Telegram channels
- Claude Code at `/usr/bin/claude` with Claude Max subscription (OAuth tokens, auto-refreshed)
- Agent identity: Right Hand — direct, competent, no-nonsense
- Claude Code stack: 46 skills, 15 agents, 9 commands, 15+ MCP servers
- Plugins: Superpowers, Context7, claude-hud
- Hooks: chop (command safety), safety-check.sh, vault-post-write.sh, ori/capture.mjs (session capture)
- Dispatch engine (EMA v5) with cron-based task scheduling (~40+ cron jobs)
- Services on VM: ollama, lightpanda, whisper-server, searxng, activepieces, antfly, Agent OS (next-server), wiki API
- Full unrestricted VM access: bash, sudo, no approval prompts
- Prefers minimal security restrictions — dedicated agent VM, not shared
- Values things working over things being "secure"
- Gets annoyed by hallucinated responses — never make up information
- Communication style: direct, fast, informal, no filler
- Claude Code memory lives inside the vault at `vault/Claude-Code-Memory/`
- Vault is shared between Claude Code and [[OpenClaw]] — both read/write
- Ori Mnemos bridge for session persistence and context loading

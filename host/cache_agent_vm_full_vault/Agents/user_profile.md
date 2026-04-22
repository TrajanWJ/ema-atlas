---
name: user-profile
description: Trajan's role, tools, and working style — power user running self-hosted AI agent stack on dedicated VM
type: user
status: active
summary: "Agent context file for user_profile"
tags: [agent-context]
confidence: 0.60
confidence_updated: 2026-03-18
source: manual
updated: 2026-03-16
created: 2026-03-14
title: "user_profile"
---

- Power user running a self-hosted AI agent stack on a dedicated KVM VM (agent-vm, 192.168.122.10)
- Uses Obsidian vault at `/home/trajan/vault/` as knowledge base / single source of truth
- Runs [[OpenClaw]] v2026.3.12 natively with Discord + Telegram channels
- Claude Code at `/usr/bin/claude` with Claude Max subscription (OAuth tokens)
- Agent identity: Right Hand — direct, competent, no-nonsense
- 39 skills total (11 bundled + 28 ClawHub), external plugins (MemOS, Composio, open-prose, Foundry)
- External tools: ClawMetry, ClawVault, [[OpenClaw]] MCP Server
- Full unrestricted VM access: bash, sudo, no approval prompts
- Prefers minimal security restrictions — dedicated agent VM, not shared
- Values things working over things being "secure"
- Gets annoyed by hallucinated responses — never make up information
- Communication style: direct, fast, informal, no filler
- Claude Code memory lives inside the vault at `vault/Claude-Code-Memory/`
- Vault is shared between Claude Code and [[OpenClaw]] — both read/write

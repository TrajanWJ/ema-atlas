---
title: "OpenClaw System Overview"
type: reference
created: 2026-04-06
tags: [openclaw, archived, system, overview]
summary: "Complete overview of the OpenClaw multi-agent AI platform that preceded EMA"
---

# OpenClaw System Overview

OpenClaw was a multi-agent AI orchestration platform that ran on a dedicated KVM VM (`agent-vm`, 192.168.122.10). It served as Trajan's primary AI assistant infrastructure from March-April 2026 before being superseded by [[EMA]].

## Architecture

- **Gateway**: Central WebSocket server coordinating all agents and channels (port 18789, systemd managed)
- **Control UI**: Full web interface (Lit + Vite frontend, Express.js backend, ~100K lines TypeScript)
- **MCP Server**: Exposed OpenClaw tools to Claude Code and MCP-compatible clients
- **Agent System**: 23+ agents with individual workspaces, identity docs, and session management
- **Memory**: LCM database (1.4GB SQLite with FTS5), per-agent daily notes, curated MEMORY.md
- **Extensions**: LosslessClaw (AST preservation), Engram (memory persistence), Opik (observability)

## Key Components

| Component | Purpose |
|-----------|---------|
| `lcm.db` | Main conversation memory (1.4GB, FTS5 indexed) |
| `openclaw.json` | Master config (model providers, browser, logging) |
| `cron-definitions.json` | 4 scheduled jobs (vault-feed, github-intel, transcript-scanner, morning-briefing) |
| Workspace docs | IDENTITY.md, SOUL.md, AGENTS.md, USER.md, TOOLS.md per workspace |
| Protocols | 12 protocol docs covering collaboration, handoff, evolution, ops |

## Model Providers

- Anthropic: Claude Opus 4.6, Sonnet 4.6, Haiku 4.5 (1M context)
- Anthropic Backup: Secondary keys for failover
- OpenAI: GPT-4.1 (Codex), o4-mini (reasoning)

## Integration Points

- **Discord**: Full access (reactions, threads, polls, pins, voice, moderation)
- **Telegram**: Open policy messaging
- **Claude Code**: Delegation via `--print --permission-mode bypassPermissions`
- **Vault**: Shared Obsidian vault at `/home/trajan/vault/`

## Why It Was Replaced

OpenClaw was architecturally limited by:
- No session persistence across gateway restarts (autonomous overnight work impossible)
- Gateway restart storms (40+ restarts in one incident)
- Engine starvation pattern (harvesters creating seeds without schedules)
- High operational overhead for cron/agent management

EMA was built natively in Elixir/Phoenix to address these issues with proper OTP supervision trees, SQLite persistence, and a cleaner architecture.

## Session Data

The complete history of OpenClaw operations is preserved across three session archives:

- **OpenClaw LCM Database**: 4,402 conversations, 175,443 messages (1.4GB SQLite) -- see [[OpenClaw Session Archive]]
- **Claude Code Sessions**: 2,589 sessions (582MB) used for coding delegation -- see [[Claude Code Session Archive]]
- **Codex Sessions**: 65 sessions (29MB) from GPT-5.4 integration -- see [[Codex Session Archive]]

Peak activity was April 4, 2026 with 851 conversations in a single day during a major engineering push.

## Related Wiki Pages

- [[OpenClaw Soul and Philosophy]]
- [[OpenClaw Agent Workspace Guide]]
- [[OpenClaw System Environment]]
- [[OpenClaw Protocols]]
- [[OpenClaw Agent Performance]]
- [[OpenClaw Cron and Automation]]
- [[OpenClaw Daily Operations Log]]
- [[OpenClaw Session Archive]]
- [[Claude Code Session Archive]]
- [[Codex Session Archive]]

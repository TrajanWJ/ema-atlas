---
type: architecture-note
date: 2026-03-20
tags: [claude-code, channels, MCP, telegram, discord, plugins]
domain: agent-architecture
aliases: [CC Channels, Claude Code Channels]
---

# Anthropic Channels — Push Events into Claude Code Sessions

## Core Concept

Claude Code v2.1.80+ introduces **Channels**: an MCP-based mechanism to push external events into a running CC session. Think webhooks-to-agent — external systems can send structured events that CC processes in-context.

## Built-in Plugins

- **Telegram** — two-way bridge between Telegram chats and CC sessions
- **Discord** — two-way bridge between Discord channels and CC sessions

Events flow both directions: external messages arrive as MCP events in CC, and CC can respond back through the same channel.

## Plugin Format

```
.claude-plugin/
  plugin.json    # manifest: name, version, MCP server config, event types
```

Plugins register as MCP servers that CC connects to. The plugin.json manifest defines what events the plugin can send/receive.

## Key Limitation: Session-Bound

Channels are **session-bound** — they die when the CC session ends or on `/clear`. This is fundamentally different from our OpenClaw architecture:

| Aspect | CC Channels | OpenClaw |
|--------|-------------|----------|
| Lifecycle | Session-bound (dies on /clear) | Always-on (cron + systemd) |
| Agent count | Single CC session | Multi-agent fleet |
| Persistence | None across sessions | Ori + engram + sqlite-memory |
| Event sources | Plugin-registered MCP | File dispatch + Discord + cron |
| Recovery | Manual restart | Auto-restart via systemd |

## Interop Opportunity

The `.claude-plugin/plugin.json` format could be a packaging standard for our agents:

1. Package OpenClaw agent capabilities as CC plugins
2. Agents become available both as always-on dispatched workers AND as CC session plugins
3. The plugin format provides a standardized interface definition

This doesn't replace our always-on architecture but adds a distribution channel — users without our full stack could use individual agent capabilities through CC plugins.

## Related Notes

- [[agent-architecture-sota-2026-03-19]]
- [[strawpot-orchestration]]
- [[MCP Ecosystem]]

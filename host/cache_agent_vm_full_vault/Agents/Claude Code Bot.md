---
title: "Claude Code Bot"
created: 2026-03-16
updated: 2026-03-16
type: agent
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: manual
tags: [active, agent, coding]
summary: "Standalone Discord bot that runs `claude --print --permission-mode bypassPermissions` and streams live tool output to Discord. Separate identity from "
---
# Claude Code Bot v2

**Status:** #active
**Created:** 2026-03-16
**Bot ID:** `1482938994022158430`
**Username:** `claudecode_seedofarsonVM`

## Overview

Standalone Discord bot that runs `claude --print --permission-mode bypassPermissions` and streams live tool output to Discord. Separate identity from Right Hand — visible as its own bot in the server.

## How It Works

```
Trajan or Right Hand
    ↓ @mention in any channel
Claude Code Bot
    ↓ injects last 10 channel messages as context
    ↓ spawns claude --print --permission-mode bypassPermissions
    ↓ streams live progress (📖 Read, ✏️ Edit, ⚡ Bash, ✅ Done)
Discord channel
```

## Dispatch

- **From Trajan:** `@claudecode_seedofarsonVM <task>` in any channel
- **From Right Hand:** `@claudecode_seedofarsonVM <task>` via message tool — Right Hand's bot ID (`1482234846934990918`) is whitelisted
- **With working dir:** `@claudecode_seedofarsonVM cd ~/project && fix the build`
- **Cancel:** `!stop` kills the running claude process

## Key Files

| File | Purpose |
|------|---------|
| `~/claude-code-bot/bot.py` | Main bot script |
| `~/.claude-code-bot.json` | Bot token (chmod 600) |
| `/var/log/claude-code-bot.log` | Logs |
| `/etc/systemd/system/claude-code-bot.service` | Systemd unit |

## Service Management

```bash
sudo systemctl start claude-code-bot
sudo systemctl stop claude-code-bot
sudo systemctl status claude-code-bot
journalctl -u claude-code-bot -f
```

## Safety Rules

- Never works inside `~/.openclaw/`
- Checks `~/.claude-pace.json` before heavy tasks — warns if pace > 1.5x
- One task per channel (queued)
- Long tasks auto-spawn Discord threads
- Smart truncation for long output (first/last N lines + file upload)
- Session lock cleanup on process death

## Output Format

Plain markdown with emoji prefixes — no components v2 (that's Right Hand's thing):

```
📖 Read: src/auth.ts (42 lines)
✏️ Edit: src/auth.ts:42-48
⚡ Bash: npm test (exit 0)
✅ Done — 2 files changed, all tests pass
```

## Session Logging

Every task is logged to `vault/Claude-Code-Bot/sessions/` for future reference.

## Two-Bot Pattern

| Bot | ID | Role |
|-----|----|------|
| Right Hand ([[OpenClaw]]) | `1482234846934990918` | Orchestrator, user-facing default, components v2 |
| Claude Code Bot | `1482938994022158430` | Code execution, visible tool use, plain markdown |

Right Hand dispatches to Claude Code Bot for coding tasks. Claude Code Bot does the work and streams output. Right Hand can summarize results after.

## Related

- [[Claude Code Bot Architecture]] — full architecture doc
- [[System Overview]] — infrastructure diagram
- [[Design Decisions]] — architecture rationale

#agent #active #coding
- [[2026-03-16_0624_desk]]
- [[2026-03-16_0725_system-buildout-mar1]]
- [[Daily]]
- [[Operations]]
- [[Log]]
- [[2026-03-16]]
- [[Decisions]]
- Discord
- Server
- Architecture
- [[v3]]

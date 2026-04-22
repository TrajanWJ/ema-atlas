---
name: Claude Code Discord Bot
description: Standalone Discord bot that runs Claude Code with bypassPermissions and streams output to Discord. Bot ID 1482938994022158430, dispatched by Right Hand or @mentioned directly.
type: reference
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: manual
updated: 2026-03-18
created: 2026-03-16
title: "reference_claude_code_bot"
summary: "Separate Discord bot running Claude Code with full permissions, streaming tool calls + output to channels in real time."
---
# Claude Code Discord Bot

Separate Discord bot running Claude Code with full permissions, streaming tool calls + output to channels in real time.

## Quick Reference

| Item | Value |
|------|-------|
| Bot | `claudecode_seedofarsonVM#9860` |
| Bot ID | `1482938994022158430` |
| Script | `~/claude-code-bot/bot.py` |
| Config | `~/.claude-code-bot.json` (600 perms) |
| Service | `claude-code-bot.service` |
| Log | `/var/log/claude-code-bot.log` |
| Vault doc | `vault/Architecture/Claude Code Bot Architecture.md` |

## Commands

```bash
sudo systemctl status claude-code-bot
sudo systemctl restart claude-code-bot
tail -f /var/log/claude-code-bot.log
```

## How it works

- @mention the bot in Discord with a task
- Right Hand (Right Hand, ID `1482234846934990918`) can dispatch by @mentioning it
- Runs `claude --print --permission-mode bypassPermissions --output-format stream-json`
- Streams tool calls (read, edit, bash) to Discord as it works
- Supports `cd /path &&` prefix for working directory

## Related
- [[Agent Roster]]
- [[Claude Code Bot Architecture]]
- [[Discord Server Architecture v4]]

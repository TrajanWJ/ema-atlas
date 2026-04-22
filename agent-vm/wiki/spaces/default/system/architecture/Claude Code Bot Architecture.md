---
title: Claude Code Bot Architecture
created: '2026-03-16'
updated: '2026-03-16'
type: knowledge
status: active
confidence: 0.6
confidence_updated: 2026-03-18T00:00:00.000Z
source: architecture-doc
tags:
  - active
summary: >-
  Standalone Discord bot that runs Claude Code with full system access and
  streams output to Discord in real time. Separate identity from Right Hand ([[
wiki_id: system/architecture/Claude_Code_Bot_Architecture
imported_from: vault/Architecture/Claude Code Bot Architecture.md
imported_at: '2026-04-04T00:23:56.739Z'
---
# Claude Code Bot Architecture

**Status:** #active
**Created:** 2026-03-16
**Version:** v2 (agentic, context-aware, live-streaming)

## Overview

Standalone Discord bot that runs Claude Code with full system access and streams output to Discord in real time. Separate identity from Right Hand ([[OpenClaw]]). Only responds when @mentioned by Trajan or dispatched by Right Hand.

## Design

```
@mention (Trajan or Right Hand)
    ↓
Bot injects last 10 channel messages as context
    ↓
claude --print --permission-mode bypassPermissions --verbose --output-format stream-json
    ↓ live streaming (edits status message every 3s)
Discord channel (📖 Read, ✏️ Edit, ⚡ Bash, ✅ Done)
    ↓ long tasks auto-spawn threads
Session logged to vault/Claude-Code-Bot/sessions/
```

### Two-Bot Pattern

| Bot | Role | Discord ID |
|-----|------|------------|
| Right Hand | User-facing default, orchestrator | `1482234846934990918` |
| Claude Code | Code execution, visible tool use | `1482938994022158430` |

### Interaction Flow

```
You: "@Claude Code fix the auth bug in ~/project"
Claude Code: 🔧 Working... (3s, 2 tools)
             📖 Read: src/auth.ts
             ✏️ Edit: src/auth.ts:42-48
             ⚡ Bash: npm test (exit 0)
Claude Code: ✅ Fixed — changed token validation logic. Tests pass.
             -# ✅ 4 tools | 12s | exit 0
```

## v2 Features

| Feature | Implementation |
|---------|---------------|
| **Live progress** | Edits a single status message every 3s with tool calls |
| **Channel context** | Injects last 10 messages into Claude Code system prompt |
| **Discord tools** | Bash scripts in `~/claude-code-bot/tools/` (send, history, react, thread, upload) |
| **Thread spawning** | Auto-spawns thread after 15+ tool calls |
| **Kill switch** | `!stop` or `!cancel` kills the running task |
| **Usage gate** | Checks `~/.claude-pace.json`, warns if pace > 1.5x |
| **Session logging** | Saves summaries to `vault/Claude-Code-Bot/sessions/` |
| **Working dir** | `cd ~/path &&` or `--dir ~/path` prefix |
| **Queue** | One task per channel, rejects concurrent |
| **Smart output** | Splits long responses, uploads as file if > 4 chunks |

## Config

| Item | Value |
|------|-------|
| Token | `~/.claude-code-bot.json` (chmod 600) |
| Bot ID | `1482938994022158430` |
| Bot name | `claudecode_seedofarsonVM#9860` |
| Service | `claude-code-bot.service` (systemd, Restart=always) |
| Script | `~/claude-code-bot/bot.py` |
| Tools | `~/claude-code-bot/tools/` |
| Log | `/var/log/claude-code-bot.log` |
| Session logs | `~/vault/Claude-Code-Bot/sessions/` |
| Permission | `bypassPermissions` (full system access) |
| Working dir | `/home/trajan` (default, overridable) |

## Key Files

```
~/claude-code-bot/
├── bot.py                  # Main bot script (v2)
├── tools/
│   ├── discord-send.sh     # Send message to channel
│   ├── discord-history.sh  # Read channel history
│   ├── discord-react.sh    # Add reaction
│   ├── discord-thread.sh   # Create thread
│   └── discord-upload.sh   # Upload file
~/.claude-code-bot.json     # Token + config (600 perms)
/etc/systemd/system/claude-code-bot.service
/var/log/claude-code-bot.log
~/vault/Claude-Code-Bot/sessions/  # Task session logs
```

## Invocation

- **Direct:** `@claudecode_seedofarsonVM <task>` in any channel
- **With directory:** `@claudecode_seedofarsonVM cd ~/project && fix the build`
- **From Right Hand:** Right Hand @mentions Claude Code to delegate
- **Cancel:** `!stop` or `!cancel` in channel with active task

## Discord Tools (available to Claude Code via Bash)

```bash
discord-send.sh <channel_id> <message>
discord-history.sh <channel_id> [count]
discord-react.sh <channel_id> <message_id> <emoji>
discord-thread.sh <channel_id> <name> [message_id]
discord-upload.sh <channel_id> <file_path> [message]
```

## Integration with Right Hand

Right Hand dispatches by @mentioning Claude Code:
```
Right Hand: "@Claude Code fix the auth in ~/bin/oauth-guardian.sh"
```

`ORCHESTRATOR_BOT_ID` (`1482234846934990918`) is whitelisted — Right Hand's messages bypass the "ignore bots" filter. In threads, Right Hand can dispatch without @mention.

## Commands

```bash
sudo systemctl start claude-code-bot
sudo systemctl stop claude-code-bot
sudo systemctl restart claude-code-bot
sudo systemctl status claude-code-bot
tail -f /var/log/claude-code-bot.log
```

## Safety

- Only responds to @mentions (not all channel messages)
- Never works inside `~/.openclaw/`
- Usage gate warns when pace > 1.5x
- One task per channel (no concurrent collision)
- Kill switch for runaway tasks
- Session logs for audit trail

## Related

- [[Headless OAuth Recovery]] — keeps auth tokens alive
- [[System/System Overview]] — Orchestrator + Right Hand model
- [[Claude Code Bot]]
- [[README]]

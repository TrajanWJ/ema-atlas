---
title: "OpenClaw Discord Setup"
created: 2026-03-14
updated: 2026-03-16
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: research
tags: [channels, discord, openclaw, setup]
summary: "1. Create a Discord bot at [Discord Developer Portal](https://discord.com/developers/applications)"
---
# OpenClaw Discord Setup

> Full guide to setting up Discord integration with [[OpenClaw]], including voice, slash commands, threads, and community plugins.

---

## Prerequisites

1. Create a Discord bot at [Discord Developer Portal](https://discord.com/developers/applications)
2. Enable **Message Content Intent** (required) + **Server Members Intent** (recommended)
3. OAuth2 scopes: `bot` + `applications.commands`
4. Permissions: View Channels, Send Messages, Read Message History, Embed Links, Attach Files
5. Invite bot to your server with the generated URL

## Basic Setup

```bash
openclaw config set channels.discord.token '"YOUR_BOT_TOKEN"' --json
openclaw config set channels.discord.enabled true --json
openclaw gateway restart
```

Or add to `openclaw.json`:

```json
{
  "channels": {
    "discord": {
      "enabled": true,
      "token": "YOUR_BOT_TOKEN",
      "dmPolicy": "allowlist",
      "streaming": "partial",
      "guilds": {
        "YOUR_GUILD_ID": {
          "requireMention": true,
          "channels": {
            "general": { "allow": true },
            "agent-chat": { "allow": true, "requireMention": false }
          }
        }
      }
    }
  }
}
```

## Feature Configuration

### Slash Commands (auto-registered)

```json
{
  "commands": {
    "native": "auto",
    "nativeSkills": "auto"
  }
}
```

Available: `/help`, `/commands`, `/status`, `/model`, `/skill`, `/think`, `/bash`, `/restart`, `/stop`, `/vc join|leave|status`

### Threads

```json
{
  "threadBindings": {
    "enabled": true,
    "idleHours": 24,
    "spawnSubagentSessions": false
  }
}
```

Each thread gets isolated session context. Use `/focus` and `/unfocus` to bind/unbind agents.

### Voice Channels

```json
{
  "voice": {
    "enabled": true,
    "autoJoin": false,
    "daveEncryption": true,
    "tts": {
      "provider": "openai",
      "openai": { "voice": "alloy" }
    }
  }
}
```

Control via `/vc join`, `/vc leave`, `/vc status`.

### Streaming

| Mode | Behavior |
|---|---|
| `"off"` | Wait for full response |
| `"partial"` | Edit single message as tokens arrive |
| `"block"` | Send draft-sized chunks |
| `"progress"` | Cross-channel consistency |

### Interactive Components

Buttons, select menus, modals — built into Discord skill. Exec approval flows use button-based approve/deny.

### Reactions & Polls

```json
{
  "actions": {
    "reactions": true,
    "polls": true,
    "stickers": true
  }
}
```

### Presence

```json
{
  "presence": {
    "type": "watching",
    "name": "for messages"
  }
}
```

Types: playing, streaming, listening, watching, custom, competing.

### Moderation (disabled by default)

```json
{
  "actions": {
    "moderation": true,
    "roles": true
  }
}
```

Enables timeout, kick, ban, role assignment.

---

## Recommended Plugins to Install

### 1. discord-mcp (30+ Discord functions)

```bash
# Run as systemd container
docker run --rm -i -e DISCORD_TOKEN=YOUR_TOKEN saseq/discord-mcp:latest
```

Add to MCP config for server ops, channel management, role admin, webhooks beyond what the built-in skill provides.

### 2. avatarneil/discord-voice (advanced voice)

Install from ClawHub for full voice with 6+ TTS providers:
- OpenAI, ElevenLabs, Deepgram Aura, Amazon Polly, Edge TTS, Kokoro
- Smart barge-in interruption
- Voice activity detection
- Auto-reconnection with failover

### 3. openclaw-guardian (self-healing + Discord alerts)

Monitors gateway health and sends Discord alerts on failures. Auto-repairs via `doctor --fix`.

---

## Discord vs Telegram Comparison

| Feature | Discord | Telegram |
|---|---|---|
| Text messaging | Yes | Yes |
| Rich embeds | Yes (native) | No |
| Voice channels | Yes (join/leave/TTS) | No |
| Slash commands | Yes (native + autocomplete) | Yes (menu commands) |
| Threads | Yes (full binding + forums) | Yes (forum topics) |
| Buttons/modals | Yes (buttons, menus, modals) | Yes (inline keyboards) |
| File sharing | Yes (8MB default) | Yes (100MB default) |
| Streaming preview | Yes (partial/block/progress) | Yes (partial/block) |
| Role management | Yes (query + assign) | No |
| Moderation | Yes (timeout/kick/ban) | No |
| Presence/status | Yes (activity types) | No |
| Multi-account | Yes | Not documented |

**Verdict:** Discord is more feature-rich. Telegram has simpler setup and higher file limits.

---

## See Also

- [[Research/OpenClaw Ecosystem]] — all community plugins and tools
- [[Reference/Claude Max Proxy]] — auth proxy (handles API access)
- [[Configuration/systemd Stack]] — container setup
- [[Reference/System Services]] — background services

#openclaw #discord #setup #channels

## Related

- [[Discord Rich Output Patterns]]
- [[OpenClaw Ecosystem]]
- [[research]]
- Patterns
- [[3]]
- [[-]]
- [[Deprecation]]
- [[and]]
- [[Advancement]]
- [[Analysis]]

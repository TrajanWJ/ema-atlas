---
title: "OpenClaw Config"
created: 2026-03-14
updated: 2026-03-16
type: operations
status: active
confidence: 0.60
confidence_updated: 2026-03-18
source: operations
tags: [configuration, openclaw, ssh]
summary: "[[OpenClaw]] can reach the host machine (FerrissesWheel) via SSH:"
---
# OpenClaw Configuration

**Last updated:** 2026-03-16
**Version:** 2026.3.12
**Config file:** `~/.openclaw/openclaw.json`

## Core Settings

- **Model:** anthropic/claude-opus-4-6
- **Gateway:** LAN bind (192.168.122.10:18789), local mode
- **Auth:** Claude Max OAuth token, auto-synced every 30min
- **Exec:** security=full, ask=off, host=gateway

## Host Access (SSH)

[[OpenClaw]] can reach the host machine (FerrissesWheel) via SSH:

| Property | Value |
|---|---|
| Command | `ssh host-machine` |
| Host IP | 192.168.122.1 |
| User | trajan |
| Key | `~/.ssh/id_ed25519` |
| Sudo | passwordless |

**Use cases for agents:**
- Read host Obsidian vault: `ssh host-machine 'cat ~/Documents/obsidian_first_stuff/twj1/path/to/note.md'`
- Write to host: `ssh host-machine 'cat > ~/path/to/file' <<< 'content'`
- Run host commands: `ssh host-machine 'sudo systemctl status sshd'`
- Sync vaults: `rsync -avz ~/vault/ host-machine:~/Documents/obsidian_first_stuff/twj1/Agent-VM-Vault/`

See [[Networking]] for full SSH setup details.

## Channels

### Discord
- **Token:** configured
- **Guild:** 1482230800916287710
- **Policy:** open (no @mention required)
- **Actions:** reactions, stickers, polls, threads, pins, search, roles, voiceStatus, events, moderation
- **Thread bindings:** enabled (48h idle)
- **Exec approvals:** enabled (channel)

### Telegram
- **Bot token:** configured
- **Policy:** open, no mention required
- **Exec approvals:** enabled

## Agent Configuration

- **Agent ID:** main
- **Workspace:** `~/.openclaw/agents/main/workspace`
- **Heartbeat:** every 30m
- **Memory search:** enabled (memory + sessions)
- **Session memory:** enabled (experimental)
- **Compaction:** safeguard mode, memory flush enabled

## Plugin Configuration

### openclaw-engram (memory slot)
- memoryOsPreset: balanced
- nativeKnowledge: enabled
- fileHygiene: enabled
- QMD integration: enabled
- Transcript capture: enabled
- Hourly summaries: disabled (needs LLM key)

## Browser
- Enabled: true
- Executable: /usr/bin/google-chrome-stable
- Headless: false
- No sandbox: true

## Gateway Security
- Control UI: allowed origins (localhost, 127.0.0.1, 192.168.122.10)
- Device auth: disabled (dangerouslyDisableDeviceAuth)
- Auth mode: token

## ⚠️ Obfuscation Detection (Hardcoded)
Cannot be disabled via config. Always forces approval on:
- curl/wget pipe to shell
- base64/hex decode to shell
- eval with encoded input
- process substitution from remote
- shell heredocs to interpreters
- Variable expansion chains
See TOOLS.md for full list and workarounds.

#openclaw #configuration #ssh


## Host Claude Code Dispatch

| Property | Value |
|---|---|
| Script | `~/bin/host-claude.sh` |
| Usage | `~/bin/host-claude.sh <dir> "<prompt>" [timeout]` |
| Collision check | Detects active Claude Code on host before dispatch |
| Timeout | 600s default, configurable per-task |
| Output | <4KB inline, >4KB to `~/shared/reports/vm--result-*.md` |

## Host Notifications

| Property | Value |
|---|---|
| Script | `~/bin/host-notify.sh` |
| Usage | `~/bin/host-notify.sh "Title" "Body"` |
| Mechanism | SSH + notify-send on host (Wayland/DBUS) |
| Fallback | Write to `~/shared/inbox-host/` |

## Related

- [[OpenClaw Advanced Config Patterns]]
- [[OpenClaw Config]]
- [[config-guardian]]
- [[research]]
- Round
- [[3]]
- [[-]]
- [[Deprecation]]
- [[and]]
- [[Advancement]]
- [[Analysis]]

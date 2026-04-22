---
title: "systemd Stack"
created: 2026-03-16
updated: 2026-03-16
type: operations
status: active
confidence: 0.60
confidence_updated: 2026-03-18
source: operations
tags: [docker, github, mcp, openclaw, ops, skills]
summary: "Current systemd services running on `agent-vm` (192.168.122.10)."
---
# systemd Stack

Current systemd services running on `agent-vm` (192.168.122.10).

## Services

### openclaw-gateway
- **Description:** [[OpenClaw]] Gateway (native)
- **ExecStart:** `/usr/bin/openclaw gateway --bind lan`
- **User:** trajan
- **Restart:** always
- **Purpose:** Main [[OpenClaw]] gateway daemon — handles all agent communication, Discord/Telegram channels, and skill execution.

### oauth-guardian
- **Description:** OAuth Guardian — continuous auth monitoring and auto-refresh
- **ExecStart:** `/home/trajan/bin/oauth-guardian.sh`
- **User:** trajan
- **Restart:** always
- **Purpose:** Monitors OAuth tokens across 4 stores (Claude, GitHub, etc.), auto-refreshes before expiry, and falls back to browser auto-login when needed.

### bridge-sync
- **Description:** Bridge sync between VM and host shared folder
- **ExecStart:** `/home/trajan/bin/bridge-sync.sh`
- **User:** trajan
- **Restart:** no (timer-driven)
- **Timer:** `bridge-sync.timer` — runs every 60s
- **Purpose:** Bidirectional rsync between VM and host via `~/shared/` folder. Syncs inbox, reports, and task files.

### claude-code-bot
- **Description:** Claude Code Discord Bot
- **ExecStart:** `/usr/bin/python3 /home/trajan/claude-code-bot/bot.py`
- **User:** trajan
- **Restart:** always
- **Purpose:** Discord bot that provides Claude Code sessions via Discord commands.

### clickhouse-server
- **Description:** ClickHouse database server
- **User:** clickhouse (system)
- **Restart:** no
- **Purpose:** Analytics database used for log aggregation and metrics storage.

## Related
- [[Configuration/Docker Stack]] — Docker-based services (if any)
- [[Configuration/Networking]] — Network configuration
- [[Configuration/OpenClaw Config]] — [[OpenClaw]] configuration files
- [[Architecture/System Overview]] — Full system architecture
- [[Networking]]

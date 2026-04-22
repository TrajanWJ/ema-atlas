---
title: "OpenClaw"
created: 2026-03-14
updated: 2026-03-16
type: agent
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: manual
tags: [agent-vm, agents, openclaw]
summary: "OpenClaw is an open-source AI gateway that connects large language models to messaging platforms. It handles platform integration, conversation manage"
---
# OpenClaw

## Overview

OpenClaw is an open-source AI gateway that connects large language models to messaging platforms. It handles platform integration, conversation management, and skill execution.

## Quick Info

| Property | Value |
|---|---|
| **Service** | `openclaw-gateway.service` (systemd) |
| **Port** | 18789 (LAN-bound) |
| **Binary** | `/usr/bin/openclaw` |
| **Version** | 2026.3.12 |
| **Config** | `~/.openclaw/openclaw.json` |
| **Auth** | `~/.openclaw/agents/main/agent/auth-profiles.json` |
| **Workspace** | `~/.openclaw/agents/main/workspace/` |
| **RAM** | 14 GB (VM total) |
| **vCPUs** | 6 |

## Supported Platforms

| Platform | Protocol | Status |
|---|---|---|
| Discord | Bot Gateway | **Active** |
| Telegram | Bot API | **Active** |
| WhatsApp | Web API | Available |
| Slack | Bot/Events API | Available |
| Signal | Signal CLI | Available |
| Matrix | Client-Server API | Available |
| IRC | IRC protocol | Available |

## Management

```bash
# Service lifecycle
sudo systemctl status openclaw-gateway
sudo systemctl restart openclaw-gateway

# CLI
openclaw status              # health check
openclaw agent --agent main --message "test"
openclaw gateway health

# Logs
journalctl -u openclaw-gateway -f
```

## Auth System

OAuth Guardian v4 handles token refresh automatically:
- Syncs Claude Code OAuth token → OpenClaw auth-profiles
- Runs as systemd service (`oauth-guardian.service`)
- Falls back to browser auto-login if token refresh fails

```bash
# Check auth health
sudo systemctl status oauth-guardian
tail -20 /var/log/oauth-guardian.log

# Manual token refresh
~/bin/refresh-claude-token.sh

# If Claude Code auth expires
claude /login
```

## Skills System

OpenClaw uses a skills system for extending agent capabilities:

| Skill Type | Description |
|---|---|
| Bundled | Ships with OpenClaw — basic conversation, code execution |
| Managed | Installed from ClawHub registry |
| Workspace-level | Custom skills in `~/.openclaw/agents/main/workspace/skills/` |

**Security note:** Community skills are untrusted code. Review before installing. Pin versions. See [[Security/Hardening]] for details.

## Configuration

Key settings in `~/.openclaw/openclaw.json`:
- Agent definitions and model routing
- Channel connections (Discord, Telegram)
- Cron jobs (vault-feed, transcript-scanner, morning-briefing)
- Exec policy: `security: full, ask: off`

## Related Notes

- [[Agents/Platforms|Platforms]] — tracker for connected messaging platforms
- [[Security/Hardening]] — OpenClaw-specific security measures
- [[Security/Threat Model]] — risk analysis
- [[Architecture/Design Decisions]] — DD-002: why OpenClaw over IronClaw
- [[Reference/System Services]] — all background services

#agent-vm #agents #openclaw
- [[12-Factor]]
- [[Agents]]
- [[2026-03-16]]
- [[2026-03-16_0757_worklog]]
- [[2026-03-16_0830_🔧]]
- [[Cron]]
- [[Persistence]]
- [[—]]
- [[2026-03-16_0830_🛡️]]
- [[Secrets]]
- [[in]]
- [[Plaint]]

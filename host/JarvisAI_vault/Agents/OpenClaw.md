# OpenClaw

## Overview

OpenClaw is an open-source AI gateway that connects large language models to messaging platforms. It handles platform integration, conversation management, and skill execution through sandboxed containers.

## Quick Info

| Property | Value |
|---|---|
| Container | openclaw-gateway |
| Port | 18789 (internal only — not published to host) |
| WebSocket | ws://openclaw-gateway:18789 |
| Memory | 4 GB limit |
| CPUs | 3 |
| Config Volume | oc-config (/home/node/.config) |
| Workspace Volume | oc-workspace (/workspace) |
| Docker Access | Via socket proxy at tcp://docker-socket-proxy:2375 |

## Supported Platforms

| Platform | Protocol | Status |
|---|---|---|
| WhatsApp | Web API | Available |
| Telegram | Bot API | Available |
| Slack | Bot/Events API | Available |
| Discord | Bot Gateway | Available |
| Signal | Signal CLI | Available |
| iMessage | AppleScript bridge | Available (macOS only) |
| Matrix | Client-Server API | Available |
| Microsoft Teams | Bot Framework | Available |
| LINE | Messaging API | Available |
| IRC | IRC protocol | Available |

## Onboarding

Connect a new messaging platform:

```bash
# SSH into VM
ssh agent-vm

# Run onboarding wizard
cd /opt/jarvis
docker compose exec openclaw-gateway openclaw onboard
```

The wizard walks through platform-specific setup (bot token, channel config, etc.). Credentials are stored in the oc-config volume.

## Skills System

OpenClaw uses a skills system for extending agent capabilities:

| Skill Type | Description |
|---|---|
| Bundled | Ships with OpenClaw — basic conversation, code execution |
| Managed | Installed from the OpenClaw skill registry |
| Workspace-level | Custom skills in the oc-workspace volume |

**Security note:** Community skills are untrusted code. Review before installing. Pin versions. See [[Security/Hardening\|Hardening]] for details on the ClawHavoc supply chain attack.

## Configuration

Key environment variables (set in .env or docker-compose.yml):

| Variable | Value | Purpose |
|---|---|---|
| MAX_SANDBOXES | 1 | Limit concurrent sandbox containers |
| DISABLE_DM_PAIRING | true | Prevent DM-based bot pairing |
| SANDBOX_NETWORK | sandbox-net | Internal network for sandboxes |
| DOCKER_HOST | tcp://docker-socket-proxy:2375 | Filtered Docker access |

## Health Check

OpenClaw exposes a health endpoint:

```
http://localhost:18789/__openclaw__/canvas/
```

Docker checks this every 30s with a 60s start period and 5 retries.

## Related Notes

- [[Mission Control]] — orchestration dashboard that connects to OpenClaw
- [[Platforms]] — tracker for connected messaging platforms
- [[Security/Hardening\|Hardening]] — OpenClaw-specific security measures
- [[Security/Threat Model\|Threat Model]] — risk analysis for OpenClaw
- [[Architecture/Design Decisions\|Design Decisions]] — DD-002: why OpenClaw over IronClaw

#jarvisai #agents #openclaw

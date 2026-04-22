---
title: OpenClaw Research
created: '2026-03-14'
updated: '2026-03-16'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: research
tags:
  - agent-vm
  - ai-assistant
  - evaluated
  - self-hosted
summary: >-
  Created Nov 2025 by Peter Steinberger as Clawdbot. Renamed Moltbot (Jan 2026)
  after Anthropic trademark issue, then [[OpenClaw]] three days late
wiki_id: research/OpenClaw_Research
imported_from: vault/Research/OpenClaw Research.md
imported_at: '2026-04-04T00:23:57.099Z'
---
# OpenClaw Research

> Open-source personal AI assistant that connects to 20+ messaging platforms. Local-first, self-hosted.

## Quick Info

| Field | Value |
|---|---|
| **GitHub** | [openclaw/openclaw](https://github.com/openclaw/openclaw) |
| **Stars** | 307,000+ |
| **License** | MIT |
| **Language** | TypeScript |
| **Runtime** | Node.js >= 22 |
| **Docker** | Yes (Dockerfile + docker-compose.yml + sandbox variants) |
| **Created** | 2025-11-24 |

## What It Does

- Unified AI inbox across WhatsApp, Telegram, Slack, Discord, Signal, iMessage, Matrix, Teams, LINE, IRC, etc.
- Gateway (WebSocket control plane) coordinates between AI agent and client apps
- Voice support (wake word on macOS/iOS, continuous on Android)
- Interactive canvases, browser automation, cron jobs, webhooks
- Gmail Pub/Sub integration
- Skills platform (bundled, managed, workspace-level)

## History

Created Nov 2025 by Peter Steinberger as "Clawdbot." Renamed "Moltbot" (Jan 2026) after Anthropic trademark issue, then "[[OpenClaw]]" three days later.

## Docker Setup

```bash
# Automated:
./docker-setup.sh

# Manual:
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm openclaw-cli onboard
docker compose up -d openclaw-gateway
```

Key files in repo: `Dockerfile`, `Dockerfile.sandbox`, `Dockerfile.sandbox-browser`, `Dockerfile.sandbox-common`, `docker-compose.yml`, `docker-setup.sh`, `.env.example`

Container runs as non-root `node` user (UID 1000). CLI drops `NET_RAW`/`NET_ADMIN` capabilities, enables `no-new-privileges`.

## Requirements

- Docker Desktop/Engine with Compose v2
- Minimum 2 GB RAM (1 GB risks OOM during build)
- macOS, Linux, or Windows via WSL2

## Security Considerations

**High risk profile — treat with extreme caution:**

- **Full system access** within mounted volumes (shell commands, file access)
- **CVE-2026-25253** documented
- **ClawHavoc supply chain attack** — 341 malicious skills, 9,000+ compromised installations
- **DM pairing** enabled by default — unknown senders receive pairing codes
- Keep gateway bound to `127.0.0.1`, use reverse proxy or VPN (Tailscale)
- Only mount directories [[OpenClaw]] actually needs — never expose `$HOME`
- Review `DOCKER-USER` firewall policy on VPS/public hosts
- Never store SSH keys, production creds, or tokens in workspace
- **Strong recommendation:** deploy on dedicated server/VPS, not personal machine

## Alternatives

| Project | Language | Differentiator |
|---|---|---|
| **IronClaw** (NEAR AI) | Rust | WASM sandbox, capability-based permissions, API keys never exposed to tool code |
| **ZeroClaw** | Rust | Low-resource ARM SBCs, security-first architecture |
| **NanoClaw** | TypeScript | Built on Claude Agent SDK, real Docker isolation, agent swarms |
| **Nanobot** | Python | ~4,000 LOC, easy to audit entire codebase |
| **PicoClaw** | Go | <10MB RAM, boots in 1s, runs on $10 RISC-V boards |
| **AnythingLLM** | -- | Web UI, multi-provider, no vendor lock-in |

## Evaluation Notes (2026-03-12)

**Pros:** Massive community, extremely active development, comprehensive Docker support, MIT license, vast messaging platform coverage.

**Cons:** Enormous attack surface (shell access + 20+ integrations), documented supply chain attack history, very large codebase difficult to audit, DM pairing default is risky. The ClawHavoc incident alone is a serious red flag for self-hosting on a personal machine.

**Verdict:** If deploying, use Docker with strict volume mounts, network isolation, and ideally a dedicated VM or VPS. Do not run on primary workstation without containerization.

## See Also

- [[Research/OpenClaw Ecosystem]] — community plugins, tools, integrations
- [[Research/OpenClaw Discord Setup]] — Discord integration guide
- [[Reference/OpenClaw Extensions]] — installed plugins, skills, and config
- [[Reference/OpenClaw Claude Code Plugin]] — container coding delegation
- [[Reference/Headless OAuth Recovery]] — emergency re-auth
- [[Reference/System Services]] — gateway systemd service
- [[Self-Hosted AI Agent Platforms 2026]] — comparison of all options
- [[Setup Log]] — current setup history

#ai-assistant #self-hosted #evaluated #agent-vm

## Related

- [[OpenClaw Ecosystem]]
- [[OpenClaw Extensions Deep Dive]]
- [[research]]
- Extensions
- [[3]]
- [[-]]
- [[Deprecation]]
- [[and]]
- [[Advancement]]
- [[Analysis]]
- [[project_obsidian_vault]]

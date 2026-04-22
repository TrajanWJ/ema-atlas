---
title: "Infrastructure Map"
type: reference
created: 2026-04-06
tags: [operations, infrastructure, vm, services]
summary: "Complete infrastructure map including VM specs, services, cron jobs, and network topology"
---

# Infrastructure Map

## Compute

### agent-vm (Guest)

| Property | Value |
|----------|-------|
| IP | 192.168.122.10 |
| RAM | 14 GB |
| vCPU | 6 |
| Disk | 58 GB |
| OS | Ubuntu |
| Role | Primary agent execution environment |

### FerrissesWheel (Host)

| Property | Value |
|----------|-------|
| IP | 192.168.122.1 |
| Type | KDE desktop |
| Node.js | 20.20.0 |
| pnpm | 10.29.3 |
| Python | 3.12 |
| Role | Host machine, KVM hypervisor |

## Systemd Services

| Service | Purpose |
|---------|---------|
| `openclaw-gateway` | Main OpenClaw API gateway |
| `oauth-guardian` | OAuth token refresh and management |
| `bridge-sync.timer` | Periodic bridge synchronization |
| `ema-daemon` | EMA (Executive Memory Assistant) background service |

## Network / Ports

| Port | Service |
|------|---------|
| 18789 | OpenClaw Gateway |
| 4488 | EMA |

## Cron Jobs (v4, 2026-03-20)

29 cron jobs organized by function:

| Category | Count | Examples |
|----------|-------|---------|
| Health | 3 | System watchdog, gateway watchdog, session health |
| Session | 2 | Session watchdog, session cleanup |
| Memory/Knowledge | 5 | Auto-knowledge capture, skill-vault-sync, QMD updates |
| Research | 3 | Reddit intel, competitive scan, landscape capture |
| Daily | 2 | Morning briefing, daily briefing |
| Other | 14 | Various maintenance, sync, and automation tasks |

## Discord

- **Guild ID**: 1482230800916287710
- **Channels**: 18+ channels for various agent functions

## Key Scripts

30+ custom scripts in `~/bin/` -- see [[Custom-Scripts-Inventory]] for full listing.

## Architecture Diagram (Text)

```
[FerrissesWheel Host]
  |-- KVM
  |   └── [agent-vm 192.168.122.10]
  |         |-- openclaw-gateway :18789
  |         |-- ema-daemon :4488
  |         |-- oauth-guardian
  |         |-- bridge-sync.timer
  |         |-- 29 cron jobs
  |         |-- ~/bin/ (30+ scripts)
  |         └── ~/vault/ (knowledge base)
  |
  └── [Discord Guild]
        └── 18+ channels
```

## Related

- [[Custom-Scripts-Inventory]] -- detailed script catalog
- [[Security-Posture]] -- security implications of this infrastructure
- [[Security-Audits]] -- audit findings for these components

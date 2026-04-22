---
title: System Setup
created: '2026-03-14'
updated: '2026-03-16'
type: knowledge
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: reference
tags:
  - meta
  - setup
  - system
summary: 'Two environments connected via SSH:'
wiki_id: reference/System_Setup
imported_from: vault/Reference/System Setup.md
imported_at: '2026-04-04T00:23:56.939Z'
---
# System Setup

> How Trajan's AI system is wired together — every component, config file, and data flow.
> Last verified: 2026-03-16

---

## The Big Picture

Two environments connected via SSH:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    HOST (FerrissesWheel)                                 │
│                                                                         │
│  ┌──────────────────────┐         ┌──────────────────────────────────┐  │
│  │  OBSIDIAN VAULT       │  MCP    │  CLAUDE CODE CLI                 │  │
│  │  ~/Documents/         │ :22360  │  ~/.claude/                      │  │
│  │  obsidian_first_stuff │◄──────►│  CLAUDE.md, mcp.json, settings   │  │
│  │  /twj1/               │        │                                  │  │
│  │  Claudian (sidebar)   │        │  Plugins: Superpowers, Context7  │  │
│  │  claude-code-mcp      │        │  MCP: QMD, CodeGraphContext,     │  │
│  │  33 vault skills      │        │       Figma, Gmail, Vercel       │  │
│  └───────────────────────┘        └──────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────┐         ┌──────────────────────────────────┐  │
│  │  PROJECTS             │         │  ~/shared/ (bridge-sync)         │  │
│  │  ~/Desktop/Coding/    │         │  ↕ rsync every 60s to VM         │  │
│  └──────────────────────┘         └──────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │ SSH (192.168.122.1 ↔ 192.168.122.10)
┌─────────────────────────┴───────────────────────────────────────────────┐
│                    AGENT VM (agent-vm, KVM)                              │
│                                                                         │
│  ┌──────────────────────┐         ┌──────────────────────────────────┐  │
│  │  OPENCLAW GATEWAY     │         │  VAULT (agent copy)              │  │
│  │  systemd :18789       │         │  /home/trajan/vault/             │  │
│  │  Discord + Telegram   │         │  QMD search (cron 30min)         │  │
│  │                       │         │  ontology-sync (cron 3h)         │  │
│  │  OAuth Guardian v4    │         └──────────────────────────────────┘  │
│  │  bridge-sync timer    │                                              │
│  └──────────────────────┘         ┌──────────────────────────────────┐  │
│                                    │  CLAUDE CODE (VM)                │  │
│                                    │  Spawned by Right Hand            │  │
│                                    │  for coding/ops/research tasks    │  │
│                                    └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Agent VM Services

| Service | Type | Purpose |
|---|---|---|
| `openclaw-gateway.service` | systemd | AI gateway (Discord + Telegram) |
| `oauth-guardian.service` | systemd | Auto-refresh Claude auth tokens |
| `bridge-sync.timer` | systemd timer | Sync ~/shared/ with host every 60s |
| QMD cron | cron (*/30) | Vault search reindex |
| ontology-sync | cron (*/180) | Entity extraction |
| [[Laminar]] stack | Docker compose | Observability (optional) |

## Quick Diagnostics

```bash
# On the VM:
sudo systemctl status openclaw-gateway    # Gateway running?
sudo systemctl status oauth-guardian      # Auth healthy?
systemctl status bridge-sync.timer        # Sync active?
crontab -l | grep qmd                     # QMD cron exists?
qmd search "test query"                   # Search working?
openclaw status                           # Full health check

# From host:
ssh agent-vm "openclaw status"            # Remote check
cat ~/shared/.heartbeat                   # Sync alive? (stale if >120s)
```

## Key Paths (VM)

| Path | Purpose |
|---|---|
| `~/.openclaw/` | [[OpenClaw config]] and state |
| `~/.openclaw/agents/main/workspace/` | Agent workspace (SOUL.md, AGENTS.md, etc.) |
| `/home/trajan/vault/` | Knowledge vault |
| `~/bin/` | Custom scripts (host-claude, oauth-guardian, etc.) |
| `~/shared/` | Bridge sync folder |

## Related Notes

- [[Reference/System Services]] — detailed service documentation
- [[Architecture/System Overview]] — architecture overview
- [[Reference/My Stack Decisions]] — tool choices and rationale

#system #setup #meta
- [[Host Machine Profile]]

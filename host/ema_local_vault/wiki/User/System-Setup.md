---
title: "System Setup"
space: wiki
tags: ["user","system","hardware","software"]
source: migrated-from-obsidian
---

# System Setup

Migrated from Obsidian `System Setup/` on 2026-04-06.

## Machine (FerrissesWheel)

| Spec | Value |
|------|-------|
| CPU | AMD Ryzen 7 6800H (8c/16t) |
| RAM | 28 GB DDR5 |
| Storage | 887 GB NVMe (11% used) |
| OS | KDE neon (Ubuntu 24.04 base) |
| Kernel | 6.17.0-19-generic |
| Node | v22.22.1 (nvm) |
| Python | 3.12.3 |
| Elixir | 1.17.3 / OTP 27 |
| KVM/QEMU | 8.2.2 with libvirt 10.0.0 |

## Agent-VM (192.168.122.10)

| Spec | Value |
|------|-------|
| Type | libvirt KVM guest |
| RAM | 14 GB |
| vCPUs | 6 |
| Network | virbr0 NAT |
| Access | SSH `agent-vm` or `trajan@192.168.122.10` |

## Data Flow

```
Session starts → reads CLAUDE.md → searches QMD/EMA vault → reads project context
  → Work happens
  → Session ends → writes session log → updates project note → brain dumps captured
  → EMA indexes vault (FTS5) → QMD reindexes (cron 30m)
  → Next session starts richer
```

## Related
- [[Infrastructure]]
- [[Claude Code Setup]]

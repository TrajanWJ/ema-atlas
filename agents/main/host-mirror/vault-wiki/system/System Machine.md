---
type: knowledge
wiki_id: system/System_Machine
imported_from: vault/System/System Machine.md
imported_at: '2026-04-04T00:23:57.266Z'
tags: []
summary: ''
---
# System Machine

> Hardware, OS, and runtime environment.
> Last verified: 2026-04-01

---

## Hardware

| Field | Value |
|---|---|
| **CPU** | AMD Ryzen 7 6800H with Radeon Graphics (8 cores / 16 threads) |
| **RAM** | 28 GB DDR5 |
| **Disk** | 87 GB (68 GB used, 19 GB free — 79% used) |
| **Hostname** | FerrissesWheel |

## OS

| Field | Value |
|---|---|
| **Distro** | KDE neon User Edition |
| **Base** | Ubuntu 24.04 |
| **Kernel** | Linux 6.8.0-106-generic |
| **Shell** | bash |
| **User** | trajan |

## Node.js

| Field | Value |
|---|---|
| **System node** | v22.22.1 (`/usr/bin/node`) |
| **nvm node** | v22.22.1 (`/home/trajan/.nvm/versions/node/v22.22.1/bin/node`) |
| **nvm dir** | `/home/trajan/.nvm/` |
| **Active version** | v22.22.1 (used by QMD and all services) |

**Important:** System node (`/usr/bin/node`) and nvm node (`~/.nvm/...`) are both v22.22.1. Services may use either path. The QMD cron now uses `/usr/bin/qmd` (system-installed).

## Key Paths

| Path | What | Size |
|---|---|---|
| `~/vault/` | Obsidian vault | 243 MB |
| `~/Desktop/Coding/Projects/` | Project directories | — |
| `~/.claude/` | Claude Code config, plugins, memory | 510 MB |
| `~/.nvm/versions/node/v22.22.1/` | Node runtime | — |
| `~/.codegraphcontext/` | FalkorDB graph database | 1.5 MB |

## Virtualization (KVM/QEMU)

| Field | Value |
|---|---|
| **Hypervisor** | KVM via QEMU 8.2.2 |
| **Management** | libvirt 10.0.0 (libvirtd) |
| **CLI** | `virsh`, `virt-install` |
| **GUI** | `virt-manager`, `virt-viewer` |
| **Default network** | `virbr0` (NAT, autostart enabled) |
| **User groups** | `trajan` added to `libvirt` and `kvm` |
| **Installed** | 2026-03-12 |

## LAN Access

| Service | Address |
|---|---|
| obsidian-claude-code-mcp | `ws://localhost:22360` |

The LAN IP `172.31.255.217` is assigned to the primary interface. IPv6 addresses are also available but not used by any services.

#system #machine #environment

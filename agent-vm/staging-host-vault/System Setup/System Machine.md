# System Machine

> Hardware, OS, and runtime environment.
> Last verified: 2026-03-11

---

## Hardware

| Field | Value |
|---|---|
| **CPU** | AMD Ryzen 7 6800H with Radeon Graphics (8 cores / 16 threads) |
| **RAM** | 28 GB DDR5 |
| **Disk** | 887 GB NVMe (90 GB used, 752 GB free — 11% used) |
| **Hostname** | FerrissesWheel |

## OS

| Field | Value |
|---|---|
| **Distro** | KDE neon User Edition |
| **Base** | Ubuntu 24.04 |
| **Kernel** | Linux 6.17.0-14-generic |
| **Shell** | bash |
| **User** | trajan |

## Node.js

| Field | Value |
|---|---|
| **System node** | v20.20.0 (`/usr/bin/node`) |
| **nvm node** | v22.22.1 (`/home/trajan/.nvm/versions/node/v22.22.1/bin/node`) |
| **nvm dir** | `/home/trajan/.nvm/` |
| **Active version** | v22.22.1 (used by QMD and all services) |

**Important:** System node (v20) and nvm node (v22) coexist. All services and cron jobs use full paths to the v22 binary. Claude Code itself uses whatever `node` resolves to in the shell (currently v20 via `/usr/bin/node`).

## Key Paths

| Path | What | Size |
|---|---|---|
| `~/Documents/obsidian_first_stuff/twj1/` | Obsidian vault | 4.2 MB |
| `~/Desktop/Coding/Projects/` | Project directories | — |
| `~/.claude/` | Claude Code config, plugins, memory | 1.3 GB |
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

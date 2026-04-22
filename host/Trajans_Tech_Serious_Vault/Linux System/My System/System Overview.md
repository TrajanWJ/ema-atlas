---
tags:
  - my-system
  - hardware
  - linux
created: 2026-03-13
---

# System Overview

Trajan's primary Linux workstation — a high-performance AMD laptop running KDE Neon.

## Operating System

| Component | Value |
|-----------|-------|
| **Distro** | KDE Neon User Edition 24.04 (Noble) |
| **Desktop** | [[KDE Plasma Overview\|KDE Plasma]] 6.6.2 (built on [[KDE Frameworks]]) |
| **Session** | [[Wayland vs X11\|Wayland]] |
| **Kernel** | Linux 6.17.0-19-generic (PREEMPT_DYNAMIC) |
| **Hostname** | FerrissesWheel |

## Hardware

| Component | Details |
|-----------|---------|
| **CPU** | AMD Ryzen 7 6800H — 8 cores / 16 threads, up to 4.8 GHz |
| **GPU** | AMD Radeon 680M (Rembrandt) — integrated RDNA 2 |
| **RAM** | 27 GiB (DDR5) |
| **Storage** | 887 GiB NVMe — 140 GiB used (17%), 702 GiB free |
| **Swap** | 29 GiB (rarely used) |

## Display Setup

Dual monitor — see [[Monitor Setup]] for full details.

| Monitor | Resolution | Refresh | Connection | Position |
|---------|-----------|---------|------------|----------|
| **Right** (primary) | 2560x1440 | 60 Hz | HDMI-A-1 | +1920+0 |
| **Left** | 1920x1080 | 60 Hz | DP-4 | +0+220 |

Combined desktop: **4480x1440** @ 1x scale on both.

## Key System Characteristics

- **AMD all-in-one** — CPU + integrated GPU, excellent Linux/Wayland support
- **No discrete GPU** — simpler [[Power Management|power management]], no hybrid graphics complexity
- **Generous storage** — 702 GiB free, room for development, VMs, gaming
- **PREEMPT_DYNAMIC kernel** — good for interactive desktop + development workloads
- **[[Baloo File Indexer]]** — file search indexing (configured for basic indexing)

## Startup

- [[Autologin Configuration|Autologin]] to user `trajan` via SDDM
- [[Monitor Setup|Monitor color correction]] bootstrapped into startup
- See [[Autologin Configuration]] for full details

## See Also

- [[Monitor Setup]]
- [[Autologin Configuration]]
- [[KDE Plasma Overview]]
- [[Hardware Specs]]
- [[KDE Frameworks]]
- [[Power Management]]

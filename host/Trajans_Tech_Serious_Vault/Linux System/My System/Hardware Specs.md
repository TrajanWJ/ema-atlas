---
tags:
  - my-system
  - hardware
  - reference
created: 2026-03-13
---

# Hardware Specs

Detailed hardware specifications for [[System Overview|Trajan's workstation]].

## CPU — AMD Ryzen 7 6800H

| Spec | Value |
|------|-------|
| Architecture | Zen 3+ (Rembrandt) |
| Cores / Threads | 8 / 16 |
| Base Clock | 3.2 GHz |
| Boost Clock | 4.787 GHz |
| TDP | 45W |
| Process | 6nm (TSMC) |
| Cache | 16 MB L3 + 4 MB L2 |
| iGPU | [[#GPU — AMD Radeon 680M|Radeon 680M]] |

## GPU — AMD Radeon 680M

| Spec | Value |
|------|-------|
| Architecture | RDNA 2 (integrated) |
| Compute Units | 12 |
| Clock | Up to 2.2 GHz |
| Driver | amdgpu (open source, in-kernel) — used by [[KWin]] compositor |
| Vulkan | ✅ Supported |
| OpenGL | ✅ 4.6 |
| [[Wayland vs X11\|Wayland]] | ✅ Excellent support |
| HDR | Hardware capable, monitors are not |
| VRR | Hardware capable, monitors are not |

The Radeon 680M is one of the strongest integrated GPUs — capable of light-to-medium gaming at 1080p. See [[Color Management]] for ICC profile support.

## Memory

| Spec | Value |
|------|-------|
| Total | 27 GiB |
| Type | DDR5 (soldered, laptop) |
| Typical Usage | ~5.6 GiB idle with KDE |
| Available | ~21 GiB |
| Swap | 29 GiB (on NVMe, rarely used) |

## Storage

| Spec | Value |
|------|-------|
| Device | NVMe SSD (`/dev/nvme0n1p2`) |
| Total | 887 GiB |
| Used | 140 GiB (17%) |
| Free | 702 GiB |
| Filesystem | ext4 (likely) |

## Displays

See [[Monitor Setup]] for configuration details.

| Output | Panel | Resolution | Connection |
|--------|-------|-----------|------------|
| HDMI-A-1 | 596×335mm (~27") | 2560×1440 | HDMI |
| DP-4 | 530×300mm (~24") | 1920×1080 | DisplayPort |

Neither monitor supports HDR or VRR.

## See Also

- [[System Overview]]
- [[Monitor Setup]]
- [[Gaming on KDE]]
- [[Power Management]]
- [[Multi-Monitor Setup]]

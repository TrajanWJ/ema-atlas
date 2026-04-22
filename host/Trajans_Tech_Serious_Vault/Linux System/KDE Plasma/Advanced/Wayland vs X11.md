---
tags:
  - kde
  - wayland
  - x11
  - display-server
created: 2026-03-13
---

# Wayland vs X11 on KDE Plasma

[[KDE Plasma Overview|KDE Plasma 6]] defaults to **Wayland**. X11 session will be dropped in Plasma 6.8; X11 support maintained until early 2027.

## Current State (2026)

| Aspect | Wayland | X11 |
|--------|---------|-----|
| **Default since** | Plasma 6.0 (Feb 2024) | Legacy |
| **Adoption** | 70%+ of Plasma users | Declining |
| **Future** | Active development | Dropping in 6.8 |
| **HDR** | ✅ Supported | ❌ No |
| **VRR/Adaptive Sync** | ✅ Supported | Limited |
| **Per-display fractional scaling** | ✅ Native | ❌ No (global only) |
| **Multi-monitor** | ✅ Superior | Basic |
| **[[Color Management|Color management]]** | ✅ Per-display ICC | Limited |
| **Gaming performance** | Equal or better (Ubuntu 25.04 benchmarks) | Baseline |
| **NVIDIA proprietary** | ✅ Now works well | ✅ Mature |
| **Screen sharing** | ✅ Via PipeWire/xdg-desktop-portal | ✅ Native |
| **Legacy X11 apps** | Via XWayland (automatic) | Native |

## Wayland Advantages

1. **Security** — apps can't keylog or screenshot each other
2. **HDR support** — actively developed, see KDE blog series
3. **Per-display scaling** — different DPI per monitor
4. **Smoother compositing** — direct rendering, no tearing (handled by [[KWin]])
5. **Better multi-monitor** — independent refresh rates possible

## Remaining Wayland Limitations

- Some niche apps still need XWayland
- Screen recording requires PipeWire (not a problem on modern distros)
- Some remote desktop tools have limited support
- Custom X11 scripts (xdotool, xrandr) need Wayland alternatives

## Trajan's System

Currently running **Wayland** on [[System Overview|KDE Neon 24.04]] with AMD Radeon 680M — optimal Wayland support. [[KWin]] serves as the Wayland compositor, and [[Plasma Shell]] provides the desktop environment on top of it. See [[Configuration Files]] for relevant config paths.

## See Also

- [[Multi-Monitor Setup]]
- [[Color Management]]
- [[Gaming on KDE]]
- [[System Overview]]
- [[KWin]]
- [[Power Management]]

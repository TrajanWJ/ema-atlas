---
tags:
  - kde
  - multi-monitor
  - display
created: 2026-03-13
---

# Multi-Monitor Setup on KDE

[[KDE Plasma Overview|KDE Plasma]] handles multi-monitor well, especially on [[Wayland vs X11|Wayland]]. [[KWin]] is the compositor responsible for display management.

## Configuration

**System Settings → Display and Monitor → Display Configuration** (kcm_kscreen)

| Setting | Options |
|---------|---------|
| Arrangement | Drag monitors to set physical layout |
| Primary display | Click star icon on a monitor |
| Resolution | Per-display |
| Refresh rate | Per-display |
| Scale | Per-display fractional scaling (Wayland) |
| Rotation | 0°, 90°, 180°, 270° |
| HDR | Per-display (Wayland, if supported) |

## KScreen Config Files

```
~/.config/kscreen/
~/.local/share/kscreen/
```

Monitor configurations saved as JSON, keyed by connected displays. KDE auto-applies the correct config when displays connect/disconnect.

## Wayland vs X11 Multi-Monitor

| Feature | Wayland | X11 |
|---------|---------|-----|
| Per-display scaling | ✅ Native fractional | ❌ Global only |
| Per-display refresh rate | ✅ Independent | ❌ Shared |
| Per-display [[Color Management|ICC profiles]] | ✅ Plasma 6.1+ | Limited |
| VRR per-display | ✅ | ❌ |

## Best Practices

1. Use **Wayland** for multi-monitor — strictly superior
2. Set fractional scaling per display if needed
3. Configure ICC profiles per monitor for [[Color Management|color accuracy]]
4. Use [[Virtual Desktops and Activities|Activities]] to manage different monitor use cases
5. Panel placement — put [[Panels and Widgets|panels]] on your primary monitor

## Trajan's Monitor Layout

See [[Monitor Setup]] (and [[Hardware Specs]] for display hardware) for current dual-monitor configuration. Consider [[Konsave Backup]] to save your monitor layout:
- **Left**: DP-4 — 1920x1080 @ 60Hz (offset +0+220)
- **Right**: HDMI-A-1 — 2560x1440 @ 60Hz (primary, offset +1920+0)

## See Also

- [[Monitor Setup]]
- [[Color Management]]
- [[Wayland vs X11]]
- [[Configuration Files]]
- [[KWin]]
- [[Panels and Widgets]]

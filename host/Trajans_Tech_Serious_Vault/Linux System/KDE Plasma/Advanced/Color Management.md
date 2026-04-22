---
tags:
  - kde
  - color-management
  - icc
  - display
created: 2026-03-13
---

# Color Management on KDE

Color management ensures accurate color reproduction across displays. Critical for design work and multi-monitor setups with different panel types. Part of the broader [[Theming System]] and dependent on [[Hardware Specs|display hardware]].

## KDE Color Management Tools

| Tool | Purpose |
|------|---------|
| **kolor-manager** | KDE color management GUI (Oyranos CMS backend) |
| **System Settings → Display → Color Profile** | Per-display ICC profile assignment |
| **colormgr** | CLI for managing color profiles and devices |

## ICC Profiles

ICC profiles describe a monitor's color characteristics, enabling accurate color rendering.

### Profile Locations

ICC profiles are stored in standard paths (see [[Configuration Files]] for other KDE config locations):

```
~/.local/share/icc/          # User profiles
/usr/share/color/icc/        # System profiles
```

### Assigning Profiles

**System Settings → Display and Monitor → Color Profile** — assign per-display (Plasma 6.1+, [[Wayland vs X11|Wayland]])

### Without ICC Profiles

Wide-gamut displays show **oversaturated colors** without proper ICC profiles. The default sRGB profile is a reasonable fallback for standard monitors.

## HDR (High Dynamic Range)

- **Wayland only** — not supported on X11
- Actively developed — see "HDR and color management in KWin" blog series on planet.kde.org
- Plasma 6.5.3 improved MHC2 ICC tag support for better HDR color accuracy
- Requires HDR-capable monitor (neither of [[Monitor Setup|Trajan's monitors]] support HDR)

## Night Color (Built-in Blue Light Filter)

[[KWin]] includes **Night Color** — a built-in blue light filter:
- System Settings → Display and Monitor → Night Color
- Scheduled (sunrise/sunset or custom times) or manual toggle
- **No need for Redshift or f.lux** on KDE

## Trajan's Color Setup

See [[Monitor Setup]] — both monitors currently using sRGB, no ICC profiles, no HDR capability. Color correction and startup bootstrap documented there.

## See Also

- [[Monitor Setup]]
- [[Multi-Monitor Setup]]
- [[Wayland vs X11]]
- [[KWin]]
- [[Configuration Files]]

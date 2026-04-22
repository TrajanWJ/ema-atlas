---
tags:
  - my-system
  - monitors
  - color-correction
  - startup
created: 2026-03-13
---

# Monitor Setup

Dual-monitor configuration on [[System Overview|Trajan's workstation]], managed by [[KWin]] on [[Wayland vs X11|Wayland]]. Includes color correction and startup bootstrap.

## Current Layout

```
┌──────────────┐ ┌───────────────────┐
│              │ │                   │
│   DP-4       │ │    HDMI-A-1       │
│  1920x1080   │ │   2560x1440       │
│   (left)     │ │  (right/primary)  │
│              │ │                   │
└──────────────┘ └───────────────────┘
  +0+220           +1920+0
```

Combined desktop: **4480x1440**

## Monitor Details

| Property | Left (DP-4) | Right (HDMI-A-1) |
|----------|-------------|-------------------|
| Resolution | 1920×1080 | 2560×1440 |
| Refresh Rate | 60.00 Hz | 60.01 Hz |
| Connection | DisplayPort | HDMI |
| Physical Size | 530×300mm (~24") | 596×335mm (~27") |
| Scale | 1x | 1x |
| Position | +0+220 | +1920+0 |
| Primary | No | **Yes** |
| VRR | ❌ Incapable | ❌ Incapable |
| HDR | ❌ Incapable | ❌ Incapable |
| Wide Color Gamut | ❌ Incapable | ❌ Incapable |
| Color Profile | sRGB | sRGB |
| Color Resolution | Auto (10-bit range 8-16) | Auto (10-bit range 8-16) |
| ICC Profile | None | None |

## Vertical Offset

The left monitor is offset **+220 pixels down** (`+0+220`) to align with the taller 1440p right monitor. This means the tops of the monitors are not aligned — the 1080p monitor sits lower to match the bottom edges.

## Color Correction Fix

> **TODO**: Run `capture-kde-config.sh` to capture the actual color correction scripts and startup configuration. Document here once captured.

The left monitor required color correction to match the right monitor's color output. This was fixed and **bootstrapped into startup** so it applies automatically on every login.

### What to Document (after running capture script)

- [ ] Exact color correction method (ICC profile? gamma script? KWin Night Color per-monitor?)
- [ ] Startup script location (`~/.config/plasma-workspace/env/` or `~/.config/autostart/`)
- [ ] Script contents
- [ ] How it was debugged and fixed

## KScreen Configuration

Monitor layout persisted in:
```
~/.config/kscreen/
~/.local/share/kscreen/
```

KDE auto-saves and auto-applies monitor configurations when displays connect/disconnect. See [[Configuration Files]] for other KDE config paths, and [[Panels and Widgets]] for panel placement on multiple displays.

## See Also

- [[System Overview]]
- [[Hardware Specs]]
- [[Color Management]]
- [[Multi-Monitor Setup]]
- [[Autologin Configuration]]
- [[Wayland vs X11]]
- [[Configuration Files]]

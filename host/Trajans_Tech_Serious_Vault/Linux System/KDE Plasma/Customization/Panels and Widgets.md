---
tags:
  - kde
  - panels
  - widgets
  - customization
created: 2026-03-13
---

# Panels and Widgets

[[Plasma Shell]] panels are the primary UI containers in [[KDE Plasma Overview|KDE Plasma]]. Widgets (plasmoids) live inside panels or on the desktop.

## Panel Management

| Action | How |
|--------|-----|
| Add panel | Right-click desktop → Add Panel |
| Edit panel | Right-click panel → Show Panel Configuration |
| Floating panel | Edit mode → More Options → Floating (**default in Plasma 6**) |
| Auto-hide | Edit mode → More Options → Auto-hide |
| Panel position | Drag to any screen edge |

### Floating Panel Behavior
- Floating panels have rounded corners and a gap from screen edge
- **Auto-reverts to solid** when a window is maximized (seamless integration)
- This is the default in Plasma 6 — Latte Dock is no longer needed

### Latte Dock Status
**Latte Dock is discontinued** — incompatible with Plasma 6/[[KWin]] 6. The native floating panel is the replacement. No comparable third-party dock exists for Plasma 6 yet.

## Widget Placement

- **In panels**: drag widgets in edit mode; use **Flexible Spacer** widgets to center items — see [[Must-Have Widgets]] for recommendations
- **On desktop**: right-click desktop → Add Widgets
- Widget config stored in `~/.config/plasma-org.kde.plasma.desktop-appletsrc`

## Panel Config File

```
~/.config/plasmashellrc
```

## Popular Panel Layouts

### macOS-style
- Top panel: Global Menu + Flexible Spacer + Digital Clock + Flexible Spacer + System Tray
- Bottom panel (or floating): Icons-only Task Manager (centered)

### Windows-style
- Bottom panel: App Launcher + Task Manager + System Tray + Clock

### Minimal
- Top panel: Window Title (left) + Virtual Desktop Pager (center) + System Tray + Clock (right)

## See Also

- [[Must-Have Widgets]]
- [[Plasma Shell]]
- [[Configuration Files]]
- [[KRunner]]
- [[KWin Scripts and Tiling]]
- [[Keyboard Shortcuts]]
- [[Theming System]]

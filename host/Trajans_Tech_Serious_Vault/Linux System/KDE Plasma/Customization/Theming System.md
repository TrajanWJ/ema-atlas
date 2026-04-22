---
tags:
  - kde
  - theming
  - customization
created: 2026-03-13
---

# KDE Plasma Theming System

[[KDE Plasma Overview|KDE Plasma]] has a layered theming system managed by [[Plasma Shell]] and [[KWin]]. Understanding the layers is key to consistent customization.

## Theme Layer Hierarchy (outer → inner)

```
Global Theme (Look and Feel)
  ├── Plasma Style — [[Panels and Widgets|panels, widgets]], OSD, lock screen
  │     └── Color Scheme — UI element colors (INI format)
  ├── Window Decorations — Aurorae (SVG) or KDecoration2 (C++), managed by [[KWin]]
  ├── Icon Theme — Freedesktop spec
  ├── Cursor Theme
  ├── Application Style — Qt widget rendering
  │     └── Kvantum Engine — CSS-like Qt Style Sheets
  ├── Splash Screen
  └── Lock Screen Theme
```

## Layer Details

| Layer | What It Controls | Config Location |
|-------|-----------------|-----------------|
| **Global Theme** | Sets all layers at once | System Settings → Appearance → Global Theme |
| **Plasma Style** | Panel look, widget backgrounds, OSD | System Settings → Appearance → Plasma Style |
| **Color Scheme** | All UI colors (buttons, text, highlights) | `~/.local/share/color-schemes/` |
| **Window Decorations** | Titlebar buttons, borders, shadows | System Settings → Appearance → Window Decorations |
| **Icon Theme** | All app and system icons | Freedesktop icon spec |
| **Cursor Theme** | Mouse cursor appearance | System Settings → Appearance → Cursors |
| **Application Style** | Qt widget rendering (buttons, inputs) | System Settings → Appearance → Application Style |
| **Splash Screen** | Boot splash after login | Part of Global Theme |

## Key Insight

A **Global Theme** is just a bundle that sets multiple layers. You can mix and match:
- Use Dracula's color scheme with Nordic's Plasma Style
- Use Klassy window decorations with any theme
- Use [[Kvantum Engine]] for application style while keeping Breeze for Plasma Style

## Installing Themes

1. **System Settings → Appearance → Global Theme → Get New Global Themes**
2. **KDE Store**: [store.kde.org](https://store.kde.org)
3. **Manual**: extract to appropriate `~/.local/share/` subdirectory

See [[Top Themes]] for curated recommendations.

## GTK App Theming

For GTK apps (Firefox, GIMP, etc.) on KDE:
- System Settings → Appearance → Application Style → Configure GNOME/GTK Application Style
- Or install a matching GTK theme manually

## See Also

- [[Top Themes]]
- [[Kvantum Engine]]
- [[Configuration Files]]
- [[KDE Plasma Overview]]
- [[Panels and Widgets]]
- [[Resources and Community]]

---
tags:
  - kde
  - configuration
  - reference
created: 2026-03-13
---

# KDE Configuration Files

All [[KDE Plasma Overview|KDE Plasma]] configuration uses INI-style files. User config **always overrides** system config. `$KDEHOME` can override the user-level KDE home.

## File Hierarchy

| File | Controls |
|------|----------|
| `~/.config/plasmashellrc` | [[Plasma Shell]] — [[Panels and Widgets\|Panels]], wallpaper, widget positions |
| `~/.config/plasma-org.kde.plasma.desktop-appletsrc` | Desktop applet/widget layout |
| `~/.config/kwinrc` | [[KWin]] compositor, effects, virtual desktops, window rules |
| `~/.config/kglobalshortcutsrc` | [[Keyboard Shortcuts\|Global keyboard shortcuts]] |
| `~/.config/kdeglobals` | Global appearance — [[Theming System\|theme]], colors, fonts |
| `~/.config/baloofilerc` | [[Baloo File Indexer]] config |
| `~/.config/krunnerrc` | [[KRunner]] runner config |
| `~/.config/klipperrc` | Clipboard manager (Klipper) config |
| `~/.config/kscreenlockerrc` | Screen locker settings |
| `~/.config/kcminputrc` | Input device config (mouse, touchpad) |
| `~/.config/plasmarc` | Plasma theme selection |
| `~/.config/Kvantum/` | [[Kvantum Engine]] themes |

## Custom Content Locations

| Path | Content |
|------|---------|
| `~/.local/share/plasma/plasmoids/` | Installed [[Must-Have Widgets\|widgets]] |
| `~/.local/share/kwin/scripts/` | [[KWin Scripts and Tiling\|KWin scripts]] |
| `~/.local/share/plasma/look-and-feel/` | Global themes |
| `~/.local/share/color-schemes/` | Color schemes |
| `~/.local/share/aurorae/themes/` | Window decoration themes |
| `~/.local/share/konsole/` | Konsole profiles |
| `~/.local/share/icc/` | ICC color profiles |

## System-Wide Defaults

```
/etc/xdg/
```

User config in `~/.config/` overrides these.

## Backup & Restore

See [[Konsave Backup]] for tools to save/restore entire KDE configurations.

Key directories to back up:
- `~/.config/` — all config files
- `~/.local/share/` — custom themes, widgets, scripts
- `~/.themes/` and `~/.icons/` — GTK themes and icons

## See Also

- [[KDE Plasma Overview]]
- [[Konsave Backup]]
- [[Theming System]]
- [[Autologin Configuration]]
- [[Plasma Shell]]
- [[KWin]]
- [[Keyboard Shortcuts]]

---
tags:
  - kde
  - widgets
  - extensions
  - reference
created: 2026-03-13
---

# Must-Have KDE Plasma Widgets

Essential plasmoids for [[KDE Plasma Overview|KDE Plasma 6]]. Install via System Settings → Add Widgets → Get New Widgets, or from [store.kde.org/browse?cat=418](https://store.kde.org/browse?cat=418).

## Built-in (Already Installed)

| Widget | Function |
|--------|----------|
| **System Monitor** | CPU/RAM/network/disk — configurable sensor faces (pie, bar, line, text) |
| **Digital Clock** | Customizable clock with calendar popup |
| **System Tray** | Notification area, status icons, expandable |
| **Klipper** | Clipboard history — up to 2,048 items, regex actions, QR codes |
| **Task Manager** | Window list — icons-only or with text |
| **Application Launcher** | Kickoff (default) or Application Menu (classic) |
| **Pager** | [[Virtual Desktops and Activities|Virtual desktop]] switcher in panel |
| **Network Manager** | WiFi/VPN/Ethernet applet |
| **[[KDE Connect]] Indicator** | Phone status, notifications, file sharing |
| **Media Controller** | MPRIS2 playback controls for any media player |
| **Flexible Spacer** | Dynamic panel spacing — essential for centering widgets |

## Must-Install from KDE Store

| Widget | Function | Source |
|--------|----------|--------|
| **Thermal Monitor** | CPU/GPU temperatures in panel | [github:olib14/thermalmonitor](https://github.com/olib14/thermalmonitor) |
| **Event Calendar** | Calendar + Google Calendar sync + weather integration | [zren.github.io](https://zren.github.io) |
| **Window Title** | Shows active window title in panel — great for global menu setups |
| **Plasma Drawer** | Slide-out app drawer (alternative launcher) |
| **Netspeed** | Real-time network speed in panel |
| **Resources Monitor** | Compact CPU/RAM/swap bar in panel |

## Klipper Deep Dive

The clipboard manager deserves special mention:

| Feature | Detail |
|---------|--------|
| History size | Up to 2,048 items |
| Regex actions | Text matching `^https?://` → auto-offer to open browser |
| QR codes | Generate QR for any clipboard item |
| File/folder support | Copied paths stay in history |
| Shortcut | `Ctrl+Alt+V` (configurable) |
| Config | `~/.config/klipperrc` |

## Widget Installation Path

Custom widgets install to:
```
~/.local/share/plasma/plasmoids/
```

## See Also

- [[Panels and Widgets]]
- [[KDE Connect]]
- [[KRunner]]
- [[Configuration Files]]
- [[Theming System]]
- [[Virtual Desktops and Activities]]

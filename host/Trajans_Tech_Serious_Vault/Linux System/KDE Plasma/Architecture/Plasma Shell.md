---
tags:
  - kde
  - plasma
  - architecture
created: 2026-03-13
---

# Plasma Shell

The **desktop shell** layer of [[KDE Plasma Overview|KDE Plasma]]. Handles panels, the desktop canvas, widgets, [[Virtual Desktops and Activities|Activities]], and notifications.

## Role in the Stack

| Layer | Component |
|-------|-----------|
| GUI Framework | Qt 6 |
| KDE Frameworks | [[KDE Frameworks|KF6]] (~80 libraries) |
| Window Manager | [[KWin]] |
| **Desktop Shell** | **Plasma Shell** ← this |

Plasma Shell is built with **QML + C++** — QML for the UI, C++ for performance-critical backends.

## What Plasma Shell Controls

- **Panels** — top/bottom/side bars containing [[Must-Have Widgets|widgets]]
- **Desktop canvas** — wallpapers, desktop widgets, folder views
- **System tray** — notification area, status icons
- **Notifications** — popup notifications, progress bars, actions
- **[[Virtual Desktops and Activities|Activities]]** — full context switching (separate wallpaper, widgets, app assignments per activity)
- **Lock screen** — visual layer (authentication handled by PAM/SDDM)
- **Application launcher** — Kickoff, Application Menu, or [[KRunner]]

## Configuration

Primary config file:
```
~/.config/plasmashellrc
```

Stores: panel positions, widget placements, wallpaper settings, desktop containments.

Panel/widget layout:
```
~/.config/plasma-org.kde.plasma.desktop-appletsrc
```

## Relationship to KWin

Plasma Shell and [[KWin]] are separate processes:
- **Plasma Shell** = what you see (panels, widgets, desktop)
- **[[KWin]]** = how windows behave (tiling, effects, compositing)

On [[Wayland vs X11|Wayland]], KWin is also the compositor, but Plasma Shell still runs as its own process communicating via [[D-Bus Scripting|D-Bus]].

## See Also

- [[KDE Plasma Overview]]
- [[KWin]]
- [[Panels and Widgets]]
- [[Configuration Files]]
- [[Must-Have Widgets]]
- [[Virtual Desktops and Activities]]
- [[Theming System]]

---
tags:
  - kde
  - architecture
  - moc
created: 2026-03-13
---

# KDE Plasma Architecture

How [[KDE Plasma Overview|KDE Plasma]] is built — the components, their roles, and how they communicate.

## Core Components

```
┌─────────────────────────────────────────┐
│              Plasma Shell               │
│   (panels, widgets, desktop, Activities)│
├─────────────────────────────────────────┤
│                 KWin                    │
│  (window management, compositing,      │
│   effects, tiling, Wayland compositor)  │
├─────────────────────────────────────────┤
│           KDE Frameworks (KF6)         │
│      (~80 add-on libraries on Qt 6)    │
├─────────────────────────────────────────┤
│                  Qt 6                   │
│          (GUI framework base)           │
└─────────────────────────────────────────┘
```

## Notes

| Note | What You'll Learn |
|------|-------------------|
| [[Plasma Shell]] | The desktop layer — what you see (panels, widgets, notifications) |
| [[KWin]] | The window layer — how windows behave (tiling, effects, compositing) |
| [[KDE Frameworks]] | The library layer — 80+ modules powering everything |
| [[Configuration Files]] | Where all settings live — file paths, hierarchy, backup |
| [[D-Bus Scripting]] | How to automate KDE via inter-process communication |

## Key Relationships

- [[Plasma Shell]] and [[KWin]] are **separate processes** — Shell handles visuals, KWin handles windows
- On [[Wayland vs X11|Wayland]], [[KWin]] doubles as the compositor
- [[KDE Frameworks]] provides the API for both [[Plasma Shell]] widgets and [[KWin Scripts and Tiling|KWin scripts]]
- All components communicate via [[D-Bus Scripting|D-Bus]]
- All configuration uses INI-style files — see [[Configuration Files]]

## See Also

- [[KDE Plasma Overview]] — main index
- [[Customization Index]] — theming and personalization
- [[Extensions Index]] — widgets, scripts, plugins

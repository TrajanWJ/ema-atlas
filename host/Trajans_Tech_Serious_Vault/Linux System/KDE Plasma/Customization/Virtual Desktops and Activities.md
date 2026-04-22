---
tags:
  - kde
  - virtual-desktops
  - activities
  - workflow
created: 2026-03-13
---

# Virtual Desktops and Activities

[[KDE Plasma Overview|KDE Plasma]] offers two levels of workspace organization — most users only know about Virtual Desktops, but Activities are the real power feature.

## Virtual Desktops vs Activities

| Feature | Virtual Desktops | Activities |
|---------|-----------------|------------|
| **Analogy** | Multiple monitors on one desk | Switching to a different desk entirely |
| **Scope** | Group apps within a context | Full context switch |
| **Per-activity VDs** | N/A | Each Activity has its own VD set |
| **Separate wallpaper** | No | Yes |
| **Separate widgets** | No | Yes |
| **App assignment** | Windows move between VDs | Apps can be pinned to Activities |
| **Use case** | Organize open apps | Separate life contexts |

**Activities are a superset of Virtual Desktops.**

## Activity Workflow Setup

Create activities for different contexts:

| Activity | Purpose | Example Apps |
|----------|---------|-------------|
| **Work** | Development, email | VS Code, browser, terminal |
| **Personal** | Social, media | Browser, Discord, music |
| **Creative** | Design, writing | GIMP, Obsidian, reference browser |
| **Gaming** | Games | Steam, Discord, MangoHud |

### Setting Up Activities

1. **Create**: System Settings → Workspace Behavior → Activities → Create New
2. **Custom wallpaper/widgets**: Each activity gets its own desktop canvas — configure via [[Panels and Widgets]] and [[Must-Have Widgets]]
3. **Assign apps**: [[KWin]] Rules → Activity field → pin apps to specific activities
4. **Switch**: [[KRunner]] (type activity name) or `Meta+Tab`

## KWin Window Rules for Activities

System Settings → Window Management → Window Rules:
- Open specific apps on specific Activities automatically
- Force window size/position per Activity
- Set opacity, skip taskbar, always-on-top per app

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Meta+Tab` | Switch Activity |
| `Ctrl+F1-F4` | Switch Virtual Desktop 1-4 |
| `Meta+1-4` | Switch to VD (customizable) |

## See Also

- [[KWin]]
- [[Keyboard Shortcuts]]
- [[KDE Plasma Overview]]
- [[KWin Scripts and Tiling]]
- [[D-Bus Scripting]]

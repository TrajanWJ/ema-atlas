---
tags:
  - kde
  - shortcuts
  - customization
created: 2026-03-13
---

# Keyboard Shortcuts

[[KDE Plasma Overview|KDE Plasma]] has a comprehensive, fully customizable keyboard shortcut system.

## Configuration

**System Settings → Shortcuts** — three sections:
1. **Global Shortcuts** — system-wide ([[KWin]], [[Plasma Shell]], media keys)
2. **Standard Shortcuts** — app-level defaults (copy, paste, etc.)
3. **Custom Shortcuts** — user-defined command bindings

### Custom Shortcuts
Edit → New → Global Shortcut → Command/URL → assign key combo + command

## Config File

```
~/.config/kglobalshortcutsrc
```

KCM communicates with a daemon via [[D-Bus Scripting|D-Bus]] for real-time shortcut registration.

## Essential Default Shortcuts

| Shortcut | Action |
|----------|--------|
| `Meta` | Open Application Launcher |
| `Alt+Space` or `Alt+F2` | Open [[KRunner]] |
| `Meta+Tab` | Switch [[Virtual Desktops and Activities|Activity]] |
| `Ctrl+F1-F4` | Switch Virtual Desktop |
| `Meta+D` | Show Desktop |
| `Meta+E` | Open Dolphin file manager |
| `Print` | Screenshot ([[Spectacle]]) |
| `Meta+L` | Lock Screen |
| `Ctrl+Alt+Del` | Log Out |
| `Ctrl+Alt+V` | Klipper clipboard history |

## Power User Shortcuts

Bind [[D-Bus Scripting|D-Bus commands]] to shortcuts for automation:

```bash
# Example: bind a shortcut to switch to desktop 3
qdbus org.kde.KWin /KWin setCurrentDesktop 3
```

## See Also

- [[D-Bus Scripting]]
- [[Virtual Desktops and Activities]]
- [[KRunner]]
- [[Configuration Files]]
- [[KWin Scripts and Tiling]]
- [[Spectacle]]
- [[Panels and Widgets]]

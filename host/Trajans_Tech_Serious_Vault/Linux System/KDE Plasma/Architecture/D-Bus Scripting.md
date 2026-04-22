---
tags:
  - kde
  - dbus
  - scripting
  - automation
created: 2026-03-13
---

# D-Bus Scripting on KDE

D-Bus is the inter-process communication system that [[KDE Plasma Overview|KDE Plasma]] components use to talk to each other. You can script almost anything through D-Bus.

## Useful Commands

```bash
# Switch virtual desktop
qdbus org.kde.KWin /KWin setCurrentDesktop 2

# Lock screen
qdbus org.kde.screensaver /ScreenSaver Lock

# Show desktop
qdbus org.kde.KWin /KWin showDesktop

# Open KRunner
qdbus org.kde.krunner /App display

# Load a KWin script
qdbus org.kde.KWin /Scripting loadScript /path/to/script.js

# Send notification
notify-send "Title" "Body"

# List all KDE D-Bus services
qdbus | grep kde
```

## Discovering Interfaces

```bash
# List methods on a service
qdbus org.kde.KWin /KWin

# List all objects in a service
qdbus org.kde.plasmashell
```

## Integration with KWin Scripts

[[KWin]] scripts (JavaScript) can call D-Bus internally. The scripting console (`wm console` in [[KRunner]]) lets you test interactively. D-Bus is also used by [[Plasma Shell]] for panel and widget manipulation.

## kwin-mcp

Notable project: **kwin-mcp** ([github.com/isac322/kwin-mcp](https://github.com/isac322/kwin-mcp)) — an MCP server for AI/script-driven GUI automation on KDE Plasma 6 [[Wayland vs X11|Wayland]] using isolated virtual sessions.

## Use Cases

- Bind custom [[Keyboard Shortcuts|keyboard shortcuts]] to D-Bus commands
- Automate workspace setup (open apps on specific desktops)
- Script [[Virtual Desktops and Activities|Activity]] switching
- Remote control KDE from scripts or other machines
- Build custom system management tools
- Toggle compositing for [[Gaming on KDE|gaming performance]]

## See Also

- [[KWin]]
- [[KWin Scripts and Tiling]]
- [[Keyboard Shortcuts]]
- [[Plasma Shell]]
- [[KDE Plasma Overview]]

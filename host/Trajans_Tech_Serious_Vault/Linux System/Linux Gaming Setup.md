---
tags:
  - gaming
  - linux
  - kde
created: 2026-03-13
---

# Linux Gaming Setup

Gaming configuration for KDE Plasma on Linux. See [[KDE Plasma Knowledge Graph#Gaming on KDE]] for the full reference.

## Key Tools

| Tool | Purpose | Package |
|------|---------|---------|
| **Steam** | Game store and launcher | `steam` |
| **Lutris** | Game manager (Wine, emulators) | `lutris` |
| **MangoHud** | FPS/performance overlay | `mangohud` |
| **GameMode** | CPU/GPU performance optimizer | `gamemode` |

## Launch Options

```bash
# Steam — MangoHud overlay
MANGOHUD=1 %command%

# Steam — GameMode + MangoHud
MANGOHUD=1 gamemoderun %command%

# Lutris — MangoHud
# Set Command prefix: mangohud --dlsym
```

## Notes

- Don't run ananicy-cpp and gamemode together (both modify process niceness)
- Wayland gaming performance now equals or exceeds X11
- For immutable gaming distro, consider Bazzite KDE

## Related Notes

- [[KDE Plasma Knowledge Graph]] — full reference
- [[Gaming on KDE]] — advanced gaming topics
- [[My Stack Decisions]] — overall stack choices

#gaming #linux #kde

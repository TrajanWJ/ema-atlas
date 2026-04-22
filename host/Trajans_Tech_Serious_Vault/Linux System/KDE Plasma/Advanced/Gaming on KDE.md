---
tags:
  - kde
  - gaming
  - steam
  - performance
created: 2026-03-13
---

# Gaming on KDE Plasma

[[KDE Plasma Overview|KDE Plasma]] is excellent for gaming. [[Wayland vs X11|Wayland]] gaming now equals or exceeds X11 performance. [[KWin]] handles compositing and can be tuned for gaming via [[D-Bus Scripting]].

## Steam Launch Options

```bash
# MangoHud overlay (FPS, CPU, GPU stats)
MANGOHUD=1 %command%

# GameMode (CPU governor, scheduler priority)
gamemoderun %command%

# Both combined
MANGOHUD=1 gamemoderun %command%

# Flatpak Steam — global MangoHud
flatpak override --user --env=MANGOHUD=1 com.valvesoftware.Steam
```

## Lutris

- MangoHud: set in "Command prefix" field → `mangohud`
- Environment variables: set in per-game Environment Variables table
- Supports Wine/Proton, native, emulators

## Key Gaming Tools

| Tool | Purpose | Install |
|------|---------|---------|
| **MangoHud** | Performance overlay | `mangohud` package |
| **GameMode** | Auto CPU/GPU optimization | `gamemode` package |
| **ProtonUp-Qt** | Manage Proton-GE versions | Flatpak or AUR |
| **Lutris** | Game launcher/manager | `lutris` package |
| **Heroic** | Epic/GOG launcher | Flatpak |

## Performance Tips

- ⚠️ **Do NOT combine ananicy-cpp + gamemode** — niceness conflict
- Use [[Wayland vs X11|Wayland]] — equal or better gaming performance
- Enable VRR/Adaptive Sync if monitor supports it (System Settings → Display → Adaptive Sync) — see [[Multi-Monitor Setup]] for per-display VRR
- Consider a performance-focused distro kernel (CachyOS, Xanmod)

## Best Gaming Distros with KDE

| Distro | Why |
|--------|-----|
| **Bazzite** | Immutable, pre-configured gaming, Steam Deck compatible |
| **Garuda (Dr460nized)** | Arch-based, performance kernel, aggressive aesthetics |
| **CachyOS** | Performance kernel, Arch-based |

## See Also

- [[Wayland vs X11]]
- [[Power Management]]
- [[System Overview]]
- [[Multi-Monitor Setup]]
- [[Hardware Specs]]

---
tags:
  - kde
  - kwin
  - architecture
  - window-manager
created: 2026-03-13
---

# KWin

The **window manager and compositor** for [[KDE Plasma Overview|KDE Plasma]]. On [[Wayland vs X11|Wayland]] (default since Plasma 6), KWin IS the compositor.

## Responsibilities

- Window placement, movement, resizing, stacking
- Compositing and rendering (OpenGL/Vulkan)
- Desktop effects (blur, wobbly windows, animations)
- [[KWin Scripts and Tiling|Tiling window management]]
- [[Virtual Desktops and Activities|Virtual desktop switching]]
- Window rules and per-app behavior
- [[KWin Scripts and Tiling|KWin scripting]] (JavaScript engine)

## Built-in Effects (Notable)

| Effect | Description |
|--------|-------------|
| Desktop Cube | Restored in Plasma 6 — 3D cube desktop switching |
| Desktop Grid | Overview of all virtual desktops |
| Overview | macOS Mission Control-style window overview |
| Magic Lamp | Minimize animation (genie effect) |
| Wobbly Windows | Jelly-like window movement |
| Blur | Background blur behind transparent windows |
| Night Color | Blue light filter — **built-in, no Redshift needed** — see [[Color Management]] |
| Thumbnail Grid | New default task switcher in Plasma 6 |

## KWin Scripting

KWin scripts are **JavaScript** files running inside KWin's JS engine with two globals:

| Global | Purpose |
|--------|---------|
| `workspace` | Access windows, desktops, activities |
| `options` | Read/write KWin options |

```javascript
// Example: log all window titles
workspace.windowList().forEach(w => {
    console.log(w.caption);
});
```

Scripts location: `~/.local/share/kwin/scripts/`

Install scripts: System Settings → Window Management → KWin Scripts → Get New Scripts

See [[KWin Scripts and Tiling]] for tiling solutions.

## Interactive Console

Open KWin's scripting console via [[KRunner]]:
```
KRunner → type: wm console
```

## Configuration

```
~/.config/kwinrc
```

Stores: compositing settings, effects, virtual desktops, window rules, tiling config.

## D-Bus Interface

```bash
qdbus org.kde.KWin /KWin setCurrentDesktop 2
qdbus org.kde.KWin /KWin showDesktop
qdbus org.kde.KWin /Scripting loadScript /path/to/script.js
```

See [[D-Bus Scripting]] for more.

## See Also

- [[Plasma Shell]]
- [[KWin Scripts and Tiling]]
- [[D-Bus Scripting]]
- [[Wayland vs X11]]
- [[Configuration Files]]
- [[Virtual Desktops and Activities]]
- [[Multi-Monitor Setup]]
- [[Gaming on KDE]]
- [[Color Management]]

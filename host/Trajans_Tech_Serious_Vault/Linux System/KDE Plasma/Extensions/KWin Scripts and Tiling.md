---
tags:
  - kde
  - kwin
  - tiling
  - extensions
created: 2026-03-13
---

# KWin Scripts and Tiling

[[KWin]] supports JavaScript scripting for window management automation. The most popular use case is **tiling window management**.

## Tiling Solutions for Plasma 6

| Script | Status | Approach | Link |
|--------|--------|----------|------|
| **Polonium** | ✅ Active | Enhances KWin's built-in tiling — auto-tiles new windows | [github:zeroxoneafour/polonium](https://github.com/zeroxoneafour/polonium) |
| **Krohnkite** | ✅ Ported to KWin 6 | Dynamic tiling, dwm-inspired | [store.kde.org](https://store.kde.org/p/2144146/) |
| **Bismuth** | ❌ Dead | Plasma 5 only, unmaintained | — |

### Built-in KWin Tiling (Plasma 5.27+)

KWin has basic tiling built-in since Plasma 5.27, but it **doesn't auto-tile new windows**. That's what Polonium fixes.

### Polonium

The recommended tiling solution for Plasma 6:
- Builds on KWin's native tiling mode
- Auto-tiles new windows into the layout
- Multiple layout options (BSP, half, three-column, monocle)
- Configurable per-desktop layouts (see [[Virtual Desktops and Activities]])
- Install: System Settings → Window Management → KWin Scripts → Get New Scripts → search "Polonium"

### Krohnkite Layouts

| Layout | Description |
|--------|-------------|
| BSP | Binary space partitioning |
| Monocle | Fullscreen stacking |
| Three-column | Master + two side columns |
| Stair | Cascading diagonal |
| Spread | Overlapping fan |

## Other KWin Scripts

Install: System Settings → Window Management → KWin Scripts → Get New Scripts. Configure bindings via [[Keyboard Shortcuts]].

Or browse: [store.kde.org/browse?cat=210](https://store.kde.org/browse?cat=210). See also [[Panels and Widgets]] for complementary UI customization and [[Resources and Community]] for more script sources.

## Script Installation Path

```
~/.local/share/kwin/scripts/
```

## Writing Custom KWin Scripts

KWin scripts use JavaScript with two globals:

```javascript
// workspace — access windows, desktops, signals
workspace.windowAdded.connect(function(window) {
    console.log("New window: " + window.caption);
});

// options — read/write KWin options
console.log(options.currentActivity);
```

See [[D-Bus Scripting]] for command-line scripting and [[KWin]] for the interactive console.

## See Also

- [[KWin]]
- [[D-Bus Scripting]]
- [[KDE Plasma Overview]]
- [[Keyboard Shortcuts]]
- [[Resources and Community]]

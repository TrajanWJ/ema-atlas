---
tags:
  - kde
  - glass
  - blur
  - effects
  - customization
created: 2026-03-14
---

# Glassy / Frosted Glass Effects

How to achieve a cohesive frosted glass aesthetic on [[KDE Plasma Overview|KDE Plasma 6]] [[Wayland vs X11|Wayland]].

## The Problem

KWin's built-in blur only works on windows that **explicitly request it** via a KWin hint. Most apps never set this — so enabling "Blur" in Desktop Effects does almost nothing for regular windows. Panels work because [[Plasma Shell]] sets the hint itself.

**Solution:** Replace the stock blur with **kwin-effects-forceblur** + use **[[Kvantum Engine]]** for window transparency + **Klassy** for glassy titlebars.

## Recommended Glassy Stack

| Layer | Component | Role |
|-------|-----------|------|
| **KWin Effect** | kwin-effects-forceblur (taj-ny) | Force blur on ALL windows, static blur, rounded corners |
| **App Style** | [[Kvantum Engine]] + KvGlass theme | Makes app windows transparent |
| **Window Decoration** | Klassy (Glassy preset) | Translucent titlebars with configurable opacity |
| **Plasma Style** | Blur-Glassy Light | Glassy panels and system UI |
| **Color Scheme** | Nord / Catppuccin / Dracula | Dark scheme to let glass show through |
| **Rounded Corners** | Built into forceblur | Fixes blur-bleed-past-corners bug |

## kwin-effects-forceblur — The Key Piece

Replaces the stock blur entirely. **Cannot run alongside stock blur.**

| Feature | Detail |
|---------|--------|
| GitHub | [taj-ny/kwin-effects-forceblur](https://github.com/taj-ny/kwin-effects-forceblur) |
| Plasma 6.4+ | Required (use v1.3.6 for 6.0–6.3.5) |
| Force blur | Blur any window by window class matching |
| Static blur | Pre-computed — dramatically reduces GPU load |
| Rounded corners | Built-in with anti-aliasing |
| Controls | Brightness, contrast, saturation, noise texture |

### Build on KDE Neon

```bash
sudo apt install -y git cmake g++ extra-cmake-modules qt6-tools-dev kwin-dev \
  libkf6configwidgets-dev gettext libkf6crash-dev libkf6globalaccel-dev \
  libkf6kio-dev libkf6service-dev libkf6notifications-dev libkf6kcmutils-dev \
  libkdecorations3-dev libxcb-composite0-dev libxcb-randr0-dev libxcb-shm0-dev

git clone https://github.com/taj-ny/kwin-effects-forceblur
cd kwin-effects-forceblur && mkdir build && cd build
cmake .. -DCMAKE_INSTALL_PREFIX=/usr
make -j$(nproc) && sudo make install
```

Then: System Settings → Desktop Effects → **disable "Blur"** → **enable "Better Blur"**

### Finding Window Classes

```bash
qdbus org.kde.KWin /KWin org.kde.KWin.queryWindowInfo
# click target window → note the resourceClass
```

### ⚠️ Important Caveats

- **Rebuild after KWin updates** — compiles against specific KWin binary, breaks when KDE Neon updates KWin
- **Static blur recommended** — dynamic blur can spike GPU and cause cursor latency on Wayland
- **Cursor stutter fix**: set `KWIN_DRM_NO_AMS=1` in `/etc/environment` if needed

## Klassy Window Decorations

Modern, highly configurable titlebars with built-in glass support.

| Feature | Detail |
|---------|--------|
| GitHub | [paulmcauley/klassy](https://github.com/paulmcauley/klassy) |
| Plasma | 6.3+ |
| Titlebar opacity | Configurable per active/inactive windows |
| Blur on titlebar | Toggleable |
| Auto-opaque maximized | ✅ Important for readability |
| Corner radius | Configurable |
| Button customization | Size, shape, translucency |

**"Glassy Klassy" preset** is specifically tuned for frosted glass.

### Alternative: Sierra Breeze Enhanced

macOS Sierra-inspired titlebars — [GitHub](https://github.com/kupiqu/SierraBreezeEnhanced). Gradient and opacity adjustments, macOS Sierra button styles.

## Glassy Panels

Panels get blur automatically when:
1. [[KWin]] blur effect is active
2. Plasma Style uses a translucent `panel-background.svg`

**Easy method:** Right-click panel → Edit Panel → Opacity slider → Translucent

**Best Plasma Styles for glass:**
- **Blur-Glassy Light** — 30% panel opacity, [KDE Store](https://store.kde.org/p/1267335)
- **Layan** — material translucent panels
- **Utterly Round** — rounded, transparent, follows color scheme
- **Glassy-KDE** — sharp and rounded variants

## Best Kvantum Themes for Glass

| Theme | Style | Source |
|-------|-------|--------|
| **KvGlass** | Pure glass transparency | [KDE Store](https://store.kde.org/p/1201321) |
| **Blur-Glassy** | Light glassy | [KDE Store](https://store.kde.org/p/1364705) |
| **Layan-Dark** | Material with translucency | github:vinceliuice/Layan-kde |
| **Darkly** | Lightly fork, medium translucency | github:Bali10050/Darkly |

After installing: `kvantummanager` → "Use this theme" → Configure Active Theme → **enable "Blurring for translucent windows"**

## Rounded Corners

**Plasma 6.5+ (Oct 2025):** All Breeze window corners are rounded natively. No plugin needed.

For custom radius or non-Breeze decorations: **KDE-Rounded-Corners** — [GitHub](https://github.com/matinlotfali/KDE-Rounded-Corners)

**Best approach:** Use kwin-effects-forceblur's built-in corners — avoids the blur-bleed-past-corners bug.

## Complete Theme Stacks

### Stack A: Nordic Frosted Glass (Dark, moody)

| Layer | Component |
|-------|-----------|
| Plasma Style | Blur-Glassy Light |
| Kvantum | KvGlass + blurring enabled |
| Decoration | Klassy (Glassy preset) |
| Color Scheme | Nordic |
| KWin Effect | forceblur, static blur |
| Icons | Tela or Papirus |

### Stack B: Layan Material Glass (Dark/Purple)

| Layer | Component |
|-------|-----------|
| Plasma Style | Layan |
| Kvantum | Layan-Dark + blurring |
| Decoration | Klassy or Sierra Breeze |
| Color Scheme | Layan |
| KWin Effect | forceblur |
| Icons | Tela Circle |

### Stack C: Light Glass (macOS-like)

| Layer | Component |
|-------|-----------|
| Plasma Style | Blur-Glassy Light |
| Kvantum | Blur-Glassy |
| Decoration | Sierra Breeze Enhanced |
| Color Scheme | Breeze Light |
| KWin Effect | forceblur (static, brightness +5) |
| Icons | WhiteSur or Colloid |

## See Also

- [[Kvantum Engine]]
- [[Theming System]]
- [[Top Themes]]
- [[KWin]]
- [[Panels and Widgets]]
- [[Configuration Files]]
- [[Resources and Community]]

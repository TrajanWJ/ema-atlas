---
tags:
  - kde
  - wallpapers
  - customization
  - effects
created: 2026-03-14
---

# Live Wallpapers on KDE Plasma

Animated, video, shader, and interactive desktop backgrounds for [[KDE Plasma Overview|KDE Plasma 6]] on [[Wayland vs X11|Wayland]].

## Quick Recommendation

| Priority | Tool | Why |
|----------|------|-----|
| **1st install** | [[#plasma-smart-video-wallpaper-reborn]] | Video wallpapers, near-zero GPU cost via VAAPI |
| **2nd install** | [[#kde-komplex-wallpaper-engine]] | ShaderToy imports, animated effects |
| **Wildcard** | [[#dos Embed Plugin]] | Embed ANY app as wallpaper (cmatrix, htop, screensavers) |

## Native Options (Zero Install)

### Animated GIFs
Plasma 6 renders `.gif` files natively as wallpaper. Set wallpaper type to Image → select a GIF. Works perfectly on Wayland. <1% GPU.

### Time-of-Day Dynamic Wallpapers (Plasma 6.4+)
Built-in day/night-cycle wallpapers. **KNightTime** daemon tracks solar position and switches wallpaper at sunrise/sunset. Syncs with Night Light and color scheme toggling. Zero cost.

## Community Plugins

### plasma-smart-video-wallpaper-reborn

The **community standard** for video wallpapers on Plasma 6 Wayland.

| Property | Detail |
|----------|--------|
| GitHub | [luisbocanegra/plasma-smart-video-wallpaper-reborn](https://github.com/luisbocanegra/plasma-smart-video-wallpaper-reborn) |
| KDE Store | [store.kde.org/p/2139746](https://store.kde.org/p/2139746) |
| Plasma 6 / Wayland | ✅ / ✅ |
| GPU load (VAAPI) | **3-8%** — negligible |

Features: multiple video files, crossfade transitions, auto-pause on battery / fullscreen / screen lock. Per-monitor independent wallpapers via standard Plasma API.

**Install:**
```bash
# Via KDE Store / Discover, or:
git clone https://github.com/luisbocanegra/plasma-smart-video-wallpaper-reborn
cd plasma-smart-video-wallpaper-reborn && ./install.sh
```

Then: right-click desktop → Desktop and Wallpaper → Wallpaper Type → "Smart Video Wallpaper Reborn"

**⚠️ AMD tip:** Ensure VAAPI hardware decode is available:
```bash
sudo apt install libva-mesa-driver mesa-va-drivers
```
Without VAAPI, software decode burns 15-30% CPU instead.

### kde-komplex-wallpaper-engine

**ShaderToy shader wallpapers** — the most visually interesting option.

| Property | Detail |
|----------|--------|
| GitHub | [DigitalArtifex/kde-komplex-wallpaper-engine](https://github.com/DigitalArtifex/kde-komplex-wallpaper-engine) |
| Plasma 6 / Wayland | ✅ / ✅ |
| GPU load | 5-15% simple, 20-60% complex |

Two modes:
- **Simple**: single GLSL shader + up to 4 channel buffers
- **Komplex**: multi-shader JSON packs with direct **ShaderToy API import**

**Performance on [[Hardware Specs|Radeon 680M]]:** Simple wave/noise/cloud shaders fine at 30fps. Complex multi-pass shaders (fluids, ray-marching) can be heavy — cap framerate.

### dos Embed Plugin

The wildcard — embed **any Wayland window** as your wallpaper.

| Property | Detail |
|----------|--------|
| Source | [KDE Discuss](https://discuss.kde.org/t/set-any-application-as-a-wallpaper-screensaver/39536) |
| Plasma 6 / Wayland | ✅ / ✅ |
| GPU load | Depends on embedded app |

Use cases:
- `cmatrix` — Matrix rain (~1% GPU)
- `asciiquarium` — fish tank
- `htop` — system monitor as wallpaper
- `xscreensaver` hacks — classic screensavers
- KWeather animated view

### wallpaper-engine-kde-plugin (Steam)

⚠️ **Wayland support is broken** as of early 2026 — black screen for video/scene types. Works on X11 session. Only worth it if you already own Wallpaper Engine ($3.99).

| Type | Wayland | X11 | GPU Load |
|------|---------|-----|----------|
| Video (mpv) | Sometimes | ✅ | ~5% |
| Simple 2D scene | ❌ | ✅ | 10-25% |
| Complex 3D scene | ❌ | ✅ | 30-60% (**avoid on iGPU**) |

## Performance Guide for [[Hardware Specs|AMD Radeon 680M]]

| Approach | GPU Load | Battery | Daily Use? |
|----------|----------|---------|------------|
| Animated GIF | <1% | None | ✅ |
| Time-of-day | <1% | None | ✅ |
| Video (VAAPI) | 3-8% | ~1-2W | ✅ |
| Simple shader | 5-15% | Low-mod | ✅ at 30fps |
| Complex shader | 20-60% | High | ⚠️ Test per shader |
| Embed cmatrix | ~1% | None | ✅ |
| WE 3D scene | 30-60% | High | ❌ |

**Best practices for integrated GPU:**
- Enable "pause on battery" and "pause on fullscreen"
- Cap shaders at 30fps on battery
- Use H264 MP4 for maximum VAAPI compatibility
- Don't run shader wallpapers + 3D games simultaneously

## Multi-Monitor

All Plasma wallpaper plugins use the standard Plasma wallpaper API — right-click each desktop independently to set different wallpapers per monitor.

## See Also

- [[Panels and Widgets]]
- [[Theming System]]
- [[Hardware Specs]]
- [[KWin]]
- [[Resources and Community]]
- [[Configuration Files]]

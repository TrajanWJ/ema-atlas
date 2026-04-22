# KDE Plasma Live Wallpapers — Research

**Research date:** 2026-03-14
**Scope:** Animated, video, shader, and interactive wallpapers for KDE Plasma 6 on Wayland
**Target hardware:** AMD Radeon 680M (integrated GPU), KDE Plasma 6.6.2, KDE Neon/Ubuntu base
**Status:** Comprehensive — covers native, community, shader, interactive, and performance angles

---

## 1. Native KDE Options

### Built-in Wallpaper Plugins (Plasma 6)

Plasma ships with these wallpaper types out of the box:

| Plugin | Animated? | Wayland | Notes |
|--------|-----------|---------|-------|
| **Image** | No | Yes | Static image/slideshow |
| **Slideshow** | Transitions only | Yes | Cycles images on a timer; CSS-style crossfade in Plasma 6 |
| **Plain Color** | No | Yes | Solid color |
| **Get Hot New Stuff** | Via store | Yes | Install from KDE Store via Discover |

**Animated GIF support:** Plasma 6 can render animated GIFs natively as wallpapers — just set the wallpaper type to Image and point to a `.gif` file. Works on Wayland with no extra software.

### Time-of-Day Dynamic Wallpapers (Plasma 6.4+)

Plasma 6.4 added native **time-of-day wallpapers** that shift between light and dark variants based on solar position at your location.

- Uses a new daemon: **KNightTime** (`knighttimed`) — orchestrates morning/evening transitions
- Geolocation-aware: computes actual Sun elevation; falls back to configured times if location unknown
- Compatible wallpapers shown with a "dynamic" badge in the wallpaper picker
- Synchronises with Night Light and color scheme toggling
- Sources: [KDE Blogs](https://blogs.kde.org/2025/05/24/this-week-in-plasma-time-of-day-wallpapers/), [Phoronix](https://www.phoronix.com/news/KDE-Plasma-TOD-Wallpapers), [Neowin](https://www.neowin.net/news/kde-plasma-64-adds-daynight-wallpapers-alongside-multiple-bug-fixes/)

### Setting a Video File as Wallpaper — Natively

Plasma 6 does **not** ship with a native video wallpaper plugin. You need a community plugin (see below). The closest native option is animated GIFs.

---

## 2. Community Wallpaper Plugins

### plasma-smart-video-wallpaper-reborn (RECOMMENDED for video)

- **GitHub:** https://github.com/luisbocanegra/plasma-smart-video-wallpaper-reborn
- **KDE Store:** https://store.kde.org/p/2139746
- **Plasma 6:** Yes — fully ported, actively maintained
- **Wayland:** Yes (primary target)
- **AMD:** Works; known Qt/FFMPEG segfault on some AMD+mesa combos (QTBUG-124586, mostly resolved in newer mesa)

**Features:**
- Play one or multiple video files as desktop or lock screen background
- Crossfade transitions between videos
- Power-aware: pauses on battery, when screen locks, when fullscreen app is active, when desktop effects are running
- Detects window activity to save power automatically
- Audio support (optional)

**Install on KDE Neon / Ubuntu:**
```bash
# Method 1: Install script from source
git clone https://github.com/luisbocanegra/plasma-smart-video-wallpaper-reborn
cd plasma-smart-video-wallpaper-reborn
./install.sh

# Method 2: KDE Store via Discover — search "Smart Video Wallpaper Reborn"
# Method 3: Build from source (requires cmake, extra-cmake-modules, plasma-framework)
```

**Set wallpaper:**
Right-click desktop → Desktop and Wallpaper → Wallpaper Type → "Smart Video Wallpaper Reborn"

**Performance notes (AMD 680M):**
- Video wallpapers via mpv/Qt Multimedia use VAAPI hardware decode on AMD — very efficient
- With VAAPI: ~3-8% GPU, negligible CPU
- Without VAAPI: software decode, 15-30% CPU — avoid this
- Enable VAAPI: ensure `libva-mesa-driver` and `mesa-va-drivers` are installed

---

### wallpaper-engine-kde-plugin (Steam Wallpaper Engine integration)

- **GitHub:** https://github.com/catsout/wallpaper-engine-kde-plugin
- **KDE Store (qt6 build):** https://store.kde.org/p/2194089
- **Plasma 6:** Yes — `qt6` branch supports Plasma 6; requires building from source or using AUR/prebuilt packages
- **Wayland:** PARTIAL — significant known issues as of late 2025
  - Issue [#527](https://github.com/catsout/wallpaper-engine-kde-plugin/issues/527): KDE 6.4 + Wayland shows black wallpaper for video/scene types
  - X11 session: fully functional
  - Wayland: video type via mpv backend sometimes works; scene/shader types are unreliable

**Requirements:**
- Steam with Wallpaper Engine ($3.99 on Steam) installed
- For scene wallpapers: Vulkan 1.1 + RADV driver (AMD default on Linux — you have this)
- For video wallpapers: mpv backend (compile flag)

**Install on KDE Neon / Ubuntu (from source):**
```bash
sudo apt install git cmake extra-cmake-modules libmpv-dev \
  plasma-workspace-dev libkf6plasma-dev qt6-base-dev qt6-declarative-dev \
  libvulkan-dev glslang-tools

git clone --recurse-submodules https://github.com/catsout/wallpaper-engine-kde-plugin
cd wallpaper-engine-kde-plugin
mkdir build && cd build
cmake .. -DUSE_PLASMAPKG=ON -DCMAKE_BUILD_TYPE=Release \
  -DBUILD_QML=ON -DUSE_MPV=ON
make -j$(nproc)
sudo make install
```

**Alternative — prebuilt for Fedora/Nobara:**
https://github.com/Deadlydav/wallpaper-engine-kde-nobara

**Performance notes (AMD 680M):**
- Video wallpapers: low impact with mpv backend (~5% GPU)
- Scene wallpapers (particle/shader-based): moderate to high — 10-40% GPU depending on complexity
- Complex 3D scene wallpapers are unsuitable for AMD 680M in daily use
- Simple 2D scene / video wallpapers are fine

**Recommendation:** Use on X11 session for full support. On Wayland, limited to mpv video backend. Not worth fighting for Wayland at present.

---

### linux-wallpaperengine (Almamu — standalone, no KDE plugin)

- **GitHub:** https://github.com/Almamu/linux-wallpaperengine
- **Plasma 6:** Not a Plasma plugin — runs as standalone window
- **Wayland:** Supported via `wlr-layer-shell` protocol (KDE supports this)
- **KDE recommendation:** The project itself recommends using the catsout KDE plugin over this for KDE users
- **Use case:** If the KDE plugin is broken on Wayland, this is the fallback
- Source: [KDE Plugin discussion](https://github.com/Almamu/linux-wallpaperengine/discussions/65)

---

### Hidamari

- **GitHub:** https://github.com/jeffshee/hidamari
- **Plasma 6:** Works on KDE and XFCE (primarily designed for GNOME)
- **Wayland:** Supported on GNOME Wayland; KDE Wayland support is limited/experimental
- **Install:** `flatpak install flathub io.github.jeffshee.Hidamari`
- **Features:** Local video, YouTube/streaming URL, web page as wallpaper; auto-pause on fullscreen; VLC or mpv backend
- **Caveats:** Hardware acceleration does not work on NVIDIA+Wayland; AMD should be fine. KDE integration less polished than Plasma-native plugins.
- **Verdict for KDE Wayland:** Lower priority than plasma-smart-video-wallpaper-reborn

---

### Embed Any App as Wallpaper (Sebastian Krzyszkowiak / "dos")

- **KDE Discuss thread:** https://discuss.kde.org/t/set-any-application-as-a-wallpaper-screensaver/39536
- **Social source:** https://social.librem.one/@dos/115152323878414980
- **Available:** KDE Store (search in Discover / wallpaper settings)
- **How it works:** A Plasma wallpaper plugin that is itself a minimal QtWayland compositor — it embeds any Wayland window (or XWayland window) as the desktop background
- **Examples:** xscreensaver hacks, Windows screensavers via Wine, `asciiquarium` in Konsole, `htop`, KWeather animated view, `cmatrix`, any Qt/GTK app

**This unlocks essentially infinite possibilities for interactive backgrounds.**

**Performance:** depends entirely on the embedded application

---

### Komorebi

- **GitHub:** https://github.com/cheesecakeufo/komorebi (forked at christianloopp/komorebi)
- **Plasma 6 / Wayland:** NOT SUPPORTED — Komorebi was built for X11 and GNOME-era compositing; has not been ported to Wayland or Plasma 6. Development is sporadic.
- **Verdict:** Skip for this use case.

---

## 3. Shader / WebGL Wallpapers

### kde-shader-wallpaper

- **GitHub:** https://github.com/y4my4my4m/kde-shader-wallpaper
- **KDE Store:** https://store.kde.org/p/1413010
- **Plasma 6:** Yes — Plasma 6 branch exists
- **Wayland:** Works (renders via Qt/QML within Plasma shell)
- **Shadertoy import:** NOT supported in Plasma 6 version due to shader compilation differences — you must manually port shaders
- **Features:** Write or paste GLSL fragment shaders; runs within the Plasma wallpaper layer

**Install:**
```bash
git clone https://github.com/y4my4my4m/kde-shader-wallpaper
cd kde-shader-wallpaper
kpackagetool6 --install package --type Plasma/Wallpaper
# Or use the KDE Store via Discover
```

**After editing shaders:**
```bash
pkill plasmashell && kstart plasmashell
```

---

### kde-komplex-wallpaper-engine (Advanced Shaders + Shadertoy API)

- **GitHub:** https://github.com/DigitalArtifex/kde-komplex-wallpaper-engine
- **OBS Package:** https://build.opensuse.org/package/show/home:D1gitalArtifex/plasma6-wallpapers-komplex
- **Plasma 6:** Yes
- **Wayland:** Yes (runs in Plasma shell)
- **Features:**
  - Simple mode: single GLSL shader with up to 4 channel buffers
  - Komplex mode: multi-shader "packs" (JSON-defined), channel buffer chaining, images, cubemaps, video channels
  - **Direct ShaderToy API import** — most ShaderToy shaders supported, including video-as-resource
  - Near-infinite shader arrangement complexity

**This is the most powerful shader wallpaper option for KDE Plasma 6.** For users wanting Shadertoy-style animated backgrounds, this is the correct tool.

**Performance notes (AMD 680M):**
- Simple shaders: 5-15% GPU
- Complex multi-buffer Shadertoy shaders: 20-60% GPU — test case by case
- Shader complexity is the dominant factor; this GPU can handle simple fluid/wave shaders at 30fps without issue

---

### NeoWall (Standalone GLSL Shader Engine)

- **GitHub:** https://github.com/1ay1/neowall
- **HN discussion:** https://news.ycombinator.com/item?id=45781627
- **Wayland:** Yes — native Wayland (wlr-layer-shell) and X11
- **Multi-monitor:** Yes
- **Performance:** ~2% CPU, ~60fps; aggressive shader optimization targeting <30% GPU
- **Shadertoy:** Renders Shadertoy shaders directly on desktop
- **KDE quirk:** Desktop icons may hide; KDE uses wlr-layer-shell (works), but a native KDE backend is not yet complete
- **Version:** 0.4.6 (active development)
- **License:** MIT

**Good alternative if KDE-native shader plugins feel limiting. Works standalone without Plasma wallpaper system.**

---

### liveW

- **GitHub:** https://github.com/dgranosa/liveW
- **Status:** Older project; OpenGL-based; primarily tested on i3 and KDE Plasma (X11 era)
- **Wayland:** Not confirmed; lower priority given NeoWall and kde-komplex exist

---

## 4. Interactive / Data-Driven Backgrounds

### System Stats Wallpaper

**Conky** (partially works on Wayland):
- Traditional approach: runs as an overlay, not a true wallpaper
- On Wayland, Conky loses proper "below all windows" placement
- Workaround: run Conky in a window and use the "embed any app as wallpaper" plugin above
- Alternative: use Plasma widgets directly on the desktop (System Monitor widget, Thermal Monitor)

**Plasma widgets on desktop** (native, Wayland-compatible):
- System Monitor widget: CPU, RAM, network, disk as graphs directly on desktop
- Thermal Monitor widget: GPU/CPU temperatures
- Not a "wallpaper" per se, but achieves the same information-dense aesthetic

---

### Clock / Weather Animated Wallpapers

- **Time-of-day wallpapers** (Plasma 6.4+ native): sunrise/sunset-aware image switching
- **KDE Dynamic Wallpaper (mmoyles87):** https://github.com/mmoyles87/kde-dynamic-wallpaper — astronomical calculations, changes wallpaper based on Sun position
- **Embed KWeather** as wallpaper using the "embed any app" plugin — KWeather has animated weather views
- **plasma5-wallpapers-dynamic:** https://github.com/zzag/plasma5-wallpapers-dynamic — macOS-style time-varying HEIC wallpapers (Plasma 5; Plasma 6 status unclear)

---

### Matrix / Particle / Fluid / Interactive Effects

Via the "embed any app as wallpaper" plugin:
- `cmatrix` in a Konsole window → Matrix rain as wallpaper
- `asciiquarium` in a Konsole window → ASCII fish tank
- Any OpenGL/Vulkan demo application
- Screensavers via `xscreensaver` (XWayland)

Via kde-komplex-wallpaper-engine + Shadertoy shaders:
- Fluid simulations (e.g., [Shadertoy: Fluid](https://www.shadertoy.com/view/XdcXDN))
- Particle systems
- Ray-marched scenes

---

### Audio-Reactive Wallpapers

- **Wallpaper Engine KDE plugin:** basic audio in mpv/scene mode via miniaudio — web audio API partial; true reactivity limited and not exposed to scene wallpapers per community reports
- **kde-komplex-wallpaper-engine:** channel buffer support allows audio texture input in theory — check project docs
- **New Plasma Audio Visualizer widget** (June 2025): uses CAVA as source — this is a widget, not a wallpaper plugin, but can be layered on desktop
- **Verdict:** Audio-reactive wallpapers on KDE Linux are not well-supported as of early 2026. The closest is using a PipeWire audio visualizer application embedded via the "embed any app" plugin.

---

### Plasma Wallpaper Effects Add-on

- **GitHub:** https://github.com/luisbocanegra/plasma-wallpaper-effects
- Adds Active Blur and other post-processing effects to any wallpaper plugin
- Works alongside video/shader wallpapers to add blur when windows are active

---

## 5. Performance Analysis — AMD Radeon 680M (Integrated)

The Radeon 680M is a capable integrated GPU (RDNA2, 12 CUs) but shares memory bandwidth with the CPU and has no dedicated VRAM. Key constraints:

| Approach | Est. GPU Load | Est. Power Impact | Notes |
|----------|--------------|-------------------|-------|
| Animated GIF (native) | <1% | Negligible | CPU-rendered; fine |
| Time-of-day wallpaper (native) | <1% | Negligible | Static images, just switches |
| Video wallpaper (VAAPI hardware decode) | 3-8% | Low (~1-2W) | Use plasma-smart-video-wallpaper-reborn |
| Video wallpaper (software decode) | 15-30% CPU | High — avoid | Force VAAPI |
| Simple GLSL shader | 5-15% | Low-moderate | Fine for daily use |
| Complex Shadertoy multi-buffer shader | 20-60% | High | Use simple shaders; test each |
| Wallpaper Engine scene (particle effects) | 10-40% | Moderate-High | Avoid complex 3D scenes |
| Embed app as wallpaper | Varies by app | Varies | htop/cmatrix: ~1%; game: high |
| NeoWall + simple shader | ~2% CPU, ~10-20% GPU | Low-moderate | 60fps Shadertoy |

**Battery/laptop considerations:**
- Enable auto-pause on battery in plasma-smart-video-wallpaper-reborn settings
- Enable "pause when fullscreen" in all video/shader plugins
- Prefer 30fps cap over 60fps for shaders on battery
- Time-of-day + static images has zero battery cost

**Multi-monitor:**
- plasma-smart-video-wallpaper-reborn: each monitor gets independent wallpaper settings via standard KDE wallpaper system (right-click each desktop separately)
- NeoWall: multi-monitor supported
- kde-komplex: standard Plasma multi-monitor support

---

## 6. Notable Specific Wallpapers

### KDE Store (store.kde.org)

- Browse Plasma 6 wallpaper plugins: https://store.kde.org/browse?cat=715&ord=latest
- Animated/dynamic wallpapers via store: search for "Smart Video Wallpaper" for plugin
- Static animated wallpapers (GIF/WEBP): KDE Store wallpaper section → filter by file type

### Wallpaper Engine (via KDE plugin / linux-wallpaperengine)

Popular community wallpapers that work well on Linux:
- Simple 2D animated scenes (rain, snow, floating particles) — low GPU cost
- Looping video wallpapers (MP4) — lowest GPU cost via VAAPI
- Avoid complex 3D/shader "scene" type wallpapers on integrated GPU

Find Linux-friendly WE wallpapers: filter by "Video" type on the Steam Workshop — these use mpv and are most compatible.

### Shadertoy Shaders (via kde-komplex or NeoWall)

Good performance-to-visual shaders for integrated GPU:
- "Seascape" — classic wave/ocean simulation
- "Clouds" — procedural sky
- Simple noise-based animations
- Avoid path-traced or very high sample-count shaders

---

## 7. Recommendation Matrix

| Goal | Recommended Tool | Wayland | Effort |
|------|-----------------|---------|--------|
| Video file as wallpaper | **plasma-smart-video-wallpaper-reborn** | Yes | Low |
| Time-changing wallpaper | **Plasma 6.4 native time-of-day** | Yes | None |
| Wallpaper Engine integration | **catsout plugin** (X11) or **linux-wallpaperengine** (Wayland) | Partial | Medium |
| Shadertoy shaders | **kde-komplex-wallpaper-engine** | Yes | Medium |
| Any app as wallpaper | **"dos" embed plugin** | Yes | Low |
| System stats background | **Plasma widgets on desktop** | Yes | Low |
| Matrix/screensaver as wallpaper | **embed plugin + cmatrix/xscreensaver** | Yes | Low |
| Audio reactive | Not well supported — skip | — | High |

### Overall Recommendation for AMD 680M + Plasma 6.6.2 + Wayland

**Primary: plasma-smart-video-wallpaper-reborn**
- Install via KDE Store / Discover
- Use hardware-decoded video files (h264 MP4 recommended for VAAPI compatibility)
- Enable all power-saving options
- Per-monitor independent wallpapers work natively

**Secondary / for variety: kde-komplex-wallpaper-engine**
- For shader-based animated wallpapers
- Use simple Shadertoy shaders (noise, wave, clouds) — not complex multi-pass renders
- Cap at 30fps on battery

**If you own Wallpaper Engine on Steam:** use the catsout plugin on X11 session, or linux-wallpaperengine on Wayland for video-type wallpapers only. Avoid scene-type wallpapers on integrated GPU.

**Avoid:** Komorebi (dead on Wayland), Hidamari (KDE Wayland support poor), heavy Shadertoy shaders.

---

## Install Summary — KDE Neon / Ubuntu

```bash
# Dependencies (common)
sudo apt install git cmake extra-cmake-modules \
  plasma-framework-dev libkf6plasma-dev \
  qt6-base-dev qt6-declarative-dev \
  libva-mesa-driver mesa-va-drivers  # VAAPI for AMD

# plasma-smart-video-wallpaper-reborn
git clone https://github.com/luisbocanegra/plasma-smart-video-wallpaper-reborn
cd plasma-smart-video-wallpaper-reborn && ./install.sh

# kde-shader-wallpaper (Plasma 6)
git clone https://github.com/y4my4my4m/kde-shader-wallpaper
cd kde-shader-wallpaper
kpackagetool6 --install package --type Plasma/Wallpaper

# Hidamari (Flatpak)
flatpak install flathub io.github.jeffshee.Hidamari

# wallpaper-engine-kde-plugin (requires extra deps + Steam + Wallpaper Engine)
# See GitHub README for full build instructions
```

---

## Sources

- [plasma-smart-video-wallpaper-reborn GitHub](https://github.com/luisbocanegra/plasma-smart-video-wallpaper-reborn)
- [Smart Video Wallpaper Reborn — KDE Store](https://store.kde.org/p/2139746)
- [wallpaper-engine-kde-plugin GitHub](https://github.com/catsout/wallpaper-engine-kde-plugin)
- [wallpaper-engine-kde-plugin KDE Store (qt6)](https://store.kde.org/p/2194089)
- [Wayland black screen issue #527](https://github.com/catsout/wallpaper-engine-kde-plugin/issues/527)
- [linux-wallpaperengine (Almamu)](https://github.com/Almamu/linux-wallpaperengine)
- [Hidamari GitHub](https://github.com/jeffshee/hidamari)
- [kde-shader-wallpaper GitHub](https://github.com/y4my4my4m/kde-shader-wallpaper)
- [kde-komplex-wallpaper-engine GitHub](https://github.com/DigitalArtifex/kde-komplex-wallpaper-engine)
- [NeoWall GitHub](https://github.com/1ay1/neowall)
- [NeoWall HN Discussion](https://news.ycombinator.com/item?id=45781627)
- [liveW GitHub](https://github.com/dgranosa/liveW)
- [Embed any app as wallpaper — KDE Discuss](https://discuss.kde.org/t/set-any-application-as-a-wallpaper-screensaver/39536)
- [Sebastian Krzyszkowiak / dos — embed plugin](https://social.librem.one/@dos/115152323878414980)
- [KDE Plasma 6.4 Time-of-Day Wallpapers — KDE Blogs](https://blogs.kde.org/2025/05/24/this-week-in-plasma-time-of-day-wallpapers/)
- [KDE Plasma 6.4 TOD Wallpapers — Phoronix](https://www.phoronix.com/news/KDE-Plasma-TOD-Wallpapers)
- [KDE Plasma 6.4 day/night — Neowin](https://www.neowin.net/news/kde-plasma-64-adds-daynight-wallpapers-alongside-multiple-bug-fixes/)
- [How to have video wallpaper on Plasma 6? — KDE Discuss](https://discuss.kde.org/t/how-to-have-a-video-wallpaper-on-plasma-6/11324)
- [Plasma 6 Wallpaper Plugins — KDE Store](https://store.kde.org/browse?cat=715&ord=latest)
- [plasma-wallpaper-effects GitHub](https://github.com/luisbocanegra/plasma-wallpaper-effects)
- [kde-dynamic-wallpaper (mmoyles87)](https://github.com/mmoyles87/kde-dynamic-wallpaper)
- [Komorebi GitHub](https://github.com/cheesecakeufo/komorebi)
- [Live wallpapers on EOS KDE 6.0 — EndeavourOS](https://forum.endeavouros.com/t/live-wallpapers-on-eos-kde-6-0/59309)
- [Set up animated wallpapers — Medium](https://tharushaj.medium.com/how-to-get-live-wallpapers-on-linux-gnome-kde-c52282d719fa)

#kde #plasma #wallpaper #linux #wayland #animated #live-wallpaper #shader #amd

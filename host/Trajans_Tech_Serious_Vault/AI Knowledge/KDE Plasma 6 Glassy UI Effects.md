# KDE Plasma 6 — Glassy/Frosted Glass UI Effects

**Research date:** 2026-03-14
**Scope:** Blur, transparency, frosted glass, rounded corners, glassy themes for KDE Plasma 6 on Wayland
**Distro focus:** KDE Neon (Ubuntu/Debian base)

---

## 1. KWin Blur — How It Works

KWin's built-in Blur effect blurs whatever is behind a window, but **only if the window itself signals that it wants blur** (via a KWin hint). This is why stock blur does nothing for most apps — they never set the hint. The workaround is a force-blur effect that overrides this and applies blur regardless.

### 1.1 Enable Stock Blur

System Settings → Workspace Behavior → Desktop Effects → enable "Blur"

Stock blur configuration is minimal — no strength slider in the UI. Adjustments require editing `~/.config/kwinrc` under `[Effect-Blur]`:

```ini
[Effect-Blur]
BlurStrength=10      # 1-15 range
NoiseStrength=0      # optional noise overlay
```

Restart KWin after editing: `qdbus org.kde.KWin /KWin reconfigure`

**Critical Plasma 6 limitation:** Since Plasma 6, blur and background contrast are handled separately. Many themes that worked on Plasma 5 broke. The stock blur effect alone will not blur app windows unless the app or theme requests it.

### 1.2 kwin-effects-forceblur (taj-ny fork) — PRIMARY RECOMMENDATION

- **GitHub:** https://github.com/taj-ny/kwin-effects-forceblur
- **Plasma 6 support:** 6.4+ (use v1.3.6 for 6.0–6.3.5)
- **Wayland:** Fully supported
- **Status:** Actively maintained as of March 2026

**Features beyond stock blur:**
- Force blur on any window by window class/name
- Rounded corners with anti-aliasing (built-in, separate from ShapeCorners)
- Static blur mode — pre-computed blur, massively reduces GPU load
- Brightness, contrast, saturation controls
- Noise texture overlay
- Refraction effect
- Fixes blur disappearing during animations

**INCOMPATIBLE with stock blur** — disable stock blur before enabling this.

**Build on KDE Neon (Wayland):**
```bash
sudo apt install -y git cmake g++ extra-cmake-modules qt6-tools-dev kwin-dev \
  libkf6configwidgets-dev gettext libkf6crash-dev libkf6globalaccel-dev \
  libkf6kio-dev libkf6service-dev libkf6notifications-dev libkf6kcmutils-dev \
  libkdecorations3-dev libxcb-composite0-dev libxcb-randr0-dev libxcb-shm0-dev

git clone https://github.com/taj-ny/kwin-effects-forceblur
cd kwin-effects-forceblur
mkdir build && cd build
cmake .. -DCMAKE_INSTALL_PREFIX=/usr
make -j$(nproc)
sudo make install
```

Then: System Settings → Desktop Effects → disable "Blur" → enable "Better Blur"

**Find window class for targeting:**
```bash
qdbus org.kde.KWin /KWin org.kde.KWin.queryWindowInfo
# click on the target window
```

**Wayland performance caveat:** High GPU load with many windows may cause cursor latency. Mitigations:
- `KWIN_DRM_NO_AMS=1` — disable async mouse support
- `KWIN_FORCE_SW_CURSOR=1` — force software cursor

### 1.3 Alternative Blur Forks

| Fork | GitHub | Extra Features vs taj-ny |
|------|--------|--------------------------|
| **can1357/kde-blur** | https://github.com/can1357/kde-blur | Inactive window translucency with animation, move/resize opacity control |
| **D3SOX/kwin-forceblur** | https://github.com/D3SOX/kwin-forceblur | Simpler, stable alternative |
| **xarblu/kwin-effects-better-blur-dx** | https://github.com/xarblu/kwin-effects-better-blur-dx | Actively maintained fork |
| **4v3ngR/kwin-effects-glass** | https://github.com/4v3ngR/kwin-effects-glass | Glass-specific tuning |

All forks share the same Debian/Ubuntu build dependency list. All conflict with stock blur and each other — install only one.

---

## 2. Kvantum for Glassy Apps

Kvantum intercepts Qt application rendering and can apply translucency to window backgrounds, menus, and other widgets. The blur on those translucent areas comes from KWin's blur effect — Kvantum just makes the windows transparent enough for blur to show through.

**Install on KDE Neon:**
```bash
sudo apt install qt6-style-kvantum kvantum-manager
```

**Activate:** System Settings → Appearance → Application Style → set to "kvantum" or "kvantum-dark"

**Configure:** Run `kvantummanager` → Install Theme → Use This Theme → enable "Blurring for translucent windows"

### 2.1 Best Kvantum Themes for Glass/Translucency

| Theme | Source | Style | Translucency Level |
|-------|--------|-------|--------------------|
| **KvGlass** | https://store.kde.org/p/1201321 | Pure glass/transparency | Very high — designed specifically for glass |
| **Blur-Glassy Kvantum** | https://store.kde.org/p/1364705 | Light glassy | Medium-high |
| **Layan** | github:vinceliuice/Layan-kde | Material/flat with translucency | Medium — works best with Kvantum engine |
| **Materia Blur** | KDE Store | Dark material with blur | Medium |
| **Glassy-KDE (Kvantum component)** | github:Pr0cella/glassy-kde | Minimalist glass | High — "required for transparent window backgrounds" |
| **Darkly** | github:Bali10050/Darkly | Lightly fork, Plasma 6 native | Medium, modern |

**Key insight from community research:** Kvantum is the most reliable method for getting true frosted glass on app windows. Many themes claim blur/glass in their screenshots but are using Kvantum behind the scenes. Without Kvantum, app windows (Dolphin, Settings, etc.) will remain opaque regardless of the KWin blur effect.

### 2.2 Kvantum Blur Integration

For blur to appear through a Kvantum-transparent window:
1. Kvantum theme must use a non-opaque (< 100% alpha) background
2. KWin blur effect (or forceblur) must be enabled
3. The "Blurring for translucent windows" checkbox in Kvantummanager → Configure Active Theme must be ticked
4. The window must be in a translucent compositor state

### 2.3 Frosted Glass Titlebars via Kvantum

Kvantum controls application-side decoration (toolbars, titlebars for non-native-decorated apps). For true KWin-side titlebar glass, use Klassy (see section 3).

---

## 3. Modern Titlebars / Window Decorations

### 3.1 Klassy — PRIMARY RECOMMENDATION

- **GitHub:** https://github.com/paulmcauley/klassy
- **Plasma requirement:** 6.3+
- **Type:** KDecoration3 plugin (C++ compiled) + Application Style + Icons + Color Scheme
- **Status:** Actively maintained, v6.3 released 2025

**What makes Klassy special:**
- Titlebar transparency configurable independently for active and inactive windows
- Blur on titlebar (toggleable)
- Maximized windows can be forced opaque (useful for readability)
- Configurable corner radius
- "Glassy Klassy" and "Chroma" presets for translucent look
- Integrated rounded rectangle button style with translucent outlined accent colours
- Full HiDPI scaling support for all metrics
- Configurable thin window outline with optional accent colours
- "Arguably the best scrollbars on any platform" — via its Application Style component

**Install on KDE Neon:**
```bash
git clone https://github.com/paulmcauley/klassy
cd klassy
git checkout plasma6.3
./install.sh
```

Also available via OBS (Open Build Service) for Ubuntu/Debian — check the repo for current PPA.

**Enable:** System Settings → Window Decorations → Klassy, System Settings → Application Style → Klassy, System Settings → Icons → Klassy

### 3.2 Sierra Breeze Enhanced

- **GitHub:** https://github.com/kupiqu/SierraBreezeEnhanced
- **KDE Store:** https://store.kde.org/p/2270896
- **Plasma requirement:** 6.3+
- **Style:** macOS Sierra-inspired, clean, minimalist

**Key features:**
- Multiple button styles: Plasma, GNOME, macOS Sierra
- Titlebar gradient and opacity adjustments (glassy look)
- Option to hide titlebar when maximized or always
- Titlebar color matching to window content
- Hover animations with unified symbol appearance

**Install on KDE Neon:**
```bash
sudo add-apt-repository ppa:krisives/sierrabreezeenhanced
sudo apt update
sudo apt install sierrabreezeenhanced
```

Then configure in System Settings → Window Decorations → Sierra Breeze Enhanced

### 3.3 Other Notable Options

| Decoration | Notes | Plasma 6? |
|------------|-------|-----------|
| **Zephyr** (Rudraksh88) | Fork of BreezeEnhanced, modern minimal | Yes |
| **BreezeEnhanced** (tsujan) | The parent of most forks | Partial |
| **Breeze** (stock) | Now has all-4-corner rounding as of Plasma 6.5 | Yes |

### 3.4 Borderless / Minimized Titlebars

- KWin Rules: Right-click titlebar → More Actions → Configure Special Window Settings → No titlebar and frame → Force
- Klassy: Configure → show titlebar → "Never" option
- Sierra Breeze Enhanced: hide titlebar option built-in
- For borderless maximized windows: both Klassy and Sierra Breeze Enhanced support auto-hide when maximized

---

## 4. Panel Transparency / Glass

### 4.1 How Panel Blur Works

Panels are Plasma Shell elements. They get blur via:
1. KWin's blur effect detects Plasma's blur hint on the panel surface
2. The Plasma Style (Desktop Theme) sets transparency — if it uses a transparent `background.svg`, the panel becomes see-through and blur appears behind it
3. If the panel has 100% opaque SVG, blur does nothing

### 4.2 Panel Opacity Configuration

Floating panels in Plasma 6 have a built-in opacity setting: right-click panel → Edit Panel → Opacity (None / Translucent / Opaque). This is the easiest control.

For finer control, edit the Plasma Style SVG files directly at `~/.local/share/plasma/desktoptheme/[theme-name]/widgets/panel-background.svg` — adjust the `fill-opacity` attribute.

### 4.3 Best Plasma Styles for Glassy Panels

| Plasma Style | Source | Panel Style |
|-------------|--------|-------------|
| **Blur-Glassy Light** | https://store.kde.org/p/1267335 | 30% opacity default, actively updated March 2026, has Plasma 6 Global Theme variant |
| **Layan Plasma Style** | github:vinceliuice/Layan-kde | Translucent, material-style |
| **Utterly Round** | https://store.kde.org/p/1901768 | Rounded, transparent, blur-capable, follows color scheme |
| **Glassy-KDE Plasma** | github:Pr0cella/glassy-kde | Minimalist glass — sharp and rounded variants |
| **Default Breeze** | Built-in | Opaque by default, use panel floating opacity slider |

### 4.4 Panel Translucency Without Kvantum

Edit `~/.config/plasmashellrc` is not the right approach — the panel SVG controls this. Alternatively, via the floating panel opacity toggle (Plasma 6 built-in), or use a Plasma Style that has translucent SVGs.

---

## 5. Complete Glassy Theme Stacks

**Stack 1: Nordic Frosted Glass (Dark, subtle)**

| Layer | Component |
|-------|-----------|
| Plasma Style | Blur-Glassy Light (or Utterly Round Dark) |
| Kvantum | KvGlass or Layan-Dark with blurring enabled |
| Window Decoration | Klassy (Glassy Klassy preset, blur enabled) |
| Color Scheme | Nordic or Nord |
| KWin Effect | kwin-effects-forceblur (static blur, medium strength) |
| Rounded Corners | Built-in Klassy corners OR KDE-Rounded-Corners |
| Icons | Tela or Papirus |

**Stack 2: Layan Material Glass (Dark/Purple)**

| Layer | Component |
|-------|-----------|
| Plasma Style | Layan Plasma Style |
| Kvantum | Layan-Dark (kvantummanager → blurring enabled) |
| Window Decoration | Klassy or Sierra Breeze Enhanced |
| Color Scheme | Layan Color Scheme |
| KWin Effect | kwin-effects-forceblur |
| Icons | Tela Circle |

**Stack 3: Glassy Minimalist (Light, macOS-like)**

| Layer | Component |
|-------|-----------|
| Plasma Style | Blur-Glassy Light |
| Kvantum | Blur-Glassy Kvantum Theme |
| Window Decoration | Sierra Breeze Enhanced (macOS Sierra button style) |
| Color Scheme | Breeze Light or custom light |
| KWin Effect | kwin-effects-forceblur (static blur, brightness +5) |
| Rounded Corners | Sierra Breeze Enhanced built-in OR KDE-Rounded-Corners |
| Icons | WhiteSur or Colloid |

**Critical notes for any stack:**
- KWin forceblur effect: disable stock blur first
- Windows must have some transparency for blur to show — the Kvantum theme is responsible for this in apps, the Plasma Style for panels
- Klassy titlebars require Klassy Application Style also enabled for consistent scrollbars/widgets
- After any Kvantum theme change, test in a fresh app window — some apps cache the style

---

## 6. Rounded Corners

### 6.1 Native Rounded Corners (Plasma 6.5+)

KDE Plasma 6.5 (October 2025) added **rounded bottom corners to Breeze window decorations** — all four corners now match. This is enabled by default. Disable via System Settings → Window Decorations → Breeze → Edit → uncheck bottom rounding.

Plasma 6.7 (expected June 2026) extends rounding to all Qt widget elements (buttons, inputs, scrollbars, tab bars, combo boxes) system-wide.

### 6.2 KDE-Rounded-Corners (formerly ShapeCorners)

- **GitHub:** https://github.com/matinlotfali/KDE-Rounded-Corners
- **KDE Store:** https://store.kde.org/p/1625420
- **Plasma 6 support:** 6.3–6.6+ (actively maintained)
- **Wayland:** Fully supported
- **Performance:** Single-pass OpenGL shader — minimal overhead

**Configuration:** System Settings → Workspace Behavior → Desktop Effects → Rounded Corners
- Corner radius
- Outline color (active/inactive)
- Shadow rendering
- Window exclusions

**Install on KDE Neon:** Build from source (download .deb from GitHub releases for KDE Neon stable/unstable — the repo has dedicated build workflows)

```bash
sudo apt install git cmake g++ extra-cmake-modules kwin-dev qt6-base-dev
git clone https://github.com/matinlotfali/KDE-Rounded-Corners
cd KDE-Rounded-Corners
mkdir build && cd build
cmake .. -DCMAKE_INSTALL_PREFIX=/usr
make -j$(nproc)
sudo make install
```

### 6.3 LightlyShaders

- **GitHub:** https://github.com/a-parhom/LightlyShaders
- **KDE Store:** https://store.kde.org/p/1485229
- **Status:** Supports Plasma 6, but less actively maintained
- **Extra:** Adds outline around windows in addition to corner rounding
- **Note:** With Plasma 6.5 adding native rounding, LightlyShaders is primarily useful if you want the outline effect

### 6.4 Blur + Rounded Corners Interaction (Bug)

There is a known bug where the blur effect does not respect rounded corners — the blur rectangle bleeds past the rounded clip. Solutions:
- Use kwin-effects-forceblur which has built-in rounded corners that integrate correctly with its blur
- See also: https://github.com/Alban-Boissard/kwin-effects-blur-respect-rounded-decorations

---

## Key Warnings and Gotchas

1. **Only one blur effect at a time.** kwin-effects-forceblur, stock blur, and all forks are mutually exclusive.
2. **Rebuild required after KWin updates.** The effect is compiled against a specific KWin version. After a KDE Neon update that bumps KWin, the effect will stop working until rebuilt.
3. **Kvantum is the only reliable way to get app window transparency.** Window rules can force opacity but that is the inverse of what you want for frosted glass.
4. **Utterly Nord is Plasma 5 only** (as of March 2026) — do not install it expecting Plasma 6 support.
5. **Plasma 6.5 all-four-corner rounding** is built-in now — KDE-Rounded-Corners or LightlyShaders are only needed if you want different radius, outlines, or the corners on non-Breeze decorations.
6. **Static blur mode** in kwin-effects-forceblur is critical for Wayland performance — enable it in the effect settings if you experience GPU pressure.
7. **Theme screenshots lie.** Many KDE Store themes show frosted glass in screenshots but are actually showing Kvantum-backed setups that are not included or documented.

---

## Related Notes

- [[KDE Plasma Knowledge Graph]] — full Plasma reference
- [[My Stack Decisions]] — desktop setup choices

#kde #plasma6 #kwin #blur #transparency #frostedglass #kvantum #wayland #ricing #customization

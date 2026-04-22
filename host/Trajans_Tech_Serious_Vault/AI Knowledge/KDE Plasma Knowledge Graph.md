# KDE Plasma — Comprehensive Knowledge Graph

**Research date:** 2026-03-13
**Scope:** Full reference for KDE Plasma power users and customizers
**Current stable version:** KDE Plasma 6.5 (released October 2025)

---

## 1. Core Architecture

### Technology Stack

| Layer | Component | Version (Plasma 6) |
|-------|-----------|-------------------|
| GUI Framework | Qt | Qt 6 |
| KDE Frameworks | KDE Frameworks 6 (KF6) | 6.x |
| KDE Applications | KDE Gear | 24.02+ |
| Window Manager | KWin | 6.x |
| Desktop Shell | Plasma Shell | 6.x |
| Graphics Protocol | Wayland (default) + X11 (legacy) | — |

### Core Components

- **Plasma Shell** — the desktop environment layer itself; handles panels, widgets, desktop canvas, Activities, and the overall workspace UI. Written in QML + C++.
- **KWin** — the compositor and window manager. Handles window decorations, compositing effects, virtual desktops, tiling, and is the execution target for KWin scripts. KWin is also the Wayland compositor.
- **KDE Frameworks 6 (KF6)** — a set of ~80 add-on libraries to Qt providing common functionality: KConfig (configuration), KIO (file access), KNotifications, Plasma (plasma shell API), KRunner framework, etc.
- **KDE Gear** — the suite of KDE applications (Dolphin, Konsole, Spectacle, Kate, Okular, etc.)
- **Plasma SystemD integration** — Plasma 6 ships with systemd user session integration by default on supported distros.

### Plasma 5 vs Plasma 6 — Key Differences

| Area | Plasma 5 | Plasma 6 |
|------|----------|----------|
| Qt version | Qt 5 | Qt 6 |
| Default session | X11 | Wayland |
| Rendering | OpenGL | Wayland + Vulkan support via Qt 6 |
| Floating panel | Optional (added 5.25) | Default |
| Task switcher | Basic | Thumbnail Grid (new default) |
| Tiling | External scripts only | Built-in KWin tiling (basic) |
| HDR | No | Yes (Wayland, partial) |
| Release date | 2014-2024 | Feb 28 2024 – present |
| EOL | Shortly after Plasma 6 release | Active |

- Plasma 6 felt "much snappier" in practice — animations, launch times, drag operations all improved.
- Font rendering improved noticeably in Plasma 6.
- Workspace view now shows running application thumbnails.
- Plasma 6.5 added rounded bottom window corners (all four corners now match).

### Configuration File Locations & Hierarchy

All KDE config follows XDG Base Directory spec. User config always takes precedence over system config.

| Path | Purpose |
|------|---------|
| `~/.config/` | Primary user config directory |
| `~/.local/share/` | User data (themes, scripts, applets) |
| `~/.config/plasmashellrc` | Plasma desktop settings (wallpaper, panels, widgets) |
| `~/.config/kwinrc` | KWin window manager settings |
| `~/.config/kglobalshortcutsrc` | Global keyboard shortcuts |
| `~/.config/krunnerrc` | KRunner runner configuration |
| `~/.config/baloofilerc` | Baloo file indexer config |
| `~/.config/kded5rc` / `kded6rc` | KDE Daemon configuration |
| `~/.config/ksmserverrc` | Session manager |
| `~/.config/plasma-localerc` | Locale settings |
| `~/.config/plasmanotifyrc` | Notification settings |
| `~/.config/kdeglobals` | Global KDE appearance settings |
| `~/.config/Kvantum/` | Kvantum theme engine themes |
| `~/.local/share/plasma/` | Custom plasmoids/widgets |
| `~/.local/share/kwin/scripts/` | KWin scripts |
| `/etc/xdg/` | System-wide defaults |
| `$KDEHOME` | Override for user-level KDE home (default: `~/.local`) |

Config file format: INI-style key-value pairs in groups, UTF-8 encoded.

Panel config is stored in `~/.config/plasmashellrc`.

### D-Bus Interfaces & Scripting

KDE is deeply D-Bus integrated. KWin exposes a D-Bus interface for scripting.

**KWin Scripting:**
- Scripts are JavaScript files loaded into KWin's QML/JS engine.
- Two global objects: `workspace` (core WM interface) and `options` (configuration).
- Open the interactive console: KRunner → type `wm console`
- Install scripts: System Settings → Window Management → KWin Scripts → Get New Scripts
- Scripts can call `callDBus(service, path, interface, method, ...args, callback)` — always async.

**Useful D-Bus commands (CLI):**
```bash
# List all KDE D-Bus services
qdbus | grep kde

# Call KWin D-Bus
qdbus org.kde.KWin /KWin

# Trigger KRunner
qdbus org.kde.krunner /App display

# Switch Activity
qdbus org.kde.ActivityManager /ActivityManager/Activities SetCurrentActivity <id>
```

**kwin-mcp** — an open-source MCP server that enables AI agents (and scripts) to do full GUI automation on KDE Plasma 6 Wayland using KWin's EIS interface and isolated virtual sessions.
- GitHub: https://github.com/isac322/kwin-mcp

---

## 2. Customization Deep Dive

### Theming Layer System (outermost to innermost)

```
Global Theme (Look and Feel)
  ├── Plasma Style (Desktop Theme) — panels, widgets, OSD, lock screen
  │     └── Color Scheme — colors for Plasma UI elements
  ├── Window Decorations (Aurorae SVG or KDecoration C++ plugin)
  ├── Icon Theme (Freedesktop spec)
  ├── Cursor Theme
  ├── Application Style (Qt widget style — Breeze, Fusion, Kvantum)
  │     └── Kvantum Engine — intercepts Qt rendering via Qt Style Sheets
  ├── Splash Screen
  └── Lock Screen Theme
```

**Global Theme (Look and Feel):** bundles all of the above, or any subset. Applied via System Settings → Appearance → Global Theme.

**Plasma Style (Desktop Theme):** controls panels, widget backgrounds, OSD popups, clock, notification area. Lives in `~/.local/share/plasma/desktoptheme/`.

**Color Scheme:** plain INI file defining system-wide colors. Lives in `~/.local/share/color-schemes/`. Can be overridden per-Plasma-Style.

**Window Decorations:** the titlebar and borders.
- Aurorae: SVG-based, no compilation needed. Most KDE Store window decorations.
- KDecoration2: C++ plugins (e.g., Klassy, Breeze).

**Application Style:** how Qt widgets render inside apps. Kvantum is the most powerful option here.

**Kvantum Engine:**
- Intercepts Qt application rendering using Qt Style Sheets (CSS-like).
- Allows transparency, blurs, custom shapes in apps.
- Install: `kvantum` package (most distros).
- Configure: `kvantummanager` GUI.
- Theme paths (priority order): `~/.config/Kvantum/$THEME/` → `~/.themes/$THEME/Kvantum/` → `~/.local/share/themes/$THEME/Kvantum/`
- After installing a Kvantum theme, set Application Style to "Kvantum" or "kvantum-dark" in System Settings → Appearance → Application Style.

### Top Community Themes (2024-2025)

| Theme | Type | Highlights | Source |
|-------|------|------------|--------|
| **Layan** | Global Theme | Flat material design, purple accents, translucent elements, light+dark variants | KDE Store |
| **Sweet** | Global Theme | Neon-gradient dark, vibrant "Candy" icons, bold | KDE Store |
| **Orchis** | Global Theme | Comprehensive: Aurorae decorations, Kvantum, color schemes, full LnF | KDE Store / GitHub |
| **Breeze** (default) | Global Theme | KDE default, clean, minimal, polished — excellent baseline | Built-in |
| **Klassy** | Window Dec + Global | Highly customizable titlebars and window frames | GitHub: paulmcauley/klassy |
| **WhiteSur** | Global Theme | macOS Big Sur-inspired | KDE Store |
| **Nordic** | Global Theme | Nord color palette, dark | KDE Store |
| **Catppuccin** | Color Scheme + more | Pastel dark theme, multiple flavors (Mocha, Macchiato, etc.) | GitHub: catppuccin/kde |
| **Dracula** | Color Scheme + Plasma Style | Dark purple, highly popular | draculatheme.com/kde |
| **Gruvbox** | Color Scheme | Warm retro dark/light | KDE Store |
| **Utterly Nord** | Global Theme | Nord-inspired, modern floating panel look | KDE Store |
| **Colloid** | Global Theme | Rounded, modern, GTK-inspired | KDE Store |
| **ChromeOS** | Global Theme | Chrome OS aesthetic | KDE Store |
| **Everforest** | Color Scheme | Green-tinted dark | KDE Store |
| **Fluent** | Global Theme | Windows 11-inspired, modern | KDE Store |

Install any of the above directly: System Settings → Appearance → Global Theme → Get New Global Themes (or individual sub-categories).

### KWin Scripts & Effects

**Built-in KWin Effects (notable):**
- Cube (removed then restored in Plasma 6)
- Desktop Grid
- Overview (Plasma 6 default Activity/desktop view)
- Magic Lamp (minimize animation)
- Wobbly Windows
- Blur (behind translucent windows)
- Fade, Slide, Glide (window animations)
- Night Color (blue light filter, built into KWin)
- Variable Refresh Rate / adaptive sync (Wayland, Plasma 6)

**KWin Script Capabilities:**
- React to window events (open, close, focus, move, resize)
- Place windows programmatically
- Assign windows to virtual desktops or activities
- Call D-Bus methods
- Query and modify workspace state

### Panel Customization

- Add panels: right-click desktop → Add Panel
- Panel positions: top, bottom, left, right
- Floating panels: right-click panel → Edit mode → More Options → Floating (default in Plasma 6)
- Floating panels auto-switch to solid when a window is maximized or approaches
- Widgets added via drag-and-drop in edit mode
- Flexible Spacer widget: use two of these flanking widgets to center them
- Panel transparency: controlled by Plasma Style

### Virtual Desktops vs Activities

| Feature | Virtual Desktops | Activities |
|---------|-----------------|------------|
| Analogy | Multiple monitors on one desk | Switching to a completely different desk/PC |
| Scope | App grouping | Full context switch (own wallpaper, widgets, virtual desktops) |
| Per-activity VDs | No | Yes — each Activity can have its own set of VDs |
| Persistent state | Apps stay open | Apps can be context-specific |
| Use case | Group open apps | Separate life contexts (work, personal, gaming) |
| Switch shortcut | Meta+1-9, Ctrl+F1-F4 | KRunner: type Activity name |

Activities can have:
- Different wallpapers and widgets per activity
- Application-to-activity assignment via KWin rules
- Their own virtual desktop counts

### Keyboard Shortcuts & Custom Shortcuts

Access: System Settings → Shortcuts → Global Shortcuts / Custom Shortcuts

Three shortcut categories in KDE:
1. **Global Shortcuts** — system-wide shortcuts (switch desktop, launch apps, control media)
2. **Standard Shortcuts** — per-app standard actions (copy, paste, save)
3. **Custom Shortcuts** — user-defined command/URL triggers

Creating a custom shortcut:
1. System Settings → Shortcuts → Custom Shortcuts → Edit → New → Global Shortcut → Command/URL
2. Assign a key combination and a shell command

Shortcut config stored in: `~/.config/kglobalshortcutsrc`

KDE also supports per-application shortcut schemes via System Settings → Shortcuts → Application Shortcuts.

---

## 3. Must-Have Extensions & Widgets

### Top KDE Plasma Widgets (Plasmoids)

| Widget | Function | Source |
|--------|----------|--------|
| **System Monitor** (built-in) | CPU, RAM, network, disk — configurable faces | Built-in (ksystemstats backend) |
| **Thermal Monitor** | CPU/GPU temperatures in panel/desktop | KDE Store / github:olib14/thermalmonitor |
| **Event Calendar** | Calendar + Google Calendar sync + weather | zren.github.io/kde/widget/eventcalendar |
| **Application Dashboard** | Full-screen app launcher | Built-in |
| **Latte Separator** | Visual separator widget | KDE Store |
| **Simple System Monitor** | Compact CPU/RAM/swap display | KDE Store |
| **Now Playing** | Music controls (Amarok, Clementine, etc.) | Built-in / KDE Store |
| **Klipper** (Clipboard) | Clipboard history in system tray | Built-in |
| **Network Manager** | WiFi/VPN management applet | Built-in |
| **Media Controller** | MPRIS2 media controls | Built-in |
| **Digital Clock** | Customizable clock with calendar popup | Built-in |
| **Weather Widget** | Current weather in taskbar | Built-in / KDE Store |
| **Pager** | Virtual desktop switcher | Built-in |
| **Window Title** | Current window title in panel | KDE Store |
| **Panel Spacer (Flexible)** | Dynamic spacing for panel alignment | Built-in |
| **Window Buttons** (for panels) | Window control buttons in panel | KDE Store |
| **Plasma Drawer** | Slide-out app drawer | KDE Store |
| **Compact Shutdown** | Quick shutdown/restart from panel | KDE Store |
| **KDE Connect Device Indicator** | Phone integration status | KDE Connect package |
| **Comic Strip** | Web comics on desktop | KDE Store |

### Top KWin Scripts (Tiling & Window Management)

**Tiling for Plasma 6:**

| Script | Status | Approach | Install |
|--------|--------|----------|---------|
| **Polonium** | Active (Plasma 6 native) | Autotiling via KWin's built-in tiling mode | github:zeroxoneafour/polonium |
| **Krohnkite** | Ported to KWin 6 | Dynamic tiling inspired by dwm; layouts: tile, monocle, floating, spread, stair | KDE Store (search "Krohnkite") |
| **Bismuth** | Unmaintained (Plasma 5 only) | Was the most popular; Polonium is its successor | N/A for Plasma 6 |

**Built-in KWin Tiling (Plasma 5.27+):**
- Available but basic: does not auto-tile new windows, does not auto-fill screen.
- Access: System Settings → Window Management → Window Tiling
- Better as a foundation for Polonium to build on.

**Other notable KWin scripts:**
- MinimizeAll — minimize all windows with a shortcut
- Sticky Window Snapping — snap windows to each other
- Invert Window Color — invert a single window's colors
- Force Blur — force blur behind any window

### Latte Dock Status (Plasma 6)

- **Latte Dock is DEAD for Plasma 6.** Development discontinued. Does not work with Plasma 6 / KWin 6.
- Replaced by: native Plasma panels (now floating by default, much more capable in Plasma 6).
- Alternatives investigated: Cairo-Dock, Docky, Eww — none are considered close replacements.
- Community consensus: use the native Plasma panel, configure it with widgets to taste.

---

## 4. Compatible Projects & Tools

### KDE Connect

**What it does:** seamlessly links Linux desktop to Android/iOS devices over local network (TLS encrypted, never routes through internet).

**Feature list (as of March 2025):**
- Shared clipboard (bidirectional)
- File sharing from any app via share sheet
- Notifications mirroring (phone notifications on desktop, reply from desktop)
- Remote input — phone as trackpad/keyboard
- Remote presenter — use phone as presentation remote
- SMS sending from desktop
- Media control (control desktop media from phone, and vice versa)
- Remote commands (run preset shell commands on PC from phone)
- KDE Connect device indicator widget in Plasma panel
- Virtual touchpad and keyboard
- Digitizer plugin (version 1.35+) — phone as pressure-sensitive drawing tablet
- In-app notification view (March 2025)

**Platforms:** Android (Play Store + F-Droid), iOS (App Store + TestFlight), all Linux DEs (not KDE-exclusive)

**Package name:** `kdeconnect` / `kdeconnect-kde`

### Bismuth / Krohnkite / Polonium (Tiling)

See section 3 above. Summary:
- **Plasma 6:** use Polonium or Krohnkite
- **Plasma 5:** Bismuth was the standard (now unmaintained)
- Both Polonium and Krohnkite are configured via System Settings → Shortcuts for tiling keybindings

### Kvantum

See section 2 (Customization) for full coverage.

Package: `kvantum` (Arch/Manjaro), `qt5-style-kvantum` (some distros), `kvantum-qt6` for Qt6 apps.
Config GUI: `kvantummanager`

### Conky & System Monitoring Alternatives

- **Conky** — works on KDE (X11 and Wayland with limitations). Configured via `~/.conkyrc`. Wayland support is partial.
- **Plasma System Monitor** — native KDE app. Full-featured, configurable sensor pages. Package: `plasma-systemmonitor`
- **KSysGuard** — older KDE system monitor (replaced by Plasma System Monitor in Plasma 5.21+)
- **Plasma Widgets** — Thermal Monitor, System Monitor widgets are the native Wayland-compatible approach.

### Kate / KDevelop IDE Integration

- **Kate** — powerful text editor with LSP support, Git integration, sessions, split view, plugin system. Package: `kate`
  - Plugin: `kate-git-blame` — inline git blame
  - Integrates with KDE's file manager, terminals, build systems
- **KDevelop** — full IDE with C++/Python/PHP support, CMake integration, debugger, code analysis. Package: `kdevelop`

### Dolphin File Manager

**Power Features:**
- Split view (F3) — side-by-side panels
- Integrated terminal panel (F4) — runs in current folder
- Services/actions — right-click context menu plugins
- Version control integration (git, SVN) via `dolphin-plugins`
- Nextcloud sync plugin
- Advanced search via Baloo integration
- Batch rename (F2 on multiple selection)
- Selection mode (hamburger menu)
- Three view modes: Icon, Details, Compact
- Hidden files toggle (Alt+. or toolbar button)
- Tabs for multiple locations
- Places panel for bookmarks
- Disk usage view (optional)

**Key package:** `dolphin`
**Plugins package:** `dolphin-plugins` (git, SVN, Mercurial, etc.)

### Yakuake Drop-Down Terminal

- Drop-down terminal based on Konsole technology, Quake-style.
- Hotkey: **F12** to show/hide.
- Configurable: width %, height %, position, animation speed.
- Tabbed interface (Ctrl+Shift+T for new tab).
- D-Bus interface for scripting: can open tabs, run commands, rename sessions programmatically.
- Configuration: Ctrl+Shift+, opens settings.
- Skinnable (Yakuake skins on KDE Store).
- Package: `yakuake`

### KRunner

**Default runners (built-in):**
- Applications launcher
- Window switcher (type window title)
- Calculator
- Unit converter
- Spell checker
- Web search shortcuts
- File/folder search (Baloo)
- Shell commands (prefix with `>`)
- Virtual desktop switcher
- Activity switcher
- Define word (dictionary)
- Recent documents

**Notable community KRunner plugins (KDE Store → KRunner Plugins):**
- Firefox Profiles — launch Firefox with specific profile
- NordVPN — connect/disconnect VPN from KRunner
- Terminal Sessions — list and create Konsole sessions
- Various snippets/password manager integrations

**Plugin development:** C++ (KRunner framework) or QML. Plugin store: https://store.kde.org/browse?cat=628

**Access:** Meta key (default) or Alt+F2 or Alt+Space. Can be pinned to stay open.

### Spectacle Screenshot Tool

**Capture modes:**
- Entire desktop
- Single monitor
- Active window
- Window under cursor
- Rectangular region
- Freeform region

**Features:**
- Annotation tools (arrows, text, boxes, blur regions)
- Screen recording (Wayland, added in 23.04)
- Exclude individual windows from recordings (title bar menu or Task Manager)
- OCR text extraction (added in Plasma 6.6, February 2026) — powered by Tesseract, copies extracted text to clipboard
- Multiple export formats: PNG (default), JPEG, AVIF, TIFF, BMP
- Configurable save paths and filename patterns

Package: `spectacle`

### KDE + Development Tools Integration

- **VS Code on KDE:** KDE's file picker integrates via `xdg-desktop-portal-kde`. Set `GTK_USE_PORTAL=1` if needed. Wayland-native with `--enable-features=WaylandWindowDecorations`.
- **Konsole** — KDE's terminal. Profiles, splits, SSH bookmarks, transparency.
- **Git integration:** Kate, Dolphin plugins, and KDevelop all have native git support.
- **KDE systemd integration:** services can be managed via System Settings → Autostart or KDE's service manager.

---

## 5. Advanced Configuration

### Wayland vs X11 — Current State (2026)

**Status:** KDE has announced Wayland-only future. The X11 session will be supported until early 2027.

| Aspect | Status |
|--------|--------|
| Default since | Plasma 6.0 (Feb 2024) |
| User adoption | 70%+ of Plasma users on Wayland |
| X11 EOL | Plasma 6.8 will be Wayland-exclusive; X11 session supported until early 2027 |
| Gaming performance | Wayland now equals or exceeds X11 on most workloads per Ubuntu 25.04 benchmarks |
| NVIDIA | Proprietary drivers now work well; Nouveau for legacy GPUs |
| Multi-monitor | Wayland is superior (better color management, per-display scaling) |
| Screen recording | Works via PipeWire + xdg-desktop-portal |
| HDR | Supported on Wayland only |
| Adaptive sync / VRR | Wayland only |

**Known remaining Wayland issues (March 2026):**
- Some older screen sharing tools need PipeWire support
- Very old NVIDIA GPUs may need Nouveau
- Some niche X11-only applications require XWayland (which is provided automatically)

### Multi-Monitor Setup Best Practices

- Configure per-display: System Settings → Display and Monitor → Display Configuration
- Per-display scaling supported (HiDPI mixed setups)
- Fractional scaling available on Wayland
- KScreen (kcm_kscreen) for monitor arrangement
- ICC profiles: System Settings → Display and Monitor → select color profile per display
- Plasma 6.5.3 improved VRR (Variable Refresh Rate) smoothness on multi-monitor setups
- MHC2 ICC tag support added in Plasma 6.5.3 for accurate color import

### Color Management & ICC Profiles

- Tool: `kolor-manager` (GitHub: KDE/kolor-manager) — uses Oyranos CMS
- Assign ICC profile per display: System Settings → Display → Color Profile
- Can also use EDID color data from the display (Plasma 6.1+)
- Without ICC profiles, wide-gamut displays show oversaturated colors
- Wayland color management is actively developed (see Xaver's blog series on HDR/color in KWin)

### HDR Support

- Wayland-only feature
- Supported on compatible hardware/drivers in KDE Plasma 6
- HDR gaming works with additional configuration
- PowerDevil brightness control supports HDR displays (per-display API, multi-screen HDR in progress)
- Blog series tracking progress: "HDR and color management in KWin" (planet.kde.org)

### Gaming on KDE

**Steam integration:**
- Steam runs natively, works on both X11 and Wayland
- Launch options for MangoHud: `MANGOHUD=1 %command%`
- Launch options for GameMode: `gamemoderun %command%`
- Combine: `MANGOHUD=1 gamemoderun %command%`
- Flatpak Steam MangoHud global enable: `flatpak override --user --env=MANGOHUD=1 com.valvesoftware.Steam`

**Lutris integration:**
- MangoHud via Command prefix field: `mangohud --dlsym`
- Environment variables: add in System options tab → Environment variables table
- GameMode: install `gamemode` package, run `gamemoded` service

**Known issue:** ananicy-cpp and gamemode both modify process niceness — use one or the other, not both.

**Bazzite Linux:** an immutable gaming-focused distro (Fedora-based) with KDE Plasma, pre-configured for Steam/Lutris/MangoHud/GameMode.

**CachyOS:** Arch-based with performance kernel patches, good KDE Plasma gaming setup guide.

### Power Management & Laptop Optimizations

**PowerDevil (KDE native):**
- Built-in KDE power management service
- Controls: screen brightness, keyboard backlight, suspend/hibernate, lid close behavior, battery charge thresholds
- Power profiles switcher: Meta+B or battery function key → OSD shows Power Save / Balanced / Performance
- Config: System Settings → Power Management

**Third-party tools:**
- **TLP** — comprehensive laptop power optimization. Package: `tlp`. Config: `/etc/tlp.conf`. Best for fine-grained control. Disable CPU-related TLP settings if using auto-cpufreq.
- **auto-cpufreq** — automatic CPU frequency scaling based on load and power source. Package: `auto-cpufreq`.
- **power-profiles-daemon** — simpler power profile management. Integrates with PowerDevil's OSD switcher.

**Caution:** Do not run TLP + auto-cpufreq with overlapping CPU management. Pick one.

### Backup & Restore KDE Configuration

**Critical directories to back up:**
```
~/.config/          # All KDE/app configuration
~/.local/share/     # Themes, custom scripts, applets, icons installed by user
~/.local/share/plasma/  # Custom plasmoids
~/.local/share/color-schemes/  # Custom color schemes
~/.themes/          # Manually installed themes
~/.icons/           # Manually installed icon themes
```

**Tools:**

| Tool | Approach | Notes |
|------|----------|-------|
| **Konsave** | CLI snapshot tool, KDE-aware | `pip install konsave`; `konsave -s profile_name`, `konsave -a profile_name` |
| **chezmoi** | Dotfile manager, Git-based | Works but KDE INI files are tricky (volatile sections) |
| **chezmoi + chezmoi-modify-manager** | Selective INI section tracking | Best approach for version-controlled KDE config |
| **yadm** | Git dotfile wrapper | Simpler than chezmoi, good for basic backup |
| **Custom bash scripts** | `rsync` or `cp` of config dirs | github:rubenaleman/kde-plasma-backup |

**Konsave** is the most KDE-specific and recommended for simple backup/restore.

---

## 6. Cool Ideas & Power User Tips

### KDE Activities for Workflow Separation

**Setup strategy:**
- Create one Activity per major life context: Work, Personal, Creative, Gaming
- Each Activity gets: custom wallpaper, specific widgets, its own virtual desktops
- Assign apps to Activities via KWin Rules (right-click titlebar → More Actions → Configure Special Window Settings → Activity)
- KRunner: type an Activity name to switch instantly
- Shortcut: Meta+Tab cycles through Activities (configurable)

### Custom KRunner Plugins

Development paths:
- **C++**: Implement `Plasma::AbstractRunner` from KRunner framework. Full performance.
- **Script-based**: Python/bash via D-Bus call wrappers (less common)
- **QML**: Some community plugins use QML

Browse existing plugins: https://store.kde.org/browse?cat=628

### Automating KDE with D-Bus and Scripts

```bash
# Switch to virtual desktop 2
qdbus org.kde.KWin /KWin setCurrentDesktop 2

# Lock screen
qdbus org.kde.screensaver /ScreenSaver Lock

# Open KRunner
qdbus org.kde.krunner /App display

# Show Desktop
qdbus org.kde.KWin /KWin showDesktop

# Trigger notification
notify-send "Title" "Message"

# Run KWin script from file
qdbus org.kde.KWin /Scripting loadScript /path/to/script.js
```

### KDE + Tiling (Polonium / Krohnkite)

**Polonium setup:**
1. Install from KDE Store (System Settings → Window Management → KWin Scripts → Get New Scripts → "Polonium")
2. Enable it in the list
3. Assign keyboard shortcuts for: toggle tiling, move focus, rotate layout, etc.
4. Config file: `~/.config/poloniumrc`

**Krohnkite layouts:** BSP Tile, Monocle, Three Column, Stair, Spread

### Klipper (Clipboard Manager) Advanced Usage

- History size: up to 2,048 items (configure in System Settings → General Behavior → Clipboard)
- Search: open Klipper popup → start typing to filter
- Actions: define regex patterns → matching clipboard content triggers configurable URL/command actions
  - Example: text matching `^https?://` → open in browser
- QR code generation: click QR icon next to any clipboard item
- Files and folders can be kept in clipboard history (unlike Windows)
- Keyboard shortcut to open history: Ctrl+Alt+V (default, configurable)
- Config file: `~/.config/klipperrc`

### Baloo File Indexing — Optimize or Disable

**Check status:**
```bash
balooctl status
```

**Disable completely:**
```bash
balooctl disable
```

**Re-enable:**
```bash
balooctl enable
balooctl start
```

**Optimize (recommended approach instead of disabling):**
1. System Settings → Search → File Search
2. Uncheck "Also index file content" (reduces CPU/IO significantly)
3. Add exclusion folders: Downloads, node_modules, build directories, VM images, large backup folders
4. Or edit `~/.config/baloofilerc` directly

**Config file example:**
```ini
[Basic Settings]
Indexing-Enabled=true

[General]
exclude folders[$e]=$HOME/Downloads,$HOME/Videos,$HOME/.local/share/Steam
only basic indexing=true
```

KDE Frameworks 6.23.0 (2025) improved Baloo: faster indexing, better memory safety, split long runs into multiple transactions.

### KWin Window Rules for Power Users

Access: Right-click titlebar → More Actions → Configure Special Window Settings

Or: System Settings → Window Behavior → Window Rules

**What you can control per-application:**
- Force open on specific virtual desktop or Activity
- Force size, position, maximized state
- Set minimum/maximum size
- Disable decorations
- Force above/below other windows
- Set opacity
- Prevent resizing/moving
- Skip taskbar / skip pager

**Example use cases:**
- Spotify always opens on VD3 maximized
- KCalc always floats at 400x600, center-screen
- mpv always on top, no decoration
- Terminal opens on Activity "Work" VD1

Rules are evaluated top-to-bottom; first matching rule for each attribute wins.

### KDE Plasma on Different Distros — Best Pairings

| Distro | Best For | KDE Version |
|--------|----------|-------------|
| **KDE neon** | Latest KDE, pure experience, daily builds, Ubuntu LTS base | Latest stable/unstable |
| **Kubuntu** | Stability, Ubuntu ecosystem, beginners | LTS-aligned |
| **Arch Linux + KDE** | Full control, AUR, rolling | Latest |
| **Manjaro KDE** | Arch-based, beginner-friendly, hardware support | Rolling (slightly delayed) |
| **Fedora KDE Spin** | Vanilla KDE, developer focus, RPM, SELinux | Current |
| **OpenSUSE Tumbleweed** | Rolling + rigorous testing, YaST, snapshots | Latest |
| **Garuda Linux (Dr460nized)** | Gamers, Arch-based, performance patches, eye-candy | Latest |
| **Bazzite (KDE)** | Gaming-first, immutable, Steam Deck compatibility | Latest |
| **CachyOS** | Performance kernel, gaming, Arch-based | Latest |
| **Debian Stable + KDE** | Maximum stability (older KDE version) | Stable channel |

**Community consensus:** KDE neon for latest features; Kubuntu for stability; Arch/Manjaro for control; Fedora for developers; Bazzite/Garuda for gaming.

---

## 7. Community & Resources

### Official Resources

| Resource | URL | Purpose |
|----------|-----|---------|
| KDE Store | https://store.kde.org | Themes, widgets, KWin scripts, icons, cursors, wallpapers |
| KDE UserBase Wiki | https://userbase.kde.org | End-user documentation and how-tos |
| KDE Community Wiki | https://community.kde.org | Developer/contributor documentation |
| KDE Discuss Forum | https://discuss.kde.org | Official KDE discussion forum |
| KDE Blogs / Planet KDE | https://planet.kde.org | Developer blogs and announcements |
| KDE GitLab | https://invent.kde.org | Source code, bug reports, merge requests |
| KDE Bug Tracker | https://bugs.kde.org | Bug reports |
| KDE Matrix/IRC | matrix.to (#kde:kde.org) | Real-time community chat |
| KDE Mailing Lists | https://mail.kde.org | Low-traffic announcements |

### KDE Store Categories (store.kde.org)

| Category | URL |
|----------|-----|
| Plasma Themes | /browse?cat=104 |
| Global Themes (LnF) | /browse?cat=129 |
| KWin Scripts | /browse?cat=210 |
| Window Decorations | /browse?cat=114 |
| Color Schemes | /browse?cat=101 |
| Icon Themes | /browse?cat=132 |
| Plasma Extensions (Widgets) | /browse?cat=418 |
| KRunner Plugins | /browse?cat=628 |
| Kvantum Themes | /browse?cat=123 |
| Wallpapers | /browse?cat=116 |

### Community Forums & Social

- **Reddit:** r/kde — active community, screenshots, help, news
- **Reddit:** r/unixporn — KDE ricing and desktop customization (heavily KDE represented)
- **EndeavourOS Forum** — strong KDE Plasma help community
- **Arch Linux Forums** — detailed KDE troubleshooting threads
- **Manjaro Forum** — KDE-specific support

### YouTube Channels for KDE

(Search these channels on YouTube)
- **The Linux Experiment** — KDE news, reviews, comparisons
- **Brodie Robertson** — KDE Plasma deep dives, power user tips
- **EF - Linux Made Simple** — Plasma tutorials for beginners/intermediate
- **Mental Outlaw** — KDE ricing and customization
- **Linux Tex** — KDE customization tutorials

### Curated Awesome Lists

- **awesome-kde (francoism90):** https://github.com/francoism90/awesome-kde
- **awesome-kde (shvedes):** https://github.com/shvedes/awesome-kde

---

## Quick Reference: Key Package Names

| Tool | Package (Arch) | Package (Ubuntu/Debian) |
|------|---------------|------------------------|
| KDE Plasma | `plasma-meta` | `kde-plasma-desktop` |
| KWin | `kwin` | `kwin-wayland` |
| Dolphin | `dolphin` | `dolphin` |
| Dolphin Plugins | `dolphin-plugins` | `dolphin-plugins` |
| Konsole | `konsole` | `konsole` |
| Yakuake | `yakuake` | `yakuake` |
| Spectacle | `spectacle` | `spectacle` |
| KRunner | `krunner` | (included in plasma) |
| KDE Connect | `kdeconnect` | `kdeconnect` |
| Kvantum | `kvantum` | `qt5-style-kvantum` |
| Plasma System Monitor | `plasma-systemmonitor` | `plasma-systemmonitor` |
| Baloo | `baloo` | `baloo-kf6` |
| Kate | `kate` | `kate` |
| KDevelop | `kdevelop` | `kdevelop` |
| Polonium (tiling) | AUR: `kwin-script-polonium` | Manual install |
| Krohnkite (tiling) | KDE Store | KDE Store |
| TLP | `tlp` | `tlp` |
| GameMode | `gamemode` | `gamemode` |
| MangoHud | `mangohud` | `mangohud` |
| Konsave | `python-konsave` (AUR) | `pip install konsave` |

---

## Related Notes

- [[My Stack Decisions]] — technology choices including desktop setup
- [[KDE Connect]] — if expanded into dedicated note
- [[Linux Gaming Setup]] — Steam/Lutris/MangoHud details
- [[KDE Plasma Live Wallpapers]] — animated/video/shader wallpapers for Plasma 6 + Wayland (researched 2026-03-14)
- [[KDE Plasma 6 Glassy UI Effects]] — blur, frosted glass, Kvantum, rounded corners, complete glassy theme stacks (researched 2026-03-14)

#kde #plasma #linux #desktop-environment #knowledge-graph

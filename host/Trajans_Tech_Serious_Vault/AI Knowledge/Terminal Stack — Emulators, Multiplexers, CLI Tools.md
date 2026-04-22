# Terminal Stack — Emulators, Multiplexers, CLI Tools

**Research date:** 2026-03-14
**Scope:** Modern terminal emulators, multiplexers, and CLI enhancement tools for KDE Plasma 6 on Wayland (AMD GPU, dual monitors, developer/power user)
**Replaces:** Konsole (the KDE default)

---

## 1. Terminal Emulators — Feature Matrix

| Emulator | Language | GPU | Wayland | Tabs/Splits | Images | Ligatures | Config | Stars | Last Release |
|----------|----------|-----|---------|-------------|--------|-----------|--------|-------|-------------|
| **WezTerm** | Rust | OpenGL | Yes | Yes (built-in mux) | Yes (kitty protocol + imgcat) | Yes | Lua | 24.8k | Feb 2024 (stalled) |
| **Kitty** | C + Python | OpenGL | Yes | Yes (tabs + 7 layouts) | Yes (own protocol) | Yes | kitty.conf | 31.8k | Mar 2026 (v0.46.0) |
| **Alacritty** | Rust | OpenGL | Yes | No native (use multiplexer) | No | No | TOML | ~57k | Oct 2025 (v0.16.1) |
| **Ghostty** | Zig | Metal/OpenGL | Yes (GTK) | Yes (tabs + splits) | Yes (kitty protocol) | Yes | key=value | 46.5k | v1.3.1 (2026) |
| **Foot** | C | — | Native only | No | Sixel only | No | foot.ini | ~7k | Active (Mar 2026) |
| **Rio** | Rust | WGPU | Yes | Yes (splits) | Partial | Yes | TOML | 6.5k | v0.2.37 (Dec 2025) |
| **Contour** | C++ | OpenGL 3.3 | Yes | Tabs | Sixel + hyperlinks | Yes | YAML | 2.9k | v0.6.2.8008 (Jan 2026) |
| **Tabby** | Electron | — | Yes | Yes (splits, tabs) | No | Yes | GUI | 69.5k | Dec 2024 |

---

## 2. Terminal Emulator Deep Dives

### WezTerm

**Overview:** Rust-based, GPU-accelerated terminal with a built-in multiplexer. The most feature-complete single-binary solution available. Configured entirely in Lua, which gives programmers near-total control.

**Strengths:**
- Built-in multiplexer: tabs, panes, splits — no tmux/zellij needed
- SSH multiplexer: can multiplex over SSH connections, keeping sessions alive
- Lua config is powerful: event hooks, dynamic behavior, status bar scripting
- Native support for both kitty image protocol and imgcat
- Font ligatures, emoji, full Unicode, variable fonts
- Wayland support confirmed (native Wayland backend)
- Cross-platform: Linux, macOS, Windows — same config everywhere
- 24.8k stars, 389 contributors, very active community

**Weaknesses:**
- **Last stable release was February 3, 2024** — this is a major red flag. The project has ~1.4k open issues and 204 open PRs. The main developer (Wez Furlong) appears to have significantly slowed development. Nightly builds continue but there has been no stable release in over a year.
- Lua config has a learning curve
- Slightly higher memory footprint than minimal emulators

**Wayland:** Full native Wayland support via its own backend. AMD GPUs work well.

**Config location:** `~/.config/wezterm/wezterm.lua`

**Install (Ubuntu/KDE Neon):**
```bash
# Flatpak (recommended given stalled releases)
flatpak install flathub org.wezfurlong.wezterm

# Or AppImage from GitHub nightly releases
# Or official .deb (last stable Feb 2024)
curl -fsSL https://apt.fury.io/wez/ | sudo tee /etc/apt/sources.list.d/wezterm.list
sudo apt install wezterm
```

**Verdict:** Outstanding feature set, but the stalled release cadence (no stable since Feb 2024) is a serious maintenance concern. Use nightly builds or Flatpak.

---

### Kitty

**Overview:** GPU-accelerated terminal written in C with Python extensibility. The oldest and most battle-tested GPU terminal. Extremely actively maintained (v0.46.0 released March 11, 2026 — 133 releases total).

**Strengths:**
- Fastest active development of any major GPU terminal (17,436 commits, 396 contributors)
- Built-in tabs and 7 window layouts: Stack, Tall, Fat, Grid, Horizontal, Vertical, Splits
- Originated the graphics protocol now used by Ghostty and WezTerm
- Kittens extensibility: image viewer (icat), diff tool, file selection, unicode input, theme manager
- Remote control API: control kitty from scripts or shell
- Shell integration: prompt navigation, marks, clone-in-new-window
- Font ligatures, variable fonts, emoji with per-glyph substitution
- "Wayland goodies" added in v0.34 — full native Wayland support
- Scrollbar support added recently (v0.46 area)
- Session management added (v0.46 area)

**Weaknesses:**
- Config format is custom (kitty.conf, not a standard language)
- Python kittens have overhead vs compiled alternatives
- Does not have WezTerm's SSH multiplexer capabilities
- Some users find the config verbose

**Wayland:** Full native Wayland. Works on AMD with no special config.

**Config location:** `~/.config/kitty/kitty.conf`

**Install (Ubuntu/KDE Neon):**
```bash
# Official installer (recommended — always current version)
curl -L https://sw.kovidgoyal.net/kitty/installer.sh | sh /dev/stdin

# Add to PATH
ln -sf ~/.local/kitty.app/bin/kitty ~/.local/kitty.app/bin/kitten ~/.local/bin/

# Desktop integration
cp ~/.local/kitty.app/share/applications/kitty.desktop ~/.local/share/applications/
cp ~/.local/kitty.app/share/applications/kitty-open.desktop ~/.local/share/applications/
sed -i "s|Icon=kitty|Icon=$(readlink -f ~)/.local/kitty.app/share/icons/hicolor/256x256/apps/kitty.png|g" ~/.local/share/applications/kitty*.desktop
```

**Verdict:** The safest bet for a long-term investment. Most actively developed GPU terminal on Linux, excellent Wayland support, built-in layout system reduces need for a multiplexer.

---

### Alacritty

**Overview:** Minimalist, OpenGL-accelerated terminal. Intentionally does not include tabs or splits — designed to pair with a multiplexer. TOML configuration.

**Strengths:**
- Extremely simple and stable
- TOML config is easy to understand
- Active development (v0.16.1, Oct 2025)
- Very low resource overhead
- Good Wayland support (app_id via window.class.general)
- Vi mode for keyboard-driven navigation
- Regex hints for interacting with terminal text

**Weaknesses:**
- No tabs, no splits — requires Zellij or tmux
- No image protocol support
- No font ligatures
- No session management built in
- Fewer features than any other emulator here

**Config location:** `~/.config/alacritty/alacritty.toml`

**Install (Ubuntu/KDE Neon):**
```bash
# Via cargo (always latest)
cargo install alacritty

# Or PPA
sudo add-apt-repository ppa:aslatter/ppa
sudo apt install alacritty
```

**Verdict:** Fine choice if you want pure simplicity and pair it with Zellij. Not the best standalone option.

---

### Ghostty

**Overview:** Brand new (launched Dec 2024) Zig-based terminal. Fastest-growing terminal in GitHub history (46.5k stars, 521 contributors). Uses GTK on Linux, Metal on macOS. GPU-accelerated via OpenGL on Linux.

**Strengths:**
- Zero-configuration philosophy — works great out of the box with embedded JetBrains Mono + Nerd Fonts
- Tabs and splits built in (native UI components)
- Kitty graphics protocol support
- Font ligatures
- Runtime config reload (Ctrl+Shift+,)
- Simple key=value config format
- Massive community momentum and active development (v1.3.1 in 2026)
- Supports Dracula and 450+ color schemes from iTerm2-Color-Schemes project

**Weaknesses:**
- Linux version uses GTK, not native Qt — looks slightly out of place in KDE Plasma without theming
- No Lua/Python scripting — less programmable than WezTerm or Kitty
- Relatively new (Dec 2024 launch) — edge cases still being found
- No SSH multiplexer
- No session persistence built in

**Wayland:** Yes, via GTK's Wayland backend. On KDE Plasma, GTK apps may not pick up Plasma theming automatically — install `gtk3-nocsd` or configure GTK theme via `~/.config/gtk-3.0/settings.ini` for consistent look.

**Config location:** `~/.config/ghostty/config`

**Install (Ubuntu/KDE Neon):**
```bash
# Community PPA (unofficial but well-maintained)
sudo add-apt-repository ppa:mkasberg/ghostty-ubuntu
sudo apt update
sudo apt install ghostty

# Supported: Ubuntu 24.04 LTS and 25.10
# KDE Neon is based on Ubuntu 24.04 LTS — this PPA works
```

**GTK theming on KDE:** Add to `~/.config/gtk-3.0/settings.ini` and `~/.config/gtk-4.0/settings.ini`:
```ini
[Settings]
gtk-theme-name=Breeze
gtk-icon-theme-name=breeze-dark
gtk-font-name=Noto Sans 10
```

**Verdict:** The most exciting new entrant. Excellent for users who want a modern terminal without config complexity. GTK-on-KDE theming is solvable. Watch this project — it may become the default recommendation within 6-12 months.

---

### Foot

**Overview:** Wayland-native only terminal. Extremely minimal, fast, and written in C. Designed specifically for tiling window managers on Wayland. Has no X11 support at all.

**Strengths:**
- Fastest scrolling performance of any Wayland terminal
- Zero GPU dependency — CPU rendering only, but highly optimized
- Sixel image support
- True color, styled/colored underlines
- IME support, multi-seat support
- Actively maintained (race condition fix committed March 2026)
- MIT licensed, C codebase (97%)

**Weaknesses:**
- Wayland only — no X11 fallback
- No tabs or splits
- No ligatures
- Extremely minimal — requires a multiplexer
- Small community (6.9k stars)
- Foot is designed for sway/i3 users, not KDE Plasma

**Config location:** `~/.config/foot/foot.ini`

**Install (Ubuntu/KDE Neon):**
```bash
sudo apt install foot
```

**Verdict:** Not the right choice for KDE Plasma users. Best fit is tiling WMs like sway. Pass.

---

### Rio

**Overview:** Rust-based terminal using WGPU for rendering. Built on Alacritty's foundations (same ANSI parser, event handling) but adds split panes and CRT visual effects. v0.2.37 stable (Dec 2025), v0.3.0 in unstable development.

**Strengths:**
- WGPU rendering (works on Vulkan, Metal, DX12, OpenGL)
- Split panes
- Font ligatures
- CRT visual effect modes (unique aesthetic feature)
- Even deployed on Steam Deck (Flatpak)
- 6.5k stars, 117 contributors

**Weaknesses:**
- v0.3.0 main branch is unstable; production use requires v0.2.x
- Smaller community than Kitty/WezTerm/Ghostty
- Less mature than the top-tier options
- Limited plugin/extensibility system

**Verdict:** Interesting but not mature enough to recommend over Kitty/Ghostty. Worth revisiting when v0.3.0 stabilizes.

---

### Contour

**Overview:** C++23 GPU terminal with Vi-like modal input. Feature-rich but niche. Latest: v0.6.2.8008 (January 7, 2026).

**Strengths:**
- GPU-accelerated (OpenGL 3.3)
- Vi-like modal input mode (unique)
- Sixel + OSC 8 hyperlinks
- Text reflow
- High-DPI + transparency support
- Its own terminal emulation layer (not VTE-based despite old claims)
- Cross-platform (Linux, macOS, FreeBSD, OpenBSD, Windows)

**Weaknesses:**
- 2.9k stars — small community
- C++23 builds are complex to compile from source
- Less documentation than top alternatives
- Unclear Wayland support status

**Verdict:** Interesting Vi-modal approach, but too niche for a primary recommendation. Only for users who specifically want modal terminal editing.

---

### Tabby (bonus candidate)

**Overview:** Electron-based modern terminal with SSH manager, serial connections, extensive plugin system. Extremely popular (69.5k stars) primarily among Windows/SSH-heavy users.

**Strengths:**
- Best SSH connection manager of any terminal
- Split panes, tabs, extensive theming
- Serial terminal support
- Encrypted credential storage
- Web app version

**Weaknesses:**
- Electron — heavy memory footprint, not GPU-accelerated in the same sense
- Overkill for local terminal use
- Last commit Dec 2024 — slowing down
- Not a good match for Wayland-native power users

**Verdict:** Worth knowing about for SSH-heavy workflows. Not recommended as primary terminal on KDE/Wayland.

---

## 3. Terminal Multiplexers

### Zellij

**Overview:** Rust-based modern terminal workspace. Latest: v0.43.1 (August 8, 2025). Positioned as the modern tmux replacement.

**Key Features:**
- Floating panes (unique vs tmux)
- Layouts defined in KDL format — can load from file, URL, or remote
- Session resurrection: sessions serialized to disk every 1 second, survive crashes and reboots
- Web client (v0.43): share sessions in browser, start new ones remotely
- Multiple pane selection and bulk operations (v0.43)
- Plugin system (WebAssembly plugins)
- Async rendering engine for performance
- Discoverable UI: keybindings shown in status bar by default (no memorization needed)
- Works on Linux and macOS

**Comparison vs tmux:**

| Aspect | Zellij | tmux |
|--------|--------|------|
| Learning curve | Low (UI discoverable) | High (memorize keybindings) |
| Config format | KDL | Custom format |
| Floating panes | Yes | No native support |
| Session persistence | Built-in resurrection | tmux-resurrect plugin |
| Plugin system | WASM plugins | bash/shell scripts via TPM |
| Ecosystem age | 2021, growing fast | 2007, massive ecosystem |
| Startup speed | Slightly slower | Faster |
| Remote sharing | Built-in web client | Third-party (tmate) |
| Scriptability | WASM plugins | Shell scripts, extensive |

**Wayland:** Multiplexers are terminal-protocol level — they are display-server agnostic. Works in any terminal emulator.

**Install (Ubuntu/KDE Neon):**
```bash
# Via cargo (recommended for latest)
cargo install zellij

# Or binary releases
bash <(curl -L zellij.dev/launch)
```

---

### tmux

**Overview:** The classic terminal multiplexer. Mature, battle-tested, massive plugin ecosystem. Latest: v3.6a (December 5, 2024).

**Key Features:**
- Sessions, windows, panes
- Detach/reattach (sessions survive disconnection)
- Copy mode with vi or emacs bindings
- Extensive scriptability via shell
- TPM (Tmux Plugin Manager) with 14.3k stars and rich ecosystem:
  - `tmux-resurrect` — persist sessions across reboots
  - `tmux-continuum` — automatic session saving
  - `tmux-sensible` — sane defaults
  - `tmux-yank` — system clipboard integration
  - `Catppuccin`/`Dracula`/`Nord` themes for status bar
  - `tmux-cpu`, `tmux-battery` — system monitoring in status bar
  - `tmux-sessionx` — fuzzy session switching with zoxide

**Weaknesses:**
- No floating panes
- Steep initial learning curve
- Config format is idiosyncratic
- Status bar customization requires significant effort

**Install (Ubuntu/KDE Neon):**
```bash
sudo apt install tmux

# Install TPM
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
```

---

### screen

**Overview:** Legacy GNU tool, predates tmux. Still present on remote servers but not recommended for local use.

- No recommendation for new setups
- Only relevant when ssh'd into servers where tmux is not available

---

## 4. Recommended Combinations

| Stack | Best For | Pros | Cons |
|-------|----------|------|------|
| **Kitty standalone** | Developer who wants everything in one | 7 built-in layouts, kittens, image support, most actively maintained | No SSH multiplexing, kittens needed for extras |
| **Ghostty standalone** | User wanting modern look with zero config | Beautiful out of box, fast growing, Kitty protocol | GTK in KDE needs theming, newer/less battle-tested |
| **Alacritty + Zellij** | Minimalist who wants separate concerns | Clean separation, Zellij's floating panes shine, easy to learn | Two configs to maintain, no images in Alacritty |
| **Kitty + Zellij** | Power user wanting floating panes + images | Best of both: kitty images/kittens + Zellij floating panes | Slight redundancy in layout systems |
| **Kitty + tmux** | Traditional power user, server work | Battle-tested, massive tmux ecosystem, session resurrection | Steep tmux learning curve |
| **WezTerm standalone** | All-in-one programmer (if tolerating stalled releases) | Lua scripting, SSH multiplexer, most features in one | No stable release since Feb 2024 — risky |
| **Ghostty + Zellij** | Modern aesthetic + workspace management | Ghostty's look + Zellij's floating panes and web sharing | GTK theming for KDE |

---

## 5. CLI Enhancement Tools

### Shell Choice

| Shell | Pros | Cons | Best For |
|-------|------|------|----------|
| **zsh + zinit** | POSIX-ish, massive ecosystem, fast with zinit | Manual setup needed | Power users who need bash compatibility |
| **zsh + oh-my-zsh** | Easiest setup, 300+ plugins, 150 themes | Slow startup, opinionated | Beginners / those wanting batteries-included |
| **Fish 4.5.0** | Autosuggestions + syntax highlighting out of box, clean syntax, web config tool | Not POSIX-compatible (scripts differ), Feb 2026 release | Users who want things to "just work" |

**Recommendation for power user:** `zsh + zinit + zsh-autosuggestions + zsh-syntax-highlighting` — best speed and flexibility.

---

### Prompt

**Starship** (recommended)
- Rust-based, cross-shell (bash, zsh, fish, nushell, etc.)
- Minimal, blazing fast
- Install: `curl -sS https://starship.rs/install.sh | sh`
- Config: `~/.config/starship.toml`
- 1 Nerd Font prerequisite

---

### Navigation & Search

| Tool | Replaces | Stars | Install | Key Feature |
|------|----------|-------|---------|-------------|
| **zoxide** | `cd` | 34.4k | `apt install zoxide` or `cargo install zoxide` | Frecency-based directory jumping; `z foo`, `zi foo` (interactive) |
| **fzf** | Manual piping | 78.6k | `apt install fzf` | General fuzzy finder; Ctrl+R history, Ctrl+T file, Alt+C directory |
| **fd** | `find` | 42k | `apt install fd-find` | 23x faster than find, gitignore-aware, intuitive syntax |

---

### File & Text Tools

| Tool | Replaces | Stars | Install | Key Feature |
|------|----------|-------|---------|-------------|
| **bat** | `cat` | 57.6k | `apt install bat` | Syntax highlighting, git integration, auto-paging |
| **eza** | `ls` | 20.5k | `apt install eza` | Git-aware, icons, human-readable dates, maintained fork of exa |
| **ripgrep** | `grep` | 60.9k | `apt install ripgrep` | 6-32x faster than grep, gitignore-aware, Unicode |
| **delta** | `git diff` | 29.5k | `cargo install git-delta` | Side-by-side diffs, syntax highlighting, word-level diffs |

---

### History

**Atuin** (strong recommendation)
- Replaces shell history with SQLite database
- Records: exit codes, working directory, hostname, session, duration
- Full-screen search UI bound to Ctrl+R and Up arrow
- Optional encrypted sync across machines (self-hostable)
- 28.6k stars
- Install: `bash <(curl https://raw.githubusercontent.com/atuinsh/atuin/main/install.sh)`
- Supports: zsh, bash, fish, nushell

---

## 6. Install Reference — Full Stack (Ubuntu/KDE Neon)

```bash
# ===== TERMINAL EMULATOR =====
# Option A: Kitty (recommended)
curl -L https://sw.kovidgoyal.net/kitty/installer.sh | sh /dev/stdin
ln -sf ~/.local/kitty.app/bin/kitty ~/.local/kitty.app/bin/kitten ~/.local/bin/

# Option B: Ghostty (community PPA)
sudo add-apt-repository ppa:mkasberg/ghostty-ubuntu
sudo apt update && sudo apt install ghostty

# ===== MULTIPLEXER =====
# Option A: Zellij
cargo install zellij
# Option B: tmux
sudo apt install tmux
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm

# ===== SHELL =====
sudo apt install zsh
chsh -s $(which zsh)

# Zinit (fast plugin manager)
bash -c "$(curl --fail --show-error --silent --location \
  https://raw.githubusercontent.com/zdharma-continuum/zinit/HEAD/scripts/install.sh)"

# Add to ~/.zshrc:
# zinit light zsh-users/zsh-autosuggestions
# zinit light zsh-users/zsh-syntax-highlighting

# ===== PROMPT =====
curl -sS https://starship.rs/install.sh | sh
# Add to end of ~/.zshrc: eval "$(starship init zsh)"

# ===== CLI TOOLS =====
sudo apt install fzf fd-find bat eza ripgrep

# bat is installed as 'batcat' on Ubuntu — alias it:
# echo 'alias bat="batcat"' >> ~/.zshrc

# fd is installed as 'fdfind' on Ubuntu — alias it:
# echo 'alias fd="fdfind"' >> ~/.zshrc

# delta (git diff)
cargo install git-delta
# Add to ~/.gitconfig:
# [core]
#     pager = delta
# [delta]
#     navigate = true
#     side-by-side = true

# zoxide
cargo install zoxide
# Add to ~/.zshrc: eval "$(zoxide init zsh)"

# Atuin (shell history)
bash <(curl https://raw.githubusercontent.com/atuinsh/atuin/main/install.sh)
# Add to ~/.zshrc: eval "$(atuin init zsh)"

# ===== RUST TOOLCHAIN (needed for cargo installs) =====
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

---

## 7. Recommendation for This Setup

**Profile:** KDE Plasma 6.6.2, Wayland, AMD GPU, dual monitors, developer/power user

### Primary Recommendation: Kitty + Zellij + zsh stack

**Rationale:**
1. **Kitty** is the safest choice: most actively maintained GPU terminal (v0.46.0, March 2026), excellent Wayland support, built-in layout system, image protocol, kittens extensibility, 31.8k stars. The investment in learning Kitty pays off long-term.
2. **Zellij** adds floating panes, session resurrection, web sharing, and modern discoverable UI that tmux lacks. The KDL layout system makes workspace setups repeatable.
3. If you do a lot of SSH work to remote servers, **Kitty + tmux** is the better combination (tmux is ubiquitous on servers; Zellij may not be installed remotely).

### Alternative: Ghostty standalone

If you want the most modern aesthetic with zero configuration effort, Ghostty is the answer. It bundles JetBrains Mono + Nerd Fonts, the config is trivially simple, and the GTK-in-KDE issue is solved with a two-line settings.ini. Pair with Zellij for session management.

### What to avoid for this setup:
- **WezTerm:** No stable release since Feb 2024. Outstanding features but maintenance risk is real.
- **Foot:** Wayland-only is fine, but no GPU acceleration and no KDE integration — built for sway.
- **Alacritty alone:** Too minimal; you'd need Zellij anyway and still have no images.
- **Tabby:** Electron overhead doesn't make sense for a local terminal on a fast system.

### Scoring Summary

| Emulator | Functionality | Maintenance | Community | Docs | Size/Deps | Score |
|----------|--------------|-------------|-----------|------|-----------|-------|
| Kitty | 29/30 | 25/25 | 14/15 | 15/15 | 12/15 | **95/100** |
| Ghostty | 25/30 | 23/25 | 13/15 | 12/15 | 13/15 | **86/100** |
| WezTerm | 30/30 | 10/25 | 13/15 | 14/15 | 12/15 | **79/100** |
| Alacritty | 18/30 | 22/25 | 15/15 | 14/15 | 15/15 | **84/100** |
| Foot | 14/30 | 20/25 | 8/15 | 12/15 | 15/15 | **69/100** |

---

## Sources

- https://sw.kovidgoyal.net/kitty/ — Kitty official documentation
- https://github.com/kovidgoyal/kitty — Kitty GitHub (31.8k stars, v0.46.0 Mar 2026)
- https://ghostty.org/ — Ghostty official site
- https://github.com/ghostty-org/ghostty — Ghostty GitHub (46.5k stars, 521 contributors)
- https://github.com/mkasberg/ghostty-ubuntu — Ghostty Ubuntu PPA
- https://wezfurlong.org/wezterm/ — WezTerm official docs
- https://github.com/wezterm/wezterm — WezTerm GitHub (24.8k stars, last stable Feb 2024)
- https://alacritty.org/ — Alacritty official site
- https://github.com/alacritty/alacritty/releases — Alacritty v0.16.1, Oct 2025
- https://codeberg.org/dnkl/foot — Foot repository
- https://github.com/raphamorim/rio — Rio terminal (6.5k stars)
- https://github.com/contour-terminal/contour — Contour (2.9k stars, Jan 2026)
- https://github.com/Eugeny/tabby — Tabby (69.5k stars)
- https://zellij.dev/ — Zellij official site
- https://github.com/zellij-org/zellij/releases — Zellij v0.43.1, Aug 2025
- https://zellij.dev/documentation/session-resurrection — Session resurrection docs
- https://github.com/tmux/tmux/releases — tmux v3.6a, Dec 2024
- https://github.com/tmux-plugins/tpm — TPM (14.3k stars)
- https://github.com/tmux-plugins/list — tmux plugin directory
- https://starship.rs/ — Starship prompt
- https://github.com/ajeetdsouza/zoxide — zoxide (34.4k stars)
- https://github.com/junegunn/fzf — fzf (78.6k stars)
- https://github.com/sharkdp/bat — bat (57.6k stars)
- https://github.com/eza-community/eza — eza v0.23.4, Oct 2025 (20.5k stars)
- https://github.com/BurntSushi/ripgrep — ripgrep 14.1.1 (60.9k stars)
- https://github.com/dandavison/delta — delta 0.18.2 (29.5k stars)
- https://github.com/atuinsh/atuin — Atuin (28.6k stars)
- https://github.com/sharkdp/fd — fd (42k stars)
- https://fishshell.com/ — Fish 4.5.0, Feb 2026
- https://ohmyz.sh/ — Oh My Zsh (300+ plugins)
- https://github.com/zdharma-continuum/zinit — Zinit (4.5k stars)
- https://github.com/zsh-users/zsh-autosuggestions — zsh-autosuggestions (35k stars)
- https://github.com/mbadolato/iTerm2-Color-Schemes — 450+ color schemes (WezTerm/Kitty/Alacritty/Ghostty support)

#terminal #linux #kde #wayland #cli #tools #knowledge-graph

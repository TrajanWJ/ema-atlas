---
tags:
  - kde
  - terminal
  - cli
  - tools
  - productivity
created: 2026-03-14
---

# Modern Terminal Stack

Replacing Konsole with a modern terminal emulator, multiplexer, and CLI toolchain for [[KDE Plasma Overview|KDE Plasma 6]] on [[Wayland vs X11|Wayland]].

## Recommended Stack

```
┌─────────────────────────────────────────────┐
│  Kitty (GPU terminal) or Ghostty (modern)   │
├─────────────────────────────────────────────┤
│  Zellij (multiplexer — floating panes,      │
│          session resurrection, tabs)         │
├─────────────────────────────────────────────┤
│  zsh + zinit + Starship prompt              │
├─────────────────────────────────────────────┤
│  bat, eza, fd, rg, fzf, delta, zoxide, atuin│
└─────────────────────────────────────────────┘
```

## Terminal Emulators Compared

| Emulator | GPU | Wayland | Tabs/Splits | Images | Ligatures | Verdict |
|----------|-----|---------|-------------|--------|-----------|---------|
| **Kitty** ⭐ | OpenGL | Native | 7 layouts | Kitty protocol | ✅ | **Best overall — most active, full-featured** |
| **Ghostty** | OpenGL | GTK | Tabs+splits | Kitty protocol | ✅ | **Most modern — zero-config, beautiful** |
| **Alacritty** | OpenGL | ✅ | None | None | ❌ | Minimal — pair with Zellij/tmux |
| **WezTerm** | OpenGL | Native | Full mux | Both protocols | ✅ | ⚠️ Stalled — no release since Feb 2024 |
| **Foot** | CPU | Native only | None | Sixel | ❌ | For sway/tiling WMs, not KDE |

### Kitty — Score: 95/100 (Recommended)

The safest long-term bet. v0.46.0 (Mar 2026), 31.8k stars, 17k+ commits, 396 contributors.

| Feature | Detail |
|---------|--------|
| **Layouts** | 7 built-in: Stack, Tall, Fat, Grid, Horizontal, Vertical, Splits |
| **Kittens** | Python extensions: `icat` (images), diff, file picker, unicode input, theme manager |
| **Remote control** | Script kitty from shell or external processes |
| **Shell integration** | Prompt navigation, marks, clone-in-new-window |
| **Session management** | Built-in session save/restore |
| **Config** | `~/.config/kitty/kitty.conf` |

**Install:**
```bash
curl -L https://sw.kovidgoyal.net/kitty/installer.sh | sh /dev/stdin
ln -sf ~/.local/kitty.app/bin/kitty ~/.local/kitty.app/bin/kitten ~/.local/bin/
```

### Ghostty — Score: 86/100 (Most Modern)

Launched Dec 2024, already 46.5k stars. Written in Zig. Zero-config — ships with JetBrains Mono + Nerd Fonts embedded. 450+ built-in color schemes.

**KDE/GTK theming fix:**
```ini
# ~/.config/gtk-3.0/settings.ini and ~/.config/gtk-4.0/settings.ini
[Settings]
gtk-theme-name=Breeze
gtk-icon-theme-name=breeze-dark
```

**Install:**
```bash
sudo add-apt-repository ppa:mkasberg/ghostty-ubuntu
sudo apt update && sudo apt install ghostty
```

**Config:** `~/.config/ghostty/config`

### ⚠️ WezTerm — Feature King, Stalled Development

Technically the most feature-complete terminal ever built (Lua scripting, SSH multiplexer, full programmability). But **no stable release since Feb 2024**, 1.4k open issues. Too much risk as daily driver right now.

## Multiplexers

### Zellij — Recommended (Modern tmux)

v0.43.1 (Aug 2025). Rust. Discoverable UI with keybindings shown on screen.

| Feature | Zellij | tmux |
|---------|--------|------|
| Learning curve | Low (keys shown) | High (memorize) |
| Floating panes | ✅ Unique feature | ❌ |
| Session persistence | Built-in (auto, 1s interval) | Plugin (tmux-resurrect) |
| Plugins | WebAssembly | Shell scripts (TPM) |
| Remote availability | Rare | Ubiquitous |

**Install:**
```bash
cargo install zellij
# or
bash <(curl -L zellij.dev/launch)
```

### tmux — For SSH-Heavy Workflows

If you SSH into servers, tmux is always available. Zellij is not.

```bash
sudo apt install tmux
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
```

Essential plugins: `tmux-resurrect`, `tmux-continuum`, `tmux-sensible`, `tmux-yank`

## Shell: zsh + zinit

Zinit's Turbo mode gives 50-80% faster startup than oh-my-zsh.

```bash
# Install zinit
bash -c "$(curl --fail --show-error --silent --location \
  https://raw.githubusercontent.com/zdharma-continuum/zinit/HEAD/scripts/install.sh)"
```

Key plugins:
- `zsh-users/zsh-autosuggestions` — fish-like inline suggestions
- `zsh-users/zsh-syntax-highlighting` — command validation as you type

**Alternative:** Fish 4.5.0 — zero setup, everything works OOTB. Tradeoff: not POSIX-compatible.

## CLI Enhancement Tools

| Tool | Replaces | What It Does | Install |
|------|----------|-------------|---------|
| **Starship** | prompt | Cross-shell prompt, fast, customizable | `curl -sS https://starship.rs/install.sh \| sh` |
| **zoxide** | `cd` | Frecency-based dir jumping (`z foo`) | `apt install zoxide` |
| **fzf** | manual piping | Fuzzy finder: Ctrl+R, Ctrl+T, Alt+C | `apt install fzf` |
| **bat** | `cat` | Syntax highlighting, git gutter | `apt install bat` (→ `batcat`) |
| **eza** | `ls` | Git-aware, icons, human dates | `apt install eza` |
| **ripgrep** | `grep` | 6-32x faster, gitignore-aware | `apt install ripgrep` (→ `rg`) |
| **fd** | `find` | 13-23x faster, intuitive syntax | `apt install fd-find` (→ `fdfind`) |
| **delta** | `git diff` | Side-by-side, syntax highlighted | `cargo install git-delta` |
| **Atuin** | history | SQLite history, encrypted sync | `bash <(curl https://setup.atuin.sh)` |

**Ubuntu name quirks:** `bat` → `batcat`, `fd` → `fdfind` — create symlinks:
```bash
mkdir -p ~/.local/bin
ln -sf /usr/bin/batcat ~/.local/bin/bat
ln -sf /usr/bin/fdfind ~/.local/bin/fd
```

## Best Combinations

| Stack | Best For |
|-------|----------|
| **Kitty standalone** | Built-in layouts sufficient, image support, one config |
| **Kitty + Zellij** | Power user — floating panes + images + session resurrection |
| **Ghostty + Zellij** | Modern aesthetic, zero terminal config |
| **Alacritty + Zellij** | Minimalist separation of concerns |
| **Kitty + tmux** | Heavy SSH user — tmux on every server |

## Yakuake Integration

[[Yakuake]] remains valuable even with a dedicated terminal:
- **Yakuake** = quick commands, always one keypress away (Ctrl+Shift+T)
- **Kitty/Ghostty** = dedicated development sessions, splits, long-running tasks
- They complement each other perfectly

## See Also

- [[Yakuake]]
- [[Keyboard Shortcuts]]
- [[D-Bus Scripting]]
- [[KDE Plasma Overview]]
- [[Configuration Files]]

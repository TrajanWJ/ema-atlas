---
tags:
  - kde
  - yakuake
  - terminal
created: 2026-03-13
---

# Yakuake

Drop-down terminal emulator for [[KDE Plasma Overview|KDE Plasma]]. Slides down from the top of the screen — always one keypress away.

## Usage

| Action | How |
|--------|-----|
| Toggle | `F12` (default, configurable via [[Keyboard Shortcuts]]) |
| New tab | `Ctrl+Shift+T` |
| Split horizontal | `Ctrl+Shift+(` |
| Split vertical | `Ctrl+Shift+)` |

## Configuration

- Configurable width, height, position, animation speed
- Multiple tabs with custom names
- Tab-based or split-pane layouts
- Skinnable — multiple visual themes available
- [[D-Bus Scripting|D-Bus]] scriptable
- Config stored in [[Configuration Files|KDE config directories]]
- Can be added as a [[Panels and Widgets|panel widget]] shortcut
- Launch via [[KRunner]] by typing "Yakuake"

## Installation

```bash
# KDE Neon / Ubuntu
sudo apt install yakuake

# Arch
sudo pacman -S yakuake
```

## Autostart

Add to [[Autologin Configuration|autostart]] so it's always ready:
- System Settings → Autostart → Add Application → Yakuake
- Or add `.desktop` file to `~/.config/autostart/`

## Why Yakuake over Konsole

Yakuake is **supplementary** to Konsole, not a replacement:
- Yakuake = quick commands, always available, dismiss instantly
- Konsole = full terminal sessions, tabs, profiles

## See Also

- [[KDE Plasma Overview]]
- [[D-Bus Scripting]]
- [[Keyboard Shortcuts]]
- [[Configuration Files]]

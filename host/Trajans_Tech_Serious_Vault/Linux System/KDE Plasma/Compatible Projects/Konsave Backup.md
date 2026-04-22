---
tags:
  - kde
  - backup
  - configuration
created: 2026-03-13
---

# Konsave — KDE Configuration Backup

CLI tool specifically designed to save and restore [[KDE Plasma Overview|KDE Plasma]] configurations.

## Installation

```bash
pip install konsave
```

## Usage

```bash
# Save current config
konsave -s my-setup

# List saved profiles
konsave -l

# Apply a saved profile
konsave -a my-setup

# Export for sharing
konsave -e my-setup   # creates .knsv file

# Import from file
konsave -i my-setup.knsv
```

## What It Saves

- [[Configuration Files|All KDE config files]] (`~/.config/`)
- Custom [[Theming System|themes]], [[Panels and Widgets|widgets]], [[KWin]] scripts (`~/.local/share/`)
- Icon and cursor themes
- [[Kvantum Engine|Kvantum]] themes
- [[Baloo File Indexer|Baloo]] configuration

## Alternative Backup Methods

| Tool | Approach | Best For |
|------|----------|----------|
| **Konsave** | KDE-specific CLI | Quick save/restore, sharing |
| **chezmoi + chezmoi-modify-manager** | Git-based dotfiles | Handles KDE's volatile INI sections intelligently |
| **yadm** | Simple Git wrapper | Dotfile version control |
| **rsync scripts** | Manual backup | Full control, custom locations |

### chezmoi with KDE

KDE config files have volatile sections that change frequently (window positions, recent files). `chezmoi-modify-manager` intelligently handles these — only tracking the sections you care about.

## Directories to Back Up

| Path | Contains |
|------|----------|
| `~/.config/` | All config files |
| `~/.local/share/` | Custom themes, widgets, scripts, data |
| `~/.themes/` | GTK themes |
| `~/.icons/` | Icon themes |

## See Also

- [[Configuration Files]]
- [[KDE Plasma Overview]]
- [[Theming System]]

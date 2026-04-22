---
tags:
  - kde
  - kvantum
  - theming
created: 2026-03-13
---

# Kvantum Engine

A **Qt style engine** that intercepts Qt application rendering to enable transparency, blur, custom shapes, and effects that [[Theming System|Plasma Style]] alone cannot achieve.

## What Kvantum Does

- Adds **real transparency and blur** to Qt application windows
- Provides CSS-like styling via SVG-based theme files
- Works alongside (not replacing) the Plasma Style — Kvantum controls **app windows**, Plasma Style controls **panels and widgets**

## Installation

| Distro | Package |
|--------|---------|
| KDE Neon / Ubuntu | `qt5-style-kvantum` / `qt6-style-kvantum` |
| Arch / Manjaro | `kvantum` |
| Fedora | `kvantum` |

## Setup

1. Install Kvantum
2. **System Settings → Appearance → Application Style → set to "kvantum" or "kvantum-dark"**
3. Open `kvantummanager` (GUI) to select/install themes
4. Apply your chosen Kvantum theme

## Theme Paths (priority order)

1. `~/.config/Kvantum/$THEME/`
2. `~/.themes/$THEME/Kvantum/`
3. `~/.local/share/themes/$THEME/Kvantum/`

## Popular Kvantum Themes

Many [[Top Themes|popular themes]] include Kvantum variants:
- **Orchis** — comprehensive, includes Kvantum
- **Layan** — material design with Kvantum transparency
- **Sweet** — neon gradients with Kvantum blur
- **Catppuccin** — pastel dark with Kvantum support
- **Dracula** — dark purple with Kvantum

Browse more: [store.kde.org/browse?cat=123](https://store.kde.org/browse?cat=123)

## Troubleshooting

- If apps look inconsistent, ensure Application Style is set to Kvantum (not Breeze)
- Some Flatpak apps may not pick up Kvantum — use Flatseal to grant filesystem access to `~/.config/Kvantum`
- Kvantum transparency requires compositing enabled in [[KWin]] — [[Panels and Widgets|panels and widgets]] are not affected as they use Plasma Style instead

## See Also

- [[Theming System]]
- [[Top Themes]]
- [[Configuration Files]]
- [[KWin]]
- [[Resources and Community]]

---
tags:
  - kde
  - dolphin
  - file-manager
created: 2026-03-13
---

# Dolphin Power Features

The KDE file manager is deceptively powerful. Most users only scratch the surface.

## Essential Shortcuts

| Shortcut | Action |
|----------|--------|
| `F3` | **Split view** — two panes side by side |
| `F4` | **Integrated terminal** — terminal panel below file view |
| `F2` | **Batch rename** — rename multiple selected files |
| `Alt+.` | Show/hide hidden files |
| `Ctrl+L` | Edit location bar (type path) |
| `Ctrl+I` | Open filter bar |

See [[Keyboard Shortcuts]] for system-wide shortcut configuration.

## View Modes

Three modes: **Icon**, **Details**, **Compact** — switch via View menu or toolbar.

## Plugins (dolphin-plugins)

Install the `dolphin-plugins` package for:

| Plugin | Adds |
|--------|------|
| **Git** | Git status icons, commit, push, pull from right-click menu |
| **SVN** | Subversion integration |
| **Mercurial** | Hg integration |
| **Nextcloud** | Share links from right-click |

## Custom Service Menu Actions

Add custom right-click menu actions:
- Location: `~/.local/share/kservices5/ServiceMenus/` (Plasma 5) or `~/.local/share/kio/servicemenus/` (Plasma 6)
- Format: `.desktop` files with `[Desktop Action]` entries

## Integration

- **[[Baloo File Indexer|Baloo]] search** — integrated search in Dolphin's toolbar
- **Previews** — thumbnails for images, PDFs, videos, fonts
- **Tags** — Baloo-powered file tagging from right-click → Properties
- **Places panel** — customizable sidebar with bookmarks, devices, network
- Launch Dolphin quickly via [[KRunner]]
- Back up Dolphin config with [[Konsave Backup]]
- Config stored in [[Configuration Files|KDE config directories]]

## See Also

- [[Baloo File Indexer]]
- [[KDE Plasma Overview]]
- [[Keyboard Shortcuts]]
- [[Configuration Files]]
- [[KRunner]]

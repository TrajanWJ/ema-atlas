---
tags:
  - kde
  - krunner
  - launcher
  - productivity
created: 2026-03-13
---

# KRunner

The universal launcher and command interface for [[KDE Plasma Overview|KDE Plasma]]. Far more powerful than most users realize.

## Launch

- `Alt+Space` or `Alt+F2`

## Built-in Runners

| Prefix/Query | Runner | Example |
|--------------|--------|---------|
| (none) | Application launcher | `firefox` |
| (none) | Window switcher | Type window title to focus it |
| `=` | Calculator | `= 2^10` → 1024 |
| (none) | Unit converter | `5 miles in km` |
| `>` | Shell commands | `> htop` |
| (none) | [[Baloo File Indexer|Baloo]] file search | Type filename |
| `desktop` | [[Virtual Desktops and Activities|VD/Activity switch]] | `desktop 2` |
| (none) | Dictionary | Definition lookup |
| `wm console` | [[KWin]] scripting console | Opens interactive JS console |
| (none) | System commands | `shutdown`, `restart`, `lock` |
| (none) | Recent documents | Recent files list |
| (none) | Bookmarks | Browser bookmarks |

## Plugin Store

Extend KRunner with community plugins: [store.kde.org/browse?cat=628](https://store.kde.org/browse?cat=628)

Plugins are written in C++ with KRunner framework or QML.

## Configuration

- **Wrench icon** in KRunner → enable/disable individual runners
- Config file: `~/.config/krunnerrc` (see [[Configuration Files]])

## Power User Tips

- KRunner is **the fastest way to do almost anything** on KDE
- Combine with [[Keyboard Shortcuts]] for workflow speed
- Type activity names to switch [[Virtual Desktops and Activities|Activities]]
- Use as a quick calculator without opening an app
- Shell commands with `>` prefix run instantly
- Automate via [[D-Bus Scripting]] for scripted invocation
- Add KRunner to [[Panels and Widgets]] as an embedded search bar
- Launch [[Dolphin Power Features|Dolphin]] searches directly from KRunner

## See Also

- [[KDE Plasma Overview]]
- [[Keyboard Shortcuts]]
- [[Virtual Desktops and Activities]]
- [[Baloo File Indexer]]
- [[D-Bus Scripting]]
- [[Configuration Files]]

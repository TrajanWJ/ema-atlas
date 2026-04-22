---
tags:
  - kde
  - apps
  - moc
created: 2026-03-13
---

# KDE Compatible Projects

Standalone KDE applications and tools that integrate with [[KDE Plasma Overview|KDE Plasma]].

## Notes

| Note | What It Does |
|------|-------------|
| [[KDE Connect]] | Phone ↔ desktop integration — clipboard, files, notifications, SMS |
| [[Dolphin Power Features]] | File manager — split view, terminal, git, batch rename |
| [[Yakuake]] | Drop-down terminal — F12 toggle, always ready |
| [[Spectacle]] | Screenshots + screen recording + OCR text extraction |
| [[Konsave Backup]] | Save/restore KDE configs — profiles, export, import |
| [[Terminal Stack]] | Modern terminal setup — Kitty, Ghostty, Zellij, CLI tools |

## How They Connect

```
KDE Connect ──────→ Keyboard Shortcuts (remote input)
                  → Must-Have Widgets (panel indicator)

Dolphin ──────────→ Baloo File Indexer (search)
                  → KRunner (file search)

Yakuake ──────────→ D-Bus Scripting (scriptable)
                  → Keyboard Shortcuts (F12 toggle)

Spectacle ────────→ Keyboard Shortcuts (Print key)
                  → D-Bus Scripting (automation)

Konsave ──────────→ Configuration Files (what to back up)
                  → Theming System (themes to save)
```

## See Also

- [[KDE Plasma Overview]] — main index
- [[Extensions Index]] — widgets and scripts
- [[Customization Index]] — theming and layout
- [[Architecture Index]] — how apps integrate with KDE

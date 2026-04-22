---
tags:
  - kde
  - advanced
  - moc
created: 2026-03-13
---

# KDE Advanced Topics

Deep dives into [[KDE Plasma Overview|KDE Plasma]] infrastructure, performance, and ecosystem.

## Notes

| Note | Domain |
|------|--------|
| [[Wayland vs X11]] | Display server — migration timeline, feature comparison |
| [[Multi-Monitor Setup]] | Display layout, per-monitor scaling, KScreen config |
| [[Color Management]] | ICC profiles, HDR, Night Color blue light filter |
| [[Gaming on KDE]] | Steam, Lutris, MangoHud, GameMode, VRR |
| [[Power Management]] | PowerDevil, TLP, auto-cpufreq, battery optimization |
| [[Baloo File Indexer]] | File search indexing — optimize, configure, or disable |
| [[Resources and Community]] | KDE Store, forums, YouTube channels, curated lists |

## Topic Relationships

```
Wayland vs X11 ←──→ Multi-Monitor Setup
      ↕                    ↕
Gaming on KDE        Color Management
      ↕                    ↕
Power Management     Monitor Setup (My System)
      ↕
Baloo File Indexer (performance impact)
```

- [[Wayland vs X11]] enables superior [[Multi-Monitor Setup]] and [[Color Management]]
- [[Gaming on KDE]] depends on [[Wayland vs X11]] and [[Power Management]]
- [[Baloo File Indexer]] affects [[Power Management]] and system responsiveness
- [[Color Management]] connects to [[Monitor Setup]] (My System)

## See Also

- [[KDE Plasma Overview]] — main index
- [[Architecture Index]] — core components these topics build on
- [[System Overview]] — how this applies to Trajan's machine

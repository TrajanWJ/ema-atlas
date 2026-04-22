---
tags:
  - kde
  - frameworks
  - architecture
created: 2026-03-13
---

# KDE Frameworks (KF6)

~80 add-on libraries built on Qt 6 that provide the foundation for all [[KDE Plasma Overview|KDE Plasma]] and KDE application functionality.

## Key Frameworks

| Framework | Purpose |
|-----------|---------|
| **KConfig** | Configuration file reading/writing (INI-style) |
| **KIO** | Virtual filesystem — network transparency, file protocols |
| **Plasma** | Widget/plasmoid API for [[Plasma Shell]] — see [[Must-Have Widgets]] |
| **KRunner** | [[KRunner]] plugin framework |
| **Kirigami** | Convergent UI framework (desktop + mobile) |
| **KNotifications** | Desktop notification system |
| **KWindowSystem** | Window management abstractions |
| **Baloo** | File indexing and search — see [[Baloo File Indexer]] |
| **Sonnet** | Spell checking |
| **KTextEditor** | Advanced text editing component (powers Kate) |

## Plasma 5 → 6 Migration

| Aspect | KF5 (Plasma 5) | KF6 (Plasma 6) |
|--------|----------------|----------------|
| Qt version | Qt 5 | Qt 6 |
| Release | 2014 | Feb 2024 |
| Wayland | Optional | Default |
| HDR | No | Yes |

## Versioning

KDE Frameworks release monthly, independent of Plasma Shell releases. Current: KF6.x (follows Qt 6).

KF6.23.0 (2025) brought significant [[Baloo File Indexer|Baloo]] improvements — faster indexing, better memory safety.

## See Also

- [[KDE Plasma Overview]]
- [[Plasma Shell]]
- [[KWin]]
- [[Configuration Files]]
- [[Must-Have Widgets]]
- [[Baloo File Indexer]]
- [[KRunner]]

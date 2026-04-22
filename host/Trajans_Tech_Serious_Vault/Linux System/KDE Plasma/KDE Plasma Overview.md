---
tags:
  - kde
  - plasma
  - moc
  - index
created: 2026-03-13
---

# KDE Plasma Overview

Map of Content for KDE Plasma knowledge. Running **Plasma 6.6.2** on [[System Overview|KDE Neon 24.04]] with [[Wayland vs X11|Wayland]].

## Knowledge Map

```
                    ┌─────────────────┐
                    │  KDE Plasma     │
                    │  Overview (you) │
                    └────────┬────────┘
         ┌──────────┬────────┼────────┬──────────┐
         ▼          ▼        ▼        ▼          ▼
   ┌──────────┐ ┌────────┐ ┌────┐ ┌────────┐ ┌────────┐
   │Architecture│ │Customize│ │Ext.│ │Projects│ │Advanced│
   │  Index    │ │ Index  │ │Idx │ │ Index  │ │ Index  │
   └──┬───────┘ └──┬─────┘ └─┬──┘ └──┬─────┘ └──┬─────┘
      │            │          │       │           │
  Plasma Shell  Theming    Widgets  KDE Connect  Wayland
  KWin          Kvantum    KWin Scr Dolphin      Gaming
  Frameworks    Themes     KRunner  Yakuake      Power
  Config Files  Panels             Spectacle    Monitors
  D-Bus         VDs/Acts           Konsave      Color
                Shortcuts                       Baloo
```

## Sections

| Section | Entry Point | What's Inside |
|---------|-------------|---------------|
| 🏗️ **Architecture** | [[Architecture Index]] | [[Plasma Shell]], [[KWin]], [[KDE Frameworks]], [[Configuration Files]], [[D-Bus Scripting]] |
| 🎨 **Customization** | [[Customization Index]] | [[Theming System]], [[Kvantum Engine]], [[Top Themes]], [[Panels and Widgets]], [[Virtual Desktops and Activities]], [[Keyboard Shortcuts]] |
| 🧩 **Extensions** | [[Extensions Index]] | [[Must-Have Widgets]], [[KWin Scripts and Tiling]], [[KRunner]] |
| 🔗 **Projects** | [[Compatible Projects Index]] | [[KDE Connect]], [[Dolphin Power Features]], [[Yakuake]], [[Spectacle]], [[Konsave Backup]] |
| ⚙️ **Advanced** | [[Advanced Topics Index]] | [[Wayland vs X11]], [[Multi-Monitor Setup]], [[Color Management]], [[Gaming on KDE]], [[Power Management]], [[Baloo File Indexer]], [[Resources and Community]] |

## My System

| Note | Key Info |
|------|----------|
| [[System Overview]] | KDE Neon 24.04, Ryzen 7 6800H, Radeon 680M, 27 GiB RAM |
| [[Hardware Specs]] | Detailed CPU/GPU/RAM/storage specs |
| [[Monitor Setup]] | Dual monitor — 1440p primary (HDMI) + 1080p left (DP), color correction |
| [[Autologin Configuration]] | SDDM autologin → user trajan → Plasma Wayland |

## Quick Reference

| Fact | Value |
|------|-------|
| Plasma | 6.6.2 |
| Qt | 6 |
| Frameworks | KF6 |
| Session | [[Wayland vs X11|Wayland]] |
| WM | [[KWin|KWin 6]] |
| Config | INI-style in `~/.config/` |
| Custom content | `~/.local/share/` |
| Themes/plugins | [[Resources and Community|store.kde.org]] |
| Distro | [[System Overview|KDE Neon 24.04]] |

## Distro Pairings

| Distro | Best For |
|--------|----------|
| **KDE Neon** ← (current) | Latest KDE, pure upstream, Ubuntu LTS base |
| Kubuntu | Stability, beginners, Ubuntu ecosystem |
| Arch Linux | Maximum control, AUR, rolling |
| Fedora KDE | Vanilla KDE, developers, SELinux |
| OpenSUSE Tumbleweed | Rolling + rigorous testing + YaST |
| Garuda KDE | Gamers, Arch, [[Gaming on KDE|performance]] |
| Bazzite KDE | Immutable [[Gaming on KDE|gaming]], Steam Deck compatible |
| CachyOS | Performance kernel, Arch-based |

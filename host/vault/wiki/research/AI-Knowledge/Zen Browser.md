---
date: 2026-03-29T00:00:00.000Z
tags:
  - browser
  - productivity
  - workflow
  - developer-tools
  - firefox
status: active
type: research
wiki_id: research/AI-Knowledge/Zen_Browser
imported_from: vault/Research/AI-Knowledge/Zen Browser.md
imported_at: '2026-04-04T00:23:56.993Z'
summary: ''
---

# Zen Browser

> Firefox-based open-source browser with vertical tabs, workspaces, split view, and sidebar web panels. Primary Arc Browser alternative for Linux users.

## Quick Reference

| Property | Value |
|----------|-------|
| Engine | Firefox/Gecko |
| Current version | 1.19.3b (Firefox 148.0.2 base) |
| License | Open source |
| Platforms | Windows, macOS, Linux |
| Price | Free |
| Site | https://zen-browser.app/ |
| Docs | https://docs.zen-browser.app/ |
| GitHub | https://github.com/zen-browser/desktop |

## Key Capabilities

- Workspaces with Firefox Multi-Account Container integration
- Split view: 2–4 tiled tabs with drag-and-drop or keyboard
- Glance: link preview as dismissible overlay (Arc's Peek equivalent)
- Sidebar web panels: persistent websites alongside any page
- Compact Mode: hides sidebar + URL bar, hover to reveal
- Zen Mods: built-in CSS/JS theming marketplace
- userChrome.css: full Firefox UI customization
- Declarative config via zen-conf (YAML → user.js + policies.json)

## Workspace + Container Pattern (Multi-Project Setup)

Assign a container to each workspace so all new tabs in that workspace open in the right session:

```
Workspace "ClientA"  → container: ClientA  → ClientA GitHub, staging, Google
Workspace "ClientB"  → container: ClientB
Workspace "Day Job"  → container: Work     → Work Google, Work GitHub
Workspace "Personal" → container: Personal
Workspace "Tools"    → no container        → localhost dashboards, CI
```

**Limitation:** Containers separate cookies but NOT history or extension config. Full per-workspace profiles not yet implemented (tracked in GitHub discussion #2337).

## Critical Keyboard Shortcuts

| Action | Default | Notes |
|--------|---------|-------|
| Previous workspace | `Alt + Ctrl + Q` | Remap to match Arc muscle memory |
| Next workspace | `Alt + Ctrl + E` | |
| Split vertical | `Alt + Ctrl + V` | |
| Split horizontal | `Alt + Ctrl + H` | |
| Split grid | `Alt + Ctrl + G` | |
| Unsplit all | `Alt + Ctrl + U` | |
| Compact mode | `Cmd + Option + C` | macOS default |
| Favicon-only mode | `Option + B` | macOS default |
| Glance (overlay) | `Alt + Click` | Configurable in Settings |

All shortcuts customizable in Settings > Keyboard Shortcuts.

## Key about:config Flags

| Flag | Default | Effect |
|------|---------|--------|
| `zen.tab-unloader.excluded-urls` | — | Prevent localhost from unloading |
| `zen.workspaces.wrap-around-navigation` | true | Loop at workspace ends |
| `zen.view.compact.toolbar-hide-after-hover.duration` | 1000ms | Hover reveal duration |
| `zen.view.experimental-rounded-view` | false | Rounded content corners |
| `zen.urlbar.show-domain-only-in-sidebar` | true | Cleaner URL display |
| `zen.splitView.min-resize-width` | 7% | Min panel width in split |
| `toolkit.legacyUserProfileCustomizations.stylesheets` | false | Enable userChrome.css |
| `browser.tabs.loadBookmarksInTabs` | false | Open bookmarks in new tabs |

## Known Gaps vs. Arc / Chrome Browsers

| Issue | Workaround |
|-------|-----------|
| No per-workspace profiles | Run second Zen process: `zen -P ProfileName` |
| No native PWA support | Firefox engine limitation; use Chrome for PWAs |
| No DRM (Netflix/Prime) | Keep Chrome installed for streaming |
| Shared history across workspaces | Accepted limitation |
| No command palette extension activation | Use extension toolbar buttons |

## Recommended Extensions

- **uBlock Origin** — better manifest v3 support than on Chrome
- **Obsidian Web Clipper** — vault capture from browser
- **Tridactyl** — vim-style keyboard navigation
- **Multi-Account Containers** — additional auto-routing rules beyond built-in
- **Contain Google** — auto-routes all Google domains to one container

## Recommended Mods (from Mods Marketplace)

- Cleaned URL Bar
- Only Close on Hover
- Floating Status Bar
- Zen Compact UI
- SuperPins

## Declarative Config

`zen-conf` (https://github.com/arch-err/zen-conf) — Python tool that converts a YAML config into `user.js` + `policies.json`. Enables reproducible browser setup via dotfiles.

## Research

Full research report: `/tmp/zen-research-workflows.md`

#browser #productivity #developer-tools #firefox

---
tags:
  - browser
  - productivity
  - firefox
  - customization
  - privacy
  - research
date: 2026-03-29T00:00:00.000Z
type: research
wiki_id: research/AI-Knowledge/Research_-_Zen_Browser_Features_and_Configuration_2026
imported_from: >-
  vault/Research/AI-Knowledge/Research - Zen Browser Features and Configuration
  2026.md
imported_at: '2026-04-04T00:23:56.988Z'
summary: ''
---

# Research - Zen Browser Features and Configuration 2026

## Summary

Zen Browser is a Firefox fork (currently at Firefox 149.0 base, version 1.19.5b) built around vertical tabs and productivity-focused workspace organization. It is actively developed with frequent releases.

Full research report: `/tmp/zen-research-docs.md`

## Key Facts

- **Base:** Firefox 149.0 (as of 1.19.4b+)
- **License:** Open source, GitHub: zen-browser/desktop
- **DRM:** No Widevine — Netflix/Spotify/Disney+ do not work
- **No horizontal tabs:** By design, not planned
- **No mobile version:** Not planned

## Core Features

- [[Zen Workspaces]] — per-Space tabs, icons, gradient themes, container routing
- Compact Mode — auto-hiding sidebar/toolbar (`Alt+Ctrl+C`)
- Split View — up to 4 tabs side by side (`Alt+Ctrl+H/V/G`)
- Glance — overlay link preview (default: `Alt+Click`)
- Essential Tabs — globally pinned across all workspaces, max 12
- Tab Folders — nested pinned tab organization (up to 5 levels, `zen.folders.max-subfolders`)
- Live Folders — auto-updating GitHub issues/PRs/RSS feeds (added 1.19b, Feb 2026)
- Zen Mods — CSS-based mod marketplace at zen-browser.app/mods
- Per-workspace gradient themes with 5 color harmony algorithms

## Key about:config Preferences

See full table in `/tmp/zen-research-docs.md` Section 3.1.

Critical ones to know:
- `zen.folders.max-subfolders` — nesting depth limit (default 5)
- `zen.glance.open-essential-external-links` — auto-Glance in essential tabs (default true)
- `zen.view.compact.toolbar-hide-after-hover.duration` — 1000ms default
- `zen.workspaces.swipe-actions` — trackpad workspace swipe (default true)
- `zen.urlbar.replace-newtab` — new tab shows URL bar, not new tab page (default true)
- `zen.mediacontrols.enabled` — floating media player UI (default true)
- `toolkit.tabbox.switchByScrolling` — scroll over tabs to switch (default false)
- `browser.ml.chat.enabled` — enable AI chatbot sidebar (default false)
- `zen.themes.disable-all` — kill all mods without uninstalling

## userChrome.css Setup

1. Profile folder: `about:support` → Open Profile Folder
2. Create `chrome/userChrome.css`
3. `toolkit.legacyUserProfileCustomizations.stylesheets` = true
4. Live editing: also enable `devtools.debugger.remote-enabled` + `devtools.chrome.enabled`
5. Open Browser Toolbox: `Ctrl+Shift+Alt+I` → Style Editor → search "userChrome"

Web panel width: `#zen-sidebar-web-panel { max-width: 1000px !important; }`

## Mod Preference Types (preferences.json)

| Type | CSS Integration |
|------|----------------|
| checkbox | `@media (-moz-pref("property"))` |
| dropdown | `@media (-moz-pref("property", "value"))` |
| string | `var(--property-name)` on `:root` (dots → hyphens) |

## Privacy

- Betterfox defaults baked in
- ETP: Standard/Strict/Custom
- Fingerprinting resistance: `privacy.resistFingerprinting`
- DNS over HTTPS: Settings → Privacy & Security
- HTTPS Only Mode available
- No telemetry by Zen itself

## Recent Releases

- **1.19.5b** (2026-03-27): Fix new profile freezes, fix Live Folder PR data, icon picker improvements
- **1.19.4b** (2026-03-26): Firefox 149.0, WebRender on Windows, hardware-accelerated PDF, auto-revoke SafeBrowsing permissions
- **1.19b** (2026-02-28): Live Folders (RSS/GitHub), 1-second hover to split tabs
- **1.15b** (2025-08): Tab Folders introduced

## Sources

- [Official Docs](https://docs.zen-browser.app/)
- [about:config flags](https://docs.zen-browser.app/guides/about-config-flags)
- [Mods Store](https://zen-browser.app/mods/)
- [GitHub: zen-browser/desktop](https://github.com/zen-browser/desktop)

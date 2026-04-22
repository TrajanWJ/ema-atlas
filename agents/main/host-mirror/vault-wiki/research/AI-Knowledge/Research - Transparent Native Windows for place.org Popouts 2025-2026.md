---
date: 2026-03-24T00:00:00.000Z
tags:
  - research
  - place-org
  - native-windows
  - tauri
  - electron
  - popout
  - transparency
status: active
type: research
wiki_id: >-
  research/AI-Knowledge/Research_-_Transparent_Native_Windows_for_place_org_Popouts_2025-2026
imported_from: >-
  vault/Research/AI-Knowledge/Research - Transparent Native Windows for
  place.org Popouts 2025-2026.md
imported_at: '2026-04-04T00:23:56.984Z'
summary: ''
---

# Research - Transparent Native Windows for place.org Popouts (2025-2026)

> Research question: Can we create truly transparent, frameless native windows that show the desktop wallpaper through them — launched from a browser-based app — for place.org's "drag outside browser to pop out" feature?

Related: [[place.org]], [[Research - PWA Capabilities Deep Dive place.org]], [[Research - Modern Browser Capabilities 2025-2026]]

---

## The Problem

place.org's window manager lets users drag virtual windows around a browser desktop OS. The feature goal: when a user drags a window outside the browser viewport, it pops out as a real native desktop window — transparent, frameless, showing the wallpaper behind it.

Current state: `window.open()` produces a browser popup with URL bar, browser chrome, and opaque background. That is not acceptable.

---

## Candidates Evaluated

| Approach | True Transparency | Cross-Platform | Install Weight | Loads Remote URL | Verdict |
|---|---|---|---|---|---|
| Chrome Extension `chrome.windows.create` | NO | Chrome only | None (extension) | Yes | Dead end |
| Firefox `browser.windows.create` | NO | Firefox only | None | Yes | Dead end |
| Safari Web Extension | NO | macOS only | None | Yes | Dead end |
| Document Picture-in-Picture API | NO | Chrome/Edge only | None | No (same origin) | Partial |
| PWA installed mode | NO (title bar transparency only) | Chrome/Edge desktop | None | n/a | Non-starter |
| WebView2 (Windows only) | YES (Win32/WPF only) | Windows only | Ships with Edge | Yes | Windows-only fallback |
| Electron | YES (with caveats) | Windows/macOS/Linux | ~80-120MB installer | Yes | Heavy but works |
| Tauri v2 | YES (with caveats) | Windows/macOS/Linux | ~3-15MB installer | YES (confirmed) | Best candidate |
| Neutralino | YES | Windows/macOS/Linux | Very small (~1-3MB) | Unknown | Investigate |
| wry (raw) | YES | Windows/macOS/Linux | Rust binary, tiny | Yes | Requires Rust dev |
| Gluon | UNKNOWN | Win/mac/Linux | Small | Yes | ARCHIVED 2024 |
| pywebview | YES | Windows/macOS/Linux | Python dep | Yes | Wrong language |

---

## Detailed Findings

### 1. Chrome Extension — chrome.windows.create

**True transparency: NO.**

Browser extensions can modify page content, but not the native OS window itself. Chrome's security model explicitly prevents extension APIs from removing the browser frame or making the window background transparent to the desktop. What you can do with CSS is make the web content area have `background: transparent`, but the OS window chrome (title bar, borders) remains. The popup type removes the URL bar but keeps the native window decoration.

Source: Chromium extensions mailing list, Chrome Developers docs.

**Verdict: Dead end. The API does not expose any window transparency parameter.**

---

### 2. Firefox WebExtension — browser.windows.create

**True transparency: NO.**

Same architectural limitation as Chrome. Firefox Bugzilla bug #70798 tracks transparent popups — filed and stalled. The `browser.windows.create` API has no opacity or transparency parameters. MDN documentation confirms only window type, size, and position are configurable.

**Verdict: Dead end.**

---

### 3. Safari Web Extension

**True transparency: NO.**

Safari Web Extensions run inside a native macOS app wrapper. Popover UI is a native NSPopover, not a floating transparent window. No Safari WebExtension API exists for creating arbitrary transparent windows. Apple Developer Forums confirm no path for this.

**Verdict: Dead end.**

---

### 4. Document Picture-in-Picture API

**True transparency: NO — confirmed.**

The Document PiP API (Chrome 116+, Edge, not Firefox or Safari) creates an always-on-top floating window that can contain arbitrary HTML. This is useful for now-playing widgets, watch-together panels, etc.

However: the PiP window renders with an opaque browser chrome background. MDN documentation and the WICG spec contain no transparency parameters in `requestWindow()`. The window cannot be made see-through to the desktop. Additionally, it's same-origin only — you cannot load an arbitrary URL, only clone content from the current page.

Browser support: Chrome 116+, Edge. Firefox and Safari: NO.

**Verdict: Not useful for this feature. Good for other things (floating mini-window within browser), but cannot see desktop through it.**

---

### 5. PWA Installed Mode

**True transparency: NO.**

Window Controls Overlay (`display_override: ["window-controls-overlay"]`) gives control of the title bar area and makes it look native, but the window background itself is still opaque. There is no manifest.json property or any web API to make a PWA window transparent. The OS window is a real Chromium/Edge window and cannot expose the desktop beneath it.

**Verdict: Useful for title bar polish, useless for transparency.**

---

### 6. WebView2 (Windows-specific)

**True transparency: YES — but Windows only, and only in Win32 or WPF host, not WinUI 3.**

The `ICoreWebView2Controller2` interface exposes `DefaultBackgroundColor` which accepts RGBA. Setting alpha to 0 makes the webview content area transparent. Combined with a native Win32 transparent layered window, you can achieve true desktop see-through. WinUI 3 / UWP does NOT support this (known open issue at Microsoft).

WebView2 is bundled with Microsoft Edge, which ships on all Windows 10/11 machines, so the end-user install weight is effectively zero.

Loading remote URLs: Yes, via `Navigate("http://localhost:3000")`.

**Cross-platform: Windows only.**

**Verdict: Viable for a Windows-first fallback, but requires writing a native Win32/WPF host app — not a browser-side solution.**

---

### 7. Electron

**True transparency: YES — `transparent: true, frame: false` on BrowserWindow.**

Electron is the most battle-tested option. The API is explicit and documented. Issues:

- **macOS**: Works. Window shadow is suppressed on transparent windows.
- **Windows**: Works when DWM is enabled (always true on modern Windows). Transparent windows are not resizable by default — setting `resizable: true` can break transparency on some platforms.
- **Linux**: Requires `--enable-transparent-visuals --disable-gpu` CLI flags. Caused by upstream NVidia driver bug with alpha channels on some GPUs. Hit or miss.

Loading remote URLs: `win.loadURL("http://localhost:3000")` — confirmed in docs.

Install weight: 80-120MB installer. ~200-500MB RAM on startup. Ships its own Chromium + Node.js.

**Verdict: Works, but the weight is grotesque for a thin popout wrapper. Not a good choice if you're shipping a dedicated host app just for popouts.**

---

### 8. Tauri v2 — PRIMARY CANDIDATE

**True transparency: YES — with known caveats.**

Tauri v2 supports transparent frameless windows via:
```json
{
  "decorations": false,
  "transparent": true,
  "shadow": false
}
```

The `shadow: false` is required — v2 enables window shadows by default, and shadows conflict with transparency. This was a regression from v1, filed as issue #8308, resolved November 2023.

**macOS caveat (OPEN BUG as of November 2025):** Issue #13415 — transparent windows lose transparency after bundling into a DMG. During `tauri dev`, transparency works. In the shipped DMG, the window turns solid white. Multiple workarounds attempted (macOSPrivateApi, TAURI_PRIVATE_API env var, activation policy) — all failed. Issue marked "needs triage," last comment November 2025 asking for updates with no response.

Additionally, the wry library (which Tauri is built on) notes: "transparent background on macOS requires calling private functions" — this is the root issue.

**Windows**: Works after adding `shadow: false`. Confirmed fixed.
**Linux**: X11 supported. Wayland: X11 only for wry, run under Xwayland.

**Loading remote URL: YES — confirmed.** When a URL is provided in the config, Tauri does not bundle assets and loads that URL directly. You can point it at `http://localhost:3000`. Tauri commands won't be available in the remote content (only in Tauri-hosted content), but for rendering a Next.js app that doesn't use Tauri APIs, this is fine.

**Install weight: ~3-15MB installer. ~50-150MB RAM. Uses OS system WebView** (WebView2 on Windows, WKWebView on macOS, WebKitGTK on Linux).

**Verdict: Best candidate overall. The macOS transparency-after-bundle bug is serious and currently unresolved. For Windows and Linux this is the clear winner. macOS needs a workaround or waiting for a fix.**

---

### 9. Neutralino

**True transparency: YES — `window.transparent: true` in config.**

Neutralino is a lightweight desktop app framework using system WebViews. It has an explicit `transparent` boolean flag and a "draggable region API" for custom window frames. Bundle size is very small (1-3MB).

However: less ecosystem, less documentation, fewer community resources than Tauri. The last major release was v5.1.0. Activity appears lower than Tauri.

Loading remote URL: Not confirmed from documentation. Neutralino typically serves its own assets. Needs direct testing.

**Verdict: Worth investigating as a lighter fallback, but Tauri v2 has more production track record and clearer remote URL support.**

---

### 10. wry (raw Rust library)

**True transparency: YES.**

wry is the WebView library that Tauri is built on. You can use it directly without the full Tauri framework. `WebViewBuilder` supports `.with_transparent(true)` and `.with_url("http://localhost:3000")`.

This gives maximum control with minimum overhead — but requires writing a Rust application to host the webview. The resulting binary is tiny (a few MB). Cross-platform: Windows (WebView2), macOS (WKWebView), Linux (X11 WebKitGTK).

The macOS private API requirement for transparency would still apply.

**Verdict: The lowest-level option. Maximum flexibility but Rust expertise required.**

---

### 11. Gluon

**ARCHIVED February 2024. Do not use.**

Used system-installed browsers (Chrome, Firefox) instead of bundled WebViews. Interesting concept — zero extra download since it reused what the user already had. But development ceased, project is read-only.

---

### 12. pywebview

**True transparency: YES — `transparent=True` parameter.**

Python wrapper around native WebViews. Same underlying engines as Tauri/wry. But Python as a dependency for a desktop app companion is a poor fit for a TypeScript/Node.js project.

---

## Summary Recommendation

| Use Case | Recommendation |
|---|---|
| Windows + Linux, ship soon | **Tauri v2** — transparent + frameless confirmed working |
| macOS | **Wait for Tauri #13415 fix**, or use Electron as fallback |
| Absolute lightest weight | **wry direct** — but requires Rust development |
| Windows-only enterprise | **WebView2 Win32 host** |
| Fallback if Tauri too complex | **Electron** — heavy but reliable |

### The Architecture

The approach that makes sense for place.org:

1. The Next.js app (already running in browser) detects a window drag past viewport bounds.
2. It invokes a companion "popout host" — a tiny Tauri v2 or Electron app that the user installs separately, or that ships as a desktop companion.
3. The host app opens a new `transparent: true, decorations: false` window and loads `http://localhost:3000/popout?windowId=xxx`.
4. The Next.js app communicates with the host via WebSocket or a local HTTP endpoint.
5. The popout window renders the virtual window UI with `background: transparent` CSS, showing only the draggable glass panel floating on the real desktop.

This is exactly what tools like Fig (terminal autocomplete) and Raycast did — tiny native shell, web content inside.

**Confidence: High** for the technical feasibility on Windows/Linux. **Medium** for macOS due to the open Tauri bug.

---

## Open Questions

- Is there a maintained project that wraps Tauri specifically for "popout from browser" use cases?
- ~~Can the Tauri macOS transparency bug be worked around using WKWebView private APIs via a Swift/ObjC shim?~~ **Researched**: See [[Research - Tauri v2 macOS Transparent Window Production Fix 2026]] for a detailed analysis with 7 candidate workarounds. TL;DR: upgrade to Tauri 2.10.3/wry 0.55.0 first (the transparency code was reworked in wry 0.54.2), then try cocoa crate setup hook, then try disabling hardened runtime.
- What is the UX for distributing a companion app alongside a web app?

---

## Sources

- [Tauri v2 Window Customization](https://v2.tauri.app/learn/window-customization/)
- [Tauri v2 Localhost Plugin](https://v2.tauri.app/plugin/localhost/)
- [Tauri Issue #8308 — V2 window.transparent not work (RESOLVED)](https://github.com/tauri-apps/tauri/issues/8308)
- [Tauri Issue #13415 — macOS transparent loses transparency after DMG build (OPEN, 2025)](https://github.com/tauri-apps/tauri/issues/13415)
- [wry — Cross-platform WebView library](https://github.com/tauri-apps/wry)
- [Electron BrowserWindow API](https://www.electronjs.org/docs/latest/api/browser-window)
- [Electron Custom Window Styles](https://www.electronjs.org/docs/latest/tutorial/custom-window-styles)
- [Document Picture-in-Picture API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Document_Picture-in-Picture_API/Using)
- [Neutralino Window API](https://neutralino.js.org/docs/api/window/)
- [ICoreWebView2Controller2 — DefaultBackgroundColor (Microsoft)](https://learn.microsoft.com/en-us/microsoft-edge/webview2/reference/win32/icorewebview2controller2)
- [WebView2 UWP transparency (open issue)](https://learn.microsoft.com/en-us/answers/questions/4044027/how-to-make-uwp-webview2-transparent)
- [Tauri vs Electron size comparison 2025](https://www.oflight.co.jp/en/columns/tauri-v2-vs-electron-comparison)
- [Gluon framework (ARCHIVED)](https://github.com/gluon-framework/gluon)
- [pywebview transparent example](https://pywebview.flowrl.com/examples/transparent)

#research #place-org #native-windows #tauri #electron #transparency #popout

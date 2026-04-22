---
date: 2026-03-25
tags: [research, tauri, macos, transparency, wry, wkwebview, private-api, place-org]
status: active
---

# Research - Tauri v2 macOS Transparent Window Production Fix (2026)

> Research question: What workaround exists to make transparent webview windows work in production macOS Tauri v2 builds (DMG), bypassing the open bug #13415?

Related: [[Research - Transparent Native Windows for place.org Popouts 2025-2026]], [[Research - Tauri v2 Cross-Platform Production Deployment 2025-2026]], [[place.org]]

---

## Issue Summary

- **Bug**: [tauri-apps/tauri#13415](https://github.com/tauri-apps/tauri/issues/13415) -- transparent windows work in `tauri dev` but turn opaque white after bundling to DMG.
- **Filed**: May 10, 2025. **Still OPEN** as of March 25, 2026.
- **Reporter's environment**: macOS 15.4.1 arm64, Tauri 2.5.1, wry 0.51.2, tao 0.33.0.
- **Reproduction**: [github.com/Josssiiiah/test](https://github.com/Josssiiiah/test) confirms the bug in a fresh create-tauri-app project.
- **Comments**: Only 3 comments. FabianLars asked for reproduction, it was provided, then silence. One "me too" in November 2025. No developer response since.

---

## Root Cause Analysis

### How Transparency Works in the Tauri Stack

The transparency pipeline spans three crates:

1. **tao** (window management) -- Creates `NSWindow` with `setOpaque(false)` and `setBackgroundColor(NSColor::clearColor())`. This is **unconditional** -- no feature gate, no `#[cfg]`.

2. **wry** (webview) -- Creates `WKWebView` with `drawsBackground = false` via KVC private API. This is **gated behind `#[cfg(feature = "transparent")]`**. On macOS 12+, also sets `underPageBackgroundColor`.

3. **tauri** (framework) -- Passes `transparent(true)` to tao/wry, but ONLY when `#[cfg(feature = "macos-private-api")]` is active. Without this feature, the transparent flag is **silently dropped**.

### Feature Chain

```
tauri.conf.json: macOSPrivateApi: true
  -> Cargo feature: tauri/macos-private-api
    -> tauri-runtime-wry/macos-private-api
      -> wry/transparent + wry/fullscreen + tauri-runtime/macos-private-api
```

### The Likely Failure Point

**The `tauri dev` vs `tauri build` difference**: `tauri dev` does NOT compile with the `custom-protocol` feature and runs in debug mode. `tauri build` compiles in release mode with `custom-protocol`. The feature flag propagation for `macos-private-api` SHOULD be the same in both modes -- but:

1. The reporter confirmed `macos-private-api` is in Cargo.toml AND `macOSPrivateApi: true` is in tauri.conf.json.
2. The reproduction repo confirms both are set.
3. The wry code that calls the private API (`config.setValue_forKey(Some(&no), ns_string!("drawsBackground"))`) is compile-time gated by `#[cfg(feature = "transparent")]`, which IS enabled via the feature chain.

**Possible explanations for the dev-vs-build difference:**

- **Code signing / hardened runtime**: macOS hardened runtime (which `tauri build` enables for code signing) may restrict access to private APIs or KVC calls on WKWebView. Electron avoids this by using Chromium's own rendering pipeline rather than relying on WKWebView private APIs.
- **NSWindow initialization timing**: In bundled apps, the NSWindow may be created before the webview configuration is applied. The private API KVC call may fail silently if WKWebViewConfiguration is already committed.
- **Entitlements**: The bundled app may be missing entitlements that the unsigned dev build implicitly has.

---

## Candidates for Workaround

### Approach 1: Upgrade to Latest Versions

| Package | Reporter's Version | Latest (March 2026) |
|---------|-------------------|---------------------|
| tauri | 2.5.1 | **2.10.3** |
| wry | 0.51.2 | **0.55.0** |
| tao | 0.33.0 | **0.34.6** |

**Notable wry changes since 0.51.2:**
- **wry 0.54.2** (2026-02-14): Implemented `background_color` support for WKWebView behind `transparent` feature. Disables default white background via `drawsBackground` KVC at init AND applies `underPageBackgroundColor` on macOS 12+. Fixed panics related to `drawsBackground` on macOS 10.13-10.14.
- **wry 0.54.3** (2026-03-09): Fixed crash when loaded by multiple dylibs on macOS.
- **wry 0.55.0** (2026-03-23): Latest release, additional fixes.

**Verdict**: The reporter was on wry 0.51.2. The `background_color` rework in wry 0.54.2 changed exactly the code path that handles transparency. **This should be the first thing to try.** Confidence: MEDIUM-HIGH.

### Approach 2: Post-Creation NSWindow/WKWebView Fix via Rust objc2

If upgrading alone does not fix it, apply the transparency properties AFTER window creation using Tauri's `setup` hook. This mirrors what Electron does:

```rust
// In src-tauri/src/lib.rs, inside tauri::Builder::default().setup(|app| { ... })

#[cfg(target_os = "macos")]
{
    use cocoa::appkit::{NSColor, NSWindow};
    use cocoa::base::{id, nil};

    let window = app.get_webview_window("main").unwrap();
    let ns_window = window.ns_window().unwrap() as id;

    unsafe {
        // 1. Make NSWindow transparent (same as Electron)
        let _: () = msg_send![ns_window, setOpaque: false];
        let clear_color = NSColor::clearColor(nil);
        let _: () = msg_send![ns_window, setBackgroundColor: clear_color];
        let _: () = msg_send![ns_window, setHasShadow: false];

        // 2. Make WKWebView transparent via private API
        let webview = window.webview_window().unwrap();
        // Access the underlying WKWebView and set drawsBackground = false
        // This requires getting the WKWebView pointer from wry
    }
}
```

The challenge: accessing the WKWebView pointer from Tauri's public API is not straightforward. The `ns_window()` method is available, but there is no `wk_webview()` method exposed.

**Alternative using objc2 to walk the view hierarchy:**

```rust
#[cfg(target_os = "macos")]
unsafe {
    use objc2::msg_send;
    use objc2::runtime::AnyObject;

    let ns_window: *mut AnyObject = window.ns_window().unwrap() as _;

    // Set NSWindow properties
    let _: () = msg_send![ns_window, setOpaque: false];
    let _: () = msg_send![ns_window, setBackgroundColor: NSColor::clearColor()];

    // Walk the content view to find WKWebView
    let content_view: *mut AnyObject = msg_send![ns_window, contentView];
    // WKWebView is typically a subview of the content view
    let subviews: *mut AnyObject = msg_send![content_view, subviews];
    // Find WKWebView and call setValue:forKey: with drawsBackground = false
}
```

**Confidence**: MEDIUM. This is the "nuclear option" -- manually applying what wry should be doing. Risk: fragile across macOS versions and wry internal changes.

### Approach 3: Disable Hardened Runtime for the Binary

The hardened runtime restricts certain operations including potentially KVC calls on system frameworks. Try:

In `tauri.conf.json`:
```json
{
  "bundle": {
    "macOS": {
      "hardenedRuntime": false
    }
  }
}
```

Or add an entitlement that allows unsigned code:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
</dict>
</plist>
```

Set in config:
```json
{
  "bundle": {
    "macOS": {
      "entitlements": "entitlements.plist"
    }
  }
}
```

**Confidence**: LOW-MEDIUM. This is speculative. If hardened runtime is blocking the private API KVC call, this would fix it. But it may break notarization.

### Approach 4: Use Window Effects / Vibrancy Instead

Tauri v2 supports `windowEffects` which use `NSVisualEffectView` -- a PUBLIC API, not private:

```json
{
  "windows": [{
    "windowEffects": {
      "effects": ["underWindowBackground"],
      "state": "active"
    }
  }]
}
```

This gives a translucent blurred background rather than true transparency. It works because it uses `NSVisualEffectView` which is a public API not affected by code signing.

**Verdict**: NOT true transparency. You see a blurred version of the desktop, not a clear see-through. Could be acceptable as a fallback aesthetic.

### Approach 5: Tauri Swift Plugin Bridge

Write a Tauri plugin in Swift that directly manipulates the NSWindow and WKWebView after creation:

```swift
// plugin-transparent/swift/Sources/TransparentPlugin.swift
import AppKit
import WebKit

@objc public class TransparentPlugin: NSObject {
    @objc public static func makeTransparent(_ windowPtr: UnsafeMutableRawPointer) {
        let nsWindow = Unmanaged<NSWindow>.fromOpaque(windowPtr).takeUnretainedValue()
        nsWindow.isOpaque = false
        nsWindow.backgroundColor = .clear
        nsWindow.hasShadow = false

        // Walk subviews to find WKWebView
        if let contentView = nsWindow.contentView {
            for subview in contentView.subviews {
                if let webView = subview as? WKWebView {
                    webView.setValue(false, forKey: "drawsBackground")
                    if #available(macOS 12.0, *) {
                        webView.underPageBackgroundColor = .clear
                    }
                }
            }
        }
    }
}
```

Then call from Rust via Tauri's plugin system.

**Confidence**: MEDIUM-HIGH. This bypasses wry's feature-gated code entirely. The Swift code directly applies what Electron does. However, the `drawsBackground` KVC call may still be blocked by hardened runtime.

### Approach 6: Skip DMG, Use Direct .app Bundle

The reporter specifically tested DMG builds. The DMG creation process may apply additional code signing or quarantine attributes. Try:

```bash
tauri build --bundles app
```

Then test the .app bundle directly (drag to Applications manually). If it works, the issue is in DMG-specific code signing, not in the binary itself.

**Confidence**: LOW-MEDIUM. Worth testing as a diagnostic step.

---

## How Electron Does It Differently

Electron's approach (from `shell/browser/native_window_mac.mm`):

```objc
// 1. NSWindow setup
[window_ setOpaque:NO];
[window_ setBackgroundColor:[NSColor clearColor]];
[window_ setTitlebarAppearsTransparent:YES];
[window_ setTitleVisibility:NSWindowTitleHidden];

// 2. Content view layer
[[[window_ contentView] layer] setBackgroundColor:cgcolor.get()];
```

**Key difference**: Electron uses Chromium's own rendering engine, which does NOT use WKWebView. It renders directly to a CALayer attached to the NSWindow's content view. There is NO private API dependency because Chromium controls its own rendering pipeline end-to-end.

Tauri/wry relies on Apple's WKWebView, which requires the `drawsBackground` private KVC key to disable its default opaque background. This private API is what breaks in production builds.

**This is a fundamental architectural difference.** Electron bundles Chromium, so it owns the renderer. Tauri uses the system WebView, so it depends on Apple's private APIs for transparency.

---

## Recommended Action Plan

**Priority order:**

1. **Upgrade to Tauri 2.10.3 / wry 0.55.0 / tao 0.34.6** and retest. The wry 0.54.2 changes reworked the exact transparency code path. This may already fix the issue.

2. **If still broken, add the setup hook** that manually applies `setOpaque(false)` + `setBackgroundColor(clearColor)` on the NSWindow via the cocoa crate. This addresses the tao layer.

3. **If still broken, try disabling hardened runtime** or adding `com.apple.security.cs.disable-library-validation` entitlement. This addresses the possibility that code signing blocks private KVC calls.

4. **If still broken, try the .app bundle** instead of DMG to isolate whether DMG-specific signing is the cause.

5. **If still broken, write a Swift Tauri plugin** that walks the view hierarchy and applies `setValue(false, forKey: "drawsBackground")` on the WKWebView directly, plus `setOpaque(false)` and `backgroundColor = .clear` on the NSWindow.

6. **If ALL fail, the nuclear option**: Use `wry` directly (without Tauri) to create a minimal transparent window host. This gives full control over the WKWebView configuration and avoids Tauri's feature-gating layer.

7. **Fallback**: Use `windowEffects` with `underWindowBackground` for a vibrancy-based translucent look that uses only public APIs.

---

## Version Matrix

| Approach | Effort | Confidence | Risk |
|----------|--------|------------|------|
| Upgrade to latest Tauri/wry | Low | Medium-High | Low |
| setup hook with cocoa crate | Medium | Medium | Medium |
| Disable hardened runtime | Low | Low-Medium | Medium (notarization) |
| .app instead of DMG | Low | Low-Medium | Low |
| Swift Tauri plugin | High | Medium-High | Medium |
| Raw wry binary | High | High | High (maintenance) |
| Window effects / vibrancy | Low | High | Low (not true transparency) |

---

## Sources

- [tauri-apps/tauri#13415 -- macOS transparent loses transparency after DMG build](https://github.com/tauri-apps/tauri/issues/13415)
- [tauri-apps/tauri#14394 -- transparent window border incorrect on macOS](https://github.com/tauri-apps/tauri/issues/14394)
- [tauri-apps/tauri#14515 -- hidden transparent window white flash](https://github.com/tauri-apps/tauri/issues/14515)
- [tauri-apps/tauri#11142 -- macos-private-api feature conflicts](https://github.com/tauri-apps/tauri/issues/11142)
- [tauri-apps/wry#1266 -- Transparent WebView not working on macOS](https://github.com/tauri-apps/wry/issues/1266)
- [wry v0.54.2 release notes -- background_color rework](https://github.com/tauri-apps/wry/releases/tag/wry-v0.54.2)
- [wry v0.55.0 release](https://github.com/tauri-apps/wry/releases/tag/wry-v0.55.0)
- [wry source: wkwebview/mod.rs transparency code](https://github.com/tauri-apps/wry/blob/dev/src/wkwebview/mod.rs)
- [tao source: macos/window.rs NSWindow transparency](https://github.com/tauri-apps/tao/blob/dev/src/platform_impl/macos/window.rs)
- [tauri-runtime-wry Cargo.toml -- feature chain](https://github.com/tauri-apps/tauri/blob/dev/crates/tauri-runtime-wry/Cargo.toml)
- [Electron native_window_mac.mm -- transparency implementation](https://github.com/electron/electron/blob/main/shell/browser/native_window_mac.mm)
- [Tauri Window Customization docs](https://v2.tauri.app/learn/window-customization/)
- [WKWebView drawsBackground private API discussion](https://developer.apple.com/forums/thread/121139)
- [Apple Feedback FB7539179 -- WKWebView should have public drawsBackground](https://github.com/feedback-assistant/reports/issues/81)
- [Josssiiiah/test reproduction repo](https://github.com/Josssiiiah/test)
- [Tauri macOS code signing docs](https://v2.tauri.app/distribute/sign/macos/)
- [tauri-plugin-decorum (transparency helper)](https://crates.io/crates/tauri-plugin-decorum)

#research #tauri #macos #transparency #wry #wkwebview #private-api #place-org

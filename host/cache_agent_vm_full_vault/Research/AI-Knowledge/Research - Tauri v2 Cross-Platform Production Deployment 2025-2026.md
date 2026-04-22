---
date: 2026-03-25
tags: [research, tauri, cross-platform, deployment, production, place-org, native-windows]
status: active
---

# Research - Tauri v2 Cross-Platform Production Deployment (2025-2026)

> Production deployment research for a Tauri v2 tray-only companion app with transparent frameless webview windows, WebSocket server, and autostart. Companion to [[Research - Tauri v2 Project Setup 2025-2026]] and [[Research - Transparent Native Windows for place.org Popouts 2025-2026]].

Related: [[place.org]]

---

## The App Under Evaluation

- Tauri v2 tray-only app (`"windows": []`, system tray icon only)
- Spawns `WebviewWindow` with `decorations(false)`, `transparent(true)`, `shadow(false)` loading external URLs
- WebSocket server on `localhost:27182`
- `tauri-plugin-autostart` with `MacosLauncher::LaunchAgent`
- `data-tauri-drag-region` for window dragging
- `withGlobalTauri: true`, `macOSPrivateApi: true`
- ACL capabilities with `remote.urls` for external URL permissions

---

## macOS

### 1. Transparent Windows in Production DMG Builds

**STATUS: BROKEN. Issue [#13415](https://github.com/tauri-apps/tauri/issues/13415) is OPEN as of March 2026.**

- Filed: May 10, 2025. Environment: macOS 15.4.1 arm64, Tauri 2.5.1, wry 0.51.2.
- During `tauri dev`, `transparent(true)` works correctly.
- After `tauri build --bundles dmg`, the window turns solid white.
- `macOSPrivateApi: true` is confirmed set. `TAURI_PRIVATE_API=1` env var also attempted. Neither fixes it.
- Labels: `type: bug`, `platform: macOS`, `status: needs triage`. 3 comments, last one November 29, 2025: "same happens to me. any updates?" -- **no developer response.**
- Root cause: wry requires calling WKWebView private APIs for transparent backgrounds. Something in the bundling/codesigning process breaks this.
- Related: Issue [#14394](https://github.com/tauri-apps/tauri/issues/14394) -- transparent window border rendering is also incorrect on macOS.
- Related: Issue [#14515](https://github.com/tauri-apps/tauri/issues/14515) -- hidden transparent window shows white flash when displayed (CLOSED/FIXED on Windows, but the pattern indicates platform inconsistency).

**Confidence: HIGH that this is currently broken in production builds. No workaround confirmed.**

**UPDATE 2026-03-25**: Deep-dive research completed. See [[Research - Tauri v2 macOS Transparent Window Production Fix 2026]] for 7 candidate workarounds. Key finding: the reporter was on wry 0.51.2, and wry 0.54.2 (2026-02-14) reworked the exact transparency code path (`drawsBackground` KVC + `underPageBackgroundColor`). Upgrading to Tauri 2.10.3 / wry 0.55.0 is the first action item.

### 2. data-tauri-drag-region with WKWebView

**STATUS: Works with caveats.**

- `data-tauri-drag-region` applies only to the element it is directly placed on -- child elements do not inherit the behavior. You must add it to each child individually or use `window.startDragging()`.
- Issue [#11605](https://github.com/tauri-apps/tauri/issues/11605) -- dragging did not work when the window was not focused. **CLOSED/FIXED.**
- macOS Sonoma behavioral note: the first drag attempt may only focus the window without moving it. Second drag moves it. This is an OS-level focus behavior, not a Tauri bug per se.
- Tauri docs recommend using `startDragging()` via mousedown event listener for more reliable custom drag behavior, with the `core:window:allow-start-dragging` permission.
- Source: [Window Customization docs](https://v2.tauri.app/learn/window-customization/)

### 3. Tray Icon Reliability

**STATUS: Works. This is the recommended pattern.**

- macOS tray icon appears in the menu bar (right side). Uses `TrayIconBuilder` in the `.setup()` closure.
- `iconAsTemplate: true` in config makes the icon adapt to light/dark menu bar (recommended for macOS).
- No widespread reports of tray icon failures on macOS in the issue tracker.
- Source: [System Tray docs](https://v2.tauri.app/learn/system-tray/)

### 4. Autostart with LaunchAgent

**STATUS: Works. No confirmed macOS-specific bugs.**

- `MacosLauncher::LaunchAgent` creates a plist file in `~/Library/LaunchAgents/`.
- LaunchAgents survive reboots -- they are loaded by launchd on user login.
- The plugin exposes `enable()`, `disable()`, `isEnabled()` from JS.
- No macOS-specific issue equivalent to the Windows registry removal bug (Issue [#771](https://github.com/tauri-apps/plugins-workspace/issues/771)).
- Source: [Autostart plugin docs](https://v2.tauri.app/plugin/autostart/)

### 5. Gatekeeper and Unsigned Apps

**STATUS: Painful but survivable for technical users. Not viable for general audiences.**

**The exact UX flow on macOS Sequoia (15.x) and later:**
1. User downloads `.dmg`, mounts it, drags `.app` to Applications.
2. Double-clicking shows: _"[App] can't be opened because Apple cannot check it for malicious software."_ with only a "Done" button.
3. The old Control-click > Open bypass was **removed in macOS Sequoia** (2024). It no longer works.
4. The user must navigate to **System Settings > Privacy & Security**, scroll to the Security section, find the blocked app listed, click **"Open Anyway"**, confirm with **"Open"**, and enter their **admin password**.
5. This is required only once per app version.
6. Alternative: run `sudo xattr -cr /Applications/MyApp.app` in Terminal to strip the quarantine attribute entirely. Technical users only.

**Notarization is strongly recommended.** Apple's notarization service will notarize apps using `macOSPrivateApi` -- it only checks for malware, not private API usage. The App Store rejects private APIs, but notarization does not.

- Source: [macOS Code Signing docs](https://v2.tauri.app/distribute/sign/macos/), [idownloadblog Sequoia Gatekeeper change](https://www.idownloadblog.com/2024/08/07/apple-macos-sequoia-gatekeeper-change-install-unsigned-apps-mac/)

### 6. Background App / No Dock Icon

**STATUS: Supported via activation policy.**

To make the app tray-only with no Dock icon:

```rust
#[cfg(target_os = "macos")]
app.set_activation_policy(tauri::ActivationPolicy::Accessory);
```

This sets `NSApplicationActivationPolicyAccessory`, which hides the Dock icon while keeping the menu bar tray icon visible. This is the standard pattern for menu bar utilities.

- `LSUIElement` in Info.plist achieves the same thing but `set_activation_policy` is the Tauri-native way.
- Source: [Discussion #6093](https://github.com/tauri-apps/tauri/discussions/6093), [Discussion #10774](https://github.com/tauri-apps/tauri/discussions/10774)

### 7. Apple Silicon vs Intel

**STATUS: No behavioral differences for this feature set.**

- Tauri supports three build targets: `aarch64-apple-darwin` (Apple Silicon), `x86_64-apple-darwin` (Intel), `universal-apple-darwin` (fat binary, both).
- Universal binary doubles the bundle size but covers both architectures natively.
- Apple Silicon machines can run Intel builds via Rosetta 2 (performance penalty).
- For Apple Silicon-only builds, set `bundle.macOS.minimumSystemVersion` to `"12.0"`.
- No architecture-specific differences in transparent window behavior, tray icon, or WebSocket server.
- Source: [macOS Application Bundle docs](https://v2.tauri.app/distribute/macos-application-bundle/)

### 8. macOSPrivateApi Consequences

**STATUS: Blocks App Store only. Notarization still works.**

- `macOSPrivateApi: true` enables two things: transparent background API and `fullScreenEnabled` preference.
- This uses private WKWebView APIs that Apple explicitly bans from the Mac App Store.
- Notarization (required for smooth Gatekeeper passage) is **not affected** -- Apple's notarization checks for malware, not private API usage.
- No other known downsides for direct distribution (DMG, Homebrew, website download).
- Both the Cargo.toml feature (`macos-private-api`) and the config key (`app.macOSPrivateApi`) must be set.
- Source: [Tauri Config Reference](https://v2.tauri.app/reference/config/), [Issue #11142](https://github.com/tauri-apps/tauri/issues/11142), [Docs issue #463](https://github.com/tauri-apps/tauri-docs/issues/463)

---

## Windows

### 1. Transparent Windows with WebView2

**STATUS: Works. Requires `shadow: false`.**

- WebView2 supports transparent backgrounds via `ICoreWebView2Controller2.DefaultBackgroundColor` with alpha=0. Tauri/wry sets this when `transparent(true)` is used.
- `shadow: false` is required -- Tauri v2 enables window shadows by default, which conflict with transparency. This was the root cause of Issue [#8308](https://github.com/tauri-apps/tauri/issues/8308) (RESOLVED).
- DWM (Desktop Window Manager) must be running. It is always running on Windows 8+ and cannot be disabled on Windows 10/11. This is not a practical concern.
- Issue [#14515](https://github.com/tauri-apps/tauri/issues/14515) -- white flash when showing a hidden transparent window -- is **CLOSED/FIXED**.
- WebView2 ships with Windows 11. On Windows 10, Tauri's NSIS installer bundles the WebView2 bootstrapper and installs it automatically.
- Source: [Window Customization docs](https://v2.tauri.app/learn/window-customization/), [WebView2 docs](https://v2.tauri.app/reference/webview-versions/)

### 2. data-tauri-drag-region with WebView2

**STATUS: Works with known edge case.**

- `data-tauri-drag-region` works on WebView2.
- For touch and pen input, the CSS approach is recommended: `*[data-tauri-drag-region] { app-region: drag; }` -- this provides better touch/pen support than the attribute alone.
- Issue [#10767](https://github.com/tauri-apps/tauri/issues/10767) -- dragging causes focus toggling and eats mouse events -- is **OPEN**. This affects Windows specifically.
- Issue [#12597](https://github.com/tauri-apps/tauri/issues/12597) -- all Tauri commands become slow after dragging with `data-tauri-drag-region` -- indicates a performance regression that may still be present.
- Workaround: use `startDragging()` with a manual mousedown listener instead of the attribute.
- Source: [Window Customization docs](https://v2.tauri.app/learn/window-customization/)

### 3. System Tray (Notification Area)

**STATUS: Works on Windows 10 and 11.**

- The icon appears in the Windows notification area (system tray). On Windows 11, it may be in the overflow area by default -- the user can pin it to the visible tray.
- No Windows 11-specific regressions reported.
- `TrayIconBuilder` with menu works as documented.
- Source: [System Tray docs](https://v2.tauri.app/learn/system-tray/)

### 4. Autostart (Registry)

**STATUS: BUG -- registry entry may be removed after one boot.**

- On Windows, `tauri-plugin-autostart` writes to `HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\Run`.
- Issue [#771](https://github.com/tauri-apps/plugins-workspace/issues/771): the registry entry is removed after launch or plugin registration. If `enable()` is not called again, the app will not start on next boot. **OPEN, 0 comments, no developer response.**
- Filed: November 28, 2023. Still open as of March 2026 with no resolution.
- **Workaround**: call `enable()` on every app startup as a defensive measure to re-register the entry.
- Windows Updates do not typically remove `HKCU\...\Run` entries, but this bug means the entry may not survive even a normal reboot.
- Source: [Issue #771](https://github.com/tauri-apps/plugins-workspace/issues/771)

### 5. SmartScreen (Unsigned EXEs)

**STATUS: Blocked by default. EV certificate eliminates the warning.**

**The exact UX flow:**
1. User downloads the `.exe` installer (NSIS format by default).
2. Browser (Edge/Chrome) may show "This file is not commonly downloaded" warning. User clicks "Keep".
3. On running the installer, SmartScreen shows: _"Windows protected your PC -- Microsoft Defender SmartScreen prevented an unrecognized app from starting."_
4. User clicks **"More info"**, then **"Run anyway"**.
5. This is per-download, not per-install. If the user downloads again, they see it again.

**Certificate options:**
- **No signing**: SmartScreen blocks. User must click through.
- **OV (Organization Validated) certificate**: SmartScreen still shows the warning initially. Reputation builds over time based on download volume. Eventually the warning disappears.
- **EV (Extended Validation) certificate**: **Immediate** SmartScreen trust. No warning from day one. Costs $400+/year. Since June 2023, must be stored on HSM (hardware security module) or cloud HSM like Azure Key Vault.

- Source: [Windows Code Signing docs](https://v2.tauri.app/distribute/sign/windows/), [DEV Community guide](https://dev.to/tomtomdu73/ship-your-tauri-v2-app-like-a-pro-code-signing-for-macos-and-windows-part-12-3o9n)

### 6. Windows Defender and WebSocket Server

**STATUS: Known false positive risk. Code signing is the primary mitigation.**

- Tauri NSIS installers are frequently flagged by Windows Defender as trojans. This is an upstream NSIS issue -- the installer format is commonly abused by malware, so heuristic scanners flag it.
- Issue [#10649](https://github.com/tauri-apps/tauri/issues/10649) and Issue [#2486](https://github.com/tauri-apps/tauri/issues/2486) track this.
- The WebSocket server on localhost adds to the suspicion profile -- network-listening binaries are flagged more often.
- **Mitigations:**
  - Code sign the EXE (even OV helps reduce false positives).
  - Issue [#11673](https://github.com/tauri-apps/tauri/issues/11673) notes that NSIS plugin DLLs inside the installer are NOT signed even when code signing is enabled -- self-signing these helps.
  - Submit the binary to Microsoft for review via the [Windows Defender false positive submission portal](https://www.microsoft.com/en-us/wdsi/filesubmission).
  - Rebuilding the binary sometimes changes the hash enough to avoid flagging (not reliable).
- Source: [Tauri by Simon - False Positives](https://tauri.by.simon.hyll.nu/concepts/security/false_positives/)

### 7. DPI Awareness

**STATUS: Handled by Tauri/WebView2 automatically. No manifest entries needed.**

- Tauri sets DPI awareness context via the tao windowing library. WebView2 inherits DPI settings from the host process.
- Issue [#1074](https://github.com/tauri-apps/tauri/issues/1074) (blurry on high-DPI) was resolved long ago.
- Per-monitor DPI awareness (V2) is used by default. No custom manifest entries required.
- Edge case: Issue [#3610](https://github.com/tauri-apps/tauri/issues/3610) -- window size changes when dragging across monitors with different DPI scales. This is an ongoing Windows limitation.
- Source: [Tauri DPI API](https://v2.tauri.app/reference/javascript/api/namespacedpi/)

### 8. Windows on ARM

**STATUS: Supported. Native aarch64 binaries available.**

- Target: `aarch64-pc-windows-msvc`. Requires installing "C++ ARM64 build tools" from Visual Studio Installer and `rustup target add aarch64-pc-windows-msvc`.
- The NSIS installer itself runs as x86 via emulation, but the app binary is native ARM64.
- WebView2 has native ARM64 support on Windows 11 ARM devices.
- No ARM-specific transparency or tray icon issues reported.
- Source: [Windows Installer docs](https://v2.tauri.app/distribute/windows-installer/)

---

## Linux

### 1. Transparent Windows

**STATUS: X11 with compositor works. X11 without compositor does not. Wayland is problematic.**

**X11 with compositor (picom, KWin, Mutter):**
- Works. The compositor provides the ARGB visual/alpha channel needed for transparency.
- Confirmed with GTK/WebKitGTK backend.

**X11 without compositor:**
- Does NOT work. Without a compositor, there is no alpha channel compositing. The window background will be opaque (usually black or white).
- This is a fundamental X11 limitation, not a Tauri bug.

**Wayland (GNOME, KDE, Sway):**
- Tauri uses gtk and webkit2gtk. On Wayland, GTK runs natively via the GDK Wayland backend.
- Transparency support depends on the compositor's implementation. GNOME (Mutter) and KDE (KWin) support transparent surfaces. Sway supports it.
- However, Issue [#4635](https://github.com/tauri-apps/tauri/issues/4635) notes that some Tauri apps start Xwayland even when they should not need it.
- `WindowBuilder::with_transparent_draw` option exists on Linux to disable the internal draw for transparent windows and allow manual rendering.
- Source: [tao release notes](https://v2.tauri.app/release/tao/v0.13.0/), [wry README](https://github.com/tauri-apps/wry)

### 2. Window Dragging (data-tauri-drag-region / startDragging)

**X11:**
- Works. `data-tauri-drag-region` and `startDragging()` both function correctly on X11.
- Issue [#11605](https://github.com/tauri-apps/tauri/issues/11605) (can't drag unfocused window) is CLOSED/FIXED.

**Wayland:**
- `startDragging()` requires a valid Wayland event serial. The serial must come from a recent user interaction (pointer button press). If the serial is stale or invalid, the compositor rejects the drag request.
- tao (Tauri's windowing library) has received Wayland-specific fixes for dragging and resizing in recent releases (tao 0.30.3+).
- Issue [#11282](https://github.com/tauri-apps/tauri/issues/11282) -- DragDrop events not firing on Wayland -- is **CLOSED/FIXED**.
- Known remaining edge: some tiling WMs (Sway, Hyprland) may handle drag operations differently for tiled vs floating windows.
- Source: [tao 0.30.3 release](https://v2.tauri.app/release/tao/v0.30.3/)

### 3. System Tray Protocols

**STATUS: Uses AppIndicator/libayatana. No XEmbed. No native StatusNotifierItem.**

- Tauri's `tray-icon` crate on Linux requires either `libappindicator3-dev` or `libayatana-appindicator3-dev`.
- This implements the **AppIndicator** protocol, which internally uses **StatusNotifierItem (SNI)** D-Bus protocol on modern desktops.
- **XEmbed (legacy tray protocol) is NOT supported.** Minimal desktops using only XEmbed trays (some old WMs) will not show the icon.
- GNOME has dropped built-in tray support. Users need an extension like [AppIndicator/KStatusNotifierItem](https://extensions.gnome.org/extension/615/appindicator-support/) or [status-tray](https://github.com/keithvassallomt/status-tray) to see tray icons.
- KDE Plasma supports SNI natively.
- Sway/wlroots: needs an SNI-compatible tray like `waybar`.
- **Note (June 2025):** `libayatana-appindicator` is deprecated in favor of `libayatana-appindicator-glib`. The Tauri tray-icon crate may need to migrate.
- Additional dependency: `libxdo` for clipboard menu items, `libgtk-3-dev` for GTK event loop.
- Source: [tray-icon crate](https://github.com/tauri-apps/tray-icon), [tray-icon on crates.io](https://crates.io/crates/tray-icon)

### 4. Autostart (.desktop file)

**STATUS: Works on standard desktop environments. Breaks on tiling WMs.**

- `tauri-plugin-autostart` on Linux creates a `.desktop` file in `~/.config/autostart/`.
- This follows the XDG Autostart specification.
- Standard DEs (GNOME, KDE, XFCE, Cinnamon) read this directory and auto-launch entries at login.
- **Hyprland, Sway, i3, and other tiling WMs typically do NOT read `~/.config/autostart/`**. Users must add the app to their WM's config manually.
- Source: [Autostart plugin docs](https://v2.tauri.app/plugin/autostart/), [XDG Autostart specification](https://wiki.archlinux.org/title/XDG_Autostart)

### 5. WebKitGTK Version Requirements

**STATUS: webkit2gtk-4.1 (soup3) minimum. Ships with Ubuntu 22.04+.**

- Tauri v2 migrated from webkit2gtk-4.0 to **webkit2gtk-4.1** in alpha.3. The difference is the underlying HTTP library: 4.0 uses soup2, 4.1 uses soup3.
- This change was made for Flatpak compatibility (GNOME runtime ships 4.1).
- Minimum distro versions: Ubuntu 22.04 LTS, Fedora 36+, Arch (rolling).
- Issue [#9039](https://github.com/tauri-apps/tauri/issues/9039) -- Tauri v2 has constrained compatibility on Linux -- notes that some older distros lack webkit2gtk-4.1.
- WebKitGTK version on the user's system determines web feature support (not pinned by Tauri).
- Source: [Tauri alpha.3 blog post](https://v2.tauri.app/blog/tauri-2-0-0-alpha-3/), [Prerequisites docs](https://v2.tauri.app/start/prerequisites/)

### 6. remote.urls ACL with WebKitGTK

**STATUS: Works but with a critical security caveat on Linux.**

- The `remote.urls` capability in ACL config works to grant permissions to external URLs loaded in webviews.
- **CRITICAL WARNING from Tauri docs:** "On Linux and Android, Tauri is unable to distinguish between requests from an embedded `<iframe>` and the window itself." This means if your remote page has iframes, those iframes get the same permissions as the main window.
- This is a WebKitGTK limitation -- it does not provide origin-level request isolation within a single webview process.
- Source: [Capabilities docs](https://v2.tauri.app/security/capabilities/), [Capability reference](https://v2.tauri.app/reference/acl/capability/)

### 7. Wayland WebSocket Security

**STATUS: No Wayland-specific restrictions found.**

- WebSocket connections from webviews to localhost are handled at the WebKitGTK network layer, not the Wayland display protocol layer.
- Wayland's security model restricts display-level operations (screenshots, global hotkeys, window positioning), not network operations.
- `localhost:27182` WebSocket connections should work identically on X11 and Wayland.
- No issues found in the tracker specifically about Wayland blocking WebSocket connections.

---

## Distribution

### 1. macOS Notarization

**STATUS: Strongly recommended. Required for smooth UX on Sequoia+.**

- Notarization is technically not "required" -- unsigned apps can still run with the manual bypass described above. But the UX is hostile.
- Apple charges **$99/year** for an Apple Developer Program membership, which is needed for both code signing and notarization.
- `macOSPrivateApi: true` does **not** prevent notarization. Apple's notarization service checks for malware, not private API usage. Only App Store submission checks for private APIs.
- Tauri handles notarization automatically during `tauri build` if credentials are provided via environment variables (`APPLE_API_ISSUER`, `APPLE_API_KEY`, `APPLE_API_KEY_PATH` or Apple ID credentials).
- Source: [macOS Code Signing docs](https://v2.tauri.app/distribute/sign/macos/)

### 2. Windows Code Signing

**STATUS: Recommended. EV for no-warning, OV for budget-conscious.**

| Option | Cost (annual) | SmartScreen | Notes |
|---|---|---|---|
| Unsigned | $0 | Blocked (click-through) | Unacceptable for general distribution |
| Self-signed | $0 | Still blocked | Slightly fewer Defender false positives |
| OV certificate | ~$100-200/yr | Warning initially, builds reputation | Since June 2023, must use HSM (Azure Key Vault cheapest) |
| EV certificate | ~$400+/yr | Immediate trust | Must use physical HSM or Azure Key Vault. Companies only in some regions |

- Since June 2023, all new code signing certificates (OV and EV) must be stored on HSMs. No more exportable `.pfx` files.
- Azure Key Vault is the cheapest cloud HSM option for indie developers.
- Source: [Windows Code Signing docs](https://v2.tauri.app/distribute/sign/windows/)

### 3. Linux Distribution Format

**STATUS: AppImage is best for auto-update. .deb for system integration. Flatpak for sandboxing.**

| Format | Auto-Update | System Integration | User Experience |
|---|---|---|---|
| **AppImage** | YES (Tauri updater uses this) | No (standalone binary) | Download, chmod +x, run |
| **.deb** | No native Tauri updater support | YES (apt, desktop files, mime types) | `dpkg -i` or double-click |
| **Flatpak** | Via Flathub updates | Sandboxed | `flatpak install` |
| **.rpm** | No native Tauri updater support | YES (dnf/yum) | `rpm -i` |

- The Tauri updater on Linux works **only with AppImage**. It creates a `.tar.gz` containing the AppImage, plus a `.sig` signature file.
- For `.deb` users, you would need a custom apt repository for updates.
- Source: [Updater plugin docs](https://v2.tauri.app/plugin/updater/)

### 4. Auto-Updater (tauri-plugin-updater)

**STATUS: Works cross-platform. Requires signature infrastructure.**

**Platforms:** Windows, macOS, Linux (desktop only).

**Update artifacts by platform:**

| Platform | Artifact | Signature |
|---|---|---|
| Windows (NSIS) | `.exe` | `.exe.sig` |
| Windows (MSI) | `.msi` | `.msi.sig` |
| macOS | `.app.tar.gz` | `.app.tar.gz.sig` |
| Linux | `.AppImage` (v2 format) | `.AppImage.sig` |

**Update server JSON format (static):**

```json
{
  "version": "1.2.3",
  "notes": "Changelog here",
  "pub_date": "2026-03-25T00:00:00Z",
  "platforms": {
    "darwin-aarch64": {
      "url": "https://releases.example.com/myapp-1.2.3-aarch64.app.tar.gz",
      "signature": "CONTENT_OF_SIG_FILE"
    },
    "darwin-x86_64": {
      "url": "https://releases.example.com/myapp-1.2.3-x86_64.app.tar.gz",
      "signature": "CONTENT_OF_SIG_FILE"
    },
    "linux-x86_64": {
      "url": "https://releases.example.com/myapp-1.2.3-x86_64.AppImage",
      "signature": "CONTENT_OF_SIG_FILE"
    },
    "windows-x86_64": {
      "url": "https://releases.example.com/myapp-1.2.3-x86_64-setup.exe",
      "signature": "CONTENT_OF_SIG_FILE"
    }
  }
}
```

**Dynamic endpoint** (per-platform URL with variables):
```
https://releases.example.com/{{target}}/{{arch}}/{{current_version}}
```

Returns 200 with `{ "version", "url", "signature" }` if update available, or 204 No Content if up-to-date.

**Signing is mandatory.** Generate keypair with `tauri signer generate`. Private key via `TAURI_SIGNING_PRIVATE_KEY` env var at build time.

**Windows limitation:** The app must exit during installation because NSIS replaces the running binary. Three install modes: `passive` (default, minimal UI), `basicUi` (interactive), `quiet` (silent).

- Source: [Updater plugin docs](https://v2.tauri.app/plugin/updater/), [GitHub Actions pipeline docs](https://v2.tauri.app/distribute/pipelines/github/)

---

## Risk Matrix

| Feature | macOS | Windows | Linux (X11+compositor) | Linux (Wayland) |
|---|---|---|---|---|
| Transparent windows | **BROKEN in DMG** (#13415) | Works | Works | Works (compositor-dependent) |
| data-tauri-drag-region | Works (focus quirk) | Works (focus toggle bug #10767) | Works | Works (serial-dependent) |
| Tray icon | Works | Works | Needs AppIndicator lib | Needs AppIndicator lib |
| Autostart | Works (LaunchAgent) | **BUG** (#771, registry removed) | Works (standard DEs only) | Works (standard DEs only) |
| No dock icon | Works (Accessory policy) | N/A | N/A | N/A |
| Unsigned distribution | Hostile UX (Sequoia+) | SmartScreen block | No issues | No issues |
| Auto-updater | Works | Works (app must exit) | Works (AppImage only) | Works (AppImage only) |
| Remote URL ACL | Works | Works | Works (**iframe caveat**) | Works (**iframe caveat**) |

---

## Blocking Issues for Production

1. **macOS transparency in DMG builds** -- Issue #13415 is unresolved with no developer traction. This is a showstopper if transparency is a hard requirement on macOS.
2. **Windows autostart registry removal** -- Issue #771 is unresolved. Workaround: defensively call `enable()` on every app startup.
3. **Windows Defender false positives** -- Ongoing upstream NSIS issue. Mitigation: code sign, submit to Microsoft for review.

## Recommended Next Steps

1. **For macOS**: Accept opaque windows for now, or invest time testing if a workaround exists (e.g., manually calling WKWebView private APIs via Swift/ObjC bridge after window creation). Monitor Issue #13415.
2. **For Windows**: Budget for at minimum an OV code signing certificate ($100-200/yr + Azure Key Vault). Implement defensive `enable()` on startup for autostart.
3. **For Linux**: Target AppImage for auto-update support. Document that GNOME users need the AppIndicator extension for the tray icon.
4. **For all platforms**: Set up `tauri signer generate` and a static JSON update endpoint (GitHub Releases is simplest).

---

## Sources

- [Tauri v2 Window Customization](https://v2.tauri.app/learn/window-customization/)
- [Tauri v2 System Tray](https://v2.tauri.app/learn/system-tray/)
- [Tauri v2 Updater Plugin](https://v2.tauri.app/plugin/updater/)
- [Tauri v2 Autostart Plugin](https://v2.tauri.app/plugin/autostart/)
- [Tauri v2 macOS Code Signing](https://v2.tauri.app/distribute/sign/macos/)
- [Tauri v2 Windows Code Signing](https://v2.tauri.app/distribute/sign/windows/)
- [Tauri v2 macOS Application Bundle](https://v2.tauri.app/distribute/macos-application-bundle/)
- [Tauri v2 Windows Installer](https://v2.tauri.app/distribute/windows-installer/)
- [Tauri v2 Capabilities](https://v2.tauri.app/security/capabilities/)
- [Tauri v2 ACL Capability Reference](https://v2.tauri.app/reference/acl/capability/)
- [Tauri v2 Webview Versions](https://v2.tauri.app/reference/webview-versions/)
- [Tauri v2 Prerequisites](https://v2.tauri.app/start/prerequisites/)
- [Tauri v2 Config Reference](https://v2.tauri.app/reference/config/)
- [Tauri v2 GitHub Actions Pipeline](https://v2.tauri.app/distribute/pipelines/github/)
- [Issue #13415 -- macOS transparent loses transparency after DMG build (OPEN)](https://github.com/tauri-apps/tauri/issues/13415)
- [Issue #14394 -- macOS transparent window border incorrect (OPEN)](https://github.com/tauri-apps/tauri/issues/14394)
- [Issue #14515 -- White flash on hidden transparent window (CLOSED)](https://github.com/tauri-apps/tauri/issues/14515)
- [Issue #8308 -- V2 transparent not working without shadow:false (CLOSED)](https://github.com/tauri-apps/tauri/issues/8308)
- [Issue #10767 -- Dragging causes focus toggling (OPEN)](https://github.com/tauri-apps/tauri/issues/10767)
- [Issue #11605 -- Can't drag unfocused window (CLOSED)](https://github.com/tauri-apps/tauri/issues/11605)
- [Issue #11282 -- DragDrop not firing on Wayland (CLOSED)](https://github.com/tauri-apps/tauri/issues/11282)
- [Issue #12597 -- Commands slow after dragging (OPEN)](https://github.com/tauri-apps/tauri/issues/12597)
- [Issue #771 -- Windows autostart removed after one boot (OPEN)](https://github.com/tauri-apps/plugins-workspace/issues/771)
- [Issue #10649 -- Flagged as virus by Windows Defender (OPEN)](https://github.com/tauri-apps/tauri/issues/10649)
- [Issue #2486 -- Trojan alert from Windows Defender (OPEN)](https://github.com/tauri-apps/tauri/issues/2486)
- [Issue #11673 -- NSIS plugins unsigned (OPEN)](https://github.com/tauri-apps/tauri/issues/11673)
- [Issue #9039 -- Constrained Linux compatibility (OPEN)](https://github.com/tauri-apps/tauri/issues/9039)
- [Issue #4635 -- Apps start Xwayland unnecessarily (OPEN)](https://github.com/tauri-apps/tauri/issues/4635)
- [tray-icon crate](https://github.com/tauri-apps/tray-icon)
- [wry WebView library](https://github.com/tauri-apps/wry)
- [tao 0.30.3 release notes](https://v2.tauri.app/release/tao/v0.30.3/)
- [macOS Sequoia Gatekeeper change](https://www.idownloadblog.com/2024/08/07/apple-macos-sequoia-gatekeeper-change-install-unsigned-apps-mac/)
- [Michael Tsai -- Sequoia Removes Gatekeeper Override](https://mjtsai.com/blog/2024/07/05/sequoia-removes-gatekeeper-contextual-menu-override/)
- [Tauri by Simon -- False Positives](https://tauri.by.simon.hyll.nu/concepts/security/false_positives/)
- [XDG Autostart -- ArchWiki](https://wiki.archlinux.org/title/XDG_Autostart)
- [DEV Community -- Ship Tauri v2 App Like a Pro (code signing)](https://dev.to/tomtomdu73/ship-your-tauri-v2-app-like-a-pro-code-signing-for-macos-and-windows-part-12-3o9n)
- [DEV Community -- Shipping Production macOS App with Tauri 2.0](https://dev.to/0xmassi/shipping-a-production-macos-app-with-tauri-20-code-signing-notarization-and-homebrew-mc3)
- [Oflight -- Tauri v2 Auto-Update and Distribution Guide](https://www.oflight.co.jp/en/columns/tauri-v2-auto-update-distribution)

#research #tauri #cross-platform #deployment #production #place-org #native-windows

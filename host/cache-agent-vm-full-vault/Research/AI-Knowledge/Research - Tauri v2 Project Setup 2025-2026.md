---
date: 2026-03-24
tags: [research, tauri, rust, desktop, native-windows, place-org]
status: active
---

# Research - Tauri v2 Project Setup (2025-2026)

> Reference for building a Tauri v2 companion app — tray-only, transparent windows, WebSocket server, autostart, updater. Companion to [[Research - Transparent Native Windows for place.org Popouts 2025-2026]].

---

## 1. Scaffolding a New Project

### Recommended: pnpm

```bash
pnpm create tauri-app
```

Interactive prompts follow (project name, bundle identifier, frontend language, UI template, flavor). For a Rust-only / tray app with no meaningful frontend, choose Vanilla + TypeScript or just skip the frontend scaffolding.

### Cargo (Rust-native)

```bash
cargo install create-tauri-app --locked
cargo create-tauri-app
```

### Manual init (add Tauri to an existing project)

```bash
cargo install tauri-cli --version "^2.0.0" --locked
cargo tauri init
```

Prompts for app name, window title, asset dir, dev server URL, and build/dev commands.

---

## 2. Minimum Rust Toolchain

**MSRV: 1.77.2**

This is declared in the Tauri workspace `Cargo.toml` and required by all official plugins. A transient dependency in tauri-cli 2.9.3 temporarily pushed this to 1.88, but was reverted in 2.9.4. Use `rustup default stable` — stable is always safe.

```bash
rustup default stable
rustup update stable
```

---

## 3. Cargo.toml Dependencies

```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-autostart = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
tokio-tungstenite = "0.26"

[target.'cfg(any(target_os = "macos", windows, target_os = "linux"))'.dependencies]
tauri-plugin-updater = "2"

[build-dependencies]
tauri-build = { version = "2", features = [] }
```

Notes:
- `tray-icon` feature is **required** on the `tauri` crate to use `TrayIconBuilder`
- `tauri-plugin-updater` is desktop-only, so it uses a target-cfg guard
- `tokio-tungstenite` 0.26 is the current release as of early 2026 — verify on crates.io before pinning
- `macos-private-api` feature on tauri is needed for transparent windows on macOS (see section 7)

---

## 4. tauri.conf.json — Tray-Only, No Default Window

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "my-app",
  "version": "0.1.0",
  "identifier": "com.example.myapp",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:1420"
  },
  "app": {
    "withGlobalTauri": false,
    "windows": [],
    "trayIcon": {
      "iconPath": "icons/icon.png",
      "iconAsTemplate": true
    },
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

Key: `"windows": []` — empty array means no window is created on startup. Windows are created programmatically from Rust.

---

## 5. tauri.conf.json — Transparent Window Definition (Static)

If you want to declare a transparent window in config (not programmatic):

```json
{
  "app": {
    "windows": [
      {
        "label": "popout",
        "title": "",
        "width": 400,
        "height": 300,
        "transparent": true,
        "decorations": false,
        "shadow": false,
        "visible": false,
        "alwaysOnTop": true,
        "resizable": true,
        "url": "http://localhost:3000/popout"
      }
    ]
  }
}
```

`"visible": false` + creating it in config means it exists but is hidden — you show it on demand.

---

## 6. tauri.conf.json — Updater Plugin

```json
{
  "bundle": {
    "createUpdaterArtifacts": true
  },
  "plugins": {
    "updater": {
      "pubkey": "PASTE_FULL_CONTENT_OF_publickey.pem_HERE",
      "endpoints": [
        "https://releases.example.com/{{target}}/{{arch}}/{{current_version}}"
      ]
    }
  }
}
```

Generate keypair:

```bash
npm run tauri signer generate -- -w ~/.tauri/myapp.key
```

`createUpdaterArtifacts: true` generates `.sig` files alongside bundles at build time. `"v1Compatible"` is for migrating from Tauri v1 updater format.

---

## 7. Rust: WebviewWindow Programmatic Creation (Transparent)

```rust
use tauri::{WebviewUrl, WebviewWindowBuilder, Manager};

fn open_popout(app: &tauri::AppHandle, url: &str) -> tauri::Result<()> {
    let win = WebviewWindowBuilder::new(app, "popout", WebviewUrl::External(url.parse().unwrap()))
        .title("")
        .inner_size(400.0, 300.0)
        .decorations(false)
        .transparent(true)
        .shadow(false)
        .always_on_top(true)
        .resizable(true)
        .visible(false)
        .build()?;

    win.show()?;
    Ok(())
}
```

Builder method signatures (from docs.rs tauri 2.x):

```rust
pub fn transparent(self, transparent: bool) -> Self
pub fn decorations(self, decorations: bool) -> Self
pub fn shadow(self, enable: bool) -> Self
pub fn initialization_script(self, script: &str) -> Self
```

**macOS requirement:** `transparent()` is only available when building for non-macOS OR with the `macos-private-api` crate feature enabled. Add to Cargo.toml:

```toml
tauri = { version = "2", features = ["tray-icon", "macos-private-api"] }
```

And to tauri.conf.json under `app`:

```json
{
  "app": {
    "macOSPrivateApi": true
  }
}
```

WARNING: `macOSPrivateApi` disqualifies the app from the Mac App Store. Also see the open bug [[Research - Transparent Native Windows for place.org Popouts 2025-2026]] — macOS transparency breaks after DMG bundling (Issue #13415, open as of November 2025).

---

## 8. withGlobalTauri — Global Only, Not Per-Window

`withGlobalTauri` is **application-level only** (not per-window). It lives under `app.withGlobalTauri` in tauri.conf.json and controls whether `window.__TAURI__` is injected globally across all webviews.

For per-window JavaScript injection, use `initialization_script` on `WebviewWindowBuilder`:

```rust
let win = WebviewWindowBuilder::new(app, "popout", WebviewUrl::External(url.parse().unwrap()))
    .initialization_script(
        r#"window.__MY_APP__ = { windowId: 'popout' };"#
    )
    .build()?;
```

This script runs after the global object is created but before the HTML is parsed — equivalent to Electron's `preload.js` but inline.

---

## 9. System Tray Setup

Cargo.toml feature required:

```toml
tauri = { version = "2", features = ["tray-icon"] }
```

Full Rust setup in `lib.rs`:

```rust
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::Builder::new()
            .app_name("My App")
            .build())
        .setup(|app| {
            // Desktop-only updater
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;

            // Build tray menu
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            // Build tray icon
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("popout") {
                            let _ = window.unminimize();
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("popout") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

v1 → v2 change: `tauri::SystemTray` + `.system_tray()` + `.on_system_tray_event()` is gone. Everything is `TrayIconBuilder` in the `.setup()` closure.

---

## 10. Autostart Plugin Registration

```rust
// Cargo.toml
tauri-plugin-autostart = "2"

// lib.rs
.plugin(tauri_plugin_autostart::Builder::new()
    .args(["--flag1"])          // optional CLI args to pass on autostart
    .app_name("My Custom Name") // optional, defaults to productName
    .build())
```

JS-side (if you need to toggle it from the frontend):

```bash
pnpm add @tauri-apps/plugin-autostart
```

```ts
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';
await enable();
```

---

## Key v1 → v2 Breaking Changes

| v1 | v2 |
|---|---|
| `tauri::SystemTray` | `tauri::tray::TrayIconBuilder` |
| `.system_tray(tray)` on Builder | `.setup()` closure + `TrayIconBuilder::build(app)` |
| `.on_system_tray_event()` | `.on_tray_icon_event()` on TrayIconBuilder |
| `tauri > macOSPrivateApi` in conf | `app > macOSPrivateApi` in conf |
| `build > withGlobalTauri` in conf | `app > withGlobalTauri` in conf |
| `tauri::Window` | `tauri::WebviewWindow` |
| `WindowBuilder` | `WebviewWindowBuilder` |
| `systemTray` key in conf | `app.trayIcon` key in conf |

---

## Sources

- [Tauri v2 Create Project](https://v2.tauri.app/start/create-project/)
- [Tauri v2 Prerequisites](https://v2.tauri.app/start/prerequisites/)
- [Tauri v2 Configuration Reference](https://v2.tauri.app/reference/config/)
- [Tauri v2 Window Customization](https://v2.tauri.app/learn/window-customization/)
- [Tauri v2 System Tray](https://v2.tauri.app/learn/system-tray/)
- [Tauri v2 Updater Plugin](https://v2.tauri.app/plugin/updater/)
- [tauri-plugin-autostart README (v2 branch)](https://github.com/tauri-apps/plugins-workspace/blob/v2/plugins/autostart/README.md)
- [WebviewWindowBuilder — docs.rs](https://docs.rs/tauri/latest/tauri/webview/struct.WebviewWindowBuilder.html)
- [withGlobalTauri deprecation issue #9248](https://github.com/tauri-apps/tauri/issues/9248)
- [tauri-cli MSRV regression issue #14433 (reverted in 2.9.4)](https://github.com/tauri-apps/tauri/issues/14433)
- [Schema: schema.tauri.app/config/2](https://schema.tauri.app/config/2)

#research #tauri #rust #desktop #place-org #native-windows

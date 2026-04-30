# place.org Companion App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Tauri v2 tray app that spawns transparent frameless webview windows for place.org popouts, communicating over a local WebSocket server.

**Architecture:** Tray-only Rust app — no bundled frontend UI. A `tokio-tungstenite` WebSocket server listens on localhost, accepts commands from the browser (open/close/move/resize/focus windows), and pushes native window events back. Each popout loads the existing `/popout/[appId]` Next.js route in a transparent webview.

**Tech Stack:** Rust, Tauri v2, tokio + tokio-tungstenite, serde_json, tauri-plugin-autostart, tauri-plugin-updater

**Spec:** `docs/superpowers/specs/2026-03-24-companion-app-design.md`

---

## File Structure

```
place-companion/                     # separate directory, sibling to place.org
  src-tauri/
    src/
      main.rs                        # app entry, tray setup, plugin registration
      ws_server.rs                   # WebSocket server on :27182-27189
      protocol.rs                    # message types, serde serialization
      window_mgr.rs                  # create/track/destroy transparent webviews
      commands.rs                    # Tauri IPC commands (reattach from webview)
      origin_check.rs                # Origin header validation
    tauri.conf.json                  # tray-only, no default window, updater
    Cargo.toml                       # tauri + plugins + tokio + tungstenite
    build.rs                         # tauri-build
    icons/                           # app icons for all platforms
      icon.png
      icon.ico
      icon.icns
      32x32.png
      128x128.png
      128x128@2x.png
  src/
    index.html                       # empty shell (required by Tauri build)
  package.json                       # minimal — just tauri CLI
  README.md                          # install instructions per platform
```

Each `.rs` file has one responsibility:
- `protocol.rs` — pure data types, no IO
- `origin_check.rs` — pure validation function, no IO
- `ws_server.rs` — owns the WebSocket listener, delegates to window_mgr
- `window_mgr.rs` — owns the HashMap of windows, calls Tauri WebviewWindowBuilder
- `commands.rs` — thin Tauri IPC layer for webview→companion communication
- `main.rs` — wires everything together

---

## Task 1: Scaffold Tauri v2 Project

**Files:**
- Create: `place-companion/` (entire directory structure)

- [ ] **Step 1: Create project directory and initialize**

```bash
mkdir -p /home/trajan/Desktop/place-companion
cd /home/trajan/Desktop/place-companion
pnpm init
```

- [ ] **Step 2: Create minimal frontend shell**

Create `src/index.html`:
```html
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body></body></html>
```

Create `package.json`:
```json
{
  "name": "place-companion",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "tauri": "tauri"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2"
  }
}
```

Run: `pnpm install`

- [ ] **Step 3: Initialize Tauri**

```bash
cd /home/trajan/Desktop/place-companion
pnpm tauri init
```

When prompted:
- App name: `place-companion`
- Window title: (leave empty)
- Frontend dev URL: `../src`
- Frontend build output: `../src`

- [ ] **Step 4: Configure tauri.conf.json**

Replace `src-tauri/tauri.conf.json` with:
```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "place-companion",
  "version": "0.1.0",
  "identifier": "org.place.companion",
  "build": {
    "frontendDist": "../src"
  },
  "app": {
    "withGlobalTauri": false,
    "macOSPrivateApi": true,
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

- [ ] **Step 5: Configure Cargo.toml**

Replace `src-tauri/Cargo.toml` with:
```toml
[package]
name = "place-companion"
version = "0.1.0"
edition = "2021"
rust-version = "1.77.2"

[dependencies]
tauri = { version = "2", features = ["tray-icon", "macos-private-api"] }
tauri-plugin-autostart = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
tokio-tungstenite = "0.26"
futures-util = "0.3"
log = "0.4"
env_logger = "0.11"

[target.'cfg(any(target_os = "macos", windows, target_os = "linux"))'.dependencies]
tauri-plugin-updater = "2"

[build-dependencies]
tauri-build = { version = "2", features = [] }
```

- [ ] **Step 6: Create build.rs**

Create `src-tauri/build.rs`:
```rust
fn main() {
    tauri_build::build()
}
```

- [ ] **Step 7: Create placeholder main.rs**

Create `src-tauri/src/main.rs`:
```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    env_logger::init();
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .run(tauri::generate_context!())
        .expect("error running place-companion");
}
```

- [ ] **Step 8: Create placeholder icon**

```bash
mkdir -p /home/trajan/Desktop/place-companion/src-tauri/icons
# Generate a simple placeholder icon (32x32 PNG)
convert -size 32x32 xc:'#2DD4A8' /home/trajan/Desktop/place-companion/src-tauri/icons/32x32.png 2>/dev/null || printf '\x89PNG\r\n\x1a\n' > /home/trajan/Desktop/place-companion/src-tauri/icons/32x32.png
cp /home/trajan/Desktop/place-companion/src-tauri/icons/32x32.png /home/trajan/Desktop/place-companion/src-tauri/icons/icon.png
cp /home/trajan/Desktop/place-companion/src-tauri/icons/32x32.png /home/trajan/Desktop/place-companion/src-tauri/icons/128x128.png
cp /home/trajan/Desktop/place-companion/src-tauri/icons/32x32.png /home/trajan/Desktop/place-companion/src-tauri/icons/128x128@2x.png
```

- [ ] **Step 9: Verify it compiles**

```bash
cd /home/trajan/Desktop/place-companion
pnpm tauri build --debug 2>&1 | tail -20
```

Expected: successful compilation (may warn about missing icons for .icns/.ico — that's fine for now)

- [ ] **Step 10: Initialize git and commit**

```bash
cd /home/trajan/Desktop/place-companion
git init
echo "target/\nnode_modules/\ndist/" > .gitignore
git add -A
git commit -m "chore: scaffold Tauri v2 companion app"
```

---

## Task 2: Protocol Types

**Files:**
- Create: `src-tauri/src/protocol.rs`

- [ ] **Step 1: Define all message types**

Create `src-tauri/src/protocol.rs`:
```rust
use serde::{Deserialize, Serialize};

// ── Version ──

pub const PROTOCOL_VERSION: &str = "1.0.0";

// ── Bounds (matches place.org WindowPosition) ──

#[derive(Debug, Clone, Serialize, Deserialize)]

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Bounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

// ── Window info (used in hello payload) ──

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowInfo {
    pub window_id: String,
    pub app_id: String,
    pub bounds: Bounds,
}

// ── Browser → Companion ──

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum ClientMessage {
    OpenWindow {
        #[serde(rename = "windowId")]
        window_id: String,
        #[serde(rename = "appId")]
        app_id: String,
        url: String,
        bounds: Bounds,
        #[serde(default)]
        transparent: bool,
    },
    CloseWindow {
        #[serde(rename = "windowId")]
        window_id: String,
    },
    MoveWindow {
        #[serde(rename = "windowId")]
        window_id: String,
        x: f64,
        y: f64,
    },
    ResizeWindow {
        #[serde(rename = "windowId")]
        window_id: String,
        width: f64,
        height: f64,
    },
    FocusWindow {
        #[serde(rename = "windowId")]
        window_id: String,
    },
    ReattachAck {
        #[serde(rename = "windowId")]
        window_id: String,
    },
    Ping,
}

// ── Companion → Browser ──

#[derive(Debug, Serialize)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum ServerMessage {
    Hello {
        version: String,
        windows: Vec<WindowInfo>,
    },
    WindowOpened {
        #[serde(rename = "windowId")]
        window_id: String,
        bounds: Bounds,
    },
    WindowClosed {
        #[serde(rename = "windowId")]
        window_id: String,
    },
    WindowMoved {
        #[serde(rename = "windowId")]
        window_id: String,
        x: f64,
        y: f64,
    },
    WindowResized {
        #[serde(rename = "windowId")]
        window_id: String,
        width: f64,
        height: f64,
    },
    WindowReattach {
        #[serde(rename = "windowId")]
        window_id: String,
        #[serde(rename = "appId")]
        app_id: String,
    },
    WindowError {
        #[serde(rename = "windowId")]
        window_id: String,
        error: String,
    },
    Pong {
        #[serde(rename = "windowCount")]
        window_count: usize,
    },
}
```

- [ ] **Step 2: Register module in main.rs**

Add to top of `main.rs`:
```rust
mod protocol;
```

- [ ] **Step 3: Verify it compiles**

```bash
cd /home/trajan/Desktop/place-companion && cargo check --manifest-path src-tauri/Cargo.toml 2>&1 | tail -5
```

Expected: compiles with no errors (warnings about unused are fine)

- [ ] **Step 4: Commit**

```bash
cd /home/trajan/Desktop/place-companion
git add -A && git commit -m "feat: add WebSocket protocol types"
```

---

## Task 3: Origin Validation

**Files:**
- Create: `src-tauri/src/origin_check.rs`

- [ ] **Step 1: Implement origin checker**

Create `src-tauri/src/origin_check.rs`:
```rust
/// Validates the Origin header from a WebSocket upgrade request.
/// Returns true if the origin is in the allowlist.
///
/// Allowlist:
///   - https://place.org
///   - https://www.place.org
///   - http://localhost:3000 through http://localhost:3009
pub fn is_allowed_origin(origin: &str) -> bool {
    let origin = origin.trim();

    if origin == "https://place.org" || origin == "https://www.place.org" {
        return true;
    }

    // http://localhost:PORT where PORT is 3000..=3009
    if let Some(rest) = origin.strip_prefix("http://localhost:") {
        if let Ok(port) = rest.parse::<u16>() {
            return (3000..=3009).contains(&port);
        }
    }

    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn allows_place_org() {
        assert!(is_allowed_origin("https://place.org"));
        assert!(is_allowed_origin("https://www.place.org"));
    }

    #[test]
    fn allows_localhost_dev_ports() {
        assert!(is_allowed_origin("http://localhost:3000"));
        assert!(is_allowed_origin("http://localhost:3009"));
    }

    #[test]
    fn rejects_other_localhost_ports() {
        assert!(!is_allowed_origin("http://localhost:8080"));
        assert!(!is_allowed_origin("http://localhost:4000"));
    }

    #[test]
    fn rejects_subdomains() {
        assert!(!is_allowed_origin("https://evil.place.org"));
        assert!(!is_allowed_origin("https://sub.place.org"));
    }

    #[test]
    fn rejects_arbitrary_origins() {
        assert!(!is_allowed_origin("https://evil.com"));
        assert!(!is_allowed_origin("file:///etc/passwd"));
        assert!(!is_allowed_origin(""));
    }
}
```

- [ ] **Step 2: Register module in main.rs**

Add to `main.rs`:
```rust
mod origin_check;
```

- [ ] **Step 3: Run tests**

```bash
cd /home/trajan/Desktop/place-companion && cargo test --manifest-path src-tauri/Cargo.toml -- origin_check 2>&1
```

Expected: all 5 tests pass

- [ ] **Step 4: Commit**

```bash
cd /home/trajan/Desktop/place-companion
git add -A && git commit -m "feat: add Origin header validation with tests"
```

---

## Task 4: Window Manager

**Files:**
- Create: `src-tauri/src/window_mgr.rs`

- [ ] **Step 1: Implement window manager**

Create `src-tauri/src/window_mgr.rs`:
```rust
use crate::protocol::{Bounds, WindowInfo};
use log::{info, warn, error};
use std::collections::HashMap;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

/// Allowed URL prefixes for webview windows.
const ALLOWED_URL_PREFIXES: &[&str] = &[
    "https://place.org/",
    "https://www.place.org/",
    "http://localhost:3000/",
    "http://localhost:3001/",
    "http://localhost:3002/",
    "http://localhost:3003/",
    "http://localhost:3004/",
    "http://localhost:3005/",
    "http://localhost:3006/",
    "http://localhost:3007/",
    "http://localhost:3008/",
    "http://localhost:3009/",
];

fn is_allowed_url(url: &str) -> bool {
    ALLOWED_URL_PREFIXES.iter().any(|prefix| url.starts_with(prefix))
}

/// Initialization script injected into every companion webview.
/// Provides a minimal IPC bridge for the reattach flow.
/// Uses __TAURI_INTERNALS__ directly since these are external URLs
/// without bundled @tauri-apps/api.
const INIT_SCRIPT: &str = r#"
window.__PLACE_COMPANION__ = true;
window.__PLACE_COMPANION_REATTACH__ = function(windowId, appId) {
    if (window.__TAURI_INTERNALS__) {
        window.__TAURI_INTERNALS__.invoke('reattach', {
            windowId: windowId,
            appId: appId,
        });
    }
};
"#;

#[derive(Debug)]
struct TrackedWindow {
    app_id: String,
    bounds: Bounds,
}

pub struct WindowManager {
    windows: HashMap<String, TrackedWindow>,
    app_handle: AppHandle,
}

impl WindowManager {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            windows: HashMap::new(),
            app_handle,
        }
    }

    /// Returns info about all currently tracked windows.
    pub fn list_windows(&self) -> Vec<WindowInfo> {
        self.windows
            .iter()
            .map(|(id, w)| WindowInfo {
                window_id: id.clone(),
                app_id: w.app_id.clone(),
                bounds: w.bounds.clone(),
            })
            .collect()
    }

    pub fn window_count(&self) -> usize {
        self.windows.len()
    }

    /// Open a new transparent webview window. Idempotent: if the window_id
    /// already exists, focuses it instead.
    pub fn open_window(
        &mut self,
        window_id: &str,
        app_id: &str,
        url: &str,
        bounds: &Bounds,
        transparent: bool,
    ) -> Result<Bounds, String> {
        // URL validation
        if !is_allowed_url(url) {
            return Err(format!("URL not in allowlist: {url}"));
        }

        // Idempotent: already exists → focus
        if self.windows.contains_key(window_id) {
            info!("Window {window_id} already exists, focusing");
            if let Some(w) = self.app_handle.get_webview_window(&tauri_label(window_id)) {
                let _ = w.set_focus();
            }
            return Ok(bounds.clone());
        }

        let label = tauri_label(window_id);
        let parsed_url: url::Url = url
            .parse()
            .map_err(|e| format!("Invalid URL: {e}"))?;

        // Detect if we can do transparency (Linux X11 without compositor → fallback)
        let use_transparency = transparent && can_use_transparency();

        let builder = WebviewWindowBuilder::new(
            &self.app_handle,
            &label,
            WebviewUrl::External(parsed_url),
        )
        .title("")
        .inner_size(bounds.width, bounds.height)
        .position(bounds.x, bounds.y)
        .decorations(false)
        .transparent(use_transparency)
        .shadow(false)
        .resizable(true)
        .initialization_script(INIT_SCRIPT);

        let win = builder.build().map_err(|e| format!("Failed to create window: {e}"))?;

        // Ensure visible
        let _ = win.show();

        let actual_bounds = bounds.clone();
        self.windows.insert(
            window_id.to_string(),
            TrackedWindow {
                app_id: app_id.to_string(),
                bounds: actual_bounds.clone(),
            },
        );

        info!("Opened window {window_id} (app: {app_id}, transparent: {use_transparency})");
        Ok(actual_bounds)
    }

    /// Close and remove a window. No-op if not found.
    pub fn close_window(&mut self, window_id: &str) {
        if self.windows.remove(window_id).is_some() {
            if let Some(w) = self.app_handle.get_webview_window(&tauri_label(window_id)) {
                let _ = w.destroy();
            }
            info!("Closed window {window_id}");
        }
    }

    /// Close all tracked windows.
    pub fn close_all(&mut self) {
        let ids: Vec<String> = self.windows.keys().cloned().collect();
        for id in ids {
            self.close_window(&id);
        }
    }

    pub fn move_window(&mut self, window_id: &str, x: f64, y: f64) {
        if let Some(tracked) = self.windows.get_mut(window_id) {
            tracked.bounds.x = x;
            tracked.bounds.y = y;
            if let Some(w) = self.app_handle.get_webview_window(&tauri_label(window_id)) {
                let _ = w.set_position(tauri::Position::Logical(tauri::LogicalPosition::new(x, y)));
            }
        }
    }

    pub fn resize_window(&mut self, window_id: &str, width: f64, height: f64) {
        if let Some(tracked) = self.windows.get_mut(window_id) {
            tracked.bounds.width = width;
            tracked.bounds.height = height;
            if let Some(w) = self.app_handle.get_webview_window(&tauri_label(window_id)) {
                let _ = w.set_size(tauri::Size::Logical(tauri::LogicalSize::new(width, height)));
            }
        }
    }

    pub fn focus_window(&mut self, window_id: &str) {
        if let Some(w) = self.app_handle.get_webview_window(&tauri_label(window_id)) {
            let _ = w.set_focus();
        }
    }

    /// Remove a window from tracking (called when Tauri reports window destroyed).
    pub fn on_window_destroyed(&mut self, label: &str) -> Option<(String, String)> {
        let window_id = label.strip_prefix("place_")?;
        let tracked = self.windows.remove(window_id)?;
        Some((window_id.to_string(), tracked.app_id))
    }
}

/// Convert a place.org windowId to a Tauri window label.
/// Tauri labels must be alphanumeric + underscores.
fn tauri_label(window_id: &str) -> String {
    format!("place_{}", window_id.replace('-', "_"))
}

/// Detect whether the current platform supports transparent windows.
fn can_use_transparency() -> bool {
    #[cfg(target_os = "linux")]
    {
        // Check for a compositor on X11
        if std::env::var("XDG_SESSION_TYPE").ok().as_deref() == Some("x11") {
            // If DISPLAY is set but no compositor hint, be conservative
            if std::env::var("WAYLAND_DISPLAY").is_err() {
                // Check for common compositor indicators
                let has_compositor = std::process::Command::new("xprop")
                    .args(["-root", "_NET_WM_CM_S0"])
                    .output()
                    .map(|o| !o.stdout.is_empty() && o.status.success())
                    .unwrap_or(false);
                if !has_compositor {
                    warn!("X11 without compositor detected — transparency disabled");
                    return false;
                }
            }
        }
        true
    }
    #[cfg(not(target_os = "linux"))]
    {
        true
    }
}
```

- [ ] **Step 2: Add url crate dependency**

Add to `src-tauri/Cargo.toml` under `[dependencies]`:
```toml
url = "2"
```

- [ ] **Step 3: Register module in main.rs**

Add to `main.rs`:
```rust
mod window_mgr;
```

- [ ] **Step 4: Verify it compiles**

```bash
cd /home/trajan/Desktop/place-companion && cargo check --manifest-path src-tauri/Cargo.toml 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
cd /home/trajan/Desktop/place-companion
git add -A && git commit -m "feat: add window manager with URL validation and transparency detection"
```

---

## Task 5: WebSocket Server

**Files:**
- Create: `src-tauri/src/ws_server.rs`

- [ ] **Step 1: Implement WebSocket server**

Create `src-tauri/src/ws_server.rs`:
```rust
use crate::origin_check::is_allowed_origin;
use crate::protocol::{ClientMessage, PROTOCOL_VERSION, ServerMessage};
use crate::window_mgr::WindowManager;
use futures_util::{SinkExt, StreamExt};
use log::{error, info, warn};
use std::sync::Arc;
use tokio::net::TcpListener;
use tokio::sync::Mutex;
use tokio_tungstenite::tungstenite::handshake::server::{Request, Response};
use tokio_tungstenite::tungstenite::Message;

/// Port range the companion tries to bind to.
const PORT_RANGE: std::ops::RangeInclusive<u16> = 27182..=27189;

pub type SharedWindowManager = Arc<Mutex<WindowManager>>;

/// Bind to the first available port in the range.
async fn bind_listener() -> Result<(TcpListener, u16), String> {
    for port in PORT_RANGE {
        match TcpListener::bind(format!("127.0.0.1:{port}")).await {
            Ok(listener) => {
                info!("WebSocket server bound to port {port}");
                return Ok((listener, port));
            }
            Err(e) => {
                warn!("Port {port} unavailable: {e}");
            }
        }
    }
    Err("All ports 27182-27189 are in use".into())
}

/// Start the WebSocket server. Runs until the app exits.
/// Takes a broadcast receiver for reattach events from Tauri IPC commands.
pub async fn run_server(
    wm: SharedWindowManager,
    reattach_tx: crate::commands::ReattachSender,
) -> Result<u16, String> {
    let (listener, port) = bind_listener().await?;

    tokio::spawn(async move {
        while let Ok((stream, addr)) = listener.accept().await {
            info!("New connection from {addr}");
            let wm = wm.clone();
            let reattach_rx = reattach_tx.subscribe();
            tokio::spawn(handle_connection(stream, wm, reattach_rx));
        }
    });

    Ok(port)
}

async fn handle_connection(
    stream: tokio::net::TcpStream,
    wm: SharedWindowManager,
    mut reattach_rx: tokio::sync::broadcast::Receiver<crate::commands::ReattachEvent>,
) {
    // Origin check during WebSocket upgrade.
    // Use Cell because accept_hdr_async takes Fn (not FnMut).
    let allowed = std::cell::Cell::new(false);
    let callback = |req: &Request, resp: Response| -> Result<Response, _> {
        if let Some(origin) = req.headers().get("origin") {
            if let Ok(origin_str) = origin.to_str() {
                if is_allowed_origin(origin_str) {
                    allowed.set(true);
                }
            }
        }
        // Allow connections with no Origin (e.g., from Tauri webviews themselves)
        if req.headers().get("origin").is_none() {
            allowed.set(true);
        }
        Ok(resp)
    };

    let ws_stream = match tokio_tungstenite::accept_hdr_async(stream, callback).await {
        Ok(ws) => ws,
        Err(e) => {
            error!("WebSocket handshake failed: {e}");
            return;
        }
    };

    if !allowed.get() {
        warn!("Rejected connection: origin not in allowlist");
        return;
    }

    let (mut tx, mut rx) = ws_stream.split();

    // Send hello
    {
        let mgr = wm.lock().await;
        let hello = ServerMessage::Hello {
            version: PROTOCOL_VERSION.to_string(),
            windows: mgr.list_windows(),
        };
        if let Ok(json) = serde_json::to_string(&hello) {
            let _ = tx.send(Message::Text(json.into())).await;
        }
    }

    // Message loop with keepalive timeout and reattach event forwarding.
    // Uses tokio::select! to listen for both WS messages and reattach events
    // from the Tauri IPC command channel.
    let timeout_duration = tokio::time::Duration::from_secs(45);
    loop {
        tokio::select! {
            // Branch 1: WebSocket message from browser
            msg = tokio::time::timeout(timeout_duration, rx.next()) => {
                let msg = match msg {
                    Ok(Some(msg)) => msg,
                    Ok(None) => break,
                    Err(_) => {
                        warn!("Client timed out (no ping for 45s)");
                        break;
                    }
                };

                let text = match msg {
                    Ok(Message::Text(t)) => t.to_string(),
                    Ok(Message::Close(_)) => break,
                    Ok(Message::Ping(d)) => {
                        let _ = tx.send(Message::Pong(d)).await;
                        continue;
                    }
                    Ok(_) => continue,
                    Err(e) => {
                        error!("WebSocket error: {e}");
                        break;
                    }
                };

                let client_msg: ClientMessage = match serde_json::from_str(&text) {
                    Ok(m) => m,
                    Err(e) => {
                        warn!("Invalid message: {e}");
                        continue;
                    }
                };

                let response = process_message(client_msg, &wm).await;
                if let Some(resp) = response {
                    if let Ok(json) = serde_json::to_string(&resp) {
                        let _ = tx.send(Message::Text(json.into())).await;
                    }
                }
            }

            // Branch 2: Reattach event from Tauri IPC (webview clicked "Return to desktop")
            event = reattach_rx.recv() => {
                if let Ok(event) = event {
                    let msg = ServerMessage::WindowReattach {
                        window_id: event.window_id.clone(),
                        app_id: event.app_id,
                    };
                    if let Ok(json) = serde_json::to_string(&msg) {
                        let _ = tx.send(Message::Text(json.into())).await;
                    }
                    // The browser will send reattach-ack, which process_message
                    // handles by calling wm.close_window(). If no ack arrives,
                    // the 45s keepalive timeout will eventually clean up.
                    // For the 3s fast-close: spawn a timeout task.
                    let wm_timeout = wm.clone();
                    let wid = event.window_id;
                    tokio::spawn(async move {
                        tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
                        // If window still exists after 3s (no ack received), close it
                        let mut mgr = wm_timeout.lock().await;
                        mgr.close_window(&wid);
                    });
                }
            }
        }
    }

    info!("Connection closed");
}

async fn process_message(
    msg: ClientMessage,
    wm: &SharedWindowManager,
) -> Option<ServerMessage> {
    match msg {
        ClientMessage::OpenWindow {
            window_id,
            app_id,
            url,
            bounds,
            transparent,
        } => {
            let mut mgr = wm.lock().await;
            match mgr.open_window(&window_id, &app_id, &url, &bounds, transparent) {
                Ok(actual_bounds) => Some(ServerMessage::WindowOpened {
                    window_id,
                    bounds: actual_bounds,
                }),
                Err(error) => Some(ServerMessage::WindowError { window_id, error }),
            }
        }
        ClientMessage::CloseWindow { window_id } => {
            let mut mgr = wm.lock().await;
            mgr.close_window(&window_id);
            None
        }
        ClientMessage::MoveWindow { window_id, x, y } => {
            let mut mgr = wm.lock().await;
            mgr.move_window(&window_id, x, y);
            None
        }
        ClientMessage::ResizeWindow {
            window_id,
            width,
            height,
        } => {
            let mut mgr = wm.lock().await;
            mgr.resize_window(&window_id, width, height);
            None
        }
        ClientMessage::FocusWindow { window_id } => {
            let mut mgr = wm.lock().await;
            mgr.focus_window(&window_id);
            None
        }
        ClientMessage::ReattachAck { window_id } => {
            let mut mgr = wm.lock().await;
            mgr.close_window(&window_id);
            None
        }
        ClientMessage::Ping => {
            let mgr = wm.lock().await;
            Some(ServerMessage::Pong {
                window_count: mgr.window_count(),
            })
        }
    }
}
```

- [ ] **Step 2: Register module in main.rs**

Add to `main.rs`:
```rust
mod ws_server;
```

- [ ] **Step 3: Verify it compiles**

```bash
cd /home/trajan/Desktop/place-companion && cargo check --manifest-path src-tauri/Cargo.toml 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
cd /home/trajan/Desktop/place-companion
git add -A && git commit -m "feat: add WebSocket server with origin checking and message routing"
```

---

## Task 6: Tauri IPC Commands

**Files:**
- Create: `src-tauri/src/commands.rs`

- [ ] **Step 1: Implement reattach command**

Create `src-tauri/src/commands.rs`:
```rust
use serde::Deserialize;
use tauri::{command, State};
use tokio::sync::broadcast;

/// Channel for reattach events from webview IPC → WebSocket server.
pub type ReattachSender = broadcast::Sender<ReattachEvent>;

#[derive(Debug, Clone)]
pub struct ReattachEvent {
    pub window_id: String,
    pub app_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReattachArgs {
    pub window_id: String,
    pub app_id: String,
}

/// Called from the webview (PopoutTitleBar) when user clicks "Return to desktop".
/// Sends the event over a broadcast channel. The WS server picks it up,
/// forwards to the browser, and waits for reattach-ack (or 3s timeout)
/// before closing the window.
#[command]
pub async fn reattach(
    args: ReattachArgs,
    sender: State<'_, ReattachSender>,
) -> Result<(), String> {
    log::info!(
        "Reattach requested: windowId={}, appId={}",
        args.window_id,
        args.app_id
    );
    let _ = sender.send(ReattachEvent {
        window_id: args.window_id,
        app_id: args.app_id,
    });
    Ok(())
}
```

- [ ] **Step 2: Register module in main.rs**

Add to `main.rs`:
```rust
mod commands;
```

- [ ] **Step 3: Commit**

```bash
cd /home/trajan/Desktop/place-companion
git add -A && git commit -m "feat: add Tauri IPC reattach command"
```

---

## Task 7: Wire Everything Together in main.rs

**Files:**
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: Integrate all modules**

Replace `src-tauri/src/main.rs` with:
```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod origin_check;
mod protocol;
mod window_mgr;
mod ws_server;

use log::info;
use std::sync::Arc;
use tauri::{
    menu::{Menu, MenuItemBuilder, PredefinedMenuItem},
    tray::TrayIconBuilder,
    Manager,
};
use tokio::sync::Mutex;
use window_mgr::WindowManager;

fn main() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .invoke_handler(tauri::generate_handler![commands::reattach])
        .setup(|app| {
            // Create window manager
            let wm = Arc::new(Mutex::new(WindowManager::new(app.handle().clone())));

            // Create reattach broadcast channel (IPC commands → WS server)
            let (reattach_tx, _) = tokio::sync::broadcast::channel::<commands::ReattachEvent>(16);
            app.manage(reattach_tx.clone());  // for commands::reattach State access
            app.manage(ws_server::SharedWindowManager::clone(&wm));

            // Start WebSocket server
            let wm_clone = wm.clone();
            let app_handle = app.handle().clone();
            let reattach_tx_clone = reattach_tx.clone();
            tauri::async_runtime::spawn(async move {
                match ws_server::run_server(wm_clone, reattach_tx_clone).await {
                    Ok(port) => {
                        info!("Companion ready on port {port}");
                        // Update tray tooltip with port
                        if let Some(tray) = app_handle.tray_by_id("main-tray") {
                            let _ = tray.set_tooltip(Some(
                                &format!("place.org Companion — port {port}"),
                            ));
                        }
                    }
                    Err(e) => {
                        log::error!("Failed to start WebSocket server: {e}");
                    }
                }
            });

            // System tray
            let open = MenuItemBuilder::with_id("open", "Open place.org").build(app)?;
            let close_all = MenuItemBuilder::with_id("close-all", "Close All Windows").build(app)?;
            let separator1 = PredefinedMenuItem::separator(app)?;
            let autostart = MenuItemBuilder::with_id("autostart", "Start at Login").build(app)?;
            let separator2 = PredefinedMenuItem::separator(app)?;
            let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

            let menu = Menu::with_items(
                app,
                &[&open, &close_all, &separator1, &autostart, &separator2, &quit],
            )?;

            let _tray = TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("place.org Companion")
                .menu(&menu)
                .menu_on_left_click(false)
                .on_menu_event({
                    let wm = wm.clone();
                    move |app, event| match event.id().as_ref() {
                        "quit" => app.exit(0),
                        "open" => {
                            let _ = open::that("https://place.org");
                        }
                        "close-all" => {
                            let wm = wm.clone();
                            tauri::async_runtime::spawn(async move {
                                let mut mgr = wm.lock().await;
                                mgr.close_all();
                            });
                        }
                        "autostart" => {
                            // Toggle autostart via the plugin
                            tauri::async_runtime::spawn(async {
                                // Note: actual toggle requires the frontend JS API
                                // or a custom command. For now, log intent.
                                log::info!("Autostart toggle requested");
                            });
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            info!("place-companion started");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error running place-companion");
}
```

- [ ] **Step 2: Add open crate dependency**

Add to `src-tauri/Cargo.toml` under `[dependencies]`:
```toml
open = "5"
```

- [ ] **Step 3: Verify it compiles**

```bash
cd /home/trajan/Desktop/place-companion && cargo check --manifest-path src-tauri/Cargo.toml 2>&1 | tail -10
```

Expected: compiles (may have unused warnings — that's OK)

- [ ] **Step 4: Test run in dev mode**

```bash
cd /home/trajan/Desktop/place-companion && pnpm tauri dev 2>&1 &
sleep 5
# Test the WebSocket server is up
echo '{}' | websocat ws://localhost:27182 2>/dev/null && echo "WS SERVER UP" || echo "WS NOT REACHABLE (may need websocat installed)"
kill %1 2>/dev/null
```

- [ ] **Step 5: Commit**

```bash
cd /home/trajan/Desktop/place-companion
git add -A && git commit -m "feat: wire tray, WebSocket server, and window manager together"
```

---

## Task 8: README and Documentation

**Files:**
- Create: `place-companion/README.md`

- [ ] **Step 1: Write README**

Create `README.md`:
```markdown
# place.org Companion

A lightweight desktop companion for [place.org](https://place.org) that enables virtual desktop apps to pop out as truly transparent, frameless native windows on your real desktop.

## How It Works

1. The companion runs as a system tray icon
2. It listens for commands from place.org via a local WebSocket server
3. When you drag a virtual window outside the browser, the companion spawns a transparent native window
4. The window loads the same app content — but without browser chrome, URL bars, or opaque backgrounds

## Requirements

- **Windows 10/11**, **macOS 12+**, or **Linux** (X11 with compositor, or Wayland)
- Any modern browser (Chrome, Firefox, Safari, Edge)
- place.org running in the browser

## Install

### Windows

1. Download `place-companion_x.x.x_x64-setup.exe` from [Releases](https://github.com/trajan/place-companion/releases)
2. Run the installer
3. Windows SmartScreen may warn about an unsigned app — click "More info" → "Run anyway"
4. The companion starts automatically and appears in your system tray
5. **Firewall:** Windows may ask to allow network access — this is the local WebSocket server (localhost only, no internet access)

### macOS

1. Download `place-companion_x.x.x_aarch64.dmg` from [Releases](https://github.com/trajan/place-companion/releases)
2. Open the DMG and drag to Applications
3. On first launch, macOS Gatekeeper may block it — right-click the app → "Open" → "Open" again
4. The companion appears in your menu bar
5. **Note:** macOS transparency in release builds has a known upstream issue. The app will use a dark opaque background as fallback.

### Linux

1. Download `place-companion_x.x.x_amd64.AppImage` from [Releases](https://github.com/trajan/place-companion/releases)
2. Make it executable: `chmod +x place-companion_*.AppImage`
3. Run it: `./place-companion_*.AppImage`
4. The companion appears in your system tray
5. **X11 without compositor:** Transparency requires a compositor (picom, compiz, etc.). Without one, windows use a dark opaque background.

## Development

### Prerequisites

- Rust 1.77.2+ (`rustup default stable`)
- Node.js 18+ with pnpm
- Platform-specific deps: see [Tauri v2 Prerequisites](https://v2.tauri.app/start/prerequisites/)

### Build

```bash
pnpm install
pnpm tauri dev      # development mode
pnpm tauri build    # production build
```

### Architecture

```
src-tauri/src/
  main.rs           # app entry, tray, plugin registration
  ws_server.rs      # WebSocket server on localhost:27182-27189
  protocol.rs       # message types (serde)
  window_mgr.rs     # transparent webview window lifecycle
  commands.rs       # Tauri IPC (reattach from webview)
  origin_check.rs   # WebSocket origin validation
```

### WebSocket Protocol

The companion listens on the first available port in 27182–27189. Browser discovers it by trying each port.

See `docs/superpowers/specs/2026-03-24-companion-app-design.md` in the place.org repo for the full protocol spec.

## License

MIT
```

- [ ] **Step 2: Commit**

```bash
cd /home/trajan/Desktop/place-companion
git add -A && git commit -m "docs: add README with install instructions per platform"
```

---

## Task 9: Integration Smoke Test

- [ ] **Step 1: Start companion in dev mode**

```bash
cd /home/trajan/Desktop/place-companion && pnpm tauri dev &
```

- [ ] **Step 2: Test WebSocket connection manually**

Using any WebSocket client (websocat, wscat, or browser console):
```bash
# Install websocat if needed: cargo install websocat
echo '{"type":"ping"}' | websocat ws://localhost:27182
```

Expected: receive `{"type":"hello","version":"1.0.0","windows":[]}` followed by `{"type":"pong","windowCount":0}`

- [ ] **Step 3: Test open-window command**

```bash
echo '{"type":"open-window","windowId":"test-1","appId":"focus","url":"http://localhost:3000/popout/focus?windowId=test-1&companion=true","bounds":{"x":200,"y":200,"width":400,"height":300},"transparent":true}' | websocat ws://localhost:27182
```

Expected: a transparent window appears showing the Focus app (if place.org dev server is running on :3000) or a load error (if not — that's fine, the window itself appearing proves the system works)

- [ ] **Step 4: Test URL validation rejects bad URLs**

```bash
echo '{"type":"open-window","windowId":"evil","appId":"hack","url":"file:///etc/passwd","bounds":{"x":0,"y":0,"width":400,"height":300},"transparent":true}' | websocat ws://localhost:27182
```

Expected: receive `{"type":"window-error","windowId":"evil","error":"URL not in allowlist: file:///etc/passwd"}`

- [ ] **Step 5: Kill dev server and commit test results**

```bash
kill %1 2>/dev/null
cd /home/trajan/Desktop/place-companion
git add -A && git commit -m "test: verify WebSocket server, window creation, and URL validation"
```

---

## Summary

After completing all 9 tasks, you have:
- A working Tauri v2 tray-only companion app in `/home/trajan/Desktop/place-companion/`
- WebSocket server on localhost:27182-27189 with origin checking
- Transparent frameless webview window creation with URL validation
- System tray with Open/Close All/Quit menu
- Autostart plugin registered
- Linux X11 compositor detection for transparency fallback
- Full README with install instructions for all three platforms
- All protocol types matching the spec

**Next:** Implement the browser-side integration (companion-bridge.ts, use-companion-bridge.ts, and modifications to popout-launcher.ts/PopoutShell.tsx/PopoutTitleBar.tsx) in the place.org codebase. That is a separate plan.

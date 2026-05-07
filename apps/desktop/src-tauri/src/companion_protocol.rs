// SOURCE: ema-atlas codebase-place-companion 27d72250c8653002d3729ff5040440d40e7835c7 code/place-companion/src-tauri/src/protocol.rs
//
// EMA absorbs the place-companion bridge directly into the Tauri shell.
// The browser (`localhost:5173`) and other EMA surfaces talk to this server
// over WebSocket; the same WindowManager backs both the WS path and the
// in-process Tauri command path used when the surface IS this Tauri webview.
//
// Wire format unchanged so existing `apps/web/src/lib/companion-bridge.ts`
// keeps working without protocol changes. Origin allowlist extended for the
// EMA dev port (5173) and the bundled `tauri://localhost` origin.

use serde::{Deserialize, Serialize};

// ── Version ──

pub const PROTOCOL_VERSION: &str = "1.0.0";

// ── Bounds (matches WindowPosition shape used by web surfaces) ──

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

// ── Browser → Companion (kebab-case `type` discriminator) ──

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
#[allow(dead_code)] // Variants used once native window events are fully wired
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

// Native alpha for the Tauri-hosted Next shell.
//
// Tauri's `transparent` window flag is necessary, but the old
// place-companion donor showed that macOS builds can still keep the
// underlying NSWindow opaque. Force the AppKit window clear after Tauri
// creates it so React/CSS alpha is actually visible.

use tauri::Manager;

pub fn apply(app: &mut tauri::App) {
    if let Some(window) = app.get_webview_window("main") {
        #[cfg(target_os = "macos")]
        force_macos_window_clear(&window);
    }
}

#[cfg(target_os = "macos")]
fn force_macos_window_clear(window: &tauri::WebviewWindow) {
    if let Ok(ns_window_ptr) = window.ns_window() {
        unsafe {
            use objc2::msg_send;
            use objc2::runtime::AnyObject;

            let ns_window = ns_window_ptr as *mut AnyObject;
            let _: () = msg_send![ns_window, setOpaque: false];
            let clear_color: *mut AnyObject = msg_send![objc2::class!(NSColor), clearColor];
            let _: () = msg_send![ns_window, setBackgroundColor: clear_color];
        }
    }
}

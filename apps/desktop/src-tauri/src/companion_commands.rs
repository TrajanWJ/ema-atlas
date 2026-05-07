// SOURCE: ema-atlas codebase-place-companion 27d72250c8653002d3729ff5040440d40e7835c7 code/place-companion/src-tauri/src/commands.rs
//
// Tauri IPC commands invoked from the EMA web layer when it runs INSIDE this
// Tauri shell. The donor only exposed `reattach` (everything else came in
// over WebSocket from the browser running place.org). EMA additionally
// exposes open/close/focus so the Tauri webview can use the SAME WindowManager
// without crossing the WebSocket loop — `apps/web/src/lib/companion-bridge.ts`
// detects Tauri runtime and short-circuits to these commands.

use crate::companion_protocol::Bounds;
use crate::ws_server::SharedWindowManager;
use tauri::State;
use tokio::sync::broadcast;

/// Channel for reattach events fired from a popout webview → WS server.
/// Browsers connected to the WS server need to know the user clicked "Return
/// to desktop" so they can re-mount the popout in the virtual desktop. Tauri
/// surfaces handle reattach in-process, but we fire on this channel anyway
/// so the WS path is fully symmetric.
pub type ReattachSender = broadcast::Sender<ReattachEvent>;

#[derive(Debug, Clone)]
pub struct ReattachEvent {
    pub window_id: String,
    pub app_id: String,
}

#[tauri::command]
pub async fn companion_reattach(
    window_id: String,
    app_id: String,
    sender: State<'_, ReattachSender>,
    wm: State<'_, SharedWindowManager>,
) -> Result<(), String> {
    log::info!("companion_reattach: windowId={window_id}, appId={app_id}");
    let _ = sender.send(ReattachEvent {
        window_id: window_id.clone(),
        app_id,
    });
    // Close the native window — the surface that fired this is reattaching back
    // into its parent desktop view.
    let mut mgr = wm.lock().await;
    mgr.close_window(&window_id);
    Ok(())
}

#[tauri::command]
pub async fn companion_open_window(
    window_id: String,
    app_id: String,
    url: String,
    bounds: Bounds,
    transparent: Option<bool>,
    wm: State<'_, SharedWindowManager>,
) -> Result<Bounds, String> {
    let mut mgr = wm.lock().await;
    mgr.open_window(
        &window_id,
        &app_id,
        &url,
        &bounds,
        transparent.unwrap_or(true),
    )
}

#[tauri::command]
pub async fn companion_close_window(
    window_id: String,
    wm: State<'_, SharedWindowManager>,
) -> Result<(), String> {
    let mut mgr = wm.lock().await;
    mgr.close_window(&window_id);
    Ok(())
}

#[tauri::command]
pub async fn companion_focus_window(
    window_id: String,
    wm: State<'_, SharedWindowManager>,
) -> Result<(), String> {
    let mut mgr = wm.lock().await;
    mgr.focus_window(&window_id);
    Ok(())
}

#[tauri::command]
pub async fn companion_window_count(
    wm: State<'_, SharedWindowManager>,
) -> Result<usize, String> {
    let mgr = wm.lock().await;
    Ok(mgr.window_count())
}

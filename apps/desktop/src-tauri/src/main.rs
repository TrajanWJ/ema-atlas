// EMA desktop shell — Tauri v2.
//
// Intentionally tiny. All of EMA's behavior lives in:
//   - apps/daemon (Gleam/BEAM, runs as a user-level system service)
//   - apps/web    (the shared UI, loaded into this window)
//
// This binary's only jobs are:
//   (1) open the window
//   (2) load apps/web
//   (3) (later) surface a "daemon service not installed — install?"
//       dialog on first launch.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod companion_bridge;
mod companion_commands;
mod companion_protocol;
mod native_transparency;
mod origin_check;
mod window_mgr;
mod ws_server;

use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;
use window_mgr::WindowManager;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            companion_bridge::companion_capabilities,
            companion_commands::companion_reattach,
            companion_commands::companion_open_window,
            companion_commands::companion_close_window,
            companion_commands::companion_focus_window,
            companion_commands::companion_window_count
        ])
        .setup(|app| {
            native_transparency::apply(app);

            let wm = Arc::new(Mutex::new(WindowManager::new(app.handle().clone())));
            let (reattach_tx, _) =
                tokio::sync::broadcast::channel::<companion_commands::ReattachEvent>(16);

            app.manage(reattach_tx.clone());
            app.manage(ws_server::SharedWindowManager::clone(&wm));

            let wm_clone = wm.clone();
            let reattach_tx_clone = reattach_tx.clone();
            tauri::async_runtime::spawn(async move {
                match ws_server::run_server(wm_clone, reattach_tx_clone).await {
                    Ok(port) => {
                        log::info!("EMA companion popout server ready on port {port}");
                    }
                    Err(error) => {
                        log::error!("EMA companion popout server failed: {error}");
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running EMA desktop");
}

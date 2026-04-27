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
mod native_transparency;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            companion_bridge::companion_capabilities
        ])
        .setup(|app| {
            native_transparency::apply(app);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running EMA desktop");
}

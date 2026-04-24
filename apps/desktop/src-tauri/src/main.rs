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

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running EMA desktop");
}

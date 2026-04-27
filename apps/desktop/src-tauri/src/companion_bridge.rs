use serde::Serialize;

#[derive(Serialize)]
pub struct CompanionCapabilities {
    pub available: bool,
    pub native_drag_out_windows: bool,
    pub transparent_windows: bool,
    pub package: &'static str,
    pub intent: &'static str,
}

// Canon note:
// place.org split native drag-out behavior into a companion repo. EMA keeps the
// bridge in apps/desktop/src-tauri so native window work ships with the Tauri
// shell. It is a machine capability, separate from browser org access.
#[tauri::command]
pub fn companion_capabilities() -> CompanionCapabilities {
    CompanionCapabilities {
        available: true,
        native_drag_out_windows: false,
        transparent_windows: true,
        package: "apps/desktop/src-tauri",
        intent: "Tauri-owned transparent shell; future native pop-out vApp windows use the same alpha contract.",
    }
}

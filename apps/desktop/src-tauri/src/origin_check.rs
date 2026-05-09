// SOURCE: ema-atlas codebase-place-companion 27d72250c8653002d3729ff5040440d40e7835c7 code/place-companion/src-tauri/src/origin_check.rs
//
// EMA tweaks vs donor:
//   - Donor allowlisted `https://place.org` + `https://www.place.org` only;
//     EMA replaces these with the EMA dev origin (`http://localhost:5173`)
//     plus the Tauri custom-protocol origin (`tauri://localhost`) used by
//     the bundled webview.
//   - Donor allowed dev ports 3000..=3009; we keep that range so vApps that
//     ran under the place.org dev server can still connect during the
//     transition.

/// Validates the Origin header from a WebSocket upgrade request.
/// Returns true if the origin is in the allowlist.
///
/// Allowlist:
///   - http://localhost:5173 (EMA web dev server)
///   - http://localhost:PORT for PORT in 3000..=3009 (legacy place dev range)
///   - tauri://localhost / http(s)://tauri.localhost (Tauri bundled origin)
pub fn is_allowed_origin(origin: &str) -> bool {
    let origin = origin.trim();

    if origin == "http://localhost:5173" {
        return true;
    }

    if origin == "tauri://localhost"
        || origin == "http://tauri.localhost"
        || origin == "https://tauri.localhost"
    {
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
    fn allows_ema_dev_origin() {
        assert!(is_allowed_origin("http://localhost:5173"));
    }

    #[test]
    fn allows_tauri_localhost() {
        assert!(is_allowed_origin("tauri://localhost"));
        assert!(is_allowed_origin("http://tauri.localhost"));
        assert!(is_allowed_origin("https://tauri.localhost"));
    }

    #[test]
    fn allows_legacy_dev_ports() {
        assert!(is_allowed_origin("http://localhost:3000"));
        assert!(is_allowed_origin("http://localhost:3009"));
    }

    #[test]
    fn rejects_other_localhost_ports() {
        assert!(!is_allowed_origin("http://localhost:8080"));
        assert!(!is_allowed_origin("http://localhost:4000"));
    }

    #[test]
    fn rejects_arbitrary_origins() {
        assert!(!is_allowed_origin("https://evil.com"));
        assert!(!is_allowed_origin("file:///etc/passwd"));
        assert!(!is_allowed_origin(""));
    }
}

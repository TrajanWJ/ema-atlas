# place.org Companion App — Design Spec

**Date:** 2026-03-24
**Status:** Draft
**Goal:** Enable place.org virtual desktop apps to pop out as truly transparent, frameless native windows on the user's real desktop, across all browsers and platforms.

---

## 1. Problem

The current popout system uses `window.open()` to detach virtual windows from the place.org desktop into separate browser windows. This works but produces windows with URL bars, browser chrome, and opaque backgrounds — they look like web pages, not native apps.

True window transparency (seeing the desktop wallpaper through glass-morphism) is impossible from any browser or browser extension. This is an OS-level security boundary enforced by all browsers.

## 2. Solution

A lightweight **Tauri v2 companion app** (~5–15 MB) that runs as a system tray daemon, exposes a local WebSocket server, and spawns transparent frameless webview windows on demand. The browser communicates with it over WebSocket. When the companion isn't running, everything falls back to the existing `window.open()` behavior — zero regression.

## 3. Architecture

```
┌─────────────────────────────────────────────┐
│  Browser (any: Chrome, Firefox, Safari, Edge)│
│  ┌───────────────────┐ ┌──────────────────┐ │
│  │  place.org Web App │ │ CompanionBridge  │ │
│  │  Next.js • Desktop │ │ WS client        │ │
│  │  Window Manager    │ │ auto-detect      │ │
│  └───────────────────┘ └──────┬───────────┘ │
└───────────────────────────────┼─────────────┘
                                │ ws://localhost:27182
┌───────────────────────────────┼─────────────┐
│  Tauri v2 Companion (system tray)            │
│  ┌──────────────┐ ┌──────────┐ ┌──────────┐ │
│  │ WS Server    │ │ Window   │ │ System   │ │
│  │ tokio-       │ │ Manager  │ │ Tray     │ │
│  │ tungstenite  │ │ webviews │ │ + menu   │ │
│  └──────────────┘ └──────────┘ └──────────┘ │
└──────────────────────┬──────────────────────┘
                       │ spawns
┌──────────────────────┼──────────────────────┐
│  OS Desktop                                  │
│  ┌────────────┐ ┌────────────┐ ┌──────────┐ │
│  │ Focus Timer│ │ Tasks      │ │ Brain    │ │
│  │ transparent│ │ transparent│ │ Dump     │ │
│  │ frameless  │ │ frameless  │ │ transp.  │ │
│  └────────────┘ └────────────┘ └──────────┘ │
└─────────────────────────────────────────────┘
```

### 3.1 Component Breakdown

| Component | Location | Role |
|-----------|----------|------|
| `companion-bridge.ts` | `src/lib/` (new) | WebSocket client, auto-reconnect, event dispatch |
| `use-companion-bridge.ts` | `src/hooks/` (new) | React hook, BroadcastChannel leader election |
| `popout-launcher.ts` | `src/lib/` (existing, modified) | Add companion-first routing in `detach()` |
| `PopoutShell.tsx` | `src/components/popout/` (existing, modified) | Companion mode: transparent body, drag region |
| `PopoutTitleBar.tsx` | `src/components/popout/` (existing, modified) | Companion-aware reattach with ack |
| `page.tsx` | `app/(desktop)/` (existing, modified) | Mount companion hook, connection indicator |
| `Window.tsx` | `src/components/window-manager/` (existing, modified) | Context-aware overlay text |
| Tauri companion | `place-companion/` (new repo/dir) | WS server, window manager, tray, updater |

## 4. WebSocket Protocol

### 4.1 Connection & Handshake

**Port discovery:** Browser tries WebSocket connections on ports 27182–27189 in parallel (`Promise.any`). First successful connection wins. Companion binds to first available port in this range.

**Authentication:** Companion checks WebSocket `Origin` header server-side. Allowlist:
- `https://place.org`
- `https://www.place.org`
- `http://localhost:3000` through `http://localhost:3009` (dev servers only)

No wildcard subdomains (prevents subdomain takeover attacks). No `localhost:*` wildcard (prevents arbitrary local apps from commanding the companion).

**Hello handshake:**

```
Browser → Companion: (WebSocket opens)
Companion → Browser: {
  type: "hello",
  version: "1.0.0",
  windows: [{ windowId, appId, bounds }]   // current companion windows
}
```

The `windows` array enables full-replace sync on reconnect. Browser replaces its entire companion window state with this list — no merge logic.

### 4.2 Protocol Version

Both sides include a version string. For v1, only log mismatches. Version negotiation and upgrade nudges are deferred to v2 — not needed until the protocol actually changes.

### 4.3 Messages: Browser → Companion

| Type | Payload | Description |
|------|---------|-------------|
| `open-window` | `{ windowId, appId, url, bounds: {x,y,width,height}, transparent: true }` | Create native window |
| `close-window` | `{ windowId }` | Close native window |
| `move-window` | `{ windowId, x, y }` | Move native window |
| `resize-window` | `{ windowId, width, height }` | Resize native window |
| `focus-window` | `{ windowId }` | Focus/raise native window |
| `reattach-ack` | `{ windowId }` | Confirm reattach received; companion may close the window |
| `ping` | `{}` | Keepalive (every 15s) |

### 4.4 Messages: Companion → Browser

| Type | Payload | Description |
|------|---------|-------------|
| `hello` | `{ version, windows[] }` | Initial handshake + state sync |
| `window-opened` | `{ windowId, bounds }` | Confirm window was created |
| `window-closed` | `{ windowId }` | User closed window natively (OS close button, Alt+F4) |
| `window-moved` | `{ windowId, x, y }` | User dragged window natively |
| `window-resized` | `{ windowId, width, height }` | User resized window natively |
| `window-reattach` | `{ windowId, appId }` | User clicked "Return to desktop" in companion window |
| `pong` | `{ windowCount }` | Keepalive response |
| `window-error` | `{ windowId, error: string }` | Window creation or operation failed |

### 4.5 Bounds Field Convention

All bounds on the wire use `{ x, y, width, height }` — matching the existing `WindowPosition` type. No short-form `w`/`h` abbreviations. This avoids translation layers between the TypeScript types and the protocol.

### 4.6 Keepalive Direction

Browser sends application-level `ping` every 15s. Companion responds with `pong`. Companion disconnects if it receives no `ping` for 45s (3 missed). This is in addition to WebSocket protocol-level ping/pong frames (RFC 6455), which libraries handle automatically.

### 4.7 Idempotency

Companion must handle duplicate commands gracefully:
- `open-window` for an already-existing `windowId`: focus the existing window, respond with `window-opened` (idempotent)
- `close-window` for a non-existent `windowId`: ignore silently
- On reconnect, the `hello` payload is the source of truth — browser does not re-send `open-window` for windows already in the list

### 4.8 URL Validation

Companion validates the `url` field in `open-window` server-side. Only allows URLs matching:
- `https://place.org/*`
- `https://www.place.org/*`
- `http://localhost:3000/*` through `http://localhost:3009/*`

Rejects all other URLs (prevents loading `file://`, data URIs, or arbitrary external sites in transparent frameless windows).

## 5. Browser-Side Integration

### 5.1 `companion-bridge.ts` — WebSocket Client

```typescript
// Singleton module — not a store, just a connection manager
interface CompanionBridge {
  connect(): void;
  disconnect(): void;
  isAvailable(): boolean;
  getVersion(): string | null;

  // Commands
  openWindow(windowId: string, appId: AppId, url: string, bounds: WindowPosition): void;
  closeWindow(windowId: string): void;
  moveWindow(windowId: string, x: number, y: number): void;
  resizeWindow(windowId: string, width: number, height: number): void;
  focusWindow(windowId: string): void;
  sendReattachAck(windowId: string): void;

  // Events
  on(event: CompanionEvent, handler: CompanionEventHandler): () => void;
}
```

**Auto-reconnect:** Exponential backoff — 1s → 2s → 4s → 8s → max 30s. Silent (no toasts). On reconnect, `hello` payload triggers full-replace of companion window state.

**Port discovery:** On `connect()`, first try the cached port from `localStorage` (key: `place_companion_port`). If that fails, try `ws://localhost:27182` through `:27189` in parallel (`Promise.any`). Cache the working port. If all fail, mark as unavailable and start backoff. This avoids triggering endpoint security software with a port scan on every page load.

**Lifecycle:** Companion disconnect marks all companion-managed windows as stale. Browser reverts their persistence mode from `"companion"` to `"inline"` so they reappear in the virtual desktop on next load.

### 5.1.1 Persistence Mode: `"companion"`

Add a third mode to `PersistedWindowState.mode`: `"inline" | "popout" | "companion"`. This is critical because:
- `reattachPersistedPopouts()` in `popout-launcher.ts` calls `window.open("", name)` to recapture browser popup refs. This would fail for companion windows (they're Tauri webviews, not browser windows) and potentially create ghost browser windows.
- On companion disconnect, `"companion"` windows revert to `"inline"` (appear in desktop). `"popout"` windows are left alone (they're real browser popups).
- `deserializeWindows()` already skips `mode === "popout"` — it should also skip `mode === "companion"`.
- On reconnect, companion `hello` payload re-establishes which windows are `"companion"` mode.

### 5.2 `use-companion-bridge.ts` — React Hook + Leader Election

```typescript
function useCompanionBridge(): {
  isConnected: boolean;
  isLeader: boolean;
  companionVersion: string | null;
}
```

**BroadcastChannel leader election:** Only the leader tab holds the WebSocket connection. Other tabs receive state updates via BroadcastChannel (`place_companion_sync`).

**Election protocol:**
1. On mount, each tab generates a random ID and broadcasts `{ type: "claim", tabId, timestamp }`
2. Lowest timestamp wins (tie-break: lowest tabId)
3. Leader opens WebSocket; followers listen on BroadcastChannel
4. On leader tab close, others detect via `beforeunload` broadcast + heartbeat timeout, and re-elect

### 5.3 `popout-launcher.ts` — Modified `detach()`

Current `detach()` returns `Window | null`. Adding a string sentinel would break the `PopoutAPI` interface type contract. Instead, use a discriminated result object:

```typescript
type DetachResult =
  | { via: "browser"; ref: Window }
  | { via: "companion" }
  | null;  // blocked, touch device, or popup blocked

detach(windowId, appId, position): DetachResult {
  // NEW: Try companion first
  const bridge = getCompanionBridge();
  if (bridge.isAvailable()) {
    const url = `${window.location.origin}/popout/${appId}?windowId=${windowId}&companion=true`;
    bridge.openWindow(windowId, appId, url, position);
    updatePersistedMode(windowId, "companion");
    return { via: "companion" };
  }

  // EXISTING: window.open() fallback (unchanged)
  // ... returns { via: "browser", ref: popup } or null
}
```

**Callsite audit (2 callsites):**
- `Window.tsx` `handleDragStop` function: currently `if (popup) closeWindow(win.id)` — change to `if (result) closeWindow(win.id)`. Both `{ via: "browser" }` and `{ via: "companion" }` are truthy; `null` is falsy. Same behavior, type-safe.
- `Window.tsx` `handleDetach` function: same pattern, same fix.
- No other callsites exist in the codebase.

### 5.4 `PopoutShell.tsx` — Companion Mode Detection

```typescript
function isCompanionMode(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("companion") === "true";
}
```

When `isCompanionMode()`:
- `document.body.style.background = "transparent"` (instead of `#060610`)
- `document.documentElement.style.background = "transparent"`
- Outer shell gets `border-radius: 12px; overflow: hidden`
- `-webkit-app-region: drag` on titlebar actually works (Tauri webview)

### 5.5 `PopoutTitleBar.tsx` — Companion-Aware Reattach

Current reattach uses `window.opener.postMessage()`. In companion mode, `window.opener` is null (Tauri opened the window, not the browser).

**Companion reattach flow:**
1. User clicks "Return to desktop" in companion window
2. PopoutTitleBar calls `window.__TAURI__.invoke("reattach", { windowId, appId })` — this is the only path in companion mode (no HTTP fallback needed, since the popout is always a Tauri webview and `__TAURI__` is always available when `withGlobalTauri` is set per-window)
3. Companion forwards `window-reattach` event over WebSocket to browser
4. Browser's CompanionBridge fires event → desktop page opens the window inline
5. Browser sends `reattach-ack` back to companion
6. Companion receives ack → closes the Tauri webview window
7. **Timeout:** If no ack within 3 seconds, companion closes anyway (prevents orphaned windows)

### 5.6 `Window.tsx` — Context-Aware Overlay

The `PopoutConfirmOverlay` component currently shows "Release to pop out / Opens in a separate browser window".

Change to:
- Companion connected: **"Release to pop out as native window"**
- No companion: **"Release to pop out"** (unchanged)

Read `isAvailable()` from the companion bridge. Import the bridge lazily to avoid bundling WS code in contexts that don't need it.

### 5.7 `page.tsx` — Desktop Page Integration

Add `useCompanionBridge()` to the existing hook block:

```typescript
useCompanionBridge();  // connects to companion if available
```

**Connection indicator:** After the first connection attempt fails (companion not running), show a small, dismissible indicator — not a modal or toast. Something like a subtle dot or small text in the settings app or ambient bar. Include a link to the download page. Dismiss persists via localStorage.

## 6. Tauri Companion App

### 6.1 Project Structure

```
place-companion/
  src-tauri/
    src/
      main.rs           // entry: tray icon, auto-start, app lifecycle
      ws_server.rs       // WebSocket server (tokio-tungstenite)
      window_mgr.rs      // create/destroy/track transparent webviews
      protocol.rs        // message types, serde serialization
      commands.rs        // Tauri IPC commands (reattach, etc.)
    tauri.conf.json      // no default window, tray-only, transparent config
    Cargo.toml           // tauri, tokio-tungstenite, serde, tauri-plugin-*
  src/                   // minimal — tray-only app, no frontend UI
    index.html           // empty shell (required by Tauri)
  package.json
  README.md
```

### 6.2 Key Tauri Configuration

```json
{
  "app": {
    "windows": [],
    "withGlobalTauri": false
  },
  // NOTE: withGlobalTauri is false for the main app (tray-only, no window).
  // Spawned webview windows set withGlobalTauri: true per-window via
  // WebviewWindowBuilder so that window.__TAURI__.invoke() is available
  // for the reattach IPC call in PopoutTitleBar.tsx.
  "bundle": {
    "active": true,
    "targets": ["dmg", "msi", "appimage", "deb"]
  },
  "plugins": {
    "updater": {
      "endpoints": ["https://place.org/api/companion/update/{{target}}/{{arch}}/{{current_version}}"],
      "dialog": false
    },
    "autostart": { "macosLaunchAgent": true }
  }
}
```

### 6.3 Window Creation

```rust
// Per-window config when handling open-window command
WebviewWindowBuilder::new(
    &app,
    format!("place_{}", window_id),
    WebviewUrl::External(url.parse()?),
)
.title(app_label)
.transparent(true)
.decorations(false)
.shadow(false)            // required for v2 transparency
.position(x, y)
.inner_size(width, height)
.build()?;
```

**Linux X11 without compositor:** Detect via `$XDG_SESSION_TYPE` and `xdpyinfo` for composite extension. If no compositor, set `transparent(false)` and use dark opaque background as fallback. Log this to help with debugging.

**macOS DMG transparency bug (Tauri issue #13415):** Known issue in release builds. Monitor the issue. For v1, document that macOS transparency may not work in the DMG build and will use dark opaque fallback. This is a Tauri upstream fix, not something we can work around.

### 6.4 WebSocket Server

- Binds to first available port in 27182–27189
- Logs bound port to stdout and system tray tooltip
- Checks `Origin` header on every connection — rejects non-allowlisted origins
- Sends `hello` with version and current window list on every new connection
- Processes commands, forwards OS window events back to browser
- Ping/pong keepalive every 15s, disconnect if 3 missed pongs

### 6.5 System Tray

- Tray icon: small place.org logo
- Tooltip: "place.org Companion — {n} windows open — port {port}"
- Menu items:
  - "Open place.org" → opens default browser to place.org
  - "Close all windows" → closes all companion webviews
  - Separator
  - "Start at login" toggle
  - "Check for updates"
  - "Quit"

## 7. Platform-Aware Titlebar (Enhancement)

The current `PopoutTitleBar.tsx` uses macOS-style traffic lights on all platforms. This enhancement adds platform-appropriate styling.

### 7.1 Detection

```typescript
type TitleBarStyle = "macos" | "windows" | "linux";

function detectTitleBarStyle(): TitleBarStyle {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) return "macos";
  if (ua.includes("win")) return "windows";
  return "linux";
}
```

This is **best-effort aesthetic only** — not a logic dependency. Document clearly that UA sniffing is unreliable and the titlebar style is cosmetic.

### 7.2 Styles

| Platform | Layout | Close/Min/Max |
|----------|--------|---------------|
| macOS | Traffic lights left, title centered | Colored circles (existing) |
| Windows | Title left, buttons right | Segoe-style rectangles: ─ □ ✕ |
| Linux (GNOME) | Title centered, buttons right | Rounded circles |

## 8. Distribution & Install

### 8.1 Build Targets

| Platform | Format | Signing | Notes |
|----------|--------|---------|-------|
| macOS | `.dmg` | Apple notarization required | Gatekeeper blocks unsigned. Document right-click → Open workaround if no Developer account. |
| Windows | `.msi` + `.exe` | Code signing preferred | SmartScreen blocks unsigned. Document "More info → Run anyway" steps. |
| Linux | `.AppImage` (primary) | N/A | chmod +x and run. No install needed. |
| Linux | `.deb` (stretch) | N/A | For Debian/Ubuntu users who prefer system packages. |

### 8.2 Download Page

A page on place.org (e.g., `/companion` or `/download`) that:
- Auto-detects platform via UA
- Shows the correct download button prominently
- Links to other platforms below
- Includes install instructions per platform
- Documents firewall/AV false positive risk (especially Windows — local WebSocket server may trigger alerts)

### 8.3 Auto-Update

Tauri's built-in updater plugin, configured from day one:
- Checks for updates on launch (silent, background)
- Endpoint: `https://place.org/api/companion/update/{target}/{arch}/{current_version}`
- No modal dialogs — download and apply silently, notify via tray tooltip

## 9. Known Limitations (v1)

### 9.1 Multi-Monitor / DPI Scaling

Browser `screenX`/`screenY` values are in CSS pixels; Tauri positions may use physical pixels on some platforms. For v1, companion windows are positioned using the browser's CSS pixel coordinates directly (which works correctly on single-monitor setups and most multi-monitor setups where all displays share the same DPI). Multi-monitor with mixed DPI is a known edge case — log a warning if `window.devicePixelRatio` differs from 1.0, and document as a known limitation. Full coordinate translation is deferred to v2.

### 9.2 Browser Disconnect → Orphan Companion Windows

If the browser tab is closed (or crashes) while companion windows are open, those windows persist with no way to return to the desktop. Companion-side behavior:
- Detect browser WebSocket disconnect
- After 30s with no reconnection from any browser tab, show a subtle "Disconnected — close?" indicator in each orphaned companion window
- After 5 minutes with no reconnection, auto-close all orphaned windows
- These timeouts are configurable in the tray menu

## 10. Path Exclusion: Companion vs Browser Popout

This section traces every code path to prove the two modes are mutually exclusive — the old `window.open()` behavior never fires when the companion handles it, and the companion path is completely inert when no companion is running.

### 10.1 Detach Path (the critical gate)

The single decision point is at the top of `popout-launcher.ts detach()`:

```
detach(windowId, appId, position)
  │
  ├─ isTouchDevice()? → return null (no popout at all)
  │
  ├─ companion.isAvailable()?
  │    YES → companion.openWindow(...)
  │         updatePersistedMode(windowId, "companion")
  │         return { via: "companion" }     ← EARLY RETURN
  │         ════════════════════════════════
  │         window.open() is NEVER reached
  │         popupRefs Map is NOT modified
  │         watchPopoutClose() is NOT called
  │
  │    NO → fall through to existing code
  │         ↓
  ├─ HARD_LIMIT check
  ├─ SOFT_LIMIT warning
  ├─ dedup check (popupRefs)
  ├─ window.open(url, name, features)
  ├─ popupRefs.set(windowId, popup)
  ├─ updatePersistedMode(windowId, "popout")
  ├─ watchPopoutClose(windowId, popup)
  └─ return { via: "browser", ref: popup }
```

**Key invariant:** The companion check is the FIRST thing after touch detection. If companion is available, the function returns immediately. The `window.open()` call, the `popupRefs` Map update, the `watchPopoutClose()` interval — none of these execute. There is no code path where both fire.

### 10.2 isAvailable() — What It Means

`companion.isAvailable()` returns `true` ONLY when:
1. WebSocket connection to companion is in `OPEN` state
2. The `hello` handshake has completed (version received)
3. This tab is the BroadcastChannel leader (or received a state update from the leader confirming connection)

If the companion is installed but not running, or the WebSocket is in reconnect backoff, or the connection was lost — `isAvailable()` returns `false` and the entire companion code path is skipped.

### 10.3 Callsite Behavior

Both callsites in `Window.tsx` use the same pattern:

```typescript
// handleDetach (detach button click)
const result = launcher.detach(win.id, win.appId, win.position);
if (result) closeWindow(win.id);

// handleDragStop (drag outside viewport)
const result = getPopoutLauncher().detach(win.id, win.appId, win.position);
if (result) closeWindow(win.id);
```

- Companion path: `detach()` returns `{ via: "companion" }` (truthy) → `closeWindow()` removes from virtual desktop ✓
- Browser path: `detach()` returns `{ via: "browser", ref: Window }` (truthy) → `closeWindow()` removes from virtual desktop ✓
- Blocked path: `detach()` returns `null` (falsy) → window stays in virtual desktop ✓

In all cases, `closeWindow()` fires exactly once. The virtual window is always removed from the desktop regardless of which backend handled the popout.

### 10.4 Persistence Path Exclusion

```
Persistence mode values:
  "inline"    → window lives in virtual desktop
  "popout"    → window lives in a browser window.open() popup
  "companion" → window lives in a Tauri companion webview

On page load, reattachPersistedPopouts():
  for each persisted window:
    if mode === "popout"    → try window.open("", name) to recapture ref
    if mode === "companion" → SKIP (companion hello will re-sync these)
    if mode === "inline"    → SKIP (handled by deserializeWindows)

On companion disconnect:
  all "companion" windows → revert to "inline" (appear in desktop)
  "popout" windows → untouched (they're real browser popups)

On companion reconnect (hello payload):
  full-replace: companion's window list becomes truth
  "inline" windows that companion claims → promoted to "companion"
```

### 10.5 Reattach Path Exclusion

```
Browser popup reattach:
  PopoutTitleBar → window.opener.postMessage("place_reattach")
  Desktop page useReattachListener → openWindow(appId)
  (window.opener exists because browser opened the popup)

Companion reattach:
  PopoutTitleBar → window.__TAURI__.invoke("reattach")
  Companion → WebSocket → browser CompanionBridge event
  CompanionBridge handler → openWindow(appId)
  Browser → reattach-ack → companion closes Tauri window
  (window.opener is null — Tauri opened the window, not the browser)

Detection:
  isCompanionMode() checks ?companion=true in URL
  - Companion path ALWAYS includes this param (set by detach())
  - Browser path NEVER includes this param
  → The two reattach paths cannot cross
```

### 10.6 PopoutShell Rendering Exclusion

```
/popout/[appId]?windowId=xxx                → Browser mode
/popout/[appId]?windowId=xxx&companion=true → Companion mode

Browser mode:
  body.backgroundColor = "#060610" (opaque dark)
  isPopupWindow() checks window.name prefix "place_tool_"
  showTitleBar based on popup + not-in-tab detection

Companion mode:
  body.backgroundColor = "transparent"
  document.documentElement.background = "transparent"
  border-radius: 12px + overflow: hidden on shell
  -webkit-app-region: drag on titlebar (functional in Tauri)

The ?companion=true param is set by detach() when companion handles it.
The param is ABSENT when window.open() handles it.
→ The two rendering modes cannot cross.
```

### 10.7 Summary: No Companion = Zero New Code Executes

When no companion is installed/running:
- `companion.isAvailable()` → `false` (WebSocket failed to connect)
- `detach()` → falls through to `window.open()` (identical to today)
- `updatePersistedMode()` → sets `"popout"` (identical to today)
- `PopoutShell` → no `?companion=true` param → opaque background (identical to today)
- `PopoutTitleBar` → `isCompanionMode()` false → `window.opener.postMessage()` reattach (identical to today)
- `reattachPersistedPopouts()` → only processes `mode === "popout"` (identical to today)
- The `useCompanionBridge()` hook runs but does nothing visible — silent WebSocket attempt, silent failure, silent backoff. No toasts, no UI changes, no side effects.

## 11. Graceful Degradation

| Scenario | Behavior |
|----------|----------|
| Companion installed + running | Drag-out → transparent native window with OS taskbar entry |
| Companion installed, not running | Drag-out → `window.open()` popup (existing behavior) |
| No companion installed | Drag-out → `window.open()` popup (existing behavior) + small "get companion" indicator |
| Touch device | Popout disabled entirely (existing behavior) |
| Companion crashes mid-session | All companion windows become orphaned (close themselves after WS timeout). Browser reverts to inline mode on next persistence read. |
| Multiple browser tabs | Leader election via BroadcastChannel. Only one WS connection. |

## 12. Implementation Order

Each step leaves the system in a working, testable state.

| Step | Files | Dependency |
|------|-------|------------|
| 1. `companion-bridge.ts` | New `src/lib/companion-bridge.ts` | None |
| 2. `use-companion-bridge.ts` | New `src/hooks/use-companion-bridge.ts` | Step 1 |
| 3. Launcher integration | Modify `src/lib/popout-launcher.ts` | Steps 1–2 |
| 4. Companion mode detection | Modify `PopoutShell.tsx`, `PopoutTitleBar.tsx` | Step 3 |
| 5. Desktop page integration | Modify `app/(desktop)/page.tsx`, `Window.tsx` | Steps 1–4 |
| 6. Platform-aware titlebar | Modify `PopoutTitleBar.tsx` | Independent |
| 7. Tauri companion scaffold | New `place-companion/` | Steps 1–5 for testing |
| 8. Distribution + docs | Build pipeline, download page | Step 7 |

## 13. Open Questions

1. **macOS transparency in DMG builds** — Tauri issue #13415 is unresolved. Do we ship macOS with dark opaque fallback and wait for the fix, or skip macOS companion entirely for v1?
2. **Companion app naming** — "place.org Companion"? "place Desktop"? "place Bridge"?
3. **Tauri vs Electron for macOS** — Electron's transparency works on macOS today. Worth using Electron just for macOS builds while Tauri on Windows/Linux? Or keep it simple with one framework?
4. **Companion in same repo vs separate?** — Monorepo (`place-companion/` directory) or separate GitHub repo?

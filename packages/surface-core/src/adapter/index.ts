/**
 * Adapter protocol — single dispatch point for cross-framework window
 * and shell actions per `doctrine/research/virtual-desktop-deep.md`.
 *
 * Doctrine: "One typed endpoint dispatching on `{framework: 'tauri' |
 * 'web', action, payload}` … native window and a web window go through
 * the same path."
 *
 * This module is the web-side dispatcher. The Tauri side is a thin
 * IPC call in `apps/desktop/src-tauri/` (landed in a later wave, with
 * `place-companion/src-tauri/src/ws_server.rs` as the reference).
 *
 * For wave 1 the web handler is the authoritative implementation; the
 * Tauri route is stubbed to forward to a native command once the
 * desktop shell adds window_mgr commands.
 */

export type AdapterFramework = "tauri" | "web";

export type AdapterAction =
  | "window.open"
  | "window.close"
  | "window.focus"
  | "window.move"
  | "window.resize"
  | "window.minimize"
  | "dock.hide"
  | "dock.show"
  | "wallpaper.set";

export type AdapterEnvelope = {
  framework: AdapterFramework;
  action: AdapterAction;
  payload: Record<string, unknown>;
};

export type AdapterResult =
  | { ok: true; data?: unknown }
  | { ok: false; error: { class: string; message: string } };

export type AdapterHandler = (envelope: AdapterEnvelope) => Promise<AdapterResult> | AdapterResult;

let webHandler: AdapterHandler | null = null;
let tauriHandler: AdapterHandler | null = null;

export function registerAdapter(framework: AdapterFramework, handler: AdapterHandler): void {
  if (framework === "web") webHandler = handler;
  else tauriHandler = handler;
}

export function unregisterAdapter(framework: AdapterFramework): void {
  if (framework === "web") webHandler = null;
  else tauriHandler = null;
}

export async function dispatchAdapter(envelope: AdapterEnvelope): Promise<AdapterResult> {
  const handler = envelope.framework === "web" ? webHandler : tauriHandler;
  if (!handler) {
    return {
      ok: false,
      error: {
        class: "unavailable",
        message: `no handler registered for framework ${envelope.framework}`,
      },
    };
  }
  try {
    return await handler(envelope);
  } catch (err) {
    return {
      ok: false,
      error: {
        class: "internal",
        message: err instanceof Error ? err.message : "adapter dispatch failed",
      },
    };
  }
}

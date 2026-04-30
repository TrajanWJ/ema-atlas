"use client";

import { useEffect, useState } from "react";

/**
 * Detects whether the app is running inside a Tauri webview (desktop)
 * vs a regular browser, and writes `<html data-runtime="tauri" | "web">`
 * so CSS scoped under `[data-runtime="tauri"]` only applies in the desktop
 * shell.
 *
 * Detection: `window.__TAURI__` or `window.__TAURI_INTERNALS__` are
 * injected by Tauri 2 at boot. Returns `true` after detection so consumers
 * can render Tauri-only chrome (traffic lights, corner resize grip, etc.).
 */
export function useTauriRuntime(): boolean {
	const [isTauri, setIsTauri] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const tauriWindow = window as unknown as Record<string, unknown>;
		const detected =
			"__TAURI__" in tauriWindow || "__TAURI_INTERNALS__" in tauriWindow;
		setIsTauri(detected);
		document.documentElement.dataset.runtime = detected ? "tauri" : "web";
	}, []);

	return isTauri;
}

"use client";

import { useEffect, useCallback } from "react";

/**
 * Opens the /desk route as a standalone popup window — the work-companion
 * window pattern. Falls back to a new tab if the browser blocks popups.
 */
export function openDeskWindow(): void {
	if (typeof window === "undefined") return;
	const features = [
		"popup=yes",
		"width=1200",
		"height=820",
		"menubar=no",
		"toolbar=no",
		"location=no",
		"status=no",
	].join(",");
	const win = window.open("/desk", "place_desk", features);
	if (!win) {
		// Popup blocked — fall back to tab
		window.open("/desk", "_blank");
	}
}

/**
 * Binds Cmd/Ctrl+Shift+D to open the Desk as a popup window.
 * Also listens for a custom "open-desk" event so other UI can trigger it.
 */
export function useDeskShortcut(): void {
	const handler = useCallback((e: KeyboardEvent) => {
		if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "d") {
			e.preventDefault();
			openDeskWindow();
		}
	}, []);

	useEffect(() => {
		window.addEventListener("keydown", handler);
		const onEvent = () => openDeskWindow();
		window.addEventListener("open-desk", onEvent);
		return () => {
			window.removeEventListener("keydown", handler);
			window.removeEventListener("open-desk", onEvent);
		};
	}, [handler]);
}

"use client";

import { useEffect, useRef } from "react";
import { useWindowStore } from "@/src/stores/window-store";
import type { AppId } from "@/src/types/window";

// ----------------------------------------------------------------------------
// Shortcut action map — manifest shortcuts use ?action=<key>
// ----------------------------------------------------------------------------

const SHORTCUT_ACTIONS: Record<string, AppId> = {
	"new-note": "notes",
	"start-timer": "focus",
	"brain-dump": "brain-dump",
} as const;

// ----------------------------------------------------------------------------
// Hook — processes ?action= param on mount, then cleans the URL
// ----------------------------------------------------------------------------

export function useShortcutActions(): void {
	const applied = useRef(false);

	useEffect(() => {
		if (applied.current) return;
		applied.current = true;

		const params = new URLSearchParams(window.location.search);
		const action = params.get("action");
		if (!action) return;

		const appId = SHORTCUT_ACTIONS[action];
		if (appId) {
			useWindowStore.getState().openWindow(appId);
		}

		// Clean the URL without a page reload
		const url = new URL(window.location.href);
		url.searchParams.delete("action");
		window.history.replaceState({}, "", url.pathname + url.search);
	}, []);
}

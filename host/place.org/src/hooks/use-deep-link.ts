'use client';

import { useEffect, useRef } from "react";
import { decodeDeepLink } from "@/src/lib/deep-links";
import { useWindowStore } from "@/src/stores/window-store";
import { useWorkspaceStore } from "@/src/stores/workspace-store";
import type { AppId } from "@/src/types/window";

// ----------------------------------------------------------------------------
// Hook — runs once on mount, applies deep link state if present
// ----------------------------------------------------------------------------

export function useDeepLink(): void {
	const applied = useRef(false);

	useEffect(() => {
		if (applied.current) return;
		applied.current = true;

		if (typeof window === "undefined") return;

		const url = window.location.href;
		const params = new URLSearchParams(window.location.search);
		if (!params.has("ws") && !params.has("layout")) return;

		const decoded = decodeDeepLink(url);
		if (!decoded) {
			cleanUrl();
			return;
		}

		if (decoded.type === "layout" && decoded.layoutId) {
			applyLayout(decoded.layoutId);
		} else if (decoded.type === "windows" && decoded.windows) {
			applyWindows(decoded.windows);
		}

		cleanUrl();
	}, []);
}

// ----------------------------------------------------------------------------
// Apply decoded windows
// ----------------------------------------------------------------------------

function applyWindows(
	windows: ReadonlyArray<{
		readonly appId: string;
		readonly x: number;
		readonly y: number;
		readonly width: number;
		readonly height: number;
	}>,
): void {
	const store = useWindowStore.getState();

	// Close all current windows
	for (const id of store.windows.keys()) {
		store.closeWindow(id);
	}

	// Open each from the deep link
	for (const w of windows) {
		store.openWindow(w.appId as AppId, {
			x: w.x,
			y: w.y,
			width: w.width,
			height: w.height,
		});
	}
}

// ----------------------------------------------------------------------------
// Apply named layout
// ----------------------------------------------------------------------------

function applyLayout(layoutId: string): void {
	const layout = useWorkspaceStore
		.getState()
		.layouts.find((l) => l.id === layoutId);
	if (!layout) return;
	useWorkspaceStore.getState().load(layoutId);
}

// ----------------------------------------------------------------------------
// Clean URL — remove query params without page reload
// ----------------------------------------------------------------------------

function cleanUrl(): void {
	const url = new URL(window.location.href);
	url.searchParams.delete("ws");
	url.searchParams.delete("layout");
	window.history.replaceState({}, "", url.pathname);
}

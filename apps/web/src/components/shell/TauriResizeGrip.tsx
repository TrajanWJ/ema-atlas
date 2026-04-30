"use client";

import type { PointerEvent } from "react";

/**
 * Bottom-right corner grip for resizing the outer Tauri window.
 *
 * Tauri's `decorations: false` means macOS doesn't supply a native resize
 * grip. We render our own — chevron texture, nwse-resize cursor, calls
 * the Tauri window API on pointer-down.
 *
 * Renders nothing in browser (CSS hides via :not([data-runtime="tauri"])).
 */
export function TauriResizeGrip() {
	async function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
		e.preventDefault();
		e.stopPropagation();
		try {
			const mod = await import("@tauri-apps/api/window");
			const win = mod.getCurrentWindow();
			// Tauri 2: pass the resize edge as "BottomRight" / etc.
			await (win as unknown as {
				startResizeDragging: (edge: string) => Promise<void>;
			}).startResizeDragging("BottomRight");
		} catch {
			// non-Tauri context
		}
	}

	return (
		<div
			className="ema-tauri-resize-grip"
			role="presentation"
			aria-hidden="true"
			data-tauri-drag-region={false}
			onPointerDown={handlePointerDown}
		/>
	);
}

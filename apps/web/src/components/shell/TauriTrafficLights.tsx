"use client";

import { useEffect, useState } from "react";

/**
 * macOS-style filled-circle traffic lights for the OUTER Tauri window.
 *
 * Donor pattern (place-companion): red close, amber minimize, green maximize.
 * Hover reveals the action glyph in low-opacity black, like macOS.
 *
 * Wires to Tauri's window API via dynamic import so the bundle stays browser-safe.
 * Renders nothing in the browser (the CSS hides it via :not([data-runtime="tauri"])).
 */
export function TauriTrafficLights() {
	const [hovered, setHovered] = useState(false);

	async function getCurrentWin() {
		try {
			const mod = await import("@tauri-apps/api/window");
			return mod.getCurrentWindow();
		} catch {
			return null;
		}
	}

	async function handleClose() {
		const win = await getCurrentWin();
		await win?.close().catch(() => {});
	}
	async function handleMinimize() {
		const win = await getCurrentWin();
		await win?.minimize().catch(() => {});
	}
	async function handleMaximize() {
		const win = await getCurrentWin();
		await win?.toggleMaximize().catch(() => {});
	}

	return (
		<div
			className="ema-traffic-lights"
			role="group"
			aria-label="Window controls"
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			data-tauri-drag-region={false}
		>
			<button
				type="button"
				className="ema-traffic-lights__btn ema-traffic-lights__btn--close"
				aria-label="Close window"
				title="Close"
				onClick={handleClose}
			>
				{hovered && (
					<svg viewBox="0 0 8 8" aria-hidden="true">
						<path
							d="M1.5 1.5l5 5M6.5 1.5l-5 5"
							stroke="rgba(0,0,0,0.55)"
							strokeWidth="1.2"
							strokeLinecap="round"
						/>
					</svg>
				)}
			</button>
			<button
				type="button"
				className="ema-traffic-lights__btn ema-traffic-lights__btn--min"
				aria-label="Minimize window"
				title="Minimize"
				onClick={handleMinimize}
			>
				{hovered && (
					<svg viewBox="0 0 8 8" aria-hidden="true">
						<path
							d="M1.5 4h5"
							stroke="rgba(0,0,0,0.55)"
							strokeWidth="1.2"
							strokeLinecap="round"
						/>
					</svg>
				)}
			</button>
			<button
				type="button"
				className="ema-traffic-lights__btn ema-traffic-lights__btn--max"
				aria-label="Maximize window"
				title="Maximize"
				onClick={handleMaximize}
			>
				{hovered && (
					<svg viewBox="0 0 8 8" aria-hidden="true">
						<path
							d="M2 2h4v4H2z"
							fill="none"
							stroke="rgba(0,0,0,0.55)"
							strokeWidth="1.2"
						/>
					</svg>
				)}
			</button>
		</div>
	);
}

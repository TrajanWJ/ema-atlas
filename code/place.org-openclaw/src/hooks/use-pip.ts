'use client';

import { useCallback, useRef } from "react";

export interface PipControls {
	readonly supported: boolean;
	readonly open: (content: string) => Promise<void>;
	readonly close: () => void;
}

/**
 * Manages a Document Picture-in-Picture window for the mini timer display.
 * Falls back gracefully when the API is not supported.
 */
export function usePip(): PipControls {
	const pipWindowRef = useRef<Window | null>(null);

	const supported =
		typeof window !== "undefined" &&
		"documentPictureInPicture" in window;

	const open = useCallback(async (content: string) => {
		if (!supported) return;

		try {
			const pipWindow = await (
				window as unknown as {
					documentPictureInPicture: {
						requestWindow(opts: { width: number; height: number }): Promise<Window>;
					};
				}
			).documentPictureInPicture.requestWindow({ width: 200, height: 120 });

			pipWindowRef.current = pipWindow;

			pipWindow.document.body.style.cssText =
				"margin:0;background:#060610;color:#e8eaf0;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;font-size:1.5rem;";
			pipWindow.document.body.innerHTML = content;
		} catch {
			// PiP request may be blocked by browser; silently ignore
		}
	}, [supported]);

	const close = useCallback(() => {
		pipWindowRef.current?.close();
		pipWindowRef.current = null;
	}, []);

	return { supported, open, close };
}

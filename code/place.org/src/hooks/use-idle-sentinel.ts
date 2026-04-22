"use client";

import { useEffect, useRef } from "react";
import { useToastStore } from "@/src/stores/toast-store";

/**
 * Idle Sentinel.
 *
 * When the user comes back after a long idle (default 20 minutes), a soft
 * toast prompts them to re-orient: "What were you doing?" — clicking the
 * toast focuses the Desk's Right Now input (or opens the Desk if closed).
 *
 * Detection is conservative: we use the Page Visibility API + a tick timer.
 * If the tab was hidden, or no activity, longer than IDLE_THRESHOLD, fire.
 */

const IDLE_THRESHOLD_MS = 20 * 60 * 1000;
const TICK_MS = 60 * 1000;

export function useIdleSentinel(): void {
	const lastActivityRef = useRef<number>(Date.now());
	const firedAtRef = useRef<number>(0);

	useEffect(() => {
		function onActivity() {
			lastActivityRef.current = Date.now();
		}

		function onVisibility() {
			if (document.visibilityState === "visible") {
				const elapsed = Date.now() - lastActivityRef.current;
				if (elapsed >= IDLE_THRESHOLD_MS && Date.now() - firedAtRef.current > IDLE_THRESHOLD_MS) {
					firedAtRef.current = Date.now();
					useToastStore.getState().addToast(
						"Welcome back — what were you doing?",
						"info",
						8000,
					);
				}
				lastActivityRef.current = Date.now();
			}
		}

		const interval = setInterval(() => {
			if (document.visibilityState !== "visible") return;
			const elapsed = Date.now() - lastActivityRef.current;
			if (elapsed >= IDLE_THRESHOLD_MS && Date.now() - firedAtRef.current > IDLE_THRESHOLD_MS) {
				firedAtRef.current = Date.now();
				useToastStore.getState().addToast(
					"You went quiet for a while — still on what you were doing?",
					"info",
					8000,
				);
			}
		}, TICK_MS);

		window.addEventListener("mousemove", onActivity, { passive: true });
		window.addEventListener("keydown", onActivity, { passive: true });
		window.addEventListener("pointerdown", onActivity, { passive: true });
		document.addEventListener("visibilitychange", onVisibility);

		return () => {
			clearInterval(interval);
			window.removeEventListener("mousemove", onActivity);
			window.removeEventListener("keydown", onActivity);
			window.removeEventListener("pointerdown", onActivity);
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, []);
}

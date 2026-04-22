"use client";

import { useEffect } from "react";
import { eventBus } from "@/src/lib/event-bus";
import { acquireWakeLock, releaseWakeLock } from "@/src/lib/wake-lock";
import { useFocusStore } from "@/src/stores/focus-store";

/**
 * Keeps the screen awake while a focus timer session is running.
 *
 * - Acquires the wake lock on `timer:session_started`
 * - Releases the wake lock on `timer:session_completed`
 * - Keeps the lock held on `timer:session_paused` (user may glance at the timer)
 * - Re-acquires when the tab regains visibility if a timer is still running
 */
export function useWakeLock(): void {
	useEffect(() => {
		const unsubStart = eventBus.on(
			"timer:session_started",
			() => void acquireWakeLock(),
		);

		const unsubComplete = eventBus.on(
			"timer:session_completed",
			() => releaseWakeLock(),
		);

		// Intentionally no-op for pause — keep the lock held
		const unsubPause = eventBus.on("timer:session_paused", () => {
			// wake lock stays held during pause
		});

		// Re-acquire when tab becomes visible again if timer is still active
		function handleVisibilityChange(): void {
			if (document.visibilityState !== "visible") return;
			const { isRunning, isPaused } = useFocusStore.getState();
			if (isRunning || isPaused) {
				void acquireWakeLock();
			}
		}

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			unsubStart();
			unsubComplete();
			unsubPause();
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			releaseWakeLock();
		};
	}, []);
}

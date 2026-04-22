'use client';

import { useEffect, useRef, useState } from "react";

export const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart"] as const;

export function useIdleDetection(timeoutMs: number = IDLE_TIMEOUT_MS): { isIdle: boolean } {
	const [isIdle, setIsIdle] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		function resetTimer() {
			if (timerRef.current !== null) {
				clearTimeout(timerRef.current);
			}
			setIsIdle(false);
			timerRef.current = setTimeout(() => {
				setIsIdle(true);
			}, timeoutMs);
		}

		resetTimer();

		for (const event of ACTIVITY_EVENTS) {
			window.addEventListener(event, resetTimer, { passive: true });
		}

		return () => {
			if (timerRef.current !== null) {
				clearTimeout(timerRef.current);
			}
			for (const event of ACTIVITY_EVENTS) {
				window.removeEventListener(event, resetTimer);
			}
		};
	}, [timeoutMs]);

	return { isIdle };
}

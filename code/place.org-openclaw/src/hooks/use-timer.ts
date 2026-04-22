'use client';

import { useEffect, useRef } from "react";
import { useFocusStore } from "@/src/stores/focus-store";

/**
 * Drives the focus timer using requestAnimationFrame.
 * Uses Date.now() timestamps (not interval accumulation) so it stays
 * accurate across backgrounding and tab-throttling.
 */
export function useTimer(): void {
	const isRunning = useFocusStore((s) => s.isRunning);
	const tick = useFocusStore((s) => s.tick);
	const rafId = useRef<number | null>(null);

	useEffect(() => {
		if (!isRunning) {
			if (rafId.current !== null) {
				cancelAnimationFrame(rafId.current);
				rafId.current = null;
			}
			return;
		}

		function frame() {
			tick(Date.now());
			rafId.current = requestAnimationFrame(frame);
		}

		rafId.current = requestAnimationFrame(frame);

		return () => {
			if (rafId.current !== null) {
				cancelAnimationFrame(rafId.current);
				rafId.current = null;
			}
		};
	}, [isRunning, tick]);
}

"use client";

import { useEffect } from "react";
import { eventBus } from "@/src/lib/event-bus";
import { startIdleDetection } from "@/src/lib/idle-detection";

/**
 * Starts the IdleDetector API on mount and emits event bus events
 * when the user goes idle or becomes active again.
 *
 * Falls back gracefully if the API is unavailable (non-Chromium browsers).
 */
export function useIdleEvents(): void {
	useEffect(() => {
		let stopDetection: (() => void) | null = null;

		startIdleDetection(
			() => {
				eventBus.emit({
					appId: "system",
					eventType: "user_idle",
					payload: {},
				});
			},
			() => {
				eventBus.emit({
					appId: "system",
					eventType: "user_active",
					payload: {},
				});
			},
		).then((stop) => {
			stopDetection = stop;
		}).catch(() => {
			// API unavailable — silent fallback
		});

		return () => {
			stopDetection?.();
		};
	}, []);
}

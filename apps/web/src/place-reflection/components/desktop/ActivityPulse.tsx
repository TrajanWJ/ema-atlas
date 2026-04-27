/**
 * RIP: place.org src/components/desktop/ActivityPulse.tsx
 *
 * Direct-rip with provenance. Only swap: subscribeToPlaceEvents import
 * redirected to `place-reflection/lib/place-events` (the EMA bus that
 * bridges daemon event streams + local emits).
 */

'use client';

import { useEffect, useState } from "react";
import { subscribeToPlaceEvents } from "../../lib/place-events";

/**
 * Activity Pulse — tiny breathing dot in the desktop corner that grows
 * brighter when commands have fired recently, dims when quiet. Ambient
 * feedback, no numbers.
 */
export function ActivityPulse() {
	const [intensity, setIntensity] = useState<number>(0);

	useEffect(() => {
		let decay: ReturnType<typeof setInterval> | null = null;

		const unsub = subscribeToPlaceEvents(() => {
			setIntensity((prev) => Math.min(1, prev + 0.35));
		});

		decay = setInterval(() => {
			setIntensity((prev) => Math.max(0, prev - 0.02));
		}, 250);

		return () => {
			unsub();
			if (decay) clearInterval(decay);
		};
	}, []);

	return (
		<div
			aria-hidden
			title="Activity pulse"
			style={{
				position: "fixed",
				top: "6px",
				right: "6px",
				width: "8px",
				height: "8px",
				borderRadius: "50%",
				background: `rgba(138, 180, 255, ${0.15 + intensity * 0.65})`,
				boxShadow: `0 0 ${4 + intensity * 8}px rgba(138, 180, 255, ${0.2 + intensity * 0.5})`,
				transition: "background 0.3s ease, box-shadow 0.3s ease",
				pointerEvents: "none",
				zIndex: 100,
			}}
		/>
	);
}

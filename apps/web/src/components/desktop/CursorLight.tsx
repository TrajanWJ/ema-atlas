'use client';

import { useCursorLight } from "@/src/hooks/use-cursor-light";

export function CursorLight() {
	const ref = useCursorLight();

	return (
		<div
			ref={ref}
			className="pointer-events-none absolute inset-0"
			style={{
				background:
					"radial-gradient(circle 300px at var(--cursor-x, 50%) var(--cursor-y, 50%), rgba(91,156,245,0.04), transparent)",
				zIndex: 1,
			}}
		/>
	);
}

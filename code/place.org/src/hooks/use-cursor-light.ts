'use client';

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

export function useCursorLight(): RefObject<HTMLDivElement | null> {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const handleMove = (e: MouseEvent) => {
			el.style.setProperty("--cursor-x", `${e.clientX}px`);
			el.style.setProperty("--cursor-y", `${e.clientY}px`);
		};

		window.addEventListener("mousemove", handleMove, { passive: true });
		return () => window.removeEventListener("mousemove", handleMove);
	}, []);

	return ref;
}

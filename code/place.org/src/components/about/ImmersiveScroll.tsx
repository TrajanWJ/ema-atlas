'use client';

import { useEffect } from "react";
import type { ReactNode } from "react";

interface ImmersiveScrollProps {
	readonly children: ReactNode;
}

/**
 * Enables body scrolling for immersive full-page routes.
 * The desktop layout sets overflow:hidden on body globally;
 * this component restores scroll for the immersive surface.
 */
export function ImmersiveScroll({ children }: ImmersiveScrollProps) {
	useEffect(() => {
		const prev = document.body.style.overflow;
		document.body.style.overflow = "auto";
		document.body.style.height = "auto";
		return () => {
			document.body.style.overflow = prev;
			document.body.style.height = "100dvh";
		};
	}, []);

	return <>{children}</>;
}

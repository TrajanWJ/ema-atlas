'use client';

import { useEffect } from "react";
import { useInboxStore } from "@/src/stores/inbox-store";
import { setFaviconBadge } from "@/src/lib/favicon-badge";

/**
 * Hook that syncs favicon badge with unprocessed inbox count
 * Uses Canvas-based favicon and progressive Badging API enhancement
 */
export function useFaviconBadge(): void {
	const items = useInboxStore((state) => state.items);

	useEffect(() => {
		const count = items.length;

		// Update canvas-based favicon
		setFaviconBadge(count);

		// Progressive enhancement: also use Badging API if available
		if ("setAppBadge" in navigator) {
			if (count > 0) {
				navigator.setAppBadge(count);
			} else {
				navigator.clearAppBadge?.();
			}
		}
	}, [items.length]);
}

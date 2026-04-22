'use client';

import { useEffect } from 'react';
import type { AppId } from '@/src/types/window';

/**
 * Reads a `?target=appId/itemId` query param on mount and opens the
 * corresponding app window, then cleans the URL.
 */
export function useProtocolHandler(): void {
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const target = params.get('target');
		if (!target) return;

		const [appId] = target.split('/');
		if (appId) {
			const { useWindowStore } = require('@/src/stores/window-store');
			useWindowStore.getState().openWindow(appId as AppId);
		}

		// Clean URL
		window.history.replaceState({}, '', window.location.pathname);
	}, []);
}

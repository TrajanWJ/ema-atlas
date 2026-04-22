'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/src/stores/settings-store';

/**
 * Syncs colorMode from settings to the data-theme attribute on <html>.
 * When set to 'auto', listens to the OS prefers-color-scheme media query
 * and updates the attribute reactively.
 */
export function useColorMode(): void {
	const colorMode = useSettingsStore((s) => s.colorMode);

	useEffect(() => {
		const root = document.documentElement;

		if (colorMode !== 'auto') {
			root.setAttribute('data-theme', colorMode);
			return;
		}

		const mq = window.matchMedia('(prefers-color-scheme: dark)');

		function apply(dark: boolean): void {
			root.setAttribute('data-theme', dark ? 'dark' : 'light');
		}

		apply(mq.matches);

		const handler = (e: MediaQueryListEvent) => apply(e.matches);
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	}, [colorMode]);
}

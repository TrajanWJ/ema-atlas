'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/src/stores/settings-store';

/**
 * Syncs fontWeight from settings to CSS custom properties on :root.
 * Sets --place-font-weight-base and --place-font-weight-heading (base + 200).
 */
export function useFontWeight(): void {
	const fontWeight = useSettingsStore((s) => s.fontWeight);

	useEffect(() => {
		const root = document.documentElement;
		root.style.setProperty('--place-font-weight-base', String(fontWeight));
		root.style.setProperty('--place-font-weight-heading', String(fontWeight + 200));
	}, [fontWeight]);
}

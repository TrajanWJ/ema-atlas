'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/src/stores/settings-store';

/**
 * Syncs fontFamily from settings to --place-font-sans on :root.
 */
export function useFontFamily(): void {
	const fontFamily = useSettingsStore((s) => s.fontFamily);

	useEffect(() => {
		document.documentElement.style.setProperty('--place-font-sans', fontFamily);
	}, [fontFamily]);
}

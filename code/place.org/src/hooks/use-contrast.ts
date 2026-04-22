'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/src/stores/settings-store';

/**
 * Syncs contrast from settings to the data-contrast attribute on <html>.
 */
export function useContrast(): void {
	const contrast = useSettingsStore((s) => s.contrast);

	useEffect(() => {
		document.documentElement.setAttribute('data-contrast', contrast);
	}, [contrast]);
}

'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/src/stores/settings-store';

/**
 * Syncs the fontSize setting (a px number) to document.documentElement.style.fontSize
 * so the entire UI scales via rem-based sizing.
 */
export function useFontSize(): void {
	const fontSize = useSettingsStore((s) => s.fontSize);

	useEffect(() => {
		document.documentElement.style.fontSize = `${fontSize}px`;
	}, [fontSize]);
}

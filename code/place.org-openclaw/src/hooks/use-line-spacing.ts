'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/src/stores/settings-store';

const LINE_HEIGHT_MAP = {
	compact:     1.3,
	comfortable: 1.5,
	spacious:    1.7,
} as const;

/**
 * Syncs lineSpacing from settings to --place-line-height on :root.
 */
export function useLineSpacing(): void {
	const lineSpacing = useSettingsStore((s) => s.lineSpacing);

	useEffect(() => {
		const value = LINE_HEIGHT_MAP[lineSpacing];
		document.documentElement.style.setProperty('--place-line-height', String(value));
	}, [lineSpacing]);
}

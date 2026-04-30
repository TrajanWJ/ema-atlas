'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/src/stores/settings-store';

/**
 * Syncs the windowCornerRadius setting to --place-window-radius CSS custom property.
 * Valid range: 0–28px (0 = square, 28 = fully pill-style at typical title bar height).
 */
export function useWindowRadius(): void {
	const radius = useSettingsStore((s) => s.windowCornerRadius);

	useEffect(() => {
		document.documentElement.style.setProperty(
			'--place-window-radius',
			`${radius}px`,
		);
	}, [radius]);
}

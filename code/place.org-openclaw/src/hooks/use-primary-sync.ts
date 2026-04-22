'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/src/stores/settings-store';
import { generateCssVars } from '@/src/lib/color-utils';

/**
 * Syncs primaryColor from the settings store to CSS custom properties on :root.
 * Sets --place-primary-* scale and keeps the legacy --accent-blue alias.
 */
export function usePrimarySync(): void {
	const primaryColor = useSettingsStore((s) => s.primaryColor);

	useEffect(() => {
		if (typeof document === 'undefined') return;
		const root = document.documentElement;
		const vars = generateCssVars(primaryColor, 'primary');
		for (const [prop, value] of Object.entries(vars)) {
			root.style.setProperty(prop, value);
		}
		// Legacy alias kept for backward compatibility
		root.style.setProperty('--accent-blue', primaryColor);
	}, [primaryColor]);
}

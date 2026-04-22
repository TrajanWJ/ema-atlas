'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/src/stores/settings-store';
import { generateCssVars } from '@/src/lib/color-utils';

// ---------------------------------------------------------------------------
// Accent color presets — exported so UI pickers can reference them
// ---------------------------------------------------------------------------

export const ACCENT_PRESETS = [
	{ name: 'Teal', value: '#2DD4A8' },
	{ name: 'Blue', value: '#6B95F0' },
	{ name: 'Purple', value: '#A78BFA' },
	{ name: 'Pink', value: '#F472B6' },
	{ name: 'Orange', value: '#F59E0B' },
	{ name: 'Red', value: '#EF4444' },
	{ name: 'Green', value: '#22C55E' },
] as const;

/**
 * Syncs accentColor from the settings store to --place-secondary-* CSS custom
 * properties on :root. The secondary scale is independent of the primary scale.
 */
export function useAccentSync(): void {
	const accentColor = useSettingsStore((s) => s.accentColor);

	useEffect(() => {
		if (typeof document === 'undefined') return;
		const root = document.documentElement;
		const vars = generateCssVars(accentColor, 'secondary');
		for (const [prop, value] of Object.entries(vars)) {
			root.style.setProperty(prop, value);
		}
	}, [accentColor]);
}

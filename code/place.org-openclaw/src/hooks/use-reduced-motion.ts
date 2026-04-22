'use client';

import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/src/stores/settings-store';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Returns true when animations should be disabled — either because the OS
 * prefers reduced motion OR because the user toggled off window animations
 * in the settings store.
 */
export function useReducedMotion(): boolean {
	const [osReduced, setOsReduced] = useState(false);
	const settingsDisabled = useSettingsStore((s) => !s.windowAnimations);

	useEffect(() => {
		const mql = window.matchMedia(QUERY);
		setOsReduced(mql.matches);

		const handler = (e: MediaQueryListEvent) => {
			setOsReduced(e.matches);
		};

		mql.addEventListener('change', handler);
		return () => mql.removeEventListener('change', handler);
	}, []);

	return osReduced || settingsDisabled;
}

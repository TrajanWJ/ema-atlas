'use client';

import { useSettingsStore } from '@/src/stores/settings-store';

/**
 * Returns the inactiveWindowOpacity setting.
 * Consumed directly by WindowManager rather than setting a CSS var,
 * since opacity needs to be applied per-window.
 */
export function useInactiveWindowOpacity(): number {
	return useSettingsStore((s) => s.inactiveWindowOpacity);
}

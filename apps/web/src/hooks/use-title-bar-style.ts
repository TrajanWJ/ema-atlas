'use client';

import { useSettingsStore } from '@/src/stores/settings-store';

/**
 * Returns the titleBarStyle setting.
 * Consumed by WindowTitleBar to control height and visibility.
 */
export function useTitleBarStyle(): 'default' | 'compact' | 'hidden' {
	return useSettingsStore((s) => s.titleBarStyle);
}

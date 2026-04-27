'use client';

import { useSettingsStore } from '@/src/stores/settings-store';

interface WallpaperFitResult {
	backgroundSize: string;
	backgroundRepeat: string;
}

const FIT_MAP = {
	cover:   { backgroundSize: 'cover',   backgroundRepeat: 'no-repeat' },
	contain: { backgroundSize: 'contain', backgroundRepeat: 'no-repeat' },
	fill:    { backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat' },
	tile:    { backgroundSize: 'auto',    backgroundRepeat: 'repeat' },
} as const satisfies Record<string, WallpaperFitResult>;

/**
 * Returns CSS background sizing properties for the current wallpaperFit setting.
 * Apply directly to the wallpaper image container's style prop.
 */
export function useWallpaperFit(): WallpaperFitResult {
	const wallpaperFit = useSettingsStore((s) => s.wallpaperFit);
	return FIT_MAP[wallpaperFit];
}

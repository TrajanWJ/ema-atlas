'use client';

import type { CSSProperties } from 'react';
import { useSettingsStore } from '@/src/stores/settings-store';
import { hexToRgb } from '@/src/lib/color-utils';

interface WallpaperTintResult {
	enabled: boolean;
	style: CSSProperties;
}

/**
 * Returns tint overlay config for the wallpaper layer.
 * Consumers render an absolutely-positioned div with the returned style
 * over the wallpaper image.
 */
export function useWallpaperTint(): WallpaperTintResult {
	const enabled = useSettingsStore((s) => s.wallpaperTint);
	const opacity = useSettingsStore((s) => s.wallpaperTintOpacity);
	const primaryColor = useSettingsStore((s) => s.primaryColor);

	const { r, g, b } = hexToRgb(primaryColor);

	return {
		enabled,
		style: {
			backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})`,
			mixBlendMode: 'color' as CSSProperties['mixBlendMode'],
		},
	};
}

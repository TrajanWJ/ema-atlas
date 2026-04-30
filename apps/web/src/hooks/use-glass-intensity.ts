'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/src/stores/settings-store';
import { hexToRgb } from '@/src/lib/color-utils';

// Base values for each tier (dark-tinted backgrounds for readability)
const BASE = {
	ambient:  { blur: 6,  r: 14, g: 16, b: 23, a: 0.4  },
	surface:  { blur: 20, r: 14, g: 16, b: 23, a: 0.55 },
	elevated: { blur: 28, r: 14, g: 16, b: 23, a: 0.65 },
	accent:   { blur: 32, r: 10, g: 30, b: 25, a: 0.60 },
} as const;

function bg(tier: keyof typeof BASE, intensity: number): string {
	const { r, g, b, a } = BASE[tier];
	// Clamp alpha between 0.2 and 0.9 regardless of intensity
	const alpha = Math.min(0.9, Math.max(0.2, a * intensity));
	return `rgba(${r},${g},${b}, ${alpha.toFixed(3)})`;
}

/**
 * Applies glass intensity, tint, and saturation to CSS custom properties on :root.
 * Glass classes in globals.css read these variables with fallback defaults.
 */
export function useGlassIntensity(): void {
	const intensity = useSettingsStore((s) => s.glassIntensity);
	const glassTint = useSettingsStore((s) => s.glassTint);
	const glassSaturation = useSettingsStore((s) => s.glassSaturation);
	const primaryColor = useSettingsStore((s) => s.primaryColor);

	useEffect(() => {
		const root = document.documentElement;

		// Blur and background per tier
		root.style.setProperty('--glass-blur-ambient', `${BASE.ambient.blur * intensity}px`);
		root.style.setProperty('--glass-blur-surface', `${BASE.surface.blur * intensity}px`);
		root.style.setProperty('--glass-blur-elevated', `${BASE.elevated.blur * intensity}px`);
		root.style.setProperty('--glass-blur-accent', `${BASE.accent.blur * intensity}px`);

		root.style.setProperty('--glass-bg-ambient', bg('ambient', intensity));
		root.style.setProperty('--glass-bg-surface', bg('surface', intensity));
		root.style.setProperty('--glass-bg-elevated', bg('elevated', intensity));
		root.style.setProperty('--glass-bg-accent', bg('accent', intensity));

		// Tint — uses primary color RGB with the glassTint value as alpha
		const { r, g, b } = hexToRgb(primaryColor);
		root.style.setProperty('--glass-tint', `rgba(${r}, ${g}, ${b}, ${glassTint})`);

		// Saturation — used in backdrop-filter: saturate(X)
		root.style.setProperty('--glass-saturation', String(glassSaturation));
	}, [intensity, glassTint, glassSaturation, primaryColor]);
}

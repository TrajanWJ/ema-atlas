'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/src/stores/settings-store';

// ---------------------------------------------------------------------------
// Color extraction helpers
// ---------------------------------------------------------------------------

/**
 * Converts {r,g,b} to an HSL saturation value (0–1).
 * Used to find the most vibrant pixel cluster.
 */
function rgbSaturation(r: number, g: number, b: number): number {
	const max = Math.max(r, g, b) / 255;
	const min = Math.min(r, g, b) / 255;
	const l = (max + min) / 2;
	if (max === min) return 0;
	const d = max - min;
	return l > 0.5 ? d / (2 - max - min) : d / (max + min);
}

/**
 * Converts {r,g,b} integers to a CSS hex string.
 */
function rgbToHex(r: number, g: number, b: number): string {
	return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Samples an image from a URL via an offscreen canvas and returns the
 * most saturated pixel color as a hex string. Returns null on failure.
 */
async function extractDominantColor(url: string): Promise<string | null> {
	return new Promise((resolve) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';

		img.onload = () => {
			try {
				const size = 64; // sample at low res for speed
				const canvas = document.createElement('canvas');
				canvas.width = size;
				canvas.height = size;
				const ctx = canvas.getContext('2d');
				if (!ctx) { resolve(null); return; }

				ctx.drawImage(img, 0, 0, size, size);
				const { data } = ctx.getImageData(0, 0, size, size);

				let bestSat = 0;
				let bestR = 128;
				let bestG = 128;
				let bestB = 128;

				for (let i = 0; i < data.length; i += 4) {
					const r = data[i] ?? 0;
					const g = data[i + 1] ?? 0;
					const b = data[i + 2] ?? 0;
					const a = data[i + 3] ?? 0;
					if (a < 128) continue; // skip transparent pixels
					const sat = rgbSaturation(r, g, b);
					if (sat > bestSat) {
						bestSat = sat;
						bestR = r;
						bestG = g;
						bestB = b;
					}
				}

				resolve(rgbToHex(bestR, bestG, bestB));
			} catch {
				resolve(null);
			}
		};

		img.onerror = () => {
			console.warn('[use-auto-accent] CORS or load failure — skipping auto-primary extraction');
			resolve(null);
		};

		img.src = url;
	});
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * When autoPrimaryFromWallpaper is enabled, watches the active wallpaper URL
 * and samples its dominant color, then updates primaryColor in settings.
 * Best-effort: CORS failures are logged and silently skipped.
 */
export function useAutoAccent(): void {
	const enabled = useSettingsStore((s) => s.autoPrimaryFromWallpaper);
	const wallpaper = useSettingsStore((s) => s.wallpaper);
	const customWallpaperUrl = useSettingsStore((s) => s.customWallpaperUrl);
	const setSetting = useSettingsStore((s) => s.setSetting);

	useEffect(() => {
		if (!enabled) return;

		// Determine the URL to sample
		let url: string | null = null;
		if (wallpaper === 'custom' && customWallpaperUrl) {
			url = customWallpaperUrl;
		}

		// Only custom wallpapers have a URL we can sample; built-in patterns
		// (dots, grid, gradient, etc.) have no image to extract from.
		if (!url) return;

		let cancelled = false;

		extractDominantColor(url).then((hex) => {
			if (!cancelled && hex) {
				setSetting('primaryColor', hex);
			}
		});

		return () => { cancelled = true; };
	}, [enabled, wallpaper, customWallpaperUrl, setSetting]);
}


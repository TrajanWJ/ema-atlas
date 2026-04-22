// ---------------------------------------------------------------------------
// Color conversion and generation utilities
// ---------------------------------------------------------------------------

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
	const raw = hex.replace('#', '');
	const r = parseInt(raw.substring(0, 2), 16) / 255;
	const g = parseInt(raw.substring(2, 4), 16) / 255;
	const b = parseInt(raw.substring(4, 6), 16) / 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;

	if (max === min) return { h: 0, s: 0, l };

	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

	let h = 0;
	if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
	else if (max === g) h = ((b - r) / d + 2) / 6;
	else h = ((r - g) / d + 4) / 6;

	return { h: h * 360, s, l };
}

export function hslToHex(h: number, s: number, l: number): string {
	const hNorm = ((h % 360) + 360) % 360;

	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1));
	const m = l - c / 2;

	let r = 0;
	let g = 0;
	let b = 0;

	if (hNorm < 60) { r = c; g = x; b = 0; }
	else if (hNorm < 120) { r = x; g = c; b = 0; }
	else if (hNorm < 180) { r = 0; g = c; b = x; }
	else if (hNorm < 240) { r = 0; g = x; b = c; }
	else if (hNorm < 300) { r = x; g = 0; b = c; }
	else { r = c; g = 0; b = x; }

	const toHex = (v: number) =>
		Math.round((v + m) * 255)
			.toString(16)
			.padStart(2, '0');

	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const raw = hex.replace('#', '');
	return {
		r: parseInt(raw.substring(0, 2), 16),
		g: parseInt(raw.substring(2, 4), 16),
		b: parseInt(raw.substring(4, 6), 16),
	};
}

export function adjustLightness(hex: string, amount: number): string {
	const { h, s, l } = hexToHsl(hex);
	return hslToHex(h, s, Math.max(0, Math.min(1, l + amount)));
}

// ---------------------------------------------------------------------------
// Scale generation
// ---------------------------------------------------------------------------

/**
 * Generates 7 lightness-shifted shades plus 3 alpha variants for a given hex
 * color. The base color maps to key '400'; all other shades are derived from it.
 *
 * Shade keys: '900' | '700' | '500' | '400' | '300' | '200' | '50'
 * Alpha keys: 'glow' | 'subtle' | 'border'
 */
export function generateColorScale(hex: string): Record<string, string> {
	const { r, g, b } = hexToRgb(hex);

	return {
		'400': hex,
		'300': adjustLightness(hex, 0.12),
		'200': adjustLightness(hex, 0.24),
		'50':  adjustLightness(hex, 0.36),
		'500': adjustLightness(hex, -0.06),
		'700': adjustLightness(hex, -0.18),
		'900': adjustLightness(hex, -0.30),
		glow:   `rgba(${r}, ${g}, ${b}, 0.25)`,
		subtle: `rgba(${r}, ${g}, ${b}, 0.10)`,
		border: `rgba(${r}, ${g}, ${b}, 0.20)`,
	};
}

/**
 * Wraps generateColorScale and returns CSS custom property names prefixed
 * with `--place-{prefix}-`.
 *
 * Example: generateCssVars('#0EA5E9', 'primary') returns
 *   { '--place-primary-400': '#0ea5e9', '--place-primary-glow': 'rgba(...)', … }
 */
export function generateCssVars(
	hex: string,
	prefix: string,
): Record<string, string> {
	const scale = generateColorScale(hex);
	return Object.fromEntries(
		Object.entries(scale).map(([key, value]) => [
			`--place-${prefix}-${key}`,
			value,
		]),
	);
}

// RN-flavored theme. Mirrors packages/tokens/src/index.ts literal color values.
// RN StyleSheet can't resolve `var(...)` or `color-mix()` — the web token file
// uses CSS custom properties and color-mix, so we resolve those to concrete
// hex values here. Keep in lockstep with tokens when they change.

export const theme = {
  colors: {
    // Brand palette
    brandInk: '#0A0A0B',
    brandInk2: '#1A1A1D',
    brandPaper: '#F6F5F0',
    brandCream: '#EDEBE0',
    brandTerra: '#E8552B',
    brandLime: '#D4F755',
    brandMoss: '#5C8F3A',
    brandSky: '#4B8FC9',
    brandRose: '#F2B5A0',

    // Surfaces (light; mobile defaults to light to match talent surface)
    bg: '#F6F5F0',
    bgRaised: '#FFFFFF',
    bgSunken: '#EDEBE0',
    bgContrast: '#0A0A0B',

    // Ink
    ink: '#111113',
    ink2: '#333338',
    ink3: '#555560',
    ink4: '#8A8A92',

    // Lines
    line: '#D9D7CE',
    lineSoft: '#E6E4DA',
    lineStrong: '#B0AEA4',

    // Accent
    accent: '#E8552B',
    accentInk: '#FFFFFF',
    // Approx resolution of color-mix(accent 12%, bg) — hand-picked warm cream.
    accentSoft: '#FADDD0',
    accentLine: '#D38568',

    // Semantic
    pos: '#3E7A2A',
    neg: '#C13A22',
    warn: '#B07C0E',
  },
  space: {
    0: 0,
    1: 2,
    2: 4,
    3: 8,
    4: 12,
    5: 16,
    6: 20,
    7: 24,
    8: 32,
    9: 40,
    10: 48,
    11: 64,
  },
  radius: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 14,
    full: 999,
  },
  type: {
    size: {
      xs: 11,
      sm: 13,
      base: 14,
      md: 15,
      lg: 17,
      xl: 20,
      '2xl': 26,
      '3xl': 34,
    },
  },
} as const;

export type Theme = typeof theme;

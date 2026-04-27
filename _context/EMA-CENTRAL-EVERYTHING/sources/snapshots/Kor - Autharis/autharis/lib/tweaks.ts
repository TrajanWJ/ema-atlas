export type Tweaks = {
  v: number;
  theme: 'light' | 'dark';
  accent: string;
  density: 'comfortable' | 'compact';
  matchVariant: 'hero' | 'dossier' | 'stack';
  copyVariant: 'editorial' | 'punchy' | 'serious' | 'warm';
};

export const DEFAULT_TWEAKS: Tweaks = {
  v: 5,
  theme: 'light',
  accent: '#17130C',
  density: 'comfortable',
  matchVariant: 'stack',
  copyVariant: 'editorial',
};

export const ACCENT_SWATCHES = [
  { name: 'Ink',        color: '#17130C' },
  { name: 'Terracotta', color: '#E8552B' },
  { name: 'Lime',       color: '#D4F755' },
  { name: 'Sky',        color: '#4B8FC9' },
  { name: 'Moss',       color: '#5C8F3A' },
  { name: 'Ochre',      color: '#E8B324' },
  { name: 'Magenta',    color: '#E84B8A' },
];

export const COPY_VARIANTS: [Tweaks['copyVariant'], string][] = [
  ['editorial', 'Editorial'],
  ['punchy',    'Punchy'],
  ['serious',   'Enterprise'],
  ['warm',      'Warm'],
];

export function readableOn(hex: string): string {
  if (!hex) return '#FFFFFF';
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i);
  if (!m) return '#FFFFFF';
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const toLin = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const L = 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
  return L > 0.42 ? '#0A0A0B' : '#FFFFFF';
}

export function lum(hex: string): number {
  if (!hex) return 0;
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i);
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const toLin = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

export function adjustHex(hex: string, pct: number): string {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = 1 + pct / 100;
  r = Math.max(0, Math.min(255, Math.round(r * f)));
  g = Math.max(0, Math.min(255, Math.round(g * f)));
  b = Math.max(0, Math.min(255, Math.round(b * f)));
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

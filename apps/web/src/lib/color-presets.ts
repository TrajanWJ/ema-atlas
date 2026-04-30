export const COLOR_PRESETS = [
	{ id: 'ocean',     name: 'Ocean',       primary: '#0EA5E9', accent: '#2DD4A8' },
	{ id: 'sunset',    name: 'Sunset',      primary: '#F97316', accent: '#EF4444' },
	{ id: 'forest',    name: 'Forest',      primary: '#22C55E', accent: '#16A34A' },
	{ id: 'neon',      name: 'Neon',        primary: '#A855F7', accent: '#EC4899' },
	{ id: 'mono',      name: 'Monochrome',  primary: '#94A3B8', accent: '#CBD5E1' },
	{ id: 'ember',     name: 'Ember',       primary: '#DC2626', accent: '#F59E0B' },
	{ id: 'midnight',  name: 'Midnight',    primary: '#6366F1', accent: '#8B5CF6' },
	{ id: 'rose',      name: 'Rose',        primary: '#F43F5E', accent: '#FB923C' },
] as const;

export type ColorPreset = typeof COLOR_PRESETS[number];

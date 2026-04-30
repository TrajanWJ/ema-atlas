// ---------------------------------------------------------------------------
// Theme Presets
// ---------------------------------------------------------------------------

export interface ThemePreset {
	readonly id: string;
	readonly name: string;
	readonly description: string;
	readonly tokens: Record<string, string>;
	readonly preview: {
		readonly void: string;
		readonly surface: string;
		readonly primary: string;
		readonly secondary: string;
		readonly text: string;
	};
}

// ---------------------------------------------------------------------------
// Helper to build a full token set from key colors
// ---------------------------------------------------------------------------

function buildTokens(opts: {
	void: string;
	base: string;
	surface1: string;
	surface2: string;
	surface3: string;
	primary400: string;
	primary500: string;
	primaryGlow: string;
	primarySubtle: string;
	primaryBorder: string;
	secondary400: string;
	secondary500: string;
	secondaryGlow: string;
	secondarySubtle: string;
	secondaryBorder: string;
	textPrimary: string;
	textSecondary: string;
	textTertiary: string;
	textMuted: string;
	borderDefault: string;
	borderSubtle: string;
	borderStrong: string;
}): Record<string, string> {
	return {
		'--place-void': opts.void,
		'--place-base': opts.base,
		'--place-surface-1': opts.surface1,
		'--place-surface-2': opts.surface2,
		'--place-surface-3': opts.surface3,
		'--place-primary-400': opts.primary400,
		'--place-primary-500': opts.primary500,
		'--place-primary-glow': opts.primaryGlow,
		'--place-primary-subtle': opts.primarySubtle,
		'--place-primary-border': opts.primaryBorder,
		'--place-secondary-400': opts.secondary400,
		'--place-secondary-500': opts.secondary500,
		'--place-secondary-glow': opts.secondaryGlow,
		'--place-secondary-subtle': opts.secondarySubtle,
		'--place-secondary-border': opts.secondaryBorder,
		'--place-text-primary': opts.textPrimary,
		'--place-text-secondary': opts.textSecondary,
		'--place-text-tertiary': opts.textTertiary,
		'--place-text-muted': opts.textMuted,
		'--place-border-default': opts.borderDefault,
		'--place-border-subtle': opts.borderSubtle,
		'--place-border-strong': opts.borderStrong,
	};
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

export const THEME_PRESETS: readonly ThemePreset[] = [
	{
		id: 'default',
		name: 'Midnight Teal',
		description: 'Default dark theme with teal accents',
		preview: { void: '#060610', surface: '#0E1017', primary: '#2DD4A8', secondary: '#6B95F0', text: 'rgba(255,255,255,0.87)' },
		tokens: buildTokens({
			void: '#060610',
			base: '#08090E',
			surface1: '#0E1017',
			surface2: '#141620',
			surface3: '#1A1D2A',
			primary400: '#2DD4A8',
			primary500: '#0D9373',
			primaryGlow: 'rgba(13,147,115,0.25)',
			primarySubtle: 'rgba(13,147,115,0.10)',
			primaryBorder: 'rgba(45,212,168,0.20)',
			secondary400: '#6B95F0',
			secondary500: '#4B7BE5',
			secondaryGlow: 'rgba(75,123,229,0.25)',
			secondarySubtle: 'rgba(75,123,229,0.10)',
			secondaryBorder: 'rgba(107,149,240,0.20)',
			textPrimary: 'rgba(255,255,255,0.87)',
			textSecondary: 'rgba(255,255,255,0.60)',
			textTertiary: 'rgba(255,255,255,0.40)',
			textMuted: 'rgba(255,255,255,0.25)',
			borderDefault: 'rgba(255,255,255,0.08)',
			borderSubtle: 'rgba(255,255,255,0.04)',
			borderStrong: 'rgba(255,255,255,0.15)',
		}),
	},
	{
		id: 'nord',
		name: 'Nord',
		description: 'Arctic blue palette inspired by Nordic aesthetics',
		preview: { void: '#2E3440', surface: '#3B4252', primary: '#88C0D0', secondary: '#5E81AC', text: '#ECEFF4' },
		tokens: buildTokens({
			void: '#2E3440',
			base: '#2E3440',
			surface1: '#3B4252',
			surface2: '#434C5E',
			surface3: '#4C566A',
			primary400: '#88C0D0',
			primary500: '#6BAAB8',
			primaryGlow: 'rgba(136,192,208,0.25)',
			primarySubtle: 'rgba(136,192,208,0.10)',
			primaryBorder: 'rgba(136,192,208,0.20)',
			secondary400: '#5E81AC',
			secondary500: '#4A6D98',
			secondaryGlow: 'rgba(94,129,172,0.25)',
			secondarySubtle: 'rgba(94,129,172,0.10)',
			secondaryBorder: 'rgba(94,129,172,0.20)',
			textPrimary: '#ECEFF4',
			textSecondary: '#D8DEE9',
			textTertiary: 'rgba(216,222,233,0.60)',
			textMuted: 'rgba(216,222,233,0.35)',
			borderDefault: 'rgba(236,239,244,0.10)',
			borderSubtle: 'rgba(236,239,244,0.05)',
			borderStrong: 'rgba(236,239,244,0.18)',
		}),
	},
	{
		id: 'catppuccin-mocha',
		name: 'Catppuccin Mocha',
		description: 'Warm pastel palette with mauve accents',
		preview: { void: '#1E1E2E', surface: '#313244', primary: '#CBA6F7', secondary: '#89B4FA', text: '#CDD6F4' },
		tokens: buildTokens({
			void: '#1E1E2E',
			base: '#1E1E2E',
			surface1: '#313244',
			surface2: '#45475A',
			surface3: '#585B70',
			primary400: '#CBA6F7',
			primary500: '#B48EE0',
			primaryGlow: 'rgba(203,166,247,0.25)',
			primarySubtle: 'rgba(203,166,247,0.10)',
			primaryBorder: 'rgba(203,166,247,0.20)',
			secondary400: '#89B4FA',
			secondary500: '#6D9CE6',
			secondaryGlow: 'rgba(137,180,250,0.25)',
			secondarySubtle: 'rgba(137,180,250,0.10)',
			secondaryBorder: 'rgba(137,180,250,0.20)',
			textPrimary: '#CDD6F4',
			textSecondary: '#BAC2DE',
			textTertiary: 'rgba(186,194,222,0.60)',
			textMuted: 'rgba(186,194,222,0.35)',
			borderDefault: 'rgba(205,214,244,0.10)',
			borderSubtle: 'rgba(205,214,244,0.05)',
			borderStrong: 'rgba(205,214,244,0.18)',
		}),
	},
	{
		id: 'dracula',
		name: 'Dracula',
		description: 'Classic dark theme with purple and cyan',
		preview: { void: '#282A36', surface: '#44475A', primary: '#BD93F9', secondary: '#8BE9FD', text: '#F8F8F2' },
		tokens: buildTokens({
			void: '#282A36',
			base: '#282A36',
			surface1: '#44475A',
			surface2: '#4D5066',
			surface3: '#565972',
			primary400: '#BD93F9',
			primary500: '#A67CE2',
			primaryGlow: 'rgba(189,147,249,0.25)',
			primarySubtle: 'rgba(189,147,249,0.10)',
			primaryBorder: 'rgba(189,147,249,0.20)',
			secondary400: '#8BE9FD',
			secondary500: '#6DD4E8',
			secondaryGlow: 'rgba(139,233,253,0.25)',
			secondarySubtle: 'rgba(139,233,253,0.10)',
			secondaryBorder: 'rgba(139,233,253,0.20)',
			textPrimary: '#F8F8F2',
			textSecondary: 'rgba(248,248,242,0.75)',
			textTertiary: 'rgba(248,248,242,0.50)',
			textMuted: 'rgba(248,248,242,0.30)',
			borderDefault: 'rgba(248,248,242,0.10)',
			borderSubtle: 'rgba(248,248,242,0.05)',
			borderStrong: 'rgba(248,248,242,0.18)',
		}),
	},
	{
		id: 'tokyo-night',
		name: 'Tokyo Night',
		description: 'Neon-lit cityscape blues and purples',
		preview: { void: '#1A1B26', surface: '#24283B', primary: '#7AA2F7', secondary: '#BB9AF7', text: '#C0CAF5' },
		tokens: buildTokens({
			void: '#1A1B26',
			base: '#1A1B26',
			surface1: '#24283B',
			surface2: '#2F3348',
			surface3: '#3B3F54',
			primary400: '#7AA2F7',
			primary500: '#5E8AE0',
			primaryGlow: 'rgba(122,162,247,0.25)',
			primarySubtle: 'rgba(122,162,247,0.10)',
			primaryBorder: 'rgba(122,162,247,0.20)',
			secondary400: '#BB9AF7',
			secondary500: '#A47EE0',
			secondaryGlow: 'rgba(187,154,247,0.25)',
			secondarySubtle: 'rgba(187,154,247,0.10)',
			secondaryBorder: 'rgba(187,154,247,0.20)',
			textPrimary: '#C0CAF5',
			textSecondary: '#A9B1D6',
			textTertiary: 'rgba(169,177,214,0.60)',
			textMuted: 'rgba(169,177,214,0.35)',
			borderDefault: 'rgba(192,202,245,0.10)',
			borderSubtle: 'rgba(192,202,245,0.05)',
			borderStrong: 'rgba(192,202,245,0.18)',
		}),
	},
	{
		id: 'rose-pine',
		name: 'Rose Pine',
		description: 'Elegant dark with warm rose and iris accents',
		preview: { void: '#191724', surface: '#26233A', primary: '#EBBCBA', secondary: '#C4A7E7', text: '#E0DEF4' },
		tokens: buildTokens({
			void: '#191724',
			base: '#191724',
			surface1: '#1F1D2E',
			surface2: '#26233A',
			surface3: '#2A2740',
			primary400: '#EBBCBA',
			primary500: '#D4A5A3',
			primaryGlow: 'rgba(235,188,186,0.25)',
			primarySubtle: 'rgba(235,188,186,0.10)',
			primaryBorder: 'rgba(235,188,186,0.20)',
			secondary400: '#C4A7E7',
			secondary500: '#AD90D0',
			secondaryGlow: 'rgba(196,167,231,0.25)',
			secondarySubtle: 'rgba(196,167,231,0.10)',
			secondaryBorder: 'rgba(196,167,231,0.20)',
			textPrimary: '#E0DEF4',
			textSecondary: '#908CAA',
			textTertiary: 'rgba(144,140,170,0.70)',
			textMuted: 'rgba(144,140,170,0.40)',
			borderDefault: 'rgba(224,222,244,0.10)',
			borderSubtle: 'rgba(224,222,244,0.05)',
			borderStrong: 'rgba(224,222,244,0.18)',
		}),
	},
	{
		id: 'solarized-dark',
		name: 'Solarized Dark',
		description: 'Precision-engineered dark scheme by Ethan Schoonover',
		preview: { void: '#002B36', surface: '#073642', primary: '#2AA198', secondary: '#268BD2', text: '#839496' },
		tokens: buildTokens({
			void: '#002B36',
			base: '#002B36',
			surface1: '#073642',
			surface2: '#0A3F4C',
			surface3: '#0E4856',
			primary400: '#2AA198',
			primary500: '#1F8A82',
			primaryGlow: 'rgba(42,161,152,0.25)',
			primarySubtle: 'rgba(42,161,152,0.10)',
			primaryBorder: 'rgba(42,161,152,0.20)',
			secondary400: '#268BD2',
			secondary500: '#1A74B8',
			secondaryGlow: 'rgba(38,139,210,0.25)',
			secondarySubtle: 'rgba(38,139,210,0.10)',
			secondaryBorder: 'rgba(38,139,210,0.20)',
			textPrimary: '#839496',
			textSecondary: '#657B83',
			textTertiary: 'rgba(101,123,131,0.70)',
			textMuted: 'rgba(101,123,131,0.40)',
			borderDefault: 'rgba(131,148,150,0.12)',
			borderSubtle: 'rgba(131,148,150,0.06)',
			borderStrong: 'rgba(131,148,150,0.22)',
		}),
	},
	{
		id: 'gruvbox-dark',
		name: 'Gruvbox Dark',
		description: 'Retro groove with warm earthy greens and oranges',
		preview: { void: '#282828', surface: '#3C3836', primary: '#B8BB26', secondary: '#83A598', text: '#EBDBB2' },
		tokens: buildTokens({
			void: '#282828',
			base: '#282828',
			surface1: '#3C3836',
			surface2: '#504945',
			surface3: '#665C54',
			primary400: '#B8BB26',
			primary500: '#98971A',
			primaryGlow: 'rgba(184,187,38,0.25)',
			primarySubtle: 'rgba(184,187,38,0.10)',
			primaryBorder: 'rgba(184,187,38,0.20)',
			secondary400: '#83A598',
			secondary500: '#689D6A',
			secondaryGlow: 'rgba(131,165,152,0.25)',
			secondarySubtle: 'rgba(131,165,152,0.10)',
			secondaryBorder: 'rgba(131,165,152,0.20)',
			textPrimary: '#EBDBB2',
			textSecondary: '#D5C4A1',
			textTertiary: 'rgba(213,196,161,0.60)',
			textMuted: 'rgba(213,196,161,0.35)',
			borderDefault: 'rgba(235,219,178,0.10)',
			borderSubtle: 'rgba(235,219,178,0.05)',
			borderStrong: 'rgba(235,219,178,0.18)',
		}),
	},
	{
		id: 'one-dark',
		name: 'One Dark',
		description: 'Atom-inspired balanced dark with blue accents',
		preview: { void: '#282C34', surface: '#31353F', primary: '#61AFEF', secondary: '#C678DD', text: '#ABB2BF' },
		tokens: buildTokens({
			void: '#282C34',
			base: '#282C34',
			surface1: '#31353F',
			surface2: '#3A3F4B',
			surface3: '#434854',
			primary400: '#61AFEF',
			primary500: '#4A97D8',
			primaryGlow: 'rgba(97,175,239,0.25)',
			primarySubtle: 'rgba(97,175,239,0.10)',
			primaryBorder: 'rgba(97,175,239,0.20)',
			secondary400: '#C678DD',
			secondary500: '#AF62C6',
			secondaryGlow: 'rgba(198,120,221,0.25)',
			secondarySubtle: 'rgba(198,120,221,0.10)',
			secondaryBorder: 'rgba(198,120,221,0.20)',
			textPrimary: '#ABB2BF',
			textSecondary: '#8B929E',
			textTertiary: 'rgba(139,146,158,0.70)',
			textMuted: 'rgba(139,146,158,0.40)',
			borderDefault: 'rgba(171,178,191,0.10)',
			borderSubtle: 'rgba(171,178,191,0.05)',
			borderStrong: 'rgba(171,178,191,0.18)',
		}),
	},
	{
		id: 'monochrome',
		name: 'Monochrome',
		description: 'Pure black and white, zero color distraction',
		preview: { void: '#0A0A0A', surface: '#161616', primary: '#FFFFFF', secondary: '#888888', text: '#E0E0E0' },
		tokens: buildTokens({
			void: '#0A0A0A',
			base: '#0F0F0F',
			surface1: '#161616',
			surface2: '#1E1E1E',
			surface3: '#262626',
			primary400: '#FFFFFF',
			primary500: '#CCCCCC',
			primaryGlow: 'rgba(255,255,255,0.15)',
			primarySubtle: 'rgba(255,255,255,0.06)',
			primaryBorder: 'rgba(255,255,255,0.18)',
			secondary400: '#888888',
			secondary500: '#666666',
			secondaryGlow: 'rgba(136,136,136,0.20)',
			secondarySubtle: 'rgba(136,136,136,0.08)',
			secondaryBorder: 'rgba(136,136,136,0.18)',
			textPrimary: '#E0E0E0',
			textSecondary: '#A0A0A0',
			textTertiary: 'rgba(160,160,160,0.60)',
			textMuted: 'rgba(160,160,160,0.35)',
			borderDefault: 'rgba(255,255,255,0.08)',
			borderSubtle: 'rgba(255,255,255,0.04)',
			borderStrong: 'rgba(255,255,255,0.15)',
		}),
	},
] as const;

// ---------------------------------------------------------------------------
// Lookup helper
// ---------------------------------------------------------------------------

export function getPresetById(id: string): ThemePreset | undefined {
	return THEME_PRESETS.find((p) => p.id === id);
}

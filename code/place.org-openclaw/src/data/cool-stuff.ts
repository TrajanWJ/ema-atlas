export type CoolStuffCategory =
	| 'tools'
	| 'sites'
	| 'articles'
	| 'experiments'
	| 'resources';

export type CoolStuffSize = 'normal' | 'large';

export interface CoolStuffItem {
	readonly id: string;
	readonly title: string;
	readonly url: string;
	readonly description: string;
	readonly category: CoolStuffCategory;
	readonly size: CoolStuffSize;
}

export const CATEGORY_COLORS = {
	tools: '#5b9cf5',
	sites: '#38c97a',
	articles: '#e8a84c',
	experiments: '#b88fff',
	resources: '#888',
} as const satisfies Record<CoolStuffCategory, string>;

export const COOL_STUFF: readonly CoolStuffItem[] = [
	{
		id: '1',
		title: 'Poolsuite',
		url: 'https://poolsuite.net',
		description: 'Retro internet radio — the OS metaphor that started it all',
		category: 'sites',
		size: 'large',
	},
	{
		id: '2',
		title: 'yoyotools',
		url: 'https://www.yoyotools.com',
		description: '71+ free browser-based tools. Local-first, no login.',
		category: 'tools',
		size: 'normal',
	},
	{
		id: '3',
		title: 'WebGardens',
		url: 'https://www.webgardens.net/webtools/',
		description: 'Curated indie web tools for product creators',
		category: 'tools',
		size: 'normal',
	},
	{
		id: '4',
		title: 'Lando Norris',
		url: 'https://landonorris.com',
		description: 'Best personal brand site on the web. Lenis + Rive + GSAP.',
		category: 'sites',
		size: 'large',
	},
	{
		id: '5',
		title: 'henry.codes',
		url: 'https://henry.codes',
		description: 'Digital garden — personal values front and center',
		category: 'sites',
		size: 'normal',
	},
	{
		id: '6',
		title: "Cameron's World",
		url: 'https://www.cameronsworld.net',
		description: 'GeoCities archaeology. The internet before brands.',
		category: 'experiments',
		size: 'normal',
	},
	{
		id: '7',
		title: 'Almost Studio',
		url: 'https://www.almost.studio',
		description: 'Cursor painting as navigation. Draw feature in the nav.',
		category: 'experiments',
		size: 'normal',
	},
	{
		id: '8',
		title: 'The Deep Sea',
		url: 'https://neal.fun/deep-sea/',
		description: 'Scroll = depth. Progressive disclosure as spatial metaphor.',
		category: 'experiments',
		size: 'large',
	},
	{
		id: '9',
		title: 'Patatap',
		url: 'https://patatap.com',
		description: 'Key presses trigger sound + animation. Minimal input, rich output.',
		category: 'experiments',
		size: 'normal',
	},
	{
		id: '10',
		title: 'Mobbin',
		url: 'https://mobbin.com',
		description: 'Design reference library with OCR-powered text search',
		category: 'tools',
		size: 'normal',
	},
	{
		id: '11',
		title: 'Awwwards Experimental',
		url: 'https://www.awwwards.com/websites/experimental/',
		description: 'Firehose of cutting-edge interactive web',
		category: 'resources',
		size: 'normal',
	},
	{
		id: '12',
		title: 'Godly',
		url: 'https://godly.website',
		description: 'Curated gallery of delightfully weird sites',
		category: 'resources',
		size: 'normal',
	},
	{
		id: '13',
		title: 'Chus Margallo',
		url: 'https://chusmargallo.space',
		description: 'Interactive Desktop Experience — portfolio as OS',
		category: 'sites',
		size: 'normal',
	},
	{
		id: '14',
		title: 'Adrien Lamy',
		url: 'https://adrienlamy.fr',
		description: 'Hand-drawn sprites + kinetic typography + GSAP',
		category: 'sites',
		size: 'normal',
	},
	{
		id: '15',
		title: 'Bruno Simon',
		url: 'https://bruno-simon.com',
		description: 'Drive a car through your portfolio. Three.js masterpiece.',
		category: 'experiments',
		size: 'large',
	},
	{
		id: '16',
		title: 'Logartis',
		url: 'https://logartis.info',
		description: 'Full-stack dev + illustrator. Bespoke micro-illustrations.',
		category: 'sites',
		size: 'normal',
	},
	{
		id: '17',
		title: 'ZenScape',
		url: 'https://zenscape.one',
		description: 'No-login productivity workspace. Local-first calm design.',
		category: 'tools',
		size: 'normal',
	},
	{
		id: '18',
		title: 'Super Productivity',
		url: 'https://super-productivity.com',
		description: 'Open source, no telemetry. Syncs via file/WebDAV.',
		category: 'tools',
		size: 'normal',
	},
	{
		id: '19',
		title: 'Carrd',
		url: 'https://carrd.co',
		description: 'Ultra-tight single-screen information architecture',
		category: 'tools',
		size: 'normal',
	},
	{
		id: '20',
		title: 'BentoGrids',
		url: 'https://bentogrids.com',
		description: 'Bento layout inspiration gallery',
		category: 'resources',
		size: 'normal',
	},
] as const;

export const ALL_CATEGORIES: readonly CoolStuffCategory[] = [
	'tools',
	'sites',
	'articles',
	'experiments',
	'resources',
] as const;

export type Person = {
	name: string;
	url: string;
	urlLabel: string;
};

export type Organization = {
	name: string;
	description: string;
	url: string;
};

export type Service = {
	name: string;
	description: string;
	url: string;
};

export const people = [
	{
		name: "Allen Varney",
		url: "https://allenvarney.com",
		urlLabel: "allenvarney.com",
	},
	{
		name: "Paul",
		url: "https://paul.place.org",
		urlLabel: "paul.place.org",
	},
	{
		name: "Elizabeth Wiley",
		url: "https://elizabethwiley.com",
		urlLabel: "elizabethwiley.com",
	},
	{
		name: "Kusco",
		url: "https://kusco.place.org",
		urlLabel: "kusco.place.org",
	},
	{
		name: "Zachary",
		url: "https://zachary.place.org",
		urlLabel: "zachary.place.org",
	},
] as const satisfies readonly Person[];

export const organizations = [
	{
		name: "Texas Juggling Society",
		description:
			"The statewide community for jugglers across Texas — conventions, clubs, and skill jams.",
		url: "https://www.texasjugglers.org",
	},
	{
		name: "Multiplexing.org",
		description:
			"A resource dedicated to multiplexing juggling technique — throwing multiple objects simultaneously.",
		url: "https://multiplexing.org",
	},
	{
		name: "Siteswap.org",
		description:
			"Interactive juggling pattern visualization using the siteswap notation system.",
		url: "https://siteswap.org",
	},
	{
		name: "KoFightClub",
		description:
			"Webcomic meets board gaming community — tactical fun and creative storytelling.",
		url: "https://kofightclub.com",
	},
] as const satisfies readonly Organization[];

export const services = [
	{
		name: "Searx",
		description:
			"Privacy-focused metasearch engine. No tracking, no profiling — just results.",
		url: "https://searx.place.org",
	},
	{
		name: "Commafeed",
		description:
			"Open-source RSS reader. Follow the feeds that matter without algorithmic interference.",
		url: "https://commafeed.place.org",
	},
	{
		name: "Hubzilla",
		description:
			"Federated social network and personal cloud. Own your identity on the open web.",
		url: "https://hubzilla.place.org",
	},
] as const satisfies readonly Service[];

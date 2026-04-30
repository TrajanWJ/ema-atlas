import { create } from "zustand";
import { parseRssFeed } from "@/src/lib/rss-parser";
import { userKey } from "@/src/lib/user-storage";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface RssFeed {
	readonly id: string;
	readonly url: string;
	readonly title: string;
	readonly description: string;
	readonly favicon: string | null;
	readonly lastFetched: number | null;
}

export interface RssItem {
	readonly id: string;
	readonly feedId: string;
	readonly title: string;
	readonly link: string;
	readonly description: string;
	readonly pubDate: number;
	readonly read: boolean;
	readonly starred: boolean;
	readonly thumbnail: string | null;
}

interface RssState {
	readonly feeds: RssFeed[];
	readonly items: RssItem[];
	readonly activeFeedId: string | null;
	readonly activeItemId: string | null;
	readonly loading: boolean;
}

interface RssActions {
	addFeed(url: string): Promise<void>;
	removeFeed(feedId: string): void;
	refreshFeed(feedId: string): Promise<void>;
	refreshAll(): Promise<void>;
	markRead(itemId: string): void;
	markAllRead(feedId: string | null): void;
	toggleStar(itemId: string): void;
	setActiveFeed(feedId: string | null): void;
	setActiveItem(itemId: string | null): void;
	loadPersistedFeeds(): Promise<void>;
}

// ----------------------------------------------------------------------------
// Persistence
// ----------------------------------------------------------------------------

const STORAGE_KEY = "place-rss-feeds";
const STARRED_KEY = "place-rss-starred";
const READ_KEY = "place-rss-read";

function loadFeeds(): RssFeed[] {
	try {
		const raw = localStorage.getItem(userKey(STORAGE_KEY));
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function saveFeeds(feeds: readonly RssFeed[]): void {
	try {
		localStorage.setItem(userKey(STORAGE_KEY), JSON.stringify(feeds));
	} catch {
		/* quota */
	}
}

function loadStarred(): Set<string> {
	try {
		const raw = localStorage.getItem(userKey(STARRED_KEY));
		return raw ? new Set(JSON.parse(raw)) : new Set();
	} catch {
		return new Set();
	}
}

function saveStarred(ids: Set<string>): void {
	try {
		localStorage.setItem(userKey(STARRED_KEY), JSON.stringify([...ids]));
	} catch {
		/* quota */
	}
}

function loadReadIds(): Set<string> {
	try {
		const raw = localStorage.getItem(userKey(READ_KEY));
		return raw ? new Set(JSON.parse(raw)) : new Set();
	} catch {
		return new Set();
	}
}

function saveReadIds(ids: Set<string>): void {
	try {
		localStorage.setItem(userKey(READ_KEY), JSON.stringify([...ids]));
	} catch {
		/* quota */
	}
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function feedId(url: string): string {
	return url.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 64);
}

function itemId(feedUrlId: string, link: string, title: string): string {
	const raw = `${feedUrlId}:${link || title}`;
	// Simple hash
	let hash = 0;
	for (let i = 0; i < raw.length; i++) {
		hash = (hash * 31 + raw.charCodeAt(i)) | 0;
	}
	return `${feedUrlId}_${Math.abs(hash).toString(36)}`;
}

function faviconUrl(feedUrl: string): string | null {
	try {
		const u = new URL(feedUrl);
		return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
	} catch {
		return null;
	}
}

async function fetchFeedXml(url: string): Promise<string> {
	const proxyUrl = `/api/rss?url=${encodeURIComponent(url)}`;
	const resp = await fetch(proxyUrl);
	if (!resp.ok) {
		const body: unknown = await resp.json().catch(() => null);
		const msg =
			body && typeof body === "object" && "error" in body
				? String((body as Record<string, unknown>).error)
				: `HTTP ${resp.status}`;
		throw new Error(msg);
	}
	return resp.text();
}

// ----------------------------------------------------------------------------
// Default feeds
// ----------------------------------------------------------------------------

const DEFAULT_FEEDS: readonly { url: string }[] = [
	{ url: "https://hnrss.org/frontpage" },
	{ url: "https://techcrunch.com/feed/" },
	{ url: "https://css-tricks.com/feed/" },
];

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useRssStore = create<RssState & RssActions>((set, get) => ({
	feeds: [],
	items: [],
	activeFeedId: null,
	activeItemId: null,
	loading: false,

	async loadPersistedFeeds() {
		const persisted = loadFeeds();
		const feedsToLoad =
			persisted.length > 0
				? persisted
				: DEFAULT_FEEDS.map((f) => ({
						id: feedId(f.url),
						url: f.url,
						title: f.url,
						description: "",
						favicon: faviconUrl(f.url),
						lastFetched: null,
					}));

		if (persisted.length === 0) {
			saveFeeds(feedsToLoad);
		}

		set({ feeds: feedsToLoad, loading: true });

		// Fetch all feeds in parallel
		const promises = feedsToLoad.map((feed) =>
			get().refreshFeed(feed.id).catch(() => {
				/* ignore individual failures */
			}),
		);
		await Promise.allSettled(promises);
		set({ loading: false });
	},

	async addFeed(url: string) {
		const id = feedId(url);
		const { feeds } = get();

		if (feeds.some((f) => f.id === id)) return;

		set({ loading: true });

		try {
			const xml = await fetchFeedXml(url);
			const parsed = parseRssFeed(xml);
			const starredIds = loadStarred();
			const readIds = loadReadIds();

			const feed: RssFeed = {
				id,
				url,
				title: parsed.title || url,
				description: parsed.description,
				favicon: faviconUrl(url),
				lastFetched: Date.now(),
			};

			const newItems: RssItem[] = parsed.items.map((item) => {
				const iid = itemId(id, item.link, item.title);
				return {
					id: iid,
					feedId: id,
					title: item.title,
					link: item.link,
					description: item.description,
					pubDate: item.pubDate,
					read: readIds.has(iid),
					starred: starredIds.has(iid),
					thumbnail: item.thumbnail,
				};
			});

			const updatedFeeds = [...get().feeds, feed];
			saveFeeds(updatedFeeds);

			set((s) => ({
				feeds: updatedFeeds,
				items: [...s.items, ...newItems],
				loading: false,
			}));
		} catch (err) {
			set({ loading: false });
			throw err;
		}
	},

	removeFeed(feedIdToRemove: string) {
		const updatedFeeds = get().feeds.filter((f) => f.id !== feedIdToRemove);
		saveFeeds(updatedFeeds);

		set((s) => ({
			feeds: updatedFeeds,
			items: s.items.filter((i) => i.feedId !== feedIdToRemove),
			activeFeedId:
				s.activeFeedId === feedIdToRemove ? null : s.activeFeedId,
			activeItemId:
				s.items.find((i) => i.id === s.activeItemId)?.feedId ===
				feedIdToRemove
					? null
					: s.activeItemId,
		}));
	},

	async refreshFeed(feedIdToRefresh: string) {
		const feed = get().feeds.find((f) => f.id === feedIdToRefresh);
		if (!feed) return;

		const xml = await fetchFeedXml(feed.url);
		const parsed = parseRssFeed(xml);
		const starredIds = loadStarred();
		const readIds = loadReadIds();

		const newItems: RssItem[] = parsed.items.map((item) => {
			const iid = itemId(feed.id, item.link, item.title);
			return {
				id: iid,
				feedId: feed.id,
				title: item.title,
				link: item.link,
				description: item.description,
				pubDate: item.pubDate,
				read: readIds.has(iid),
				starred: starredIds.has(iid),
				thumbnail: item.thumbnail,
			};
		});

		const updatedFeed: RssFeed = {
			...feed,
			title: parsed.title || feed.title,
			description: parsed.description || feed.description,
			lastFetched: Date.now(),
		};

		set((s) => ({
			feeds: s.feeds.map((f) =>
				f.id === feedIdToRefresh ? updatedFeed : f,
			),
			items: [
				...s.items.filter((i) => i.feedId !== feedIdToRefresh),
				...newItems,
			],
		}));

		saveFeeds(
			get().feeds,
		);
	},

	async refreshAll() {
		set({ loading: true });
		const { feeds } = get();
		await Promise.allSettled(
			feeds.map((f) => get().refreshFeed(f.id).catch(() => {})),
		);
		set({ loading: false });
	},

	markRead(mid: string) {
		const readIds = loadReadIds();
		readIds.add(mid);
		saveReadIds(readIds);

		set((s) => ({
			items: s.items.map((i) =>
				i.id === mid ? { ...i, read: true } : i,
			),
		}));
	},

	markAllRead(fid: string | null) {
		const readIds = loadReadIds();

		set((s) => ({
			items: s.items.map((i) => {
				if (fid !== null && i.feedId !== fid) return i;
				if (i.read) return i;
				readIds.add(i.id);
				return { ...i, read: true };
			}),
		}));

		saveReadIds(readIds);
	},

	toggleStar(mid: string) {
		const starredIds = loadStarred();
		let newStarred: boolean;

		if (starredIds.has(mid)) {
			starredIds.delete(mid);
			newStarred = false;
		} else {
			starredIds.add(mid);
			newStarred = true;
		}
		saveStarred(starredIds);

		set((s) => ({
			items: s.items.map((i) =>
				i.id === mid ? { ...i, starred: newStarred } : i,
			),
		}));
	},

	setActiveFeed(fid: string | null) {
		set({ activeFeedId: fid, activeItemId: null });
	},

	setActiveItem(mid: string | null) {
		if (mid) {
			get().markRead(mid);
		}
		set({ activeItemId: mid });
	},
}));

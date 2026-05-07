// ----------------------------------------------------------------------------
// RSS / Atom XML parser — uses DOMParser, no external deps
// ----------------------------------------------------------------------------

export interface ParsedFeed {
	readonly title: string;
	readonly description: string;
	readonly link: string;
	readonly items: ParsedItem[];
}

export interface ParsedItem {
	readonly title: string;
	readonly link: string;
	readonly description: string;
	readonly pubDate: number;
	readonly thumbnail: string | null;
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function text(el: Element, tag: string): string {
	const node = el.getElementsByTagName(tag)[0];
	return node?.textContent?.trim() ?? "";
}

function attr(el: Element, tag: string, attribute: string): string {
	const node = el.getElementsByTagName(tag)[0];
	return node?.getAttribute(attribute) ?? "";
}

function parseDateSafe(raw: string): number {
	if (!raw) return 0;
	const ms = Date.parse(raw);
	return Number.isNaN(ms) ? 0 : ms;
}

function extractThumbnail(el: Element): string | null {
	// media:content or media:thumbnail
	const mediaTags = ["media:content", "media:thumbnail"];
	for (const tag of mediaTags) {
		const node = el.getElementsByTagName(tag)[0];
		const url = node?.getAttribute("url");
		if (url) return url;
	}

	// enclosure with image type
	const enclosure = el.getElementsByTagName("enclosure")[0];
	if (enclosure) {
		const type = enclosure.getAttribute("type") ?? "";
		if (type.startsWith("image/")) {
			return enclosure.getAttribute("url");
		}
	}

	// Try to extract first image from description/content HTML
	const content =
		text(el, "content:encoded") ||
		text(el, "content") ||
		text(el, "description");
	const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
	if (imgMatch?.[1]) return imgMatch[1];

	return null;
}

// ----------------------------------------------------------------------------
// RSS 2.0 parser
// ----------------------------------------------------------------------------

function parseRss2(doc: Document): ParsedFeed {
	const channel = doc.getElementsByTagName("channel")[0];
	if (!channel) {
		return { title: "", description: "", link: "", items: [] };
	}

	const items: ParsedItem[] = [];
	const itemEls = doc.getElementsByTagName("item");

	for (let i = 0; i < itemEls.length; i++) {
		const el = itemEls.item(i);
		if (!el) continue;
		items.push({
			title: text(el, "title"),
			link: text(el, "link"),
			description: stripHtml(
				text(el, "content:encoded") || text(el, "description"),
			),
			pubDate: parseDateSafe(text(el, "pubDate")),
			thumbnail: extractThumbnail(el),
		});
	}

	return {
		title: text(channel, "title"),
		description: text(channel, "description"),
		link: text(channel, "link"),
		items,
	};
}

// ----------------------------------------------------------------------------
// Atom parser
// ----------------------------------------------------------------------------

function parseAtom(doc: Document): ParsedFeed {
	const feed = doc.getElementsByTagName("feed")[0];
	if (!feed) {
		return { title: "", description: "", link: "", items: [] };
	}

	const items: ParsedItem[] = [];
	const entries = doc.getElementsByTagName("entry");

	for (let i = 0; i < entries.length; i++) {
		const el = entries.item(i);
		if (!el) continue;
		const linkEl = el.getElementsByTagName("link")[0];
		const link =
			linkEl?.getAttribute("href") ?? text(el, "link");

		items.push({
			title: text(el, "title"),
			link,
			description: stripHtml(
				text(el, "content") || text(el, "summary"),
			),
			pubDate: parseDateSafe(
				text(el, "published") || text(el, "updated"),
			),
			thumbnail: extractThumbnail(el),
		});
	}

	const feedLink = feed.getElementsByTagName("link")[0];

	return {
		title: text(feed, "title"),
		description: text(feed, "subtitle"),
		link: feedLink?.getAttribute("href") ?? "",
		items,
	};
}

// ----------------------------------------------------------------------------
// HTML sanitization
// ----------------------------------------------------------------------------

/** Strip HTML to plain text (for previews) */
function stripHtml(html: string): string {
	if (!html) return "";
	if (typeof document !== "undefined") {
		const textOnly = html
			.replace(/<script[\s\S]*?<\/script>/gi, " ")
			.replace(/<style[\s\S]*?<\/style>/gi, " ")
			.replace(/<[^>]+>/g, " ");
		const decoder = document.createElement("textarea");
		decoder.innerHTML = textOnly;
		return decoder.value.replace(/\s+/g, " ").trim();
	}
	// Fallback for SSR (shouldn't happen but safety)
	return html.replace(/<[^>]*>/g, "").trim();
}

/** Sanitize HTML for safe rendering — strip scripts, iframes, on* attrs */
export function sanitizeHtml(html: string): string {
	if (!html) return "";
	if (typeof document === "undefined") return html;

	const tmp = document.createElement("div");
	const inertHtml = html
		.replace(
			/<(script|style|iframe|object|embed|form|textarea|select|button)\b[\s\S]*?<\/\1>/gi,
			"",
		)
		.replace(/<(img|picture|source|video|audio|input)\b[^>]*>/gi, "");
	tmp.innerHTML = inertHtml;

	// Remove dangerous elements
	const dangerous = tmp.querySelectorAll(
		"script, iframe, object, embed, form, input, textarea, select, button, style, img, picture, source, video, audio",
	);
	for (const el of dangerous) {
		el.remove();
	}

	// Remove event handler attributes from all elements
	const allEls = tmp.querySelectorAll("*");
	for (const el of allEls) {
		const attrs = [...el.attributes];
		for (const a of attrs) {
			if (
				a.name.startsWith("on") ||
				a.name === "srcdoc" ||
				(a.name === "href" && a.value.trimStart().startsWith("javascript:"))
			) {
				el.removeAttribute(a.name);
			}
		}
	}

	return tmp.innerHTML;
}

// ----------------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------------

export function parseRssFeed(xml: string): ParsedFeed {
	const parser = new DOMParser();
	const doc = parser.parseFromString(xml, "application/xml");

	// Check for parse errors
	const parseError = doc.getElementsByTagName("parsererror")[0];
	if (parseError) {
		throw new Error("Invalid XML: failed to parse feed");
	}

	// Detect format
	const rootTag = doc.documentElement.tagName.toLowerCase();

	if (rootTag === "feed") {
		return parseAtom(doc);
	}

	// RSS 2.0 or RSS 1.0
	return parseRss2(doc);
}

import type { ProcessWindow } from "@/src/types/window";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface DeepLinkWindow {
	readonly appId: string;
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
}

export interface DecodedState {
	readonly type: "windows" | "layout";
	readonly windows?: readonly DeepLinkWindow[];
	readonly layoutId?: string;
}

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const MAX_URL_LENGTH = 2000;
const BASE_URL = "https://place.org/";

// ----------------------------------------------------------------------------
// Encode window state → base64 query string URL
// ----------------------------------------------------------------------------

export function encodeWindows(
	windows: ReadonlyMap<string, ProcessWindow>,
): string {
	const minimal: DeepLinkWindow[] = [];
	for (const w of windows.values()) {
		minimal.push({
			appId: w.appId,
			x: Math.round(w.position.x),
			y: Math.round(w.position.y),
			width: Math.round(w.position.width),
			height: Math.round(w.position.height),
		});
	}

	const json = JSON.stringify(minimal);
	const encoded = btoa(json);
	const url = `${BASE_URL}?ws=${encoded}`;

	if (url.length <= MAX_URL_LENGTH) return url;

	// Truncate by dropping windows from the end until it fits
	return truncateToFit(minimal);
}

function truncateToFit(windows: readonly DeepLinkWindow[]): string {
	const items = [...windows];
	while (items.length > 0) {
		const json = JSON.stringify(items);
		const encoded = btoa(json);
		const url = `${BASE_URL}?ws=${encoded}`;
		if (url.length <= MAX_URL_LENGTH) return url;
		items.pop();
	}
	return BASE_URL;
}

// ----------------------------------------------------------------------------
// Encode a named layout reference
// ----------------------------------------------------------------------------

export function encodeLayout(layoutId: string): string {
	return `${BASE_URL}?layout=${encodeURIComponent(layoutId)}`;
}

// ----------------------------------------------------------------------------
// Decode URL → DecodedState
// ----------------------------------------------------------------------------

export function decodeDeepLink(url: string): DecodedState | null {
	try {
		const parsed = new URL(url, BASE_URL);
		const wsParam = parsed.searchParams.get("ws");
		const layoutParam = parsed.searchParams.get("layout");

		if (layoutParam) {
			return { type: "layout", layoutId: layoutParam };
		}

		if (wsParam) {
			return decodeWindowsParam(wsParam);
		}

		return null;
	} catch {
		return null;
	}
}

function decodeWindowsParam(encoded: string): DecodedState | null {
	try {
		const json = atob(encoded);
		const parsed: unknown = JSON.parse(json);
		if (!Array.isArray(parsed)) return null;

		const windows: DeepLinkWindow[] = [];
		for (const item of parsed) {
			if (!isValidWindowEntry(item)) continue;
			windows.push({
				appId: item.appId,
				x: item.x,
				y: item.y,
				width: item.width,
				height: item.height,
			});
		}

		if (windows.length === 0) return null;
		return { type: "windows", windows };
	} catch {
		return null;
	}
}

// ----------------------------------------------------------------------------
// Validation
// ----------------------------------------------------------------------------

function isValidWindowEntry(
	value: unknown,
): value is DeepLinkWindow {
	if (typeof value !== "object" || value === null) return false;
	const obj = value as Record<string, unknown>;
	return (
		typeof obj.appId === "string" &&
		typeof obj.x === "number" &&
		typeof obj.y === "number" &&
		typeof obj.width === "number" &&
		typeof obj.height === "number"
	);
}

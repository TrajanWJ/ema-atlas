'use client';

import { useState, useMemo } from "react";
import { useDesktopStore } from "@/src/stores/desktop-store";
import { useWindowStore } from "@/src/stores/window-store";
import { useInboxStore } from "@/src/stores/inbox-store";
import { fuzzyMatch } from "@/src/lib/fuzzy-search";
import { getAllApps, getAppsByGroup } from "@/src/lib/app-registry";
import type { AppId } from "@/src/types/window";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export type CommandResultType = "app" | "command" | "entry";

export interface CommandResult {
	readonly id: string;
	readonly type: CommandResultType;
	readonly icon: string;
	readonly label: string;
	readonly hint?: string;
	readonly appId?: AppId;
	readonly action?: () => void;
}

// ----------------------------------------------------------------------------
// Static items
// ----------------------------------------------------------------------------

// EMA's canonical 8 + Place Tools folder render first under empty query.
// Score boost in the fuzzy ranker keeps "blueprint" matching Blueprint
// before any Place Tool whose label contains a similar substring.
const EMA_GROUP_BOOST = 50;

function buildAppItems(): readonly CommandResult[] {
	const ema = getAppsByGroup("ema");
	const everyone = getAllApps();
	const seen = new Set<string>();
	const items: CommandResult[] = [];
	for (const app of ema) {
		seen.add(app.id);
		items.push({
			id: `app-${app.id}`,
			type: "app",
			icon: "▸",
			label: app.name,
			hint: "EMA",
			appId: app.id as AppId,
		});
	}
	for (const app of everyone) {
		if (seen.has(app.id)) continue;
		items.push({
			id: `app-${app.id}`,
			type: "app",
			icon: "·",
			label: app.name,
			hint: "Place Tools",
			appId: app.id as AppId,
		});
	}
	return items;
}

function isEmaApp(appId: AppId | undefined, emaIds: ReadonlySet<string>): boolean {
	if (!appId) return false;
	return emaIds.has(appId);
}

// ----------------------------------------------------------------------------
// Hook
// ----------------------------------------------------------------------------

export interface UseCommandPaletteReturn {
	readonly isOpen: boolean;
	readonly query: string;
	readonly results: readonly CommandResult[];
	readonly setQuery: (q: string) => void;
	readonly close: () => void;
	readonly toggle: () => void;
}

export function useCommandPalette(): UseCommandPaletteReturn {
	const isOpen = useDesktopStore((s) => s.commandPaletteOpen);
	const toggle = useDesktopStore((s) => s.toggleCommandPalette);
	const close = useDesktopStore((s) => s.closeCommandPalette);
	const openWindow = useWindowStore((s) => s.openWindow);
	const getWindowsByApp = useWindowStore((s) => s.getWindowsByApp);
	const focusWindow = useWindowStore((s) => s.focusWindow);
	const inboxItems = useInboxStore((s) => s.items);

	const [query, setQuery] = useState("");

	// Build items list including recent brain dump entries
	const allItems = useMemo<readonly CommandResult[]>(() => {
		const openApp = (appId: AppId) => {
			const existing = getWindowsByApp(appId);
			if (existing.length > 0 && existing[0] !== undefined) {
				focusWindow(existing[0].id);
			} else {
				openWindow(appId);
			}
		};

		const staticItems = buildAppItems().map((item) => ({
			...item,
			action: item.appId !== undefined ? () => openApp(item.appId as AppId) : undefined,
		}));

		const entryItems: CommandResult[] = inboxItems.slice(0, 5).map((item) => ({
			id: `entry-${item.id}`,
			type: "entry" as const,
			icon: "🧠",
			label: item.content.length > 60 ? `${item.content.slice(0, 60)}…` : item.content,
			hint: "Brain Dump",
			appId: "brain-dump" as AppId,
			action: () => openApp("brain-dump"),
		}));

		return [...staticItems, ...entryItems];
	}, [inboxItems, openWindow, getWindowsByApp, focusWindow]);

	const results = useMemo<readonly CommandResult[]>(() => {
		const emaIds = new Set(getAppsByGroup("ema").map((app) => app.id));
		if (query.trim() === "") {
			// Empty query → show EMA group first (registry-derived, dock order).
			return allItems.filter((item) => isEmaApp(item.appId, emaIds));
		}

		return allItems
			.map((item) => ({ item, result: fuzzyMatch(query, item.label) }))
			.filter(({ result }) => result.match)
			.sort((a, b) => {
				const aBoost = isEmaApp(a.item.appId, emaIds) ? EMA_GROUP_BOOST : 0;
				const bBoost = isEmaApp(b.item.appId, emaIds) ? EMA_GROUP_BOOST : 0;
				return (b.result.score + bBoost) - (a.result.score + aBoost);
			})
			.map(({ item }) => item);
	}, [query, allItems]);

	return { isOpen, query, results, setQuery, close, toggle };
}

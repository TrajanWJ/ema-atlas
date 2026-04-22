'use client';

import { useState, useMemo } from "react";
import { useDesktopStore } from "@/src/stores/desktop-store";
import { useWindowStore } from "@/src/stores/window-store";
import { useInboxStore } from "@/src/stores/inbox-store";
import { fuzzyMatch } from "@/src/lib/fuzzy-search";
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

const APP_ITEMS: readonly CommandResult[] = [
	{ id: "app-brain-dump",  type: "app", icon: "🧠", label: "Brain Dump",    hint: "Ctrl+Shift+B", appId: "brain-dump" },
	{ id: "app-journal",     type: "app", icon: "📓", label: "Journal",        hint: "Ctrl+Shift+J", appId: "journal" },
	{ id: "app-focus",       type: "app", icon: "◉",  label: "Focus",          hint: "Ctrl+Shift+F", appId: "focus" },
	{ id: "app-tasks",       type: "app", icon: "✅", label: "Tasks",          hint: "Ctrl+Shift+T", appId: "tasks" },
	{ id: "app-terminal",    type: "app", icon: "▸",  label: "Terminal",       hint: "Ctrl+Shift+X", appId: "terminal" },
] as const;

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

		const staticItems = APP_ITEMS.map((item) => ({
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
		if (query.trim() === "") {
			return APP_ITEMS.map((item) => ({
				...item,
				action: item.appId !== undefined
					? () => {
						const appId = item.appId as AppId;
						const existing = getWindowsByApp(appId);
						if (existing.length > 0 && existing[0] !== undefined) {
							focusWindow(existing[0].id);
						} else {
							openWindow(appId);
						}
					}
					: undefined,
			}));
		}

		return allItems
			.map((item) => ({ item, result: fuzzyMatch(query, item.label) }))
			.filter(({ result }) => result.match)
			.sort((a, b) => b.result.score - a.result.score)
			.map(({ item }) => item);
	}, [query, allItems, openWindow, getWindowsByApp, focusWindow]);

	return { isOpen, query, results, setQuery, close, toggle };
}

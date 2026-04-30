import { create } from "zustand";
import { getSetting, setSetting } from "@/src/db/queries/settings";
import { getDbClient } from "@/src/db/client";
import { createId } from "@/src/lib/id";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export type DesktopIconAction =
	| { readonly type: "app"; readonly appId: string }
	| { readonly type: "url"; readonly url: string };

export interface DesktopIconData {
	readonly id: string;
	readonly label: string;
	readonly icon: string;
	readonly action: DesktopIconAction;
	readonly x: number;
	readonly y: number;
}

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

export const GRID_SIZE = 90;

const SETTINGS_KEY = "desktop_icon_positions";

const DEFAULT_ICONS: readonly DesktopIconData[] = [
	{
		id: "icon-brain-dump",
		label: "Brain Dump",
		icon: "🧠",
		action: { type: "app", appId: "brain-dump" },
		x: GRID_SIZE * 0,
		y: GRID_SIZE * 0,
	},
	{
		id: "icon-journal",
		label: "Journal",
		icon: "📔",
		action: { type: "app", appId: "journal" },
		x: GRID_SIZE * 0,
		y: GRID_SIZE * 1,
	},
	{
		id: "icon-focus",
		label: "Focus Timer",
		icon: "🎯",
		action: { type: "app", appId: "focus" },
		x: GRID_SIZE * 0,
		y: GRID_SIZE * 2,
	},
	{
		id: "icon-portfolio",
		label: "Portfolio",
		icon: "🌐",
		action: { type: "url", url: "/portfolio" },
		x: GRID_SIZE * 0,
		y: GRID_SIZE * 3,
	},
	{
		id: "icon-about",
		label: "About",
		icon: "👤",
		action: { type: "url", url: "/about" },
		x: GRID_SIZE * 0,
		y: GRID_SIZE * 4,
	},
] as const;

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

export function snapToGrid(value: number): number {
	return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

type SavedPositions = Record<string, { x: number; y: number }>;

function applyStoredPositions(
	icons: readonly DesktopIconData[],
	stored: SavedPositions,
): readonly DesktopIconData[] {
	return icons.map((icon) => {
		const pos = stored[icon.id];
		if (pos === undefined) return icon;
		return { ...icon, x: pos.x, y: pos.y };
	});
}

// ----------------------------------------------------------------------------
// State shape
// ----------------------------------------------------------------------------

interface DesktopIconsState {
	readonly icons: readonly DesktopIconData[];
	readonly selectedId: string | null;
}

interface DesktopIconsActions {
	loadPositions(): Promise<void>;
	moveIcon(id: string, x: number, y: number): void;
	selectIcon(id: string | null): void;
	addIcon(icon: Omit<DesktopIconData, "id">): void;
	removeIcon(id: string): void;
}

type DesktopIconsStore = DesktopIconsState & DesktopIconsActions;

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useDesktopIconsStore = create<DesktopIconsStore>((set, get) => ({
	icons: DEFAULT_ICONS as readonly DesktopIconData[],
	selectedId: null,

	async loadPositions() {
		try {
			const db = getDbClient();
			const raw = await getSetting(db, SETTINGS_KEY);
			if (raw === null) return;
			const stored = JSON.parse(raw) as SavedPositions;
			set((s) => ({ icons: applyStoredPositions(s.icons, stored) }));
		} catch {
			// Non-fatal: continue with defaults
		}
	},

	moveIcon(id, x, y) {
		const snapped = { x: snapToGrid(x), y: snapToGrid(y) };
		set((s) => ({
			icons: s.icons.map((icon) =>
				icon.id === id ? { ...icon, ...snapped } : icon,
			),
		}));

		// Persist asynchronously — fire and forget
		void (async () => {
			try {
				const db = getDbClient();
				const positions: SavedPositions = {};
				for (const icon of get().icons) {
					positions[icon.id] = { x: icon.x, y: icon.y };
				}
				await setSetting(db, SETTINGS_KEY, JSON.stringify(positions));
			} catch {
				// Non-fatal
			}
		})();
	},

	selectIcon(id) {
		set({ selectedId: id });
	},

	addIcon(iconData) {
		const icon: DesktopIconData = { ...iconData, id: createId() };
		set((s) => ({ icons: [...s.icons, icon] }));
	},

	removeIcon(id) {
		set((s) => ({
			icons: s.icons.filter((icon) => icon.id !== id),
			selectedId: s.selectedId === id ? null : s.selectedId,
		}));
	},
}));

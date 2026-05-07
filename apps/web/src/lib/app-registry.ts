import type { ReactNode } from "react";
import type { AppId } from "@/src/types/window";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

/**
 * Logical grouping for the dock + Launchpad. EMA's canonical vApps render
 * primary; place.org's 32 personal-productivity vApps live under "place-tools"
 * and surface via the Place Tools folder icon at the end of the dock.
 */
export type AppGroup = "ema" | "place-tools";

export interface SearchResult {
	readonly id: string;
	readonly appId: string;
	readonly title: string;
	readonly subtitle?: string;
}

export interface AppTrigger {
	readonly eventType: string;
	readonly label: string;
	readonly schema: Record<string, string>;
	/** Override the appId used in eventBus patterns when it differs from the app's id */
	readonly busAppId?: string;
}

export interface AppAction {
	readonly actionId: string;
	readonly label: string;
	readonly schema: Record<string, string>;
	execute(input: Record<string, unknown>): void;
}

export interface FileEntry {
	readonly id: string;
	readonly name: string;
	readonly type: string;
	readonly preview: string;
	readonly createdAt: number;
	readonly updatedAt: number;
}

export interface FileContent {
	readonly entry: FileEntry;
	readonly body: string;
}

export interface AppStatus {
	readonly label: string;
	readonly state: "active" | "idle";
	readonly since: number;
	readonly detail?: string;
}

export interface MenuItem {
	readonly label: string;
	readonly action: () => void;
	readonly shortcut?: string;
	readonly separator?: boolean;
}

export interface AppMenu {
	readonly label: string;
	readonly items: readonly MenuItem[];
}

export interface MenuBar {
	readonly menus: readonly AppMenu[];
}

export interface QuickAction {
	readonly label: string;
	readonly icon?: string;
	readonly action: () => void;
}

export interface PlaceApp {
	readonly id: string;
	readonly name: string;
	readonly icon: ReactNode;
	readonly defaultSize: { readonly width: number; readonly height: number };
	readonly titlebarDotColor: string;
	/** EMA grouping — determines dock + Launchpad placement */
	readonly group?: AppGroup;
	/** Position in the dock when group === "ema" (lower = leftmost) */
	readonly dockOrder?: number;
	readonly menuBar?: MenuBar;
	readonly quickActions?: readonly QuickAction[];
	search?(query: string): SearchResult[];
	renderPreview?(item: SearchResult): ReactNode;
	triggers?: readonly AppTrigger[];
	actions?: readonly AppAction[];
	listFiles?(): FileEntry[];
	getFile?(id: string): FileContent | undefined;
	getCurrentStatus?(): AppStatus | null;
	renderSettings?(): ReactNode;
}

// ----------------------------------------------------------------------------
// Registry store
// ----------------------------------------------------------------------------

const registry = new Map<string, PlaceApp>();

export function registerApp(app: PlaceApp): void {
	registry.set(app.id, app);
}

export function getApp(id: string): PlaceApp | undefined {
	return registry.get(id);
}

export function getAllApps(): PlaceApp[] {
	return Array.from(registry.values());
}

/**
 * Return all apps in a logical group, sorted by dockOrder (or name fallback).
 * Used by Dock to render EMA's 8 canonical and by the Place Tools folder
 * vApp to render the 32 personal-productivity apps.
 */
export function getAppsByGroup(group: AppGroup): readonly PlaceApp[] {
	return getAllApps()
		.filter((app) => app.group === group)
		.sort((a, b) => {
			const ao = a.dockOrder ?? Number.MAX_SAFE_INTEGER;
			const bo = b.dockOrder ?? Number.MAX_SAFE_INTEGER;
			if (ao !== bo) return ao - bo;
			return a.name.localeCompare(b.name);
		});
}

/**
 * Returns the AppIds of EMA's canonical vApps (used to bias command-palette
 * scoring so "blueprint" returns Blueprint before any Place Tool with "blu").
 */
export function getCanonicalAppIds(): readonly AppId[] {
	return getAppsByGroup("ema").map((app) => app.id as AppId);
}

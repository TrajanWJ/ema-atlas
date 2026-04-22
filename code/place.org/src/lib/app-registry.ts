import type { ReactNode } from "react";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

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

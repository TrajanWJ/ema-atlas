import { create } from "zustand";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export type CanvasElementType =
	| "rectangle"
	| "ellipse"
	| "line"
	| "arrow"
	| "text"
	| "freehand"
	| "sticky"
	| "image"
	| "group";

export interface CanvasPoint {
	readonly x: number;
	readonly y: number;
}

export interface CanvasElement {
	readonly id: string;
	readonly type: CanvasElementType;
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
	readonly rotation: number;
	// Style
	readonly fill: string;
	readonly stroke: string;
	readonly strokeWidth: number;
	readonly opacity: number;
	// Type-specific
	readonly text?: string;
	readonly fontSize?: number;
	readonly fontFamily?: string;
	readonly points?: readonly CanvasPoint[];
	readonly arrowHead?: "none" | "arrow" | "triangle";
	readonly cornerRadius?: number;
	// Grouping
	readonly groupId?: string;
	readonly locked?: boolean;
	// Meta
	readonly zIndex: number;
	readonly createdAt: number;
	readonly updatedAt: number;
}

export type CanvasTool =
	| "select"
	| "rectangle"
	| "ellipse"
	| "line"
	| "arrow"
	| "text"
	| "freehand"
	| "sticky"
	| "eraser"
	| "hand";

export interface Viewport {
	readonly x: number;
	readonly y: number;
	readonly zoom: number;
}

// ----------------------------------------------------------------------------
// State
// ----------------------------------------------------------------------------

interface CanvasState {
	readonly elements: readonly CanvasElement[];
	readonly selectedIds: ReadonlySet<string>;
	readonly tool: CanvasTool;
	readonly viewport: Viewport;
	readonly gridVisible: boolean;
	readonly snapToGrid: boolean;
	readonly gridSize: number;
	readonly fillColor: string;
	readonly strokeColor: string;
	readonly strokeWidth: number;
	readonly fontSize: number;
	// Undo/redo
	readonly history: readonly (readonly CanvasElement[])[];
	readonly historyIndex: number;
}

interface CanvasActions {
	addElement(el: CanvasElement): void;
	updateElement(id: string, changes: Partial<CanvasElement>): void;
	deleteElements(ids: readonly string[]): void;
	moveElements(ids: readonly string[], dx: number, dy: number): void;
	resizeElement(
		id: string,
		x: number,
		y: number,
		w: number,
		h: number,
	): void;
	selectElements(ids: readonly string[]): void;
	clearSelection(): void;
	setTool(tool: CanvasTool): void;
	setViewport(v: Partial<Viewport>): void;
	setFillColor(c: string): void;
	setStrokeColor(c: string): void;
	setStrokeWidth(w: number): void;
	setFontSize(s: number): void;
	setGridVisible(v: boolean): void;
	setSnapToGrid(v: boolean): void;
	undo(): void;
	redo(): void;
	pushHistory(): void;
	groupSelected(): void;
	ungroupSelected(): void;
	bringToFront(ids: readonly string[]): void;
	sendToBack(ids: readonly string[]): void;
	duplicateSelected(): readonly string[];
}

type CanvasStore = CanvasState & CanvasActions;

// ----------------------------------------------------------------------------
// Persistence helpers
// ----------------------------------------------------------------------------

const STORAGE_KEY = "place-canvas-data";
const MAX_HISTORY = 50;

function loadFromStorage(): readonly CanvasElement[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		if (Array.isArray(parsed)) return parsed as CanvasElement[];
	} catch {
		/* ignore */
	}
	return [];
}

function saveToStorage(elements: readonly CanvasElement[]): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(elements));
	} catch {
		/* ignore — quota exceeded etc. */
	}
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function nextZIndex(elements: readonly CanvasElement[]): number {
	if (elements.length === 0) return 1;
	return Math.max(...elements.map((e) => e.zIndex)) + 1;
}

function genId(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

const initialElements = loadFromStorage();

export const useCanvasStore = create<CanvasStore>((set, get) => ({
	elements: initialElements,
	selectedIds: new Set<string>(),
	tool: "select",
	viewport: { x: 0, y: 0, zoom: 1 },
	gridVisible: true,
	snapToGrid: false,
	gridSize: 20,
	fillColor: "#4A90D9",
	strokeColor: "#1a1a2e",
	strokeWidth: 2,
	fontSize: 16,
	history: [initialElements],
	historyIndex: 0,

	addElement(el) {
		set((s) => {
			const next = [...s.elements, el];
			saveToStorage(next);
			return { elements: next };
		});
	},

	updateElement(id, changes) {
		set((s) => {
			const next = s.elements.map((e) =>
				e.id === id ? { ...e, ...changes, updatedAt: Date.now() } : e,
			);
			saveToStorage(next);
			return { elements: next };
		});
	},

	deleteElements(ids) {
		const idSet = new Set(ids);
		set((s) => {
			const next = s.elements.filter((e) => !idSet.has(e.id));
			saveToStorage(next);
			return {
				elements: next,
				selectedIds: new Set<string>(),
			};
		});
	},

	moveElements(ids, dx, dy) {
		const idSet = new Set(ids);
		set((s) => {
			const next = s.elements.map((e) =>
				idSet.has(e.id)
					? { ...e, x: e.x + dx, y: e.y + dy, updatedAt: Date.now() }
					: e,
			);
			saveToStorage(next);
			return { elements: next };
		});
	},

	resizeElement(id, x, y, w, h) {
		set((s) => {
			const next = s.elements.map((e) =>
				e.id === id
					? { ...e, x, y, width: w, height: h, updatedAt: Date.now() }
					: e,
			);
			saveToStorage(next);
			return { elements: next };
		});
	},

	selectElements(ids) {
		set({ selectedIds: new Set(ids) });
	},

	clearSelection() {
		set({ selectedIds: new Set<string>() });
	},

	setTool(tool) {
		set({ tool, selectedIds: new Set<string>() });
	},

	setViewport(v) {
		set((s) => ({ viewport: { ...s.viewport, ...v } }));
	},

	setFillColor(c) {
		set({ fillColor: c });
	},

	setStrokeColor(c) {
		set({ strokeColor: c });
	},

	setStrokeWidth(w) {
		set({ strokeWidth: w });
	},

	setFontSize(s) {
		set({ fontSize: s });
	},

	setGridVisible(v) {
		set({ gridVisible: v });
	},

	setSnapToGrid(v) {
		set({ snapToGrid: v });
	},

	pushHistory() {
		set((s) => {
			const trimmed = s.history.slice(0, s.historyIndex + 1);
			const next = [...trimmed, s.elements];
			const capped =
				next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
			return {
				history: capped,
				historyIndex: capped.length - 1,
			};
		});
	},

	undo() {
		const { historyIndex, history } = get();
		if (historyIndex <= 0) return;
		const newIndex = historyIndex - 1;
		const elements = history[newIndex] ?? [];
		saveToStorage(elements);
		set({ elements, historyIndex: newIndex, selectedIds: new Set<string>() });
	},

	redo() {
		const { historyIndex, history } = get();
		if (historyIndex >= history.length - 1) return;
		const newIndex = historyIndex + 1;
		const elements = history[newIndex] ?? [];
		saveToStorage(elements);
		set({ elements, historyIndex: newIndex, selectedIds: new Set<string>() });
	},

	groupSelected() {
		const { selectedIds, elements } = get();
		if (selectedIds.size < 2) return;
		const groupId = genId();
		set((s) => {
			const next = s.elements.map((e) =>
				selectedIds.has(e.id) ? { ...e, groupId, updatedAt: Date.now() } : e,
			);
			saveToStorage(next);
			return { elements: next };
		});
	},

	ungroupSelected() {
		const { selectedIds } = get();
		set((s) => {
			const next = s.elements.map((e) =>
				selectedIds.has(e.id)
					? { ...e, groupId: undefined, updatedAt: Date.now() }
					: e,
			);
			saveToStorage(next);
			return { elements: next };
		});
	},

	bringToFront(ids) {
		const idSet = new Set(ids);
		set((s) => {
			let maxZ = nextZIndex(s.elements);
			const next = s.elements.map((e) => {
				if (!idSet.has(e.id)) return e;
				return { ...e, zIndex: maxZ++, updatedAt: Date.now() };
			});
			saveToStorage(next);
			return { elements: next };
		});
	},

	sendToBack(ids) {
		const idSet = new Set(ids);
		set((s) => {
			const minZ = Math.min(...s.elements.map((e) => e.zIndex));
			let z = minZ - ids.length;
			const next = s.elements.map((e) => {
				if (!idSet.has(e.id)) return e;
				return { ...e, zIndex: z++, updatedAt: Date.now() };
			});
			saveToStorage(next);
			return { elements: next };
		});
	},

	duplicateSelected() {
		const { selectedIds, elements } = get();
		const newIds: string[] = [];
		const copies: CanvasElement[] = [];
		for (const el of elements) {
			if (!selectedIds.has(el.id)) continue;
			const newId = genId();
			newIds.push(newId);
			copies.push({
				...el,
				id: newId,
				x: el.x + 20,
				y: el.y + 20,
				zIndex: nextZIndex(elements) + copies.length,
				createdAt: Date.now(),
				updatedAt: Date.now(),
				groupId: undefined,
			});
		}
		if (copies.length > 0) {
			set((s) => {
				const next = [...s.elements, ...copies];
				saveToStorage(next);
				return {
					elements: next,
					selectedIds: new Set(newIds),
				};
			});
		}
		return newIds;
	},
}));

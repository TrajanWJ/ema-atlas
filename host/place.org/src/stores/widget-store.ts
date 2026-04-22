import { create } from 'zustand';
import { userKey } from '@/src/lib/user-storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WidgetType = 'clock' | 'tasks-today' | 'habit-streak' | 'weather';

export interface DesktopWidget {
	readonly id: string;
	readonly type: WidgetType;
	readonly x: number;
	readonly y: number;
	readonly visible: boolean;
}

interface WidgetState {
	readonly widgets: readonly DesktopWidget[];
}

interface WidgetActions {
	addWidget(type: WidgetType): void;
	removeWidget(id: string): void;
	moveWidget(id: string, x: number, y: number): void;
	toggleWidget(id: string): void;
}

type WidgetStore = WidgetState & WidgetActions;

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'place-widgets';

function defaultWidgets(): DesktopWidget[] {
	return [
		{ id: 'widget-clock', type: 'clock', x: 1140, y: 40, visible: true },
		{ id: 'widget-tasks', type: 'tasks-today', x: 1100, y: 200, visible: true },
		{ id: 'widget-habits', type: 'habit-streak', x: 1100, y: 380, visible: true },
		{ id: 'widget-weather', type: 'weather', x: 1140, y: 540, visible: true },
	];
}

function loadWidgets(): DesktopWidget[] {
	if (typeof window === 'undefined') return defaultWidgets();
	try {
		const raw = localStorage.getItem(userKey(STORAGE_KEY));
		if (!raw) return defaultWidgets();
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return defaultWidgets();
		return parsed as DesktopWidget[];
	} catch {
		return defaultWidgets();
	}
}

function saveWidgets(widgets: readonly DesktopWidget[]): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem(userKey(STORAGE_KEY), JSON.stringify(widgets));
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

let nextId = 1;

export const useWidgetStore = create<WidgetStore>((set) => ({
	widgets: loadWidgets(),

	addWidget(type) {
		set((state) => {
			const widget: DesktopWidget = {
				id: `widget-${type}-${Date.now()}-${nextId++}`,
				type,
				x: 1100 + Math.random() * 60,
				y: 100 + Math.random() * 200,
				visible: true,
			};
			const next = [...state.widgets, widget];
			saveWidgets(next);
			return { widgets: next };
		});
	},

	removeWidget(id) {
		set((state) => {
			const next = state.widgets.filter((w) => w.id !== id);
			saveWidgets(next);
			return { widgets: next };
		});
	},

	moveWidget(id, x, y) {
		set((state) => {
			const next = state.widgets.map((w) =>
				w.id === id ? { ...w, x, y } : w,
			);
			saveWidgets(next);
			return { widgets: next };
		});
	},

	toggleWidget(id) {
		set((state) => {
			const next = state.widgets.map((w) =>
				w.id === id ? { ...w, visible: !w.visible } : w,
			);
			saveWidgets(next);
			return { widgets: next };
		});
	},
}));

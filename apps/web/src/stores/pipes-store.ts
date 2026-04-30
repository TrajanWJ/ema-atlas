import { create } from "zustand";
import { userKey } from "@/src/lib/user-storage";
import { eventBus } from "@/src/lib/event-bus";
import type { AppEvent } from "@/src/lib/event-bus";
import { createId } from "@/src/lib/id";
import { getAllApps } from "@/src/lib/app-registry";
import type { AppAction } from "@/src/lib/app-registry";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface PipeAction {
	readonly appId: string;
	readonly actionId: string;
}

export interface Pipe {
	readonly id: string;
	readonly name: string;
	readonly triggerId: string; // "appId:eventType"
	readonly actions: readonly PipeAction[];
	readonly active: boolean;
	readonly createdAt: number;
}

interface PipesState {
	readonly pipes: readonly Pipe[];
	readonly subscriptions: ReadonlyMap<string, () => void>;
}

interface PipesActions {
	load(): void;
	addPipe(pipe: Omit<Pipe, "id" | "createdAt">): string;
	removePipe(id: string): void;
	togglePipe(id: string): void;
	updatePipeName(id: string, name: string): void;
	addActionToPipe(pipeId: string, action: PipeAction): void;
	removeActionFromPipe(pipeId: string, idx: number): void;
	activateAll(): void;
	deactivateAll(): void;
}

// ----------------------------------------------------------------------------
// localStorage persistence
// ----------------------------------------------------------------------------

const STORAGE_BASE = "place-pipes";

function loadFromStorage(): readonly Pipe[] {
	try {
		const raw = localStorage.getItem(userKey(STORAGE_BASE));
		if (!raw) return [];
		return JSON.parse(raw) as Pipe[];
	} catch {
		return [];
	}
}

function saveToStorage(pipes: readonly Pipe[]): void {
	try {
		localStorage.setItem(userKey(STORAGE_BASE), JSON.stringify(pipes));
	} catch {
		// storage full — silently ignore
	}
}

// ----------------------------------------------------------------------------
// Execution — find and call the registered AppAction
// ----------------------------------------------------------------------------

function findAction(appId: string, actionId: string): AppAction | undefined {
	const app = getAllApps().find((a) => a.id === appId);
	if (!app?.actions) return undefined;
	return app.actions.find((a) => a.actionId === actionId);
}

function executePipeActions(
	actions: readonly PipeAction[],
	event: AppEvent,
): void {
	for (const pa of actions) {
		const action = findAction(pa.appId, pa.actionId);
		if (action) {
			action.execute(event.payload);
		}
	}
}

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const usePipesStore = create<PipesState & PipesActions>((set, get) => ({
	pipes: [],
	subscriptions: new Map(),

	load() {
		const pipes = loadFromStorage();
		set({ pipes });
		// Activate all pipes that are marked active
		for (const pipe of pipes) {
			if (pipe.active) {
				subscribePipe(pipe, set, get);
			}
		}
	},

	addPipe(partial) {
		const id = createId();
		const pipe: Pipe = {
			...partial,
			id,
			createdAt: Date.now(),
		};
		const next = [...get().pipes, pipe];
		set({ pipes: next });
		saveToStorage(next);
		if (pipe.active) {
			subscribePipe(pipe, set, get);
		}
		return id;
	},

	removePipe(id) {
		unsubscribePipe(id, get);
		const next = get().pipes.filter((p) => p.id !== id);
		set({ pipes: next });
		saveToStorage(next);
	},

	togglePipe(id) {
		const pipe = get().pipes.find((p) => p.id === id);
		if (!pipe) return;
		const updated: Pipe = { ...pipe, active: !pipe.active };
		const next = get().pipes.map((p) => (p.id === id ? updated : p));
		set({ pipes: next });
		saveToStorage(next);

		if (updated.active) {
			subscribePipe(updated, set, get);
		} else {
			unsubscribePipe(id, get);
		}
	},

	updatePipeName(id, name) {
		const next = get().pipes.map((p) =>
			p.id === id ? { ...p, name } : p,
		);
		set({ pipes: next });
		saveToStorage(next);
	},

	addActionToPipe(pipeId, action) {
		const next = get().pipes.map((p) =>
			p.id === pipeId
				? { ...p, actions: [...p.actions, action] }
				: p,
		);
		set({ pipes: next });
		saveToStorage(next);
	},

	removeActionFromPipe(pipeId, idx) {
		const next = get().pipes.map((p) =>
			p.id === pipeId
				? { ...p, actions: p.actions.filter((_, i) => i !== idx) }
				: p,
		);
		set({ pipes: next });
		saveToStorage(next);
	},

	activateAll() {
		const pipes = get().pipes.map((p) => ({ ...p, active: true }));
		set({ pipes });
		saveToStorage(pipes);
		for (const pipe of pipes) {
			subscribePipe(pipe, set, get);
		}
	},

	deactivateAll() {
		for (const pipe of get().pipes) {
			unsubscribePipe(pipe.id, get);
		}
		const pipes = get().pipes.map((p) => ({ ...p, active: false }));
		set({ pipes });
		saveToStorage(pipes);
	},
}));

// ----------------------------------------------------------------------------
// Subscribe / unsubscribe helpers
// ----------------------------------------------------------------------------

type SetFn = (
	partial:
		| Partial<PipesState & PipesActions>
		| ((
				state: PipesState & PipesActions,
		  ) => Partial<PipesState & PipesActions>),
) => void;
type GetFn = () => PipesState & PipesActions;

function subscribePipe(pipe: Pipe, _set: SetFn, get: GetFn): void {
	const existing = get().subscriptions;
	// Don't double-subscribe
	if (existing.has(pipe.id)) return;

	const unsub = eventBus.on(pipe.triggerId, (event) => {
		// Re-read the pipe's actions at execution time
		const current = get().pipes.find((p) => p.id === pipe.id);
		if (current?.active) {
			executePipeActions(current.actions, event);
		}
	});

	const next = new Map(existing);
	next.set(pipe.id, unsub);
	_set({ subscriptions: next });
}

function unsubscribePipe(id: string, get: GetFn): void {
	const existing = get().subscriptions;
	const unsub = existing.get(id);
	if (unsub) {
		unsub();
		const next = new Map(existing);
		next.delete(id);
		usePipesStore.setState({ subscriptions: next });
	}
}

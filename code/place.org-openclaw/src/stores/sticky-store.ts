import { create } from "zustand";
import { createId } from "@/src/lib/id";
import { getDbClient } from "@/src/db/client";
import { getSetting, setSetting } from "@/src/db/queries/settings";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export type StickyColor = "yellow" | "pink" | "blue" | "green" | "purple";

export interface StickyNote {
	readonly id: string;
	readonly content: string;
	readonly color: StickyColor;
	readonly x: number;
	readonly y: number;
	readonly rotation: number;
}

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const COLORS: readonly StickyColor[] = ["yellow", "pink", "blue", "green", "purple"];
const SETTINGS_KEY = "sticky_notes";

function randomColor(): StickyColor {
	return COLORS[Math.floor(Math.random() * COLORS.length)] ?? "yellow";
}

function randomRotation(): number {
	// -3 to 3 degrees
	return (Math.random() - 0.5) * 6;
}

// ----------------------------------------------------------------------------
// Serialisation helpers
// ----------------------------------------------------------------------------

type StickyNoteRecord = {
	id: string;
	content: string;
	color: StickyColor;
	x: number;
	y: number;
	rotation: number;
};

function toRecord(note: StickyNote): StickyNoteRecord {
	return {
		id: note.id,
		content: note.content,
		color: note.color,
		x: note.x,
		y: note.y,
		rotation: note.rotation,
	};
}

// ----------------------------------------------------------------------------
// State shape
// ----------------------------------------------------------------------------

interface StickyState {
	readonly notes: ReadonlyMap<string, StickyNote>;
}

interface StickyActions {
	addNote(x?: number, y?: number): string;
	removeNote(id: string): void;
	updateNote(id: string, content: string): void;
	moveNote(id: string, x: number, y: number): void;
	loadNotes(): Promise<void>;
	persistNotes(): Promise<void>;
}

type StickyStore = StickyState & StickyActions;

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useStickyStore = create<StickyStore>((set, get) => ({
	notes: new Map(),

	addNote(x = 120, y = 120) {
		const id = createId();
		const note: StickyNote = {
			id,
			content: "",
			color: randomColor(),
			x,
			y,
			rotation: randomRotation(),
		};
		const notes = new Map(get().notes);
		notes.set(id, note);
		set({ notes });
		void get().persistNotes();
		return id;
	},

	removeNote(id) {
		const notes = new Map(get().notes);
		notes.delete(id);
		set({ notes });
		void get().persistNotes();
	},

	updateNote(id, content) {
		const existing = get().notes.get(id);
		if (!existing) return;
		const notes = new Map(get().notes);
		notes.set(id, { ...existing, content });
		set({ notes });
		void get().persistNotes();
	},

	moveNote(id, x, y) {
		const existing = get().notes.get(id);
		if (!existing) return;
		const notes = new Map(get().notes);
		notes.set(id, { ...existing, x, y });
		set({ notes });
		void get().persistNotes();
	},

	async loadNotes() {
		try {
			const db = getDbClient();
			const raw = await getSetting(db, SETTINGS_KEY);
			if (!raw) return;
			const records = JSON.parse(raw) as StickyNoteRecord[];
			const notes = new Map<string, StickyNote>();
			for (const r of records) {
				notes.set(r.id, r);
			}
			set({ notes });
		} catch {
			// Ignore parse / db errors — start with empty notes
		}
	},

	async persistNotes() {
		try {
			const db = getDbClient();
			const records = [...get().notes.values()].map(toRecord);
			await setSetting(db, SETTINGS_KEY, JSON.stringify(records));
		} catch {
			// Silently ignore in offline mode
		}
	},
}));

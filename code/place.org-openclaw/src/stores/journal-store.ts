import { create } from "zustand";
import { getDbClient } from "@/src/db/client";
import { getEntry, saveEntry, createEntry } from "@/src/db/queries/journal";
import type { JournalEntry } from "@/src/types/journal";

// ----------------------------------------------------------------------------
// Default journal template
// ----------------------------------------------------------------------------

export const DEFAULT_JOURNAL_TEMPLATE = `## 🎯 Today's Focus
[one thing]

## ⏰ Time Blocks

## 📝 Notes

## 💡 Ideas & Thoughts

## 🙏 Gratitude
1.
2.
3.

## 🌙 Reflection
`;

// ----------------------------------------------------------------------------
// State shape
// ----------------------------------------------------------------------------

interface JournalState {
	readonly currentDate: string;
	readonly currentEntry: JournalEntry | null;
	readonly loading: boolean;
}

interface JournalActions {
	loadEntry(date: string): Promise<void>;
	saveEntry(): Promise<void>;
	setCurrentDate(date: string): Promise<void>;
	updateContent(content: string): void;
	updateEnergy(p: number, m: number, e: number): void;
	updateOneThing(text: string): void;
}

type JournalStore = JournalState & JournalActions;

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function todayDateStr(): string {
	return new Date().toISOString().slice(0, 10);
}

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useJournalStore = create<JournalStore>((set, get) => ({
	currentDate: todayDateStr(),
	currentEntry: null,
	loading: false,

	async loadEntry(date) {
		set({ loading: true });
		try {
			const db = getDbClient();
			let entry = await getEntry(db, date);
			if (!entry) {
				entry = await createEntry(db, date, DEFAULT_JOURNAL_TEMPLATE);
			}
			set({ currentEntry: entry, currentDate: date });
		} finally {
			set({ loading: false });
		}
	},

	async saveEntry() {
		const { currentEntry } = get();
		if (!currentEntry) return;
		try {
			const db = getDbClient();
			const saved = await saveEntry(db, currentEntry);
			set({ currentEntry: saved });
		} catch {
			// Silently ignore in offline mode
		}
	},

	async setCurrentDate(date) {
		await get().loadEntry(date);
	},

	updateContent(content) {
		const { currentEntry } = get();
		if (!currentEntry) return;
		set({ currentEntry: { ...currentEntry, content } });
	},

	updateEnergy(p, m, e) {
		const { currentEntry } = get();
		if (!currentEntry) return;
		set({
			currentEntry: {
				...currentEntry,
				energyP: p,
				energyM: m,
				energyE: e,
			},
		});
	},

	updateOneThing(text) {
		const { currentEntry } = get();
		if (!currentEntry) return;
		set({ currentEntry: { ...currentEntry, oneThing: text } });
	},
}));

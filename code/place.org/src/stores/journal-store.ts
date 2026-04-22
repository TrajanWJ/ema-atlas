import { create } from "zustand";
import { getDbClient } from "@/src/db/client";
import { eventBus } from "@/src/lib/event-bus";
import { getEntry, saveEntry, createEntry } from "@/src/db/queries/journal";
import { todayLocal } from "@/src/lib/date-utils";
import { createId } from "@/src/lib/id";
import type { JournalEntry } from "@/src/types/journal";

// ----------------------------------------------------------------------------
// Default journal template
// ----------------------------------------------------------------------------

export const DEFAULT_JOURNAL_TEMPLATE = `## Today's Focus
[one thing]

## Time Blocks

## Notes

## Ideas & Thoughts

## Gratitude
1.
2.
3.

## Reflection
`;

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function makeLocalEntry(date: string): JournalEntry {
	const now = new Date().toISOString();
	return {
		id: createId(),
		date,
		content: DEFAULT_JOURNAL_TEMPLATE,
		oneThing: null,
		mood: null,
		energyP: null,
		energyM: null,
		energyE: null,
		gratitude: null,
		tags: null,
		createdAt: now,
		updatedAt: now,
	};
}

// ----------------------------------------------------------------------------
// State shape
// ----------------------------------------------------------------------------

interface JournalState {
	readonly currentDate: string;
	readonly currentEntry: JournalEntry | null;
	readonly loading: boolean;
	readonly dirty: boolean;
}

interface JournalActions {
	loadEntry(date: string): Promise<void>;
	saveEntry(): Promise<void>;
	setCurrentDate(date: string): Promise<void>;
	updateContent(content: string): void;
	updateEnergy(p: number, m: number, e: number): void;
	updateOneThing(text: string): void;
	updateGratitude(text: string): void;
	updateMood(value: number): void;
	markDirty(): void;
}

type JournalStore = JournalState & JournalActions;

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useJournalStore = create<JournalStore>((set, get) => ({
	currentDate: todayLocal(),
	currentEntry: null,
	loading: false,
	dirty: false,

	async loadEntry(date) {
		// Flush pending changes before switching
		if (get().dirty && get().currentEntry) {
			// Fire-and-forget save of current entry
			const entryToSave = get().currentEntry;
			if (entryToSave) {
				try {
					const db = getDbClient();
					await saveEntry(db, entryToSave);
				} catch {
					// Best effort
				}
			}
		}

		set({ loading: true, currentDate: date, dirty: false });

		try {
			const db = getDbClient();
			let entry = await getEntry(db, date);
			if (!entry) {
				// Create entry in DB for this date
				entry = await createEntry(db, date, DEFAULT_JOURNAL_TEMPLATE);
			}
			set({ currentEntry: entry });
		} catch {
			// DB failed — create a usable entry anyway
			set({ currentEntry: makeLocalEntry(date) });
		} finally {
			set({ loading: false });
		}
	},

	async saveEntry() {
		const entry = get().currentEntry;
		if (!entry) return;

		// Immediately mark as not dirty
		set({ dirty: false });

		try {
			const db = getDbClient();
			const saved = await saveEntry(db, entry);

			// Only update metadata if user hasn't changed entries in the meantime
			const current = get().currentEntry;
			if (current && current.id === saved.id) {
				set({
					currentEntry: { ...current, updatedAt: saved.updatedAt },
				});
			}

			eventBus.emit({
				appId: "journal",
				eventType: "entry_saved",
				payload: { id: saved.id, date: saved.date },
			});
		} catch {
			// DB save failed — data is in memory, will retry on next save
			// Mark dirty again so next autosave retries
			set({ dirty: true });
		}
	},

	async setCurrentDate(date) {
		await get().loadEntry(date);
	},

	updateContent(content) {
		const { currentEntry } = get();
		if (!currentEntry) return;
		set({ currentEntry: { ...currentEntry, content }, dirty: true });
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
			dirty: true,
		});
	},

	updateOneThing(text) {
		const { currentEntry } = get();
		if (!currentEntry) return;
		set({
			currentEntry: { ...currentEntry, oneThing: text },
			dirty: true,
		});
	},

	updateGratitude(text) {
		const { currentEntry } = get();
		if (!currentEntry) return;
		set({
			currentEntry: { ...currentEntry, gratitude: text },
			dirty: true,
		});
	},

	updateMood(value) {
		const { currentEntry } = get();
		if (!currentEntry) return;
		set({
			currentEntry: { ...currentEntry, mood: value },
			dirty: true,
		});
	},

	markDirty() {
		set({ dirty: true });
	},
}));

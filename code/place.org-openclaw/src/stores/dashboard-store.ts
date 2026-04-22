import { create } from "zustand";
import { getDbClient } from "@/src/db/client";
import { getTodayStats } from "@/src/db/queries/focus";
import { getEntry } from "@/src/db/queries/journal";

// ----------------------------------------------------------------------------
// State shape
// ----------------------------------------------------------------------------

interface DashboardState {
	readonly oneThing: string;
	readonly todayFocusMs: number;
	readonly todayDumpsProcessed: number;
	readonly journalWritten: boolean;
}

interface DashboardActions {
	loadToday(): Promise<void>;
	setOneThing(text: string): void;
}

type DashboardStore = DashboardState & DashboardActions;

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useDashboardStore = create<DashboardStore>((set) => ({
	oneThing: "",
	todayFocusMs: 0,
	todayDumpsProcessed: 0,
	journalWritten: false,

	async loadToday() {
		try {
			const db = getDbClient();
			const today = new Date().toISOString().slice(0, 10);

			const [stats, journalEntry] = await Promise.all([
				getTodayStats(db),
				getEntry(db, today),
			]);

			set({
				todayFocusMs: stats.totalFocusMs,
				journalWritten: journalEntry !== null && journalEntry.content.trim().length > 0,
			});
		} catch {
			// Silently ignore offline
		}
	},

	setOneThing(text) {
		set({ oneThing: text });
	},
}));

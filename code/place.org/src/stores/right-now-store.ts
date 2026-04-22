import { create } from "zustand";
import { getDbClient } from "@/src/db/client";
import { getCurrentState, getRecentStates } from "@/src/db/queries/right-now";
import { setRightNow as setRightNowCmd } from "@/src/commands/right-now";
import { runCommand } from "@/src/commands/types";
import type { RightNowState } from "@/src/types/right-now";

interface RightNowStoreState {
	readonly current: RightNowState | null;
	readonly recent: readonly RightNowState[];
	readonly loading: boolean;
}

interface RightNowStoreActions {
	load(): Promise<void>;
	set(text: string): Promise<void>;
}

type RightNowStore = RightNowStoreState & RightNowStoreActions;

export const useRightNowStore = create<RightNowStore>((set, get) => ({
	current: null,
	recent: [],
	loading: false,

	async load() {
		set({ loading: true });
		try {
			const db = getDbClient();
			const [current, recent] = await Promise.all([
				getCurrentState(db),
				getRecentStates(db, 10),
			]);
			set({ current, recent, loading: false });
		} catch (err) {
			console.error("[right-now-store] load failed:", err);
			set({ loading: false });
		}
	},

	async set(text) {
		const db = getDbClient();
		const next = await runCommand(setRightNowCmd, db, { text });
		if (next) {
			// Reload to get fresh `recent` list
			await get().load();
		}
	},
}));

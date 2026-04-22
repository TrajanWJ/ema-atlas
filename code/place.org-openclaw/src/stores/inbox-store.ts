import { create } from "zustand";
import {
	addInboxItem,
	deleteItem,
	getUnprocessedItems,
	processItem,
} from "@/src/db/queries/inbox";
import { getDbClient } from "@/src/db/client";
import type { InboxItem } from "@/src/types/inbox";

// ----------------------------------------------------------------------------
// State shape
// ----------------------------------------------------------------------------

interface InboxState {
	readonly items: readonly InboxItem[];
	readonly loading: boolean;
}

interface InboxActions {
	load(): Promise<void>;
	add(content: string, source?: "text" | "voice"): Promise<void>;
	process(id: string, action: "task" | "journal" | "archive"): Promise<void>;
	remove(id: string): Promise<void>;
}

type InboxStore = InboxState & InboxActions;

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useInboxStore = create<InboxStore>((set) => ({
	items: [],
	loading: false,

	async load() {
		set({ loading: true });
		try {
			const db = getDbClient();
			const items = await getUnprocessedItems(db);
			set({ items });
		} finally {
			set({ loading: false });
		}
	},

	async add(content, source = "text") {
		const db = getDbClient();
		const item = await addInboxItem(db, content, source);
		set((state) => ({ items: [item, ...state.items] }));
	},

	async process(id, action) {
		const db = getDbClient();
		await processItem(db, id, action);
		set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
	},

	async remove(id) {
		const db = getDbClient();
		await deleteItem(db, id);
		set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
	},
}));

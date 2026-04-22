import { create } from "zustand";
import {
	addInboxItem,
	deleteItem,
	getAllItems,
	processItem,
	setItemAction,
	unprocessItem,
} from "@/src/db/queries/inbox";
import { getDbClient } from "@/src/db/client";
import { eventBus } from "@/src/lib/event-bus";
import { useNotesStore } from "./notes-store";
import { useTaskStore } from "./task-store";
import { useWindowStore } from "./window-store";
import type { InboxItem } from "@/src/types/inbox";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type InboxAction = "task" | "journal" | "archive" | "note" | "idea";

interface InboxState {
	/** Single source of truth — every inbox row */
	readonly allItems: readonly InboxItem[];
	/** Derived from allItems: unprocessed items only (excludes "idea"-tagged) */
	readonly items: readonly InboxItem[];
	readonly loading: boolean;
}

interface InboxActions {
	load(): Promise<void>;
	loadAll(): Promise<void>;
	add(content: string, source?: "text" | "voice", projectId?: string | null): Promise<void>;
	process(id: string, action: InboxAction): Promise<void>;
	markAsIdea(id: string): Promise<void>;
	remove(id: string): Promise<void>;
	convertToNote(id: string): Promise<void>;
	promoteToTask(id: string, projectId?: string | null): Promise<void>;
	moveToProcessing(id: string): Promise<void>;
	unprocess(id: string): Promise<void>;
}

type InboxStore = InboxState & InboxActions;

// ----------------------------------------------------------------------------
// Helper: derive items + set both
// ----------------------------------------------------------------------------

function withDerived(allItems: readonly InboxItem[]) {
	// Unprocessed = needs triage. Items tagged "idea" are kept out of the
	// triage queue because they've already been categorized as parked thoughts.
	return {
		allItems,
		items: allItems.filter((i) => !i.processed && i.action !== "idea"),
	};
}

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useInboxStore = create<InboxStore>((set, get) => ({
	allItems: [],
	items: [],
	loading: false,

	async load() {
		set({ loading: true });
		try {
			const db = getDbClient();
			const allItems = await getAllItems(db);
			set(withDerived(allItems));
		} catch (err) {
			console.error('[inbox] load failed:', err);
		} finally {
			set({ loading: false });
		}
	},

	async loadAll() {
		set({ loading: true });
		try {
			const db = getDbClient();
			const allItems = await getAllItems(db);
			set(withDerived(allItems));
		} catch {
			// DB unavailable — keep whatever items are in state
		} finally {
			set({ loading: false });
		}
	},

	async add(content, source = "text", projectId = null) {
		const now = new Date().toISOString();
		const optimisticItem: InboxItem = {
			id: `temp-${Date.now()}`,
			content,
			source,
			processed: false,
			action: null,
			projectId: projectId ?? null,
			actionTargetId: null,
			createdAt: now,
			processedAt: null,
			updatedAt: now,
		};
		set((s) => withDerived([optimisticItem, ...s.allItems]));
		try {
			const db = getDbClient();
			const item = await addInboxItem(db, content, source, projectId ?? null);
			set((s) => withDerived(
				s.allItems.map((i) => (i.id === optimisticItem.id ? item : i)),
			));
			eventBus.emit({
				appId: "brain-dump",
				eventType: "item_created",
				payload: { id: item.id, content, source, projectId },
			});
		} catch (err) {
			console.error('[inbox] add failed — item exists only in memory:', err);
		}
	},

	async markAsIdea(id) {
		const now = new Date().toISOString();
		set((s) => withDerived(
			s.allItems.map((i) =>
				i.id === id
					? { ...i, action: "idea" as const, updatedAt: now }
					: i,
			),
		));
		eventBus.emit({
			appId: "brain-dump",
			eventType: "item_marked_idea",
			payload: { id },
		});
		try {
			const db = getDbClient();
			await processItem(db, id, "idea");
		} catch {
			// DB may fail
		}
	},

	async process(id, action) {
		const now = new Date().toISOString();
		set((s) => withDerived(
			s.allItems.map((i) =>
				i.id === id
					? { ...i, processed: true, action, processedAt: now, updatedAt: now }
					: i,
			),
		));
		eventBus.emit({
			appId: "brain-dump",
			eventType: "item_processed",
			payload: { id, action },
		});
		try {
			const db = getDbClient();
			await processItem(db, id, action);
		} catch {
			// DB may fail — optimistic update already applied
		}
	},

	async remove(id) {
		set((s) => withDerived(s.allItems.filter((i) => i.id !== id)));
		eventBus.emit({
			appId: "brain-dump",
			eventType: "item_deleted",
			payload: { id },
		});
		try {
			const db = getDbClient();
			await deleteItem(db, id);
		} catch {
			// DB may fail
		}
	},

	async convertToNote(id) {
		const item = get().allItems.find((i) => i.id === id);
		if (!item) return;

		const now = new Date().toISOString();
		set((s) => withDerived(
			s.allItems.map((i) =>
				i.id === id
					? { ...i, processed: true, action: "note" as const, processedAt: now, updatedAt: now }
					: i,
			),
		));

		try {
			const noteId = await useNotesStore.getState().create({
				title: item.content.slice(0, 50),
				content: item.content,
				sourceId: item.id,
				sourceType: "brain-dump",
			});

			const db = getDbClient();
			await processItem(db, id, "note");

			useWindowStore.getState().openWindow("notes");
			useNotesStore.getState().setActive(noteId);

			eventBus.emit({
				appId: "brain-dump",
				eventType: "item_converted_to_note",
				payload: { id, noteId },
			});
		} catch {
			// DB may fail
		}
	},

	async promoteToTask(id, projectIdOverride = null) {
		const item = get().allItems.find((i) => i.id === id);
		if (!item) return;

		const now = new Date().toISOString();
		set((s) => withDerived(
			s.allItems.map((i) =>
				i.id === id
					? { ...i, processed: true, action: "task" as const, processedAt: now, updatedAt: now }
					: i,
			),
		));

		try {
			// Task inherits project from override → item tag → none
			const projectId = projectIdOverride ?? item.projectId ?? null;
			await useTaskStore.getState().add(item.content, "should", null, "backlog", {
				projectId,
				source: "brain_dump",
			});

			const db = getDbClient();
			await processItem(db, id, "task");

			eventBus.emit({
				appId: "brain-dump",
				eventType: "item_promoted_to_task",
				payload: { id, title: item.content, projectId },
			});
		} catch {
			// DB may fail
		}
	},

	async moveToProcessing(id) {
		const now = new Date().toISOString();
		set((s) => withDerived(
			s.allItems.map((i) =>
				i.id === id
					? { ...i, action: "processing" as const, updatedAt: now }
					: i,
			),
		));
		eventBus.emit({
			appId: "brain-dump",
			eventType: "item_moved_to_processing",
			payload: { id },
		});
		try {
			const db = getDbClient();
			await setItemAction(db, id, "processing");
		} catch {
			// DB may fail
		}
	},

	async unprocess(id) {
		const now = new Date().toISOString();
		set((s) => withDerived(
			s.allItems.map((i) =>
				i.id === id
					? { ...i, processed: false, action: null, processedAt: null, updatedAt: now }
					: i,
			),
		));
		eventBus.emit({
			appId: "brain-dump",
			eventType: "item_unprocessed",
			payload: { id },
		});
		try {
			const db = getDbClient();
			await unprocessItem(db, id);
		} catch {
			// DB may fail
		}
	},
}));

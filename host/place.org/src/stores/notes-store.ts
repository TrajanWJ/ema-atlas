import { create } from "zustand";
import {
	createNote,
	getAllNotes,
	updateNote,
	deleteNote,
	archiveNote,
	pinNote,
	searchNotes,
} from "@/src/db/queries/notes";
import { getDbClient } from "@/src/db/client";
import { eventBus } from "@/src/lib/event-bus";
import type { Note } from "@/src/types/note";
import type { FileEntry } from "@/src/lib/app-registry";

// ----------------------------------------------------------------------------
// State shape
// ----------------------------------------------------------------------------

interface NotesState {
	readonly notes: readonly Note[];
	readonly activeNoteId: string | null;
	readonly loading: boolean;
}

interface CreateNoteOpts {
	readonly title?: string;
	readonly content?: string;
	readonly sourceId?: string;
	readonly sourceType?: string;
}

interface NotesActions {
	load(): Promise<void>;
	create(opts?: CreateNoteOpts): Promise<string>;
	update(id: string, changes: { title?: string; content?: string }): Promise<void>;
	remove(id: string): Promise<void>;
	archive(id: string): Promise<void>;
	pin(id: string, pinned: boolean): Promise<void>;
	search(query: string): Promise<void>;
	setActive(id: string | null): void;
	listFiles(): FileEntry[];
}

type NotesStore = NotesState & NotesActions;

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useNotesStore = create<NotesStore>((set, get) => ({
	notes: [],
	activeNoteId: null,
	loading: false,

	async load() {
		set({ loading: true });
		try {
			const db = getDbClient();
			const notes = await getAllNotes(db);
			set({ notes });
		} catch {
			// DB unavailable — keep whatever notes are in state (or empty)
		} finally {
			set({ loading: false });
		}
	},

	async create(opts) {
		const now = new Date().toISOString();
		const optimisticId = crypto.randomUUID();
		const title = opts?.title ?? "Untitled";
		const content = opts?.content ?? "";
		const optimistic: Note = {
			id: optimisticId,
			title,
			content,
			pinned: false,
			archived: false,
			sourceId: opts?.sourceId ?? null,
			sourceType: opts?.sourceType ?? null,
			createdAt: now,
			updatedAt: now,
		};

		// Optimistic: add to state immediately
		set((s) => ({ notes: [optimistic, ...s.notes], activeNoteId: optimisticId }));

		try {
			const db = getDbClient();
			const note = await createNote(db, opts);
			// Replace optimistic note with real one
			set((s) => ({
				notes: s.notes.map((n) => (n.id === optimisticId ? note : n)),
				activeNoteId: s.activeNoteId === optimisticId ? note.id : s.activeNoteId,
			}));
			eventBus.emit({
				appId: "notes",
				eventType: "note_created",
				payload: { id: note.id, title: note.title },
			});
			return note.id;
		} catch {
			// DB failed — keep optimistic note in state
			eventBus.emit({
				appId: "notes",
				eventType: "note_created",
				payload: { id: optimisticId, title },
			});
			return optimisticId;
		}
	},

	async update(id, changes) {
		// Optimistic: update state first
		const now = new Date().toISOString();
		const prev = get().notes.find((n) => n.id === id);
		set((s) => ({
			notes: s.notes.map((n) =>
				n.id === id ? { ...n, ...changes, updatedAt: now } : n,
			),
		}));

		try {
			const db = getDbClient();
			await updateNote(db, id, changes);
		} catch {
			// Rollback on failure
			if (prev) {
				set((s) => ({
					notes: s.notes.map((n) => (n.id === id ? prev : n)),
				}));
			}
		}
		const note = get().notes.find((n) => n.id === id);
		eventBus.emit({
			appId: "notes",
			eventType: "note_updated",
			payload: { id, title: note?.title ?? "" },
		});
	},

	async remove(id) {
		// Optimistic: remove from state first
		const prev = get().notes.find((n) => n.id === id);
		set((s) => ({
			notes: s.notes.filter((n) => n.id !== id),
			activeNoteId: s.activeNoteId === id ? null : s.activeNoteId,
		}));

		try {
			const db = getDbClient();
			await deleteNote(db, id);
		} catch {
			// Rollback on failure
			if (prev) {
				set((s) => ({ notes: [...s.notes, prev] }));
			}
		}
		eventBus.emit({
			appId: "notes",
			eventType: "note_deleted",
			payload: { id },
		});
	},

	async archive(id) {
		// Optimistic: remove from visible list first
		const prev = get().notes.find((n) => n.id === id);
		set((s) => ({
			notes: s.notes.filter((n) => n.id !== id),
			activeNoteId: s.activeNoteId === id ? null : s.activeNoteId,
		}));

		try {
			const db = getDbClient();
			await archiveNote(db, id);
		} catch {
			// Rollback on failure
			if (prev) {
				set((s) => ({ notes: [...s.notes, prev] }));
			}
		}
	},

	async pin(id, pinned) {
		// Optimistic: update pin state first
		const now = new Date().toISOString();
		const prev = get().notes.find((n) => n.id === id);
		set((s) => ({
			notes: s.notes.map((n) =>
				n.id === id ? { ...n, pinned, updatedAt: now } : n,
			),
		}));

		try {
			const db = getDbClient();
			await pinNote(db, id, pinned);
		} catch {
			// Rollback on failure
			if (prev) {
				set((s) => ({
					notes: s.notes.map((n) => (n.id === id ? prev : n)),
				}));
			}
		}
	},

	async search(query) {
		try {
			const db = getDbClient();
			const notes = query.trim() === ""
				? await getAllNotes(db)
				: await searchNotes(db, query);
			set({ notes });
		} catch {
			// DB unavailable — keep current notes in state
		}
	},

	setActive(id) {
		set({ activeNoteId: id });
	},

	listFiles() {
		return get().notes.map((n): FileEntry => ({
			id: n.id,
			name: n.title,
			type: "note",
			preview: n.content.slice(0, 100),
			createdAt: new Date(n.createdAt).getTime(),
			updatedAt: new Date(n.updatedAt).getTime(),
		}));
	},
}));

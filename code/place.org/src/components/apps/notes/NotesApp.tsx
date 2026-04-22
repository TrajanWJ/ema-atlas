'use client';

import { useEffect, useCallback } from "react";
import { useNotesStore } from "@/src/stores/notes-store";
import { NotesSidebar } from "./NotesSidebar";
import { NoteEditor } from "./NoteEditor";

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function NotesApp() {
	const {
		notes,
		activeNoteId,
		loading,
		load,
		create,
		update,
		remove,
		archive,
		pin,
		search,
		setActive,
	} = useNotesStore();

	useEffect(() => {
		void load();
	}, [load]);

	const handleCreate = useCallback(() => {
		void create();
	}, [create]);

	const handleUpdate = useCallback(
		(id: string, changes: { title?: string; content?: string }) => {
			void update(id, changes);
		},
		[update],
	);

	const handleDelete = useCallback(
		(id: string) => {
			void remove(id);
		},
		[remove],
	);

	const handleArchive = useCallback(
		(id: string) => {
			void archive(id);
		},
		[archive],
	);

	const handlePin = useCallback(
		(id: string, pinned: boolean) => {
			void pin(id, pinned);
		},
		[pin],
	);

	const handleSearch = useCallback(
		(query: string) => {
			void search(query);
		},
		[search],
	);

	const activeNote = notes.find((n) => n.id === activeNoteId) ?? null;

	if (loading) {
		return (
			<div
				className="flex h-full items-center justify-center text-sm"
				style={{ color: "var(--place-text-secondary)" }}
			>
				Loading notes...
			</div>
		);
	}

	return (
		<div className="flex h-full">
			<NotesSidebar
				notes={notes}
				activeNoteId={activeNoteId}
				onSelect={setActive}
				onCreate={handleCreate}
				onSearch={handleSearch}
			/>

			{activeNote ? (
				<NoteEditor
					key={activeNote.id}
					note={activeNote}
					onUpdate={handleUpdate}
					onDelete={handleDelete}
					onPin={handlePin}
					onArchive={handleArchive}
				/>
			) : (
				<div
					className="flex flex-1 flex-col items-center justify-center gap-3"
					style={{
						background: "var(--place-base, #08090E)",
						padding: "2rem",
					}}
				>
					<svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="var(--place-text-ghost, rgba(255,255,255,0.15))" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
						<polyline points="14 2 14 8 20 8" />
						<line x1="16" y1="13" x2="8" y2="13" />
						<line x1="16" y1="17" x2="8" y2="17" />
						<polyline points="10 9 9 9 8 9" />
					</svg>
					<span style={{ fontSize: "0.8rem", color: "var(--place-text-muted, rgba(255,255,255,0.25))" }}>
						{notes.length === 0
							? "Select a note or create a new one"
							: "Select a note or create a new one"}
					</span>
					<span style={{ fontSize: "0.6rem", color: "var(--place-text-muted, rgba(255,255,255,0.25))" }}>
						Press Cmd+N to create a note
					</span>
				</div>
			)}
		</div>
	);
}

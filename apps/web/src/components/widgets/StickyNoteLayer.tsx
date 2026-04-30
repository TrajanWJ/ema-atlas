'use client';

import { useEffect } from "react";
import { useStickyStore } from "@/src/stores/sticky-store";
import { StickyNote } from "./StickyNote";

export function StickyNoteLayer() {
	const { notes, loadNotes } = useStickyStore();

	useEffect(() => {
		void loadNotes();
	}, [loadNotes]);

	return (
		<div className="pointer-events-none absolute inset-0" style={{ zIndex: 5 }}>
			{[...notes.values()].map((note) => (
				<div key={note.id} className="pointer-events-auto">
					<StickyNote note={note} />
				</div>
			))}
		</div>
	);
}

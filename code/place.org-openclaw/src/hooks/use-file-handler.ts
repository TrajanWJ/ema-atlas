'use client';

import { useEffect } from 'react';

/**
 * Consumes files opened via the File Handling API (launchQueue).
 * Creates a note for each file and opens the Notes app.
 */
export function useFileHandler(): void {
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (typeof window === 'undefined' || !('launchQueue' in window)) return;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(window as any).launchQueue.setConsumer(async (params: any) => {
			for (const fileHandle of params.files) {
				const file = await fileHandle.getFile();
				const content: string = await file.text();

				const { useNotesStore } = await import(
					'@/src/stores/notes-store'
				);
				const { useWindowStore } = await import(
					'@/src/stores/window-store'
				);

				const noteId = await useNotesStore.getState().create({
					title: (file.name as string).replace(/\.(md|txt)$/, ''),
					content,
				});

				useWindowStore.getState().openWindow('notes');
				useNotesStore.getState().setActive(noteId);
			}
		});
	}, []);
}

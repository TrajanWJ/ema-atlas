'use client';

import { useEffect, useCallback } from "react";
import { useJournalStore } from "@/src/stores/journal-store";
import { useToast } from "@/src/hooks/use-toast";
import { useSendToReceiver } from "@/src/hooks/use-send-to-receiver";
import { todayLocal } from "@/src/lib/date-utils";
import { CalendarStrip } from "./CalendarStrip";
import { JournalEditor } from "./JournalEditor";
import { OneThingInput } from "./OneThingInput";
import type { SendPayload } from "@/src/types/send-to";

export function JournalApp() {
	const currentDate = useJournalStore((s) => s.currentDate);
	const loadEntry = useJournalStore((s) => s.loadEntry);
	const updateContent = useJournalStore((s) => s.updateContent);
	const saveEntry = useJournalStore((s) => s.saveEntry);
	const { success } = useToast();

	const handleNavigate = useCallback(
		(date: string) => {
			loadEntry(date).catch(() => {});
		},
		[loadEntry],
	);

	// Receive payloads -> append to today's journal entry
	const handleReceive = useCallback(
		(payload: SendPayload) => {
			const text =
				typeof payload.data.content === "string"
					? payload.data.content
					: typeof payload.data.title === "string"
						? payload.data.title
						: String(payload.data.content ?? "");
			if (!text) return;

			const store = useJournalStore.getState();
			const today = todayLocal();

			const append = () => {
				const entry = useJournalStore.getState().currentEntry;
				if (!entry) return;
				const timestamp = new Date().toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
				});
				const snippet = `\n\n> [${timestamp}] ${text}`;
				updateContent(entry.content + snippet);
				void saveEntry().then(() => {
					success("Added to Journal");
				});
			};

			if (store.currentDate !== today || !store.currentEntry) {
				void store.loadEntry(today).then(append);
			} else {
				append();
			}
		},
		[updateContent, saveEntry, success],
	);

	useSendToReceiver("journal", handleReceive);

	// Load today's entry on mount
	useEffect(() => {
		const today = todayLocal();
		loadEntry(today).catch(() => {});
	}, [loadEntry]);

	return (
		<div className="flex h-full flex-col">
			<CalendarStrip currentDate={currentDate} onNavigate={handleNavigate} />
			<OneThingInput />
			<JournalEditor />
		</div>
	);
}

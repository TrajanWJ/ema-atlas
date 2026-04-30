'use client';

import { useEffect, useCallback } from "react";
import { useFluxStore } from "@/src/stores/flux-store";
import { useJournalStore } from "@/src/stores/journal-store";
import { todayLocal } from "@/src/lib/date-utils";
import { CalendarStrip } from "@/src/components/apps/journal/CalendarStrip";
import { FluxMetaRow } from "./FluxMetaRow";
import { FluxTimeline } from "./FluxTimeline";

export function FluxApp() {
	const currentDate = useFluxStore((s) => s.currentDate);
	const loadDate = useFluxStore((s) => s.loadDate);
	const subscribe = useFluxStore((s) => s.subscribe);
	const loadJournalEntry = useJournalStore((s) => s.loadEntry);

	const handleNavigate = useCallback(
		(date: string) => {
			void loadDate(date);
			void loadJournalEntry(date);
		},
		[loadDate, loadJournalEntry],
	);

	// Load today on mount, subscribe to events
	useEffect(() => {
		const today = todayLocal();
		void loadDate(today);
		void loadJournalEntry(today);
		const unsubscribe = subscribe();
		return unsubscribe;
	}, [loadDate, loadJournalEntry, subscribe]);

	return (
		<div className="flex h-full flex-col">
			<CalendarStrip currentDate={currentDate} onNavigate={handleNavigate} />
			<FluxMetaRow />
			<FluxTimeline />
		</div>
	);
}

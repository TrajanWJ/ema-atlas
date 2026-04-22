'use client';

import { useEffect } from "react";
import { useJournalStore } from "@/src/stores/journal-store";
import { CalendarStrip } from "./CalendarStrip";
import { JournalEditor } from "./JournalEditor";
import { EnergyTracker } from "./EnergyTracker";

export function JournalApp() {
	const currentDate = useJournalStore((s) => s.currentDate);
	const setCurrentDate = useJournalStore((s) => s.setCurrentDate);
	const loadEntry = useJournalStore((s) => s.loadEntry);

	useEffect(() => {
		const today = new Date().toISOString().slice(0, 10);
		loadEntry(today).catch(() => {});
	}, [loadEntry]);

	return (
		<div className="flex h-full flex-col">
			<CalendarStrip
				currentDate={currentDate}
				onNavigate={(date) => setCurrentDate(date).catch(() => {})}
			/>
			<JournalEditor />
			<EnergyTracker />
		</div>
	);
}

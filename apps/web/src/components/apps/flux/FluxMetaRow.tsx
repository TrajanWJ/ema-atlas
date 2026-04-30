'use client';

import { useJournalStore } from "@/src/stores/journal-store";
import { MoodPicker } from "@/src/components/apps/journal/MoodPicker";
import { OneThingInput } from "@/src/components/apps/journal/OneThingInput";

// ----------------------------------------------------------------------------
// Compact metadata row: OneThing + Mood inline
// Energy is available in the journal app for deeper tracking
// ----------------------------------------------------------------------------

export function FluxMetaRow() {
	const loading = useJournalStore((s) => s.loading);

	if (loading) return null;

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				borderBottom: "1px solid var(--place-border-default)",
			}}
		>
			<OneThingInput />
			<MoodPicker />
		</div>
	);
}

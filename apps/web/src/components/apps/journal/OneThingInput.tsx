'use client';

import { useRef } from "react";
import { useJournalStore } from "@/src/stores/journal-store";
import { todayLocal } from "@/src/lib/date-utils";

const DEBOUNCE_MS = 800;

export function OneThingInput() {
	const oneThing = useJournalStore((s) => s.currentEntry?.oneThing ?? "");
	const currentDate = useJournalStore((s) => s.currentDate);
	const loading = useJournalStore((s) => s.loading);
	const updateOneThing = useJournalStore((s) => s.updateOneThing);
	const save = useJournalStore((s) => s.saveEntry);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const today = todayLocal();
	const isFuture = currentDate > today;
	const isPast = currentDate < today;

	const handleChange = (value: string) => {
		updateOneThing(value);

		if (debounceRef.current !== null) {
			clearTimeout(debounceRef.current);
		}
		debounceRef.current = setTimeout(() => {
			debounceRef.current = null;
			save().catch(() => {});
		}, DEBOUNCE_MS);
	};

	const label = isFuture ? "Priority" : "One Thing";
	const placeholder = isFuture
		? "Plan the #1 priority for this day"
		: isPast
			? "What was the #1 priority?"
			: "What's the #1 priority today?";

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: "0.5rem",
				padding: "0.4rem 0.75rem",
				borderBottom: "1px solid var(--place-border-default)",
			}}
		>
			<span
				style={{
					color: isFuture
						? "var(--place-secondary-400)"
						: "var(--place-tertiary-400)",
					fontSize: "0.65rem",
					textTransform: "uppercase",
					letterSpacing: "0.06em",
					flexShrink: 0,
					fontWeight: 600,
				}}
			>
				{label}
			</span>
			<input
				type="text"
				value={oneThing}
				onChange={(e) => handleChange(e.target.value)}
				disabled={loading}
				placeholder={placeholder}
				aria-label={`${label} for ${currentDate}`}
				style={{
					flex: 1,
					background: "transparent",
					border: "none",
					outline: "none",
					color: "var(--place-text-primary)",
					fontSize: "0.8rem",
					fontFamily: "monospace",
					padding: "0.2rem 0",
					opacity: loading ? 0.5 : 1,
				}}
			/>
		</div>
	);
}

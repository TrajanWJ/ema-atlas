'use client';

import { useJournalStore } from "@/src/stores/journal-store";

const MOODS: { value: number; label: string; color: string }[] = [
	{ value: 1, label: "Rough", color: "var(--place-error)" },
	{ value: 2, label: "Low", color: "var(--place-tertiary-400)" },
	{ value: 3, label: "Okay", color: "var(--place-text-secondary)" },
	{ value: 4, label: "Good", color: "var(--place-secondary-400)" },
	{ value: 5, label: "Great", color: "var(--place-success)" },
];

export function MoodPicker() {
	const mood = useJournalStore((s) => s.currentEntry?.mood ?? null);
	const loading = useJournalStore((s) => s.loading);
	const updateMood = useJournalStore((s) => s.updateMood);
	const save = useJournalStore((s) => s.saveEntry);

	const handleSelect = (value: number) => {
		updateMood(value);
		save().catch(() => {});
	};

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: "0.5rem",
				padding: "0.4rem 0.75rem",
				borderTop: "1px solid var(--place-border-default)",
			}}
		>
			<span
				style={{
					color: "var(--place-text-secondary)",
					fontSize: "0.65rem",
					textTransform: "uppercase",
					letterSpacing: "0.06em",
					flexShrink: 0,
				}}
			>
				Mood
			</span>
			<div style={{ display: "flex", gap: "4px" }}>
				{MOODS.map(({ value, label, color }) => {
					const isSelected = mood === value;
					return (
						<button
							key={value}
							type="button"
							onClick={() => handleSelect(value)}
							disabled={loading}
							aria-label={`Mood: ${label}`}
							aria-pressed={isSelected}
							title={label}
							style={{
								width: "1.6rem",
								height: "1.6rem",
								borderRadius: "50%",
								border: isSelected
									? `2px solid ${color}`
									: "1px solid var(--place-border-default)",
								background: isSelected ? color : "transparent",
								color: isSelected
									? "var(--place-void)"
									: "var(--place-text-secondary)",
								cursor: loading ? "not-allowed" : "pointer",
								fontSize: "0.6rem",
								fontWeight: 700,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								transition: "background 0.15s, border-color 0.15s",
								opacity: loading ? 0.5 : 1,
							}}
						>
							{value}
						</button>
					);
				})}
			</div>
			{mood !== null && (
				<span
					style={{
						fontSize: "0.65rem",
						color: MOODS.find((m) => m.value === mood)?.color ?? "var(--place-text-secondary)",
						letterSpacing: "0.02em",
					}}
				>
					{MOODS.find((m) => m.value === mood)?.label ?? ""}
				</span>
			)}
		</div>
	);
}

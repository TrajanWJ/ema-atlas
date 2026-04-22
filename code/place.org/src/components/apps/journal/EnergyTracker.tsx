'use client';

import { useRef } from "react";
import { useJournalStore } from "@/src/stores/journal-store";

const DEBOUNCE_MS = 400;

interface EnergySliderProps {
	readonly label: string;
	readonly value: number;
	readonly color: string;
	readonly onChange: (v: number) => void;
}

function EnergySlider({ label, value, color, onChange }: EnergySliderProps) {
	return (
		<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
			<span
				style={{
					color: "var(--place-text-secondary)",
					fontSize: "0.65rem",
					width: "4.5rem",
					flexShrink: 0,
					letterSpacing: "0.04em",
					textTransform: "uppercase",
				}}
			>
				{label}
			</span>
			<input
				type="range"
				min={1}
				max={10}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				style={{ flex: 1, accentColor: color, height: "4px" }}
				aria-label={`${label} energy`}
			/>
			<span
				style={{
					color,
					fontSize: "0.7rem",
					width: "1.5rem",
					textAlign: "right",
					fontVariantNumeric: "tabular-nums",
				}}
			>
				{value}
			</span>
		</div>
	);
}

export function EnergyTracker() {
	const energyP = useJournalStore((s) => s.currentEntry?.energyP ?? 5);
	const energyM = useJournalStore((s) => s.currentEntry?.energyM ?? 5);
	const energyE = useJournalStore((s) => s.currentEntry?.energyE ?? 5);
	const updateEnergy = useJournalStore((s) => s.updateEnergy);
	const save = useJournalStore((s) => s.saveEntry);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleChange = (p: number, m: number, e: number) => {
		updateEnergy(p, m, e);

		if (debounceRef.current !== null) {
			clearTimeout(debounceRef.current);
		}
		debounceRef.current = setTimeout(() => {
			debounceRef.current = null;
			save().catch(() => {});
		}, DEBOUNCE_MS);
	};

	return (
		<div
			style={{
				padding: "0.5rem 0.75rem",
				borderTop: "1px solid var(--place-border-default)",
				display: "flex",
				flexDirection: "column",
				gap: "0.4rem",
			}}
		>
			<span
				style={{
					color: "var(--place-text-secondary)",
					fontSize: "0.65rem",
					textTransform: "uppercase",
					letterSpacing: "0.06em",
					marginBottom: "0.1rem",
				}}
			>
				Energy
			</span>
			<EnergySlider
				label="Physical"
				value={energyP}
				color="var(--place-success)"
				onChange={(v) => handleChange(v, energyM, energyE)}
			/>
			<EnergySlider
				label="Mental"
				value={energyM}
				color="var(--place-secondary-400)"
				onChange={(v) => handleChange(energyP, v, energyE)}
			/>
			<EnergySlider
				label="Emotional"
				value={energyE}
				color="var(--place-tertiary-400)"
				onChange={(v) => handleChange(energyP, energyM, v)}
			/>
		</div>
	);
}

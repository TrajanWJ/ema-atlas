'use client';

import type { SoundscapeId } from "@/src/lib/ambient-sounds";

interface Option {
	readonly id: SoundscapeId | "off";
	readonly label: string;
	readonly icon: string;
}

const OPTIONS: readonly Option[] = [
	{ id: "rain",  label: "Rain",   icon: "🌧" },
	{ id: "lofi",  label: "Lo-fi",  icon: "🎵" },
	{ id: "white", label: "White",  icon: "📡" },
	{ id: "brown", label: "Brown",  icon: "🌫" },
	{ id: "ocean", label: "Ocean",  icon: "🌊" },
	{ id: "off",   label: "Off",    icon: "🔇" },
] as const;

interface AmbientSelectorProps {
	readonly active: SoundscapeId | "off";
	readonly onChange: (id: SoundscapeId | "off") => void;
}

export function AmbientSelector({ active, onChange }: AmbientSelectorProps) {
	return (
		<div
			style={{
				display: "flex",
				gap: "0.25rem",
				justifyContent: "center",
				flexWrap: "wrap",
			}}
		>
			{OPTIONS.map((opt) => {
				const isActive = opt.id === active;
				return (
					<button
						key={opt.id}
						type="button"
						title={opt.label}
						onClick={() => onChange(opt.id)}
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: "0.15rem",
							padding: "0.3rem 0.5rem",
							borderRadius: "6px",
							border: isActive
								? "1px solid var(--place-secondary-400)"
								: "1px solid var(--place-border-default)",
							background: isActive
								? "color-mix(in srgb, var(--place-secondary-400) 15%, transparent)"
								: "transparent",
							color: isActive ? "var(--place-secondary-400)" : "var(--place-text-secondary)",
							cursor: "pointer",
							fontSize: "1rem",
							lineHeight: 1,
							transition: "background 0.15s, border-color 0.15s, color 0.15s",
						}}
					>
						<span>{opt.icon}</span>
						<span
							style={{
								fontSize: "0.55rem",
								textTransform: "uppercase",
								letterSpacing: "0.06em",
								fontWeight: isActive ? 600 : 400,
							}}
						>
							{opt.label}
						</span>
					</button>
				);
			})}
		</div>
	);
}

'use client';

import { motion, AnimatePresence } from "motion/react";
import { useFocusStore, SESSION_PRESETS } from "@/src/stores/focus-store";
import type { SessionPreset } from "@/src/stores/focus-store";

const PRESET_KEYS: readonly SessionPreset[] = [
	"focus",
	"short_break",
	"long_break",
	"custom",
];

function PresetButton({
	preset,
	active,
	onSelect,
}: {
	readonly preset: SessionPreset;
	readonly active: boolean;
	readonly onSelect: () => void;
}) {
	const info = SESSION_PRESETS[preset];
	return (
		<button
			type="button"
			onClick={onSelect}
			style={{
				padding: "0.3rem 0.55rem",
				fontSize: "0.6rem",
				fontWeight: active ? 600 : 400,
				border: active ? "1px solid var(--place-secondary-400)" : "1px solid var(--place-border-default)",
				borderRadius: "6px",
				background: active
					? "color-mix(in srgb, var(--place-secondary-400) 12%, transparent)"
					: "transparent",
				color: active ? "var(--place-secondary-400)" : "var(--place-text-secondary)",
				cursor: "pointer",
				letterSpacing: "0.04em",
				textTransform: "uppercase",
				transition: "all 0.2s",
				whiteSpace: "nowrap",
			}}
		>
			{info.label}
		</button>
	);
}

/** Idle state — preset selection, label input, start button */
function IdleControls() {
	const start = useFocusStore((s) => s.start);
	const currentLabel = useFocusStore((s) => s.currentLabel);
	const setCurrentLabel = useFocusStore((s) => s.setCurrentLabel);
	const selectedPreset = useFocusStore((s) => s.selectedPreset);
	const setSelectedPreset = useFocusStore((s) => s.setSelectedPreset);
	const customMinutes = useFocusStore((s) => s.customMinutes);
	const setCustomMinutes = useFocusStore((s) => s.setCustomMinutes);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "0.75rem",
				width: "100%",
			}}
		>
			{/* Label input */}
			<input
				type="text"
				placeholder="What are you working on?"
				value={currentLabel}
				onChange={(e) => setCurrentLabel(e.target.value)}
				style={{
					background: "var(--place-surface-1)",
					border: "1px solid var(--place-border-default)",
					borderRadius: "8px",
					color: "var(--place-text-primary)",
					fontSize: "0.75rem",
					padding: "0.5rem 0.75rem",
					width: "100%",
					maxWidth: "280px",
					outline: "none",
					transition: "border-color 0.2s",
				}}
				onFocus={(e) => {
					e.currentTarget.style.borderColor = "var(--place-border-strong)";
				}}
				onBlur={(e) => {
					e.currentTarget.style.borderColor = "var(--place-border-default)";
				}}
			/>

			{/* Preset selector */}
			<div
				style={{
					display: "flex",
					gap: "0.35rem",
					flexWrap: "wrap",
					justifyContent: "center",
				}}
			>
				{PRESET_KEYS.map((key) => (
					<PresetButton
						key={key}
						preset={key}
						active={selectedPreset === key}
						onSelect={() => setSelectedPreset(key)}
					/>
				))}
			</div>

			{/* Custom minutes */}
			<AnimatePresence>
				{selectedPreset === "custom" && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						style={{
							display: "flex",
							alignItems: "center",
							gap: "0.5rem",
						}}
					>
						<input
							type="number"
							min={1}
							max={180}
							value={customMinutes}
							onChange={(e) =>
								setCustomMinutes(Number(e.target.value) || 25)
							}
							style={{
								background: "var(--place-surface-1)",
								border: "1px solid var(--place-border-default)",
								borderRadius: "6px",
								color: "var(--place-text-primary)",
								fontSize: "0.75rem",
								padding: "0.35rem 0.5rem",
								width: "60px",
								textAlign: "center",
								outline: "none",
							}}
						/>
						<span
							style={{
								color: "var(--place-text-secondary)",
								fontSize: "0.7rem",
							}}
						>
							minutes
						</span>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Start button */}
			<motion.button
				type="button"
				onClick={() => start().catch(() => {})}
				whileHover={{ scale: 1.03 }}
				whileTap={{ scale: 0.97 }}
				style={{
					background: "var(--place-secondary-400)",
					border: "none",
					color: "#060610",
					fontWeight: 700,
					fontSize: "0.85rem",
					letterSpacing: "0.08em",
					padding: "0.65rem 2.2rem",
					borderRadius: "8px",
					cursor: "pointer",
					textTransform: "uppercase",
					boxShadow: "0 0 20px rgba(91, 156, 245, 0.2)",
				}}
			>
				Start
			</motion.button>
		</motion.div>
	);
}

/** Running state — pause, next, end buttons + label input */
function RunningControls() {
	const activeBlock = useFocusStore((s) => s.activeBlock);
	const currentLabel = useFocusStore((s) => s.currentLabel);
	const setCurrentLabel = useFocusStore((s) => s.setCurrentLabel);
	const pause = useFocusStore((s) => s.pause);
	const transition = useFocusStore((s) => s.transition);
	const end = useFocusStore((s) => s.end);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "0.6rem",
				width: "100%",
			}}
		>
			<input
				type="text"
				placeholder={`Label this ${activeBlock?.type.replace("_", " ") ?? "block"}...`}
				value={currentLabel}
				onChange={(e) => setCurrentLabel(e.target.value)}
				style={{
					background: "var(--place-surface-1)",
					border: "1px solid var(--place-border-default)",
					borderRadius: "8px",
					color: "var(--place-text-primary)",
					fontSize: "0.75rem",
					padding: "0.4rem 0.75rem",
					width: "100%",
					maxWidth: "280px",
					outline: "none",
				}}
			/>

			<div style={{ display: "flex", gap: "0.5rem" }}>
				{/* Pause */}
				<motion.button
					type="button"
					whileHover={{ scale: 1.03 }}
					whileTap={{ scale: 0.97 }}
					onClick={pause}
					style={{
						background: "color-mix(in srgb, var(--place-tertiary-400) 15%, transparent)",
						border: "1px solid var(--place-tertiary-400)",
						color: "var(--place-tertiary-400)",
						fontWeight: 600,
						fontSize: "0.75rem",
						letterSpacing: "0.06em",
						padding: "0.5rem 0.9rem",
						borderRadius: "8px",
						cursor: "pointer",
						textTransform: "uppercase",
					}}
				>
					Pause
				</motion.button>

				{/* Next */}
				<motion.button
					type="button"
					whileHover={{ scale: 1.03 }}
					whileTap={{ scale: 0.97 }}
					onClick={() => transition().catch(() => {})}
					style={{
						background: "var(--place-secondary-400)",
						border: "none",
						color: "#060610",
						fontWeight: 700,
						fontSize: "0.8rem",
						letterSpacing: "0.08em",
						padding: "0.5rem 1.1rem",
						borderRadius: "8px",
						cursor: "pointer",
						textTransform: "uppercase",
					}}
				>
					Next
				</motion.button>

				{/* End */}
				<motion.button
					type="button"
					whileHover={{ scale: 1.03 }}
					whileTap={{ scale: 0.97 }}
					onClick={() => end().catch(() => {})}
					style={{
						background: "transparent",
						border: "1px solid var(--place-border-default)",
						color: "var(--place-text-secondary)",
						fontSize: "0.75rem",
						padding: "0.5rem 0.9rem",
						borderRadius: "8px",
						cursor: "pointer",
					}}
				>
					End
				</motion.button>
			</div>
		</motion.div>
	);
}

/** Paused state — resume + end buttons */
function PausedControls() {
	const resume = useFocusStore((s) => s.resume);
	const end = useFocusStore((s) => s.end);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "0.6rem",
				width: "100%",
			}}
		>
			<motion.span
				initial={{ opacity: 0 }}
				animate={{ opacity: [0.4, 1, 0.4] }}
				transition={{ repeat: Infinity, duration: 2 }}
				style={{
					fontSize: "0.65rem",
					fontWeight: 500,
					letterSpacing: "0.1em",
					textTransform: "uppercase",
					color: "var(--place-tertiary-400)",
				}}
			>
				Paused
			</motion.span>

			<div style={{ display: "flex", gap: "0.6rem" }}>
				<motion.button
					type="button"
					whileHover={{ scale: 1.03 }}
					whileTap={{ scale: 0.97 }}
					onClick={resume}
					style={{
						background: "var(--place-secondary-400)",
						border: "none",
						color: "#060610",
						fontWeight: 700,
						fontSize: "0.85rem",
						letterSpacing: "0.08em",
						padding: "0.6rem 1.8rem",
						borderRadius: "8px",
						cursor: "pointer",
						textTransform: "uppercase",
						boxShadow: "0 0 20px rgba(91, 156, 245, 0.2)",
					}}
				>
					Resume
				</motion.button>

				<motion.button
					type="button"
					whileHover={{ scale: 1.03 }}
					whileTap={{ scale: 0.97 }}
					onClick={() => end().catch(() => {})}
					style={{
						background: "transparent",
						border: "1px solid var(--place-border-default)",
						color: "var(--place-text-secondary)",
						fontSize: "0.75rem",
						padding: "0.6rem 0.9rem",
						borderRadius: "8px",
						cursor: "pointer",
					}}
				>
					End
				</motion.button>
			</div>
		</motion.div>
	);
}

export function SessionControls() {
	const isRunning = useFocusStore((s) => s.isRunning);
	const isPaused = useFocusStore((s) => s.isPaused);

	if (isPaused) return <PausedControls />;
	if (isRunning) return <RunningControls />;
	return <IdleControls />;
}

'use client';

import { motion } from "motion/react";
import { useFocusStore } from "@/src/stores/focus-store";
import { useTimer } from "@/src/hooks/use-timer";
import { useWindowStore } from "@/src/stores/window-store";

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function formatMmSs(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function truncate(text: string, max: number): string {
	if (text.length <= max) return text;
	return `${text.slice(0, max - 1)}\u2026`;
}

// ----------------------------------------------------------------------------
// Play / Pause icon SVGs
// ----------------------------------------------------------------------------

function PlayIcon() {
	return (
		<svg width={16} height={16} viewBox="0 0 16 16" fill="currentColor">
			<path d="M4 2.5v11l9-5.5L4 2.5z" />
		</svg>
	);
}

function PauseIcon() {
	return (
		<svg width={16} height={16} viewBox="0 0 16 16" fill="currentColor">
			<rect x={3} y={2} width={3.5} height={12} rx={0.75} />
			<rect x={9.5} y={2} width={3.5} height={12} rx={0.75} />
		</svg>
	);
}

// ----------------------------------------------------------------------------
// Idle widget — "Start Focus" button
// ----------------------------------------------------------------------------

function IdleWidget({ onOpenFull }: { readonly onOpenFull: () => void }) {
	const start = useFocusStore((s) => s.start);

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: "0.5rem",
				height: "100%",
			}}
		>
			<motion.button
				type="button"
				whileHover={{ scale: 1.03 }}
				whileTap={{ scale: 0.97 }}
				onClick={() => start().catch(() => {})}
				style={{
					background: "var(--place-primary-400)",
					border: "none",
					color: "#060610",
					fontWeight: 600,
					fontSize: "0.7rem",
					letterSpacing: "0.06em",
					padding: "0.4rem 1rem",
					borderRadius: "6px",
					cursor: "pointer",
					textTransform: "uppercase",
				}}
			>
				Start Focus
			</motion.button>

			<button
				type="button"
				onClick={onOpenFull}
				title="Open Focus app"
				style={{
					background: "transparent",
					border: "none",
					color: "var(--place-text-secondary)",
					cursor: "pointer",
					fontSize: "0.6rem",
					padding: "0.25rem",
					opacity: 0.6,
				}}
			>
				<svg width={14} height={14} viewBox="0 0 16 16" fill="currentColor">
					<path d="M2 2h5v2H4v8h8V9h2v5H2V2zm7 0h5v5h-2V4.4L7.7 8.7 6.3 7.3 10.6 3H9V2h.5z" />
				</svg>
			</button>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Active widget — running or paused
// ----------------------------------------------------------------------------

function ActiveWidget({ onOpenFull }: { readonly onOpenFull: () => void }) {
	const activeBlock = useFocusStore((s) => s.activeBlock);
	const elapsedMs = useFocusStore((s) => s.elapsedMs);
	const currentLabel = useFocusStore((s) => s.currentLabel);
	const isRunning = useFocusStore((s) => s.isRunning);
	const isPaused = useFocusStore((s) => s.isPaused);
	const pause = useFocusStore((s) => s.pause);
	const resume = useFocusStore((s) => s.resume);

	const targetMs = activeBlock?.targetMs ?? 1;
	const progress = Math.min(elapsedMs / targetMs, 1);
	const label = currentLabel || activeBlock?.label || "Focus session";

	function handlePlayPause() {
		if (isRunning) {
			pause();
		} else if (isPaused) {
			resume();
		}
	}

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: "0.5rem",
				height: "100%",
				width: "100%",
			}}
		>
			{/* Play/Pause button */}
			<motion.button
				type="button"
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.9 }}
				onClick={handlePlayPause}
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					width: "28px",
					height: "28px",
					borderRadius: "50%",
					border: "none",
					background: "color-mix(in srgb, var(--place-primary-400) 20%, transparent)",
					color: "var(--place-primary-400)",
					cursor: "pointer",
					flexShrink: 0,
				}}
			>
				{isRunning ? <PauseIcon /> : <PlayIcon />}
			</motion.button>

			{/* Label + time — click to open full app */}
			<button
				type="button"
				onClick={onOpenFull}
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "0.15rem",
					flex: 1,
					minWidth: 0,
					background: "transparent",
					border: "none",
					cursor: "pointer",
					textAlign: "left",
					padding: 0,
				}}
			>
				<span
					style={{
						color: "var(--place-text-secondary)",
						fontSize: "0.55rem",
						letterSpacing: "0.04em",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{truncate(label, 28)}
				</span>
				<span
					style={{
						color: "var(--place-text-primary)",
						fontSize: "0.85rem",
						fontFamily: "monospace",
						fontVariantNumeric: "tabular-nums",
						fontWeight: 600,
					}}
				>
					{formatMmSs(elapsedMs)}
				</span>
			</button>

			{/* Progress bar */}
			<div
				style={{
					width: "60px",
					height: "4px",
					borderRadius: "2px",
					background: "var(--place-border-default)",
					overflow: "hidden",
					flexShrink: 0,
				}}
			>
				<motion.div
					animate={{ width: `${progress * 100}%` }}
					transition={{ duration: 0.5, ease: "linear" }}
					style={{
						height: "100%",
						borderRadius: "2px",
						background: isPaused
							? "var(--place-tertiary-400)"
							: "var(--place-primary-400)",
					}}
				/>
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// TimerWidget — the exported compact widget
// ----------------------------------------------------------------------------

export function TimerWidget() {
	useTimer();

	const isRunning = useFocusStore((s) => s.isRunning);
	const isPaused = useFocusStore((s) => s.isPaused);
	const hasActiveSession = isRunning || isPaused;

	function openFull() {
		useWindowStore.getState().openWindow("focus");
	}

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				padding: "0.4rem 0.6rem",
				maxWidth: "300px",
				height: "48px",
				borderRadius: "8px",
				background: "var(--place-surface-2)",
			}}
		>
			{hasActiveSession ? (
				<ActiveWidget onOpenFull={openFull} />
			) : (
				<IdleWidget onOpenFull={openFull} />
			)}
		</div>
	);
}

'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { userKey } from "@/src/lib/user-storage";
import { motion, AnimatePresence } from "motion/react";
import { useFocusStore } from "@/src/stores/focus-store";
import { useTimer } from "@/src/hooks/use-timer";
import { useWakeLock } from "@/src/hooks/use-wake-lock";
import { useToast } from "@/src/hooks/use-toast";
import { useCapabilitiesStore } from "@/src/stores/capabilities-store";
import { openDocPip } from "@/src/lib/doc-pip";
import { TimerRing } from "./TimerRing";
import { SessionControls } from "./SessionControls";
import { SessionStats } from "./SessionStats";
import { AmbientSelector } from "./AmbientSelector";
import { MiniTimeline } from "./MiniTimeline";
import { TimeBlocksView } from "./TimeBlocksView";
import { HistoryView } from "./HistoryView";
import { FocusNotificationManager } from "./FocusNotificationManager";
import { TimerWidget } from "./TimerWidget";
import type { SoundscapeId, Soundscape } from "@/src/lib/ambient-sounds";

const AMBIENT_PREF_KEY = "focus:ambient";

type AmbientChoice = SoundscapeId | "off";
type FocusTab = "timer" | "blocks" | "history";

const TABS: readonly { id: FocusTab; label: string }[] = [
	{ id: "timer", label: "Timer" },
	{ id: "blocks", label: "Time Blocks" },
	{ id: "history", label: "History" },
];

// ----------------------------------------------------------------------------
// Float icon (window/pip icon)
// ----------------------------------------------------------------------------

function FloatIcon() {
	return (
		<svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
			<rect x={1} y={4} width={10} height={8} rx={1.5} />
			<path d="M5 4V2.5A1.5 1.5 0 0 1 6.5 1H13.5A1.5 1.5 0 0 1 15 2.5V8.5A1.5 1.5 0 0 1 13.5 10H11" />
		</svg>
	);
}

// ----------------------------------------------------------------------------
// Tab bar
// ----------------------------------------------------------------------------

function TabBar({
	active,
	onChange,
	onFloat,
	showFloat,
}: {
	readonly active: FocusTab;
	readonly onChange: (tab: FocusTab) => void;
	readonly onFloat: () => void;
	readonly showFloat: boolean;
}) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				padding: "0.5rem 0.75rem",
				borderBottom: "1px solid var(--place-border-default)",
				flexShrink: 0,
			}}
		>
			<div
				style={{
					display: "flex",
					gap: "2px",
					background: "var(--place-surface-3)",
					borderRadius: "6px",
					padding: "2px",
				}}
			>
				{TABS.map((tab) => {
					const isActive = tab.id === active;
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => onChange(tab.id)}
							style={{
								fontSize: "0.65rem",
								padding: "0.2rem 0.5rem",
								border: "none",
								borderRadius: "4px",
								cursor: "pointer",
								background: isActive
									? "var(--place-secondary-subtle)"
									: "transparent",
								color: isActive
									? "var(--place-secondary-400)"
									: "var(--place-text-tertiary)",
								fontWeight: isActive ? 600 : 400,
								transition: "background 0.15s, color 0.15s",
							}}
						>
							{tab.label}
						</button>
					);
				})}
			</div>
			{showFloat && (
				<button
					type="button"
					onClick={onFloat}
					title="Float timer (Picture-in-Picture)"
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						padding: "0.25rem 0.5rem",
						border: "1px solid var(--place-border-default)",
						borderRadius: "6px",
						background: "transparent",
						color: "var(--place-text-secondary)",
						cursor: "pointer",
						fontSize: "0.65rem",
						transition: "opacity 0.2s",
						flexShrink: 0,
					}}
				>
					<FloatIcon />
				</button>
			)}
		</div>
	);
}

// ----------------------------------------------------------------------------
// Timer tab content
// ----------------------------------------------------------------------------

function TimerTab({
	ambientChoice,
	onAmbientChange,
}: {
	readonly ambientChoice: AmbientChoice;
	readonly onAmbientChange: (id: AmbientChoice) => void;
}) {
	const activeBlock = useFocusStore((s) => s.activeBlock);
	const elapsedMs = useFocusStore((s) => s.elapsedMs);
	const currentLabel = useFocusStore((s) => s.currentLabel);
	const isRunning = useFocusStore((s) => s.isRunning);
	const isPaused = useFocusStore((s) => s.isPaused);

	const showAmbient = isRunning || isPaused;

	return (
		<div
			style={{
				flex: 1,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				padding: "0.75rem 1rem",
				gap: "0.75rem",
				overflowY: "auto",
			}}
		>
			{/* Timer ring area */}
			<div
				style={{
					flex: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					minHeight: "140px",
				}}
			>
				<AnimatePresence mode="wait">
					{activeBlock ? (
						<TimerRing
							key="ring"
							elapsedMs={elapsedMs}
							targetMs={activeBlock.targetMs}
							blockType={activeBlock.type}
							label={currentLabel || activeBlock.label || undefined}
							isPaused={isPaused}
						/>
					) : (
						<motion.div
							key="idle"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							style={{
								color: "var(--place-text-secondary)",
								fontSize: "0.75rem",
								textAlign: "center",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								gap: "0.4rem",
							}}
						>
							<div
								style={{
									width: "48px",
									height: "48px",
									borderRadius: "50%",
									border: "2px solid var(--place-border-default)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontSize: "1.2rem",
									opacity: 0.5,
								}}
							>
								&#9201;
							</div>
							<span>Ready to focus</span>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Controls */}
			<SessionControls />

			{/* Ambient sounds */}
			<AnimatePresence>
				{showAmbient && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
					>
						<AmbientSelector
							active={ambientChoice}
							onChange={onAmbientChange}
						/>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Mini timeline of today's blocks */}
			<MiniTimeline />

			{/* Today stats */}
			<SessionStats />
		</div>
	);
}

// ----------------------------------------------------------------------------
// Document PiP hook
// ----------------------------------------------------------------------------

function useDocPip() {
	const hasDocPip = useCapabilitiesStore((s) => s.docPip);
	const [pipWindow, setPipWindow] = useState<Window | null>(null);
	const [pipContainer, setPipContainer] = useState<HTMLElement | null>(null);

	const openPip = useCallback(async () => {
		const win = await openDocPip({ width: 320, height: 100 });
		if (!win) return false;

		const container = win.document.createElement("div");
		win.document.body.appendChild(container);
		win.document.body.style.margin = "0";
		win.document.body.style.overflow = "hidden";

		setPipWindow(win);
		setPipContainer(container);

		const handleClose = () => {
			setPipWindow(null);
			setPipContainer(null);
		};
		win.addEventListener("pagehide", handleClose);

		return true;
	}, []);

	const closePip = useCallback(() => {
		if (pipWindow && !pipWindow.closed) {
			pipWindow.close();
		}
		setPipWindow(null);
		setPipContainer(null);
	}, [pipWindow]);

	// Clean up on unmount
	useEffect(() => {
		return () => {
			if (pipWindow && !pipWindow.closed) {
				pipWindow.close();
			}
		};
	}, [pipWindow]);

	return { hasDocPip, pipContainer, openPip, closePip };
}

// ----------------------------------------------------------------------------
// Sound engine initializer — ensures the SoundEngine has an AudioContext
// ----------------------------------------------------------------------------

function useSoundEngineInit(): void {
	const didInit = useRef(false);

	useEffect(() => {
		if (didInit.current) return;

		const handler = async () => {
			if (didInit.current) return;
			didInit.current = true;

			try {
				const { resumeAudioContext } = await import(
					"@/src/lib/ambient-sounds"
				);
				await resumeAudioContext();

				const { soundEngine } = await import("@/src/lib/sound-engine");
				const ctx = new AudioContext();
				soundEngine.init(ctx);
			} catch {
				// Audio unavailable — degrade gracefully
			}

			document.removeEventListener("click", handler);
			document.removeEventListener("keydown", handler);
		};

		document.addEventListener("click", handler, { once: true });
		document.addEventListener("keydown", handler, { once: true });

		return () => {
			document.removeEventListener("click", handler);
			document.removeEventListener("keydown", handler);
		};
	}, []);
}

// ----------------------------------------------------------------------------
// Main app
// ----------------------------------------------------------------------------

export function FocusApp() {
	const isRunning = useFocusStore((s) => s.isRunning);
	const isPaused = useFocusStore((s) => s.isPaused);
	const activeBlock = useFocusStore((s) => s.activeBlock);
	const elapsedMs = useFocusStore((s) => s.elapsedMs);
	const loadTodayStats = useFocusStore((s) => s.loadTodayStats);
	const loadTodayBlocks = useFocusStore((s) => s.loadTodayBlocks);

	const { warning } = useToast();
	const overrunFiredRef = useRef(false);

	const [activeTab, setActiveTab] = useState<FocusTab>("timer");
	const [ambientChoice, setAmbientChoice] = useState<AmbientChoice>(() => {
		if (typeof window === "undefined") return "off";
		return (localStorage.getItem(userKey(AMBIENT_PREF_KEY)) as AmbientChoice) ?? "off";
	});

	const { hasDocPip, pipContainer, openPip } = useDocPip();

	const soundRef = useRef<Soundscape | null>(null);

	useTimer();
	useWakeLock();
	useSoundEngineInit();

	useEffect(() => {
		loadTodayStats().catch(() => {});
		loadTodayBlocks().catch(() => {});
	}, [loadTodayStats, loadTodayBlocks]);

	// Fire "Target reached!" toast + sound once when block first hits overrun
	useEffect(() => {
		const isOverrun =
			activeBlock !== null && elapsedMs > activeBlock.targetMs;
		if (isOverrun && !overrunFiredRef.current) {
			overrunFiredRef.current = true;
			warning("Target reached!");
			import("@/src/lib/sound-engine")
				.then(({ soundEngine }) => {
					soundEngine.playNotification();
				})
				.catch(() => {});
		}
		if (!isOverrun) {
			overrunFiredRef.current = false;
		}
	}, [activeBlock, elapsedMs, warning]);

	// Manage ambient soundscape lifecycle
	useEffect(() => {
		async function syncAmbient() {
			if (soundRef.current) {
				soundRef.current.stop();
				soundRef.current = null;
			}

			// Keep ambient playing while paused too
			if ((!isRunning && !isPaused) || ambientChoice === "off") return;

			const { createSoundscape, resumeAudioContext } = await import(
				"@/src/lib/ambient-sounds"
			);

			await resumeAudioContext();
			const sound = createSoundscape(ambientChoice);
			sound.start();
			soundRef.current = sound;
		}

		syncAmbient().catch(() => {});

		return () => {
			if (soundRef.current) {
				soundRef.current.stop();
				soundRef.current = null;
			}
		};
	}, [isRunning, isPaused, ambientChoice]);

	function handleAmbientChange(id: AmbientChoice) {
		setAmbientChoice(id);
		localStorage.setItem(userKey(AMBIENT_PREF_KEY), id);
	}

	async function handleFloat() {
		if (hasDocPip) {
			await openPip();
			return;
		}
		// Fallback: regular popout
		const { getPopoutLauncher } = await import("@/src/lib/popout-launcher");
		const { useWindowStore: ws } = await import("@/src/stores/window-store");
		const state = ws.getState();
		const focusWindows = state.getWindowsByApp("focus");
		const win = focusWindows[0];
		if (win) {
			getPopoutLauncher().detach(win.id, "focus", win.position);
		}
	}

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				background: "transparent",
			}}
		>
			<FocusNotificationManager />
			{pipContainer && createPortal(<TimerWidget />, pipContainer)}
			<TabBar
				active={activeTab}
				onChange={setActiveTab}
				onFloat={handleFloat}
				showFloat={activeTab === "timer"}
			/>

			<AnimatePresence mode="wait">
				{activeTab === "timer" && (
					<motion.div
						key="timer"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						style={{
							flex: 1,
							display: "flex",
							flexDirection: "column",
							overflow: "hidden",
						}}
					>
						<TimerTab
							ambientChoice={ambientChoice}
							onAmbientChange={handleAmbientChange}
						/>
					</motion.div>
				)}
				{activeTab === "blocks" && (
					<motion.div
						key="blocks"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						style={{
							flex: 1,
							position: "relative",
							overflow: "hidden",
						}}
					>
						<TimeBlocksView />
					</motion.div>
				)}
				{activeTab === "history" && (
					<motion.div
						key="history"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						style={{ flex: 1, overflow: "hidden" }}
					>
						<HistoryView />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

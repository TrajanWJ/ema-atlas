import { create } from "zustand";
import { getDbClient } from "@/src/db/client";
import { eventBus } from "@/src/lib/event-bus";
import { fireConfetti } from "@/src/lib/confetti";
import { soundEngine } from "@/src/lib/sound-engine";
import {
	startSession,
	endSession,
	addBlock,
	updateBlock,
	getActiveSession,
	getTodayStats,
	getTodayBlocks,
	createTimeBlock,
} from "@/src/db/queries/focus";
import type {
	FocusSession,
	FocusBlock,
	TodayFocusStats,
	FocusBlockType,
} from "@/src/types/focus";

// ----------------------------------------------------------------------------
// Timer constants
// ----------------------------------------------------------------------------

export const WORK_MS = 25 * 60 * 1000;
export const SHORT_BREAK_MS = 5 * 60 * 1000;
export const LONG_BREAK_MS = 15 * 60 * 1000;

// After every 4th work block, take a long break
const LONG_BREAK_INTERVAL = 4;

export type SessionPreset = "focus" | "short_break" | "long_break" | "custom";

export const SESSION_PRESETS = {
	focus: { label: "Focus", ms: WORK_MS, type: "work" },
	short_break: { label: "Short Break", ms: SHORT_BREAK_MS, type: "short_break" },
	long_break: { label: "Long Break", ms: LONG_BREAK_MS, type: "long_break" },
	custom: { label: "Custom", ms: WORK_MS, type: "work" },
} satisfies Record<string, { label: string; ms: number; type: FocusBlockType }>;

// ----------------------------------------------------------------------------
// Block cycling logic
// ----------------------------------------------------------------------------

function nextBlockType(
	current: FocusBlockType,
	workBlocksCompleted: number,
): { type: FocusBlockType; targetMs: number } {
	if (current !== "work") {
		return { type: "work", targetMs: WORK_MS };
	}
	const nextCount = workBlocksCompleted + 1;
	if (nextCount % LONG_BREAK_INTERVAL === 0) {
		return { type: "long_break", targetMs: LONG_BREAK_MS };
	}
	return { type: "short_break", targetMs: SHORT_BREAK_MS };
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

/** Convert an ISO timestamp to HH:MM format for time_blocks */
function isoToTimeStr(iso: string): string {
	const d = new Date(iso);
	const h = String(d.getHours()).padStart(2, "0");
	const m = String(d.getMinutes()).padStart(2, "0");
	return `${h}:${m}`;
}

/** Create a time_block entry from a completed focus block */
async function bridgeFocusBlockToTimeBlock(
	block: FocusBlock,
	actualMs: number,
): Promise<void> {
	try {
		const db = getDbClient();
		const startDate = new Date(block.startedAt);
		const endDate = new Date(startDate.getTime() + actualMs);
		await createTimeBlock(db, {
			label: block.label ?? (block.type === "work" ? "Focus" : "Break"),
			category: block.type === "work" ? "deep-work" : "break",
			startTime: isoToTimeStr(block.startedAt),
			endTime: isoToTimeStr(endDate.toISOString()),
			date: block.startedAt.slice(0, 10),
		});
	} catch {
		// Silently ignore -- DB may be unavailable
	}
}

// ----------------------------------------------------------------------------
// State shape
// ----------------------------------------------------------------------------

interface FocusState {
	readonly activeSession: FocusSession | null;
	readonly activeBlock: FocusBlock | null;
	readonly elapsedMs: number;
	readonly isRunning: boolean;
	readonly isPaused: boolean;
	readonly todayStats: TodayFocusStats;
	readonly workBlocksCompleted: number;
	readonly blockStartTimestamp: number | null;
	/** Ms accumulated before a pause — added to current diff on resume */
	readonly pausedElapsedMs: number;
	readonly currentLabel: string;
	readonly selectedPreset: SessionPreset;
	readonly customMinutes: number;
	readonly todayBlocks: readonly FocusBlock[];
}

interface FocusActions {
	start(targetMs?: number): Promise<void>;
	pause(): void;
	resume(): void;
	transition(): Promise<void>;
	end(): Promise<void>;
	tick(timestampMs: number): void;
	loadTodayStats(): Promise<void>;
	setCurrentLabel(label: string): void;
	setSelectedPreset(preset: SessionPreset): void;
	setCustomMinutes(minutes: number): void;
	loadTodayBlocks(): Promise<void>;
}

type FocusStore = FocusState & FocusActions;

const emptyStats: TodayFocusStats = {
	totalFocusMs: 0,
	sessionCount: 0,
	blockCount: 0,
	avgBlockMs: 0,
};

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useFocusStore = create<FocusStore>((set, get) => ({
	activeSession: null,
	activeBlock: null,
	elapsedMs: 0,
	isRunning: false,
	isPaused: false,
	todayStats: emptyStats,
	workBlocksCompleted: 0,
	blockStartTimestamp: null,
	pausedElapsedMs: 0,
	currentLabel: "",
	selectedPreset: "focus",
	customMinutes: 25,
	todayBlocks: [],

	setCurrentLabel(label: string) {
		set({ currentLabel: label });
	},

	setSelectedPreset(preset: SessionPreset) {
		set({ selectedPreset: preset });
	},

	setCustomMinutes(minutes: number) {
		set({ customMinutes: minutes });
	},

	async start(targetMs?: number) {
		const { selectedPreset, customMinutes } = get();
		const preset = SESSION_PRESETS[selectedPreset];
		const blockType = selectedPreset === "custom" ? "work" : preset.type;
		const ms = targetMs
			?? (selectedPreset === "custom" ? customMinutes * 60 * 1000 : preset.ms);

		try {
			const db = getDbClient();
			const session = await startSession(db);
			const now = new Date().toISOString();
			const block = await addBlock(db, {
				sessionId: session.id,
				type: blockType,
				targetMs: ms,
				actualMs: null,
				label: get().currentLabel || null,
				tags: null,
				startedAt: now,
				endedAt: null,
			});
			set({
				activeSession: session,
				activeBlock: block,
				elapsedMs: 0,
				isRunning: true,
				isPaused: false,
				blockStartTimestamp: Date.now(),
				pausedElapsedMs: 0,
			});
			eventBus.emit({
				appId: "timer",
				eventType: "session_started",
				payload: { sessionId: session.id, blockType: blockType, targetMs: ms },
			});
		} catch {
			const now = new Date().toISOString();
			const mockSession: FocusSession = {
				id: crypto.randomUUID(),
				startedAt: now,
				endedAt: null,
				status: "active",
				updatedAt: now,
			};
			const mockBlock: FocusBlock = {
				id: crypto.randomUUID(),
				sessionId: mockSession.id,
				type: blockType,
				targetMs: ms,
				actualMs: null,
				label: get().currentLabel || null,
				tags: null,
				startedAt: now,
				endedAt: null,
				updatedAt: now,
			};
			set({
				activeSession: mockSession,
				activeBlock: mockBlock,
				elapsedMs: 0,
				isRunning: true,
				isPaused: false,
				blockStartTimestamp: Date.now(),
				pausedElapsedMs: 0,
			});
		}
	},

	pause() {
		const { isRunning, isPaused, elapsedMs, activeBlock } = get();
		if (!isRunning || isPaused) return;
		set({
			isPaused: true,
			isRunning: false,
			pausedElapsedMs: elapsedMs,
			blockStartTimestamp: null,
		});
		eventBus.emit({
			appId: "timer",
			eventType: "session_paused",
			payload: { blockId: activeBlock?.id ?? "", elapsedMs },
		});
	},

	resume() {
		const { isPaused } = get();
		if (!isPaused) return;
		set({
			isPaused: false,
			isRunning: true,
			blockStartTimestamp: Date.now(),
		});
	},

	async transition() {
		const {
			activeSession,
			activeBlock,
			elapsedMs,
			workBlocksCompleted,
			currentLabel,
		} = get();
		if (!activeSession || !activeBlock) return;

		const now = new Date().toISOString();
		const newWorkCount =
			activeBlock.type === "work" ? workBlocksCompleted + 1 : workBlocksCompleted;

		// Celebrate focus block completion with confetti + sound
		if (activeBlock.type === "work") {
			fireConfetti();
			soundEngine.playNotification();
		}

		try {
			const db = getDbClient();
			await updateBlock(db, activeBlock.id, elapsedMs, now);

			// Bridge completed focus block to time_blocks for day planner
			bridgeFocusBlockToTimeBlock(activeBlock, elapsedMs).catch(() => {});

			const { type: nextType, targetMs: nextTarget } = nextBlockType(
				activeBlock.type,
				newWorkCount,
			);
			const nextBlock = await addBlock(db, {
				sessionId: activeSession.id,
				type: nextType,
				targetMs: nextTarget,
				actualMs: null,
				label: currentLabel || null,
				tags: null,
				startedAt: now,
				endedAt: null,
			});
			set({
				activeBlock: nextBlock,
				elapsedMs: 0,
				blockStartTimestamp: Date.now(),
				pausedElapsedMs: 0,
				workBlocksCompleted: newWorkCount,
			});
			eventBus.emit({
				appId: "timer",
				eventType: "session_completed",
				payload: {
					blockId: activeBlock.id,
					blockType: activeBlock.type,
					elapsedMs,
				},
			});
			get().loadTodayBlocks().catch(() => {});
		} catch {
			const { type: nextType, targetMs: nextTarget } = nextBlockType(
				activeBlock.type,
				newWorkCount,
			);
			const mockBlock: FocusBlock = {
				id: crypto.randomUUID(),
				sessionId: activeSession.id,
				type: nextType,
				targetMs: nextTarget,
				actualMs: null,
				label: currentLabel || null,
				tags: null,
				startedAt: now,
				endedAt: null,
				updatedAt: now,
			};
			set({
				activeBlock: mockBlock,
				elapsedMs: 0,
				blockStartTimestamp: Date.now(),
				pausedElapsedMs: 0,
				workBlocksCompleted: newWorkCount,
			});
		}
	},

	async end() {
		const { activeSession, activeBlock, elapsedMs } = get();
		if (!activeSession) return;

		// Celebrate focus block completion with confetti + sound
		if (activeBlock?.type === "work") {
			fireConfetti();
			soundEngine.playNotification();
		}

		try {
			const db = getDbClient();
			if (activeBlock) {
				const now = new Date().toISOString();
				await updateBlock(db, activeBlock.id, elapsedMs, now);
				// Bridge completed focus block to time_blocks
				bridgeFocusBlockToTimeBlock(activeBlock, elapsedMs).catch(() => {});
			}
			await endSession(db, activeSession.id);
			await get().loadTodayStats();
			await get().loadTodayBlocks();
		} catch {
			// Silently ignore offline
		}

		if (activeBlock) {
			eventBus.emit({
				appId: "timer",
				eventType: "session_completed",
				payload: {
					blockId: activeBlock.id,
					blockType: activeBlock.type,
					elapsedMs,
				},
			});
		}

		set({
			activeSession: null,
			activeBlock: null,
			elapsedMs: 0,
			isRunning: false,
			isPaused: false,
			blockStartTimestamp: null,
			pausedElapsedMs: 0,
			workBlocksCompleted: 0,
			currentLabel: "",
		});
	},

	tick(timestampMs) {
		const { blockStartTimestamp, isRunning, pausedElapsedMs } = get();
		if (!isRunning || blockStartTimestamp === null) return;
		set({ elapsedMs: pausedElapsedMs + (timestampMs - blockStartTimestamp) });
	},

	async loadTodayStats() {
		try {
			const db = getDbClient();
			const stats = await getTodayStats(db);
			set({ todayStats: stats });
		} catch {
			// Silently ignore
		}
	},

	async loadTodayBlocks() {
		try {
			const db = getDbClient();
			const blocks = await getTodayBlocks(db);
			set({ todayBlocks: blocks });
		} catch {
			// Silently ignore
		}
	},
}));

import { create } from "zustand";
import { getDbClient } from "@/src/db/client";
import {
	startSession,
	endSession,
	addBlock,
	updateBlock,
	getActiveSession,
	getTodayStats,
} from "@/src/db/queries/focus";
import type { FocusSession, FocusBlock, TodayFocusStats, FocusBlockType } from "@/src/types/focus";

// ----------------------------------------------------------------------------
// Timer constants
// ----------------------------------------------------------------------------

export const WORK_MS = 25 * 60 * 1000;
export const SHORT_BREAK_MS = 5 * 60 * 1000;
export const LONG_BREAK_MS = 15 * 60 * 1000;

// After every 4th work block, take a long break
const LONG_BREAK_INTERVAL = 4;

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
// State shape
// ----------------------------------------------------------------------------

interface FocusState {
	readonly activeSession: FocusSession | null;
	readonly activeBlock: FocusBlock | null;
	readonly elapsedMs: number;
	readonly isRunning: boolean;
	readonly todayStats: TodayFocusStats;
	readonly workBlocksCompleted: number;
	readonly blockStartTimestamp: number | null;
}

interface FocusActions {
	start(targetMs?: number): Promise<void>;
	transition(): Promise<void>;
	end(): Promise<void>;
	tick(timestampMs: number): void;
	loadTodayStats(): Promise<void>;
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
	todayStats: emptyStats,
	workBlocksCompleted: 0,
	blockStartTimestamp: null,

	async start(targetMs = WORK_MS) {
		try {
			const db = getDbClient();
			const session = await startSession(db);
			const now = new Date().toISOString();
			const block = await addBlock(db, {
				sessionId: session.id,
				type: "work",
				targetMs,
				actualMs: null,
				label: null,
				tags: null,
				startedAt: now,
				endedAt: null,
			});
			set({
				activeSession: session,
				activeBlock: block,
				elapsedMs: 0,
				isRunning: true,
				blockStartTimestamp: Date.now(),
			});
		} catch {
			// Offline mode: set running without persisting
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
				type: "work",
				targetMs,
				actualMs: null,
				label: null,
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
				blockStartTimestamp: Date.now(),
			});
		}
	},

	async transition() {
		const { activeSession, activeBlock, elapsedMs, workBlocksCompleted } = get();
		if (!activeSession || !activeBlock) return;

		const now = new Date().toISOString();
		const newWorkCount =
			activeBlock.type === "work" ? workBlocksCompleted + 1 : workBlocksCompleted;

		try {
			const db = getDbClient();
			await updateBlock(db, activeBlock.id, elapsedMs, now);
			const { type: nextType, targetMs: nextTarget } = nextBlockType(
				activeBlock.type,
				newWorkCount,
			);
			const nextBlock = await addBlock(db, {
				sessionId: activeSession.id,
				type: nextType,
				targetMs: nextTarget,
				actualMs: null,
				label: null,
				tags: null,
				startedAt: now,
				endedAt: null,
			});
			set({
				activeBlock: nextBlock,
				elapsedMs: 0,
				blockStartTimestamp: Date.now(),
				workBlocksCompleted: newWorkCount,
			});
		} catch {
			// Offline fallback
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
				label: null,
				tags: null,
				startedAt: now,
				endedAt: null,
				updatedAt: now,
			};
			set({
				activeBlock: mockBlock,
				elapsedMs: 0,
				blockStartTimestamp: Date.now(),
				workBlocksCompleted: newWorkCount,
			});
		}
	},

	async end() {
		const { activeSession, activeBlock, elapsedMs } = get();
		if (!activeSession) return;

		try {
			const db = getDbClient();
			if (activeBlock) {
				const now = new Date().toISOString();
				await updateBlock(db, activeBlock.id, elapsedMs, now);
			}
			await endSession(db, activeSession.id);
			await get().loadTodayStats();
		} catch {
			// Silently ignore offline
		}

		set({
			activeSession: null,
			activeBlock: null,
			elapsedMs: 0,
			isRunning: false,
			blockStartTimestamp: null,
			workBlocksCompleted: 0,
		});
	},

	tick(timestampMs) {
		const { blockStartTimestamp, isRunning } = get();
		if (!isRunning || blockStartTimestamp === null) return;
		set({ elapsedMs: timestampMs - blockStartTimestamp });
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
}));

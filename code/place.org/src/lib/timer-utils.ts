import { useFocusStore } from "@/src/stores/focus-store";
import type { AppStatus, FileEntry } from "@/src/lib/app-registry";
import type { FocusBlock } from "@/src/types/focus";

// ----------------------------------------------------------------------------
// getCurrentStatus — returns the timer's current AppStatus (or null if idle)
// ----------------------------------------------------------------------------

export function getTimerStatus(): AppStatus | null {
	const state = useFocusStore.getState();
	if (!state.isRunning && !state.isPaused) return null;

	const elapsedMinutes = Math.ceil(state.elapsedMs / 60000);

	return {
		label: state.currentLabel || "Focus session",
		state: state.isPaused ? "idle" : "active",
		since: state.blockStartTimestamp ?? Date.now(),
		detail: `${elapsedMinutes}min elapsed`,
	};
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function formatDuration(ms: number): string {
	const minutes = Math.floor(ms / 60000);
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	const rem = minutes % 60;
	return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
}

function formatDate(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function blockToFileEntry(block: FocusBlock): FileEntry {
	const name = block.label ?? "Focus Session";
	const duration = block.actualMs !== null ? formatDuration(block.actualMs) : "in progress";
	const date = formatDate(block.startedAt);

	return {
		id: block.id,
		name,
		type: "timer_log",
		preview: `${duration} - ${date}`,
		createdAt: new Date(block.startedAt).getTime(),
		updatedAt: new Date(block.updatedAt).getTime(),
	};
}

// ----------------------------------------------------------------------------
// getTimerFiles — returns recent focus blocks as FileEntry[]
// ----------------------------------------------------------------------------

export function getTimerFiles(): FileEntry[] {
	const { todayBlocks } = useFocusStore.getState();
	return todayBlocks
		.filter((b) => b.type === "work")
		.map(blockToFileEntry)
		.reverse();
}

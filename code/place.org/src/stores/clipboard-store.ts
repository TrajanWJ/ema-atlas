import { create } from "zustand";
import { useFileStore } from "@/src/stores/file-store";
import { getCurrentUserId } from "@/src/lib/current-user";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type ClipboardMode = "copy" | "cut";

interface ClipboardEntry {
	readonly fileId: string;
	readonly filename: string;
	readonly sourceFolderId: string;
}

interface ClipboardState {
	readonly entries: readonly ClipboardEntry[];
	readonly mode: ClipboardMode | null;
}

interface ClipboardActions {
	copy(entries: readonly ClipboardEntry[]): void;
	cut(entries: readonly ClipboardEntry[]): void;
	paste(targetFolderId: string): Promise<void>;
	clear(): void;
	hasEntries(): boolean;
}

type ClipboardStore = ClipboardState & ClipboardActions;

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

async function duplicateFile(
	fileId: string,
	filename: string,
	targetFolderId: string,
): Promise<void> {
	const userId = getCurrentUserId();

	// Fetch the original file blob
	const res = await fetch(`/api/files/${fileId}`, {
		headers: { "X-User-Id": userId },
	});

	if (!res.ok) {
		console.error("[clipboard] failed to fetch file for copy:", fileId);
		return;
	}

	const blob = await res.blob();
	const file = new File([blob], filename, { type: blob.type });

	// Re-upload to target folder
	await useFileStore.getState().upload(file, targetFolderId);
}

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useClipboardStore = create<ClipboardStore>((set, get) => ({
	entries: [],
	mode: null,

	copy(entries) {
		set({ entries, mode: "copy" });
	},

	cut(entries) {
		set({ entries, mode: "cut" });
	},

	async paste(targetFolderId) {
		const { entries, mode } = get();
		if (entries.length === 0 || mode === null) return;

		const fileStore = useFileStore.getState();

		if (mode === "copy") {
			for (const entry of entries) {
				await duplicateFile(entry.fileId, entry.filename, targetFolderId);
			}
		} else {
			// mode === "cut"
			for (const entry of entries) {
				await fileStore.moveFile(entry.fileId, targetFolderId);
			}
			set({ entries: [], mode: null });
		}

		// Reload files in the target folder
		await fileStore.loadFiles(targetFolderId);
	},

	clear() {
		set({ entries: [], mode: null });
	},

	hasEntries() {
		return get().entries.length > 0;
	},
}));
